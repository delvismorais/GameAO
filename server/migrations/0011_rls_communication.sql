-- GameAO — RLS para as novas tabelas e fecho das tabelas administrativas
ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_read_active_popups ON site_popups;
CREATE POLICY public_read_active_popups ON site_popups FOR SELECT TO anon, authenticated
  USING (is_active = 1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW()));
DROP POLICY IF EXISTS public_read_approved_comments ON blog_comments;
CREATE POLICY public_read_approved_comments ON blog_comments FOR SELECT TO anon, authenticated
  USING (status = 'approved');
-- Sem políticas públicas para notificações, entregas, tokens, afiliados,
-- mensagens de contacto, leads, campanhas e modelos: apenas o backend acede.
