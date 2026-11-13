import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { BlogSidebar } from '../components/blog/BlogSidebar';
import { BlogCard } from '../components/blog/BlogCard';
import { Rating } from '../components/ui/Rating';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatDatePt } from '../lib/pricing';
import { getPostBySlug, POSTS } from '../data/posts';

export function BlogPost() {
  const { slug } = useParams();
  const post = slug ? getPostBySlug(slug) : undefined;
  const { comments, addComment } = useStore();
  const { showToast } = useToast();
  const [form, setForm] = useState({ author: '', email: '', text: '' });

  if (!post) return <Navigate to="/category/news" replace />;

  const postComments = comments.filter((comment) => comment.postSlug === post.slug);
  const totalComments = post.commentsCount + postComments.length;
  const related = POSTS.filter((item) => item.slug !== post.slug).slice(0, 3);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link do artigo copiado.', 'info');
    } catch {
      showToast('Não foi possível copiar o link.', 'error');
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.author.trim() || !form.email.trim() || form.text.trim().length < 5) {
      showToast('Preencha o nome, email e um comentário com pelo menos 5 caracteres.', 'error');
      return;
    }
    addComment(post.slug, form.author, form.text);
    setForm({ author: '', email: '', text: '' });
    showToast('Comentário publicado (demonstração).');
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
                  <span>Comentário de demonstração</span>
                  <p>Obrigado pela partilha. A equipa GameAO vai continuar a acompanhar este tema nas próximas notícias.</p>
                </div>
              </div>
            )}
            {postComments.map((comment) => (
              <div className="comment" key={comment.id}>
                <div className="comment__avatar">{comment.author.charAt(0).toUpperCase()}</div>
                <div className="comment__body">
                  <strong>{comment.author}</strong>
                  <span>{formatDatePt(comment.date)}</span>
                  <p>{comment.text}</p>
                </div>
              </div>
            ))}

            <form className="comment-form" onSubmit={submit}>
              <h2>Deixar um comentário</h2>
              <p>O seu endereço de email não será publicado. Os comentários ficam guardados neste dispositivo.</p>
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
              <button type="submit" className="btn btn--primary">Publicar comentário</button>
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
