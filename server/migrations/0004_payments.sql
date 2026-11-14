CREATE TABLE IF NOT EXISTS payment_methods (id BIGSERIAL PRIMARY KEY, code VARCHAR(80) NOT NULL UNIQUE, name VARCHAR(160) NOT NULL, description TEXT NOT NULL DEFAULT '', logo_url TEXT, receiving_data_json JSONB NOT NULL DEFAULT '{}'::jsonb, instructions TEXT NOT NULL DEFAULT '', is_active SMALLINT NOT NULL DEFAULT 0, requires_proof SMALLINT NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 0, payment_deadline_hours INT NOT NULL DEFAULT 24, customer_message TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS payment_methods_active_idx ON payment_methods(is_active, sort_order);
CREATE TABLE IF NOT EXISTS payment_proofs (id BIGSERIAL PRIMARY KEY, order_id BIGINT NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE, payment_method_id BIGINT REFERENCES payment_methods(id) ON DELETE SET NULL, storage_key TEXT NOT NULL, original_name VARCHAR(255) NOT NULL, mime_type VARCHAR(100) NOT NULL, size_bytes BIGINT NOT NULL, status VARCHAR(32) NOT NULL DEFAULT 'submitted', admin_note TEXT, submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), reviewed_at TIMESTAMPTZ, reviewed_by_user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL);
CREATE INDEX IF NOT EXISTS payment_proofs_order_idx ON payment_proofs(order_id, submitted_at);
CREATE INDEX IF NOT EXISTS payment_proofs_status_idx ON payment_proofs(status);
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(120);
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS payment_method_id BIGINT REFERENCES payment_methods(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS shop_orders_payment_reference_uq ON shop_orders(payment_reference) WHERE payment_reference IS NOT NULL;
INSERT INTO payment_methods (code, name, description, instructions, is_active, requires_proof, sort_order, customer_message) VALUES
('express', 'Express', 'Pagamento móvel Express.', 'Configure os dados de recebimento da GameAO no painel antes de ativar.', 0, 1, 10, 'Envie o comprovativo depois de efetuar o pagamento.'),
('paypay_ao', 'PayPay AO', 'Pagamento móvel PayPay AO.', 'Configure os dados de recebimento da GameAO no painel antes de ativar.', 0, 1, 20, 'Envie o comprovativo depois de efetuar o pagamento.'),
('unitel_money', 'Unitel Money', 'Pagamento móvel Unitel Money.', 'Configure os dados de recebimento da GameAO no painel antes de ativar.', 0, 1, 30, 'Envie o comprovativo depois de efetuar o pagamento.'),
('bank_transfer', 'Transferência bancária', 'Transferência para uma conta da GameAO.', 'Configure o banco e os dados de recebimento da GameAO no painel antes de ativar.', 0, 1, 40, 'Use a referência da encomenda na descrição da transferência.'),
('in_person', 'Pagamento presencial', 'Pagamento presencial ou assistido.', 'Configure o local e as condições de atendimento da GameAO no painel antes de ativar.', 0, 0, 50, 'A equipa GameAO entrará em contacto para combinar o atendimento.')
ON CONFLICT (code) DO NOTHING;
