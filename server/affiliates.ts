import { getPool } from './db';
import { dispatch, notifyAffiliateCommission } from './notifications';

export async function findAffiliateByCode(code: string): Promise<{ id: number; user_id: number; code: string; commission_rate: number; status: string } | null> {
  const clean = String(code ?? '').trim().toUpperCase().slice(0, 32);
  if (!clean) return null;
  const [[row]] = await getPool().query<any[]>(`SELECT id, user_id, code, commission_rate, status FROM affiliates WHERE code = ? AND status = 'active' LIMIT 1`, [clean]);
  return row ? { id: Number(row.id), user_id: Number(row.user_id), code: row.code, commission_rate: Number(row.commission_rate), status: row.status } : null;
}

export async function attributeAffiliate(userId: number | null, code: string | null | undefined): Promise<{ id: number; code: string } | null> {
  const affiliate = await findAffiliateByCode(String(code ?? ''));
  if (!affiliate) return null;
  if (userId && Number(userId) !== affiliate.user_id) {
    await getPool().execute(`UPDATE app_users SET referred_by_affiliate_id = ? WHERE id = ? AND referred_by_affiliate_id IS NULL`, [affiliate.id, userId]);
  }
  return { id: affiliate.id, code: affiliate.code };
}

export async function settleAffiliateCommission(orderId: number): Promise<void> {
  const [[order]] = await getPool().query<any[]>(`SELECT id, order_number, total_aoa, status, payment_status, affiliate_id, user_id FROM shop_orders WHERE id = ? LIMIT 1`, [orderId]);
  if (!order || !order.affiliate_id) return;
  if (!['payment_confirmed', 'processing', 'ready_for_delivery', 'completed'].includes(String(order.status)) && order.payment_status !== 'paid') return;
  const [[existing]] = await getPool().query<any[]>(`SELECT id FROM affiliate_referrals WHERE order_id = ? LIMIT 1`, [orderId]);
  if (existing) return;
  const [[affiliate]] = await getPool().query<any[]>(`SELECT a.*, u.name, u.email, u.phone FROM affiliates a JOIN app_users u ON u.id = a.user_id WHERE a.id = ? AND a.status = 'active' LIMIT 1`, [order.affiliate_id]);
  if (!affiliate) return;
  const commission = Math.round(Number(order.total_aoa) * Number(affiliate.commission_rate) / 100 * 100) / 100;
  if (commission <= 0) return;
  await getPool().execute(`INSERT INTO affiliate_referrals (affiliate_id, referred_user_id, order_id, status, order_total_aoa, commission_aoa) VALUES (?, ?, ?, 'confirmed', ?, ?) ON CONFLICT (order_id) DO NOTHING`, [affiliate.id, order.user_id, orderId, order.total_aoa, commission]);
  await getPool().execute(`UPDATE affiliates SET balance_aoa = balance_aoa + ?, total_earned_aoa = total_earned_aoa + ?, updated_at = NOW() WHERE id = ?`, [commission, commission, affiliate.id]);
  await notifyAffiliateCommission({ id: Number(affiliate.user_id), name: affiliate.name, email: affiliate.email, phone: affiliate.phone }, commission, order.order_number);
  await dispatch({ eventKey: 'admin.affiliate_request', variables: { customer_name: affiliate.name, customer_email: affiliate.email, affiliate_code: affiliate.code }, channels: ['in_app'], entityType: 'affiliate', entityId: String(affiliate.id), level: 'success' });
}
