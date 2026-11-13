import { Link } from 'react-router-dom';
import type { Post } from '../../data/posts';
import { formatDatePt } from '../../lib/pricing';

export function BlogCard({ post }: { post: Post }) {
  return (
    <article className="blog-card">
      <Link to={`/blog/${post.slug}`} className="blog-card__thumb" aria-label={post.title}>
        <img src={post.imageCard} alt="" loading="lazy" width={375} height={211} />
      </Link>
      <div className="blog-card__body">
        <div className="blog-card__meta">
          <span>{post.category}</span>
          <span>{formatDatePt(post.date)}</span>
        </div>
        <h3><Link to={`/blog/${post.slug}`}>{post.title}</Link></h3>
        <p>{post.excerpt}</p>
        <Link to={`/blog/${post.slug}`} className="blog-card__more">Ler Mais →</Link>
      </div>
    </article>
  );
}
