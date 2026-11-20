import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { ProofUpload } from '../components/shop/ProofUpload';
import { formatDatePt, formatUsdAsAoa } from '../lib/pricing';

type PaymentMethod = { id: number; code: string; name: string; description: string; instructions: string; requires_proof: number; customer_message: string; payment_deadline_hours?: number; receiving_data?: Record<string, unknown> };
type ServerOrder = { order: { order_number: string; created_at: string; customer_name: string; customer_email: string; customer_phone: string; billing_address?: string; billing_city?: string; billing_province?: string; total_aoa: number; exchange_rate_usd_aoa: number; status: string; payment_status: string }; paymentMethod?: PaymentMethod | null; proofs?: Array<{ id: number; original_name: string; status: string; submitted_at: string }>; items: Array<{ product_name: string; image_card_url?: string; quantity: number; subtotal_aoa: number; player_id?: string; player_nickname?: string }> };

function ReceivingData({ data }: { data?: Record<string, unknown> }) {
  if (!data || Object.keys(data).length === 0) return null;
  return <div className="payment-receiving-data">{Object.entries(data).map(([key, value]) => <div key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</strong></div>)}</div>;
}

export function OrderConfirmation() {
  const [params] = useSearchParams();
  const orderNumber = params.get('order') ?? '';
  const email = params.get('email') ?? '';
  const token = params.get('token') ?? '';
  const [serverOrder, setServerOrder] = useState<ServerOrder | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(Boolean(orderNumber));
  const [error, setError] = useState('');

  const loadOrder = useCallback(async () => {
    if (!orderNumber) return;
    const query = new URLSearchParams();
    if (email) query.set('email', email);
    if (token) query.set('token', token);
    const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}?${query.toString()}`);
    if (response.ok) { setServerOrder(await response.json() as ServerOrder); setError(''); }
    else if (response.status === 403) setError('Para ver os detalhes deste pedido, confirme o email usado na compra na página de acompanhamento.');
    else setError('Não foi possível carregar este pedido.');
  }, [email, orderNumber, token]);

  useEffect(() => {
    void Promise.all([
      loadOrder().catch(() => setError('Não foi possível carregar este pedido.')),
      fetch('/api/payment-methods').then((response) => (response.ok ? response.json() : { methods: [] })).then((data: { methods?: PaymentMethod[] }) => setPaymentMethods(data.methods ?? [])).catch(() => setPaymentMethods([])),
    ]).finally(() => setLoading(false));
  }, [loadOrder]);

  const access = `?${new URLSearchParams({ ...(email ? { email } : {}), ...(token ? { token } : {}) }).toString()}`;
  const server = serverOrder?.order;
  const number = server?.order_number ?? orderNumber;

  if (loading) return <PageShell crumbs={[{ label: 'Confirmação' }]}><p className="admin-state">A carregar o pedido…</p></PageShell>;
  if (!serverOrder) return <PageShell crumbs={[{ label: 'Confirmação' }]}><EmptyState title="Pedido não encontrado" icon="🧾" action={<Link to="/acompanhar-pedido" className="btn btn--primary">Acompanhar pedido</Link>}>{error || 'Confirme o número do pedido informado.'}</EmptyState></PageShell>;

  const createdAt = server!.created_at;
  const rate = Number(server!.exchange_rate_usd_aoa || 913);
  const total = Number(server!.total_aoa);
  const items = serverOrder.items;
  const paid = server!.payment_status === 'paid';

  return <PageShell crumbs={[{ label: 'Confirmação do pedido' }]}>
    <div className="order-confirmation">
      <div className="order-confirmation__icon"><Icon name="check" /></div>
      <h1>{paid ? 'Pagamento recebido' : 'Encomenda registada'}</h1>
      <p className="order-confirmation__lead">A sua encomenda foi registada com o número único <strong>{number}</strong>. Guarde-o para acompanhamento e descarga da fatura.</p>
      <div className="order-confirmation__summary"><div><span>Número da encomenda</span><strong>{number}</strong></div><div><span>Data</span><strong>{formatDatePt(createdAt)}</strong></div><div><span>Estado</span><strong>{server!.status}</strong></div><div><span>Total</span><strong>{formatUsdAsAoa(total)}</strong></div><div><span>Pagamento</span><strong>{paid ? 'Pago' : 'Pendente'}</strong></div></div>
      {items.length > 0 && <><h2 className="order-confirmation__heading">Artigos</h2><ul className="order-confirmation__items">{items.map((item) => <li key={`${item.product_name}-${item.player_id ?? ''}`}><img src={item.image_card_url ?? '/assets/gameao-logo.png'} alt="" /><span>{item.product_name} × {item.quantity}{item.player_id && <small className="tracking-item-player">ID: {item.player_id}{item.player_nickname ? ` · Nickname: ${item.player_nickname}` : ''}</small>}</span><strong>{formatUsdAsAoa(Number(item.subtotal_aoa))}</strong></li>)}</ul></>}

      {!paid && <section className="payment-box order-confirmation__payment"><h2 className="order-confirmation__heading">Pagamento e comprovativo</h2><p>Se já efetuou o pagamento, consulte os dados de recebimento e envie o comprovativo. O documento ficará em verificação e não confirma o pagamento automaticamente.</p>{paymentMethods.length > 0 ? <div className="payment-instructions"><h3>Dados de recebimento</h3>{paymentMethods.map((method) => <div key={method.code} className="payment-method-block"><strong>{method.name}</strong>{method.customer_message && <p>{method.customer_message}</p>}{method.instructions && <p>{method.instructions}</p>}<ReceivingData data={method.receiving_data} /></div>)}</div> : <p className="admin-message">Ainda não existem métodos de pagamento ativos. Contacte a equipa GameAO para concluir o pagamento.</p>}
        <ProofUpload orderNumber={number} email={email} token={token} onUploaded={loadOrder} />
        {serverOrder.proofs?.length ? <p className="admin-message">Comprovativo mais recente: {serverOrder.proofs[0].original_name} · {serverOrder.proofs[0].status}</p> : null}
      </section>}
      {paid && <section className="payment-box order-confirmation__payment"><h2 className="order-confirmation__heading">Pagamento confirmado</h2><p>O comprovativo foi recebido e o pedido está marcado como pago. A equipa GameAO dará seguimento ao processamento.</p>{serverOrder.proofs?.length ? <p className="admin-message">Comprovativo: {serverOrder.proofs[0].original_name} · {serverOrder.proofs[0].status}</p> : null}</section>}
      <div className="order-confirmation__actions"><Link to={`/pedido?order=${encodeURIComponent(number)}${email ? `&email=${encodeURIComponent(email)}` : ''}${token ? `&token=${encodeURIComponent(token)}` : ''}`} className="btn btn--primary">Acompanhar pedido</Link><a href={`/api/orders/${encodeURIComponent(number)}/invoice${access}&template=classic`} className="btn btn--outline" download>Baixar fatura · Modelo clássico</a><a href={`/api/orders/${encodeURIComponent(number)}/invoice${access}&template=modern`} className="btn btn--outline" download>Baixar fatura · Modelo moderno</a><Link to="/my-account/orders" className="btn btn--outline">Ver compras</Link><Link to="/shop" className="btn btn--outline">Continuar a comprar</Link></div>
    </div>
  </PageShell>;
}
