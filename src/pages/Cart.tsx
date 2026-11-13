import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { Price } from '../components/ui/Price';
import { Quantity } from '../components/ui/Quantity';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../context/StoreContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { formatUsdAsAoa } from '../lib/pricing';
import { getEffectivePriceUsd } from '../data/products';

export function Cart() {
  const { cartLines, cartSubtotalUsd, cartDiscountUsd, removeFromCart, setQty, cartCount } = useStore();
  const { rate } = useSettings();
  const { showToast } = useToast();
  const totalUsd = cartSubtotalUsd - cartDiscountUsd;

  return (
    <PageShell crumbs={[{ label: 'Carrinho' }]}>
      <h1 className="page-title">Carrinho</h1>

      {cartLines.length === 0 ? (
        <EmptyState
          title="O seu carrinho está vazio."
          icon="🛒"
          action={<Link to="/shop" className="btn btn--primary">Explorar a Loja</Link>}
        >
          Adicione jogos ao carrinho para continuar. Os artigos ficam guardados neste dispositivo.
        </EmptyState>
      ) : (
        <>
          <div className="cart-notice">
            <Icon name="check" /> O seu carrinho tem {cartCount} {cartCount === 1 ? 'artigo' : 'artigos'}.
          </div>

          <div className="cart-layout">
            <div className="cart-main">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th aria-label="Remover" />
                    <th>Produto</th>
                    <th>Preço</th>
                    <th>Quantidade</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cartLines.map(({ product, qty }) => {
                    const unit = getEffectivePriceUsd(product);
                    return (
                      <tr key={product.id}>
                        <td className="cart-table__remove">
                          <button
                            type="button"
                            onClick={() => {
                              removeFromCart(product.id);
                              showToast(`${product.name} removido do carrinho.`, 'info');
                            }}
                            aria-label={`Remover ${product.name}`}
                          >
                            <Icon name="close" />
                          </button>
                        </td>
                        <td className="cart-table__product">
                          <Link to={`/product/${product.slug}`}>
                            <img src={product.imageCard} alt={`Capa de ${product.name}`} />
                          </Link>
                          <div>
                            <Link to={`/product/${product.slug}`} className="cart-table__name">{product.name}</Link>
                            <span className="cart-table__meta">{product.platform}</span>
                          </div>
                        </td>
                        <td data-label="Preço"><Price usd={unit} baseUsd={product.basePriceUsd} size="sm" /></td>
                        <td data-label="Quantidade">
                          <Quantity value={qty} onChange={(next) => setQty(product.id, next)} compact />
                        </td>
                        <td data-label="Subtotal"><Price usd={unit * qty} size="sm" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="cart-actions">
                <form
                  className="coupon"
                  onSubmit={(event) => {
                    event.preventDefault();
                    showToast('Nesta demonstração não existem cupões ativos. O campo será ativado na fase comercial.', 'info');
                  }}
                >
                  <input type="text" placeholder="Código do cupão" aria-label="Código do cupão" />
                  <button type="submit" className="btn btn--outline">Aplicar cupão</button>
                </form>
                <Link to="/shop" className="btn btn--outline">Continuar a Comprar</Link>
              </div>
            </div>

            <aside className="cart-totals">
              <h2>Totais do Carrinho</h2>
              <div className="cart-totals__row">
                <span>Subtotal</span>
                <span>{formatUsdAsAoa(cartSubtotalUsd, rate)}</span>
              </div>
              {cartDiscountUsd > 0 && (
                <div className="cart-totals__row cart-totals__row--discount">
                  <span>Desconto</span>
                  <span>− {formatUsdAsAoa(cartDiscountUsd, rate)}</span>
                </div>
              )}
              <div className="cart-totals__row cart-totals__row--total">
                <span>Total</span>
                <strong>{formatUsdAsAoa(totalUsd, rate)}</strong>
              </div>
              <p className="cart-totals__rate">
                Taxa aplicada: 1 USD = {formatUsdAsAoa(rate, 1)}.
                <br />
                A taxa aplicada é gerida internamente pela loja.
              </p>
              <Link to="/checkout" className="btn btn--primary btn--block">Finalizar Compra</Link>
              <p className="cart-totals__demo">Demonstração — não é processado qualquer pagamento real.</p>
            </aside>
          </div>

          <div className="cart-bottom-note">
            <Icon name="cart" />
            <p>
              Os totais são recalculados automaticamente com a taxa USD/AOA configurada
              ({formatUsdAsAoa(rate, 1)} por 1 USD). Os valores da encomenda ficam registados com a
              taxa usada no momento da confirmação.
            </p>
          </div>
        </>
      )}
    </PageShell>
  );
}
