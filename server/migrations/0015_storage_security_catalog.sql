-- Endurecimento operacional: armazenamento, tokens de pedido, stock e avaliações.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ficheiros guardados diretamente na base de dados (fallback automático do R2).
CREATE TABLE IF NOT EXISTS media_blobs (
  id BIGSERIAL PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  visibility VARCHAR(16) NOT NULL DEFAULT 'public',
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL,
  checksum CHAR(64),
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS media_blobs_visibility_idx ON media_blobs(visibility, created_at DESC);

ALTER TABLE media_library ADD COLUMN IF NOT EXISTS storage_backend VARCHAR(24) NOT NULL DEFAULT 'r2';
ALTER TABLE media_library ADD COLUMN IF NOT EXISTS checksum CHAR(64);

-- Token público de acompanhamento: guarda-se apenas o hash.
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS tracking_token_hash CHAR(64);
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(120);
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS stock_released SMALLINT NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS shop_orders_idempotency_uq ON shop_orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
UPDATE shop_orders SET tracking_token_hash = encode(digest(tracking_token, 'sha256'), 'hex') WHERE tracking_token IS NOT NULL AND tracking_token_hash IS NULL;

-- Movimentos de stock auditáveis.
CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  variant_id BIGINT,
  order_id BIGINT,
  quantity_delta INT NOT NULL,
  reason VARCHAR(60) NOT NULL,
  note TEXT,
  created_by_user_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON stock_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_order_idx ON stock_movements(order_id);

-- Avaliações de produto submetidas por clientes (com moderação).
CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  order_id BIGINT REFERENCES shop_orders(id) ON DELETE SET NULL,
  author_name VARCHAR(120) NOT NULL,
  author_email VARCHAR(255),
  rating SMALLINT NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  ip_hash CHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS product_reviews_product_idx ON product_reviews(product_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS product_reviews_status_idx ON product_reviews(status, created_at DESC);

-- Pedidos de reenvio de comprovativo e notas de revisão.
ALTER TABLE payment_proofs ADD COLUMN IF NOT EXISTS storage_backend VARCHAR(24) NOT NULL DEFAULT 'r2';
ALTER TABLE payment_proofs ADD COLUMN IF NOT EXISTS checksum CHAR(64);

-- Controlo de idempotência de operações sensíveis (checkout, uploads).
CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key VARCHAR(160) PRIMARY KEY,
  scope VARCHAR(60) NOT NULL,
  response_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);
CREATE INDEX IF NOT EXISTS idempotency_keys_expiry_idx ON idempotency_keys(expires_at);
