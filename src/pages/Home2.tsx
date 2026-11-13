import { HeroSlider } from '../components/home/HeroSlider';
import { FeatureBoxes } from '../components/home/FeatureBoxes';
import { PromoGlider } from '../components/home/PromoGlider';
import { PreorderBanner } from '../components/home/PreorderBanner';
import { ProductCarousel, type CarouselTab } from '../components/shop/ProductCarousel';
import { DealsSection } from '../components/shop/DealsSection';
import { ProductGrid } from '../components/shop/ProductGrid';
import { BlogSection } from '../components/blog/BlogSection';
import { SectionHeading } from '../components/ui/SectionHeading';
import {
  DEAL_PRODUCTS,
  FEATURED_PRODUCTS,
  RECENT_PRODUCTS,
} from '../data/products';
import {
  HOME2_FEATURES,
  HOME2_PREORDER,
  HOME2_PROMOS,
  HOME2_SLIDES,
} from '../data/site';

const HOME_TABS: CarouselTab[] = [
  { id: 'all', label: 'Todos' },
  { id: 'xbox', label: 'Xbox', category: 'xbox' },
  { id: 'playstation', label: 'PlayStation', category: 'playstation' },
  { id: 'pc', label: 'PC', category: 'pc' },
];

export function Home2() {
  return (
    <div className="home home--dark">
      <HeroSlider slides={HOME2_SLIDES} />
      <FeatureBoxes features={HOME2_FEATURES} variant="dark" />
      <ProductCarousel
        id="featured-games"
        title="Jogos em Destaque"
        products={FEATURED_PRODUCTS}
        tabs={HOME_TABS}
        variant="dark"
      />
      <DealsSection products={DEAL_PRODUCTS} variant="dark" />
      <PromoGlider promos={HOME2_PROMOS} />
      <PreorderBanner data={HOME2_PREORDER} />
      <section className="home-section recent-games home-section--dark">
        <div className="container">
          <SectionHeading title="Jogos Recentes" />
          <ProductGrid products={RECENT_PRODUCTS} columns={5} variant="dark" />
        </div>
      </section>
      <BlogSection variant="dark" />
    </div>
  );
}
