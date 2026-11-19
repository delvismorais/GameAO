-- Fila durável para não manter requests de checkout/contacto/upload/admin à espera dos provedores.
CREATE TABLE IF NOT EXISTS notification_jobs (
  id BIGSERIAL PRIMARY KEY,
  job_type VARCHAR(32) NOT NULL,
  payload_json JSONB NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  last_error TEXT,
  result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_jobs_queue_idx
  ON notification_jobs (status, available_at, created_at, id);

-- Modelos SMS operacionais são editáveis no painel; ON CONFLICT preserva texto personalizado.
INSERT INTO notification_templates (event_key, channel, name, subject, body) VALUES
('order.created', 'sms', 'SMS · Encomenda recebida', '', 'Olá {{customer_name}}! A encomenda {{order_number}} de {{order_total}} foi recebida. Acompanhe em {{site_url}}/pedido.'),
('order.payment_proof_submitted', 'sms', 'SMS · Comprovativo recebido', '', 'Olá {{customer_name}}! Recebemos o comprovativo da encomenda {{order_number}}. Aguarde a validação da GameAO.'),
('order.payment_confirmed', 'sms', 'SMS · Pagamento confirmado', '', 'Olá {{customer_name}}! O pagamento da encomenda {{order_number}} foi confirmado. Vamos processar o pedido.'),
('order.processing', 'sms', 'SMS · Encomenda em processamento', '', 'Olá {{customer_name}}! A encomenda {{order_number}} está em processamento. Acompanhe em {{site_url}}/pedido.'),
('order.ready_for_delivery', 'sms', 'SMS · Pronta para entrega', '', 'Olá {{customer_name}}! A encomenda {{order_number}} está pronta para entrega. A GameAO entrará em contacto.'),
('order.completed', 'sms', 'SMS · Encomenda concluída', '', 'Olá {{customer_name}}! A encomenda {{order_number}} foi concluída. Obrigado pela preferência, GameAO.'),
('order.cancelled', 'sms', 'SMS · Encomenda cancelada', '', 'Olá {{customer_name}}. A encomenda {{order_number}} foi cancelada. Se precisar de ajuda, contacte a GameAO.'),
('order.refunded', 'sms', 'SMS · Reembolso registado', '', 'Olá {{customer_name}}. O reembolso da encomenda {{order_number}} foi registado. Contacte a GameAO se tiver dúvidas.'),
('order.payment_rejected', 'sms', 'SMS · Comprovativo rejeitado', '', 'Olá {{customer_name}}. O comprovativo da encomenda {{order_number}} não foi aceite. Consulte o email para mais detalhes.'),
('order.payment_proof_requested', 'sms', 'SMS · Novo comprovativo necessário', '', 'Olá {{customer_name}}. Precisamos de um novo comprovativo para a encomenda {{order_number}}. Consulte o email da GameAO.')
ON CONFLICT (event_key, channel) DO NOTHING;
