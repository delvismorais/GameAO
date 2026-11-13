import { Link } from 'react-router-dom';
import { CATEGORIES, getEffectivePriceUsd, type Product } from '../../data/products';
import { discountPercent } from '../../lib/pricing';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Price } from '../ui/Price';
import { Rating } from '../ui/Rating';
import { Icon } from '../ui/Icon';

export function DealCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWishlisted, toggleCompare, isCompared } = useStore();
  const { showToast } = useToast();
  const effective = getEffectivePriceUsd(product);
  const discount = discountPercent(product.basePriceUsd, product.salePriceUsd);
  const category = CATEGORIES.find((item) => item.slug === product.categories[0])?.name ?? 'Jogos';

  return (
    <article className="deal-card">
      <div className="deal-card__thumb">
        <Link to={`/product/${product.slug}`} aria-label={product.name}>
          <img src={product.imageCard} alt={`Capa de ${product.name}`} loading="lazy" />
        </Link>
        {discount > 0 && <span className="badge badge--sale">-{discount}%</span>}
        {product.hot && <span className="badge badge--hot">Popular</span>}
      </div>
      <div className="deal-card__body">
        <span className="deal-card__cat">{category}</span>
        <h3><Link to={`/product/${product.slug}`}>{product.name}</Link></h3>
        <Rating value={product.rating} />
        <p className="deal-card__excerpt">{product.shortDescription}</p>
        <div className="deal-card__foot">
          <Price usd={effective} baseUsd={product.basePriceUsd} size="md" />
          <div className="deal-card__actions">
            <button
              type="button"
              className="product-action product-action--cart"
              onClick={() => {
                addToCart(product.id);
                showToast(`${product.name} foi adicionado ao carrinho.`);
              }}
              aria-label={`Adicionar ${product.name} ao carrinho`}
            >
              <Icon name="cart" />
            </button>
            <button
              type="button"
              className={`product-action product-action--icon ${isWishlisted(product.id) ? 'is-active' : ''}`.trim()}
              onClick={() => {
                const result = toggleWishlist(product.id);
                showToast(result === 'added' ? 'Adicionado à lista de desejos.' : 'Removido da lista de desejos.', result === 'added' ? 'success' : 'info');
              }}
              aria-label="Lista de desejos"
            >
              <Icon name="heart" />
            </button>
            <button
              type="button"
              className={`product-action product-action--icon ${isCompared(product.id) ? 'is-active' : ''}`.trim()}
              onClick={() => {
                const result = toggleCompare(product.id);
                showToast(
                  result === 'full'
                    ? 'Pode comparar no máximo 4 produtos.'
                    : result === 'added'
                      ? 'Adicionado à comparação.'
                      : 'Removido da comparação.',
                  result === 'full' ? 'error' : result === 'added' ? 'success' : 'info',
                );
              }}
              aria-label="Comparar produto"
            >
              <Icon name="compare" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
