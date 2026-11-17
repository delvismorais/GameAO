import nodemailer, { type Transporter } from 'nodemailer';
import { getPool } from './db';

export type OrderStatus = 'awaiting_payment' | 'payment_verification' | 'payment_confirmed' | 'processing' | 'ready_for_delivery' | 'completed' | 'cancelled' | 'refunded';
export type NotificationChannel = 'email' | 'whatsapp' | 'sms' | 'in_app';
export type DeliveryStatus = 'sent' | 'failed' | 'not_configured' | 'skipped';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  awaiting_payment: 'A aguardar pagamento',
  payment_verification: 'Comprovativo em verificação',
  payment_confirmed: 'Pagamento confirmado',
  processing: 'Em processamento',
  ready_for_delivery: 'Pronta para entrega',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada',
};

const STATUS_EVENTS: Record<string, string> = {
  awaiting_payment: 'order.created',
  payment_verification: 'order.payment_proof_submitted',
  payment_confirmed: 'order.payment_confirmed',
  processing: 'order.processing',
  ready_for_delivery: 'order.ready_for_delivery',
  completed: 'order.completed',
  cancelled: 'order.cancelled',
  refunded: 'order.refunded',
};

export interface NotificationUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
}

export interface NotificationOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  total_aoa?: number | string | null;
  status?: string | null;
  payment_method?: string | null;
  user_id?: number | null;
  tracking_token?: string | null;
}

export interface DispatchInput {
  eventKey: string;
  variables?: Record<string, string | number | null | undefined>;
  user?: NotificationUser | null;
  order?: NotificationOrder | null;
  channels?: NotificationChannel[];
  link?: string | null;
  type?: string;
  adminRecipients?: boolean;
  entityType?: string | null;
  entityId?: string | null;
  level?: 'info' | 'success' | 'warning' | 'error';
}

export type DispatchResult = Partial<Record<NotificationChannel, DeliveryStatus>>;

let cachedSiteConfig: { value: SiteConfig; expires: number } | null = null;
interface SiteConfig { name: string; email: string; phone: string; whatsapp: string; location: string; supportHours?: string; tagline?: string }
const DEFAULT_SITE: SiteConfig = { name: 'GameAO', email: 'geral@gameao.shop', phone: '973 929 712', whatsapp: '244973929712', location: 'Luanda, Angola', tagline: 'A sua loja de videojogos em Angola.' };

export function publicSiteUrl(): string {
  const configured = process.env.PUBLIC_SITE_URL?.trim() || process.env.RENDER_EXTERNAL_URL?.trim();
  return (configured || 'https://gameao.onrender.com').replace(/\/$/, '');
}

export function emailConfigured(): boolean {
  return Boolean((process.env.SMTP_HOST || process.env.EMAIL_HOST) && (process.env.SMTP_USER || process.env.EMAIL_USER) && (process.env.SMTP_FROM || process.env.EMAIL_FROM) && (process.env.SMTP_PASSWORD || process.env.EMAIL_PASS));
}

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export function smsConfigured(): boolean {
  return Boolean(process.env.TELCOSMS_API_KEY?.trim() && (process.env.TELCOSMS_API_URL?.trim() || 'https://www.telcosms.co.ao/send_message'));
}

export async function getSiteConfig(): Promise<SiteConfig> {
  if (cachedSiteConfig && cachedSiteConfig.expires > Date.now()) return cachedSiteConfig.value;
  try {
    const [rows] = await getPool().query<any[]>(`SELECT value_json FROM site_settings WHERE setting_key = 'site_config' LIMIT 1`);
    const raw = rows[0]?.value_json;
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const merged = { ...DEFAULT_SITE, ...(value ?? {}) } as SiteConfig;
    cachedSiteConfig = { value: merged, expires: Date.now() + 60_000 };
    return merged;
  } catch {
    return DEFAULT_SITE;
  }
}

export function invalidateSiteConfigCache(): void { cachedSiteConfig = null; }

export function formatAoa(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  return `${new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0)} Kz`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const HTML_VARIABLES = new Set(['order_items', 'payment_instructions', 'site_url', 'order_link', 'admin_link', 'reset_link', 'comment_link', 'affiliate_link']);

export function renderTemplate(template: string, variables: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const raw = variables[key];
    if (raw === null || raw === undefined) return '';
    const text = String(raw);
    return HTML_VARIABLES.has(key) ? text : escapeHtml(text);
  });
}

