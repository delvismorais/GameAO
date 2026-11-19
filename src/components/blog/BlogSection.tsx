import { Link } from 'react-router-dom';
import { POSTS } from '../../data/posts';
import { BlogCard } from './BlogCard';
import type { Post } from '../../data/posts';

export function BlogSection({ variant = 'light', selectedSlugs, availablePosts = POSTS }: { variant?: 'light' | 'dark'; selectedSlugs?: string[]; availablePosts?: Post[] }) {
  const selected = selectedSlugs?.length ? selectedSlugs.map((slug) => availablePosts.find((post) => post.slug === slug)).filter((post): post is Post => Boolean(post)) : [];
  const posts = (selected.length ? selected : availablePosts).slice(0, 4);
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
