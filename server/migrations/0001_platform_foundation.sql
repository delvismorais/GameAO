CREATE TABLE IF NOT EXISTS app_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'customer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY app_users_email_uq (email),
  KEY app_users_role_idx (role),
  KEY app_users_active_idx (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_sessions (
  token_hash CHAR(64) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY app_sessions_user_idx (user_id),
  KEY app_sessions_expiry_idx (expires_at),
  CONSTRAINT app_sessions_user_fk FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS catalog_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  image_url TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY catalog_categories_slug_uq (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS catalog_products (
  id VARCHAR(64) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  name VARCHAR(200) NOT NULL,
  base_price_usd DECIMAL(12,2) NOT NULL,
  sale_price_usd DECIMAL(12,2) NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  tags_json JSON NOT NULL,
  image_url TEXT NOT NULL,
  image_card_url TEXT NOT NULL,
  is_hot TINYINT(1) NOT NULL DEFAULT 0,
  shop_order INT NOT NULL DEFAULT 0,
  featured_order INT NULL,
  recent_order INT NULL,
  deal_order INT NULL,
  short_description TEXT NOT NULL,
  description_json JSON NOT NULL,
  release_year INT NOT NULL,
  developer VARCHAR(200) NOT NULL,
  platform VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY catalog_products_slug_uq (slug),
  KEY catalog_products_active_idx (is_active),
  KEY catalog_products_shop_order_idx (shop_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS catalog_product_categories (
  product_id VARCHAR(64) NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (product_id, category_id),
  CONSTRAINT catalog_product_categories_product_fk FOREIGN KEY (product_id) REFERENCES catalog_products(id) ON DELETE CASCADE,
  CONSTRAINT catalog_product_categories_category_fk FOREIGN KEY (category_id) REFERENCES catalog_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_posts (
  slug VARCHAR(200) NOT NULL,
  title VARCHAR(255) NOT NULL,
  published_date DATE NOT NULL,
  category VARCHAR(120) NOT NULL,
  author VARCHAR(160) NOT NULL,
  image_url TEXT NOT NULL,
  image_card_url TEXT NOT NULL,
  image_thumb_url TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  tags_json JSON NOT NULL,
  views INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  blocks_json JSON NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'published',
  published_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (slug),
  KEY content_posts_status_idx (status),
  KEY content_posts_date_idx (published_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(160) NOT NULL,
  value_json JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_banners (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(160) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_url TEXT NOT NULL,
  button_label VARCHAR(120) NULL,
  href VARCHAR(500) NULL,
  variant VARCHAR(40) NOT NULL DEFAULT 'homepage',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY site_banners_slug_uq (slug),
  KEY site_banners_active_idx (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shop_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number VARCHAR(64) NOT NULL,
  access_token_hash CHAR(64) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  customer_name VARCHAR(180) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  billing_address TEXT NULL,
  billing_city VARCHAR(120) NULL,
  billing_province VARCHAR(120) NULL,
  subtotal_aoa DECIMAL(14,2) NOT NULL,
  discount_aoa DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_aoa DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'AOA',
  exchange_rate_usd_aoa DECIMAL(14,4) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'awaiting_payment',
  payment_status VARCHAR(40) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(80) NULL,
  internal_notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY shop_orders_number_uq (order_number),
  UNIQUE KEY shop_orders_access_token_uq (access_token_hash),
  KEY shop_orders_user_idx (user_id),
  KEY shop_orders_email_idx (customer_email),
  KEY shop_orders_status_idx (status, payment_status),
  CONSTRAINT shop_orders_user_fk FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shop_order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  unit_price_aoa DECIMAL(14,2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  subtotal_aoa DECIMAL(14,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY shop_order_items_order_idx (order_id),
  CONSTRAINT shop_order_items_order_fk FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shop_order_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(40) NULL,
  to_status VARCHAR(40) NOT NULL,
  note TEXT NULL,
  changed_by_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY shop_order_history_order_idx (order_id, created_at),
  CONSTRAINT shop_order_history_order_fk FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE,
  CONSTRAINT shop_order_history_user_fk FOREIGN KEY (changed_by_user_id) REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shop_payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(80) NOT NULL,
  provider_payment_id VARCHAR(255) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  amount_aoa DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'AOA',
  failure_reason TEXT NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY shop_payments_provider_id_uq (provider, provider_payment_id),
  KEY shop_payments_order_idx (order_id),
  CONSTRAINT shop_payments_order_fk FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(120) NULL,
  metadata_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY admin_audit_logs_entity_idx (entity_type, entity_id),
  KEY admin_audit_logs_user_idx (user_id, created_at),
  CONSTRAINT admin_audit_logs_user_fk FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
