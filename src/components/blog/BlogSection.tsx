import { Link } from 'react-router-dom';
import { POSTS } from '../../data/posts';
import { BlogCard } from './BlogCard';

export function BlogSection({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const posts = POSTS.slice(0, 4);
  return (
    <section className={`home-section blog-section home-section--${variant}`.trim()}>
      <div className="container">
        <div className="section-heading">
          <h2 className="section-heading__title">Notícias Recentes</h2>
          <Link to="/category/news" className="section-heading__link">Ver Todas</Link>
        </div>
        <div className="blog-grid">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
