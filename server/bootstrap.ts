import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
import { CATEGORIES, PRODUCTS } from '../src/data/products';
import { POSTS } from '../src/data/posts';
import { getPool, hasDatabaseUrl, withConnection } from './db';

/**
 * Divide um ficheiro SQL em instruções, respeitando strings entre aspas
 * simples, identificadores entre aspas duplas e blocos dollar-quoted.
 * O `sql.split(';')` anterior quebrava quando os modelos de email
 * continham HTML/CSS com ponto e vírgula.
 */
export function splitSqlStatements(source: string): string[] {
  const statements: string[] = [];
  let current = '';
  let quote: "'" | '"' | null = null;
  let dollarTag: string | null = null;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (dollarTag) {
      current += char;
      if (source.startsWith(dollarTag, index)) {
        current += dollarTag.slice(1);
        index += dollarTag.length - 1;
        dollarTag = null;
      }
      continue;
    }
    if (quote) {
      current += char;
      if (char === quote) {
        if (next === quote) { current += next; index += 1; } else { quote = null; }
      }
      continue;
    }
    if (char === '-' && next === '-') {
      const lineEnd = source.indexOf('\n', index);
      const end = lineEnd === -1 ? source.length : lineEnd;
      current += source.slice(index, end);
      index = end - 1;
      continue;
    }
    if (char === "'" || char === '"') { quote = char; current += char; continue; }
    if (char === '$') {
      const match = source.slice(index).match(/^\$[A-Za-z_]*\$/);
      if (match) { dollarTag = match[0]; current += match[0]; index += match[0].length - 1; continue; }
    }
    if (char === ';') {
      if (current.trim()) statements.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) statements.push(current.trim());
  return statements.filter((statement) => statement.replace(/--[^\n]*/g, '').trim().length > 0);
}

