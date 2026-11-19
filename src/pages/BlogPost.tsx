import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { BlogSidebar } from '../components/blog/BlogSidebar';
import { BlogCard } from '../components/blog/BlogCard';
import { Rating } from '../components/ui/Rating';
import { Icon } from '../components/ui/Icon';
import { useToast } from '../context/ToastContext';
import { formatDatePt } from '../lib/pricing';
import { useSeo } from '../lib/seo';
import { getPostBySlug, POSTS } from '../data/posts';

export function BlogPost() {
  const { slug } = useParams();
  const post = slug ? getPostBySlug(slug) : undefined;
  const { showToast } = useToast();
  useSeo({
    title: post ? `${post.title} — GameAO` : 'Notícias — GameAO',
    description: post?.excerpt,
    path: post ? `/blog/${post.slug}` : undefined,
    image: post?.image,
    type: 'article',
  });
  const [form, setForm] = useState({ author: '', email: '', text: '' });
  const [remoteComments, setRemoteComments] = useState<Array<{ id: number; author_name: string; content: string; created_at: string }>>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const postSlug = post?.slug ?? '';
  const totalComments = Math.max(post?.commentsCount ?? 0, remoteComments.length);
  const related = POSTS.filter((item) => item.slug !== post?.slug).slice(0, 3);

  useEffect(() => {
    if (!postSlug) return;
    let active = true;
    setCommentsLoading(true);
    void fetch(`/api/blog/posts/${encodeURIComponent(postSlug)}/comments`).then((response) => response.ok ? response.json() : { comments: [] }).then((data: { comments?: typeof remoteComments }) => { if (active) setRemoteComments(data.comments ?? []); }).catch(() => undefined).finally(() => { if (active) setCommentsLoading(false); });
    return () => { active = false; };
  }, [postSlug]);

  if (!post) return <Navigate to="/category/news" replace />;


  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link do artigo copiado.', 'info');
    } catch {
      showToast('Não foi possível copiar o link.', 'error');
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.author.trim() || !form.email.trim() || form.text.trim().length < 5) {
      showToast('Preencha o nome, email e um comentário com pelo menos 5 caracteres.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/blog/posts/${encodeURIComponent(post.slug)}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: form.author, email: form.email, content: form.text }) });
      const data = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) throw new Error(data?.message || 'Não foi possível enviar o comentário.');
      setForm({ author: '', email: '', text: '' });
      showToast(data?.message || 'Comentário recebido para moderação.', 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Não foi possível enviar o comentário. Tente novamente.', 'error');
    } finally { setSubmitting(false); }
  };

  return (
    <PageShell crumbs={[{ label: 'Notícias', href: '/category/news' }, { label: post.title }]}>
      <div className="sidebar-layout">
        <article className="sidebar-layout__main blog-post">
          <h1 className="blog-post__title">{post.title}</h1>
          <div className="blog-post__meta">
            <span>Por <strong>{post.author}</strong></span>
            <span>{formatDatePt(post.date)}</span>
            <span>{post.views} visualizações</span>
            <span>{totalComments} {totalComments === 1 ? 'comentário' : 'comentários'}</span>
          </div>
          <img src={post.image} alt="" className="blog-post__cover" />

          <div className="blog-post__content">
            {post.blocks.map((block, index) => {
              if (block.type === 'h2') return <h2 key={index}>{block.text}</h2>;
              if (block.type === 'quote') return <blockquote key={index}>{block.text}</blockquote>;
              if (block.type === 'list') {
                return (
                  <ul key={index}>
                    {block.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                );
              }
              if (block.type === 'image') {
                return (
                  <figure key={index} className="blog-post__figure">
                    <img src={block.src} alt={block.alt} loading="lazy" />
                    {block.caption && <figcaption>{block.caption}</figcaption>}
                  </figure>
                );
              }
              return <p key={index}>{block.text}</p>;
            })}
          </div>

          <div className="blog-post__tags">
            {post.tags.map((tag) => (
              <Link key={tag} to={`/category/news?tag=${encodeURIComponent(tag)}`} className="tag">{tag}</Link>
            ))}
          </div>

          <div className="blog-post__share">
            <span>Partilhar:</span>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" aria-label="Partilhar no Facebook"><Icon name="facebook" /></a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" aria-label="Partilhar no X"><Icon name="twitter" /></a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" aria-label="Partilhar no Telegram"><Icon name="telegram" /></a>
            <a href={`https://wa.me/?text=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" aria-label="Partilhar no WhatsApp"><Icon name="whatsapp" /></a>
            <button type="button" onClick={share} aria-label="Copiar link"><Icon name="share" /></button>
          </div>

          <section className="comments" id="comentarios">
            <h2>{totalComments} {totalComments === 1 ? 'comentário' : 'comentários'}</h2>
            {post.commentsCount > 0 && (
              <div className="comment">
                <div className="comment__avatar">A</div>
                <div className="comment__body">
                  <strong>Administrador</strong>
                  <span>Comentário do leitor</span>
                  <p>Obrigado pela partilha. A equipa GameAO vai continuar a acompanhar este tema nas próximas notícias.</p>
                </div>
              </div>
            )}
            {remoteComments.map((comment) => (
              <div className="comment" key={`remote-${comment.id}`}>
                <div className="comment__avatar">{comment.author_name.charAt(0).toUpperCase()}</div>
                <div className="comment__body"><strong>{comment.author_name}</strong><span>{formatDatePt(comment.created_at)}</span><p>{comment.content}</p></div>
              </div>
            ))}

            {!commentsLoading && remoteComments.length === 0 && (
              <p className="comments__empty">Ainda não há comentários publicados. Seja o primeiro a participar.</p>
            )}
            <form className="comment-form" onSubmit={submit}>
              <h2>Deixar um comentário</h2>
              <p>O seu endereço de email não será publicado. Os comentários são analisados pela equipa antes de ficarem visíveis.</p>
              <label className="field">
                <span>Comentário *</span>
                <textarea rows={4} value={form.text} onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} />
              </label>
              <div className="form-row">
                <label className="field">
                  <span>Nome *</span>
                  <input value={form.author} onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))} />
                </label>
                <label className="field">
                  <span>Email *</span>
                  <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
                </label>
              </div>
              <button type="submit" className="btn btn--primary" disabled={submitting}>{submitting ? 'A enviar…' : 'Enviar comentário'}</button>
            </form>
          </section>

          <section className="related-posts">
            <h2 className="section-heading__title">Artigos Relacionados</h2>
            <div className="news-grid news-grid--related">
              {related.map((item) => <BlogCard key={item.slug} post={item} />)}
            </div>
          </section>
        </article>
        <BlogSidebar />
      </div>
    </PageShell>
  );
}
