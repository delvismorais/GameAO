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
  HOME2_FEATURES,
  HOME2_PREORDER,
  HOME2_PROMOS,
  HOME2_SLIDES,
} from '../data/site';
import type { HomepageContentConfig } from '../data/site';
import type { Post } from '../data/posts';
import { useHomepageContent } from '../lib/homepageContent';

const HOME_TABS: CarouselTab[] = [
  { id: 'all', label: 'Todos' },
  { id: 'xbox', label: 'Xbox', category: 'xbox' },
  { id: 'playstation', label: 'PlayStation', category: 'playstation' },
  { id: 'pc', label: 'PC', category: 'pc' },
];

export function Home2({ configuredContent, configuredPosts }: { configuredContent?: HomepageContentConfig; configuredPosts?: Post[] } = {}) {
  const { catalogProducts } = useStore();
  const runtime = useHomepageContent();
  const content = configuredContent ?? runtime.content;
  const posts = configuredPosts ?? runtime.posts;
  const homepage = content.home2;
  const featuredProducts = catalogProducts.filter((product) => product.hot || product.featuredOrder !== undefined).slice(0, 10);
  const catalogDeals = catalogProducts.filter((product) => product.salePriceUsd !== undefined && product.salePriceUsd < product.basePriceUsd);
  const dealProducts = homepage.dealProductSlugs.map((slug) => catalogDeals.find((product) => product.slug === slug)).filter((product): product is typeof catalogProducts[number] => Boolean(product));
  const recentProducts = [...catalogProducts].sort((a, b) => a.shopOrder - b.shopOrder).slice(0, 10);
  const featured = featuredProducts.length ? featuredProducts : FEATURED_PRODUCTS;
  const deals = dealProducts.length ? dealProducts : DEAL_PRODUCTS;
  const recent = recentProducts.length ? recentProducts : RECENT_PRODUCTS;
  return (
    <div className="home home--dark">
      {homepage.heroEnabled && homepage.slides.length > 0 && <HeroSlider slides={homepage.slides.length ? homepage.slides : HOME2_SLIDES} />}
      <FeatureBoxes features={HOME2_FEATURES} variant="dark" />
      <ProductCarousel
        id="featured-games"
        title="Jogos em Destaque"
        products={featured}
        tabs={HOME_TABS}
        variant="dark"
      />
      {homepage.dealsEnabled && <DealsSection products={dealProducts.length ? dealProducts : deals} variant="dark" countdownEndsAt={homepage.countdownEndsAt} />}
      <PromoGlider promos={HOME2_PROMOS} />
      {homepage.preorderEnabled && <PreorderBanner data={homepage.preorder ?? HOME2_PREORDER} />}
      <section className="home-section recent-games home-section--dark">
        <div className="container">
          <SectionHeading title="Jogos Recentes" />
          <ProductGrid products={recent} columns={5} variant="dark" />
        </div>
      </section>
      {homepage.newsEnabled && <BlogSection variant="dark" selectedSlugs={homepage.recentPostSlugs} availablePosts={posts} />}
    </div>
  );
}
