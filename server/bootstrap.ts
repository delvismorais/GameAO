import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
import { CATEGORIES, PRODUCTS } from '../src/data/products';
import { POSTS } from '../src/data/posts';
import { getPool, hasDatabaseUrl, withConnection } from './db';

const migrationPath = path.resolve(process.cwd(), 'server/migrations/0001_platform_foundation.sql');

async function runMigration(): Promise<void> {
  const sql = await readFile(migrationPath, 'utf8');
  const statements = sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
  const connection = await getPool().getConnection();
  try {
    for (const statement of statements) await connection.query(statement);
  } finally {
    connection.release();
  }
}

async function seedCatalog(): Promise<void> {
  await withConnection(async (connection) => {
    for (const [index, category] of CATEGORIES.entries()) {
      await connection.execute(
        `INSERT IGNORE INTO catalog_categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)`,
        [category.slug, category.name, category.description, index],
      );
    }

    const [categoryRows] = await connection.query<(RowDataPacket & { id: number; slug: string })[]>(
      `SELECT id, slug FROM catalog_categories`,
    );
    const categoryIds = new Map(categoryRows.map((row) => [row.slug, Number(row.id)]));

    for (const product of PRODUCTS) {
      await connection.execute(
        `INSERT IGNORE INTO catalog_products
          (id, slug, name, base_price_usd, sale_price_usd, rating, review_count, tags_json, image_url, image_card_url, is_hot, shop_order, featured_order, recent_order, deal_order, short_description, description_json, release_year, developer, platform)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            `INSERT IGNORE INTO catalog_product_categories (product_id, category_id) VALUES (?, ?)`,
            [product.id, categoryId],
          );
        }
      }
    }

    for (const post of POSTS) {
      await connection.execute(
        `INSERT IGNORE INTO content_posts
          (slug, title, published_date, category, author, image_url, image_card_url, image_thumb_url, excerpt, tags_json, views, comments_count, blocks_json, status, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
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
      `INSERT IGNORE INTO site_settings (setting_key, value_json) VALUES (?, ?)`,
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
