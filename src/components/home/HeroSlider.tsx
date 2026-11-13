import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Slide } from '../../data/site';
import { Icon } from '../ui/Icon';

interface HeroSliderProps {
  slides: Slide[];
  className?: string;
}

export function HeroSlider({ slides, className = '' }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (paused || reduced || slides.length < 2) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 10_000);
    return () => window.clearTimeout(timer);
  }, [index, paused, reduced, slides.length]);

  const go = (direction: -1 | 1) => {
    setIndex((current) => (current + direction + slides.length) % slides.length);
  };

  const active = slides[index];

  return (
    <section
      className={`hero-slider ${active.align === 'center' ? 'hero-slider--center' : ''} ${className}`.trim()}
      aria-roledescription="carrossel"
      aria-label="Destaques da loja"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, slideIndex) => (
        <div
          key={slide.id}
          className={`hero-slide ${slideIndex === index ? 'is-active' : ''}`.trim()}
          style={{ backgroundImage: `url(${slide.image})` }}
          aria-hidden={slideIndex !== index}
        >
          <span className="hero-slide__shade" />
        </div>
      ))}

      <div className={`container hero-content hero-content--${active.align}`}>
        <div className="hero-content__inner" key={active.id}>
          <h1 className="hero-content__title">{active.title}</h1>
          <p className="hero-content__text">{active.description}</p>
          <Link to={active.href} className="btn btn--primary btn--lg hero-content__button">
            {active.buttonLabel}
          </Link>
        </div>
      </div>

      <button type="button" className="hero-arrow hero-arrow--prev" onClick={() => go(-1)} aria-label="Slide anterior">
        <Icon name="arrowLeft" />
      </button>
      <button type="button" className="hero-arrow hero-arrow--next" onClick={() => go(1)} aria-label="Slide seguinte">
        <Icon name="arrowRight" />
      </button>
      <div className="hero-dots">
        {slides.map((slide, dotIndex) => (
          <button
            key={slide.id}
            type="button"
            className={`hero-dot ${dotIndex === index ? 'is-active' : ''}`.trim()}
            onClick={() => setIndex(dotIndex)}
            aria-label={`Ir para o slide ${dotIndex + 1}`}
            aria-current={dotIndex === index ? 'true' : undefined}
          />
        ))}
      </div>
    </section>
  );
}
