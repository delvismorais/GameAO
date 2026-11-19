import { createHash } from 'node:crypto';
import type { Express, Request, Response } from 'express';
import { getPool } from '../db';
import { getAuthenticatedUser } from '../auth';
import { rateLimit } from '../security';
import type { RouteDeps } from './deps';

function wrap(handler: (request: Request, response: Response) => Promise<void>) {
  return (request: Request, response: Response, next: (error?: unknown) => void) => handler(request, response).catch(next);
}
function text(value: unknown, max = 2000): string { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

async function refreshProductRating(productId: string): Promise<void> {
  const [[stats]] = await getPool().query<any[]>(`SELECT COALESCE(AVG(rating), 0) AS average, COUNT(*) AS total FROM product_reviews WHERE product_id = ? AND status = 'approved'`, [productId]);
  await getPool().execute(`UPDATE catalog_products SET rating = ?, review_count = ? WHERE id = ?`, [Math.round(Number(stats?.average ?? 0) * 10) / 10, Number(stats?.total ?? 0), productId]);
}

export function registerReviewRoutes(app: Express, deps: RouteDeps): void {
  app.get('/api/products/:id/reviews', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const productId = String(request.params.id);
    const [rows] = await getPool().query<any[]>(`SELECT id, author_name, rating, content, created_at, (order_id IS NOT NULL) AS verified FROM product_reviews WHERE product_id = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 60`, [productId]);
    const [[summary]] = await getPool().query<any[]>(`SELECT COALESCE(AVG(rating), 0) AS average, COUNT(*) AS total FROM product_reviews WHERE product_id = ? AND status = 'approved'`, [productId]);
    response.json({
      reviews: rows.map((row) => ({ id: Number(row.id), author: row.author_name, rating: Number(row.rating), text: row.content, date: row.created_at, verified: Boolean(row.verified) })),
      summary: { average: Math.round(Number(summary?.average ?? 0) * 10) / 10, total: Number(summary?.total ?? 0) },
    });
  }));

  app.post('/api/products/:id/reviews', rateLimit({ windowMs: 60 * 60 * 1000, max: 8, message: 'Demasiadas avaliações enviadas. Aguarde uma hora antes de tentar novamente.' }), wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const productId = String(request.params.id);
    const user = await getAuthenticatedUser(request);
    const rating = Math.round(Number(request.body?.rating));
    const content = text(request.body?.content, 2000);
    const author = text(request.body?.author, 120) || user?.name || '';
    const email = text(request.body?.email, 255).toLowerCase() || user?.email || '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) { response.status(400).json({ error: 'invalid_rating', message: 'Escolha uma classificação entre 1 e 5 estrelas.' }); return; }
    if (content.length < 10) { response.status(400).json({ error: 'invalid_content', message: 'Escreva pelo menos 10 caracteres sobre o produto.' }); return; }
    if (!author) { response.status(400).json({ error: 'invalid_author', message: 'Indique o seu nome.' }); return; }
    const [[product]] = await getPool().query<any[]>(`SELECT id FROM catalog_products WHERE id = ? LIMIT 1`, [productId]);
    if (!product) { response.status(404).json({ error: 'product_not_found', message: 'Produto não encontrado.' }); return; }
    let orderId: number | null = null;
    if (user) {
      const [[order]] = await getPool().query<any[]>(`SELECT o.id FROM shop_orders o JOIN shop_order_items i ON i.order_id = o.id WHERE o.user_id = ? AND i.product_id = ? AND o.status IN ('completed','processing','ready_for_delivery','payment_confirmed') ORDER BY o.created_at DESC LIMIT 1`, [user.id, productId]);
      if (order) orderId = Number(order.id);
    }
    const ipHash = createHash('sha256').update(String(request.ip ?? '')).digest('hex');
    await getPool().execute(`INSERT INTO product_reviews (product_id, user_id, order_id, author_name, author_email, rating, content, status, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`, [productId, user?.id ?? null, orderId, author, email || null, rating, content, ipHash]);
    response.status(201).json({ ok: true, message: 'Avaliação recebida. Será publicada depois de aprovada pela equipa GameAO.' });
  }));

  app.get('/api/admin/reviews', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    if (!await deps.requireAdmin(request, response, 'content')) return;
    const status = ['pending', 'approved', 'rejected'].includes(String(request.query.status)) ? String(request.query.status) : 'pending';
    const [rows] = await getPool().query<any[]>(`SELECT r.*, p.name AS product_name FROM product_reviews r LEFT JOIN catalog_products p ON p.id = r.product_id WHERE r.status = ? ORDER BY r.created_at DESC LIMIT 200`, [status]);
    response.json({ reviews: rows });
  }));

  app.patch('/api/admin/reviews/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response, 'content');
    if (!admin) return;
    const status = ['approved', 'rejected'].includes(String(request.body?.status)) ? String(request.body.status) : '';
    if (!status) { response.status(400).json({ error: 'invalid_status', message: 'Estado de moderação inválido.' }); return; }
    const [[review]] = await getPool().query<any[]>(`SELECT id, product_id FROM product_reviews WHERE id = ? LIMIT 1`, [Number(request.params.id)]);
    if (!review) { response.status(404).json({ error: 'review_not_found', message: 'Avaliação não encontrada.' }); return; }
    await getPool().execute(`UPDATE product_reviews SET status = ?, reviewed_at = NOW() WHERE id = ?`, [status, review.id]);
    await refreshProductRating(String(review.product_id));
    await deps.recordAudit(admin.id, `review.${status}`, 'product_review', String(review.id));
    response.json({ ok: true });
  }));

  app.delete('/api/admin/reviews/:id', wrap(async (request, response) => {
    if (!deps.requireDatabase(response)) return;
    const admin = await deps.requireAdmin(request, response, 'content');
    if (!admin) return;
    const [[review]] = await getPool().query<any[]>(`SELECT id, product_id FROM product_reviews WHERE id = ? LIMIT 1`, [Number(request.params.id)]);
    if (!review) { response.status(404).json({ error: 'review_not_found', message: 'Avaliação não encontrada.' }); return; }
    await getPool().execute(`DELETE FROM product_reviews WHERE id = ?`, [review.id]);
    await refreshProductRating(String(review.product_id));
    await deps.recordAudit(admin.id, 'review.delete', 'product_review', String(review.id));
    response.status(204).end();
  }));
}
