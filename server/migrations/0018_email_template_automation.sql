-- Associa modelos da biblioteca a eventos automáticos sem substituir os modelos transacionais existentes.
ALTER TABLE notification_templates
  ADD COLUMN IF NOT EXISTS automatic_event_key VARCHAR(80);

CREATE TABLE IF NOT EXISTS notification_template_seed_markers (
  seed_key VARCHAR(100) PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_templates_automatic_event_channel_idx
  ON notification_templates (automatic_event_key, channel)
  WHERE automatic_event_key IS NOT NULL;

-- A mensagem de boas-vindas é reutilizada no disparo automático de criação de conta.
WITH inserted_seed AS (
  INSERT INTO notification_template_seed_markers (seed_key)
  VALUES ('email_template_welcome_auto_v1')
  ON CONFLICT (seed_key) DO NOTHING
  RETURNING seed_key
)
UPDATE notification_templates
SET automatic_event_key = 'user.welcome', updated_at = NOW()
WHERE event_key = 'email.template.boas-vindas'
  AND channel = 'email'
  AND EXISTS (SELECT 1 FROM inserted_seed);
