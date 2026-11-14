ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS invoice_template VARCHAR(32) NOT NULL DEFAULT 'classic';
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS invoice_downloads (id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE, template VARCHAR(32) NOT NULL, downloaded_by_user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS invoice_downloads_order_idx ON invoice_downloads(order_id, created_at);
