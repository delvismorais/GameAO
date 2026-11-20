import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import type { ViteDevServer } from 'vite';
import { getPool, hasDatabaseUrl, withConnection } from './db';
import { initializePersistence } from './bootstrap';
import { authenticateUser, clearSessionCookie, createSession, destroySession, getAuthenticatedUser, isAdmin, registerUser } from './auth';
import { createInvoicePdf, type InvoiceTemplate } from './invoices';
import {
  notifyLowStock,
  notifyOrderCreated,
  notifyOrderStatusChanged,
  notifyPaymentProofSubmitted,
  notifyPaymentReview,
  notifyUserWelcome,
  emailConfigured,
  enqueueNotificationJob,
  getSiteConfig,
  startNotificationWorker,
  type OrderStatus,
} from './notifications';
import { deleteMediaObject, getPrivateObjectUrl, putMediaObject } from './storage';
import { registerCommunicationRoutes } from './routes/communication';
import { registerAdminModuleRoutes } from './routes/admin-modules';
import { registerReviewRoutes } from './routes/reviews';
import { registerAssistantRoutes } from './routes/assistant';
import { registerResendWebhookRoutes } from './routes/resend-webhooks';
import { attributeAffiliate, findAffiliateByCode, settleAffiliateCommission } from './affiliates';
import { hasCapability, rateLimit, sameOriginGuard, securityHeaders, type Capability } from './security';
import { registerMediaRoutes } from './media';
import { injectSeo, registerSeoRoutes } from './seo';
import { isFreeFireProduct } from '../src/lib/playerRequirements';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = express();
const port = Number(process.env.PORT ?? 3000);
let databaseState: { configured: boolean; ready: boolean; error?: string } = { configured: hasDatabaseUrl(), ready: false };

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(securityHeaders);
registerSeoRoutes(app);
registerResendWebhookRoutes(app);
app.use('/api', express.json({ limit: '1mb' }));
app.use('/api', sameOriginGuard);
const proofUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 1 } });
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

const PROOF_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
const PROOF_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MEDIA_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function safeFileExtension(name: string): string {
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? '';
}

function hasValidFileSignature(file: Express.Multer.File): boolean {
  const bytes = file.buffer;
  if (file.mimetype === 'application/pdf') return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  if (file.mimetype === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimetype === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === 'image/webp') return bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

function hasValidImageSignature(file: Express.Multer.File): boolean {
  const bytes = file.buffer;
  return (file.mimetype === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    || (file.mimetype === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    || (file.mimetype === 'image/webp' && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP');
}
function hasValidMediaSignature(file: Express.Multer.File): boolean {
  if (file.mimetype === 'image/gif') return file.buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || file.buffer.subarray(0, 6).toString('ascii') === 'GIF89a';
  return hasValidImageSignature(file);
}

function asyncRoute(handler: (request: Request, response: Response, next: NextFunction) => Promise<void>) {
  return (request: Request, response: Response, next: NextFunction) => handler(request, response, next).catch(next);
}

function validEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function requireDatabase(response: Response): boolean {
  if (!databaseState.ready) {
    response.status(503).json({ error: 'database_unavailable', message: 'A base de dados ainda não está disponível.' });
    return false;
  }
  return true;
}

const PATH_CAPABILITIES: Array<[RegExp, Capability]> = [
  [/^\/api\/admin\/(products|variants|categories)/i, 'products'],
  [/^\/api\/admin\/(payment-methods|transactions|affiliates)/i, 'payments'],
  [/^\/api\/admin\/(content|banners|popups|comments|site-settings|homepage|notification-templates)/i, 'content'],
  [/^\/api\/admin\/(marketing|email|coupons)/i, 'marketing'],
  [/^\/api\/admin\/(customers)/i, 'customers'],
  [/^\/api\/admin\/(admins|sessions|audit-logs)/i, 'admins'],
  [/^\/api\/admin\/(orders|payment-proofs|deliveries|invoices|notification)/i, 'orders'],
  [/^\/api\/admin\/(media|storage)/i, 'media'],
  [/^\/api\/admin\/(reports|export|overview|stats)/i, 'reports'],
];

function capabilityForPath(pathname: string): Capability | undefined {
  for (const [pattern, capability] of PATH_CAPABILITIES) if (pattern.test(pathname)) return capability;
  return undefined;
}

async function requireAdmin(request: Request, response: Response, capability?: Capability) {
  const user = await getAuthenticatedUser(request);
  if (!isAdmin(user)) {
    response.status(403).json({ error: 'forbidden', message: 'Acesso administrativo não autorizado.' });
    return null;
  }
  const required = capability ?? capabilityForPath(request.originalUrl.split('?')[0]);
  if (required && !hasCapability(user, required)) {
    response.status(403).json({ error: 'forbidden_capability', message: 'O seu perfil não tem permissão para esta operação.' });
    return null;
  }
  return user;
}

async function recordAudit(userId: number, action: string, entityType: string, entityId: string | null, metadata?: unknown): Promise<void> {
  await getPool().execute(
    `INSERT INTO admin_audit_logs (user_id, action, entity_type, entity_id, metadata_json) VALUES (?, ?, ?, ?, ?)`,
    [userId, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null],
  );
}

const routeDeps = { requireDatabase, requireAdmin, recordAudit };
registerCommunicationRoutes(app, routeDeps);
registerAdminModuleRoutes(app, routeDeps);
registerMediaRoutes(app, routeDeps);
registerReviewRoutes(app, routeDeps);
registerAssistantRoutes(app, routeDeps);

function parseArrayValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  const raw = String(value ?? '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return raw.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

async function readCatalogProducts(includeInactive = false) {
  const [rows] = await getPool().query<any[]>(
    `SELECT p.*, STRING_AGG(c.slug, ',' ORDER BY c.slug) AS category_slugs, STRING_AGG(c.name, ',' ORDER BY c.sort_order, c.name) AS category_names
       FROM catalog_products p
       LEFT JOIN catalog_product_categories pc ON pc.product_id = p.id
       LEFT JOIN catalog_categories c ON c.id = pc.category_id
      ${includeInactive ? '' : 'WHERE p.is_active = 1'}
      GROUP BY p.id
      ORDER BY p.shop_order ASC, p.name ASC`,
  );
  const [variantRows] = await getPool().query<any[]>(`SELECT id, product_id, name, sku, price_usd, original_price_usd, description, is_active, sort_order FROM product_variants WHERE is_active = 1 ORDER BY sort_order ASC, id ASC`);
  const variantsByProduct = new Map<string, any[]>();
  for (const variant of variantRows) {
    const list = variantsByProduct.get(String(variant.product_id)) ?? [];
    list.push({ id: Number(variant.id), name: variant.name, sku: variant.sku ?? undefined, priceUsd: Number(variant.price_usd), originalPriceUsd: variant.original_price_usd == null ? undefined : Number(variant.original_price_usd), description: variant.description ?? '' });
    variantsByProduct.set(String(variant.product_id), list);
  }
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    basePriceUsd: Number(row.base_price_usd),
    salePriceUsd: row.sale_price_usd === null ? undefined : Number(row.sale_price_usd),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    categories: row.category_slugs ? String(row.category_slugs).split(',') : [],
    categoryNames: row.category_names ? String(row.category_names).split(',') : [],
    tags: parseArrayValue(row.tags_json),
    image: row.image_url,
    imageCard: row.image_card_url,
    hot: Boolean(row.is_hot),
    shopOrder: Number(row.shop_order),
    featuredOrder: row.featured_order === null ? undefined : Number(row.featured_order),
    recentOrder: row.recent_order === null ? undefined : Number(row.recent_order),
    dealOrder: row.deal_order === null ? undefined : Number(row.deal_order),
    shortDescription: row.short_description,
    description: parseArrayValue(row.description_json),
    releaseYear: Number(row.release_year),
    developer: row.developer,
    platform: row.platform,
    isActive: Boolean(row.is_active),
    categoryType: row.category_type === 'physical' ? 'physical' : 'digital',
    productSubtype: row.product_subtype ?? 'digital_game',
    requiresPlayerId: Boolean(row.requires_player_id),
    subCategory: row.sub_category ?? undefined,
    shippingCostAoa: Number(row.shipping_cost_aoa ?? 0),
    additionalImages: parseArrayValue(row.additional_images_json),
    videoUrl: row.video_url ?? undefined,
    isDynamic: Boolean(row.is_dynamic),
    stockQuantity: row.stock_quantity === null || row.stock_quantity === undefined ? null : Number(row.stock_quantity),
    lowStockThreshold: Number(row.low_stock_threshold ?? 5),
    relatedProducts: parseArrayValue(row.related_products_json),
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    variants: variantsByProduct.get(String(row.id)) ?? [],
  }));
}

app.get('/_app/health', (_request, response) => {
  response.status(200).json({ ok: true, service: 'gameao', database: databaseState });
});

app.get('/api/health', (_request, response) => {
  response.status(200).json({ ok: true, service: 'gameao', database: databaseState });
});

app.get('/api/auth/me', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  response.json({ user: await getAuthenticatedUser(request) });
}));

app.post('/api/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 12, message: 'Demasiados registos a partir deste endereço. Tente novamente mais tarde.' }), asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const { email, password, name, phone } = request.body ?? {};
  if (!validEmail(email) || typeof password !== 'string' || password.length < 6 || typeof name !== 'string' || name.trim().length < 2) {
    response.status(400).json({ error: 'invalid_registration', message: 'Indique um nome, email válido e palavra-passe com pelo menos 6 caracteres.' });
    return;
  }
  try {
    const user = await registerUser({ email, password, name, phone });
    await createSession(user.id, request, response);
    const referralCode = String(request.body?.ref ?? request.body?.affiliateCode ?? '').trim();
    if (referralCode) await attributeAffiliate(user.id, referralCode);
    void notifyUserWelcome({ id: user.id, name: user.name, email: user.email, phone: user.phone }).catch((error) => console.error('[notifications] boas-vindas', error));
    response.status(201).json({ user });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error.code === 'ER_DUP_ENTRY' || error.code === '23505')) {
      response.status(409).json({ error: 'email_in_use', message: 'Já existe uma conta com este email.' });
      return;
    }
    throw error;
  }
}));

app.post('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 15, key: (request) => String(request.body?.email ?? '').toLowerCase(), message: 'Demasiadas tentativas de início de sessão. Aguarde 15 minutos.' }), asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const { email, password } = request.body ?? {};
  if (!validEmail(email) || typeof password !== 'string') {
    response.status(400).json({ error: 'invalid_login', message: 'Indique um email e uma palavra-passe.' });
    return;
  }
  const user = await authenticateUser(email, password);
  if (!user) {
    response.status(401).json({ error: 'invalid_credentials', message: 'Email ou palavra-passe incorretos.' });
    return;
  }
  await createSession(user.id, request, response);
  await getPool().execute(`UPDATE app_users SET last_login_at = NOW() WHERE id = ?`, [user.id]);
  response.json({ user });
}));

app.post('/api/auth/logout', asyncRoute(async (request, response) => {
  if (databaseState.ready) await destroySession(request);
  clearSessionCookie(response, request);
  response.status(204).end();
}));

app.post('/api/auth/password-reset', asyncRoute(async (_request, response) => {
  response.status(410).json({
    error: 'use_forgot_password',
    message: 'Use o novo fluxo de recuperação em /api/auth/forgot-password.',
  });
}));

