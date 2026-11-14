import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import type { ViteDevServer } from 'vite';
import { getPool, hasDatabaseUrl } from './db';
import { initializePersistence } from './bootstrap';
import { authenticateUser, clearSessionCookie, createSession, destroySession, getAuthenticatedUser, isAdmin, registerUser } from './auth';
import { createInvoicePdf, type InvoiceTemplate } from './invoices';
import { notifyOrderStatusChanged, type OrderStatus } from './notifications';
import { getPrivateObjectUrl, isStorageConfigured, publicObjectUrl, putPrivateObject } from './storage';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = express();
const port = Number(process.env.PORT ?? 3000);
let databaseState: { configured: boolean; ready: boolean; error?: string } = { configured: hasDatabaseUrl(), ready: false };

app.disable('x-powered-by');
app.use('/api', express.json({ limit: '1mb' }));
const proofUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

const PROOF_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
const PROOF_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

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

async function requireAdmin(request: Request, response: Response) {
  const user = await getAuthenticatedUser(request);
  if (!isAdmin(user)) {
    response.status(403).json({ error: 'forbidden', message: 'Acesso administrativo não autorizado.' });
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
    `SELECT p.*, STRING_AGG(c.slug, ',' ORDER BY c.slug) AS category_slugs
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

app.post('/api/auth/register', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const { email, password, name, phone } = request.body ?? {};
  if (!validEmail(email) || typeof password !== 'string' || password.length < 6 || typeof name !== 'string' || name.trim().length < 2) {
    response.status(400).json({ error: 'invalid_registration', message: 'Indique um nome, email válido e palavra-passe com pelo menos 6 caracteres.' });
    return;
  }
  try {
    const user = await registerUser({ email, password, name, phone });
    await createSession(user.id, request, response);
    response.status(201).json({ user });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      response.status(409).json({ error: 'email_in_use', message: 'Já existe uma conta com este email.' });
      return;
    }
    throw error;
  }
}));

app.post('/api/auth/login', asyncRoute(async (request, response) => {
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
  response.json({ user });
}));

app.post('/api/auth/logout', asyncRoute(async (request, response) => {
  if (databaseState.ready) await destroySession(request);
  clearSessionCookie(response, request);
  response.status(204).end();
}));

app.post('/api/auth/password-reset', asyncRoute(async (_request, response) => {
  if (!requireDatabase(response)) return;
  response.status(503).json({
    error: 'email_not_configured',
    message: 'A recuperação de palavra-passe ficará disponível depois de configurar o serviço de email no painel administrativo.',
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
    if (typeof error === 'object' && error && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      response.status(409).json({ error: 'email_in_use', message: 'Já existe uma conta com este email.' });
      return;
    }
    throw error;
  }
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

async function findOrder(orderNumber: string) {
  const [[order]] = await getPool().query<any[]>(`SELECT * FROM shop_orders WHERE order_number = ? LIMIT 1`, [orderNumber]);
  if (!order) return null;
  const [items] = await getPool().query<any[]>(`SELECT i.*, p.image_card_url FROM shop_order_items i LEFT JOIN catalog_products p ON p.id = i.product_id WHERE i.order_id = ? ORDER BY i.id ASC`, [order.id]);
  const [[paymentMethod]] = await getPool().query<any[]>(`SELECT id, code, name, description, instructions, receiving_data_json, requires_proof, payment_deadline_hours, customer_message FROM payment_methods WHERE id = ? LIMIT 1`, [order.payment_method_id]);
  const [proofs] = await getPool().query<any[]>(`SELECT id, original_name, mime_type, size_bytes, status, admin_note, submitted_at, reviewed_at FROM payment_proofs WHERE order_id = ? ORDER BY submitted_at DESC`, [order.id]);
  return { order, items, paymentMethod: paymentMethod ? { ...paymentMethod, receiving_data: typeof paymentMethod.receiving_data_json === 'string' ? JSON.parse(paymentMethod.receiving_data_json) : paymentMethod.receiving_data_json } : null, proofs };
}

function chooseInvoiceTemplate(value: unknown): InvoiceTemplate { return value === 'modern' ? 'modern' : 'classic'; }

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

app.post('/api/orders/:orderNumber/proofs', proofUpload.single('file'), asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  if (!isStorageConfigured()) { response.status(503).json({ error: 'storage_not_configured', message: 'O armazenamento seguro de comprovativos ainda não está configurado.' }); return; }
  const email = String(request.body?.email ?? '').trim().toLowerCase();
  const file = request.file;
  const found = await findOrder(String(request.params.orderNumber).trim().toUpperCase());
  if (!found || !validEmail(email) || email !== String(found.order.customer_email).toLowerCase()) { response.status(404).json({ error: 'order_not_found', message: 'Encomenda não encontrada.' }); return; }
  if (!file) { response.status(400).json({ error: 'file_required', message: 'Selecione um comprovativo.' }); return; }
  const extension = safeFileExtension(file.originalname);
  if (!PROOF_EXTENSIONS.has(extension) || !PROOF_MIME_TYPES.has(file.mimetype) || !hasValidFileSignature(file)) {
    response.status(400).json({ error: 'invalid_file', message: 'O ficheiro deve ser JPG, PNG, WEBP ou PDF válido.' }); return;
  }
  const key = `payment-proofs/${found.order.order_number}/${randomUUID()}${extension === '.jpeg' ? '.jpg' : extension}`;
  await putPrivateObject(key, file.buffer, file.mimetype);
  await getPool().execute(`INSERT INTO payment_proofs (order_id, payment_method_id, storage_key, original_name, mime_type, size_bytes, status) VALUES (?, ?, ?, ?, ?, ?, 'submitted')`, [found.order.id, found.order.payment_method_id ?? null, key, file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255), file.mimetype, file.size]);
  if (found.order.status === 'awaiting_payment') await getPool().execute(`UPDATE shop_orders SET status = 'payment_verification' WHERE id = ?`, [found.order.id]);
  response.status(201).json({ ok: true, status: 'submitted', message: 'Comprovativo recebido. A confirmação será feita pela equipa GameAO após verificação.' });
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
  const [[order]] = await getPool().query<any[]>(`SELECT order_number, payment_status, status FROM shop_orders WHERE id = ? LIMIT 1`, [proof.order_id]);
  if (!order) { response.status(404).json({ error: 'order_not_found', message: 'Encomenda não encontrada.' }); return; }
  await getPool().execute(`UPDATE payment_proofs SET status = ?, admin_note = ?, reviewed_at = NOW(), reviewed_by_user_id = ? WHERE id = ?`, [nextProofStatus, note, admin.id, proof.id]);
  if (action === 'approve') await getPool().execute(`UPDATE shop_orders SET payment_status = 'paid', status = 'payment_confirmed' WHERE id = ?`, [proof.order_id]);
  if (action === 'reject' || action === 'request_new') await getPool().execute(`UPDATE shop_orders SET payment_status = 'pending', status = 'awaiting_payment' WHERE id = ? AND payment_status <> 'paid'`, [proof.order_id]);
  await recordAudit(admin.id, `payment_proof.${action}`, 'payment_proof', String(proof.id), { orderNumber: order.order_number, note });
  response.json({ ok: true, proofStatus: nextProofStatus, orderNumber: order.order_number });
}));

app.post('/api/orders', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const body = request.body ?? {};
  const customer = body.customer ?? {};
  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (!rawItems.length || !validEmail(customer.email) || !customer.firstName || !customer.lastName || !customer.phone) {
    response.status(400).json({ error: 'invalid_order', message: 'Nome, telefone, email e produtos da encomenda são obrigatórios.' }); return;
  }
  const user = await getAuthenticatedUser(request);
  const paymentMethodCode = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : '';
  let paymentMethod: any = null;
  if (paymentMethodCode) {
    const [[selectedMethod]] = await getPool().query<any[]>(`SELECT id, code, name, requires_proof FROM payment_methods WHERE code = ? AND is_active = 1 LIMIT 1`, [paymentMethodCode]);
    if (!selectedMethod) { response.status(400).json({ error: 'invalid_payment_method', message: 'O método de pagamento selecionado não está disponível.' }); return; }
    paymentMethod = selectedMethod;
  }
  const [settingRows] = await getPool().query<any[]>(`SELECT value_json FROM site_settings WHERE setting_key = 'exchange_rate' LIMIT 1`);
  const rawSetting = settingRows[0]?.value_json;
  const setting = typeof rawSetting === 'string' ? JSON.parse(rawSetting) : rawSetting;
  const rate = Number(setting?.usdToAoa ?? body.rate ?? 913);
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const items: Array<{ id: string; variantId: number | null; variantName: string | null; name: string; unit: number; qty: number; subtotal: number; categoryType: string; productSubtype: string; shipping: number; playerId: string | null; playerNickname: string | null; image: string }> = [];
    for (const raw of rawItems) {
      const productId = String(raw.productId ?? '');
      const qty = Math.max(1, Math.min(99, Math.floor(Number(raw.qty) || 1)));
      const [[product]] = await connection.query<any[]>(`SELECT id, name, base_price_usd, sale_price_usd, category_type, product_subtype, requires_player_id, shipping_cost_aoa, image_card_url FROM catalog_products WHERE id = ? AND is_active = 1 LIMIT 1`, [productId]);
      if (!product) continue;
      const variantId = raw.variantId == null ? null : Number(raw.variantId);
      let variant: any = null;
      if (variantId) {
        const [[foundVariant]] = await connection.query<any[]>(`SELECT id, name, price_usd FROM product_variants WHERE id = ? AND product_id = ? AND is_active = 1 LIMIT 1`, [variantId, product.id]);
        variant = foundVariant;
        if (!variant) { await connection.rollback(); response.status(400).json({ error: 'invalid_variant', message: 'A variante selecionada já não está disponível.' }); return; }
      }
      const unit = Number(variant?.price_usd ?? product.sale_price_usd ?? product.base_price_usd);
      const requiresPlayer = Boolean(product.requires_player_id) || product.product_subtype === 'digital_game' && /free\s*fire|freefire|garena/i.test(String(product.name));
      const playerId = typeof raw.playerId === 'string' && raw.playerId.trim() ? raw.playerId.trim().slice(0, 120) : null;
      const playerNickname = typeof raw.playerNickname === 'string' && raw.playerNickname.trim() ? raw.playerNickname.trim().slice(0, 180) : null;
      if (requiresPlayer && !playerId) { await connection.rollback(); response.status(400).json({ error: 'player_id_required', message: `O ID do jogador é obrigatório para ${product.name}.` }); return; }
      items.push({ id: product.id, variantId: variant?.id ?? null, variantName: variant?.name ?? null, name: product.name, unit, qty, subtotal: unit * qty * rate, categoryType: product.category_type ?? 'digital', productSubtype: product.product_subtype ?? 'digital_game', shipping: product.category_type === 'physical' ? Math.max(0, Number(product.shipping_cost_aoa ?? 0)) : 0, playerId, playerNickname, image: product.image_card_url });
    }
    if (!items.length) { await connection.rollback(); response.status(400).json({ error: 'empty_order', message: 'Nenhum produto válido foi encontrado.' }); return; }
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const shipping = items.reduce((sum, item) => sum + item.shipping, 0);
    const hasPhysical = items.some((item) => item.categoryType === 'physical');
    if (hasPhysical && (!String(body.deliveryAddress ?? customer.address).trim() || !String(customer.city ?? '').trim() || !String(customer.province ?? '').trim())) { await connection.rollback(); response.status(400).json({ error: 'delivery_address_required', message: 'Produtos físicos exigem um endereço de entrega completo.' }); return; }
    const deliveryDate = body.deliveryDate ? String(body.deliveryDate).slice(0, 10) : null;
    const [insert] = await connection.execute<any>(`INSERT INTO shop_orders (order_number, access_token_hash, user_id, customer_name, customer_email, customer_phone, billing_address, billing_city, billing_province, delivery_address, delivery_date, subtotal_aoa, shipping_aoa, discount_aoa, total_aoa, exchange_rate_usd_aoa, status, payment_status, payment_method, payment_method_id, payment_reference, internal_notes) VALUES (?, SHA2(UUID(), 256), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'awaiting_payment', 'pending', ?, ?, ?, ?) RETURNING id`, [`GA-PENDING-${randomUUID()}`, user?.id ?? null, `${customer.firstName} ${customer.lastName}`.trim(), customer.email.trim().toLowerCase(), customer.phone.trim(), [customer.address, customer.apartment].filter(Boolean).join(', '), customer.city, customer.province, String(body.deliveryAddress ?? customer.address).trim(), deliveryDate, subtotal, shipping, subtotal + shipping, rate, paymentMethod?.code ?? null, paymentMethod?.id ?? null, `GA-PAY-${randomUUID().slice(0, 12).toUpperCase()}`, customer.notes ?? null]);
    const orderId = Number(Array.isArray(insert) ? insert[0]?.id : insert?.insertId);
    if (!Number.isInteger(orderId) || orderId <= 0) throw new Error('A base de dados não devolveu o identificador da encomenda.');
    const orderNumber = `GA${orderId}`;
    await connection.execute(`UPDATE shop_orders SET order_number = ?, invoice_issued_at = NOW() WHERE id = ?`, [orderNumber, orderId]);
    for (const item of items) await connection.execute(`INSERT INTO shop_order_items (order_id, product_id, product_name, variant_id, variant_name, unit_price_aoa, quantity, subtotal_aoa, player_id, player_nickname, category_type, product_subtype, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [orderId, item.id, item.name, item.variantId, item.variantName, item.unit * rate, item.qty, item.subtotal, item.playerId, item.playerNickname, item.categoryType, item.productSubtype, item.image]);
    await connection.execute(`INSERT INTO shop_order_status_history (order_id, from_status, to_status, note, changed_by_user_id) VALUES (?, NULL, 'awaiting_payment', 'Encomenda criada no checkout.', ?)`, [orderId, user?.id ?? null]);
    await connection.commit();
    response.status(201).json({ orderNumber, totalAoa: subtotal + shipping, subtotalAoa: subtotal, shippingAoa: shipping, invoiceTemplates: ['classic', 'modern'] });
  } catch (error) {
    await connection.rollback();
    console.error('[orders] falha ao criar encomenda', error instanceof Error ? error.message : error);
    response.status(500).json({ error: 'order_creation_failed', message: 'Não foi possível concluir a encomenda neste momento. Tente novamente.' });
  } finally { connection.release(); }
}));

