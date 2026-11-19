import { Link } from 'react-router-dom';
import { CATEGORIES, getEffectivePriceUsd, type Product } from '../../data/products';
import { discountPercent } from '../../lib/pricing';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Price } from '../ui/Price';
import { Rating } from '../ui/Rating';
import { Icon } from '../ui/Icon';

interface ProductCardProps {
  product: Product;
  showCategory?: boolean;
  variant?: 'light' | 'dark';
}

export function ProductCard({ product, showCategory = false, variant = 'light' }: ProductCardProps) {
  const { addToCart, toggleWishlist, isWishlisted, toggleCompare, isCompared, catalogCategories } = useStore();
  const { showToast } = useToast();
  const effective = getEffectivePriceUsd(product);
  const discount = discountPercent(product.basePriceUsd, product.salePriceUsd);
  const wished = isWishlisted(product.id);
  const compared = isCompared(product.id);
  const category = product.categories.includes('featured')
    ? 'Destaques'
    : product.categoryNames?.[0] ?? catalogCategories.find((item) => item.slug === product.categories[0])?.name ?? CATEGORIES.find((item) => item.slug === product.categories[0])?.name ?? 'Jogos';

  const handleAdd = () => {
    const added = addToCart(product.id);
    showToast(added ? `${product.name} foi adicionado ao carrinho.` : 'Escolha uma opção na página do produto antes de adicionar ao carrinho.', added ? 'success' : 'info');
  };

  const handleWishlist = () => {
    const result = toggleWishlist(product.id);
    showToast(
      result === 'added'
        ? `${product.name} adicionado à lista de desejos.`
        : `${product.name} removido da lista de desejos.`,
      result === 'added' ? 'success' : 'info',
    );
  };

  const handleCompare = () => {
    const result = toggleCompare(product.id);
    if (result === 'full') {
      showToast('Pode comparar no máximo 4 produtos. Remova um para adicionar outro.', 'error');
      return;
    }
    showToast(
      result === 'added'
        ? `${product.name} adicionado à comparação.`
        : `${product.name} removido da comparação.`,
      result === 'added' ? 'success' : 'info',
    );
  };

  return (
    <article className={`product-card product-card--${variant}`.trim()}>
      <div className="product-card__thumb">
        <Link to={`/product/${product.slug}`} aria-label={product.name}>
          <img src={product.imageCard} alt={`Capa de ${product.name}`} loading="lazy" width={300} height={450} />
        </Link>
        <div className="product-card__badges">
          {discount > 0 && <span className="badge badge--sale">-{discount}%</span>}
          {product.hot && <span className="badge badge--hot">Popular</span>}
        </div>
        <div className="product-card__actions">
          <button type="button" className="product-action product-action--cart" onClick={handleAdd}>
            <Icon name="cart" /> <span>Adicionar</span>
          </button>
          <button
            type="button"
            className={`product-action product-action--icon ${wished ? 'is-active' : ''}`.trim()}
            onClick={handleWishlist}
            aria-label={wished ? 'Remover dos desejos' : 'Adicionar aos desejos'}
            title={wished ? 'Remover dos desejos' : 'Adicionar aos desejos'}
          >
            <Icon name="heart" />
          </button>
          <button
            type="button"
            className={`product-action product-action--icon ${compared ? 'is-active' : ''}`.trim()}
            onClick={handleCompare}
            aria-label={compared ? 'Remover da comparação' : 'Adicionar à comparação'}
            title={compared ? 'Remover da comparação' : 'Adicionar à comparação'}
          >
            <Icon name="compare" />
          </button>
        </div>
      </div>
      <div className="product-card__details">
        {showCategory && <span className="product-card__cat">{category}</span>}
        <h3 className="product-card__title">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <Price usd={effective} baseUsd={product.basePriceUsd} size="sm" />
        <Rating value={product.rating} />
      </div>
    </article>
  );
}
