ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS category_type VARCHAR(16) NOT NULL DEFAULT 'digital';
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS product_subtype VARCHAR(24) NOT NULL DEFAULT 'digital_game';
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS requires_player_id SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS sub_category VARCHAR(120);
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS shipping_cost_aoa NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS additional_images_json JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS is_dynamic SMALLINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS catalog_products_type_idx ON catalog_products(category_type, product_subtype, is_active);

CREATE TABLE IF NOT EXISTS product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
  name VARCHAR(180) NOT NULL,
  sku VARCHAR(120),
  price_usd NUMERIC(12,2) NOT NULL,
  original_price_usd NUMERIC(12,2),
  description TEXT NOT NULL DEFAULT '',
  is_active SMALLINT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants(product_id, is_active, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_sku_uq ON product_variants(sku) WHERE sku IS NOT NULL AND sku <> '';

ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS shipping_aoa NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE shop_order_items ADD COLUMN IF NOT EXISTS variant_id BIGINT REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE shop_order_items ADD COLUMN IF NOT EXISTS variant_name VARCHAR(180);
ALTER TABLE shop_order_items ADD COLUMN IF NOT EXISTS player_id VARCHAR(120);
ALTER TABLE shop_order_items ADD COLUMN IF NOT EXISTS player_nickname VARCHAR(180);
ALTER TABLE shop_order_items ADD COLUMN IF NOT EXISTS category_type VARCHAR(16) NOT NULL DEFAULT 'digital';
ALTER TABLE shop_order_items ADD COLUMN IF NOT EXISTS product_subtype VARCHAR(24) NOT NULL DEFAULT 'digital_game';
ALTER TABLE shop_order_items ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS freefire_ids (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  player_id VARCHAR(120) NOT NULL,
  player_nickname VARCHAR(180) NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, player_id)
);
CREATE INDEX IF NOT EXISTS freefire_ids_user_idx ON freefire_ids(user_id, updated_at DESC);