app.put('/api/account/profile', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await getAuthenticatedUser(request);
  if (!user) {
    response.status(401).json({ error: 'unauthorized', message: 'Inicie sessão para atualizar o perfil.' });
    return;
  }
  const { name, email, phone } = request.body ?? {};
  if (typeof name !== 'string' || name.trim().length < 2 || !validEmail(email)) {
    response.status(400).json({ error: 'invalid_profile', message: 'Indique um nome e um email válidos.' });
    return;
  }
  try {
    await getPool().execute(
      `UPDATE app_users SET name = ?, email = ?, phone = ? WHERE id = ?`,
      [name.trim(), email.trim().toLowerCase(), typeof phone === 'string' ? phone.trim() || null : null, user.id],
    );
    const updated = await getAuthenticatedUser(request);
    response.json({ user: updated });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && (error.code === 'ER_DUP_ENTRY' || error.code === '23505')) {
      response.status(409).json({ error: 'email_in_use', message: 'Já existe uma conta com este email.' });
      return;
    }
    throw error;
  }
}));

app.get('/api/account/orders', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await getAuthenticatedUser(request);
  if (!user) { response.status(401).json({ error: 'unauthorized', message: 'Inicie sessão para consultar as compras.' }); return; }
  const [orders] = await getPool().query<any[]>(`SELECT id, order_number, created_at, subtotal_aoa, discount_aoa, total_aoa, exchange_rate_usd_aoa, status FROM shop_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`, [user.id]);
  const result = [];
  for (const order of orders) {
    const [items] = await getPool().query<any[]>(`SELECT product_id, product_name, image_url, quantity, unit_price_aoa, subtotal_aoa FROM shop_order_items WHERE order_id = ? ORDER BY id ASC LIMIT 100`, [order.id]);
    result.push({ id: order.order_number, createdAt: order.created_at, subtotalAoa: Number(order.subtotal_aoa), discountAoa: Number(order.discount_aoa), totalAoa: Number(order.total_aoa), exchangeRate: Number(order.exchange_rate_usd_aoa), status: order.status, items: items.map((item: any) => ({ productId: item.product_id, name: item.product_name, image: item.image_url ?? '/assets/gameao-logo.png', qty: Number(item.quantity), unitPriceAoa: Number(item.unit_price_aoa), lineTotalAoa: Number(item.subtotal_aoa) })) });
  }
  response.json({ orders: result });
}));

app.get('/api/catalog/status', asyncRoute(async (_request, response) => {
  if (!requireDatabase(response)) return;
  const [products] = await getPool().query(`SELECT COUNT(*) AS count FROM catalog_products WHERE is_active = 1`);
  const [posts] = await getPool().query(`SELECT COUNT(*) AS count FROM content_posts WHERE status = 'published'`);
  response.json({ products, posts, source: 'database' });
}));

app.get('/api/catalog/products', asyncRoute(async (_request, response) => {
  if (!requireDatabase(response)) return;
  response.json({ products: await readCatalogProducts(), source: 'database' });
}));

app.get('/api/catalog/categories', asyncRoute(async (_request, response) => {
  if (!requireDatabase(response)) return;
  const [categories] = await getPool().query<any[]>(`SELECT c.id, c.slug, c.name, c.description, c.image_url, c.sort_order, COUNT(p.id) FILTER (WHERE p.is_active = 1) AS product_count FROM catalog_categories c LEFT JOIN catalog_product_categories pc ON pc.category_id = c.id LEFT JOIN catalog_products p ON p.id = pc.product_id WHERE c.is_active = 1 GROUP BY c.id ORDER BY c.sort_order ASC, c.name ASC LIMIT 200`);
  response.json({ categories: categories.map((category) => ({ id: Number(category.id), slug: category.slug, name: category.name, description: category.description ?? '', image: category.image_url ?? null, productCount: Number(category.product_count ?? 0) })), source: 'database' });
}));

function jsonValue(value: unknown, fallback: unknown = {}) {
  if (typeof value !== 'string') return value ?? fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function postView(row: any) {
  return { slug: row.slug, title: row.title, date: row.published_date, category: row.category, author: row.author, image: row.image_url, imageCard: row.image_card_url, imageThumb: row.image_thumb_url, excerpt: row.excerpt, tags: jsonValue(row.tags_json, []), views: Number(row.views ?? 0), commentsCount: Number(row.comments_count ?? 0), blocks: jsonValue(row.blocks_json, []), status: row.status, publishedAt: row.published_at };
}

app.get('/api/blog/posts', asyncRoute(async (_request, response) => {
  if (!requireDatabase(response)) return;
  const [rows] = await getPool().query<any[]>(`SELECT * FROM content_posts WHERE status = 'published' ORDER BY published_date DESC, created_at DESC LIMIT 100`);
  response.json({ posts: rows.map(postView) });
}));

app.get('/api/blog/posts/:slug', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const [[row]] = await getPool().query<any[]>(`SELECT * FROM content_posts WHERE slug = ? AND status = 'published' LIMIT 1`, [String(request.params.slug)]);
  if (!row) { response.status(404).json({ error: 'post_not_found', message: 'Artigo não encontrado.' }); return; }
  await getPool().execute(`UPDATE content_posts SET views = views + 1 WHERE slug = ?`, [row.slug]);
  response.json({ post: postView(row) });
}));

app.post('/api/marketing/subscribe', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const email = String(request.body?.email ?? '').trim().toLowerCase();
  const name = typeof request.body?.name === 'string' ? request.body.name.trim().slice(0, 160) : null;
  if (!validEmail(email)) { response.status(400).json({ error: 'invalid_email', message: 'Indique um email válido.' }); return; }
  await getPool().execute(`INSERT INTO marketing_leads (email, name) VALUES (?, ?) ON CONFLICT (email) DO UPDATE SET name = COALESCE(EXCLUDED.name, marketing_leads.name), status = 'subscribed', updated_at = NOW()`, [email, name]);
  response.status(201).json({ ok: true, message: 'Email inscrito nas novidades da GameAO.' });
}));

async function findOrder(orderNumber: string) {
  const [[order]] = await getPool().query<any[]>(`SELECT * FROM shop_orders WHERE order_number = ? LIMIT 1`, [orderNumber]);
  if (!order) return null;
  const [items] = await getPool().query<any[]>(`SELECT i.*, COALESCE(i.image_url, p.image_card_url) AS image_card_url FROM shop_order_items i LEFT JOIN catalog_products p ON p.id = i.product_id WHERE i.order_id = ? ORDER BY i.id ASC`, [order.id]);
  const [[paymentMethod]] = await getPool().query<any[]>(`SELECT id, code, name, description, instructions, receiving_data_json, requires_proof, payment_deadline_hours, customer_message FROM payment_methods WHERE id = ? LIMIT 1`, [order.payment_method_id]);
  const [proofs] = await getPool().query<any[]>(`SELECT id, original_name, mime_type, size_bytes, status, admin_note, submitted_at, reviewed_at FROM payment_proofs WHERE order_id = ? ORDER BY submitted_at DESC`, [order.id]);
  const [history] = await getPool().query<any[]>(`SELECT from_status, to_status, note, created_at FROM shop_order_status_history WHERE order_id = ? ORDER BY created_at ASC LIMIT 100`, [order.id]);
  return { order, items, paymentMethod: paymentMethod ? { ...paymentMethod, receiving_data: typeof paymentMethod.receiving_data_json === 'string' ? JSON.parse(paymentMethod.receiving_data_json) : paymentMethod.receiving_data_json } : null, proofs, history };
}

function chooseInvoiceTemplate(value: unknown): InvoiceTemplate { return value === 'modern' ? 'modern' : 'classic'; }

function sha256(value: string): string { return createHash('sha256').update(value).digest('hex'); }

/** Gera um token de acompanhamento novo e guarda apenas o respetivo hash. */
async function issueTrackingToken(orderId: number): Promise<string> {
  const token = randomBytes(24).toString('hex');
  await getPool().execute(`UPDATE shop_orders SET tracking_token_hash = ?, tracking_token = NULL WHERE id = ?`, [sha256(token), orderId]);
  return token;
}

async function canAccessOrder(request: Request, order: any): Promise<boolean> {
  const user = await getAuthenticatedUser(request);
  if (isAdmin(user)) return true;
  if (user && order.user_id && Number(order.user_id) === user.id) return true;
  const token = String(request.query.token ?? request.body?.token ?? '').trim();
  if (token) {
    const hash = sha256(token);
    if (order.tracking_token_hash && hash === String(order.tracking_token_hash)) return true;
    // Compatibilidade com pedidos antigos guardados em texto simples.
    if (order.tracking_token && token === String(order.tracking_token)) return true;
  }
  const email = String(request.query.email ?? request.body?.email ?? '').trim().toLowerCase();
  if (email && String(order.customer_email).toLowerCase() === email) return true;
  return false;
}

