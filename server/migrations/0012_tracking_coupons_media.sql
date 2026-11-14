-- GameAO — acompanhamento seguro, cupões e biblioteca multimédia
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(80);
CREATE UNIQUE INDEX IF NOT EXISTS shop_orders_tracking_token_uq ON shop_orders(tracking_token) WHERE tracking_token IS NOT NULL;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS coupon_id BIGINT;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(60);

CREATE TABLE IF NOT EXISTS coupons (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL DEFAULT '',
  discount_type VARCHAR(16) NOT NULL DEFAULT 'percent',
  discount_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  min_order_aoa NUMERIC(14,2) NOT NULL DEFAULT 0,
  max_discount_aoa NUMERIC(14,2),
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  per_user_limit INT NOT NULL DEFAULT 1,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON coupons(is_active, ends_at);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id BIGSERIAL PRIMARY KEY,
  coupon_id BIGINT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id BIGINT NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  discount_aoa NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coupon_id, order_id)
);
CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_idx ON coupon_redemptions(coupon_id, created_at);

CREATE TABLE IF NOT EXISTS media_library (
  id BIGSERIAL PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  bucket VARCHAR(120) NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  public_url TEXT,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  width INT,
  height INT,
  category VARCHAR(60) NOT NULL DEFAULT 'image',
  purpose VARCHAR(60) NOT NULL DEFAULT 'product',
  visibility VARCHAR(16) NOT NULL DEFAULT 'public',
  uploaded_by_user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  is_used SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS media_library_purpose_idx ON media_library(purpose, created_at DESC);
CREATE INDEX IF NOT EXISTS media_library_category_idx ON media_library(category, created_at DESC);

CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(80) NOT NULL,
  event_id VARCHAR(160),
  event_type VARCHAR(120),
  signature_valid SMALLINT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'received',
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, event_id)
);
CREATE INDEX IF NOT EXISTS webhook_events_provider_idx ON webhook_events(provider, created_at DESC);
