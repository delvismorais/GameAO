import nodemailer, { type Transporter } from 'nodemailer';
import { getPool, type DbConnection } from './db';
import { getKnownResendEmailStatus } from './resend-events';

export type OrderStatus = 'awaiting_payment' | 'payment_verification' | 'payment_confirmed' | 'processing' | 'ready_for_delivery' | 'completed' | 'cancelled' | 'refunded';
export type NotificationChannel = 'email' | 'whatsapp' | 'sms' | 'in_app';
export type DeliveryStatus = 'sent' | 'accepted' | 'delivered' | 'delayed' | 'bounced' | 'complained' | 'suppressed' | 'failed' | 'not_configured' | 'skipped';
type EmailSendResult = { status: DeliveryStatus; providerMessageId?: string };

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

interface InlineEmailAsset { filename: string; content: Buffer; contentType: string; contentId: string }

async function readPublicEmailImage(src: string, base: string, contentId: string): Promise<InlineEmailAsset | null> {
  try {
    const parsed = new URL(src, base);
    if (parsed.origin !== new URL(base).origin || !parsed.pathname.startsWith('/assets/')) return null;
    const [{ readFile, stat }, pathModule] = await Promise.all([import('node:fs/promises'), import('node:path')]);
    const publicRoot = pathModule.resolve(process.cwd(), 'public');
    const relativePath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    const filePath = pathModule.resolve(publicRoot, relativePath);
    if (!filePath.startsWith(`${publicRoot}${pathModule.sep}`)) return null;
    const info = await stat(filePath);
    if (!info.isFile() || info.size > 3 * 1024 * 1024) return null;
    const extension = pathModule.extname(filePath).toLowerCase();
    const contentType = ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' } as Record<string, string>)[extension];
    if (!contentType) return null;
    return { filename: pathModule.basename(filePath), content: await readFile(filePath), contentType, contentId };
  } catch {
    return null;
  }
}

export async function prepareEmailImages(content: string, base: string): Promise<{ body: string; assets: InlineEmailAsset[] }> {
  const normalized = content.replace(/\{\{\s*site_url\s*\}\}/g, base);
  const assets = new Map<string, InlineEmailAsset>();
  const logo = await readPublicEmailImage(`${base}/assets/gameao-logo.png`, base, 'gameao-logo');
  if (logo) {
    assets.set(logo.contentId, logo);
    assets.set(new URL(`${base}/assets/gameao-logo.png`).toString(), logo);
  }
  let imageIndex = 0;
  let anchorDepth = 0;
  let cursor = 0;
  let body = '';
  const tokens = [...normalized.matchAll(/<a\b[^>]*>|<\/a\s*>|<img\b[^>]*>/gi)];
  for (const match of tokens) {
    const token = match[0];
    const start = match.index ?? 0;
    body += normalized.slice(cursor, start);
    cursor = start + token.length;
    if (/^<a\b/i.test(token)) { anchorDepth += 1; body += token; continue; }
    if (/^<\/a/i.test(token)) { anchorDepth = Math.max(0, anchorDepth - 1); body += token; continue; }

    let image = token;
    const source = image.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
    if (source) {
      try {
        const resolved = new URL(source[2], base);
        if (resolved.protocol === 'http:') resolved.protocol = 'https:';
        const allowedProtocol = ['https:', 'cid:', 'data:'].includes(resolved.protocol);
        const absoluteSrc = (allowedProtocol ? resolved : new URL('/assets/gameao-logo.png', base)).toString();
        const assetId = `gameao-email-image-${imageIndex + 1}`;
        let asset = assets.get(absoluteSrc);
        if (!asset) {
          asset = await readPublicEmailImage(absoluteSrc, base, assetId) ?? undefined;
          if (asset) { assets.set(absoluteSrc, asset); imageIndex += 1; }
        }
        const displaySrc = asset ? `cid:${asset.contentId}` : absoluteSrc;
        const fallback = asset ? ` data-fallback-src="${escapeHtml(absoluteSrc)}"` : '';
        image = image.replace(source[0], `src="${escapeHtml(displaySrc)}"${fallback}`);
      } catch { /* keep malformed or non-URL image source unchanged */ }
    }
    if (!/\balt\s*=/i.test(image)) image = image.replace(/<img\b/i, '<img alt="Imagem GameAO"');
    if (!/\bborder\s*=/i.test(image)) image = image.replace(/<img\b/i, '<img border="0"');
    body += anchorDepth > 0 ? image : `<a href="${escapeHtml(`${base}/shop`)}" target="_blank" style="display:block;text-decoration:none;">${image}</a>`;
  }
  body += normalized.slice(cursor);
  return { body, assets: [...new Map([...assets.values()].map((asset) => [asset.contentId, asset])).values()] };
}

export function renderTemplate(template: string, variables: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const raw = variables[key];
    if (raw === null || raw === undefined) return '';
    const text = String(raw);
    return HTML_VARIABLES.has(key) ? text : escapeHtml(text);
  });
}

