CREATE TABLE IF NOT EXISTS marketing_leads (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(160),
  source VARCHAR(80) NOT NULL DEFAULT 'newsletter',
  status VARCHAR(24) NOT NULL DEFAULT 'subscribed',
  tags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS marketing_leads_status_idx ON marketing_leads(status, created_at);

CREATE TABLE IF NOT EXISTS email_templates (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL DEFAULT '',
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL DEFAULT '',
  audience_status VARCHAR(24) NOT NULL DEFAULT 'subscribed',
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  recipient_count INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  created_by_user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS email_campaigns_status_idx ON email_campaigns(status, created_at);

CREATE TABLE IF NOT EXISTS admin_notifications (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  level VARCHAR(24) NOT NULL DEFAULT 'info',
  link VARCHAR(500),
  is_read SMALLINT NOT NULL DEFAULT 0,
  created_by_user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_notifications_read_idx ON admin_notifications(is_read, created_at);

INSERT INTO email_templates (slug, name, subject, body_html, body_text)
VALUES ('newsletter-default', 'Newsletter GameAO', 'Novidades GameAO', '<h1>Novidades GameAO</h1><p>Temos novidades para si.</p>', 'Novidades GameAO\n\nTemos novidades para si.')
ON CONFLICT (slug) DO NOTHING;
