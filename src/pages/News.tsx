import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { BlogCard } from '../components/blog/BlogCard';
import { BlogSidebar } from '../components/blog/BlogSidebar';
import { Pagination } from '../components/ui/Pagination';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { POSTS } from '../data/posts';
import { useSeo } from '../lib/seo';

const PER_PAGE = 6;

export function News() {
  const [params, setParams] = useSearchParams();
  const tag = params.get('tag') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? 1));

  const filtered = tag ? POSTS.filter((post) => post.tags.includes(tag)) : POSTS;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const setPage = (next: number) => {
    const paramsNext = new URLSearchParams(params);
    if (next <= 1) paramsNext.delete('page');
    else paramsNext.set('page', String(next));
    setParams(paramsNext, { replace: true });
  };

  useSeo({
    title: 'Notícias e novidades gaming | GameAO',
    description: 'Análises, lançamentos e guias sobre videojogos, Free Fire, Roblox e consolas.',
    path: '/category/news',
  });
  return (
    <PageShell crumbs={[{ label: 'Notícias' }]}>
      <div className="sidebar-layout">
        <div className="sidebar-layout__main">
          <h1 className="page-title">Notícias</h1>
          <p className="page-subtitle">Novidades, análises e guias da equipa GameAO.</p>

          {tag && (
            <div className="news-tag-filter">
              <span>Etiqueta: <strong>{tag}</strong></span>
              <Link to="/category/news" className="btn btn--outline btn--sm"><Icon name="close" /> Limpar</Link>
            </div>
          )}

          {visible.length === 0 ? (
            <EmptyState
              title="Nenhum artigo encontrado"
              icon="📰"
              action={<Link to="/category/news" className="btn btn--primary">Ver todas as notícias</Link>}
            >
              Não há artigos com esta etiqueta.
            </EmptyState>
          ) : (
            <>
              <div className="news-grid">
                {visible.map((post) => <BlogCard key={post.slug} post={post} />)}
              </div>
              <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </div>
        <BlogSidebar />
      </div>
    </PageShell>
  );
}
