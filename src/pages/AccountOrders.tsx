import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { useStore } from '../context/StoreContext';
import { formatDatePt, formatUsdAsAoa } from '../lib/pricing';

export function AccountOrders() {
  const { user, orders } = useStore();

  if (!user) {
    return (
      <PageShell crumbs={[{ label: 'Minha Conta', href: '/my-account' }, { label: 'Compras' }]}>
        <h1 className="page-title">Compras</h1>
        <EmptyState
          title="Inicie sessão para ver as compras"
          icon="🔒"
          action={<Link to="/my-account" className="btn btn--primary">Entrar na conta</Link>}
        >
          Inicie sessão para consultar o histórico associado à sua conta.
        </EmptyState>
      </PageShell>
    );
  }

  return (
    <PageShell crumbs={[{ label: 'Minha Conta', href: '/my-account' }, { label: 'Compras' }]}>
      <div className="orders-head">
        <h1 className="page-title">Compras</h1>
        <Link to="/my-account" className="btn btn--outline btn--sm">← Voltar à conta</Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="Ainda não há compras"
          icon="🧾"
          action={<Link to="/shop" className="btn btn--primary">Explorar a Loja</Link>}
        >
          Quando confirmar uma compra, ela aparecerá aqui com o respetivo estado.
        </EmptyState>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article key={order.id} className="order-card">
              <header className="order-card__head">
                <div>
                  <strong>Pedido {order.id}</strong>
                  <span>{formatDatePt(order.createdAt)}</span>
                </div>
                <span className={`order-status order-status--${order.status === 'Pendente' ? 'pending' : 'done'}`}>
                  {order.status}
                </span>
              </header>
              <div className="order-card__items">
                {order.items.map((item) => (
                  <div key={item.productId} className="order-card__item">
                    <img src={item.image} alt="" />
                    <span>{item.name} × {item.qty}</span>
                  </div>
                ))}
              </div>
              <footer className="order-card__foot">
                <span>Total: <strong>{formatUsdAsAoa(order.totalAoa / order.exchangeRate, order.exchangeRate)}</strong></span>
                <span>Taxa: 1 USD = {formatUsdAsAoa(1, order.exchangeRate)}</span>
                <Link to={`/pedido?order=${encodeURIComponent(order.id)}`} className="btn btn--outline btn--sm">Ver detalhes</Link>
              </footer>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
