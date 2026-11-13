import type { Product } from '../../data/products';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4 | 5;
  showCategory?: boolean;
  variant?: 'light' | 'dark';
}

export function ProductGrid({ products, columns = 4, showCategory = false, variant = 'light' }: ProductGridProps) {
  return (
    <div className={`product-grid product-grid--${columns}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showCategory={showCategory} variant={variant} />
      ))}
    </div>
  );
}