app.get('/api/payment-methods', asyncRoute(async (_request, response) => {
  if (!requireDatabase(response)) return;
  const [rows] = await getPool().query<any[]>(`SELECT id, code, name, description, logo_url, receiving_data_json, instructions, requires_proof, payment_deadline_hours, customer_message FROM payment_methods WHERE is_active = 1 ORDER BY sort_order ASC, name ASC`);
  response.json({ methods: rows.map((row) => ({ ...row, receiving_data: typeof row.receiving_data_json === 'string' ? JSON.parse(row.receiving_data_json) : row.receiving_data_json })) });
}));
app.get('/api/admin/payment-methods', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await requireAdmin(request, response);
  if (!user) return;
  const [rows] = await getPool().query<any[]>(`SELECT * FROM payment_methods ORDER BY sort_order ASC, name ASC`);
  response.json({ methods: rows.map((row) => ({ ...row, receiving_data: typeof row.receiving_data_json === 'string' ? JSON.parse(row.receiving_data_json) : row.receiving_data_json })) });
}));
app.put('/api/admin/payment-methods/:id', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await requireAdmin(request, response);
  if (!user) return;
  const id = Number(request.params.id);
  const body = request.body ?? {};
  const allowed = { name: body.name, description: body.description, instructions: body.instructions, receiving_data_json: body.receiving_data == null ? undefined : JSON.stringify(body.receiving_data), is_active: body.is_active ? 1 : 0, requires_proof: body.requires_proof ? 1 : 0, sort_order: Number(body.sort_order ?? 0), payment_deadline_hours: Number(body.payment_deadline_hours ?? 24), customer_message: body.customer_message };
  const fields = Object.entries(allowed).filter(([, value]) => value !== undefined);
  if (!fields.length) { response.status(400).json({ error: 'empty_update', message: 'Nenhuma definição foi alterada.' }); return; }
  await getPool().execute(`UPDATE payment_methods SET ${fields.map(([key]) => `\`${key}\` = ?`).join(', ')}, updated_at = NOW() WHERE id = ?`, [...fields.map(([, value]) => value), id]);
  await recordAudit(user.id, 'payment_method.update', 'payment_method', String(id), { fields: fields.map(([key]) => key) });
  const [[method]] = await getPool().query<any[]>(`SELECT * FROM payment_methods WHERE id = ? LIMIT 1`, [id]);
  response.json({ method });
}));

app.post('/api/orders/:orderNumber/proofs', rateLimit({ windowMs: 60 * 60 * 1000, max: 12, message: 'Demasiados envios de comprovativo. Aguarde alguns minutos antes de tentar novamente.' }), proofUpload.single('file'), asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const file = request.file;
  const found = await findOrder(String(request.params.orderNumber).trim().toUpperCase());
  if (!found) { response.status(404).json({ error: 'order_not_found', message: 'Pedido não encontrado.' }); return; }
  if (!await canAccessOrder(request, found.order)) { response.status(403).json({ error: 'email_verification_required', message: 'Indique o email da encomenda ou use o link seguro enviado por email.' }); return; }
  if (!file) { response.status(400).json({ error: 'file_required', message: 'Selecione um comprovativo.' }); return; }
  const requestedPaymentCode = String(request.body?.paymentMethod ?? '').trim();
  let paymentMethodId = found.order.payment_method_id ?? null;
  let paymentMethodCode = found.order.payment_method ?? null;
  if (requestedPaymentCode) {
    const [[selectedMethod]] = await getPool().query<any[]>(`SELECT id, code FROM payment_methods WHERE code = ? AND is_active = 1 LIMIT 1`, [requestedPaymentCode]);
    if (!selectedMethod) { response.status(400).json({ error: 'invalid_payment_method', message: 'Selecione um método de pagamento ativo.' }); return; }
    paymentMethodId = selectedMethod.id;
    paymentMethodCode = selectedMethod.code;
  }
  const extension = safeFileExtension(file.originalname);
  if (!PROOF_EXTENSIONS.has(extension) || !PROOF_MIME_TYPES.has(file.mimetype) || !hasValidFileSignature(file)) {
    response.status(400).json({ error: 'invalid_file', message: 'O ficheiro deve ser JPG, PNG, WEBP ou PDF válido. Se tirou a foto com o iPhone, converta para JPG ou envie um PDF.' }); return;
  }
  const key = `payment-proofs/${found.order.order_number}/${randomUUID()}${extension === '.jpeg' ? '.jpg' : extension}`;
  const stored = await putMediaObject(key, file.buffer, file.mimetype, 'private');
  await getPool().execute(`INSERT INTO payment_proofs (order_id, payment_method_id, storage_key, original_name, mime_type, size_bytes, status, storage_backend) VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?)`, [found.order.id, paymentMethodId, key, file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255), file.mimetype, file.size, stored.backend]);
  await getPool().execute(`UPDATE shop_orders SET payment_method = ?, payment_method_id = ?, status = 'payment_verification' WHERE id = ?`, [paymentMethodCode, paymentMethodId, found.order.id]);
  await getPool().execute(`INSERT INTO shop_order_status_history (order_id, from_status, to_status, note, changed_by_user_id) VALUES (?, ?, 'payment_verification', 'Comprovativo enviado pelo cliente; aguarda revisão da GameAO.', NULL)`, [found.order.id, found.order.status]);
  await notifyPaymentProofSubmitted({ id: Number(found.order.id), order_number: found.order.order_number, customer_name: found.order.customer_name, customer_email: found.order.customer_email, customer_phone: found.order.customer_phone, total_aoa: found.order.total_aoa, status: 'payment_verification', payment_method: paymentMethodCode, user_id: found.order.user_id }).catch((error) => console.error('[notifications] comprovativo guardado; falha ao enfileirar alerta', error instanceof Error ? error.message : error));
  response.status(201).json({ ok: true, status: 'payment_verification', message: 'Comprovativo recebido. A equipa GameAO vai rever o documento antes de confirmar o pagamento.' });
}));

app.get('/api/admin/payment-proofs', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response);
  if (!admin) return;
  const status = String(request.query.status ?? '').trim();
  const params: unknown[] = [];
  const where = status ? 'WHERE p.status = ?' : '';
  if (status) params.push(status);
  const [proofs] = await getPool().query<any[]>(`SELECT p.id, p.order_id, p.original_name, p.mime_type, p.size_bytes, p.status, p.admin_note, p.submitted_at, p.reviewed_at, o.order_number, o.customer_name, o.customer_email, o.total_aoa, o.payment_status, o.status AS order_status, pm.name AS payment_method_name FROM payment_proofs p JOIN shop_orders o ON o.id = p.order_id LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id ${where} ORDER BY p.submitted_at DESC LIMIT 200`, params);
  response.json({ proofs });
}));

app.get('/api/admin/payment-proofs/:id/file', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response);
  if (!admin) return;
  const [[proof]] = await getPool().query<any[]>(`SELECT storage_key, mime_type, original_name FROM payment_proofs WHERE id = ? LIMIT 1`, [Number(request.params.id)]);
  if (!proof) { response.status(404).json({ error: 'proof_not_found', message: 'Comprovativo não encontrado.' }); return; }
  response.json({ url: await getPrivateObjectUrl(proof.storage_key), mimeType: proof.mime_type, name: proof.original_name });
}));

app.patch('/api/admin/payment-proofs/:id/review', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response);
  if (!admin) return;
  const action = String(request.body?.action ?? '');
  const note = typeof request.body?.note === 'string' ? request.body.note.trim().slice(0, 2000) : null;
  const nextProofStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'request_new' ? 'needs_new_proof' : '';
  if (!nextProofStatus) { response.status(400).json({ error: 'invalid_review', message: 'Ação de revisão inválida.' }); return; }
  const [[proof]] = await getPool().query<any[]>(`SELECT id, order_id FROM payment_proofs WHERE id = ? LIMIT 1`, [Number(request.params.id)]);
  if (!proof) { response.status(404).json({ error: 'proof_not_found', message: 'Comprovativo não encontrado.' }); return; }
  const [[order]] = await getPool().query<any[]>(`SELECT id, order_number, payment_status, status, customer_name, customer_email, customer_phone, total_aoa, payment_method, user_id FROM shop_orders WHERE id = ? LIMIT 1`, [proof.order_id]);
  if (!order) { response.status(404).json({ error: 'order_not_found', message: 'Encomenda não encontrada.' }); return; }
  await getPool().execute(`UPDATE payment_proofs SET status = ?, admin_note = ?, reviewed_at = NOW(), reviewed_by_user_id = ? WHERE id = ?`, [nextProofStatus, note, admin.id, proof.id]);
  if (action === 'approve') await getPool().execute(`UPDATE shop_orders SET payment_status = 'paid', status = 'payment_confirmed' WHERE id = ?`, [proof.order_id]);
  if (action === 'reject' || action === 'request_new') await getPool().execute(`UPDATE shop_orders SET payment_status = 'pending', status = 'awaiting_payment' WHERE id = ? AND payment_status <> 'paid'`, [proof.order_id]);
  await notifyPaymentReview({ id: Number(order.id), order_number: order.order_number, customer_name: order.customer_name, customer_email: order.customer_email, customer_phone: order.customer_phone, total_aoa: order.total_aoa, status: action === 'approve' ? 'payment_confirmed' : 'awaiting_payment', payment_method: order.payment_method, user_id: order.user_id }, action as 'approve' | 'reject' | 'request_new', note).catch((error) => console.error('[notifications] revisão guardada; falha ao enfileirar alerta', error instanceof Error ? error.message : error));
  if (action === 'approve') await settleAffiliateCommission(Number(order.id));
  await recordAudit(admin.id, `payment_proof.${action}`, 'payment_proof', String(proof.id), { orderNumber: order.order_number, note });
  response.json({ ok: true, proofStatus: nextProofStatus, orderNumber: order.order_number });
}));

app.post('/api/orders', rateLimit({ windowMs: 10 * 60 * 1000, max: 25, message: 'Demasiadas tentativas de encomenda. Aguarde alguns minutos e tente novamente.' }), asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const body = request.body ?? {};
  const customer = body.customer ?? {};
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (!rawItems.length || rawItems.length > 50 || !validEmail(customer.email) || !String(customer.firstName ?? '').trim() || !String(customer.lastName ?? '').trim() || String(customer.phone ?? '').replace(/\D/g, '').length < 9) {
    response.status(400).json({ error: 'invalid_order', message: 'Nome, telefone, email e produtos da encomenda são obrigatórios.' }); return;
  }
  const idempotencyKey = String(request.headers['idempotency-key'] ?? body.idempotencyKey ?? '').trim().slice(0, 120);
  if (idempotencyKey) {
    const [[cached]] = await getPool().query<any[]>(`SELECT response_json FROM idempotency_keys WHERE idempotency_key = ? AND expires_at > NOW() LIMIT 1`, [idempotencyKey]);
    if (cached?.response_json) {
      const payload = typeof cached.response_json === 'string' ? JSON.parse(cached.response_json) : cached.response_json;
      response.status(200).json({ ...payload, duplicate: true });
      return;
    }
    const [lock] = await getPool().execute<any>(`INSERT INTO idempotency_keys (idempotency_key, scope) VALUES (?, 'checkout') ON CONFLICT (idempotency_key) DO NOTHING`, [idempotencyKey]);
    if (Number(lock.affectedRows ?? 0) === 0) {
      response.status(409).json({ error: 'checkout_in_progress', message: 'A sua encomenda está a ser processada. Aguarde alguns segundos antes de tentar novamente.' });
      return;
    }
    // Liberta a chave se a tentativa falhar, para permitir nova tentativa imediata.
    response.on('finish', () => {
      if (response.statusCode >= 400) {
        void getPool().execute(`DELETE FROM idempotency_keys WHERE idempotency_key = ? AND response_json IS NULL`, [idempotencyKey]).catch(() => undefined);
      }
    });
  }
  const user = await getAuthenticatedUser(request);
  const paymentMethodCode = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : '';
  let paymentMethod: any = null;
  if (paymentMethodCode) {
    const [[selectedMethod]] = await getPool().query<any[]>(`SELECT id, code, name, requires_proof, instructions, customer_message FROM payment_methods WHERE code = ? AND is_active = 1 LIMIT 1`, [paymentMethodCode]);
    if (!selectedMethod) { response.status(400).json({ error: 'invalid_payment_method', message: 'O método de pagamento selecionado não está disponível.' }); return; }
    paymentMethod = selectedMethod;
  }
  // Os preços do catálogo são introduzidos e armazenados diretamente em AOA/Kz.
  // Mantemos 1 apenas para compatibilidade com a coluna histórica da encomenda.
  const rate = 1;
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const items: Array<{ id: string; variantId: number | null; variantName: string | null; name: string; unit: number; qty: number; subtotal: number; categoryType: string; productSubtype: string; shipping: number; playerId: string | null; playerNickname: string | null; image: string }> = [];
    const stockRequirements = new Map<string, { quantity: number; name: string }>();
    const seenProducts = new Set<string>();
    for (const raw of rawItems) {
      const productId = String(raw.productId ?? '');
      const lineKey = `${productId}:${raw.variantId ?? 'base'}`;
      if (!productId || seenProducts.has(lineKey)) { await connection.rollback(); response.status(400).json({ error: 'invalid_order_item', message: 'O carrinho contém um produto repetido ou inválido. Atualize o carrinho e tente novamente.' }); return; }
      seenProducts.add(lineKey);
      const qty = Number(raw.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) { await connection.rollback(); response.status(400).json({ error: 'invalid_quantity', message: 'A quantidade de um dos produtos é inválida.' }); return; }
      const [[product]] = await connection.query<any[]>(`SELECT id, name, platform, sub_category, base_price_usd, sale_price_usd, category_type, product_subtype, requires_player_id, shipping_cost_aoa, image_card_url, stock_quantity, low_stock_threshold, is_dynamic FROM catalog_products WHERE id = ? AND is_active = 1 FOR UPDATE`, [productId]);
      if (!product) { await connection.rollback(); response.status(400).json({ error: 'product_unavailable', message: 'Um dos produtos já não está disponível. Atualize o carrinho.' }); return; }
      if (product.stock_quantity !== null && product.stock_quantity !== undefined && Number(product.stock_quantity) < qty) {
        await connection.rollback();
        response.status(409).json({ error: 'out_of_stock', message: `Stock insuficiente para ${product.name}. Restam ${Math.max(0, Number(product.stock_quantity))} unidade(s).` });
        return;
      }
      const variantId = raw.variantId == null || raw.variantId === '' ? null : Number(raw.variantId);
      if (variantId !== null && (!Number.isInteger(variantId) || variantId <= 0)) { await connection.rollback(); response.status(400).json({ error: 'invalid_variant', message: 'A opção selecionada não é válida.' }); return; }
      const [[variantCountRow]] = await connection.query<any[]>(`SELECT COUNT(*)::int AS total FROM product_variants WHERE product_id = ? AND is_active = 1`, [product.id]);
      const hasVariants = Number(variantCountRow?.total ?? 0) > 0;
      if ((Boolean(product.is_dynamic) || hasVariants) && !variantId) { await connection.rollback(); response.status(400).json({ error: 'variant_required', message: `Escolha uma opção disponível para ${product.name}.` }); return; }
      let variant: any = null;
      if (variantId !== null) {
        const [[foundVariant]] = await connection.query<any[]>(`SELECT id, name, price_usd FROM product_variants WHERE id = ? AND product_id = ? AND is_active = 1 LIMIT 1`, [variantId, product.id]);
        variant = foundVariant;
        if (!variant) { await connection.rollback(); response.status(400).json({ error: 'invalid_variant', message: 'A variante selecionada já não está disponível.' }); return; }
      }
      const unit = Number(variant?.price_usd ?? product.sale_price_usd ?? product.base_price_usd);
      const requiresPlayer = Boolean(product.requires_player_id);
      const requiresFreeFireVerification = requiresPlayer && isFreeFireProduct(product);
      const playerId = typeof raw.playerId === 'string' && raw.playerId.trim() ? raw.playerId.trim().slice(0, 120) : null;
      const playerNickname = typeof raw.playerNickname === 'string' && raw.playerNickname.trim() ? raw.playerNickname.trim().slice(0, 180) : null;
      if (requiresPlayer && !playerId) { await connection.rollback(); response.status(400).json({ error: 'player_id_required', message: `O ID do jogador é obrigatório para ${product.name}.` }); return; }
      if (requiresFreeFireVerification && !playerNickname) { await connection.rollback(); response.status(400).json({ error: 'player_verification_required', message: `Consulte o ID Free Fire antes de continuar.` }); return; }
      if (requiresPlayer && !playerNickname) { await connection.rollback(); response.status(400).json({ error: 'player_nickname_required', message: `O nickname é obrigatório para ${product.name}.` }); return; }
      items.push({ id: product.id, variantId: variant?.id ?? null, variantName: variant?.name ?? null, name: product.name, unit, qty, subtotal: unit * qty, categoryType: product.category_type ?? 'digital', productSubtype: product.product_subtype ?? 'digital_game', shipping: product.category_type === 'physical' ? Math.max(0, Number(product.shipping_cost_aoa ?? 0)) : 0, playerId, playerNickname, image: product.image_card_url });
      if (product.stock_quantity !== null && product.stock_quantity !== undefined) {
        const prior = stockRequirements.get(String(product.id));
        stockRequirements.set(String(product.id), { quantity: (prior?.quantity ?? 0) + qty, name: String(product.name) });
      }
    }
    if (items.length !== rawItems.length) { await connection.rollback(); response.status(400).json({ error: 'incomplete_order', message: 'Não foi possível validar todos os produtos do carrinho.' }); return; }
    if (!items.length) { await connection.rollback(); response.status(400).json({ error: 'empty_order', message: 'Nenhum produto válido foi encontrado.' }); return; }
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shipping = items.reduce((sum, item) => sum + item.shipping, 0);
    let discount = 0;
    let coupon: any = null;
    const couponCode = String(body.couponCode ?? '').trim().toUpperCase();
    if (couponCode) {
      const [[couponRow]] = await connection.query<any[]>(`SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW()) LIMIT 1`, [couponCode]);
      if (!couponRow) { await connection.rollback(); response.status(400).json({ error: 'invalid_coupon', message: 'O cupão indicado não é válido ou já expirou.' }); return; }
      if (couponRow.usage_limit !== null && Number(couponRow.used_count) >= Number(couponRow.usage_limit)) { await connection.rollback(); response.status(400).json({ error: 'coupon_exhausted', message: 'Este cupão já atingiu o limite de utilizações.' }); return; }
      if (subtotal < Number(couponRow.min_order_aoa)) { await connection.rollback(); response.status(400).json({ error: 'coupon_min_order', message: `Este cupão exige um subtotal mínimo configurado.` }); return; }
      discount = couponRow.discount_type === 'percent' ? subtotal * Number(couponRow.discount_value) / 100 : Number(couponRow.discount_value);
      if (couponRow.max_discount_aoa !== null && couponRow.max_discount_aoa !== undefined) discount = Math.min(discount, Number(couponRow.max_discount_aoa));
      discount = Math.round(Math.min(discount, subtotal) * 100) / 100;
      coupon = couponRow;
    }
    const hasPhysical = items.some((item) => item.categoryType === 'physical');
    if (hasPhysical && (!String(body.deliveryAddress ?? customer.address).trim() || !String(customer.city ?? '').trim() || !String(customer.province ?? '').trim())) { await connection.rollback(); response.status(400).json({ error: 'delivery_address_required', message: 'Produtos físicos exigem um endereço de entrega completo.' }); return; }
    const deliveryDate = body.deliveryDate ? String(body.deliveryDate).slice(0, 10) : null;
    for (const [productId, requirement] of stockRequirements) {
      const [stockUpdate] = await connection.execute<any>(`UPDATE catalog_products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?`, [requirement.quantity, productId, requirement.quantity]);
      if (Number(stockUpdate.affectedRows ?? 0) !== 1) {
        await connection.rollback();
        response.status(409).json({ error: 'out_of_stock', message: `O stock de ${requirement.name} es insuficiente para as quantidades selecionadas. Atualize o carrinho e tente novamente.` });
        return;
      }
      for (const item of items.filter((line) => line.id === productId)) {
        await connection.execute(`INSERT INTO stock_movements (product_id, variant_id, quantity_delta, reason, note) VALUES (?, ?, ?, 'order_reserved', ?)`, [productId, item.variantId, -item.qty, 'Reserva no checkout']);
      }
    }
    const trackingToken = randomBytes(24).toString('hex');
    const deliveryAddress = [String(body.deliveryAddress ?? customer.address).trim(), String(customer.apartment ?? '').trim()].filter(Boolean).join(', ');
    const [insert] = await connection.execute<any>(`INSERT INTO shop_orders (order_number, access_token_hash, tracking_token_hash, idempotency_key, user_id, customer_name, customer_email, customer_phone, billing_address, billing_city, billing_province, billing_country, billing_postal_code, delivery_address, delivery_date, subtotal_aoa, shipping_aoa, discount_aoa, total_aoa, exchange_rate_usd_aoa, status, payment_status, payment_method, payment_method_id, payment_reference, internal_notes, coupon_id, coupon_code) VALUES (?, SHA2(UUID(), 256), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_payment', 'pending', ?, ?, ?, ?, ?, ?) RETURNING id`, [`GA-PENDING-${randomUUID()}`, sha256(trackingToken), idempotencyKey || null, user?.id ?? null, `${customer.firstName} ${customer.lastName}`.trim(), customer.email.trim().toLowerCase(), customer.phone.trim(), [customer.address, customer.apartment].filter(Boolean).join(', '), customer.city, customer.province, customer.country, customer.postalCode || null, deliveryAddress, deliveryDate, subtotal, shipping, discount, subtotal + shipping - discount, rate, paymentMethod?.code ?? null, paymentMethod?.id ?? null, `GA-PAY-${randomUUID().slice(0, 12).toUpperCase()}`, customer.notes ?? null, coupon?.id ?? null, coupon?.code ?? null]);
    const orderId = Number(Array.isArray(insert) ? insert[0]?.id : insert?.insertId);
    if (!Number.isInteger(orderId) || orderId <= 0) throw new Error('A base de dados não devolveu o identificador da encomenda.');
    // Serialize allocation across app instances; the transaction lock prevents duplicate random candidates.
    await connection.execute(`SELECT pg_advisory_xact_lock(hashtext('gameao-order-number'))`);
    let digits = 3;
    let orderNumber = '';
    for (;;) {
      const poolSize = 8 * (10 ** (digits - 1)); // first digit 2–9; subsequent digits 0–9
      const [usedRows] = await connection.query<any[]>(`SELECT COUNT(*)::int AS total FROM shop_orders WHERE order_number ~ ?`, [`^GA[2-9][0-9]{${digits - 1}}$`]);
      if (Number(usedRows[0]?.total ?? 0) >= poolSize) { digits += 1; continue; }
      for (let attempt = 0; attempt < 128; attempt += 1) {
        const tail = Array.from({ length: digits }, (_, index) => String(Math.floor(Math.random() * (index === 0 ? 8 : 10)) + (index === 0 ? 2 : 0))).join('');
        const candidate = `GA${tail}`;
        const [matches] = await connection.query<any[]>(`SELECT 1 FROM shop_orders WHERE order_number = ? LIMIT 1`, [candidate]);
        if (!matches.length) { orderNumber = candidate; break; }
      }
      if (orderNumber) break;
      // Random retries can cluster near exhaustion; advance only after confirming the current length is exhausted.
      const [allRows] = await connection.query<any[]>(`SELECT COUNT(*)::int AS total FROM shop_orders WHERE order_number ~ ?`, [`^GA[2-9][0-9]{${digits - 1}}$`]);
      if (Number(allRows[0]?.total ?? 0) >= poolSize) { digits += 1; continue; }
    }
    await connection.execute(`UPDATE shop_orders SET order_number = ?, invoice_issued_at = NOW() WHERE id = ?`, [orderNumber, orderId]);
    if (coupon) {
      await connection.execute(`UPDATE coupons SET used_count = used_count + 1, updated_at = NOW() WHERE id = ?`, [coupon.id]);
      await connection.execute(`INSERT INTO coupon_redemptions (coupon_id, order_id, user_id, discount_aoa) VALUES (?, ?, ?, ?) ON CONFLICT (coupon_id, order_id) DO NOTHING`, [coupon.id, orderId, user?.id ?? null, discount]);
    }
    for (const item of items) await connection.execute(`INSERT INTO shop_order_items (order_id, product_id, product_name, variant_id, variant_name, unit_price_aoa, quantity, subtotal_aoa, player_id, player_nickname, category_type, product_subtype, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [orderId, item.id, item.name, item.variantId, item.variantName, item.unit, item.qty, item.subtotal, item.playerId, item.playerNickname, item.categoryType, item.productSubtype, item.image]);
    await connection.execute(`INSERT INTO shop_order_status_history (order_id, from_status, to_status, note, changed_by_user_id) VALUES (?, NULL, 'awaiting_payment', 'Encomenda criada no checkout.', ?)`, [orderId, user?.id ?? null]);
    await connection.commit();
    const referralCode = String(body.affiliateCode ?? body.ref ?? '').trim();
    let affiliate = referralCode ? await findAffiliateByCode(referralCode) : null;
    if (!affiliate && user?.id) {
      const [[referred]] = await getPool().query<any[]>(`SELECT a.id, a.code FROM affiliates a JOIN app_users u ON u.referred_by_affiliate_id = a.id WHERE u.id = ? AND a.status = 'active' LIMIT 1`, [user.id]);
      if (referred) affiliate = { id: Number(referred.id), code: String(referred.code), user_id: 0, commission_rate: 0, status: 'active' };
    }
    if (affiliate) await getPool().execute(`UPDATE shop_orders SET affiliate_id = ?, affiliate_code = ? WHERE id = ?`, [affiliate.id, affiliate.code, orderId]);
    for (const item of items) {
      const [[stockRow]] = await getPool().query<any[]>(`SELECT stock_quantity, low_stock_threshold, name FROM catalog_products WHERE id = ? LIMIT 1`, [item.id]);
      if (stockRow && stockRow.stock_quantity !== null && stockRow.stock_quantity !== undefined) {
        const remaining = Number(stockRow.stock_quantity);
        if (remaining <= Number(stockRow.low_stock_threshold ?? 5)) void notifyLowStock({ id: item.id, name: String(stockRow.name), stock_quantity: remaining }).catch((error) => console.error('[notifications] stock', error));
      }
    }
    void notifyOrderCreated(
      { id: orderId, order_number: orderNumber, tracking_token: trackingToken, customer_name: `${customer.firstName} ${customer.lastName}`.trim(), customer_email: customer.email.trim().toLowerCase(), customer_phone: customer.phone.trim(), total_aoa: subtotal + shipping - discount, status: 'awaiting_payment', payment_method: paymentMethod?.name ?? null, user_id: user?.id ?? null, items: items.map((item) => ({ product_name: item.name, quantity: item.qty, subtotal_aoa: item.subtotal, player_id: item.playerId, player_nickname: item.playerNickname })) },
      paymentMethod?.instructions ?? paymentMethod?.customer_message ?? '',
    ).catch((error) => console.error('[notifications] encomenda criada', error));
    const payload = { orderNumber, trackingToken, email: customer.email.trim().toLowerCase(), totalAoa: subtotal + shipping - discount, subtotalAoa: subtotal, shippingAoa: shipping, discountAoa: discount, couponCode: coupon?.code ?? null, invoiceTemplates: ['classic', 'modern'] };
    if (idempotencyKey) {
      await getPool().execute(`UPDATE idempotency_keys SET response_json = ? WHERE idempotency_key = ?`, [JSON.stringify(payload), idempotencyKey]).catch(() => undefined);
    }
    response.status(201).json(payload);
  } catch (error) {
    await connection.rollback();
    console.error('[orders] falha ao criar encomenda', error instanceof Error ? error.message : error);
    response.status(500).json({ error: 'order_creation_failed', message: 'Não foi possível concluir a encomenda neste momento. Tente novamente.' });
  } finally { connection.release(); }
}));

app.get('/api/orders/:orderNumber', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const found = await findOrder(String(request.params.orderNumber));
  if (!found) { response.status(404).json({ error: 'order_not_found', message: 'Pedido não encontrado.' }); return; }
  if (!await canAccessOrder(request, found.order)) {
    response.status(403).json({ error: 'email_verification_required', message: 'Indique o email usado na encomenda ou abra o link seguro enviado por email.' });
    return;
  }
  const hasPhysical = found.items.some((item: any) => item.category_type === 'physical');
  const hasDigital = found.items.some((item: any) => item.category_type !== 'physical');
  const deliveryType = hasPhysical && hasDigital ? 'mixed' : hasPhysical ? 'physical' : 'digital';
  response.json({
    order: { order_number: found.order.order_number, customer_name: found.order.customer_name, customer_email: found.order.customer_email, customer_phone: found.order.customer_phone, total_aoa: found.order.total_aoa, subtotal_aoa: found.order.subtotal_aoa, exchange_rate_usd_aoa: found.order.exchange_rate_usd_aoa, shipping_aoa: found.order.shipping_aoa, discount_aoa: found.order.discount_aoa, coupon_code: found.order.coupon_code, status: found.order.status, payment_status: found.order.payment_status, payment_method: found.order.payment_method, payment_reference: found.order.payment_reference, created_at: found.order.created_at, updated_at: found.order.updated_at, billing_address: found.order.billing_address, delivery_address: found.order.delivery_address ?? found.order.billing_address, delivery_city: found.order.billing_city, delivery_province: found.order.billing_province, delivery_date: found.order.delivery_date, delivery_type: deliveryType },
    items: found.items.map((item: any) => ({ product_id: item.product_id, product_name: item.product_name, variant_name: item.variant_name, quantity: item.quantity, unit_price_aoa: item.unit_price_aoa, subtotal_aoa: item.subtotal_aoa, image_card_url: item.image_card_url, player_id: item.player_id, player_nickname: item.player_nickname, category_type: item.category_type, product_subtype: item.product_subtype })),
    paymentMethod: found.paymentMethod,
    proofs: found.proofs,
    history: found.history,
  });
}));

async function deliverInvoice(request: Request, response: Response, adminOnly: boolean): Promise<void> {
  if (!requireDatabase(response)) return;
  const admin = adminOnly ? await requireAdmin(request, response) : null;
  if (adminOnly && !admin) return;
  const found = await findOrder(String(request.params.orderNumber));
  if (!found) { response.status(404).json({ error: 'order_not_found', message: 'Pedido não encontrado.' }); return; }
  if (!adminOnly && !await canAccessOrder(request, found.order)) {
    response.status(403).json({ error: 'email_verification_required', message: 'Indique o email da encomenda ou use o link seguro enviado por email para descarregar a fatura.' });
    return;
  }
  const template = chooseInvoiceTemplate(request.query.template);
  const site = await getSiteConfig();
  const pdf = await createInvoicePdf({ orderNumber: found.order.order_number, createdAt: found.order.created_at, customerName: found.order.customer_name, customerEmail: found.order.customer_email, customerPhone: found.order.customer_phone, billingAddress: found.order.billing_address, billingCity: found.order.billing_city, billingProvince: found.order.billing_province, deliveryAddress: found.order.delivery_address, deliveryDate: found.order.delivery_date, shippingAoa: Number(found.order.shipping_aoa ?? 0), paymentMethod: found.order.payment_method, subtotalAoa: Number(found.order.subtotal_aoa), discountAoa: Number(found.order.discount_aoa), totalAoa: Number(found.order.total_aoa), exchangeRate: Number(found.order.exchange_rate_usd_aoa), status: found.order.status, paymentStatus: found.order.payment_status, site }, found.items.map((item: any) => ({ name: item.product_name, variantName: item.variant_name, imageUrl: item.image_card_url, unitPriceAoa: Number(item.unit_price_aoa), quantity: Number(item.quantity), subtotalAoa: Number(item.subtotal_aoa) })), template, root);
  await getPool().execute(`INSERT INTO invoice_downloads (order_id, template, downloaded_by_user_id) VALUES (?, ?, ?)`, [found.order.id, template, admin?.id ?? null]);
  response.setHeader('Content-Type', 'application/pdf');
  response.setHeader('Content-Disposition', `attachment; filename="fatura-${found.order.order_number}-${template}.pdf"`);
  response.send(pdf);
}

app.get('/api/orders/:orderNumber/invoice', asyncRoute(async (request, response) => { await deliverInvoice(request, response, false); }));

app.get('/api/settings/exchange-rate', asyncRoute(async (_request, response) => {
  if (!requireDatabase(response)) {
    response.json({ usdToAoa: 913, source: 'Configuração inicial GameAO', updatedAt: '2026-01-01', note: 'Valor inicial sujeito a configuração.' });
    return;
  }
  const [rows] = await getPool().query<any[]>(`SELECT value_json FROM site_settings WHERE setting_key = 'exchange_rate' LIMIT 1`);
  const raw = rows[0]?.value_json;
  const config = typeof raw === 'string' ? JSON.parse(raw) : raw;
  response.json(config ?? { usdToAoa: 913, source: 'Configuração inicial GameAO', updatedAt: '2026-01-01', note: 'Valor inicial sujeito a configuração.' });
}));

app.put('/api/admin/settings/exchange-rate', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await requireAdmin(request, response);
  if (!user) return;
  const usdToAoa = Number(request.body?.usdToAoa);
  if (!Number.isFinite(usdToAoa) || usdToAoa <= 0) {
    response.status(400).json({ error: 'invalid_exchange_rate', message: 'A configuração monetária indicada é inválida.' });
    return;
  }
  const config = { usdToAoa, source: String(request.body?.source ?? 'Configuração administrativa').trim(), updatedAt: new Date().toISOString().slice(0, 10), note: String(request.body?.note ?? '').trim() };
  await getPool().execute(`INSERT INTO site_settings (setting_key, value_json) VALUES ('exchange_rate', ?) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json)`, [JSON.stringify(config)]);
  await recordAudit(user.id, 'update', 'setting', 'exchange_rate', config);
  response.json(config);
}));

app.get('/api/admin/overview', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await requireAdmin(request, response);
  if (!user) return;
  const [[orders]] = await getPool().query<any[]>(`SELECT COUNT(*) AS total, COALESCE(SUM(total_aoa), 0) AS revenue, COALESCE(SUM(CASE WHEN created_at::date = CURRENT_DATE THEN total_aoa ELSE 0 END), 0) AS revenue_today, COALESCE(SUM(CASE WHEN date_trunc('month', created_at) = date_trunc('month', NOW()) THEN total_aoa ELSE 0 END), 0) AS revenue_month, SUM(status = 'awaiting_payment') AS pending, SUM(payment_status = 'pending') AS payment_pending, SUM(payment_status = 'paid') AS paid, SUM(status = 'processing') AS processing, SUM(status = 'completed') AS completed FROM shop_orders`);
  const [[customers]] = await getPool().query<any[]>(`SELECT COUNT(*) AS total FROM app_users WHERE role = 'customer'`);
  const [[products]] = await getPool().query<any[]>(`SELECT COUNT(*) AS total, SUM(is_active = 1) AS active FROM catalog_products`);
  const [[posts]] = await getPool().query<any[]>(`SELECT COUNT(*) AS total, SUM(status = 'published') AS published FROM content_posts`);
  response.json({
    orders: { total: Number(orders?.total ?? 0), revenue: Number(orders?.revenue ?? 0), revenueToday: Number(orders?.revenue_today ?? 0), revenueMonth: Number(orders?.revenue_month ?? 0), pending: Number(orders?.pending ?? 0), paymentPending: Number(orders?.payment_pending ?? 0), paid: Number(orders?.paid ?? 0), processing: Number(orders?.processing ?? 0), completed: Number(orders?.completed ?? 0) },
    customers: { total: Number(customers?.total ?? 0) },
    products: { total: Number(products?.total ?? 0), active: Number(products?.active ?? 0) },
    posts: { total: Number(posts?.total ?? 0), published: Number(posts?.published ?? 0) },
  });
}));

app.get('/api/admin/orders', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await requireAdmin(request, response);
  if (!user) return;
  const [orders] = await getPool().query<any[]>(`SELECT o.*, COUNT(i.id) AS item_count FROM shop_orders o LEFT JOIN shop_order_items i ON i.order_id = o.id GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200`);
  response.json({ orders });
}));

const ORDER_STATUSES: OrderStatus[] = ['awaiting_payment', 'payment_verification', 'payment_confirmed', 'processing', 'ready_for_delivery', 'completed', 'cancelled', 'refunded'];
const ORDER_TRANSITIONS: Record<string, string[]> = {
  awaiting_payment: ['payment_verification', 'payment_confirmed', 'cancelled'],
  payment_verification: ['payment_confirmed', 'awaiting_payment', 'cancelled'],
  payment_confirmed: ['processing', 'completed', 'cancelled', 'refunded'],
  processing: ['ready_for_delivery', 'completed', 'cancelled', 'refunded'],
  ready_for_delivery: ['completed', 'cancelled', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  refunded: [],
};

app.patch('/api/admin/orders/:orderNumber/status', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response, 'orders');
  if (!admin) return;
  const nextStatus = String(request.body?.status ?? '') as OrderStatus;
  if (!ORDER_STATUSES.includes(nextStatus)) { response.status(400).json({ error: 'invalid_status', message: 'Estado de pedido inválido.' }); return; }
  const found = await findOrder(String(request.params.orderNumber));
  if (!found) { response.status(404).json({ error: 'order_not_found', message: 'Encomenda não encontrada.' }); return; }
  const previousStatus = String(found.order.status);
  if (previousStatus === nextStatus) { response.json({ order: found.order, notifications: { email: 'not_sent', whatsapp: 'not_sent' } }); return; }
  const allowed = ORDER_TRANSITIONS[previousStatus] ?? [];
  const forcedReopen = previousStatus === 'cancelled' && nextStatus === 'awaiting_payment' && request.body?.force === true;
  if (!allowed.includes(nextStatus) && !forcedReopen) {
    response.status(409).json({ error: 'invalid_transition', message: `Não é possível passar de "${previousStatus}" para "${nextStatus}" sem uma ação explícita.`, allowed });
    return;
  }
  await getPool().execute(`UPDATE shop_orders SET status = ? WHERE id = ?`, [nextStatus, found.order.id]);
  await getPool().execute(`INSERT INTO shop_order_status_history (order_id, from_status, to_status, note, changed_by_user_id) VALUES (?, ?, ?, ?, ?)`, [found.order.id, previousStatus, nextStatus, request.body?.note ?? null, admin.id]);
  if (nextStatus === 'cancelled' && Number(found.order.stock_released ?? 0) === 0) {
    for (const item of found.items as any[]) {
      if (!item.product_id) continue;
      const [restore] = await getPool().execute<any>(`UPDATE catalog_products SET stock_quantity = stock_quantity + ? WHERE id = ? AND stock_quantity IS NOT NULL`, [Number(item.quantity), item.product_id]);
      if (Number(restore.affectedRows ?? 0) > 0) {
        await getPool().execute(`INSERT INTO stock_movements (product_id, order_id, quantity_delta, reason, note, created_by_user_id) VALUES (?, ?, ?, 'order_cancelled', ?, ?)`, [item.product_id, found.order.id, Number(item.quantity), 'Stock reposto após cancelamento', admin.id]);
      }
    }
    await getPool().execute(`UPDATE shop_orders SET stock_released = 1 WHERE id = ?`, [found.order.id]);
  }
  const notifications = await notifyOrderStatusChanged({ id: Number(found.order.id), order_number: found.order.order_number, customer_name: found.order.customer_name, customer_email: found.order.customer_email, customer_phone: found.order.customer_phone }, nextStatus).catch((error) => {
    console.error('[notifications] estado atualizado; falha ao enfileirar notificação', error instanceof Error ? error.message : error);
    return { queued: false as const, error: 'Não foi possível enfileirar a notificação.' };
  });
  if (['payment_confirmed', 'processing', 'ready_for_delivery', 'completed'].includes(nextStatus)) await settleAffiliateCommission(Number(found.order.id));
  await recordAudit(admin.id, 'order.status_changed', 'shop_order', String(found.order.id), { from: previousStatus, to: nextStatus, notifications });
  response.json({ orderNumber: found.order.order_number, status: nextStatus, notifications });
}));

app.get('/api/admin/orders/:orderNumber/invoice', asyncRoute(async (request, response) => { await deliverInvoice(request, response, true); }));

app.get('/api/admin/products', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await requireAdmin(request, response);
  if (!user) return;
  response.json({ products: await readCatalogProducts(true) });
}));

function mediaKeyFromProductUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const url = value.trim();
  if (!url.startsWith('/media/')) return null;
  try { return url.slice('/media/'.length).split('/').map((part) => decodeURIComponent(part)).join('/'); } catch { return null; }
}

async function removeUnusedProductMedia(product: { image_url?: unknown; image_card_url?: unknown; additional_images_json?: unknown }): Promise<void> {
  const values = [product.image_url, product.image_card_url];
  try {
    const additional = typeof product.additional_images_json === 'string' ? JSON.parse(product.additional_images_json) : product.additional_images_json;
    if (Array.isArray(additional)) values.push(...additional);
  } catch { /* imagem adicional inválida não impede a eliminação do produto */ }
  const keys = [...new Set(values.map(mediaKeyFromProductUrl).filter((key): key is string => Boolean(key)))];
  for (const key of keys) {
    const [[media]] = await getPool().query<any[]>(`SELECT id, object_key, visibility FROM media_library WHERE object_key = ? LIMIT 1`, [key]);
    if (!media) continue;
    const [usage] = await getPool().query<any[]>(
      `SELECT COUNT(*) AS total FROM catalog_products WHERE image_url LIKE ? OR image_card_url LIKE ? OR additional_images_json::text LIKE ?
       UNION ALL SELECT COUNT(*) FROM content_posts WHERE image_url LIKE ? OR image_card_url LIKE ? OR image_thumb_url LIKE ?
       UNION ALL SELECT COUNT(*) FROM site_banners WHERE image_url LIKE ?`,
      [`%${key}%`, `%${key}%`, `%${key}%`, `%${key}%`, `%${key}%`, `%${key}%`, `%${key}%`],
    );
    const inUse = usage.reduce((total, item: any) => total + Number(item.total ?? 0), 0);
    if (inUse > 0) continue;
    await deleteMediaObject(String(media.object_key), media.visibility === 'private' ? 'private' : 'public');
    await getPool().execute(`DELETE FROM media_library WHERE id = ?`, [media.id]);
  }
}

app.post('/api/admin/products', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await requireAdmin(request, response);
  if (!user) return;
  const body = request.body ?? {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const basePriceUsd = Number(body.basePriceUsd);
  if (!name || !slug || !Number.isFinite(basePriceUsd) || basePriceUsd < 0 || typeof body.image !== 'string' || typeof body.imageCard !== 'string') {
    response.status(400).json({ error: 'invalid_product', message: 'Nome, slug, preço-base e imagens são obrigatórios.' });
    return;
  }
  const id = `game-${randomUUID()}`;
  await getPool().execute(
    `INSERT INTO catalog_products (id, slug, name, base_price_usd, sale_price_usd, rating, review_count, tags_json, image_url, image_card_url, is_hot, shop_order, short_description, description_json, release_year, developer, platform)
     VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, slug, name, basePriceUsd, body.salePriceUsd == null || body.salePriceUsd === '' ? null : Number(body.salePriceUsd), JSON.stringify(Array.isArray(body.tags) ? body.tags : []), body.image, body.imageCard, body.hot ? 1 : 0, Number(body.shopOrder ?? 999), body.shortDescription ?? '', JSON.stringify(Array.isArray(body.description) ? body.description : []), Number(body.releaseYear ?? new Date().getFullYear()), body.developer ?? '', body.platform ?? ''],
  );
  await getPool().execute(
    `UPDATE catalog_products SET category_type = ?, product_subtype = ?, requires_player_id = ?, sub_category = ?, shipping_cost_aoa = ?, additional_images_json = ?, video_url = ?, is_dynamic = ?, stock_quantity = ?, low_stock_threshold = ?, related_products_json = ?, seo_title = ?, seo_description = ? WHERE id = ?`,
    [body.categoryType === 'physical' ? 'physical' : 'digital', ['physical', 'digital_game', 'digital_other'].includes(body.productSubtype) ? body.productSubtype : 'digital_game', body.categoryType !== 'physical' && Boolean(body.requiresPlayerId) ? 1 : 0, typeof body.subCategory === 'string' ? body.subCategory.trim() || null : null, Math.max(0, Number(body.shippingCostAoa ?? 0)), JSON.stringify(Array.isArray(body.additionalImages) ? body.additionalImages.slice(0, 8) : []), typeof body.videoUrl === 'string' ? body.videoUrl.trim() || null : null, body.isDynamic ? 1 : 0, body.stockQuantity == null || body.stockQuantity === '' ? null : Math.max(0, Number(body.stockQuantity)), Math.max(0, Number(body.lowStockThreshold ?? 5)), JSON.stringify(Array.isArray(body.relatedProducts) ? body.relatedProducts : []), typeof body.seoTitle === 'string' ? body.seoTitle.trim() || null : null, typeof body.seoDescription === 'string' ? body.seoDescription.trim() || null : null, id],
  );
  if (Array.isArray(body.categoryIds)) {
    await getPool().execute(`DELETE FROM catalog_product_categories WHERE product_id = ?`, [id]);
    for (const categoryId of body.categoryIds.slice(0, 8).map(Number).filter((value: number) => Number.isInteger(value) && value > 0)) {
      await getPool().execute(`INSERT INTO catalog_product_categories (product_id, category_id) VALUES (?, ?) ON CONFLICT DO NOTHING`, [id, categoryId]);
    }
  }
  await recordAudit(user.id, 'create', 'product', id, { name, slug });
  response.status(201).json({ product: (await readCatalogProducts(true)).find((product) => product.id === id) });
}));

