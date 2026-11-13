import { useEffect, useRef, useState } from 'react';
import type { Product } from '../../data/products';
import { Icon } from '../ui/Icon';
import { Countdown } from './Countdown';
import { DealCard } from './DealCard';

interface DealsSectionProps {
  products: Product[];
  variant?: 'light' | 'dark';
}

export function DealsSection({ products, variant = 'light' }: DealsSectionProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = () => {
    const node = viewportRef.current;
    if (!node) return;
    setCanPrev(node.scrollLeft > 4);
    setCanNext(node.scrollLeft + node.clientWidth < node.scrollWidth - 4);
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateArrows);
    window.addEventListener('resize', updateArrows);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateArrows);
    };
  }, [products.length]);

  const scroll = (direction: -1 | 1) => {
    const node = viewportRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>('.deal-card');
    const step = card ? card.offsetWidth + 20 : node.clientWidth / 2;
    node.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <section className={`home-section deals home-section--${variant}`.trim()}>
      <div className="container">
        <div className="deals__head">
          <h2 className="section-heading__title">Ofertas da Semana</h2>
          <Countdown />
        </div>
        <div className="carousel deals__carousel">
          <div className="carousel__viewport deals__viewport" ref={viewportRef} onScroll={updateArrows}>
            {products.map((product) => (
              <DealCard key={product.id} product={product} />
            ))}
          </div>
          <button
            type="button"
            className="carousel__arrow carousel__arrow--prev"
            onClick={() => scroll(-1)}
            disabled={!canPrev}
            aria-label="Ofertas anteriores"
          >
            <Icon name="arrowLeft" />
          </button>
          <button
            type="button"
            className="carousel__arrow carousel__arrow--next"
            onClick={() => scroll(1)}
            disabled={!canNext}
            aria-label="Ofertas seguintes"
          >
            <Icon name="arrowRight" />
          </button>
        </div>
      </div>
    </section>
  );
}
