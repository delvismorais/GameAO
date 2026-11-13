import { Navigate, useParams } from 'react-router-dom';
import { ShopView } from '../components/shop/ShopView';
import { getCategoryBySlug, type CategorySlug } from '../data/products';

const VALID: CategorySlug[] = ['game', 'xbox', 'playstation', 'pc', 'featured'];

export function Category() {
  const { slug } = useParams();
  if (!slug || !VALID.includes(slug as CategorySlug) || !getCategoryBySlug(slug)) {
    return <Navigate to="/shop" replace />;
  }
  return <ShopView category={slug as CategorySlug} />;
}