app.put('/api/admin/products/:id', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await requireAdmin(request, response);
  if (!user) return;
  const body = request.body ?? {};
  const id = String(request.params.id);
  const fields: Array<[string, string | number | null]> = [];
  const allowed: Record<string, string> = { name: 'name', slug: 'slug', basePriceUsd: 'base_price_usd', salePriceUsd: 'sale_price_usd', image: 'image_url', imageCard: 'image_card_url', shortDescription: 'short_description', releaseYear: 'release_year', developer: 'developer', platform: 'platform', hot: 'is_hot', shopOrder: 'shop_order', isActive: 'is_active', categoryType: 'category_type', productSubtype: 'product_subtype', requiresPlayerId: 'requires_player_id', subCategory: 'sub_category', shippingCostAoa: 'shipping_cost_aoa', videoUrl: 'video_url', isDynamic: 'is_dynamic', stockQuantity: 'stock_quantity', lowStockThreshold: 'low_stock_threshold', seoTitle: 'seo_title', seoDescription: 'seo_description' };
  for (const [input, column] of Object.entries(allowed)) {
    if (input in body) fields.push([column, ['hot', 'isActive', 'isDynamic'].includes(input) ? (body[input] ? 1 : 0) : input === 'requiresPlayerId' ? (body.categoryType === 'physical' ? 0 : body[input] ? 1 : 0) : body[input] === '' ? null : body[input]]);
  }
  if ('tags' in body) fields.push(['tags_json', JSON.stringify(Array.isArray(body.tags) ? body.tags : [])]);
  if ('description' in body) fields.push(['description_json', JSON.stringify(Array.isArray(body.description) ? body.description : [])]);
  if ('additionalImages' in body) fields.push(['additional_images_json', JSON.stringify(Array.isArray(body.additionalImages) ? body.additionalImages.slice(0, 8) : [])]);
  if ('relatedProducts' in body) fields.push(['related_products_json', JSON.stringify(Array.isArray(body.relatedProducts) ? body.relatedProducts : [])]);
  if (Array.isArray(body.categoryIds)) {
    await getPool().execute(`DELETE FROM catalog_product_categories WHERE product_id = ?`, [id]);
    for (const categoryId of body.categoryIds.slice(0, 8).map(Number).filter((value: number) => Number.isInteger(value) && value > 0)) {
      await getPool().execute(`INSERT INTO catalog_product_categories (product_id, category_id) VALUES (?, ?) ON CONFLICT DO NOTHING`, [id, categoryId]);
    }
  }
  if (fields.length === 0) {
    response.status(400).json({ error: 'empty_update', message: 'Nenhum campo foi alterado.' });
    return;
  }
  const [result] = await getPool().execute(`UPDATE catalog_products SET ${fields.map(([column]) => `\`${column}\` = ?`).join(', ')} WHERE id = ?`, [...fields.map(([, value]) => value), id]);
  if (!('affectedRows' in result) || result.affectedRows === 0) {
    response.status(404).json({ error: 'product_not_found', message: 'Produto não encontrado.' });
    return;
  }
  await recordAudit(user.id, 'update', 'product', id, { fields: fields.map(([column]) => column) });
  response.json({ product: (await readCatalogProducts(true)).find((product) => product.id === id) });
}));

app.delete('/api/admin/products/:id', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await requireAdmin(request, response);
  if (!user) return;
  const id = String(request.params.id);
  const [[product]] = await getPool().query<any[]>(`SELECT id, name, image_url, image_card_url, additional_images_json FROM catalog_products WHERE id = ? LIMIT 1`, [id]);
  if (!product) {
    response.status(404).json({ error: 'product_not_found', message: 'Produto não encontrado.' });
    return;
  }
  const [[orderUsage]] = await getPool().query<any[]>(`SELECT COUNT(*) AS total FROM shop_order_items WHERE product_id = ?`, [id]);
  if (Number(orderUsage?.total ?? 0) > 0) {
    response.status(409).json({ error: 'product_has_orders', message: 'Este produto já aparece em encomendas e não pode ser eliminado. Desative-o para o retirar da loja.' });
    return;
  }
  await withConnection(async (connection) => {
    await connection.beginTransaction();
    try {
      await connection.execute(`DELETE FROM catalog_products WHERE id = ?`, [id]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
  await removeUnusedProductMedia(product);
  await recordAudit(user.id, 'delete', 'product', id, { name: product.name, mediaCleanup: true });
  response.status(204).end();
}));

app.get('/api/admin/products/:id/variants', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response);
  if (!admin) return;
  const [variants] = await getPool().query<any[]>(`SELECT id, product_id, name, sku, price_usd, original_price_usd, description, is_active, sort_order FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC, id ASC`, [String(request.params.id)]);
  response.json({ variants });
}));

app.post('/api/admin/products/:id/variants', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response);
  if (!admin) return;
  const body = request.body ?? {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const priceUsd = Number(body.priceUsd);
  if (!name || !Number.isFinite(priceUsd) || priceUsd < 0) { response.status(400).json({ error: 'invalid_variant', message: 'Nome e preço válido são obrigatórios.' }); return; }
  const [result] = await getPool().execute<any>(`INSERT INTO product_variants (product_id, name, sku, price_usd, original_price_usd, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`, [String(request.params.id), name, typeof body.sku === 'string' ? body.sku.trim() || null : null, priceUsd, body.originalPriceUsd == null || body.originalPriceUsd === '' ? null : Number(body.originalPriceUsd), typeof body.description === 'string' ? body.description.trim() : '', Number(body.sortOrder ?? 0)]);
  await recordAudit(admin.id, 'create', 'product_variant', String(result.insertId), { productId: request.params.id, name });
  response.status(201).json({ variant: { id: Number(result.insertId), productId: String(request.params.id), name, priceUsd } });
}));

app.put('/api/admin/variants/:id', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response);
  if (!admin) return;
  const body = request.body ?? {};
  const fields: Array<[string, unknown]> = [];
  for (const [input, column] of [['name', 'name'], ['sku', 'sku'], ['description', 'description'], ['priceUsd', 'price_usd'], ['originalPriceUsd', 'original_price_usd'], ['sortOrder', 'sort_order'], ['isActive', 'is_active']] as const) {
    if (input in body) fields.push([column, input === 'isActive' ? (body[input] ? 1 : 0) : body[input] === '' ? null : body[input]]);
  }
  if (!fields.length) { response.status(400).json({ error: 'empty_update', message: 'Nenhuma definição foi alterada.' }); return; }
  await getPool().execute(`UPDATE product_variants SET ${fields.map(([column]) => `\"${column}\" = ?`).join(', ')}, updated_at = NOW() WHERE id = ?`, [...fields.map(([, value]) => value), Number(request.params.id)]);
  await recordAudit(admin.id, 'update', 'product_variant', String(request.params.id), { fields: fields.map(([column]) => column) });
  response.json({ ok: true });
}));

app.delete('/api/admin/variants/:id', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response);
  if (!admin) return;
  await getPool().execute(`DELETE FROM product_variants WHERE id = ?`, [Number(request.params.id)]);
  await recordAudit(admin.id, 'delete', 'product_variant', String(request.params.id));
  response.status(204).end();
}));

app.post('/api/freefire/verify', rateLimit({ windowMs: 60 * 60 * 1000, max: 40, message: 'Demasiadas verificações de ID. Aguarde alguns minutos.' }), asyncRoute(async (request, response) => {
  const playerId = typeof request.body?.playerId === 'string' ? request.body.playerId.trim() : '';
  if (!/^\d{5,20}$/.test(playerId)) { response.status(400).json({ error: 'invalid_player_id', message: 'Indique um ID Free Fire numérico válido.' }); return; }
  const rapidApiKey = process.env.RAPIDAPI_KEY?.trim() || process.env.FREEFIRE_VERIFY_API_KEY?.trim();
  const rapidApiHost = process.env.RAPIDAPI_HOST?.trim() || 'check-id-game1.p.rapidapi.com';
  const providerUrl = process.env.FREEFIRE_VERIFY_URL?.trim() || `https://${rapidApiHost}/api/game/free-fire-global-2?id=${encodeURIComponent(playerId)}`;
  if (!rapidApiKey && !process.env.FREEFIRE_VERIFY_URL?.trim()) { response.status(503).json({ error: 'not_configured', message: 'A verificação automática de Free Fire ainda não foi configurada pela GameAO.' }); return; }
  const providerResponse = await fetch(providerUrl, { method: 'GET', headers: { Accept: 'application/json', ...(rapidApiKey ? { 'x-rapidapi-key': rapidApiKey, 'x-rapidapi-host': rapidApiHost, Authorization: `Bearer ${rapidApiKey}` } : {}) }, signal: AbortSignal.timeout(12000) });
  if (!providerResponse.ok) { response.status(502).json({ error: 'provider_error', message: 'O serviço de verificação Free Fire não respondeu corretamente.' }); return; }
  const data = await providerResponse.json() as { status?: boolean; data?: { username?: string; level?: number; region?: string }; valid?: boolean; nickname?: string };
  const nickname = data.data?.username || data.nickname;
  if (!(data.status === true || data.valid === true) || !nickname) { response.status(422).json({ error: 'player_not_found', message: 'O ID Free Fire não foi validado.' }); return; }
  response.json({ verified: true, playerId, nickname: String(nickname).slice(0, 180), level: data.data?.level, region: data.data?.region });
}));

