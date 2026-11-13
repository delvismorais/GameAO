import { Link } from 'react-router-dom';
import type { Preorder } from '../../data/site';

export function PreorderBanner({ data }: { data: Preorder }) {
  return (
    <section
      className="preorder"
      style={{ backgroundImage: `url(${data.image})`, backgroundPosition: data.position ?? 'center' }}
    >
      <span className="preorder__shade" />
      <div className="container preorder__content">
        <h2>{data.title}</h2>
        <p>{data.description}</p>
        <Link to={data.href} className="btn btn--primary btn--lg">{data.buttonLabel}</Link>
      </div>
    </section>
  );
}
