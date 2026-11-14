import { createHash, randomBytes } from 'node:crypto';
import type { Express, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../db';
import { getAuthenticatedUser } from '../auth';
import {
  dispatch,
  emailConfigured,
  getSiteConfig,
  invalidateSiteConfigCache,
  notifyAffiliateJoined,
  notifyCommentApproved,
  notifyCommentPending,
  notifyContactMessage,
  notifyPasswordReset,
  publicSiteUrl,
  sendTestNotification,
  smsConfigured,
  whatsappConfigured,
  type NotificationChannel,
} from '../notifications';
import type { RouteDeps } from './deps';

type Handler = (request: Request, response: Response) => Promise<void>;
function wrap(handler: Handler) {
  return (request: Request, response: Response, next: (error?: unknown) => void) => handler(request, response).catch(next);
}
function text(value: unknown, max = 5000): string { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function validEmail(value: unknown): value is string { return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
function sha256(value: string): string { return createHash('sha256').update(value).digest('hex'); }
function jsonValue(value: unknown, fallback: unknown = {}) {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}
async function setting(key: string): Promise<any> {
  const [rows] = await getPool().query<any[]>(`SELECT value_json FROM site_settings WHERE setting_key = ? LIMIT 1`, [key]);
  return jsonValue(rows[0]?.value_json, {});
}
async function saveSetting(key: string, value: unknown): Promise<void> {
  await getPool().execute(`INSERT INTO site_settings (setting_key, value_json) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = NOW()`, [key, JSON.stringify(value)]);
}
const ADMIN_SETTING_KEYS = new Set(['site_config', 'social_links', 'sales_counter', 'notifications_config', 'store_status', 'exchange_rate', 'business_info', 'checkout_config', 'delivery_config', 'seo_config', 'faq', 'pages']);

export function registerCommunicationRoutes(app: Express, deps: RouteDeps): void {
  // ---------------------------------------------------------------------------
  // Site público
  // ---------------------------------------------------------------------------
  app.get('/api/site/config', wrap(async (_request, response) => {
    if (!deps.requireDatabase(response)) return;
    const [site, socials, counter, status, faq] = await Promise.all([getSiteConfig(), setting('social_links'), setting('sales_counter'), setting('store_status'), setting('faq')]);
    response.json({
      site,
      socials: Array.isArray(socials) ? socials : [],
      salesCounter: counter ?? {},
      storeStatus: status ?? {},
      faq: Array.isArray(faq) ? faq : [],
      channels: { email: emailConfigured(), whatsapp: whatsappConfigured(), inApp: true },
    });
  }));

  app.get('/api/site/popups', wrap(async (_request, response) => {
    if (!deps.requireDatabase(response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT id, title, message, image_url, cta_label, cta_href, variant, delay_seconds, frequency, sort_order FROM site_popups WHERE is_active = 1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW()) ORDER BY sort_order ASC, id DESC LIMIT 5`);
    response.json({ popups: rows });
  }));

  app.get('/api/site/sales-counter', wrap(async (_request, response) => {
    if (!deps.requireDatabase(response)) return;
    const config = await setting('sales_counter');
    if (config?.enabled === false) { response.json({ enabled: false, count: 0, label: config?.label ?? 'pedidos realizados' }); return; }
    const [[row]] = await getPool().query<any[]>(`SELECT COUNT(*) AS total FROM shop_orders WHERE status <> 'cancelled'`);
    response.json({ enabled: true, count: Number(row?.total ?? 0) + Math.max(0, Number(config?.baseCount ?? 0)), label: config?.label ?? 'pedidos realizados' });
  }));

  app.post('/api/contact', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const name = text(request.body?.name, 160);
    const email = text(request.body?.email, 255);
    const phone = text(request.body?.phone, 40);
    const subject = text(request.body?.subject, 200);
    const message = text(request.body?.message, 5000);
    if (name.length < 2 || !validEmail(email) || message.length < 5) { response.status(400).json({ error: 'invalid_contact', message: 'Indique nome, email válido e mensagem.' }); return; }
    await getPool().execute(`INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)`, [name, email.toLowerCase(), phone || null, subject || 'Contacto do site', message]);
    await notifyContactMessage({ name, email: email.toLowerCase(), message });
    response.status(201).json({ ok: true, message: 'Mensagem enviada. A equipa GameAO responderá em breve.' });
  }));

  // ---------------------------------------------------------------------------
  // Comentários do blog
  // ---------------------------------------------------------------------------
  app.get('/api/blog/posts/:slug/comments', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT id, author_name, content, created_at, parent_id FROM blog_comments WHERE post_slug = ? AND status = 'approved' ORDER BY created_at ASC LIMIT 200`, [String(request.params.slug)]);
    response.json({ comments: rows });
  }));

  app.post('/api/blog/posts/:slug/comments', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await getAuthenticatedUser(request);
    const content = text(request.body?.content, 3000);
    const name = user?.name ?? text(request.body?.name, 160);
    const email = user?.email ?? text(request.body?.email, 255);
    if (content.length < 2) { response.status(400).json({ error: 'invalid_comment', message: 'Escreva um comentário com pelo menos 2 caracteres.' }); return; }
    if (!user && (name.length < 2 || !validEmail(email))) { response.status(400).json({ error: 'invalid_comment', message: 'Indique o nome e um email válido.' }); return; }
    const [[post]] = await getPool().query<any[]>(`SELECT slug, title FROM content_posts WHERE slug = ? AND status = 'published' LIMIT 1`, [String(request.params.slug)]);
    if (!post) { response.status(404).json({ error: 'post_not_found', message: 'Artigo não encontrado.' }); return; }
    const ipHash = sha256(String(request.ip ?? request.socket.remoteAddress ?? ''));
    await getPool().execute(`INSERT INTO blog_comments (post_slug, user_id, author_name, author_email, content, status, parent_id, ip_hash) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`, [post.slug, user?.id ?? null, name, email.toLowerCase(), content, request.body?.parentId ? Number(request.body.parentId) : null, ipHash]);
    await notifyCommentPending({ name, postTitle: post.title, excerpt: content.slice(0, 180), postSlug: post.slug });
    response.status(201).json({ ok: true, message: 'Comentário recebido. Será publicado depois de aprovado pela equipa GameAO.' });
  }));

  // ---------------------------------------------------------------------------
  // Recuperação de palavra-passe
  // ---------------------------------------------------------------------------
  app.post('/api/auth/forgot-password', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const email = text(request.body?.email, 255).toLowerCase();
    if (!validEmail(email)) { response.status(400).json({ error: 'invalid_email', message: 'Indique um email válido.' }); return; }
    const [rows] = await getPool().query<any[]>(`SELECT id, name, email, phone FROM app_users WHERE email = ? AND is_active = 1 LIMIT 1`, [email]);
    if (rows[0]) {
      const token = randomBytes(32).toString('hex');
      await getPool().execute(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [rows[0].id]);
      await getPool().execute(`INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, NOW() + INTERVAL '60 minutes')`, [sha256(token), rows[0].id]);
      const result = await notifyPasswordReset({ id: Number(rows[0].id), name: rows[0].name, email: rows[0].email, phone: rows[0].phone }, token);
      response.json({ ok: true, message: result.email === 'sent' ? 'Enviámos um email com o link de recuperação.' : 'O serviço de email ainda não está configurado. Contacte geral@gameao.shop para recuperar a palavra-passe.', delivered: result.email === 'sent' });
      return;
    }
    response.json({ ok: true, message: 'Se o email existir, receberá um link de recuperação.', delivered: false });
  }));

  app.post('/api/auth/reset-password', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const token = text(request.body?.token, 200);
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    if (!token || password.length < 6) { response.status(400).json({ error: 'invalid_reset', message: 'Link inválido ou palavra-passe com menos de 6 caracteres.' }); return; }
    const [[row]] = await getPool().query<any[]>(`SELECT token_hash, user_id FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1`, [sha256(token)]);
    if (!row) { response.status(400).json({ error: 'invalid_token', message: 'O link expirou ou já foi utilizado. Peça um novo link.' }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    await getPool().execute(`UPDATE app_users SET password_hash = ?, updated_at = NOW() WHERE id = ?`, [passwordHash, row.user_id]);
    await getPool().execute(`UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ?`, [row.token_hash]);
    await getPool().execute(`DELETE FROM app_sessions WHERE user_id = ?`, [row.user_id]);
    response.json({ ok: true, message: 'Palavra-passe atualizada. Já pode iniciar sessão.' });
  }));

  // ---------------------------------------------------------------------------
  // Conta: notificações, preferências, palavra-passe, afiliados
  // ---------------------------------------------------------------------------
  async function currentUser(request: Request, response: Response) {
    const user = await getAuthenticatedUser(request);
    if (!user) response.status(401).json({ error: 'unauthorized', message: 'Inicie sessão para continuar.' });
    return user;
  }

  app.get('/api/account/notifications', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await currentUser(request, response); if (!user) return;
    const unreadOnly = request.query.unread === '1';
    const limit = Math.min(100, Math.max(1, Number(request.query.limit ?? 30)));
    const [rows] = await getPool().query<any[]>(`SELECT id, event_key, type, title, message, link, is_read, created_at FROM user_notifications WHERE user_id = ? ${unreadOnly ? 'AND is_read = 0' : ''} ORDER BY created_at DESC LIMIT ${limit}`, [user.id]);
    const [[count]] = await getPool().query<any[]>(`SELECT COUNT(*) AS unread FROM user_notifications WHERE user_id = ? AND is_read = 0`, [user.id]);
    response.json({ notifications: rows, unread: Number(count?.unread ?? 0) });
  }));

  app.get('/api/account/notifications/unread-count', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await currentUser(request, response); if (!user) return;
    const [[count]] = await getPool().query<any[]>(`SELECT COUNT(*) AS unread FROM user_notifications WHERE user_id = ? AND is_read = 0`, [user.id]);
    response.json({ unread: Number(count?.unread ?? 0) });
  }));

  app.patch('/api/account/notifications/:id/read', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await currentUser(request, response); if (!user) return;
    await getPool().execute(`UPDATE user_notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?`, [Number(request.params.id), user.id]);
    response.json({ ok: true });
  }));

  app.post('/api/account/notifications/read-all', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await currentUser(request, response); if (!user) return;
    await getPool().execute(`UPDATE user_notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0`, [user.id]);
    response.json({ ok: true });
  }));

  app.get('/api/account/notification-preferences', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await currentUser(request, response); if (!user) return;
    const [[row]] = await getPool().query<any[]>(`SELECT notification_preferences_json FROM app_users WHERE id = ? LIMIT 1`, [user.id]);
    response.json({ preferences: { email: true, whatsapp: true, inApp: true, ...(jsonValue(row?.notification_preferences_json, {}) as object) } });
  }));

  app.put('/api/account/notification-preferences', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await currentUser(request, response); if (!user) return;
    const preferences = { email: request.body?.email !== false, whatsapp: request.body?.whatsapp !== false, inApp: request.body?.inApp !== false };
    await getPool().execute(`UPDATE app_users SET notification_preferences_json = ?, updated_at = NOW() WHERE id = ?`, [JSON.stringify(preferences), user.id]);
    response.json({ ok: true, preferences });
  }));

  app.post('/api/account/password', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await currentUser(request, response); if (!user) return;
    const currentPassword = typeof request.body?.currentPassword === 'string' ? request.body.currentPassword : '';
    const newPassword = typeof request.body?.newPassword === 'string' ? request.body.newPassword : '';
    if (newPassword.length < 6) { response.status(400).json({ error: 'weak_password', message: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' }); return; }
    const [[row]] = await getPool().query<any[]>(`SELECT password_hash FROM app_users WHERE id = ? LIMIT 1`, [user.id]);
    if (!row || !(await bcrypt.compare(currentPassword, String(row.password_hash)))) { response.status(401).json({ error: 'invalid_password', message: 'A palavra-passe atual não confere.' }); return; }
    await getPool().execute(`UPDATE app_users SET password_hash = ?, updated_at = NOW() WHERE id = ?`, [await bcrypt.hash(newPassword, 12), user.id]);
    await getPool().execute(`DELETE FROM app_sessions WHERE user_id = ?`, [user.id]);
    response.json({ ok: true, message: 'Palavra-passe atualizada. Inicie sessão novamente.' });
  }));

  async function affiliateForUser(userId: number) {
    const [[affiliate]] = await getPool().query<any[]>(`SELECT * FROM affiliates WHERE user_id = ? LIMIT 1`, [userId]);
    return affiliate ?? null;
  }

  app.get('/api/account/affiliate', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await currentUser(request, response); if (!user) return;
    const affiliate = await affiliateForUser(user.id);
    if (!affiliate) { response.json({ affiliate: null, referrals: [], payouts: [], siteUrl: publicSiteUrl() }); return; }
    const [referrals] = await getPool().query<any[]>(`SELECT id, status, order_total_aoa, commission_aoa, created_at FROM affiliate_referrals WHERE affiliate_id = ? ORDER BY created_at DESC LIMIT 100`, [affiliate.id]);
    const [payouts] = await getPool().query<any[]>(`SELECT id, amount_aoa, method, reference, status, created_at FROM affiliate_payouts WHERE affiliate_id = ? ORDER BY created_at DESC LIMIT 50`, [affiliate.id]);
    response.json({ affiliate, referrals, payouts, siteUrl: publicSiteUrl() });
  }));

  app.post('/api/account/affiliate/join', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await currentUser(request, response); if (!user) return;
    const existing = await affiliateForUser(user.id);
    if (existing) { response.json({ affiliate: existing, message: 'Já participa no programa de afiliados.' }); return; }
    const base = `GA${String(user.id).padStart(4, '0')}${randomBytes(2).toString('hex').toUpperCase()}`;
    const [result] = await getPool().execute<any>(`INSERT INTO affiliates (user_id, code) VALUES (?, ?) RETURNING id`, [user.id, base]);
    const affiliate = { id: Number(result.insertId), user_id: user.id, code: base, commission_rate: 5, status: 'active', balance_aoa: 0, total_earned_aoa: 0, total_paid_aoa: 0 };
    await notifyAffiliateJoined(user, base, 5);
    await dispatch({ eventKey: 'admin.affiliate_request', user, variables: { affiliate_code: base }, channels: ['in_app'], entityType: 'affiliate', entityId: String(result.insertId) });
    response.status(201).json({ affiliate, message: 'Bem-vindo ao programa de afiliados GameAO.' });
  }));

  app.post('/api/account/affiliate/withdraw', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await currentUser(request, response); if (!user) return;
    const affiliate = await affiliateForUser(user.id);
    if (!affiliate) { response.status(404).json({ error: 'not_affiliate', message: 'Ainda não é afiliado GameAO.' }); return; }
    const amount = Number(affiliate.balance_aoa);
    if (amount <= 0) { response.status(400).json({ error: 'no_balance', message: 'Ainda não tem saldo disponível para levantamento.' }); return; }
    const method = text(request.body?.method, 80) || 'Transferência bancária';
    const reference = text(request.body?.reference, 120);
    await dispatch({ eventKey: 'admin.affiliate_withdraw', user, variables: { payout_amount: `$${amount.toFixed(2)}`, method, reference }, channels: ['in_app'], entityType: 'affiliate', entityId: String(affiliate.id), level: 'warning' });
    await getPool().execute(`INSERT INTO affiliate_payouts (affiliate_id, amount_aoa, method, reference, status, notes) VALUES (?, ?, ?, ?, 'pending', ?)`, [affiliate.id, amount, method, reference || null, 'Pedido de levantamento enviado pelo afiliado.']);
    response.status(201).json({ ok: true, message: 'Pedido de levantamento enviado. A equipa GameAO entrará em contacto.' });
  }));

  app.post('/api/affiliate/track', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const code = text(request.body?.code ?? request.query.code, 32).toUpperCase();
    if (code) await getPool().execute(`UPDATE affiliates SET clicks = clicks + 1 WHERE code = ? AND status = 'active'`, [code]);
    response.json({ ok: true });
  }));

  // ---------------------------------------------------------------------------
  // Administração: notificações, modelos, entregas, popups, comentários, contacto
  // ---------------------------------------------------------------------------
  app.get('/api/admin/notifications/unread-count', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [[row]] = await getPool().query<any[]>(`SELECT COUNT(*) AS unread FROM admin_notifications WHERE is_read = 0`);
    response.json({ unread: Number(row?.unread ?? 0) });
  }));

  app.post('/api/admin/notifications/read-all', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    await getPool().execute(`UPDATE admin_notifications SET is_read = 1 WHERE is_read = 0`);
    await deps.recordAudit(admin.id, 'notification.read_all', 'admin_notification', null);
    response.json({ ok: true });
  }));

  app.delete('/api/admin/notifications/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    await getPool().execute(`DELETE FROM admin_notifications WHERE id = ?`, [Number(request.params.id)]);
    response.status(204).end();
  }));

  app.get('/api/admin/notification-templates', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT * FROM notification_templates ORDER BY event_key ASC, channel ASC`);
    response.json({ templates: rows });
  }));

  app.post('/api/admin/notification-templates', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const eventKey = text(request.body?.eventKey, 80);
    const channel = ['email', 'whatsapp', 'in_app'].includes(String(request.body?.channel)) ? String(request.body.channel) as NotificationChannel : null;
    const subject = text(request.body?.subject, 255);
    const body = text(request.body?.body, 20000);
    if (!eventKey || !channel || !body) { response.status(400).json({ error: 'invalid_template', message: 'Evento, canal e conteúdo são obrigatórios.' }); return; }
    try {
      await getPool().execute(`INSERT INTO notification_templates (event_key, channel, name, subject, body) VALUES (?, ?, ?, ?, ?)`, [eventKey, channel, text(request.body?.name, 180) || eventKey, subject, body]);
    } catch {
      response.status(409).json({ error: 'duplicate_template', message: 'Já existe um modelo para este evento e canal.' }); return;
    }
    await deps.recordAudit(admin.id, 'notification_template.create', 'notification_template', `${eventKey}:${channel}`);
    response.status(201).json({ ok: true });
  }));

  app.put('/api/admin/notification-templates/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const id = Number(request.params.id);
    await getPool().execute(`UPDATE notification_templates SET name = ?, subject = ?, body = ?, is_active = ?, updated_at = NOW() WHERE id = ?`, [text(request.body?.name, 180), text(request.body?.subject, 255), text(request.body?.body, 20000), request.body?.isActive === false ? 0 : 1, id]);
    await deps.recordAudit(admin.id, 'notification_template.update', 'notification_template', String(id));
    response.json({ ok: true });
  }));

  app.delete('/api/admin/notification-templates/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    await getPool().execute(`DELETE FROM notification_templates WHERE id = ?`, [Number(request.params.id)]);
    await deps.recordAudit(admin.id, 'notification_template.delete', 'notification_template', String(request.params.id));
    response.status(204).end();
  }));

  app.get('/api/admin/notification-deliveries', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const filters: string[] = [];
    const params: unknown[] = [];
    for (const [query, column] of [['channel', 'channel'], ['status', 'status'], ['event', 'event_key']] as const) {
      const value = text(request.query[query], 80);
      if (value && value !== 'all') { filters.push(`${column} = ?`); params.push(value); }
    }
    const limit = Math.min(300, Math.max(1, Number(request.query.limit ?? 100)));
    const [rows] = await getPool().query<any[]>(`SELECT * FROM notification_deliveries ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT ${limit}`, params);
    const [summary] = await getPool().query<any[]>(`SELECT channel, status, COUNT(*) AS total FROM notification_deliveries WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY channel, status`);
    response.json({ deliveries: rows, summary });
  }));

  app.post('/api/admin/notifications/test', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const eventKey = text(request.body?.eventKey, 80);
    const channel = ['email', 'whatsapp', 'in_app'].includes(String(request.body?.channel)) ? String(request.body.channel) as NotificationChannel : 'email';
    const to = text(request.body?.to, 255) || admin.email;
    if (!eventKey) { response.status(400).json({ error: 'invalid_event', message: 'Escolha um evento.' }); return; }
    const result = await sendTestNotification(eventKey, channel, to);
    await deps.recordAudit(admin.id, 'notification.test', 'notification', `${eventKey}:${channel}`, result);
    response.json({ ok: result.status === 'sent', ...result });
  }));

  app.get('/api/admin/popups', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT * FROM site_popups ORDER BY sort_order ASC, id DESC LIMIT 100`);
    response.json({ popups: rows });
  }));

  app.post('/api/admin/popups', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const title = text(request.body?.title, 200);
    const message = text(request.body?.message, 5000);
    if (!title || !message) { response.status(400).json({ error: 'invalid_popup', message: 'Título e mensagem são obrigatórios.' }); return; }
    await getPool().execute(`INSERT INTO site_popups (title, message, image_url, cta_label, cta_href, variant, delay_seconds, frequency, is_active, starts_at, ends_at, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [title, message, text(request.body?.imageUrl, 500) || null, text(request.body?.ctaLabel, 120) || null, text(request.body?.ctaHref, 500) || null, text(request.body?.variant, 40) || 'promo', Math.max(0, Number(request.body?.delaySeconds ?? 2)), text(request.body?.frequency, 24) || 'session', request.body?.isActive === false ? 0 : 1, request.body?.startsAt || null, request.body?.endsAt || null, Number(request.body?.sortOrder ?? 0)]);
    await deps.recordAudit(admin.id, 'popup.create', 'site_popup', null, { title });
    response.status(201).json({ ok: true });
  }));

  app.put('/api/admin/popups/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const body = request.body ?? {};
    const fields: Array<[string, unknown]> = [];
    const allowed: Record<string, string> = { title: 'title', message: 'message', imageUrl: 'image_url', ctaLabel: 'cta_label', ctaHref: 'cta_href', variant: 'variant', delaySeconds: 'delay_seconds', frequency: 'frequency', isActive: 'is_active', startsAt: 'starts_at', endsAt: 'ends_at', sortOrder: 'sort_order' };
    for (const [input, column] of Object.entries(allowed)) if (input in body) fields.push([column, input === 'isActive' ? (body[input] ? 1 : 0) : body[input] === '' ? null : body[input]]);
    if (!fields.length) { response.status(400).json({ error: 'empty_update', message: 'Nenhum campo alterado.' }); return; }
    await getPool().execute(`UPDATE site_popups SET ${fields.map(([column]) => `"${column}" = ?`).join(', ')}, updated_at = NOW() WHERE id = ?`, [...fields.map(([, value]) => value), Number(request.params.id)]);
    await deps.recordAudit(admin.id, 'popup.update', 'site_popup', String(request.params.id));
    response.json({ ok: true });
  }));

  app.delete('/api/admin/popups/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    await getPool().execute(`DELETE FROM site_popups WHERE id = ?`, [Number(request.params.id)]);
    response.status(204).end();
  }));

  app.get('/api/admin/comments', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const status = text(request.query.status, 24);
    const [rows] = await getPool().query<any[]>(`SELECT c.*, p.title AS post_title FROM blog_comments c LEFT JOIN content_posts p ON p.slug = c.post_slug ${status && status !== 'all' ? 'WHERE c.status = ?' : ''} ORDER BY c.created_at DESC LIMIT 200`, status && status !== 'all' ? [status] : []);
    response.json({ comments: rows });
  }));

  app.patch('/api/admin/comments/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const status = ['pending', 'approved', 'rejected'].includes(String(request.body?.status)) ? String(request.body.status) : '';
    if (!status) { response.status(400).json({ error: 'invalid_status', message: 'Estado inválido.' }); return; }
    const [[comment]] = await getPool().query<any[]>(`SELECT c.*, p.title AS post_title FROM blog_comments c LEFT JOIN content_posts p ON p.slug = c.post_slug WHERE c.id = ? LIMIT 1`, [Number(request.params.id)]);
    if (!comment) { response.status(404).json({ error: 'comment_not_found', message: 'Comentário não encontrado.' }); return; }
    await getPool().execute(`UPDATE blog_comments SET status = ?, updated_at = NOW() WHERE id = ?`, [status, comment.id]);
    if (status === 'approved') {
      await getPool().execute(`UPDATE content_posts SET comments_count = (SELECT COUNT(*) FROM blog_comments WHERE post_slug = ? AND status = 'approved') WHERE slug = ?`, [comment.post_slug, comment.post_slug]);
      if (comment.user_id) {
        const [[user]] = await getPool().query<any[]>(`SELECT id, name, email, phone FROM app_users WHERE id = ? LIMIT 1`, [comment.user_id]);
        await notifyCommentApproved(user ? { id: Number(user.id), name: user.name, email: user.email, phone: user.phone } : null, comment.post_title ?? comment.post_slug, comment.post_slug);
      }
    }
    await deps.recordAudit(admin.id, `comment.${status}`, 'blog_comment', String(comment.id));
    response.json({ ok: true });
  }));

  app.delete('/api/admin/comments/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    await getPool().execute(`DELETE FROM blog_comments WHERE id = ?`, [Number(request.params.id)]);
    response.status(204).end();
  }));

  app.get('/api/admin/contact-messages', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200`);
    response.json({ messages: rows });
  }));

  app.patch('/api/admin/contact-messages/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const status = ['new', 'read', 'replied', 'archived'].includes(String(request.body?.status)) ? String(request.body.status) : '';
    if (!status) { response.status(400).json({ error: 'invalid_status', message: 'Estado inválido.' }); return; }
    await getPool().execute(`UPDATE contact_messages SET status = ?, updated_at = NOW() WHERE id = ?`, [status, Number(request.params.id)]);
    response.json({ ok: true });
  }));

  // Configurações do site e integrações (administração)
  app.get('/api/admin/site-settings', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT setting_key, value_json, updated_at FROM site_settings`);
    const settings: Record<string, unknown> = {};
    for (const row of rows) settings[row.setting_key] = jsonValue(row.value_json, null);
    response.json({ settings });
  }));

  app.put('/api/admin/site-settings/:key', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const key = String(request.params.key);
    if (!ADMIN_SETTING_KEYS.has(key)) { response.status(400).json({ error: 'invalid_setting', message: 'Definição não permitida.' }); return; }
    if (key === 'exchange_rate') { response.status(400).json({ error: 'use_exchange_route', message: 'A taxa cambial é alterada na configuração de preços.' }); return; }
    if (typeof request.body?.value !== 'object' || request.body.value === null) { response.status(400).json({ error: 'invalid_value', message: 'Valor inválido.' }); return; }
    await saveSetting(key, request.body.value);
    invalidateSiteConfigCache();
    await deps.recordAudit(admin.id, 'site_setting.update', 'site_setting', key);
    response.json({ ok: true });
  }));

  app.get('/api/admin/integrations', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [site] = await Promise.all([getSiteConfig()]);
    response.json({
      email: { configured: emailConfigured(), host: process.env.SMTP_HOST ?? process.env.EMAIL_HOST ?? '', from: process.env.SMTP_FROM ?? process.env.EMAIL_FROM ?? '' },
      whatsapp: { configured: whatsappConfigured(), phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'configurado' : '', version: process.env.WHATSAPP_API_VERSION ?? 'v21.0' },
      sms: { configured: smsConfigured(), provider: process.env.TELCOSMS_API_KEY ? 'TelcoSMS' : '' },
      storage: { configured: Boolean(process.env.R2_ENDPOINT && process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY), bucket: process.env.R2_BUCKET ?? '' },
      freefire: { configured: Boolean(process.env.FREEFIRE_VERIFY_URL || process.env.RAPIDAPI_KEY), provider: (process.env.FREEFIRE_VERIFY_URL || process.env.RAPIDAPI_KEY) ? 'RapidAPI Free Fire' : '' },
      openai: { configured: Boolean(process.env.OPENAI_API_KEY) },
      site,
      publicUrl: publicSiteUrl(),
    });
  }));

  app.get('/api/admin/stats', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const days = Math.min(90, Math.max(7, Number(request.query.days ?? 30)));
    const [daily] = await getPool().query<any[]>(`SELECT to_char(d.day, 'YYYY-MM-DD') AS day, COALESCE(COUNT(o.id), 0) AS orders, COALESCE(SUM(o.total_aoa), 0) AS revenue FROM generate_series(CURRENT_DATE - (?::int - 1), CURRENT_DATE, '1 day') AS d(day) LEFT JOIN shop_orders o ON o.created_at::date = d.day AND o.status <> 'cancelled' GROUP BY d.day ORDER BY d.day ASC`, [days]);
    const [statusRows] = await getPool().query<any[]>(`SELECT status, COUNT(*) AS total, COALESCE(SUM(total_aoa), 0) AS revenue FROM shop_orders GROUP BY status`);
    const [topProducts] = await getPool().query<any[]>(`SELECT i.product_name, SUM(i.quantity) AS units, SUM(i.subtotal_aoa) AS revenue FROM shop_order_items i JOIN shop_orders o ON o.id = i.order_id WHERE o.status <> 'cancelled' GROUP BY i.product_name ORDER BY revenue DESC LIMIT 10`);
    const [[customers]] = await getPool().query<any[]>(`SELECT COUNT(*) AS total, COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) AS recent FROM app_users WHERE role = 'customer'`);
    const [[content]] = await getPool().query<any[]>(`SELECT (SELECT COUNT(*) FROM content_posts) AS posts, (SELECT COALESCE(SUM(views), 0) FROM content_posts) AS views, (SELECT COUNT(*) FROM blog_comments WHERE status = 'pending') AS pending_comments, (SELECT COUNT(*) FROM contact_messages WHERE status = 'new') AS new_messages`);
    const [topPosts] = await getPool().query<any[]>(`SELECT slug, title, views, comments_count FROM content_posts WHERE status = 'published' ORDER BY views DESC LIMIT 8`);
    const [[notifications]] = await getPool().query<any[]>(`SELECT (SELECT COUNT(*) FROM admin_notifications WHERE is_read = 0) AS unread_admin, (SELECT COUNT(*) FROM notification_deliveries WHERE created_at > NOW() - INTERVAL '30 days' AND status = 'sent') AS sent, (SELECT COUNT(*) FROM notification_deliveries WHERE created_at > NOW() - INTERVAL '30 days' AND status = 'failed') AS failed, (SELECT COUNT(*) FROM notification_deliveries WHERE created_at > NOW() - INTERVAL '30 days' AND status = 'not_configured') AS not_configured`);
    response.json({ daily, statuses: statusRows, topProducts, customers, content, topPosts, notifications });
  }));

  app.get('/api/admin/invoices', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT d.id, d.template, d.created_at, o.order_number, o.customer_name, o.total_aoa, o.status, u.name AS downloaded_by FROM invoice_downloads d JOIN shop_orders o ON o.id = d.order_id LEFT JOIN app_users u ON u.id = d.downloaded_by_user_id ORDER BY d.created_at DESC LIMIT 200`);
    response.json({ invoices: rows });
  }));

  app.get('/api/admin/orders/:orderNumber/notifications', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [[order]] = await getPool().query<any[]>(`SELECT id FROM shop_orders WHERE order_number = ? LIMIT 1`, [String(request.params.orderNumber)]);
    if (!order) { response.status(404).json({ error: 'order_not_found', message: 'Encomenda não encontrada.' }); return; }
    const [rows] = await getPool().query<any[]>(`SELECT id, event_key, channel, recipient, status, subject, error_message, sent_at, created_at FROM notification_deliveries WHERE order_id = ? ORDER BY created_at DESC LIMIT 100`, [order.id]);
    response.json({ notifications: rows });
  }));

  app.post('/api/admin/orders/:orderNumber/notifications/resend', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const [[order]] = await getPool().query<any[]>(`SELECT * FROM shop_orders WHERE order_number = ? LIMIT 1`, [String(request.params.orderNumber)]);
    if (!order) { response.status(404).json({ error: 'order_not_found', message: 'Encomenda não encontrada.' }); return; }
    const eventKey = text(request.body?.eventKey, 80) || 'order.status_changed';
    const channels = Array.isArray(request.body?.channels) ? request.body.channels.filter((channel: string) => ['email', 'whatsapp', 'in_app'].includes(channel)) : ['email', 'whatsapp', 'in_app'];
    const result = await dispatch({ eventKey, order: { id: Number(order.id), order_number: order.order_number, customer_name: order.customer_name, customer_email: order.customer_email, customer_phone: order.customer_phone, total_aoa: order.total_aoa, status: order.status, payment_method: order.payment_method, user_id: order.user_id }, channels });
    await deps.recordAudit(admin.id, 'order.notification_resend', 'shop_order', order.order_number, { eventKey, channels, result });
    response.json({ ok: true, result });
  }));

  // Administração de contas administrativas
  app.get('/api/admin/admins', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT id, name, email, phone, role, is_active, last_login_at, created_at FROM app_users WHERE role <> 'customer' ORDER BY role ASC, name ASC`);
    response.json({ admins: rows });
  }));

  app.post('/api/admin/admins', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    if (admin.role !== 'super_admin') { response.status(403).json({ error: 'forbidden', message: 'Apenas o Super Administrador pode criar administradores.' }); return; }
    const name = text(request.body?.name, 160);
    const email = text(request.body?.email, 255).toLowerCase();
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const role = ['admin', 'product_manager', 'order_manager', 'content_manager', 'support'].includes(String(request.body?.role)) ? String(request.body.role) : 'admin';
    if (name.length < 2 || !validEmail(email) || password.length < 6) { response.status(400).json({ error: 'invalid_admin', message: 'Nome, email válido e palavra-passe com 6 caracteres são obrigatórios.' }); return; }
    try {
      await getPool().execute(`INSERT INTO app_users (email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?)`, [email, await bcrypt.hash(password, 12), name, text(request.body?.phone, 40) || null, role]);
    } catch {
      response.status(409).json({ error: 'email_in_use', message: 'Já existe uma conta com este email.' }); return;
    }
    await deps.recordAudit(admin.id, 'admin.create', 'app_user', email, { role });
    response.status(201).json({ ok: true });
  }));

  app.put('/api/admin/admins/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    if (admin.role !== 'super_admin') { response.status(403).json({ error: 'forbidden', message: 'Apenas o Super Administrador pode alterar administradores.' }); return; }
    const id = Number(request.params.id);
    const [[target]] = await getPool().query<any[]>(`SELECT id, role FROM app_users WHERE id = ? LIMIT 1`, [id]);
    if (!target) { response.status(404).json({ error: 'admin_not_found', message: 'Administrador não encontrado.' }); return; }
    if (id === admin.id && request.body?.isActive === false) { response.status(400).json({ error: 'cannot_disable_self', message: 'Não pode desativar a sua própria conta.' }); return; }
    const fields: Array<[string, unknown]> = [];
    if (typeof request.body?.name === 'string') fields.push(['name', text(request.body.name, 160)]);
    if (typeof request.body?.phone === 'string') fields.push(['phone', text(request.body.phone, 40) || null]);
    if (typeof request.body?.role === 'string' && ['super_admin', 'admin', 'product_manager', 'order_manager', 'content_manager', 'support'].includes(request.body.role)) fields.push(['role', request.body.role]);
    if (typeof request.body?.isActive === 'boolean') fields.push(['is_active', request.body.isActive ? 1 : 0]);
    if (typeof request.body?.password === 'string' && request.body.password.length >= 6) fields.push(['password_hash', await bcrypt.hash(request.body.password, 12)]);
    if (!fields.length) { response.status(400).json({ error: 'empty_update', message: 'Nenhum campo alterado.' }); return; }
    await getPool().execute(`UPDATE app_users SET ${fields.map(([column]) => `"${column}" = ?`).join(', ')}, updated_at = NOW() WHERE id = ?`, [...fields.map(([, value]) => value), id]);
    await deps.recordAudit(admin.id, 'admin.update', 'app_user', String(id), { fields: fields.map(([column]) => column) });
    response.json({ ok: true });
  }));

  // Afiliados (administração)
  app.get('/api/admin/affiliates', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT a.*, u.name AS user_name, u.email AS user_email, (SELECT COUNT(*) FROM affiliate_referrals r WHERE r.affiliate_id = a.id) AS referral_count FROM affiliates a JOIN app_users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 200`);
    const [payouts] = await getPool().query<any[]>(`SELECT p.*, u.name AS user_name, a.code FROM affiliate_payouts p JOIN affiliates a ON a.id = p.affiliate_id JOIN app_users u ON u.id = a.user_id ORDER BY p.created_at DESC LIMIT 100`);
    response.json({ affiliates: rows, payouts });
  }));

  app.put('/api/admin/affiliates/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const fields: Array<[string, unknown]> = [];
    if (typeof request.body?.status === 'string' && ['active', 'suspended'].includes(request.body.status)) fields.push(['status', request.body.status]);
    if (Number.isFinite(Number(request.body?.commissionRate))) fields.push(['commission_rate', Math.max(0, Math.min(50, Number(request.body.commissionRate)))]);
    if (!fields.length) { response.status(400).json({ error: 'empty_update', message: 'Nenhum campo alterado.' }); return; }
    await getPool().execute(`UPDATE affiliates SET ${fields.map(([column]) => `"${column}" = ?`).join(', ')}, updated_at = NOW() WHERE id = ?`, [...fields.map(([, value]) => value), Number(request.params.id)]);
    await deps.recordAudit(admin.id, 'affiliate.update', 'affiliate', String(request.params.id));
    response.json({ ok: true });
  }));

  app.post('/api/admin/affiliates/:id/payouts', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const amount = Number(request.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) { response.status(400).json({ error: 'invalid_amount', message: 'Indique um valor de pagamento válido.' }); return; }
    const [[affiliate]] = await getPool().query<any[]>(`SELECT a.*, u.id AS user_id, u.name, u.email, u.phone FROM affiliates a JOIN app_users u ON u.id = a.user_id WHERE a.id = ? LIMIT 1`, [Number(request.params.id)]);
    if (!affiliate) { response.status(404).json({ error: 'affiliate_not_found', message: 'Afiliado não encontrado.' }); return; }
    if (amount > Number(affiliate.balance_aoa)) { response.status(400).json({ error: 'insufficient_balance', message: 'O valor excede o saldo disponível do afiliado.' }); return; }
    await getPool().execute(`INSERT INTO affiliate_payouts (affiliate_id, amount_aoa, method, reference, notes, status, created_by_user_id) VALUES (?, ?, ?, ?, ?, 'paid', ?)`, [affiliate.id, amount, text(request.body?.method, 80) || 'Transferência', text(request.body?.reference, 120) || null, text(request.body?.notes, 1000) || null, admin.id]);
    await getPool().execute(`UPDATE affiliates SET balance_aoa = balance_aoa - ?, total_paid_aoa = total_paid_aoa + ?, updated_at = NOW() WHERE id = ?`, [amount, amount, affiliate.id]);
    await dispatch({ eventKey: 'affiliate.payout', user: { id: Number(affiliate.user_id), name: affiliate.name, email: affiliate.email, phone: affiliate.phone }, variables: { payout_amount: `$${amount.toFixed(2)}` }, channels: ['email', 'in_app'] });
    await deps.recordAudit(admin.id, 'affiliate.payout', 'affiliate', String(affiliate.id), { amount });
    response.status(201).json({ ok: true });
  }));

}