app.get('/api/account/freefire-ids', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await getAuthenticatedUser(request);
  if (!user) { response.status(401).json({ error: 'unauthorized', message: 'Inicie sessão para ver os IDs guardados.' }); return; }
  const [ids] = await getPool().query<any[]>(`SELECT id, player_id, player_nickname, verified_at FROM freefire_ids WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50`, [user.id]);
  response.json({ ids });
}));

app.post('/api/account/freefire-ids', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await getAuthenticatedUser(request);
  if (!user) { response.status(401).json({ error: 'unauthorized', message: 'Inicie sessão para guardar um ID.' }); return; }
  const playerId = String(request.body?.playerId ?? '').trim();
  const nickname = String(request.body?.nickname ?? '').trim();
  if (!/^[0-9]{5,20}$/.test(playerId) || !nickname) { response.status(400).json({ error: 'invalid_player', message: 'ID e nickname válidos são obrigatórios.' }); return; }
  await getPool().execute(`INSERT INTO freefire_ids (user_id, player_id, player_nickname) VALUES (?, ?, ?) ON CONFLICT (user_id, player_id) DO UPDATE SET player_nickname = EXCLUDED.player_nickname, verified_at = NOW(), updated_at = NOW()`, [user.id, playerId, nickname.slice(0, 180)]);
  response.status(201).json({ ok: true });
}));

