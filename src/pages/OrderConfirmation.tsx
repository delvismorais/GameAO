import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../context/StoreContext';
import { formatDatePt, formatUsdAsAoa } from '../lib/pricing';

type ServerOrder = { order: { order_number: string; created_at: string; customer_name: string; customer_email: string; customer_phone: string; billing_address?: string; billing_city?: string; billing_province?: string; total_aoa: number; exchange_rate_usd_aoa: number; status: string; payment_status: string }; items: Array<{ product_name: string; image_card_url?: string; quantity: number; subtotal_aoa: number }> };

export function OrderConfirmation() {
  const [params] = useSearchParams();
  const { orders } = useStore();
  const orderId = params.get('order') ?? '';
  const email = params.get('email') ?? '';
  const localOrder = orders.find((item) => item.id === orderId);
  const [serverOrder, setServerOrder] = useState<ServerOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId && !localOrder));

  useEffect(() => {
    if (!orderId || localOrder) return;
    void fetch(`/api/orders/${encodeURIComponent(orderId)}?email=${encodeURIComponent(email)}`)
      .then((response) => response.ok ? response.json() as Promise<ServerOrder> : null)
      .then((data) => setServerOrder(data))
      .catch(() => setServerOrder(null))
      .finally(() => setLoading(false));
  }, [email, localOrder, orderId]);

  if (loading) return <PageShell crumbs={[{ label: 'Confirmação' }]}><p className="admin-state">A carregar a encomenda…</p></PageShell>;
  if (!localOrder && !serverOrder) return <PageShell crumbs={[{ label: 'Confirmação' }]}><EmptyState title="Encomenda não encontrada" icon="🧾" action={<Link to="/shop" className="btn btn--primary">Voltar à loja</Link>}>Confirme o número e o email usados no checkout.</EmptyState></PageShell>;

  const server = serverOrder?.order;
  const number = server?.order_number ?? localOrder?.id ?? '';
  const createdAt = server?.created_at ?? localOrder?.createdAt ?? new Date().toISOString();
  const rate = Number(server?.exchange_rate_usd_aoa ?? localOrder?.exchangeRate ?? 913);
  const total = Number(server?.total_aoa ?? localOrder?.totalAoa ?? 0);
  const items = serverOrder?.items;

  return (
    <PageShell crumbs={[{ label: 'Confirmação da encomenda' }]}>
      <div className="order-confirmation">
        <div className="order-confirmation__icon"><Icon name="check" /></div>
        <h1>Encomenda registada</h1>
        <p className="order-confirmation__lead">A sua encomenda foi registada com o número único <strong>{number}</strong>. Guarde-o para acompanhamento e descarga da fatura.</p>
        <div className="order-confirmation__summary">
          <div><span>Número da encomenda</span><strong>{number}</strong></div>
          <div><span>Data</span><strong>{formatDatePt(createdAt)}</strong></div>
          <div><span>Estado</span><strong>{server?.status ?? localOrder?.status ?? 'Pendente'}</strong></div>
          <div><span>Total</span><strong>{formatUsdAsAoa(total / rate, rate)}</strong></div>
          <div><span>Taxa aplicada</span><strong>1 USD = {formatUsdAsAoa(1, rate)}</strong></div>
          <div><span>Pagamento</span><strong>{server?.payment_status ?? 'Pendente'}</strong></div>
        </div>
        {items && <><h2 className="order-confirmation__heading">Artigos</h2><ul className="order-confirmation__items">{items.map((item) => <li key={item.product_name}><img src={item.image_card_url ?? '/assets/logo.png'} alt="" /><span>{item.product_name} × {item.quantity}</span><strong>{formatUsdAsAoa(Number(item.subtotal_aoa) / rate, rate)}</strong></li>)}</ul></>}
        <div className="order-confirmation__actions">
          <a href={`/api/orders/${encodeURIComponent(number)}/invoice?email=${encodeURIComponent(email)}&template=classic`} className="btn btn--primary" download>Baixar fatura · Modelo clássico</a>
          <a href={`/api/orders/${encodeURIComponent(number)}/invoice?email=${encodeURIComponent(email)}&template=modern`} className="btn btn--outline" download>Baixar fatura · Modelo moderno</a>
          <Link to="/my-account/orders" className="btn btn--outline">Ver encomendas</Link>
          <Link to="/shop" className="btn btn--outline">Continuar a comprar</Link>
        </div>
      </div>
    </PageShell>
  );
}
