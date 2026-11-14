import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { CATEGORIES, PRODUCTS } from '../src/data/products';
import { POSTS } from '../src/data/posts';
import { getPool, hasDatabaseUrl, isDuplicateObjectError, withConnection, type DbRow } from './db';

async function ensureMigrationTable(): Promise<void> {
  await getPool().query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       filename VARCHAR(255) NOT NULL PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
  );
}

async function runMigrations(): Promise<void> {
  await ensureMigrationTable();
  const migrationDir = path.resolve(process.cwd(), 'server/migrations');
  const migrationFiles = (await readdir(migrationDir)).filter((file) => file.endsWith('.sql')).sort();
  const [appliedRows] = await getPool().query<DbRow[]>(`SELECT filename FROM schema_migrations`);
  const applied = new Set(appliedRows.map((row) => String(row.filename)));

  for (const file of migrationFiles) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(migrationDir, file), 'utf8');
    const connection = await getPool().getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(sql);
      await connection.query(`INSERT INTO schema_migrations (filename) VALUES (?) ON CONFLICT (filename) DO NOTHING`, [file]);
      await connection.commit();
      console.log(`[database] migração aplicada: ${file}`);
    } catch (error) {
      await connection.rollback();
      if (isDuplicateObjectError(error)) {
        console.warn(`[database] migração ${file} já refletida na base de dados.`);
        continue;
      }
      throw error;
    } finally {
      connection.release();
    }
  }
}

async function seedCatalog(): Promise<void> {
  await withConnection(async (connection) => {
    for (const [index, category] of CATEGORIES.entries()) {
      await connection.execute(
        `INSERT INTO catalog_categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)
         ON CONFLICT (slug) DO NOTHING`,
        [category.slug, category.name, category.description, index],
      );
    }
    const [categoryRows] = await connection.query<DbRow[]>(`SELECT id, slug FROM catalog_categories`);
    const categoryIds = new Map(categoryRows.map((row) => [String(row.slug), Number(row.id)]));
    for (const product of PRODUCTS) {
      await connection.execute(
        `INSERT INTO catalog_products
          (id, slug, name, base_price_usd, sale_price_usd, rating, review_count, tags_json, image_url, image_card_url, is_hot, shop_order, featured_order, recent_order, deal_order, short_description, description_json, release_year, developer, platform)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO NOTHING`,
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
            `INSERT INTO catalog_product_categories (product_id, category_id) VALUES (?, ?)
             ON CONFLICT (product_id, category_id) DO NOTHING`,
            [product.id, categoryId],
          );
        }
      }
    }
    for (const post of POSTS) {
      await connection.execute(
        `INSERT INTO content_posts
          (slug, title, published_date, category, author, image_url, image_card_url, image_thumb_url, excerpt, tags_json, views, comments_count, blocks_json, status, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
         ON CONFLICT (slug) DO NOTHING`,
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
      `INSERT INTO site_settings (setting_key, value_json) VALUES (?, ?)
       ON CONFLICT (setting_key) DO NOTHING`,
      ['catalog_seed_v1', JSON.stringify({ importedAt: new Date().toISOString(), source: 'GameAO static catalog' })],
    );
  });
}

export async function initializePersistence(): Promise<{ configured: boolean; ready: boolean; error?: string }> {
  if (!hasDatabaseUrl()) return { configured: false, ready: false, error: 'DATABASE_URL ausente' };
  try {
    await runMigrations();
    await seedCatalog();
    return { configured: true, ready: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido na inicialização da base de dados';
    console.error(`[database] ${message}`);
    return { configured: true, ready: false, error: message };
  }
}