app.get('/api/admin/status', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await getAuthenticatedUser(request);
  if (!isAdmin(user)) {
    response.status(403).json({ error: 'forbidden', message: 'Acesso administrativo não autorizado.' });
    return;
  }
  const [rows] = await getPool().query(`SELECT role, COUNT(*) AS count FROM app_users GROUP BY role`);
  response.json({ ok: true, user, usersByRole: rows });
}));

app.get('/api/admin/content/posts', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  if (!await requireAdmin(request, response)) return;
  const status = String(request.query.status ?? '').trim();
  const [rows] = await getPool().query<any[]>(`SELECT * FROM content_posts ${status ? 'WHERE status = ?' : ''} ORDER BY published_date DESC, created_at DESC LIMIT 200`, status ? [status] : []);
  response.json({ posts: rows.map(postView) });
}));

app.post('/api/admin/content/posts', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response); if (!admin) return;
  const body = request.body ?? {};
  const slug = String(body.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 200);
  const title = String(body.title ?? '').trim();
  if (!slug || !title) { response.status(400).json({ error: 'invalid_post', message: 'Título e slug são obrigatórios.' }); return; }
  const date = String(body.date ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
  const image = String(body.image ?? '/assets/blog/post-1.jpg');
  const status = ['draft', 'published', 'archived'].includes(String(body.status)) ? String(body.status) : 'draft';
  await getPool().execute(`INSERT INTO content_posts (slug, title, published_date, category, author, image_url, image_card_url, image_thumb_url, excerpt, tags_json, blocks_json, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [slug, title, date, String(body.category ?? 'Notícias'), String(body.author ?? admin.name), image, String(body.imageCard ?? image), String(body.imageThumb ?? image), String(body.excerpt ?? ''), JSON.stringify(Array.isArray(body.tags) ? body.tags : []), JSON.stringify(Array.isArray(body.blocks) ? body.blocks : [{ type: 'p', text: String(body.content ?? '') }]), status, status === 'published' ? new Date() : null]);
  await recordAudit(admin.id, 'content.post.create', 'content_post', slug, { title, status });
  response.status(201).json({ ok: true, slug });
}));

app.put('/api/admin/content/posts/:slug', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response); if (!admin) return;
  const body = request.body ?? {}; const fields: Array<[string, unknown]> = [];
  const allowed: Record<string, string> = { title: 'title', publishedDate: 'published_date', category: 'category', author: 'author', image: 'image_url', imageCard: 'image_card_url', imageThumb: 'image_thumb_url', excerpt: 'excerpt', status: 'status' };
  for (const [input, column] of Object.entries(allowed)) if (input in body) fields.push([column, body[input]]);
  if ('tags' in body) fields.push(['tags_json', JSON.stringify(Array.isArray(body.tags) ? body.tags : [])]);
  if ('blocks' in body) fields.push(['blocks_json', JSON.stringify(Array.isArray(body.blocks) ? body.blocks : [])]);
  if (fields.some(([column, value]) => column === 'status' && value === 'published')) fields.push(['published_at', new Date()]);
  if (!fields.length) { response.status(400).json({ error: 'empty_update', message: 'Nenhum campo foi alterado.' }); return; }
  await getPool().execute(`UPDATE content_posts SET ${fields.map(([column]) => `"${column}" = ?`).join(', ')}, updated_at = NOW() WHERE slug = ?`, [...fields.map(([, value]) => value), String(request.params.slug)]);
  await recordAudit(admin.id, 'content.post.update', 'content_post', String(request.params.slug), { fields: fields.map(([column]) => column) });
  response.json({ ok: true });
}));

app.delete('/api/admin/content/posts/:slug', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response); if (!admin) return;
  await getPool().execute(`UPDATE content_posts SET status = 'archived', updated_at = NOW() WHERE slug = ?`, [String(request.params.slug)]);
  await recordAudit(admin.id, 'content.post.archive', 'content_post', String(request.params.slug));
  response.status(204).end();
}));

app.get('/api/admin/banners', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return; if (!await requireAdmin(request, response)) return;
  const [banners] = await getPool().query<any[]>(`SELECT * FROM site_banners ORDER BY sort_order ASC, created_at DESC LIMIT 100`); response.json({ banners });
}));
app.post('/api/admin/banners', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return; const admin = await requireAdmin(request, response); if (!admin) return;
  const body = request.body ?? {}; const slug = String(body.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 160); const title = String(body.title ?? '').trim();
  if (!slug || !title || !String(body.image ?? '').trim()) { response.status(400).json({ error: 'invalid_banner', message: 'Slug, título e imagem são obrigatórios.' }); return; }
  await getPool().execute(`INSERT INTO site_banners (slug, title, description, image_url, button_label, href, variant, sort_order, is_active, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [slug, title, body.description ?? null, body.image, body.buttonLabel ?? null, body.href ?? null, body.variant ?? 'homepage', Number(body.sortOrder ?? 0), body.isActive === false ? 0 : 1, body.startsAt || null, body.endsAt || null]);
  await recordAudit(admin.id, 'content.banner.create', 'site_banner', slug); response.status(201).json({ ok: true, slug });
}));
app.put('/api/admin/banners/:id', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return; const admin = await requireAdmin(request, response); if (!admin) return;
  const body = request.body ?? {}; const fields: Array<[string, unknown]> = []; const allowed: Record<string, string> = { title: 'title', description: 'description', image: 'image_url', buttonLabel: 'button_label', href: 'href', variant: 'variant', sortOrder: 'sort_order', isActive: 'is_active', startsAt: 'starts_at', endsAt: 'ends_at' };
  for (const [input, column] of Object.entries(allowed)) if (input in body) fields.push([column, input === 'isActive' ? (body[input] ? 1 : 0) : body[input]]);
  if (!fields.length) { response.status(400).json({ error: 'empty_update', message: 'Nenhum campo foi alterado.' }); return; }
  await getPool().execute(`UPDATE site_banners SET ${fields.map(([column]) => `"${column}" = ?`).join(', ')}, updated_at = NOW() WHERE id = ?`, [...fields.map(([, value]) => value), Number(request.params.id)]); await recordAudit(admin.id, 'content.banner.update', 'site_banner', String(request.params.id)); response.json({ ok: true });
}));

