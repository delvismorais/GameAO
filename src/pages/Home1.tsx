import { HeroSlider } from '../components/home/HeroSlider';
import { FeatureBoxes } from '../components/home/FeatureBoxes';
import { PromoGlider } from '../components/home/PromoGlider';
import { PreorderBanner } from '../components/home/PreorderBanner';
import { ProductCarousel, type CarouselTab } from '../components/shop/ProductCarousel';
import { DealsSection } from '../components/shop/DealsSection';
import { ProductGrid } from '../components/shop/ProductGrid';
import { BlogSection } from '../components/blog/BlogSection';
import { SectionHeading } from '../components/ui/SectionHeading';
import { useStore } from '../context/StoreContext';
import {
  DEAL_PRODUCTS,
  FEATURED_PRODUCTS,
  RECENT_PRODUCTS,
} from '../data/products';
import {
  HOME1_FEATURES,
  HOME1_PREORDER,
  HOME1_PROMOS,
  HOME1_SLIDES,
} from '../data/site';

const HOME_TABS: CarouselTab[] = [
  { id: 'all', label: 'Todos' },
  { id: 'xbox', label: 'Xbox', category: 'xbox' },
  { id: 'playstation', label: 'PlayStation', category: 'playstation' },
  { id: 'pc', label: 'PC', category: 'pc' },
];

export function Home1() {
  const { catalogProducts } = useStore();
  const featured = catalogProducts.filter((product) => product.hot || product.featuredOrder !== undefined).slice(0, 10);
  const deals = catalogProducts.filter((product) => product.salePriceUsd !== undefined && product.salePriceUsd < product.basePriceUsd).slice(0, 10);
  const recent = [...catalogProducts].sort((a, b) => a.shopOrder - b.shopOrder).slice(0, 10);
  return (
    <div className="home home--light">
      <HeroSlider slides={HOME1_SLIDES} />
      <FeatureBoxes features={HOME1_FEATURES} overlap />
      <ProductCarousel
        id="featured-games"
        title="Jogos em Destaque"
        products={featured.length ? featured : FEATURED_PRODUCTS}
        tabs={HOME_TABS}
      />
      <DealsSection products={deals.length ? deals : DEAL_PRODUCTS} />
      <PromoGlider promos={HOME1_PROMOS} />
      <PreorderBanner data={HOME1_PREORDER} />
      <section className="home-section recent-games">
        <div className="container">
          <SectionHeading title="Jogos Recentes" />
          <ProductGrid products={recent.length ? recent : RECENT_PRODUCTS} columns={5} />
        </div>
      </section>
      <BlogSection />
    </div>
  );
}
