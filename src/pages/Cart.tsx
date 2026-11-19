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
import { useSeo } from '../lib/seo';

export function Cart() {
  const { cartLines, cartSubtotalUsd, cartDiscountUsd, removeFromCart, setQty, setVariant, cartCount } = useStore();
  const { rate } = useSettings();
  const { showToast } = useToast();
  const totalUsd = cartSubtotalUsd - cartDiscountUsd;

  useSeo({ title: 'Carrinho | GameAO', path: '/cart', noindex: true });
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
                  {cartLines.map(({ product, qty, variant, unitPriceUsd }) => {
                    const unit = unitPriceUsd;
                    return (
                      <tr key={`${product.id}:${variant?.id ?? 'base'}`}>
                        <td className="cart-table__remove">
                          <button
                            type="button"
                            onClick={() => {
                              removeFromCart(product.id, variant?.id);
                              showToast(`${product.name} removido do carrinho.`, 'info');
                            }}
                            aria-label={`Remover ${product.name}${variant ? ` — ${variant.name}` : ''}`}
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
                            <span className="cart-table__meta">{variant?.name ?? product.platform}</span>{product.variants?.length ? <select className="cart-variant-select" aria-label={`Opção de ${product.name}`} value={variant?.id ?? ''} onChange={(event) => setVariant(product.id, Number(event.target.value), variant?.id)}>{product.variants.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select> : null}
                          </div>
                        </td>
                        <td data-label="Preço"><Price usd={unit} baseUsd={variant ? (variant.originalPriceUsd ?? unit) : product.basePriceUsd} size="sm" /></td>
                        <td data-label="Quantidade">
                          <Quantity value={qty} onChange={(next) => setQty(product.id, next, variant?.id)} compact />
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
                    showToast('Não existem cupões ativos neste momento. O campo será disponibilizado quando houver campanhas.', 'info');
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
                Preços apresentados diretamente na moeda da loja.
                <br />
                A taxa aplicada é gerida internamente pela loja.
              </p>
              <Link to="/checkout" className="btn btn--primary btn--block">Finalizar Compra</Link>
              <p className="cart-totals-note">Pagamento na entrega. A confirmação será feita pela equipa GameAO.</p>
            </aside>
          </div>

          <div className="cart-bottom-note">
            <Icon name="cart" />
            <p>
              Os totais são recalculados automaticamente. Os valores da encomenda ficam registados com a
              taxa usada no momento da confirmação.
            </p>
          </div>
        </>
      )}
    </PageShell>
  );
}
