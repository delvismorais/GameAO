import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { useSettings } from '../../context/SettingsContext';
import { formatAoa, formatUsdAsAoa, usdToAoa } from '../../lib/pricing';
import { getEffectivePriceUsd } from '../../data/products';
import { Icon } from '../ui/Icon';
import { Quantity } from '../ui/Quantity';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cartLines, cartCount, cartSubtotalUsd, cartDiscountUsd, removeFromCart, setQty } = useStore();
  const { rate } = useSettings();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const total = usdToAoa(cartSubtotalUsd - cartDiscountUsd, rate);

  return (
    <div className={`cart-drawer ${open ? 'is-open' : ''}`.trim()} aria-hidden={!open}>
      <div className="cart-drawer__overlay" onClick={onClose} />
      <aside className="cart-drawer__panel" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
        <div className="cart-drawer__head">
          <h2>Meu Carrinho <span>({cartCount})</span></h2>
          <button type="button" onClick={onClose} aria-label="Fechar carrinho" className="cart-drawer__close">
            <Icon name="close" />
          </button>
        </div>

        <div className="cart-drawer__body">
          {cartLines.length === 0 ? (
            <div className="cart-drawer__empty">
              <Icon name="cart" size={42} />
              <p>O seu carrinho está vazio.</p>
              <Link to="/shop" className="btn btn--primary" onClick={onClose}>Explorar a Loja</Link>
            </div>
          ) : (
            <ul className="cart-drawer__list">
              {cartLines.map(({ product, qty }) => {
                const price = getEffectivePriceUsd(product);
                return (
                  <li key={product.id} className="cart-drawer__item">
                    <Link to={`/product/${product.slug}`} onClick={onClose} className="cart-drawer__thumb">
                      <img src={product.imageCard} alt={product.name} />
                    </Link>
                    <div className="cart-drawer__info">
                      <Link to={`/product/${product.slug}`} onClick={onClose} className="cart-drawer__name">
                        {product.name}
                      </Link>
                      <span className="cart-drawer__price">{formatUsdAsAoa(price * qty, rate)}</span>
                      <div className="cart-drawer__actions">
                        <Quantity value={qty} onChange={(next) => setQty(product.id, next)} compact />
                        <button
                          type="button"
                          className="cart-drawer__remove"
                          onClick={() => removeFromCart(product.id)}
                          aria-label={`Remover ${product.name}`}
                        >
                          <Icon name="close" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cartLines.length > 0 && (
          <div className="cart-drawer__foot">
            <div className="cart-drawer__total">
              <span>Total</span>
              <strong>{formatUsdAsAoa(cartSubtotalUsd - cartDiscountUsd, rate)}</strong>
            </div>
            <p className="cart-drawer__note">Taxa aplicada: 1 USD = {formatAoa(rate)}</p>
            <div className="cart-drawer__buttons">
              <Link to="/cart" className="btn btn--outline" onClick={onClose}>Ver Carrinho</Link>
              <Link to="/checkout" className="btn btn--primary" onClick={onClose}>Finalizar Compra</Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