app.get('/api/banners', asyncRoute(async (_request, response) => { if (!requireDatabase(response)) return; const [banners] = await getPool().query<any[]>(`SELECT * FROM site_banners WHERE is_active = 1 ORDER BY sort_order ASC LIMIT 30`); response.json({ banners }); }));

app.get('/api/admin/marketing/leads', asyncRoute(async (request, response) => { if (!requireDatabase(response)) return; if (!await requireAdmin(request, response)) return; const [leads] = await getPool().query<any[]>(`SELECT id, email, name, source, status, tags_json, created_at, updated_at FROM marketing_leads ORDER BY created_at DESC LIMIT 500`); response.json({ leads }); }));
app.patch('/api/admin/marketing/leads/:id', asyncRoute(async (request, response) => { if (!requireDatabase(response)) return; const admin = await requireAdmin(request, response); if (!admin) return; const status = ['subscribed', 'unsubscribed', 'bounced'].includes(String(request.body?.status)) ? String(request.body.status) : ''; if (!status) { response.status(400).json({ error: 'invalid_status', message: 'Estado de lead inválido.' }); return; } await getPool().execute(`UPDATE marketing_leads SET status = ?, updated_at = NOW() WHERE id = ?`, [status, Number(request.params.id)]); await recordAudit(admin.id, 'marketing.lead.update', 'marketing_lead', String(request.params.id), { status }); response.json({ ok: true }); }));