app.get('/api/orders/:orderNumber', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const found = await findOrder(String(request.params.orderNumber));
  if (!found || (request.query.email && String(request.query.email).toLowerCase() !== String(found.order.customer_email).toLowerCase())) { response.status(404).json({ error: 'order_not_found', message: 'Encomenda não encontrada.' }); return; }
  response.json({ order: found.order, items: found.items });
}));

async function deliverInvoice(request: Request, response: Response, adminOnly: boolean): Promise<void> {
  if (!requireDatabase(response)) return;
  const admin = adminOnly ? await requireAdmin(request, response) : null;
  if (adminOnly && !admin) return;
  const found = await findOrder(String(request.params.orderNumber));
  const emailMatches = String(request.query.email ?? '').toLowerCase() === String(found?.order.customer_email ?? '').toLowerCase();
  if (!found || (!adminOnly && !emailMatches)) { response.status(404).json({ error: 'order_not_found', message: 'Encomenda não encontrada.' }); return; }
  const template = chooseInvoiceTemplate(request.query.template);
  const pdf = await createInvoicePdf({ orderNumber: found.order.order_number, createdAt: found.order.created_at, customerName: found.order.customer_name, customerEmail: found.order.customer_email, customerPhone: found.order.customer_phone, billingAddress: found.order.billing_address, billingCity: found.order.billing_city, billingProvince: found.order.billing_province, subtotalAoa: Number(found.order.subtotal_aoa), discountAoa: Number(found.order.discount_aoa), totalAoa: Number(found.order.total_aoa), exchangeRate: Number(found.order.exchange_rate_usd_aoa), status: found.order.status, paymentStatus: found.order.payment_status }, found.items.map((item: any) => ({ name: item.product_name, imageUrl: item.image_card_url, unitPriceAoa: Number(item.unit_price_aoa), quantity: Number(item.quantity), subtotalAoa: Number(item.subtotal_aoa) })), template, root);
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
    response.status(400).json({ error: 'invalid_exchange_rate', message: 'Indique uma taxa USD/AOA superior a zero.' });
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

const ORDER_STATUSES: OrderStatus[] = ['awaiting_payment', 'payment_confirmed', 'processing', 'ready_for_delivery', 'completed', 'cancelled', 'refunded'];

app.patch('/api/admin/orders/:orderNumber/status', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response);
  if (!admin) return;
  const nextStatus = String(request.body?.status ?? '') as OrderStatus;
  if (!ORDER_STATUSES.includes(nextStatus)) { response.status(400).json({ error: 'invalid_status', message: 'Estado de pedido inválido.' }); return; }
  const found = await findOrder(String(request.params.orderNumber));
  if (!found) { response.status(404).json({ error: 'order_not_found', message: 'Encomenda não encontrada.' }); return; }
  const previousStatus = String(found.order.status);
  if (previousStatus === nextStatus) { response.json({ order: found.order, notifications: { email: 'not_sent', whatsapp: 'not_sent' } }); return; }
  await getPool().execute(`UPDATE shop_orders SET status = ? WHERE id = ?`, [nextStatus, found.order.id]);
  await getPool().execute(`INSERT INTO shop_order_status_history (order_id, from_status, to_status, note, changed_by_user_id) VALUES (?, ?, ?, ?, ?)`, [found.order.id, previousStatus, nextStatus, request.body?.note ?? null, admin.id]);
  const notifications = await notifyOrderStatusChanged({ id: Number(found.order.id), order_number: found.order.order_number, customer_name: found.order.customer_name, customer_email: found.order.customer_email, customer_phone: found.order.customer_phone }, nextStatus);
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

app.post('/api/admin/media', imageUpload.single('file'), asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const admin = await requireAdmin(request, response);
  if (!admin) return;
  if (!isStorageConfigured()) { response.status(503).json({ error: 'storage_not_configured', message: 'O armazenamento R2 ainda não está configurado.' }); return; }
  const file = request.file;
  const kind = String(request.body?.kind ?? 'product').replace(/[^a-z0-9_-]/gi, '').slice(0, 32) || 'product';
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) || !hasValidImageSignature(file)) { response.status(400).json({ error: 'invalid_image', message: 'Envie uma imagem JPG, PNG ou WEBP válida.' }); return; }
  const extension = file.mimetype === 'image/jpeg' ? '.jpg' : file.mimetype === 'image/png' ? '.png' : '.webp';
  const key = `media/${kind}/${randomUUID()}${extension}`;
  await putPrivateObject(key, file.buffer, file.mimetype);
  const url = publicObjectUrl(key) ?? await getPrivateObjectUrl(key, 3600);
  await recordAudit(admin.id, 'media.upload', 'media', key, { kind, mimeType: file.mimetype, size: file.size });
  response.status(201).json({ key, url, public: Boolean(publicObjectUrl(key)) });
}));

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
    `UPDATE catalog_products SET category_type = ?, product_subtype = ?, requires_player_id = ?, sub_category = ?, shipping_cost_aoa = ?, additional_images_json = ?, video_url = ?, is_dynamic = ? WHERE id = ?`,
    [body.categoryType === 'physical' ? 'physical' : 'digital', ['physical', 'digital_game', 'digital_other'].includes(body.productSubtype) ? body.productSubtype : 'digital_game', body.requiresPlayerId ? 1 : 0, typeof body.subCategory === 'string' ? body.subCategory.trim() || null : null, Math.max(0, Number(body.shippingCostAoa ?? 0)), JSON.stringify(Array.isArray(body.additionalImages) ? body.additionalImages.slice(0, 8) : []), typeof body.videoUrl === 'string' ? body.videoUrl.trim() || null : null, body.isDynamic ? 1 : 0, id],
  );
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
  const allowed: Record<string, string> = { name: 'name', slug: 'slug', basePriceUsd: 'base_price_usd', salePriceUsd: 'sale_price_usd', image: 'image_url', imageCard: 'image_card_url', shortDescription: 'short_description', releaseYear: 'release_year', developer: 'developer', platform: 'platform', hot: 'is_hot', shopOrder: 'shop_order', isActive: 'is_active', categoryType: 'category_type', productSubtype: 'product_subtype', requiresPlayerId: 'requires_player_id', subCategory: 'sub_category', shippingCostAoa: 'shipping_cost_aoa', videoUrl: 'video_url', isDynamic: 'is_dynamic' };
  for (const [input, column] of Object.entries(allowed)) {
    if (input in body) fields.push([column, ['hot', 'isActive', 'requiresPlayerId', 'isDynamic'].includes(input) ? (body[input] ? 1 : 0) : body[input] === '' ? null : body[input]]);
  }
  if ('tags' in body) fields.push(['tags_json', JSON.stringify(Array.isArray(body.tags) ? body.tags : [])]);
  if ('description' in body) fields.push(['description_json', JSON.stringify(Array.isArray(body.description) ? body.description : [])]);
  if ('additionalImages' in body) fields.push(['additional_images_json', JSON.stringify(Array.isArray(body.additionalImages) ? body.additionalImages.slice(0, 8) : [])]);
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
  const [result] = await getPool().execute(`UPDATE catalog_products SET is_active = 0 WHERE id = ?`, [id]);
  if (!('affectedRows' in result) || result.affectedRows === 0) {
    response.status(404).json({ error: 'product_not_found', message: 'Produto não encontrado.' });
    return;
  }
  await recordAudit(user.id, 'deactivate', 'product', id);
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

