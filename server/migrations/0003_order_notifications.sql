CREATE TABLE IF NOT EXISTS order_notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  channel VARCHAR(20) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  event_type VARCHAR(60) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'not_configured',
  provider_message_id VARCHAR(255) NULL,
  error_message TEXT NULL,
  payload_json JSON NULL,
  sent_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY order_notifications_order_idx (order_id, created_at),
  KEY order_notifications_status_idx (status, channel),
  CONSTRAINT order_notifications_order_fk FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