function renderPlainTemplate(template: string, variables: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value == null ? '' : String(value);
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
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

export function emailLayout(content: string, title: string, site: SiteConfig, logoSrc?: string): string {
  const base = publicSiteUrl();
  const logo = logoSrc || `${base}/assets/gameao-logo.png`;
  const tagline = site.tagline?.trim() || 'A sua loja de videojogos em Angola.';
  const phoneDigits = normalizePhone(site.whatsapp || site.phone);
  const emailHref = `mailto:${site.email.trim()}`;
  const phoneHref = phoneDigits ? `tel:+${phoneDigits}` : `tel:${encodeURIComponent(site.phone)}`;
  const whatsappHref = phoneDigits ? `https://wa.me/${phoneDigits}` : '';
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#eff2fa;font-family:Arial,Helvetica,sans-serif;color:#182028;">
<table role="presentation" border="0" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:#eff2fa;border-collapse:collapse;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" border="0" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-collapse:collapse;">
<tr><td style="background:#00080f;padding:18px 24px;"><a href="${escapeHtml(base)}" style="text-decoration:none;display:inline-block;"><img src="${escapeHtml(logo)}" alt="${escapeHtml(site.name)}" width="150" style="display:block;width:150px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;"></a></td></tr>
<tr><td height="4" style="height:4px;background:#cd3d0f;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:28px 24px 26px;font-size:15px;line-height:1.65;color:#3c4852;">${content}</td></tr>
<tr><td style="padding:20px 24px;background:#f7f8fa;border-top:1px solid #e6e9ef;font-size:12px;line-height:1.6;color:#66717d;">
<p style="margin:0 0 6px;font-weight:700;color:#182028;">${escapeHtml(site.name)}</p>
<p style="margin:0 0 8px;">${escapeHtml(tagline)}</p>
<p style="margin:0;"><a href="${escapeHtml(emailHref)}" style="color:#cd3d0f;text-decoration:none;">${escapeHtml(site.email)}</a> · <a href="${escapeHtml(phoneHref)}" style="color:#cd3d0f;text-decoration:none;">${escapeHtml(site.phone)}</a>${whatsappHref ? ` · <a href="${escapeHtml(whatsappHref)}" style="color:#cd3d0f;text-decoration:none;">WhatsApp</a>` : ''} · ${escapeHtml(site.location)}</p>
<p style="margin:14px 0 0;color:#3c4852;">Atenciosamente,<br><strong>Equipa ${escapeHtml(site.name)}</strong></p>
<p style="margin:10px 0 0;">Este email foi enviado automaticamente. Se não reconhecer a operação, fale com a nossa equipa.</p>
</td></tr></table></td></tr></table></body></html>`;
}

async function getTemplate(eventKey: string, channel: NotificationChannel): Promise<{ subject: string; body: string } | null> {
  if (channel === 'email') {
    const [automatedRows] = await getPool().query<any[]>(`SELECT subject, body FROM notification_templates WHERE automatic_event_key = ? AND channel = 'email' AND is_active = 1 LIMIT 1`, [eventKey]);
    const automatedRow = automatedRows[0];
    if (automatedRow) return { subject: String(automatedRow.subject ?? ''), body: String(automatedRow.body ?? '') };
  }
  const [rows] = await getPool().query<any[]>(`SELECT subject, body FROM notification_templates WHERE event_key = ? AND channel = ? AND is_active = 1 LIMIT 1`, [eventKey, channel]);
  const row = rows[0];
  return row ? { subject: String(row.subject ?? ''), body: String(row.body ?? '') } : null;
}

async function logDelivery(input: { eventKey: string; channel: NotificationChannel; recipient: string; status: DeliveryStatus; subject?: string; providerMessageId?: string; error?: string; userId?: number | null; orderId?: number | null; payload?: unknown }): Promise<DeliveryStatus> {
  try {
    let status = input.status;
    let error = input.error;
    if (input.channel === 'email' && status === 'accepted' && input.providerMessageId && process.env.RESEND_WEBHOOK_SECRET?.trim()) {
      try {
        const known = await getKnownResendEmailStatus(input.providerMessageId);
        if (known) { status = known.status; error = known.errorMessage ?? undefined; }
      } catch { /* não atrasar nem perder o registo se a reconciliação ainda não estiver disponível */ }
    }
    await getPool().execute(
      `INSERT INTO notification_deliveries (event_key, channel, recipient, user_id, order_id, status, subject, provider_message_id, error_message, payload_json, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.eventKey, input.channel, input.recipient.slice(0, 255), input.userId ?? null, input.orderId ?? null, status, input.subject?.slice(0, 255) ?? null, input.providerMessageId ?? null, error ?? null, JSON.stringify(input.payload ?? {}), ['sent', 'accepted', 'delivered'].includes(status) ? new Date() : null],
    );
    if (input.orderId && input.channel !== 'in_app') {
      await getPool().execute(
        `INSERT INTO order_notifications (order_id, channel, recipient, event_type, status, provider_message_id, error_message, payload_json, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [input.orderId, input.channel, input.recipient, input.eventKey, status, input.providerMessageId ?? null, error ?? null, JSON.stringify(input.payload ?? {}), ['sent', 'accepted', 'delivered'].includes(status) ? new Date() : null],
      );
    }
    return status;
  } catch (error) {
    console.error('[notifications] falha ao registar entrega', error instanceof Error ? error.message : error);
    return input.status;
  }
}

async function sendEmail(input: { eventKey: string; to: string; subject: string; body: string; userId?: number | null; orderId?: number | null; site: SiteConfig }): Promise<EmailSendResult> {
  if (!emailConfigured()) {
    await logDelivery({ eventKey: input.eventKey, channel: 'email', recipient: input.to, status: 'not_configured', subject: input.subject, error: 'SMTP não configurado.', userId: input.userId, orderId: input.orderId });
    return { status: 'not_configured' };
  }
  try {
    const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || input.site.email;
    const text = input.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const base = publicSiteUrl();
    const prepared = await prepareEmailImages(input.body, base);
    const logoSrc = prepared.assets.some((asset) => asset.contentId === 'gameao-logo') ? 'cid:gameao-logo' : undefined;
    const html = emailLayout(prepared.body, input.subject, input.site, logoSrc);
    const resendAttachments = prepared.assets.map((asset) => ({ filename: asset.filename, content: asset.content.toString('base64'), content_type: asset.contentType, content_id: asset.contentId }));
    const smtpAttachments = prepared.assets.map((asset) => ({ filename: asset.filename, content: asset.content, contentType: asset.contentType, cid: asset.contentId }));
    const smtpHost = (process.env.SMTP_HOST || process.env.EMAIL_HOST || '').trim().toLowerCase();
    let providerMessageId: string;

    if (smtpHost === 'smtp.resend.com') {
      // Render Free blocks outbound SMTP ports (25/465/587); Resend accepts the same API key over HTTPS.
      const apiKey = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS;
      if (!apiKey) throw new Error('Chave API do Resend não configurada.');
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [input.to], subject: input.subject, text, html, ...(resendAttachments.length ? { attachments: resendAttachments } : {}) }),
        signal: AbortSignal.timeout(15_000),
      });
      const responseText = await response.text();
      let result: { id?: string; message?: string; name?: string; error?: string } = {};
      try { result = JSON.parse(responseText) as typeof result; } catch { /* preserve HTTP status in the diagnostic below */ }
      if (!response.ok) {
        throw new Error(`Resend API HTTP ${response.status}: ${result.message || result.error || result.name || responseText.slice(0, 300) || 'erro sem detalhe'}`);
      }
      if (!result.id) throw new Error('Resend API aceitou a chamada sem devolver o identificador da mensagem.');
      providerMessageId = result.id;
    } else {
      const info = await getTransporter().sendMail({ from, to: input.to, subject: input.subject, text, html, attachments: smtpAttachments });
      providerMessageId = info.messageId;
    }

    const status = await logDelivery({ eventKey: input.eventKey, channel: 'email', recipient: input.to, status: 'accepted', subject: input.subject, providerMessageId, userId: input.userId, orderId: input.orderId });
    return { status, providerMessageId };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Falha no envio SMTP.';
    await logDelivery({ eventKey: input.eventKey, channel: 'email', recipient: input.to, status: 'failed', subject: input.subject, error: reason, userId: input.userId, orderId: input.orderId });
    return { status: 'failed' };
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
      signal: AbortSignal.timeout(12_000),
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
  const message = input.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (message.length > 160) {
    await logDelivery({ eventKey: input.eventKey, channel: 'sms', recipient: phone, status: 'failed', error: 'A mensagem SMS excede o limite de 160 caracteres.', userId: input.userId, orderId: input.orderId });
    return 'failed';
  }
  try {
    const endpoint = process.env.TELCOSMS_API_URL?.trim() || 'https://telcosms.co.ao/send_message';
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
  const orderId = input.order?.id ?? null;
  const entries = await Promise.all(channels.map(async (channel): Promise<[NotificationChannel, DeliveryStatus]> => {
    if (channel === 'sms') {
      const recipient = user?.phone ?? '';
      if (!recipient) return ['sms', 'skipped'];
      const smsTemplate = await getTemplate(input.eventKey, 'sms');
      if (!smsTemplate) return ['sms', 'skipped'];
      return ['sms', await sendSms({ eventKey: input.eventKey, to: recipient, body: renderPlainTemplate(smsTemplate.body, variables), userId: user?.id, orderId })];
    }
    const template = await getTemplate(input.eventKey, channel);
    if (!template) return [channel, 'skipped'];
    const subject = renderTemplate(template.subject, variables);
    const body = renderTemplate(template.body, variables);
    if (channel === 'in_app') {
      if (isAdminEvent) {
        await createAdminNotification({ title: subject || template.body.slice(0, 80), message: body, level: input.level ?? 'info', link: input.link ?? null, eventKey: input.eventKey, entityType: input.entityType, entityId: input.entityId });
        return ['in_app', 'sent'];
      } else if (user?.id && prefs.inApp) {
        const created = await createUserNotification({ userId: user.id, eventKey: input.eventKey, title: subject || 'Notificação GameAO', message: body, link: input.link ?? (variables.order_link ? String(variables.order_link) : null), type: input.type ?? 'info', orderId });
        return ['in_app', created ? 'sent' : 'failed'];
      }
      return ['in_app', 'skipped'];
    }
    if (channel === 'email') {
      if (isAdminEvent) {
        const recipients = await adminRecipients();
        if (!recipients.length) return ['email', 'skipped'];
        const statuses = (await Promise.all(recipients.map((to) => sendEmail({ eventKey: input.eventKey, to, subject, body, orderId, site })))).map((result) => result.status);
        const status: DeliveryStatus = statuses.includes('failed') || statuses.includes('bounced') || statuses.includes('suppressed') ? 'failed' : statuses.includes('complained') ? 'complained' : statuses.includes('delayed') ? 'delayed' : statuses.includes('delivered') ? 'delivered' : statuses.includes('accepted') ? 'accepted' : statuses.includes('not_configured') ? 'not_configured' : 'skipped';
        return ['email', status];
      }
      const recipient = user?.email ?? '';
      if (!recipient || !prefs.email) return ['email', 'skipped'];
      return ['email', (await sendEmail({ eventKey: input.eventKey, to: recipient, subject, body, userId: user?.id, orderId, site })).status];
    }
    if (channel === 'whatsapp') {
      const recipient = user?.phone ?? '';
      if (!recipient || !prefs.whatsapp) return ['whatsapp', 'skipped'];
      return ['whatsapp', await sendWhatsApp({ eventKey: input.eventKey, to: recipient, body, userId: user?.id, orderId })];
    }
    return [channel, 'skipped'];
  }));
  return Object.fromEntries(entries) as DispatchResult;
}

export function orderVariables(order: NotificationOrder & { items?: Array<{ product_name: string; quantity: number; subtotal_aoa: number | string; player_id?: string | null; player_nickname?: string | null }> }): Record<string, string> {
  const items = order.items ?? [];
  const list = items.length
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item.product_name)} × ${Number(item.quantity)}${item.player_id ? ` — ID: ${escapeHtml(item.player_id)}${item.player_nickname ? ` (${escapeHtml(item.player_nickname)})` : ''}` : ''} — ${formatAoa(item.subtotal_aoa)}</li>`).join('')}</ul>`
    : '';
  return { order_items: list };
}

type ManualNotificationOrder = NotificationOrder & {
  items?: Array<{ product_name: string; quantity: number; subtotal_aoa: number | string; player_id?: string | null; player_nickname?: string | null }>;
};

function statusError(status: DeliveryStatus, channel: NotificationChannel): string | undefined {
  if (status === 'not_configured') {
    return channel === 'email' ? 'SMTP não configurado.' : channel === 'sms' ? 'TelcoSMS não configurado.' : channel === 'whatsapp' ? 'WhatsApp Business API não configurada.' : 'Canal interno indisponível.';
  }
  if (status === 'skipped') return 'Destinatário ou modelo não disponível para este canal.';
  if (status === 'failed') return `Falha no envio pelo canal ${channel}; consulte o histórico de entregas.`;
  if (status === 'bounced') return 'O servidor destinatário rejeitou permanentemente o email.';
  if (status === 'suppressed') return 'O provedor suprimiu o email; a mensagem não foi entregue.';
  if (status === 'delayed') return 'O provedor informou atraso temporário; a entrega ainda não foi confirmada.';
  if (status === 'complained') return 'O email foi marcado como spam pelo destinatário.';
  return undefined;
}

export async function sendManualNotification(input: {
  eventKey?: string;
  channel: NotificationChannel;
  order: ManualNotificationOrder;
  recipient?: string | null;
  subject?: string | null;
  body: string;
}): Promise<{ status: DeliveryStatus; error?: string; providerMessageId?: string }> {
  const eventKey = input.eventKey ?? 'admin.manual_order';
  const site = await getSiteConfig();
  const order = input.order;
  const variables: Record<string, string | number | null | undefined> = {
    site_name: site.name,
    site_url: publicSiteUrl(),
    site_email: site.email,
    site_phone: site.phone,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    order_number: order.order_number,
    order_total: formatAoa(order.total_aoa),
    order_status: ORDER_STATUS_LABELS[String(order.status ?? '')] ?? String(order.status ?? ''),
    order_link: `${publicSiteUrl()}/pedido?order=${encodeURIComponent(order.order_number)}`,
    payment_method: order.payment_method ?? '',
    admin_link: `${publicSiteUrl()}/admin`,
    ...orderVariables(order),
  };
  const renderedSubject = renderTemplate(String(input.subject ?? ''), variables);
  const renderedBody = input.channel === 'sms' ? renderPlainTemplate(input.body, variables) : renderTemplate(input.body, variables);
  const plainBody = renderedBody.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  const recipient = String(input.recipient ?? '').trim() || (input.channel === 'email' ? order.customer_email : order.customer_phone ?? '');
  let status: DeliveryStatus;
  let providerMessageId: string | undefined;

  if (input.channel === 'email') {
    if (!recipient) status = 'skipped';
    else {
      const result = await sendEmail({ eventKey, to: recipient, subject: renderedSubject || `Atualização da encomenda ${order.order_number}`, body: renderedBody, userId: order.user_id, orderId: order.id, site });
      status = result.status;
      providerMessageId = result.providerMessageId;
    }
  } else if (input.channel === 'whatsapp') {
    if (!recipient) status = 'skipped';
    else status = await sendWhatsApp({ eventKey, to: recipient, body: plainBody, userId: order.user_id, orderId: order.id });
  } else if (input.channel === 'sms') {
    if (!recipient) status = 'skipped';
    else if (plainBody.length > 160) {
      status = 'failed';
      await logDelivery({ eventKey, channel: 'sms', recipient: normalizePhone(recipient), status, error: 'A mensagem SMS excede o limite de 160 caracteres.', userId: order.user_id, orderId: order.id });
    }
    else status = await sendSms({ eventKey, to: recipient, body: plainBody, userId: order.user_id, orderId: order.id });
  } else if (order.user_id) {
    const created = await createUserNotification({ userId: Number(order.user_id), eventKey, title: renderedSubject || `Atualização da encomenda ${order.order_number}`, message: renderedBody, link: String(variables.order_link), orderId: order.id });
    status = created ? 'sent' : 'failed';
    await logDelivery({ eventKey, channel: 'in_app', recipient: String(order.user_id), status, subject: renderedSubject, userId: order.user_id, orderId: order.id, payload: { manual: true } });
  } else {
    status = 'skipped';
  }
  return { status, error: statusError(status, input.channel), ...(providerMessageId ? { providerMessageId } : {}) };
}

export async function sendManualEmail(input: {
  eventKey?: string;
  to: string;
  customerName?: string | null;
  subject: string;
  body: string;
}): Promise<{ status: DeliveryStatus; error?: string; providerMessageId?: string }> {
  const site = await getSiteConfig();
  const to = input.to.trim().toLowerCase();
  const variables: Record<string, string | number | null | undefined> = {
    site_name: site.name,
    site_url: publicSiteUrl(),
    site_email: site.email,
    site_phone: site.phone,
    customer_name: input.customerName?.trim() || 'cliente',
    customer_email: to,
    customer_phone: '',
    order_number: '',
    order_total: '',
    order_status: '',
    order_items: '',
    order_link: publicSiteUrl(),
    admin_link: `${publicSiteUrl()}/admin`,
  };
  const subject = renderTemplate(input.subject, variables) || `Mensagem da ${site.name}`;
  const body = renderTemplate(input.body, variables);
  const result = await sendEmail({ eventKey: input.eventKey ?? 'admin.manual_email', to, subject, body, site });
  return { ...result, error: statusError(result.status, 'email') };
}

export async function sendManualSms(input: { to: string; body: string; eventKey?: string; customerName?: string | null; customerEmail?: string | null; orderNumber?: string | null; orderTotal?: number | string | null; orderStatus?: string | null }): Promise<{ status: DeliveryStatus; error?: string }> {
  const site = await getSiteConfig();
  const to = normalizePhone(input.to);
  const eventKey = input.eventKey ?? 'admin.manual_sms';
  const body = renderPlainTemplate(input.body, {
    site_name: site.name,
    site_url: publicSiteUrl(),
    site_email: site.email,
    site_phone: site.phone,
    customer_name: input.customerName?.trim() || 'cliente',
    customer_email: input.customerEmail?.trim() ?? '',
    customer_phone: to,
    order_number: input.orderNumber ?? '',
    order_total: input.orderTotal == null ? '' : formatAoa(input.orderTotal),
    order_status: ORDER_STATUS_LABELS[String(input.orderStatus ?? '')] ?? String(input.orderStatus ?? ''),
  });
  if (body.length > 160) {
    await logDelivery({ eventKey, channel: 'sms', recipient: to, status: 'failed', error: 'A mensagem personalizada excede o limite de 160 caracteres.' });
    return { status: 'failed', error: 'A mensagem personalizada excede o limite de 160 caracteres.' };
  }
  const status = await sendSms({ eventKey, to, body });
  return { status, error: statusError(status, 'sms') };
}

export async function sendEmailCampaign(input: {
  campaignId: number;
  subject: string;
  bodyHtml: string;
  leads: Array<{ email: string; name?: string | null }>;
}): Promise<{ recipientCount: number; acceptedCount: number; failedCount: number }> {
  const site = await getSiteConfig();
  let acceptedCount = 0;
  let failedCount = 0;
  let nextIndex = 0;
  const sendNext = async () => {
    while (nextIndex < input.leads.length) {
      const lead = input.leads[nextIndex++];
      const variables: Record<string, string> = {
        site_name: site.name,
        site_url: publicSiteUrl(),
        site_email: site.email,
        site_phone: site.phone,
        customer_name: lead.name?.trim() || 'cliente',
        customer_email: lead.email,
        customer_phone: '',
        admin_link: `${publicSiteUrl()}/admin`,
      };
      const result = await sendEmail({
        eventKey: `campaign.email.${input.campaignId}`,
        to: lead.email,
        subject: renderTemplate(input.subject, variables),
        body: renderTemplate(input.bodyHtml, variables),
        site,
      });
      if (result.status === 'accepted' || result.status === 'delivered') acceptedCount += 1;
      else failedCount += 1;
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, input.leads.length) }, () => sendNext()));
  return { recipientCount: input.leads.length, acceptedCount, failedCount };
}

export async function notifyOrderStatusChanged(order: NotificationOrder, status: string, extras?: Record<string, string | number | null | undefined>): Promise<{ queued: true; jobId: string }> {
  const eventKey = STATUS_EVENTS[status] ?? 'order.created';
  const jobId = await enqueueNotificationJob({ kind: 'dispatch', input: {
    eventKey,
    order: { ...order, status },
    variables: { ...extras },
    channels: ['email', 'whatsapp', 'sms', 'in_app'],
  } });
  return { queued: true, jobId };
}

export async function notifyOrderCreated(order: NotificationOrder & { items?: Array<{ product_name: string; quantity: number; subtotal_aoa: number | string; player_id?: string | null; player_nickname?: string | null }> }, paymentInstructions = '', connection?: DbConnection): Promise<{ queued: true; jobId: string }> {
  const jobId = await enqueueNotificationJob({ kind: 'order_created', order, paymentInstructions }, connection);
  return { queued: true, jobId };
}

export async function notifyPaymentProofSubmitted(order: NotificationOrder, connection?: DbConnection): Promise<{ queued: true; jobId: string }> {
  const jobId = await enqueueNotificationJob({ kind: 'proof_submitted', order }, connection);
  return { queued: true, jobId };
}

export async function notifyPaymentReview(order: NotificationOrder, action: 'approve' | 'reject' | 'request_new', note?: string | null): Promise<{ queued: true; jobId: string }> {
  const eventKey = action === 'approve' ? 'order.payment_confirmed' : action === 'reject' ? 'order.payment_rejected' : 'order.payment_proof_requested';
  const jobId = await enqueueNotificationJob({ kind: 'dispatch', input: { eventKey, order: { ...order, status: action === 'approve' ? 'payment_confirmed' : 'awaiting_payment' }, variables: { admin_note: note ?? '' }, channels: ['email', 'whatsapp', 'sms', 'in_app'] } });
  return { queued: true, jobId };
}

export async function notifyUserWelcome(user: NotificationUser): Promise<{ queued: true; jobId: string }> {
  const jobId = await enqueueNotificationJob({ kind: 'dispatch', input: { eventKey: 'user.welcome', user, channels: ['email', 'in_app'] } });
  return { queued: true, jobId };
}

export async function notifyPasswordReset(user: NotificationUser, token: string): Promise<{ queued: true; jobId: string }> {
  const jobId = await enqueueNotificationJob({ kind: 'dispatch', input: { eventKey: 'user.password_reset', user, variables: { reset_link: `${publicSiteUrl()}/my-account?reset=${encodeURIComponent(token)}` }, channels: ['email'] } });
  return { queued: true, jobId };
}

export async function notifyContactMessage(input: { name: string; email: string; message: string }): Promise<void> {
  await enqueueNotificationJob({ kind: 'dispatch', input: { eventKey: 'admin.contact_message', variables: { customer_name: input.name, customer_email: input.email, contact_name: input.name, contact_email: input.email, contact_message: input.message }, channels: ['in_app', 'email'], entityType: 'contact_message' } });
}

export async function notifyCommentPending(input: { name: string; postTitle: string; excerpt: string; postSlug: string }): Promise<void> {
  await dispatch({ eventKey: 'blog.comment_pending', variables: { customer_name: input.name, post_title: input.postTitle, comment_excerpt: input.excerpt }, channels: ['in_app'], entityType: 'blog_comment', entityId: input.postSlug, link: `/blog/${input.postSlug}` });
}

export async function notifyCommentApproved(user: NotificationUser | null, postTitle: string, postSlug: string): Promise<void> {
  if (!user) return;
  await enqueueNotificationJob({ kind: 'dispatch', input: { eventKey: 'blog.comment_approved', user, variables: { post_title: postTitle, comment_link: `${publicSiteUrl()}/blog/${postSlug}` }, channels: ['email', 'in_app'] } });
}

export async function notifyAffiliateJoined(user: NotificationUser, code: string, rate: number): Promise<void> {
  await enqueueNotificationJob({ kind: 'dispatch', input: { eventKey: 'affiliate.joined', user, variables: { affiliate_code: code, commission_rate: rate }, channels: ['email', 'in_app'] } });
}

export async function notifyAffiliateCommission(user: NotificationUser, commission: number, orderNumber: string): Promise<void> {
  await enqueueNotificationJob({ kind: 'dispatch', input: { eventKey: 'affiliate.commission', user, variables: { commission: formatAoa(commission), order_number: orderNumber }, channels: ['email', 'in_app'] } });
}

export async function notifyAffiliatePayout(user: NotificationUser, amount: number): Promise<void> {
  await enqueueNotificationJob({ kind: 'dispatch', input: { eventKey: 'affiliate.payout', user, variables: { payout_amount: formatAoa(amount) }, channels: ['email', 'in_app'] } });
}

export async function notifyLowStock(product: { id: string; name: string; stock_quantity: number }): Promise<void> {
  await enqueueNotificationJob({ kind: 'dispatch', input: { eventKey: 'admin.low_stock', variables: { product_name: product.name, stock_quantity: product.stock_quantity }, channels: ['in_app', 'email'], entityType: 'product', entityId: product.id, level: 'warning' } });
}

export async function sendTestNotification(eventKey: string, channel: NotificationChannel, to: string): Promise<{ status: DeliveryStatus; error?: string; providerMessageId?: string }> {
  const site = await getSiteConfig();
  const template = await getTemplate(eventKey, channel);
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
  if (channel === 'email') return sendEmail({ eventKey, to, subject, body, site });
  if (channel === 'whatsapp') return { status: await sendWhatsApp({ eventKey, to, body }) };
  if (channel === 'sms') return { status: await sendSms({ eventKey, to, body }) };
  await createAdminNotification({ title: `Teste de notificação: ${subject}`, message: body, level: 'info', eventKey });
  return { status: 'sent' };
}

export type NotificationJobPayload =
  | { kind: 'dispatch'; input: DispatchInput }
  | { kind: 'order_created'; order: NotificationOrder & { items?: Array<{ product_name: string; quantity: number; subtotal_aoa: number | string; player_id?: string | null; player_nickname?: string | null }> }; paymentInstructions: string }
  | { kind: 'proof_submitted'; order: NotificationOrder }
  | { kind: 'manual_email'; input: Parameters<typeof sendManualEmail>[0] }
  | { kind: 'manual_sms'; input: Parameters<typeof sendManualSms>[0] }
  | { kind: 'manual_order'; input: Parameters<typeof sendManualNotification>[0] }
  | { kind: 'campaign_send'; campaignId: number };

/** Persist the work before acknowledging the initiating HTTP request. */
export async function enqueueNotificationJob(payload: NotificationJobPayload, connection?: DbConnection): Promise<string> {
  const executor = connection ?? getPool();
  const [rows] = await executor.query<any[]>(
    `INSERT INTO notification_jobs (job_type, payload_json) VALUES (?, ?::jsonb) RETURNING id`,
    [payload.kind, JSON.stringify(payload)],
  );
  return String(rows[0]?.id ?? '');
}

export async function getNotificationJobStatus(id: string): Promise<{ id: string; status: string; result: unknown; error: string | null } | null> {
  const [rows] = await getPool().query<any[]>(`SELECT id, status, result_json, last_error FROM notification_jobs WHERE id = ? LIMIT 1`, [id]);
  const row = rows[0];
  if (!row) return null;
  let result: unknown = row.result_json ?? null;
  let error = row.last_error == null ? null : String(row.last_error);
  if (typeof row.result_json === 'string') {
    try { result = JSON.parse(row.result_json); }
    catch { result = null; error ??= 'Não foi possível interpretar o resultado registado para este envio.'; }
  }
  return { id: String(row.id), status: String(row.status), result, error };
}

async function performNotificationJob(payload: NotificationJobPayload): Promise<unknown> {
  if (payload.kind === 'dispatch') return dispatch(payload.input);
  if (payload.kind === 'manual_email') return sendManualEmail(payload.input);
  if (payload.kind === 'manual_sms') return sendManualSms(payload.input);
  if (payload.kind === 'manual_order') return sendManualNotification(payload.input);
  if (payload.kind === 'campaign_send') {
    const [[campaign]] = await getPool().query<any[]>(`SELECT id, subject, body_html, audience_status, status FROM email_campaigns WHERE id = ? LIMIT 1`, [payload.campaignId]);
    if (!campaign || campaign.audience_status !== 'subscribed' || campaign.status !== 'sending') throw new Error('A campanha deixou de estar elegível para envio.');
    try {
      const [leads] = await getPool().query<any[]>(`SELECT email, name FROM marketing_leads WHERE status = 'subscribed' ORDER BY id ASC LIMIT 5000`);
      const result = await sendEmailCampaign({ campaignId: payload.campaignId, subject: String(campaign.subject), bodyHtml: String(campaign.body_html), leads });
      const status = result.failedCount > 0 && result.acceptedCount === 0 ? 'failed' : result.failedCount > 0 ? 'partially_failed' : 'accepted';
      await getPool().execute(`UPDATE email_campaigns SET status = ?, recipient_count = ?, sent_count = ?, sent_at = NOW(), updated_at = NOW() WHERE id = ?`, [status, result.recipientCount, result.acceptedCount, payload.campaignId]);
      return { ...result, status };
    } catch (error) {
      await getPool().execute(`UPDATE email_campaigns SET status = 'failed', updated_at = NOW() WHERE id = ?`, [payload.campaignId]).catch(() => undefined);
      throw error;
    }
  }
  if (payload.kind === 'order_created') {
    const variables = orderVariables(payload.order);
    variables.payment_instructions = payload.paymentInstructions ? `<p>${escapeHtml(payload.paymentInstructions)}</p>` : '';
    const [customer, admin] = await Promise.all([
      dispatch({ eventKey: 'order.created', order: payload.order, variables, channels: ['email', 'whatsapp', 'sms', 'in_app'] }),
      dispatch({ eventKey: 'admin.new_order', order: payload.order, variables, channels: ['in_app', 'email'], entityType: 'shop_order', entityId: payload.order.order_number }),
    ]);
    return { customer, admin };
  }
  const [customer, admin] = await Promise.all([
    dispatch({ eventKey: 'order.payment_proof_submitted', order: { ...payload.order, status: 'payment_verification' }, channels: ['email', 'sms', 'in_app'] }),
    dispatch({ eventKey: 'admin.payment_proof', order: payload.order, channels: ['in_app', 'email'], entityType: 'shop_order', entityId: payload.order.order_number }),
  ]);
  return { customer, admin };
}

function containsFailedDelivery(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsFailedDelivery);
  if (typeof value === 'string') return ['failed', 'not_configured', 'bounced', 'suppressed'].includes(value);
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (typeof record.status === 'string' && ['failed', 'not_configured', 'bounced', 'suppressed'].includes(record.status)) return true;
  return Object.values(record).some(containsFailedDelivery);
}

let notificationWorkerStarted = false;
let notificationWorkersActive = 0;

async function processOneNotificationJob(): Promise<void> {
  const connection = await getPool().getConnection();
  let row: any;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<any[]>(`SELECT id, payload_json FROM notification_jobs WHERE status = 'queued' AND available_at <= NOW() ORDER BY created_at ASC, id ASC LIMIT 1 FOR UPDATE SKIP LOCKED`);
    row = rows[0];
    if (!row) { await connection.commit(); return; }
    await connection.execute(`UPDATE notification_jobs SET status = 'processing', attempts = attempts + 1, locked_at = NOW(), updated_at = NOW() WHERE id = ?`, [row.id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback().catch(() => undefined);
    throw error;
  } finally {
    connection.release();
  }
  if (!row) return;

  const heartbeat = setInterval(() => {
    void getPool().execute(`UPDATE notification_jobs SET locked_at = NOW(), updated_at = NOW() WHERE id = ? AND status = 'processing'`, [row.id]).catch((error) => console.error('[notifications] falha no heartbeat do job', error instanceof Error ? error.message : error));
  }, 60_000);
  heartbeat.unref?.();
  try {
    const payload = (typeof row.payload_json === 'string' ? JSON.parse(row.payload_json) : row.payload_json) as NotificationJobPayload;
    const result = await performNotificationJob(payload);
    const failed = containsFailedDelivery(result);
    const resultError = result && typeof result === 'object' && 'error' in result ? String((result as { error?: string }).error ?? '') : '';
    await getPool().execute(`UPDATE notification_jobs SET status = ?, result_json = ?::jsonb, last_error = ?, locked_at = NULL, finished_at = NOW(), updated_at = NOW() WHERE id = ?`, [failed ? 'failed' : 'completed', JSON.stringify(result ?? {}), resultError || (failed ? 'Um ou mais canais falharam ou não estão configurados.' : null), row.id]);
  } catch (error) {
    const reason = (error instanceof Error ? error.message : 'Falha ao processar notificação.').slice(0, 1000);
    await getPool().execute(`UPDATE notification_jobs SET status = 'failed', last_error = ?, locked_at = NULL, finished_at = NOW(), updated_at = NOW() WHERE id = ?`, [reason, row.id]).catch((updateError) => console.error('[notifications] falha ao guardar resultado do job', updateError instanceof Error ? updateError.message : updateError));
    console.error('[notifications] job falhou', reason);
  } finally {
    clearInterval(heartbeat);
  }
}

export function startNotificationWorker(): void {
  if (notificationWorkerStarted) return;
  notificationWorkerStarted = true;
  let lastStaleCheck = 0;
  const timer = setInterval(() => {
    if (notificationWorkersActive < 4) {
      const slots = 4 - notificationWorkersActive;
      notificationWorkersActive += slots;
      void Promise.all(Array.from({ length: slots }, () => processOneNotificationJob().catch((error) => {
        console.error('[notifications] worker indisponível', error instanceof Error ? error.message : error);
      }).finally(() => { notificationWorkersActive -= 1; })));
    }
    if (Date.now() - lastStaleCheck > 60_000) {
      lastStaleCheck = Date.now();
      void getPool().execute(`UPDATE notification_jobs SET status = 'failed', last_error = 'O processo foi interrompido antes de confirmar o resultado; verifique o histórico do provedor antes de reenviar.', locked_at = NULL, finished_at = NOW(), updated_at = NOW() WHERE status = 'processing' AND locked_at < NOW() - INTERVAL '5 minutes'`).catch((error) => console.error('[notifications] falha ao limpar jobs interrompidos', error instanceof Error ? error.message : error));
    }
  }, 500);
  timer.unref?.();
}