app.post('/api/freefire/verify', asyncRoute(async (request, response) => {
  const playerId = typeof request.body?.playerId === 'string' ? request.body.playerId.trim() : '';
  if (!/^[0-9]{5,20}$/.test(playerId)) { response.status(400).json({ error: 'invalid_player_id', message: 'Indique um ID Free Fire numérico válido.' }); return; }
  const providerUrl = process.env.FREEFIRE_VERIFY_URL?.trim();
  if (!providerUrl) { response.status(503).json({ error: 'not_configured', message: 'A verificação automática de Free Fire ainda não foi configurada pela GameAO.' }); return; }
  const providerResponse = await fetch(providerUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.FREEFIRE_VERIFY_API_KEY ? { Authorization: `Bearer ${process.env.FREEFIRE_VERIFY_API_KEY}` } : {}) }, body: JSON.stringify({ playerId }) });
  if (!providerResponse.ok) { response.status(502).json({ error: 'provider_error', message: 'O serviço de verificação Free Fire não respondeu corretamente.' }); return; }
  const data = await providerResponse.json() as { valid?: boolean; nickname?: string };
  if (!data.valid || !data.nickname) { response.status(422).json({ error: 'player_not_found', message: 'O ID Free Fire não foi validado.' }); return; }
  response.json({ verified: true, playerId, nickname: String(data.nickname).slice(0, 180) });
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

async function serveApp(): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  let vite: ViteDevServer | undefined;
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({ server: { middlewareMode: true, host: '0.0.0.0' }, appType: 'spa', root });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(root, 'dist')));
  }

  app.use(async (request, response, next) => {
    if (request.path.startsWith('/api/') || request.path === '/_app/health') return next();
    try {
      const indexPath = path.join(root, isProduction ? 'dist/index.html' : 'index.html');
      let html = fs.readFileSync(indexPath, 'utf8');
      if (vite) html = await vite.transformIndexHtml(request.originalUrl, html);
      response.status(200).type('html').send(html);
    } catch (error) {
      if (vite) vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    console.error('[server]', error instanceof Error ? error.message : 'Erro interno');
    response.status(500).json({ error: 'internal_error', message: 'Ocorreu um erro interno.' });
  });

  app.listen(port, '0.0.0.0', () => console.log(`[gameao] servidor em http://0.0.0.0:${port}`));
  databaseState = await initializePersistence();
  console.log(`[gameao] base de dados: ${databaseState.ready ? 'pronta' : databaseState.error ?? 'não configurada'}`);
}

void serveApp();
