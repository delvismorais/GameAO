-- GameAO — centro de comunicação, afiliados, popups, comentários e configurações
-- Migração aditiva e idempotente.

CREATE TABLE IF NOT EXISTS user_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES shop_orders(id) ON DELETE SET NULL,
  event_key VARCHAR(80) NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'info',
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  is_read SMALLINT NOT NULL DEFAULT 0,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_notifications_user_idx ON user_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS user_notifications_order_idx ON user_notifications(order_id);

CREATE TABLE IF NOT EXISTS notification_templates (
  id BIGSERIAL PRIMARY KEY,
  event_key VARCHAR(80) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  name VARCHAR(180) NOT NULL,
  subject VARCHAR(255) NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_key, channel)
);
CREATE INDEX IF NOT EXISTS notification_templates_event_idx ON notification_templates(event_key, channel);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id BIGSERIAL PRIMARY KEY,
  event_key VARCHAR(80) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  order_id BIGINT REFERENCES shop_orders(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  subject VARCHAR(255),
  provider_message_id VARCHAR(255),
  error_message TEXT,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notification_deliveries_created_idx ON notification_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS notification_deliveries_event_idx ON notification_deliveries(event_key, channel, status);
CREATE INDEX IF NOT EXISTS notification_deliveries_order_idx ON notification_deliveries(order_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash CHAR(64) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens(user_id, expires_at);

CREATE TABLE IF NOT EXISTS site_popups (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  cta_label VARCHAR(120),
  cta_href VARCHAR(500),
  variant VARCHAR(40) NOT NULL DEFAULT 'promo',
  delay_seconds INT NOT NULL DEFAULT 2,
  frequency VARCHAR(24) NOT NULL DEFAULT 'session',
  is_active SMALLINT NOT NULL DEFAULT 1,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS site_popups_active_idx ON site_popups(is_active, sort_order);

CREATE TABLE IF NOT EXISTS blog_comments (
  id BIGSERIAL PRIMARY KEY,
  post_slug VARCHAR(200) NOT NULL REFERENCES content_posts(slug) ON DELETE CASCADE,
  user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  author_name VARCHAR(160) NOT NULL,
  author_email VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  parent_id BIGINT REFERENCES blog_comments(id) ON DELETE CASCADE,
  ip_hash CHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS blog_comments_post_idx ON blog_comments(post_slug, status, created_at DESC);
CREATE INDEX IF NOT EXISTS blog_comments_status_idx ON blog_comments(status, created_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(40),
  subject VARCHAR(200),
  message TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'new',
  reply_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS contact_messages_status_idx ON contact_messages(status, created_at DESC);

CREATE TABLE IF NOT EXISTS affiliates (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
  code VARCHAR(32) NOT NULL UNIQUE,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 5,
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  balance_aoa NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_earned_aoa NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_paid_aoa NUMERIC(14,2) NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS affiliates_status_idx ON affiliates(status, created_at);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  order_id BIGINT REFERENCES shop_orders(id) ON DELETE SET NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  order_total_aoa NUMERIC(14,2) NOT NULL DEFAULT 0,
  commission_aoa NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(order_id)
);
CREATE INDEX IF NOT EXISTS affiliate_referrals_affiliate_idx ON affiliate_referrals(affiliate_id, created_at DESC);

CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id BIGSERIAL PRIMARY KEY,
  affiliate_id BIGINT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount_aoa NUMERIC(14,2) NOT NULL,
  method VARCHAR(80),
  reference VARCHAR(120),
  notes TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'paid',
  created_by_user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS affiliate_payouts_affiliate_idx ON affiliate_payouts(affiliate_id, created_at DESC);

ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS affiliate_id BIGINT REFERENCES affiliates(id) ON DELETE SET NULL;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS affiliate_code VARCHAR(32);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS referred_by_affiliate_id BIGINT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS notification_preferences_json JSONB NOT NULL DEFAULT '{"email":true,"whatsapp":true,"inApp":true}'::jsonb;
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS event_key VARCHAR(80);
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS entity_type VARCHAR(80);
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS entity_id VARCHAR(120);
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS stock_quantity INT;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS low_stock_threshold INT NOT NULL DEFAULT 5;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS related_products_json JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(200);
ALTER TABLE catalog_products ADD COLUMN IF NOT EXISTS seo_description TEXT;

INSERT INTO site_settings (setting_key, value_json) VALUES ('site_config', '{"name":"GameAO","tagline":"A sua loja de videojogos em Angola","email":"geral@gameao.shop","phone":"973 929 712","whatsapp":"244973929712","location":"Luanda, Angola","supportHours":"Segunda a sábado, 09h00–20h00","currency":"AOA"}'::jsonb) ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, value_json) VALUES ('social_links', '[{"label":"Facebook","href":"https://facebook.com","icon":"facebook"},{"label":"Instagram","href":"https://instagram.com","icon":"instagram"},{"label":"WhatsApp","href":"https://wa.me/244973929712","icon":"whatsapp"}]'::jsonb) ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, value_json) VALUES ('sales_counter', '{"enabled":true,"baseCount":0,"label":"pedidos realizados","showOnHome":true,"showOnProduct":true}'::jsonb) ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, value_json) VALUES ('notifications_config', '{"inApp":true,"email":true,"whatsapp":true,"adminEmail":true,"lowStockThreshold":5}'::jsonb) ON CONFLICT (setting_key) DO NOTHING;
INSERT INTO site_settings (setting_key, value_json) VALUES ('store_status', '{"acceptingOrders":true,"maintenanceMessage":"","announcement":"","announcementActive":false}'::jsonb) ON CONFLICT (setting_key) DO NOTHING;