export function normalizePhone(phone: string | null | undefined): string {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('244')) return digits;
  if (digits.length === 9 && digits.startsWith('9')) return `244${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `244${digits.slice(1)}`;
  return digits;
}

let transporter: Transporter | null = null;
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
      port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
      secure: (process.env.SMTP_SECURE || process.env.EMAIL_SECURE) === 'true',
      auth: (process.env.SMTP_USER || process.env.EMAIL_USER) ? { user: process.env.SMTP_USER || process.env.EMAIL_USER, pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASS } : undefined,
    });
  }
  return transporter;
}

export function emailLayout(content: string, title: string, site: SiteConfig): string {
  const base = publicSiteUrl();
  const logo = `${base}/assets/gameao-logo.png`;
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#eff2fa;font-family:Rubik,Arial,Helvetica,sans-serif;color:#182028;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff2fa;padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 12px 30px rgba(8,16,24,.12);">
<tr><td style="background:#00080f;padding:22px 28px;"><a href="${base}" style="text-decoration:none;display:inline-block;"><img src="${logo}" alt="${escapeHtml(site.name)}" width="150" height="58" style="display:block;border:0;"></a></td></tr>
<tr><td style="height:4px;background:#cd3d0f;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:30px 28px 24px;font-size:15px;line-height:1.65;color:#3c4852;">${content}</td></tr>
<tr><td style="padding:20px 28px;background:#f7f8fa;border-top:1px solid #e6e9ef;font-size:12px;line-height:1.6;color:#7d8893;">
<p style="margin:0 0 6px;font-weight:700;color:#182028;">${escapeHtml(site.name)}</p>
<p style="margin:0;">${escapeHtml(site.email)} · ${escapeHtml(site.phone)} · ${escapeHtml(site.location)}</p>
<p style="margin:8px 0 0;">Este email foi enviado automaticamente. Se não reconhece a operação, contacte-nos.</p>
</td></tr></table></td></tr></table></body></html>`;
}

async function getTemplate(eventKey: string, channel: NotificationChannel): Promise<{ subject: string; body: string } | null> {
  const [rows] = await getPool().query<any[]>(`SELECT subject, body FROM notification_templates WHERE event_key = ? AND channel = ? AND is_active = 1 LIMIT 1`, [eventKey, channel]);
  const row = rows[0];
  return row ? { subject: String(row.subject ?? ''), body: String(row.body ?? '') } : null;
}

async function logDelivery(input: { eventKey: string; channel: NotificationChannel; recipient: string; status: DeliveryStatus; subject?: string; providerMessageId?: string; error?: string; userId?: number | null; orderId?: number | null; payload?: unknown }): Promise<void> {
  try {
    await getPool().execute(
      `INSERT INTO notification_deliveries (event_key, channel, recipient, user_id, order_id, status, subject, provider_message_id, error_message, payload_json, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.eventKey, input.channel, input.recipient.slice(0, 255), input.userId ?? null, input.orderId ?? null, input.status, input.subject?.slice(0, 255) ?? null, input.providerMessageId ?? null, input.error ?? null, JSON.stringify(input.payload ?? {}), input.status === 'sent' ? new Date() : null],
    );
    if (input.orderId && input.channel !== 'in_app') {
      await getPool().execute(
        `INSERT INTO order_notifications (order_id, channel, recipient, event_type, status, provider_message_id, error_message, payload_json, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [input.orderId, input.channel, input.recipient, input.eventKey, input.status, input.providerMessageId ?? null, input.error ?? null, JSON.stringify(input.payload ?? {}), input.status === 'sent' ? new Date() : null],
      );
    }
  } catch (error) {
    console.error('[notifications] falha ao registar entrega', error instanceof Error ? error.message : error);
  }
}

async function sendEmail(input: { eventKey: string; to: string; subject: string; body: string; userId?: number | null; orderId?: number | null; site: SiteConfig }): Promise<DeliveryStatus> {
  if (!emailConfigured()) {
    await logDelivery({ eventKey: input.eventKey, channel: 'email', recipient: input.to, status: 'not_configured', subject: input.subject, error: 'SMTP não configurado.', userId: input.userId, orderId: input.orderId });
    return 'not_configured';
  }
  try {
    const info = await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || input.site.email,
      to: input.to,
      subject: input.subject,
      text: input.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      html: emailLayout(input.body, input.subject, input.site),
    });
    await logDelivery({ eventKey: input.eventKey, channel: 'email', recipient: input.to, status: 'sent', subject: input.subject, providerMessageId: info.messageId, userId: input.userId, orderId: input.orderId });
    return 'sent';
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Falha no envio SMTP.';
    await logDelivery({ eventKey: input.eventKey, channel: 'email', recipient: input.to, status: 'failed', subject: input.subject, error: reason, userId: input.userId, orderId: input.orderId });
    return 'failed';
  }
}

