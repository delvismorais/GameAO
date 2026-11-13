import { Link } from 'react-router-dom';
import type { Promo } from '../../data/site';

export function PromoGlider({ promos }: { promos: Promo[] }) {
  return (
    <section className="home-section promo-section">
      <div className="container promo-grid">
        {promos.map((promo) => (
          <Link key={promo.id} to={promo.href} className="promo-banner" aria-label={promo.title}>
            <img src={promo.image} alt="" loading="lazy" className="promo-banner__img" />
            <span className="promo-banner__shade" />
            <div className="promo-banner__content">
              <h2>{promo.title}</h2>
              <p>{promo.description}</p>
              <span className="btn btn--primary">{promo.buttonLabel}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
