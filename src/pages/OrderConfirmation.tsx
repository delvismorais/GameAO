import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../context/StoreContext';
import { formatDatePt, formatUsdAsAoa } from '../lib/pricing';

export function OrderConfirmation() {
  const [params] = useSearchParams();
  const { orders } = useStore();
  const orderId = params.get('order');
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    return (
      <PageShell crumbs={[{ label: 'Confirmação' }]}>
        <EmptyState
          title="Encomenda não encontrada"
          icon="🧾"
          action={<Link to="/shop" className="btn btn--primary">Voltar à loja</Link>}
        >
          Não encontrámos esta encomenda neste dispositivo. Consulte o histórico da sua conta.
        </EmptyState>
      </PageShell>
    );
  }

  return (
    <PageShell crumbs={[{ label: 'Confirmação da encomenda' }]}>
      <div className="order-confirmation">
        <div className="order-confirmation__icon"><Icon name="check" /></div>
        <h1>Obrigado pela sua encomenda</h1>
        <p className="order-confirmation__lead">
          A encomenda foi registada com sucesso. Receberá uma confirmação por email assim que a
          infraestrutura de envio estiver ativa. Nesta demonstração, os dados ficam apenas neste
          dispositivo.
        </p>

        <div className="order-confirmation__summary">
          <div><span>Número da encomenda</span><strong>{order.id}</strong></div>
          <div><span>Data</span><strong>{formatDatePt(order.createdAt)}</strong></div>
          <div><span>Estado</span><strong>{order.status}</strong></div>
          <div><span>Total</span><strong>{formatUsdAsAoa(order.totalAoa / order.exchangeRate, order.exchangeRate)}</strong></div>
          <div><span>Taxa aplicada</span><strong>1 USD = {formatUsdAsAoa(1, order.exchangeRate)}</strong></div>
          <div><span>Método</span><strong>{order.paymentMethod}</strong></div>
        </div>

        <h2 className="order-confirmation__heading">Artigos</h2>
        <ul className="order-confirmation__items">
          {order.items.map((item) => (
            <li key={item.productId}>
              <img src={item.image} alt="" />
              <span>{item.name} × {item.qty}</span>
              <strong>{formatUsdAsAoa(item.lineTotalAoa / order.exchangeRate, order.exchangeRate)}</strong>
            </li>
          ))}
        </ul>

        <div className="order-confirmation__address">
          <h2 className="order-confirmation__heading">Endereço de entrega</h2>
          <p>
            {order.customer.firstName} {order.customer.lastName}<br />
            {order.customer.address}{order.customer.apartment ? `, ${order.customer.apartment}` : ''}<br />
            {order.customer.city}, {order.customer.province}<br />
            {order.customer.country} · {order.customer.phone}<br />
            {order.customer.email}
          </p>
          {order.note && <p><strong>Notas:</strong> {order.note}</p>}
        </div>

        <div className="order-confirmation__actions">
          <Link to="/my-account/orders" className="btn btn--primary">Ver as minhas encomendas</Link>
          <Link to="/shop" className="btn btn--outline">Continuar a comprar</Link>
        </div>
      </div>
    </PageShell>
  );
}