async function sendWhatsApp(input: { eventKey: string; to: string; body: string; userId?: number | null; orderId?: number | null }): Promise<DeliveryStatus> {
  const phone = normalizePhone(input.to);
  if (!phone) return 'skipped';
  if (!whatsappConfigured()) {
    await logDelivery({ eventKey: input.eventKey, channel: 'whatsapp', recipient: phone, status: 'not_configured', error: 'WhatsApp Business API não configurada.', userId: input.userId, orderId: input.orderId });
    return 'not_configured';
  }
  try {
    const version = process.env.WHATSAPP_API_VERSION ?? 'v21.0';
    const result = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: phone, type: 'text', text: { preview_url: true, body: input.body.slice(0, 4096) } }),
    });
    const data = await result.json() as { messages?: Array<{ id?: string }>; error?: { message?: string } };
    if (!result.ok) throw new Error(data.error?.message ?? `WhatsApp API HTTP ${result.status}`);
    await logDelivery({ eventKey: input.eventKey, channel: 'whatsapp', recipient: phone, status: 'sent', providerMessageId: data.messages?.[0]?.id, userId: input.userId, orderId: input.orderId });
    return 'sent';
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Falha no envio WhatsApp.';
    await logDelivery({ eventKey: input.eventKey, channel: 'whatsapp', recipient: phone, status: 'failed', error: reason, userId: input.userId, orderId: input.orderId });
    return 'failed';
  }
}

async function sendSms(input: { eventKey: string; to: string; body: string; userId?: number | null; orderId?: number | null }): Promise<DeliveryStatus> {
  const phone = normalizePhone(input.to);
  if (!phone) return 'skipped';
  if (!smsConfigured()) {
    await logDelivery({ eventKey: input.eventKey, channel: 'sms', recipient: phone, status: 'not_configured', error: 'TelcoSMS não configurado.', userId: input.userId, orderId: input.orderId });
    return 'not_configured';
  }
  try {
    const message = input.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
    const endpoint = process.env.TELCOSMS_API_URL?.trim() || 'https://www.telcosms.co.ao/send_message';
    const result = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain' }, body: JSON.stringify({ message: { api_key_app: process.env.TELCOSMS_API_KEY, phone_number: phone, message_body: message } }), signal: AbortSignal.timeout(15000) });
    const raw = await result.text();
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { /* alguns gateways devolvem texto */ }
    const providerError = data?.success === false || data?.status === false || data?.error || data?.errors || /^\s*(error|failed|failure)\b/i.test(raw);
    if (!result.ok || providerError) throw new Error(String(data?.message ?? data?.error?.message ?? (raw.slice(0, 300) || `TelcoSMS HTTP ${result.status}`)));
    const providerMessageId = String(data?.message_id ?? data?.messageId ?? data?.id ?? '').trim() || undefined;
    await logDelivery({ eventKey: input.eventKey, channel: 'sms', recipient: phone, status: 'sent', providerMessageId, userId: input.userId, orderId: input.orderId, payload: { response: raw.slice(0, 500) } });
    return 'sent';
  } catch (error) {
    await logDelivery({ eventKey: input.eventKey, channel: 'sms', recipient: phone, status: 'failed', error: error instanceof Error ? error.message : 'Falha no envio SMS.', userId: input.userId, orderId: input.orderId });
    return 'failed';
  }
}

export async function createUserNotification(input: { userId: number; eventKey: string; title: string; message: string; link?: string | null; type?: string; orderId?: number | null }): Promise<boolean> {
  try {
    await getPool().execute(
      `INSERT INTO user_notifications (user_id, order_id, event_key, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [input.userId, input.orderId ?? null, input.eventKey, input.type ?? 'info', input.title.slice(0, 200), input.message, input.link ?? null],
    );
    return true;
  } catch (error) {
    console.error('[notifications] falha ao criar notificação interna', error instanceof Error ? error.message : error);
    return false;
  }
}

export async function createAdminNotification(input: { title: string; message: string; level?: string; link?: string | null; eventKey?: string | null; entityType?: string | null; entityId?: string | null; userId?: number | null }): Promise<void> {
  try {
    await getPool().execute(
      `INSERT INTO admin_notifications (title, message, level, link, event_key, entity_type, entity_id, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.title.slice(0, 180), input.message, input.level ?? 'info', input.link ?? null, input.eventKey ?? null, input.entityType ?? null, input.entityId ?? null, input.userId ?? null],
    );
  } catch (error) {
    console.error('[notifications] falha ao criar alerta administrativo', error instanceof Error ? error.message : error);
  }
}

