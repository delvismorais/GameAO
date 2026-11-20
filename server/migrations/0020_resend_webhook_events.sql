-- Eventos mínimos do Resend para reconciliar aceite com entrega/rejeição sem guardar payloads completos ou destinatários.
CREATE TABLE IF NOT EXISTS resend_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider_event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  email_id VARCHAR(255) NOT NULL,
  occurred_at TIMESTAMPTZ,
  detail_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS resend_webhook_events_email_idx
  ON resend_webhook_events (email_id, occurred_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS notification_deliveries_email_provider_message_idx
  ON notification_deliveries (provider_message_id)
  WHERE channel = 'email' AND provider_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS order_notifications_email_provider_message_idx
  ON order_notifications (provider_message_id)
  WHERE channel = 'email' AND provider_message_id IS NOT NULL;
