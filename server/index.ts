import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import { getPool, hasDatabaseUrl } from './db';
import { initializePersistence } from './bootstrap';
import { authenticateUser, clearSessionCookie, createSession, destroySession, getAuthenticatedUser, isAdmin, registerUser } from './auth';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = express();
const port = Number(process.env.PORT ?? 3000);
let databaseState: { configured: boolean; ready: boolean; error?: string } = { configured: hasDatabaseUrl(), ready: false };

app.disable('x-powered-by');
app.use('/api', express.json({ limit: '1mb' }));

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

async function readCatalogProducts(includeInactive = false) {
  const [rows] = await getPool().query<any[]>(
    `SELECT p.*, GROUP_CONCAT(c.slug ORDER BY c.slug SEPARATOR ',') AS category_slugs
       FROM catalog_products p
       LEFT JOIN catalog_product_categories pc ON pc.product_id = p.id
       LEFT JOIN catalog_categories c ON c.id = pc.category_id
      ${includeInactive ? '' : 'WHERE p.is_active = 1'}
      GROUP BY p.id
      ORDER BY p.shop_order ASC, p.name ASC`,
  );
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    basePriceUsd: Number(row.base_price_usd),
    salePriceUsd: row.sale_price_usd === null ? undefined : Number(row.sale_price_usd),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    categories: row.category_slugs ? String(row.category_slugs).split(',') : [],
    tags: JSON.parse(String(row.tags_json ?? '[]')),
    image: row.image_url,
    imageCard: row.image_card_url,
    hot: Boolean(row.is_hot),
    shopOrder: Number(row.shop_order),
    featuredOrder: row.featured_order === null ? undefined : Number(row.featured_order),
    recentOrder: row.recent_order === null ? undefined : Number(row.recent_order),
    dealOrder: row.deal_order === null ? undefined : Number(row.deal_order),
    shortDescription: row.short_description,
    description: JSON.parse(String(row.description_json ?? '[]')),
    releaseYear: Number(row.release_year),
    developer: row.developer,
    platform: row.platform,
    isActive: Boolean(row.is_active),
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
  if (!validEmail(email) || typeof password !== 'string' || password.length < 8 || typeof name !== 'string' || name.trim().length < 2) {
    response.status(400).json({ error: 'invalid_registration', message: 'Indique um nome, email válido e palavra-passe com pelo menos 8 caracteres.' });
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
  const [[orders]] = await getPool().query<any[]>(`SELECT COUNT(*) AS total, SUM(status = 'awaiting_payment') AS pending, SUM(payment_status = 'paid') AS paid FROM shop_orders`);
  const [[customers]] = await getPool().query<any[]>(`SELECT COUNT(*) AS total FROM app_users WHERE role = 'customer'`);
  const [[products]] = await getPool().query<any[]>(`SELECT COUNT(*) AS total, SUM(is_active = 1) AS active FROM catalog_products`);
  const [[posts]] = await getPool().query<any[]>(`SELECT COUNT(*) AS total, SUM(status = 'published') AS published FROM content_posts`);
  response.json({
    orders: { total: Number(orders?.total ?? 0), pending: Number(orders?.pending ?? 0), paid: Number(orders?.paid ?? 0) },
    customers: { total: Number(customers?.total ?? 0) },
    products: { total: Number(products?.total ?? 0), active: Number(products?.active ?? 0) },
    posts: { total: Number(posts?.total ?? 0), published: Number(posts?.published ?? 0) },
  });
}));

app.get('/api/admin/products', asyncRoute(async (request, response) => {
  if (!requireDatabase(response)) return;
  const user = await requireAdmin(request, response);
  if (!user) return;
  response.json({ products: await readCatalogProducts(true) });
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
  const allowed: Record<string, string> = { name: 'name', slug: 'slug', basePriceUsd: 'base_price_usd', salePriceUsd: 'sale_price_usd', image: 'image_url', imageCard: 'image_card_url', shortDescription: 'short_description', releaseYear: 'release_year', developer: 'developer', platform: 'platform', hot: 'is_hot', shopOrder: 'shop_order', isActive: 'is_active' };
  for (const [input, column] of Object.entries(allowed)) {
    if (input in body) fields.push([column, input === 'hot' || input === 'isActive' ? (body[input] ? 1 : 0) : body[input] === '' ? null : body[input]]);
  }
  if ('tags' in body) fields.push(['tags_json', JSON.stringify(Array.isArray(body.tags) ? body.tags : [])]);
  if ('description' in body) fields.push(['description_json', JSON.stringify(Array.isArray(body.description) ? body.description : [])]);
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