async function adminRecipients(): Promise<string[]> {
  const recipients = new Set<string>();
  for (const email of String(process.env.GAMEAO_ADMIN_EMAIL ?? '').split(',').map((item) => item.trim()).filter(Boolean)) recipients.add(email.toLowerCase());
  try {
    const [rows] = await getPool().query<any[]>(`SELECT email FROM app_users WHERE role IN ('super_admin', 'admin') AND is_active = 1 LIMIT 20`);
    for (const row of rows) recipients.add(String(row.email).toLowerCase());
  } catch { /* sem base de dados: usa apenas o email de ambiente */ }
  return [...recipients];
}

async function userPreferences(userId: number | null | undefined): Promise<{ email: boolean; whatsapp: boolean; inApp: boolean }> {
  if (!userId) return { email: true, whatsapp: true, inApp: true };
  try {
    const [rows] = await getPool().query<any[]>(`SELECT notification_preferences_json FROM app_users WHERE id = ? LIMIT 1`, [userId]);
    const raw = rows[0]?.notification_preferences_json;
    const prefs = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return { email: prefs?.email !== false, whatsapp: prefs?.whatsapp !== false, inApp: prefs?.inApp !== false };
  } catch {
    return { email: true, whatsapp: true, inApp: true };
  }
}

export async function dispatch(input: DispatchInput): Promise<DispatchResult> {
  const site = await getSiteConfig();
  const base = publicSiteUrl();
  const isAdminEvent = input.eventKey.startsWith('admin.') || input.adminRecipients === true;
  const user = input.user ?? (input.order?.user_id ? { id: Number(input.order.user_id), name: input.order.customer_name, email: input.order.customer_email, phone: input.order.customer_phone } : null);
  const variables: Record<string, string | number | null | undefined> = {
    site_name: site.name,
    site_url: base,
    site_email: site.email,
    site_phone: site.phone,
    customer_name: user?.name ?? input.order?.customer_name ?? 'cliente',
    customer_email: user?.email ?? input.order?.customer_email ?? '',
    customer_phone: user?.phone ?? input.order?.customer_phone ?? '',
    order_number: input.order?.order_number ?? '',
    order_total: formatAoa(input.order?.total_aoa),
    order_status: ORDER_STATUS_LABELS[String(input.order?.status ?? '')] ?? String(input.order?.status ?? ''),
    order_link: input.order?.order_number ? `${base}/pedido?order=${encodeURIComponent(input.order.order_number)}${input.order.tracking_token ? `&token=${encodeURIComponent(input.order.tracking_token)}` : ''}` : base,
    payment_method: input.order?.payment_method ?? '',
    admin_link: `${base}/admin`,
    affiliate_link: `${base}/afiliados`,
    reset_minutes: '60',
    ...input.variables,
  };
  const channels: NotificationChannel[] = input.channels ?? (isAdminEvent ? ['in_app', 'email'] : ['email', 'whatsapp', 'sms', 'in_app']);
  const prefs = await userPreferences(user?.id);
  const result: DispatchResult = {};
  const orderId = input.order?.id ?? null;

  for (const channel of channels) {
    if (channel === 'sms') {
      const recipient = user?.phone ?? '';
      if (!recipient) { result.sms = 'skipped'; continue; }
      const smsTemplate = await getTemplate(input.eventKey, 'whatsapp') ?? await getTemplate(input.eventKey, 'email');
      if (!smsTemplate) { result.sms = 'skipped'; continue; }
      result.sms = await sendSms({ eventKey: input.eventKey, to: recipient, body: renderTemplate(smsTemplate.body, variables), userId: user?.id, orderId });
      continue;
    }
    const template = await getTemplate(input.eventKey, channel);
    if (!template) { result[channel] = 'skipped'; continue; }
    const subject = renderTemplate(template.subject, variables);
    const body = renderTemplate(template.body, variables);
    if (channel === 'in_app') {
      if (isAdminEvent) {
        await createAdminNotification({ title: subject || template.body.slice(0, 80), message: body, level: input.level ?? 'info', link: input.link ?? null, eventKey: input.eventKey, entityType: input.entityType, entityId: input.entityId });
        result.in_app = 'sent';
      } else if (user?.id && prefs.inApp) {
        const created = await createUserNotification({ userId: user.id, eventKey: input.eventKey, title: subject || 'Notificação GameAO', message: body, link: input.link ?? (variables.order_link ? String(variables.order_link) : null), type: input.type ?? 'info', orderId });
        result.in_app = created ? 'sent' : 'failed';
      } else {
        result.in_app = 'skipped';
      }
      continue;
    }
    if (channel === 'email') {
      if (isAdminEvent) {
        const recipients = await adminRecipients();
        let status: DeliveryStatus = recipients.length ? 'sent' : 'skipped';
        for (const to of recipients) {
          const sent = await sendEmail({ eventKey: input.eventKey, to, subject, body, orderId, site });
          if (sent !== 'sent') status = sent;
        }
        result.email = status;
        continue;
      }
      const recipient = user?.email ?? '';
      if (!recipient || !prefs.email) { result.email = 'skipped'; continue; }
      result.email = await sendEmail({ eventKey: input.eventKey, to: recipient, subject, body, userId: user?.id, orderId, site });
      continue;
    }
    if (channel === 'whatsapp') {
      const recipient = user?.phone ?? '';
      if (!recipient || !prefs.whatsapp) { result.whatsapp = 'skipped'; continue; }
      result.whatsapp = await sendWhatsApp({ eventKey: input.eventKey, to: recipient, body, userId: user?.id, orderId });
    }
  }
  return result;
}

