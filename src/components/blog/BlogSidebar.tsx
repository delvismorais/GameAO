import { Link } from 'react-router-dom';
import { POSTS } from '../../data/posts';
import { formatDatePt } from '../../lib/pricing';

export function BlogSidebar() {
  const tags = Array.from(new Set(POSTS.flatMap((post) => post.tags))).sort((a, b) => a.localeCompare(b, 'pt'));
  return (
    <aside className="page-sidebar">
      <div className="widget">
        <h3 className="widget__title">Artigos Recentes</h3>
        <ul className="widget-posts">
          {POSTS.slice(0, 6).map((post) => (
            <li key={post.slug}>
              <Link to={`/blog/${post.slug}`} className="widget-post">
                <img src={post.imageThumb} alt="" loading="lazy" />
                <span>
                  <strong>{post.title}</strong>
                  <small>{formatDatePt(post.date)}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="widget">
        <h3 className="widget__title">Etiquetas</h3>
        <div className="tag-cloud tag-cloud--sidebar">
          {tags.map((tag) => (
            <Link key={tag} to={`/category/news?tag=${encodeURIComponent(tag)}`} className="tag">
              {tag}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
