import { useEffect, useMemo, useRef, useState } from 'react';
import type { CategorySlug, Product } from '../../data/products';
import { SectionHeading } from '../ui/SectionHeading';
import { Icon } from '../ui/Icon';
import { ProductCard } from './ProductCard';
import type { TabItem } from '../ui/Tabs';

export interface CarouselTab extends TabItem {
  category?: CategorySlug;
}

interface ProductCarouselProps {
  title: string;
  products: Product[];
  tabs?: CarouselTab[];
  variant?: 'light' | 'dark';
  id: string;
}

export function ProductCarousel({ title, products, tabs, variant = 'light', id }: ProductCarouselProps) {
  const [active, setActive] = useState(tabs?.[0]?.id ?? 'all');
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const visibleProducts = useMemo(() => {
    const current = tabs?.find((tab) => tab.id === active);
    if (!current?.category) return products;
    return products.filter((product) => product.categories.includes(current.category!));
  }, [active, products, tabs]);

  const updateArrows = () => {
    const node = viewportRef.current;
    if (!node) return;
    setCanPrev(node.scrollLeft > 4);
    setCanNext(node.scrollLeft + node.clientWidth < node.scrollWidth - 4);
  };

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    node.scrollTo({ left: 0 });
    const frame = window.requestAnimationFrame(updateArrows);
    return () => window.cancelAnimationFrame(frame);
  }, [active, visibleProducts.length]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const onResize = () => updateArrows();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const scroll = (direction: -1 | 1) => {
    const node = viewportRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>('.product-card');
    const step = card ? card.offsetWidth + 20 : node.clientWidth / 2;
    node.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <section className={`home-section product-carousel home-section--${variant}`.trim()} id={id}>
      <div className="container">
        <SectionHeading
          title={title}
          tabs={tabs}
          activeTab={active}
          onTabChange={setActive}
        />
        <div className="carousel">
          <div className="carousel__viewport" ref={viewportRef} onScroll={updateArrows}>
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} variant={variant} />
            ))}
          </div>
          <button
            type="button"
            className="carousel__arrow carousel__arrow--prev"
            onClick={() => scroll(-1)}
            disabled={!canPrev}
            aria-label="Produtos anteriores"
          >
            <Icon name="arrowLeft" />
          </button>
          <button
            type="button"
            className="carousel__arrow carousel__arrow--next"
            onClick={() => scroll(1)}
            disabled={!canNext}
            aria-label="Produtos seguintes"
          >
            <Icon name="arrowRight" />
          </button>
        </div>
      </div>
    </section>
  );
}