export function orderVariables(order: NotificationOrder & { items?: Array<{ product_name: string; quantity: number; subtotal_aoa: number | string; player_id?: string | null; player_nickname?: string | null }> }): Record<string, string> {
  const items = order.items ?? [];
  const list = items.length
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item.product_name)} × ${Number(item.quantity)}${item.player_id ? ` — ID: ${escapeHtml(item.player_id)}${item.player_nickname ? ` (${escapeHtml(item.player_nickname)})` : ''}` : ''} — ${formatAoa(item.subtotal_aoa)}</li>`).join('')}</ul>`
    : '';
  return { order_items: list };
}

export async function notifyOrderStatusChanged(order: NotificationOrder, status: string, extras?: Record<string, string | number | null | undefined>): Promise<DispatchResult> {
  const eventKey = STATUS_EVENTS[status] ?? 'order.created';
  return dispatch({
    eventKey,
    order: { ...order, status },
    variables: { ...extras },
    channels: ['email', 'whatsapp', 'sms', 'in_app'],
  });
}

export async function notifyOrderCreated(order: NotificationOrder & { items?: Array<{ product_name: string; quantity: number; subtotal_aoa: number | string }> }, paymentInstructions = ''): Promise<DispatchResult> {
  const variables = orderVariables(order);
  variables.payment_instructions = paymentInstructions ? `<p>${escapeHtml(paymentInstructions)}</p>` : '';
  const result = await dispatch({ eventKey: 'order.created', order, variables, channels: ['email', 'whatsapp', 'sms', 'in_app'] });
  await dispatch({ eventKey: 'admin.new_order', order, variables, channels: ['in_app', 'email'], entityType: 'shop_order', entityId: order.order_number });
  return result;
}

export async function notifyPaymentProofSubmitted(order: NotificationOrder): Promise<DispatchResult> {
  const result = await dispatch({ eventKey: 'order.payment_proof_submitted', order: { ...order, status: 'payment_verification' }, channels: ['email', 'in_app'] });
  await dispatch({ eventKey: 'admin.payment_proof', order, channels: ['in_app', 'email'], entityType: 'shop_order', entityId: order.order_number });
  return result;
}

export async function notifyPaymentReview(order: NotificationOrder, action: 'approve' | 'reject' | 'request_new', note?: string | null): Promise<DispatchResult> {
  const eventKey = action === 'approve' ? 'order.payment_confirmed' : action === 'reject' ? 'order.payment_rejected' : 'order.payment_proof_requested';
  return dispatch({ eventKey, order: { ...order, status: action === 'approve' ? 'payment_confirmed' : 'awaiting_payment' }, variables: { admin_note: note ?? '' }, channels: ['email', 'whatsapp', 'sms', 'in_app'] });
}

export async function notifyUserWelcome(user: NotificationUser): Promise<DispatchResult> {
  return dispatch({ eventKey: 'user.welcome', user, channels: ['email', 'in_app'] });
}

