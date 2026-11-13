import type { Feature } from '../../data/site';

interface FeatureBoxesProps {
  features: Feature[];
  variant?: 'light' | 'dark';
  overlap?: boolean;
}

export function FeatureBoxes({ features, variant = 'light', overlap = false }: FeatureBoxesProps) {
  return (
    <section className={`features features--${variant} ${overlap ? 'features--overlap' : ''}`.trim()}>
      <div className="container features__grid">
        {features.map((feature) => (
          <article className="feature-box" key={feature.title}>
            <img src={feature.icon} alt="" className="feature-box__icon" loading="lazy" />
            <h3 className="feature-box__title">{feature.title}</h3>
            <p className="feature-box__text">{feature.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
