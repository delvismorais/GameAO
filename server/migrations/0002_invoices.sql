ALTER TABLE shop_orders ADD COLUMN invoice_template VARCHAR(32) NOT NULL DEFAULT 'classic';
ALTER TABLE shop_orders ADD COLUMN invoice_issued_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS invoice_downloads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  template VARCHAR(32) NOT NULL,
  downloaded_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY invoice_downloads_order_idx (order_id, created_at),
  CONSTRAINT invoice_downloads_order_fk FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE,
  CONSTRAINT invoice_downloads_user_fk FOREIGN KEY (downloaded_by_user_id) REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