async function runMigration(): Promise<void> {
  const connection = await getPool().getConnection();
  try {
    const migrationDir = path.resolve(process.cwd(), 'server/migrations');
    const migrationFiles = (await readdir(migrationDir)).filter((file) => file.endsWith('.sql')).sort();

    // A aplicação pode ter mais do que uma instância durante um deploy. O
    // advisory lock impede que duas instâncias executem a mesma migração ao
    // mesmo tempo, sem bloquear as restantes operações da base de dados.
    await connection.query(`SELECT pg_advisory_lock(hashtext('gameao:migrations'))`);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS gameao_schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const [appliedRows] = await connection.query<{ filename: string }[]>(
      `SELECT filename FROM gameao_schema_migrations`,
    );
    const applied = new Set(appliedRows.map((row) => row.filename));

    // Bases criadas antes do histórico próprio da aplicação já têm o schema
    // operacional completo. Adotamos esse estado uma única vez em vez de
    // reaplicar a importação de catálogo, que pode conter IDs históricos que
    // já foram reutilizados no catálogo atual.
    if (applied.size === 0) {
      const [legacyRows] = await connection.query<{
        catalog_products: string | null;
        app_users: string | null;
        resend_webhook_events: string | null;
      }[]>(`
        SELECT
          to_regclass('public.catalog_products')::text AS catalog_products,
          to_regclass('public.app_users')::text AS app_users,
          to_regclass('public.resend_webhook_events')::text AS resend_webhook_events
      `);
      const legacy = legacyRows[0];
      let productCount = 0;
      if (legacy?.catalog_products) {
        const [countRows] = await connection.query<{ product_count: number }[]>(
          `SELECT COUNT(*) AS product_count FROM catalog_products`,
        );
        productCount = Number(countRows[0]?.product_count ?? 0);
      }
      if (
        legacy?.catalog_products &&
        legacy.app_users &&
        legacy.resend_webhook_events &&
        productCount > 0
      ) {
        for (const file of migrationFiles) {
          await connection.execute(
            `INSERT INTO gameao_schema_migrations (filename) VALUES (?) ON CONFLICT DO NOTHING`,
            [file],
          );
          applied.add(file);
        }
        console.log('[database] histórico legado adotado; migrações existentes não serão reaplicadas');
      }
    }

    for (const file of migrationFiles) {
      if (applied.has(file)) continue;
      const sql = await readFile(path.join(migrationDir, file), 'utf8');
      const statements = splitSqlStatements(sql);
      await connection.beginTransaction();
      try {
        for (const statement of statements) {
          try {
            await connection.query(statement);
          } catch (error) {
            const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
            if (code === 'ER_DUP_FIELDNAME' || code === 'ER_TABLE_EXISTS_ERROR' || code === '42701' || code === '42P07' || code === '42P16') continue;
            throw error;
          }
        }
        await connection.execute(
          `INSERT INTO gameao_schema_migrations (filename) VALUES (?) ON CONFLICT DO NOTHING`,
          [file],
        );
        await connection.commit();
        applied.add(file);
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  } finally {
    await connection.query(`SELECT pg_advisory_unlock(hashtext('gameao:migrations'))`).catch(() => undefined);
    connection.release();
  }
}

async function seedCatalog(): Promise<void> {
  await withConnection(async (connection) => {
    for (const [index, category] of CATEGORIES.entries()) {
      await connection.execute(
        `INSERT INTO catalog_categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING`,
        [category.slug, category.name, category.description, index],
      );
    }

    const [categoryRows] = await connection.query<(RowDataPacket & { id: number; slug: string })[]>(
      `SELECT id, slug FROM catalog_categories`,
    );
    const categoryIds = new Map(categoryRows.map((row) => [row.slug, Number(row.id)]));

    for (const product of PRODUCTS) {
      await connection.execute(
        `INSERT INTO catalog_products
          (id, slug, name, base_price_usd, sale_price_usd, rating, review_count, tags_json, image_url, image_card_url, is_hot, shop_order, featured_order, recent_order, deal_order, short_description, description_json, release_year, developer, platform)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`,
        [
          product.id,
          product.slug,
          product.name,
          product.basePriceUsd,
          product.salePriceUsd ?? null,
          product.rating,
          product.reviewCount,
          JSON.stringify(product.tags),
          product.image,
          product.imageCard,
          product.hot ? 1 : 0,
          product.shopOrder,
          product.featuredOrder ?? null,
          product.recentOrder ?? null,
          product.dealOrder ?? null,
          product.shortDescription,
          JSON.stringify(product.description),
          product.releaseYear,
          product.developer,
          product.platform,
        ],
      );
      for (const categorySlug of product.categories) {
        const categoryId = categoryIds.get(categorySlug);
        if (categoryId) {
          await connection.execute(
            `INSERT INTO catalog_product_categories (product_id, category_id) VALUES (?, ?) ON CONFLICT DO NOTHING`,
            [product.id, categoryId],
          );
        }
      }
    }

    for (const post of POSTS) {
      await connection.execute(
        `INSERT INTO content_posts
          (slug, title, published_date, category, author, image_url, image_card_url, image_thumb_url, excerpt, tags_json, views, comments_count, blocks_json, status, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?) ON CONFLICT DO NOTHING`,
        [
          post.slug,
          post.title,
          post.date,
          post.category,
          post.author,
          post.image,
          post.imageCard,
          post.imageThumb,
          post.excerpt,
          JSON.stringify(post.tags),
          post.views,
          post.commentsCount,
          JSON.stringify(post.blocks),
          `${post.date} 12:00:00`,
        ],
      );
    }

    await connection.execute(
      `INSERT INTO site_settings (setting_key, value_json) VALUES (?, ?) ON CONFLICT DO NOTHING`,
      ['catalog_seed_v1', JSON.stringify({ importedAt: new Date().toISOString(), source: 'GameAO static catalog' })],
    );
  });
}

export async function initializePersistence(): Promise<{ configured: boolean; ready: boolean; error?: string }> {
  if (!hasDatabaseUrl()) return { configured: false, ready: false, error: 'DATABASE_URL ausente' };
  try {
    await runMigration();
    await seedCatalog();
    return { configured: true, ready: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido na inicialização da base de dados';
    console.error(`[database] ${message}`);
    return { configured: true, ready: false, error: message };
  }
}