app.get('/api/admin/notifications', asyncRoute(async (request, response) => { if (!requireDatabase(response)) return; if (!await requireAdmin(request, response)) return; const [notifications] = await getPool().query<any[]>(`SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 200`); response.json({ notifications }); }));
app.post('/api/admin/notifications', asyncRoute(async (request, response) => { if (!requireDatabase(response)) return; const admin = await requireAdmin(request, response); if (!admin) return; const title = String(request.body?.title ?? '').trim(); const message = String(request.body?.message ?? '').trim(); if (!title || !message) { response.status(400).json({ error: 'invalid_notification', message: 'Título e mensagem são obrigatórios.' }); return; } const [result] = await getPool().execute<any>(`INSERT INTO admin_notifications (title, message, level, link, created_by_user_id) VALUES (?, ?, ?, ?, ?)`, [title, message, request.body?.level ?? 'info', request.body?.link ?? null, admin.id]); await recordAudit(admin.id, 'notification.create', 'admin_notification', String(result.insertId)); response.status(201).json({ ok: true }); }));
app.patch('/api/admin/notifications/:id/read', asyncRoute(async (request, response) => { if (!requireDatabase(response)) return; if (!await requireAdmin(request, response)) return; await getPool().execute(`UPDATE admin_notifications SET is_read = 1 WHERE id = ?`, [Number(request.params.id)]); response.json({ ok: true }); }));

app.get('/api/admin/email/templates', asyncRoute(async (request, response) => { if (!requireDatabase(response)) return; if (!await requireAdmin(request, response)) return; const [templates] = await getPool().query<any[]>(`SELECT * FROM email_templates ORDER BY name ASC LIMIT 100`); response.json({ templates }); }));
app.put('/api/admin/email/templates/:id', asyncRoute(async (request, response) => { if (!requireDatabase(response)) return; const admin = await requireAdmin(request, response); if (!admin) return; const body = request.body ?? {}; await getPool().execute(`UPDATE email_templates SET name = ?, subject = ?, body_html = ?, body_text = ?, is_active = ?, updated_at = NOW() WHERE id = ?`, [String(body.name ?? ''), String(body.subject ?? ''), String(body.bodyHtml ?? ''), String(body.bodyText ?? ''), body.isActive === false ? 0 : 1, Number(request.params.id)]); await recordAudit(admin.id, 'email.template.update', 'email_template', String(request.params.id)); response.json({ ok: true }); }));
app.get('/api/admin/email/campaigns', asyncRoute(async (request, response) => { if (!requireDatabase(response)) return; if (!await requireAdmin(request, response)) return; const [campaigns] = await getPool().query<any[]>(`SELECT * FROM email_campaigns ORDER BY created_at DESC LIMIT 100`); response.json({ campaigns }); }));
app.post('/api/admin/email/campaigns', asyncRoute(async (request, response) => { if (!requireDatabase(response)) return; const admin = await requireAdmin(request, response); if (!admin) return; const body = request.body ?? {}; const name = String(body.name ?? '').trim(); const subject = String(body.subject ?? '').trim(); const audienceStatus = String(body.audienceStatus ?? 'subscribed'); if (!name || !subject || !String(body.bodyHtml ?? '').trim()) { response.status(400).json({ error: 'invalid_campaign', message: 'Nome, assunto e conteúdo HTML são obrigatórios.' }); return; } if (audienceStatus !== 'subscribed') { response.status(400).json({ error: 'invalid_audience', message: 'As campanhas só podem ser enviadas para leads subscritos.' }); return; } const [result] = await getPool().execute<any>(`INSERT INTO email_campaigns (name, subject, body_html, body_text, audience_status, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?)`, [name, subject, body.bodyHtml, body.bodyText ?? '', 'subscribed', admin.id]); await recordAudit(admin.id, 'email.campaign.create', 'email_campaign', String(result.insertId)); response.status(201).json({ ok: true, id: result.insertId }); }));
app.get('/api/admin/email/status', asyncRoute(async (request, response) => { if (!requireDatabase(response)) return; if (!await requireAdmin(request, response)) return; response.json({ configured: emailConfigured(), from: process.env.SMTP_FROM || process.env.EMAIL_FROM ? 'configurado' : 'não configurado' }); }));
app.post('/api/admin/email/campaigns/:id/send', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response); if (!admin) return;
  if (!emailConfigured()) { response.status(503).json({ error: 'email_not_configured', message: 'Configure servidor, utilizador, palavra-passe e remetente SMTP no Render antes de enviar.' }); return; }
  const campaignId = Number(request.params.id);
  const [[campaign]] = await getPool().query<any[]>(`SELECT * FROM email_campaigns WHERE id = ? LIMIT 1`, [campaignId]);
  if (!campaign) { response.status(404).json({ error: 'campaign_not_found', message: 'Campanha não encontrada.' }); return; }
  if (String(campaign.audience_status) !== 'subscribed') { response.status(409).json({ error: 'invalid_audience', message: 'Esta campanha não está limitada a leads subscritos.' }); return; }
  // A job interrupted after a provider accepted some recipients cannot be safely retried.
  // Only drafts may start; failed/stale campaigns require review instead of a blind resend.
  const [lock] = await getPool().execute<any>(`UPDATE email_campaigns SET status = 'sending', updated_at = NOW() WHERE id = ? AND audience_status = 'subscribed' AND status = 'draft'`, [campaignId]);
  if (Number(lock.affectedRows ?? 0) !== 1) { response.status(409).json({ error: 'campaign_in_progress', message: 'Esta campanha já foi enviada ou está a ser processada por outro administrador.' }); return; }
  let jobId: string;
  try {
    jobId = await enqueueNotificationJob({ kind: 'campaign_send', campaignId });
  } catch (error) {
    await getPool().execute(`UPDATE email_campaigns SET status = 'failed', updated_at = NOW() WHERE id = ?`, [campaignId]);
    throw error;
  }
  await recordAudit(admin.id, 'email.campaign.send', 'email_campaign', String(campaignId), { status: 'queued', jobId }).catch((error) => console.error('[audit] campanha enfileirada, mas a auditoria falhou', error instanceof Error ? error.message : error));
  response.status(202).json({ ok: true, queued: true, jobId, status: 'queued' });
}));

async function serveApp(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  let vite: ViteDevServer | undefined;
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({ server: { middlewareMode: true, host: '0.0.0.0' }, appType: 'spa', root });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(root, 'dist'), { index: false }));
  }

  app.use(async (request, response, next) => {
    if (request.path.startsWith('/api/') || request.path === '/_app/health') return next();
    try {
      const indexPath = path.join(root, isProduction ? 'dist/index.html' : 'index.html');
      let html = fs.readFileSync(indexPath, 'utf8');
      if (vite) html = await vite.transformIndexHtml(request.originalUrl, html);
      html = await injectSeo(html, request);
      response.status(200).type('html').send(html);
    } catch (error) {
      if (vite) vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    console.error('[server]', error instanceof Error ? error.message : 'Erro interno');
    if (response.headersSent) return;
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'O ficheiro é demasiado grande. O limite é 12 MB por ficheiro.'
        : error.code === 'LIMIT_FILE_COUNT'
          ? 'Envie apenas um ficheiro de cada vez.'
          : 'Não foi possível processar o ficheiro enviado.';
      response.status(413).json({ error: 'file_too_large', message });
      return;
    }
    response.status(500).json({ error: 'internal_error', message: 'Ocorreu um erro interno.' });
  });

  app.listen(port, '0.0.0.0', () => console.log(`[gameao] servidor em http://0.0.0.0:${port}`));
  databaseState = await initializePersistence();
  console.log(`[gameao] base de dados: ${databaseState.ready ? 'pronta' : databaseState.error ?? 'não configurada'}`);
  if (databaseState.ready) startNotificationWorker();
}

void serveApp();
