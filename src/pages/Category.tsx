import { Navigate, useParams } from 'react-router-dom';
import { ShopView } from '../components/shop/ShopView';

export function Category() {
  const { slug } = useParams();
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return <Navigate to="/shop" replace />;
  }
  return <ShopView category={slug} />;
}