export async function notifyPasswordReset(user: NotificationUser, token: string): Promise<DispatchResult> {
  return dispatch({ eventKey: 'user.password_reset', user, variables: { reset_link: `${publicSiteUrl()}/my-account?reset=${encodeURIComponent(token)}` }, channels: ['email'] });
}

export async function notifyContactMessage(input: { name: string; email: string; message: string }): Promise<void> {
  await dispatch({ eventKey: 'admin.contact_message', variables: { contact_name: input.name, contact_email: input.email, contact_message: input.message }, channels: ['in_app', 'email'], entityType: 'contact_message' });
}

export async function notifyCommentPending(input: { name: string; postTitle: string; excerpt: string; postSlug: string }): Promise<void> {
  await dispatch({ eventKey: 'blog.comment_pending', variables: { customer_name: input.name, post_title: input.postTitle, comment_excerpt: input.excerpt }, channels: ['in_app'], entityType: 'blog_comment', entityId: input.postSlug, link: `/blog/${input.postSlug}` });
}

export async function notifyCommentApproved(user: NotificationUser | null, postTitle: string, postSlug: string): Promise<void> {
  if (!user) return;
  await dispatch({ eventKey: 'blog.comment_approved', user, variables: { post_title: postTitle, comment_link: `${publicSiteUrl()}/blog/${postSlug}` }, channels: ['email', 'in_app'] });
}

export async function notifyAffiliateJoined(user: NotificationUser, code: string, rate: number): Promise<void> {
  await dispatch({ eventKey: 'affiliate.joined', user, variables: { affiliate_code: code, commission_rate: rate }, channels: ['email', 'in_app'] });
}

export async function notifyAffiliateCommission(user: NotificationUser, commission: number, orderNumber: string): Promise<void> {
  await dispatch({ eventKey: 'affiliate.commission', user, variables: { commission: formatAoa(commission), order_number: orderNumber }, channels: ['email', 'in_app'] });
}

export async function notifyAffiliatePayout(user: NotificationUser, amount: number): Promise<void> {
  await dispatch({ eventKey: 'affiliate.payout', user, variables: { payout_amount: formatAoa(amount) }, channels: ['email', 'in_app'] });
}

export async function notifyLowStock(product: { id: string; name: string; stock_quantity: number }): Promise<void> {
  await dispatch({ eventKey: 'admin.low_stock', variables: { product_name: product.name, stock_quantity: product.stock_quantity }, channels: ['in_app', 'email'], entityType: 'product', entityId: product.id, level: 'warning' });
}

export async function sendTestNotification(eventKey: string, channel: NotificationChannel, to: string): Promise<{ status: DeliveryStatus; error?: string }> {
  const site = await getSiteConfig();
  const template = await getTemplate(eventKey, channel) ?? (channel === 'sms' ? await getTemplate(eventKey, 'whatsapp') ?? await getTemplate(eventKey, 'email') : null);
  if (!template) return { status: 'skipped', error: 'Modelo não encontrado para este evento e canal.' };
  const variables = {
    site_name: site.name, site_url: publicSiteUrl(), customer_name: 'Cliente GameAO', customer_email: to,
    order_number: 'GA0', order_total: formatAoa(1000), order_status: 'Em processamento', order_items: '<ul><li>Produto de teste × 1 — $1.00</li></ul>',
    order_link: `${publicSiteUrl()}/pedido?order=GA0`, payment_method: 'Teste', payment_instructions: 'Instruções de teste.',
    reset_link: `${publicSiteUrl()}/my-account`, reset_minutes: '60', admin_link: `${publicSiteUrl()}/admin`, affiliate_code: 'GA-TESTE', commission_rate: '5', commission: formatAoa(50),
    comment_link: `${publicSiteUrl()}/category/news`, post_title: 'Artigo de teste', comment_excerpt: 'Comentário de teste.', contact_name: 'Teste', contact_email: to, contact_message: 'Mensagem de teste.', admin_note: '', product_name: 'Produto de teste', stock_quantity: '2', payout_amount: formatAoa(100),
  };
  const subject = renderTemplate(template.subject || 'Notificação de teste GameAO', variables);
  const body = renderTemplate(template.body, variables);
  if (channel === 'email') return { status: await sendEmail({ eventKey, to, subject, body, site }) };
  if (channel === 'whatsapp') return { status: await sendWhatsApp({ eventKey, to, body }) };
  if (channel === 'sms') return { status: await sendSms({ eventKey, to, body }) };
  await createAdminNotification({ title: `Teste de notificação: ${subject}`, message: body, level: 'info', eventKey });
  return { status: 'sent' };
}
