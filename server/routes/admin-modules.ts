import { randomUUID } from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { getPool } from '../db';
import { getAuthenticatedUser } from '../auth';
import { createAdminNotification, getSiteConfig, publicSiteUrl } from '../notifications';
import { createSignedUploadUrl, deleteObject, isStorageConfigured, objectExists, publicObjectUrl, signedDownloadUrl } from '../storage';
import type { RouteDeps } from './deps';

function wrap(handler: (request: Request, response: Response) => Promise<void>) {
  return (request: Request, response: Response, next: (error?: unknown) => void) => handler(request, response).catch(next);
}
function text(value: unknown, max = 2000): string { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function slugify(value: string): string { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120); }

export function registerAdminModuleRoutes(app: Express, deps: RouteDeps): void {
  // Categorias
  app.get('/api/admin/categories', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT c.*, (SELECT COUNT(*) FROM catalog_product_categories pc WHERE pc.category_id = c.id) AS product_count FROM catalog_categories c ORDER BY c.sort_order ASC, c.name ASC`);
    response.json({ categories: rows });
  }));

  app.post('/api/admin/categories', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const name = text(request.body?.name, 160);
    const slug = slugify(text(request.body?.slug, 120) || name);
    if (!name || !slug) { response.status(400).json({ error: 'invalid_category', message: 'Nome e slug são obrigatórios.' }); return; }
    try {
      await getPool().execute(`INSERT INTO catalog_categories (slug, name, description, image_url, is_active, show_on_home, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`, [slug, name, text(request.body?.description, 2000) || null, text(request.body?.image, 500) || null, request.body?.isActive === false ? 0 : 1, request.body?.showOnHome === false ? 0 : 1, Number(request.body?.sortOrder ?? 0)]);
    } catch { response.status(409).json({ error: 'duplicate_category', message: 'Já existe uma categoria com este slug.' }); return; }
    await deps.recordAudit(admin.id, 'category.create', 'catalog_category', slug, { name });
    response.status(201).json({ ok: true, slug });
  }));

  app.put('/api/admin/categories/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const body = request.body ?? {};
    const fields: Array<[string, unknown]> = [];
    for (const [input, column] of [['name', 'name'], ['slug', 'slug'], ['description', 'description'], ['image', 'image_url'], ['sortOrder', 'sort_order'], ['isActive', 'is_active'], ['showOnHome', 'show_on_home']] as const) {
      if (input in body) fields.push([column, input === 'isActive' || input === 'showOnHome' ? (body[input] ? 1 : 0) : body[input] === '' ? null : body[input]]);
    }
    if (!fields.length) { response.status(400).json({ error: 'empty_update', message: 'Nenhum campo alterado.' }); return; }
    await getPool().execute(`UPDATE catalog_categories SET ${fields.map(([column]) => `"${column}" = ?`).join(', ')}, updated_at = NOW() WHERE id = ?`, [...fields.map(([, value]) => value), Number(request.params.id)]);
    await deps.recordAudit(admin.id, 'category.update', 'catalog_category', String(request.params.id));
    response.json({ ok: true });
  }));

  app.delete('/api/admin/categories/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    await getPool().execute(`UPDATE catalog_categories SET is_active = 0, updated_at = NOW() WHERE id = ?`, [Number(request.params.id)]);
    await deps.recordAudit(admin.id, 'category.deactivate', 'catalog_category', String(request.params.id));
    response.status(204).end();
  }));

  // Detalhe completo de encomenda
  app.get('/api/admin/orders/:orderNumber', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [[order]] = await getPool().query<any[]>(`SELECT * FROM shop_orders WHERE order_number = ? LIMIT 1`, [String(request.params.orderNumber)]);
    if (!order) { response.status(404).json({ error: 'order_not_found', message: 'Encomenda não encontrada.' }); return; }
    const [items] = await getPool().query<any[]>(`SELECT * FROM shop_order_items WHERE order_id = ? ORDER BY id ASC`, [order.id]);
    const [history] = await getPool().query<any[]>(`SELECT h.*, u.name AS changed_by FROM shop_order_status_history h LEFT JOIN app_users u ON u.id = h.changed_by_user_id WHERE h.order_id = ? ORDER BY h.created_at ASC`, [order.id]);
    const [proofs] = await getPool().query<any[]>(`SELECT id, original_name, mime_type, size_bytes, status, admin_note, submitted_at, reviewed_at FROM payment_proofs WHERE order_id = ? ORDER BY submitted_at DESC`, [order.id]);
    const [notifications] = await getPool().query<any[]>(`SELECT id, event_key, channel, recipient, status, subject, error_message, sent_at, created_at FROM notification_deliveries WHERE order_id = ? ORDER BY created_at DESC LIMIT 100`, [order.id]);
    response.json({ order, items, history, proofs, notifications });
  }));

  app.patch('/api/admin/orders/:orderNumber/notes', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    await getPool().execute(`UPDATE shop_orders SET internal_notes = ?, updated_at = NOW() WHERE order_number = ?`, [text(request.body?.notes, 5000) || null, String(request.params.orderNumber)]);
    await deps.recordAudit(admin.id, 'order.notes_update', 'shop_order', String(request.params.orderNumber));
    response.json({ ok: true });
  }));

  // Artigos submetidos por clientes
  app.get('/api/account/posts', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await getAuthenticatedUser(request);
    if (!user) { response.status(401).json({ error: 'unauthorized', message: 'Inicie sessão para ver os seus artigos.' }); return; }
    const [rows] = await getPool().query<any[]>(`SELECT slug, title, category, excerpt, status, published_date, created_at FROM content_posts WHERE author = ? ORDER BY created_at DESC LIMIT 50`, [user.name]);
    response.json({ posts: rows });
  }));

  app.post('/api/account/posts', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const user = await getAuthenticatedUser(request);
    if (!user) { response.status(401).json({ error: 'unauthorized', message: 'Inicie sessão para submeter um artigo.' }); return; }
    const title = text(request.body?.title, 255);
    const excerpt = text(request.body?.excerpt, 1000);
    const content = text(request.body?.content, 20000);
    if (title.length < 5 || content.length < 50) { response.status(400).json({ error: 'invalid_post', message: 'O título e o conteúdo (mínimo 50 caracteres) são obrigatórios.' }); return; }
    const slug = `${slugify(title)}-${Date.now().toString(36)}`;
    const blocks = content.split(/\n{2,}/).map((paragraph) => ({ type: 'p', text: paragraph.trim() })).filter((block) => block.text);
    await getPool().execute(`INSERT INTO content_posts (slug, title, published_date, category, author, image_url, image_card_url, image_thumb_url, excerpt, tags_json, blocks_json, status) VALUES (?, ?, CURRENT_DATE, ?, ?, ?, ?, ?, ?, '[]'::jsonb, ?, 'pending')`, [slug, title, text(request.body?.category, 120) || 'Comunidade', user.name, '/assets/blog/post-1.jpg', '/assets/blog/post-1-card.jpg', '/assets/blog/post-1-thumb.jpg', excerpt || content.slice(0, 200), JSON.stringify(blocks)]);
    await createAdminNotification({ title: 'Novo artigo submetido', message: `${user.name} submeteu o artigo "${title}" para aprovação.`, level: 'info', link: '/admin', eventKey: 'admin.new_post', entityType: 'content_post', entityId: slug });
    response.status(201).json({ ok: true, slug, message: 'Artigo submetido. Será publicado depois de aprovado.' });
  }));

  // Gerador de emails (usa OpenAI quando configurado; caso contrário, modelo GameAO)
  app.post('/api/admin/email/generate', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const topic = text(request.body?.topic, 400);
    const tone = text(request.body?.tone, 60) || 'profissional e entusiasta';
    const audience = text(request.body?.audience, 160) || 'clientes GameAO';
    const callToAction = text(request.body?.callToAction, 200) || 'Visitar a loja';
    if (!topic) { response.status(400).json({ error: 'invalid_topic', message: 'Indique o tema do email.' }); return; }
    const site = await getSiteConfig();
    const fallback = {
      subject: `${topic} · ${site.name}`,
      bodyHtml: `<p>Olá {{customer_name}},</p><p>${topic}</p><p>Na ${site.name} encontra jogos, recargas e novidades com entrega em Angola. ${callToAction} em <a href="${publicSiteUrl()}/shop">${site.name}</a>.</p><p>Equipa ${site.name}</p>`,
      bodyText: `Olá {{customer_name}},\n\n${topic}\n\n${callToAction} em ${publicSiteUrl()}/shop\n\nEquipa ${site.name}`,
      source: 'modelo',
    };
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_API_BASE || process.env.OPENAI_BASE_URL;
    if (!apiKey) { response.json(fallback); return; }
    try {
      const completion = await fetch(`${String(baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OPENAI_EMAIL_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'És redator de email marketing da GameAO, loja de videojogos em Angola. Escreve em português de Angola. Devolve apenas JSON válido com as chaves subject, bodyHtml, bodyText. Usa HTML simples (<p>, <ul>, <strong>, <a>) e a variável {{customer_name}} na saudação. Não inventes descontos nem preços.' },
            { role: 'user', content: `Tema: ${topic}\nTom: ${tone}\nPúblico: ${audience}\nChamada à ação: ${callToAction}\nLoja: ${site.name} (${publicSiteUrl()})` },
          ],
          temperature: 0.7,
        }),
      });
      if (!completion.ok) { response.json(fallback); return; }
      const data = await completion.json() as { choices?: Array<{ message?: { content?: string } }> };
      const raw = data.choices?.[0]?.message?.content ?? '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) { response.json(fallback); return; }
      const parsed = JSON.parse(match[0]) as { subject?: string; bodyHtml?: string; bodyText?: string };
      if (!parsed.subject || !parsed.bodyHtml) { response.json(fallback); return; }
      response.json({ subject: parsed.subject, bodyHtml: parsed.bodyHtml, bodyText: parsed.bodyText ?? parsed.bodyHtml.replace(/<[^>]+>/g, ' '), source: 'ia' });
    } catch {
      response.json(fallback);
    }
  }));

  // ---------------------------------------------------------------------------
  // Clientes, cupões, transações, auditoria, sessões, webhooks, exportações
  // ---------------------------------------------------------------------------
  app.get('/api/admin/customers', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const query = text(request.query.q, 160);
    const [rows] = await getPool().query<any[]>(`SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at, u.last_login_at, (SELECT COUNT(*) FROM shop_orders o WHERE o.user_id = u.id) AS order_count, (SELECT COALESCE(SUM(o.total_aoa), 0) FROM shop_orders o WHERE o.user_id = u.id AND o.status <> 'cancelled') AS total_spent, (SELECT MAX(o.created_at) FROM shop_orders o WHERE o.user_id = u.id) AS last_order_at FROM app_users u WHERE u.role = 'customer' ${query ? 'AND (u.name ILIKE ? OR u.email ILIKE ? OR u.phone ILIKE ?)' : ''} ORDER BY u.created_at DESC LIMIT 300`, query ? [`%${query}%`, `%${query}%`, `%${query}%`] : []);
    response.json({ customers: rows });
  }));

  app.get('/api/admin/coupons', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT * FROM coupons ORDER BY created_at DESC LIMIT 200`);
    response.json({ coupons: rows });
  }));

  app.post('/api/admin/coupons', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const code = text(request.body?.code, 60).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    const value = Number(request.body?.value);
    if (!code || !Number.isFinite(value) || value <= 0) { response.status(400).json({ error: 'invalid_coupon', message: 'Código e valor do cupão são obrigatórios.' }); return; }
    try {
      await getPool().execute(`INSERT INTO coupons (code, description, discount_type, discount_value, min_order_aoa, max_discount_aoa, usage_limit, per_user_limit, starts_at, ends_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [code, text(request.body?.description, 255), request.body?.type === 'fixed' ? 'fixed' : 'percent', value, Math.max(0, Number(request.body?.minOrderAoa ?? 0)), request.body?.maxDiscountAoa ? Number(request.body.maxDiscountAoa) : null, request.body?.usageLimit ? Number(request.body.usageLimit) : null, Math.max(1, Number(request.body?.perUserLimit ?? 1)), request.body?.startsAt || null, request.body?.endsAt || null, request.body?.isActive === false ? 0 : 1]);
    } catch { response.status(409).json({ error: 'duplicate_coupon', message: 'Já existe um cupão com este código.' }); return; }
    await deps.recordAudit(admin.id, 'coupon.create', 'coupon', code, { value });
    response.status(201).json({ ok: true });
  }));

  app.put('/api/admin/coupons/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const body = request.body ?? {};
    const fields: Array<[string, unknown]> = [];
    const map: Record<string, string> = { description: 'description', type: 'discount_type', value: 'discount_value', minOrderAoa: 'min_order_aoa', maxDiscountAoa: 'max_discount_aoa', usageLimit: 'usage_limit', perUserLimit: 'per_user_limit', startsAt: 'starts_at', endsAt: 'ends_at', isActive: 'is_active' };
    for (const [input, column] of Object.entries(map)) if (input in body) fields.push([column, input === 'isActive' ? (body[input] ? 1 : 0) : body[input] === '' ? null : body[input]]);
    if (!fields.length) { response.status(400).json({ error: 'empty_update', message: 'Nenhum campo alterado.' }); return; }
    await getPool().execute(`UPDATE coupons SET ${fields.map(([column]) => `"${column}" = ?`).join(', ')}, updated_at = NOW() WHERE id = ?`, [...fields.map(([, value]) => value), Number(request.params.id)]);
    await deps.recordAudit(admin.id, 'coupon.update', 'coupon', String(request.params.id));
    response.json({ ok: true });
  }));

  app.delete('/api/admin/coupons/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    await getPool().execute(`DELETE FROM coupons WHERE id = ?`, [Number(request.params.id)]);
    await deps.recordAudit(admin.id, 'coupon.delete', 'coupon', String(request.params.id));
    response.status(204).end();
  }));

  app.get('/api/admin/transactions', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT p.*, o.order_number, o.customer_name, o.payment_method FROM shop_payments p JOIN shop_orders o ON o.id = p.order_id ORDER BY p.created_at DESC LIMIT 300`);
    response.json({ transactions: rows });
  }));

  app.get('/api/admin/audit-logs', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const limit = Math.min(500, Math.max(1, Number(request.query.limit ?? 200)));
    const [rows] = await getPool().query<any[]>(`SELECT l.*, u.name AS user_name, u.email AS user_email FROM admin_audit_logs l LEFT JOIN app_users u ON u.id = l.user_id ORDER BY l.created_at DESC LIMIT ${limit}`);
    response.json({ logs: rows });
  }));

  app.get('/api/admin/sessions', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT s.token_hash, s.expires_at, s.created_at, u.name AS user_name, u.email AS user_email, u.role FROM app_sessions s JOIN app_users u ON u.id = s.user_id WHERE s.expires_at > NOW() ORDER BY s.created_at DESC LIMIT 200`);
    response.json({ sessions: rows });
  }));

  app.delete('/api/admin/sessions/:hash', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    await getPool().execute(`DELETE FROM app_sessions WHERE token_hash = ?`, [String(request.params.hash)]);
    await deps.recordAudit(admin.id, 'session.revoke', 'app_session', String(request.params.hash).slice(0, 12));
    response.status(204).end();
  }));

  app.get('/api/admin/webhooks', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 200`);
    response.json({ events: rows });
  }));

  app.get('/api/admin/deliveries', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [rows] = await getPool().query<any[]>(`SELECT o.order_number, o.customer_name, o.customer_phone, o.delivery_address, o.billing_city, o.billing_province, o.delivery_date, o.status, o.total_aoa, o.created_at FROM shop_orders o WHERE EXISTS (SELECT 1 FROM shop_order_items i WHERE i.order_id = o.id AND i.category_type = 'physical') ORDER BY o.created_at DESC LIMIT 200`);
    response.json({ deliveries: rows });
  }));

  app.get('/api/admin/reports/finance', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const days = Math.min(365, Math.max(7, Number(request.query.days ?? 30)));
    const [[totals]] = await getPool().query<any[]>(`SELECT COALESCE(SUM(total_aoa), 0) AS revenue, COALESCE(SUM(discount_aoa), 0) AS discounts, COALESCE(SUM(shipping_aoa), 0) AS shipping, COUNT(*) AS orders FROM shop_orders WHERE status <> 'cancelled' AND created_at > NOW() - (? || ' days')::interval`, [String(days)]);
    const [byMethod] = await getPool().query<any[]>(`SELECT COALESCE(payment_method, 'sem_metodo') AS method, COUNT(*) AS orders, COALESCE(SUM(total_aoa), 0) AS revenue FROM shop_orders WHERE status <> 'cancelled' AND created_at > NOW() - (? || ' days')::interval GROUP BY payment_method ORDER BY revenue DESC`, [String(days)]);
    const [refunds] = await getPool().query<any[]>(`SELECT order_number, customer_name, total_aoa, updated_at FROM shop_orders WHERE status = 'refunded' ORDER BY updated_at DESC LIMIT 50`);
    response.json({ totals, byMethod, refunds });
  }));

  app.get('/api/admin/export', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const type = String(request.query.type ?? 'orders');
    let headers: string[] = [];
    let rows: any[] = [];
    if (type === 'customers') {
      headers = ['ID', 'Nome', 'Email', 'Telefone', 'Criado', 'Ultimo acesso'];
      [rows] = await getPool().query<any[]>(`SELECT id, name, email, phone, created_at, last_login_at FROM app_users WHERE role = 'customer' ORDER BY created_at DESC`);
    } else if (type === 'products') {
      headers = ['ID', 'Nome', 'Slug', 'Preco USD', 'Promocao USD', 'Stock', 'Ativo'];
      [rows] = await getPool().query<any[]>(`SELECT id, name, slug, base_price_usd, sale_price_usd, stock_quantity, is_active FROM catalog_products ORDER BY name ASC`);
    } else {
      headers = ['Numero', 'Cliente', 'Email', 'Telefone', 'Total AOA', 'Estado', 'Pagamento', 'Metodo', 'Criado'];
      [rows] = await getPool().query<any[]>(`SELECT order_number, customer_name, customer_email, customer_phone, total_aoa, status, payment_status, payment_method, created_at FROM shop_orders ORDER BY created_at DESC`);
    }
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...rows.map((row) => Object.values(row).map(escape).join(','))].join('\n');
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="gameao-${type}-${new Date().toISOString().slice(0, 10)}.csv"`);
    response.send(`\ufeff${csv}`);
  }));

  app.get('/api/admin/media', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const query = text(request.query.q, 160);
    const purpose = text(request.query.purpose, 60);
    const filters: string[] = [];
    const params: unknown[] = [];
    if (query) { filters.push('(original_name ILIKE ? OR object_key ILIKE ?)'); params.push(`%${query}%`, `%${query}%`); }
    if (purpose && purpose !== 'all') { filters.push('purpose = ?'); params.push(purpose); }
    const [rows] = await getPool().query<any[]>(`SELECT m.*, u.name AS uploaded_by FROM media_library m LEFT JOIN app_users u ON u.id = m.uploaded_by_user_id ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''} ORDER BY m.created_at DESC LIMIT 300`, params);
    response.json({ media: rows, storageConfigured: isStorageConfigured() });
  }));

  app.post('/api/admin/media/presign', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    if (!isStorageConfigured()) { response.status(503).json({ error: 'storage_not_configured', message: 'O armazenamento R2 ainda não está configurado.' }); return; }
    const filename = text(request.body?.filename, 255);
    const contentType = text(request.body?.contentType, 100);
    const size = Number(request.body?.size ?? 0);
    const purpose = text(request.body?.purpose, 60) || 'product';
    const visibility = request.body?.visibility === 'private' ? 'private' : 'public';
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowed.includes(contentType)) { response.status(400).json({ error: 'invalid_type', message: 'Formato não autorizado. Use JPG, PNG, WEBP, GIF ou PDF.' }); return; }
    const maxSize = contentType === 'application/pdf' ? 10 * 1024 * 1024 : 8 * 1024 * 1024;
    if (!Number.isFinite(size) || size <= 0 || size > maxSize) { response.status(400).json({ error: 'invalid_size', message: `O ficheiro deve ter no máximo ${Math.round(maxSize / 1024 / 1024)} MB.` }); return; }
    const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf' } as Record<string, string>)[contentType];
    const key = `gameao/${purpose}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${extension}`;
    const uploadUrl = await createSignedUploadUrl(key, contentType, 600, visibility === 'private');
    await deps.recordAudit(admin.id, 'media.presign', 'media', key, { purpose, contentType, size });
    response.status(201).json({ key, uploadUrl, publicUrl: visibility === 'public' ? publicObjectUrl(key) : null, expiresIn: 600, visibility });
  }));

  app.post('/api/admin/media/confirm', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const key = text(request.body?.key, 500);
    const originalName = text(request.body?.originalName, 255) || key.split('/').pop() || 'ficheiro';
    const contentType = text(request.body?.contentType, 100) || 'application/octet-stream';
    const visibility = request.body?.visibility === 'private' ? 'private' : 'public';
    if (!key || !isStorageConfigured()) { response.status(400).json({ error: 'invalid_key', message: 'Referência de ficheiro inválida.' }); return; }
    const exists = await objectExists(key);
    if (!exists) { response.status(404).json({ error: 'file_not_found', message: 'O ficheiro não foi encontrado no armazenamento.' }); return; }
    await getPool().execute(`INSERT INTO media_library (original_name, stored_name, bucket, object_key, public_url, mime_type, size_bytes, width, height, category, purpose, visibility, uploaded_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (object_key) DO NOTHING`, [originalName, key.split('/').pop(), process.env.R2_BUCKET ?? 'gameao', key, visibility === 'public' ? publicObjectUrl(key) : null, contentType, Number(request.body?.size ?? 0), request.body?.width ? Number(request.body.width) : null, request.body?.height ? Number(request.body.height) : null, contentType.startsWith('image/') ? 'image' : 'document', text(request.body?.purpose, 60) || 'product', visibility, admin.id]);
    const [[row]] = await getPool().query<any[]>(`SELECT * FROM media_library WHERE object_key = ? LIMIT 1`, [key]);
    await deps.recordAudit(admin.id, 'media.confirm', 'media', key);
    response.status(201).json({ media: row });
  }));

  app.delete('/api/admin/media/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response); if (!admin) return;
    const [[row]] = await getPool().query<any[]>(`SELECT * FROM media_library WHERE id = ? LIMIT 1`, [Number(request.params.id)]);
    if (!row) { response.status(404).json({ error: 'media_not_found', message: 'Ficheiro não encontrado.' }); return; }
    await deleteObject(row.object_key, row.visibility === 'private');
    await getPool().execute(`DELETE FROM media_library WHERE id = ?`, [row.id]);
    await deps.recordAudit(admin.id, 'media.delete', 'media', row.object_key);
    response.status(204).end();
  }));

  app.get('/api/admin/media/:id/download', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response)) return;
    const [[row]] = await getPool().query<any[]>(`SELECT * FROM media_library WHERE id = ? LIMIT 1`, [Number(request.params.id)]);
    if (!row) { response.status(404).json({ error: 'media_not_found', message: 'Ficheiro não encontrado.' }); return; }
    response.json({ url: row.public_url || await signedDownloadUrl(row.object_key, 600) });
  }));
}
