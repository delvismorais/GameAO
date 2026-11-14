import { useMemo, useState } from 'react';
import { AdminSection, Badge, Empty, Field, Modal, Notice, api, formatDate, useJson } from './ui';
import type { AdminSectionId } from './adminNav';

type Banner = { id: number; slug: string; title: string; description?: string; image_url: string; button_label?: string; href?: string; variant: string; sort_order: number; is_active: number; starts_at?: string; ends_at?: string };
type Popup = { id: number; title: string; message: string; image_url?: string; cta_label?: string; cta_href?: string; variant: string; delay_seconds: number; frequency: string; is_active: number; starts_at?: string; ends_at?: string; sort_order: number };
type Post = { slug: string; title: string; published_date: string; category: string; author: string; image_url: string; excerpt: string; status: string; views: number; comments_count: number; blocks?: Array<{ type: string; text?: string }> };
type Comment = { id: number; post_slug: string; post_title?: string; author_name: string; author_email?: string; content: string; status: string; created_at: string };
type Message = { id: number; name: string; email: string; phone?: string; subject?: string; message: string; status: string; created_at: string };
type Settings = Record<string, any>;

export function AdminContent({ section }: { section: AdminSectionId }) {
  if (section === 'homepage') return <AdminHomepage />;
  if (section === 'banners' || section === 'carousels') return <AdminBanners mode={section === 'carousels' ? 'carousel' : 'homepage'} />;
  if (section === 'popups') return <AdminPopups />;
  if (section === 'blog') return <AdminBlog />;
  if (section === 'blog-categories') return <AdminBlogCategories />;
  if (section === 'comments') return <AdminComments />;
  if (section === 'contact') return <AdminMessages />;
  if (section === 'pages') return <AdminPages />;
  if (section === 'faq') return <AdminFaq />;
  return <AdminHomepage />;
}

function useSettings() {
  const state = useJson<{ settings: Settings }>('/api/admin/site-settings');
  return state;
}

function AdminHomepage() {
  const settings = useSettings();
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState<{ announcement: string; announcementActive: boolean; tagline: string } | null>(null);
  const data = settings.data?.settings;
  const current = draft ?? { announcement: String(data?.store_status?.announcement ?? ''), announcementActive: Boolean(data?.store_status?.announcementActive), tagline: String(data?.site_config?.tagline ?? '') };
  const save = async () => {
    const first = await api('/api/admin/site-settings/store_status', { method: 'PUT', body: JSON.stringify({ value: { ...(data?.store_status ?? {}), announcement: current.announcement, announcementActive: current.announcementActive } }) });
    const second = first.ok ? await api('/api/admin/site-settings/site_config', { method: 'PUT', body: JSON.stringify({ value: { ...(data?.site_config ?? {}), tagline: current.tagline } }) }) : first;
    setMessage(second.ok ? 'Homepage atualizada.' : second.error ?? 'Falha ao guardar.'); if (second.ok) await settings.reload();
  };
  return <AdminSection title="Gestão da homepage" subtitle="Anúncio global, slogan e atalhos para os conteúdos da página inicial.">
    <Notice message={message} tone={message.includes('Falha') ? 'error' : 'success'} />
    {settings.loading ? <p className="admin-state">A carregar…</p> : <div className="admin-split"><form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <Field label="Slogan da loja"><input value={current.tagline} onChange={(event) => setDraft({ ...current, tagline: event.target.value })} /></Field>
      <Field label="Anúncio global (barra superior)"><textarea rows={2} value={current.announcement} onChange={(event) => setDraft({ ...current, announcement: event.target.value })} /></Field>
      <label className="admin-check"><input type="checkbox" checked={current.announcementActive} onChange={(event) => setDraft({ ...current, announcementActive: event.target.checked })} /> Mostrar anúncio no website</label>
      <button type="submit" className="btn btn--primary">Guardar homepage</button>
    </form><div className="admin-links-grid"><a href="/admin?secao=banners">Banners e carrosséis</a><a href="/admin?secao=featured">Produtos em destaque</a><a href="/admin?secao=blog">Artigos do blog</a><a href="/admin?secao=popups">Popups e anúncios</a></div></div>}
  </AdminSection>;
}

function AdminBanners({ mode }: { mode: string }) {
  const { data, loading, reload } = useJson<{ banners: Banner[] }>('/api/admin/banners');
  const [editing, setEditing] = useState<Banner | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ slug: '', title: '', description: '', image: '', buttonLabel: '', href: '', variant: mode, sortOrder: 0, isActive: true, startsAt: '', endsAt: '' });
  const list = (data?.banners ?? []).filter((banner) => mode === 'carousel' ? banner.variant === 'carousel' : banner.variant !== 'carousel');
  const openCreate = () => { setForm({ slug: '', title: '', description: '', image: '', buttonLabel: '', href: '', variant: mode, sortOrder: 0, isActive: true, startsAt: '', endsAt: '' }); setCreating(true); };
  const openEdit = (banner: Banner) => { setForm({ slug: banner.slug, title: banner.title, description: banner.description ?? '', image: banner.image_url, buttonLabel: banner.button_label ?? '', href: banner.href ?? '', variant: banner.variant, sortOrder: banner.sort_order, isActive: Boolean(banner.is_active), startsAt: banner.starts_at?.slice(0, 10) ?? '', endsAt: banner.ends_at?.slice(0, 10) ?? '' }); setEditing(banner); };
  const save = async () => {
    const result = editing ? await api(`/api/admin/banners/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) }) : await api('/api/admin/banners', { method: 'POST', body: JSON.stringify(form) });
    setMessage(result.ok ? 'Banner guardado.' : result.error ?? 'Falha ao guardar banner.'); if (result.ok) { setCreating(false); setEditing(null); await reload(); }
  };
  return <AdminSection title={mode === 'carousel' ? 'Carrosséis' : 'Banners'} subtitle="Imagens e chamadas de ação usadas no website." actions={<button type="button" className="btn btn--primary btn--sm" onClick={openCreate}>Novo banner</button>}>
    <Notice message={message} tone={message.includes('Falha') ? 'error' : 'success'} />
    <div className="admin-media-grid">{loading ? <Empty>A carregar…</Empty> : list.length ? list.map((banner) => <article key={banner.id} className="admin-media-card"><img src={banner.image_url} alt={banner.title} /><div><strong>{banner.title}</strong><small>{banner.slug} · ordem {banner.sort_order}</small><Badge tone={banner.is_active ? 'success' : 'muted'}>{banner.is_active ? 'Ativo' : 'Inativo'}</Badge></div><button type="button" className="btn btn--outline btn--sm" onClick={() => openEdit(banner)}>Editar</button></article>) : <Empty>Sem banners nesta vista.</Empty>}</div>
    <Modal open={creating || Boolean(editing)} title={editing ? `Editar ${editing.title}` : 'Novo banner'} onClose={() => { setCreating(false); setEditing(null); }} wide>
      <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <div className="form-row"><Field label="Título *"><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Slug *"><input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></Field></div>
        <Field label="Imagem (URL) *"><input required value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></Field>
        <Field label="Descrição"><textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
        <div className="form-row"><Field label="Texto do botão"><input value={form.buttonLabel} onChange={(event) => setForm({ ...form, buttonLabel: event.target.value })} /></Field><Field label="Link do botão"><input value={form.href} onChange={(event) => setForm({ ...form, href: event.target.value })} /></Field></div>
        <div className="form-row"><Field label="Variante"><select value={form.variant} onChange={(event) => setForm({ ...form, variant: event.target.value })}><option value="homepage">Homepage</option><option value="carousel">Carrossel</option><option value="promo">Promoção</option></select></Field><Field label="Ordem"><input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /></Field></div>
        <div className="form-row"><Field label="Início"><input type="date" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></Field><Field label="Fim"><input type="date" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></Field></div>
        <label className="admin-check"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Ativo</label>
        <div className="admin-form__actions"><button type="submit" className="btn btn--primary">Guardar banner</button><button type="button" className="btn btn--outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</button></div>
      </form>
    </Modal>
  </AdminSection>;
}

function AdminPopups() {
  const { data, loading, reload } = useJson<{ popups: Popup[] }>('/api/admin/popups');
  const [editing, setEditing] = useState<Popup | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const empty = { title: '', message: '', imageUrl: '', ctaLabel: '', ctaHref: '', variant: 'promo', delaySeconds: 2, frequency: 'session', isActive: true, startsAt: '', endsAt: '', sortOrder: 0 };
  const [form, setForm] = useState(empty);
  const save = async () => {
    const result = editing ? await api(`/api/admin/popups/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) }) : await api('/api/admin/popups', { method: 'POST', body: JSON.stringify(form) });
    setMessage(result.ok ? 'Popup guardado.' : result.error ?? 'Falha ao guardar.'); if (result.ok) { setEditing(null); setCreating(false); await reload(); }
  };
  const remove = async (popup: Popup) => { if (!window.confirm(`Eliminar o popup "${popup.title}"?`)) return; const result = await api(`/api/admin/popups/${popup.id}`, { method: 'DELETE' }); setMessage(result.ok ? 'Popup eliminado.' : result.error ?? 'Falha ao eliminar.'); if (result.ok) await reload(); };
  return <AdminSection title="Popups e anúncios" subtitle="Mensagens apresentadas no website após um atraso configurável." actions={<button type="button" className="btn btn--primary btn--sm" onClick={() => { setForm(empty); setCreating(true); }}>Novo popup</button>}>
    <Notice message={message} tone={message.includes('Falha') ? 'error' : 'success'} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Título</th><th>Frequência</th><th>Atraso</th><th>Estado</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={5}><Empty>A carregar…</Empty></td></tr> : data?.popups.length ? data.popups.map((popup) => <tr key={popup.id}><td><strong>{popup.title}</strong><small>{popup.message.slice(0, 80)}</small></td><td>{popup.frequency}</td><td>{popup.delay_seconds}s</td><td><Badge tone={popup.is_active ? 'success' : 'muted'}>{popup.is_active ? 'Ativo' : 'Inativo'}</Badge></td><td><div className="admin-row-actions"><button type="button" className="btn btn--outline btn--sm" onClick={() => { setForm({ title: popup.title, message: popup.message, imageUrl: popup.image_url ?? '', ctaLabel: popup.cta_label ?? '', ctaHref: popup.cta_href ?? '', variant: popup.variant, delaySeconds: popup.delay_seconds, frequency: popup.frequency, isActive: Boolean(popup.is_active), startsAt: popup.starts_at?.slice(0, 10) ?? '', endsAt: popup.ends_at?.slice(0, 10) ?? '', sortOrder: popup.sort_order }); setEditing(popup); }}>Editar</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void remove(popup)}>Eliminar</button></div></td></tr>) : <tr><td colSpan={5}><Empty>Sem popups configurados.</Empty></td></tr>}</tbody></table></div>
    <Modal open={creating || Boolean(editing)} title={editing ? 'Editar popup' : 'Novo popup'} onClose={() => { setCreating(false); setEditing(null); }}>
      <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <Field label="Título *"><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
        <Field label="Mensagem *"><textarea required rows={3} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></Field>
        <div className="form-row"><Field label="Imagem (URL)"><input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></Field><Field label="Variante"><select value={form.variant} onChange={(event) => setForm({ ...form, variant: event.target.value })}><option value="promo">Promoção</option><option value="info">Informação</option><option value="newsletter">Newsletter</option></select></Field></div>
        <div className="form-row"><Field label="Texto do botão"><input value={form.ctaLabel} onChange={(event) => setForm({ ...form, ctaLabel: event.target.value })} /></Field><Field label="Link do botão"><input value={form.ctaHref} onChange={(event) => setForm({ ...form, ctaHref: event.target.value })} /></Field></div>
        <div className="form-row"><Field label="Atraso (segundos)"><input type="number" min="0" value={form.delaySeconds} onChange={(event) => setForm({ ...form, delaySeconds: Number(event.target.value) })} /></Field><Field label="Frequência"><select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}><option value="session">Uma vez por sessão</option><option value="always">Sempre</option><option value="day">Uma vez por dia</option></select></Field></div>
        <label className="admin-check"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Ativo</label>
        <div className="admin-form__actions"><button type="submit" className="btn btn--primary">Guardar popup</button><button type="button" className="btn btn--outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</button></div>
      </form>
    </Modal>
  </AdminSection>;
}

function AdminBlog() {
  const { data, loading, reload } = useJson<{ posts: Post[] }>('/api/admin/content/posts');
  const [editing, setEditing] = useState<Post | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const empty = { title: '', slug: '', category: 'Notícias', excerpt: '', content: '', image: '/assets/blog/post-1.jpg', status: 'draft' };
  const [form, setForm] = useState(empty);
  const save = async () => {
    const blocks = form.content.split(/\n{2,}/).map((paragraph) => ({ type: 'p', text: paragraph.trim() })).filter((block) => block.text);
    const result = editing ? await api(`/api/admin/content/posts/${encodeURIComponent(editing.slug)}`, { method: 'PUT', body: JSON.stringify({ title: form.title, category: form.category, excerpt: form.excerpt, image: form.image, status: form.status, blocks }) }) : await api('/api/admin/content/posts', { method: 'POST', body: JSON.stringify({ ...form, blocks }) });
    setMessage(result.ok ? 'Artigo guardado.' : result.error ?? 'Falha ao guardar artigo.'); if (result.ok) { setEditing(null); setCreating(false); await reload(); }
  };
  const approve = async (post: Post) => { const result = await api(`/api/admin/content/posts/${encodeURIComponent(post.slug)}`, { method: 'PUT', body: JSON.stringify({ status: 'published' }) }); setMessage(result.ok ? 'Artigo publicado.' : result.error ?? 'Falha ao publicar.'); if (result.ok) await reload(); };
  const archive = async (post: Post) => { if (!window.confirm(`Arquivar "${post.title}"?`)) return; const result = await api(`/api/admin/content/posts/${encodeURIComponent(post.slug)}`, { method: 'DELETE' }); setMessage(result.ok ? 'Artigo arquivado.' : result.error ?? 'Falha ao arquivar.'); if (result.ok) await reload(); };
  return <AdminSection title="Blog" subtitle="Artigos publicados, rascunhos e submissões de clientes." actions={<button type="button" className="btn btn--primary btn--sm" onClick={() => { setForm(empty); setCreating(true); }}>Novo artigo</button>}>
    <Notice message={message} tone={message.includes('Falha') ? 'error' : 'success'} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Artigo</th><th>Categoria</th><th>Autor</th><th>Views</th><th>Estado</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={6}><Empty>A carregar…</Empty></td></tr> : data?.posts.map((post) => <tr key={post.slug}><td><strong>{post.title}</strong><small>{post.published_date?.slice(0, 10)} · {post.excerpt?.slice(0, 70)}</small></td><td>{post.category}</td><td>{post.author}</td><td>{post.views}</td><td><Badge tone={post.status === 'published' ? 'success' : post.status === 'pending' ? 'warning' : 'muted'}>{post.status}</Badge></td><td><div className="admin-row-actions"><a className="btn btn--outline btn--sm" href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">Ver</a><button type="button" className="btn btn--outline btn--sm" onClick={() => { setForm({ title: post.title, slug: post.slug, category: post.category, excerpt: post.excerpt ?? '', content: (post.blocks ?? []).map((block) => block.text ?? '').join('\n\n'), image: post.image_url, status: post.status }); setEditing(post); }}>Editar</button>{post.status === 'pending' && <button type="button" className="btn btn--primary btn--sm" onClick={() => void approve(post)}>Aprovar</button>}<button type="button" className="btn btn--outline btn--sm" onClick={() => void archive(post)}>Arquivar</button></div></td></tr>)}</tbody></table></div>
    <Modal open={creating || Boolean(editing)} title={editing ? 'Editar artigo' : 'Novo artigo'} onClose={() => { setCreating(false); setEditing(null); }} wide>
      <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <Field label="Título *"><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
        {!editing && <Field label="Slug *"><input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></Field>}
        <div className="form-row"><Field label="Categoria"><input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Field><Field label="Imagem"><input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /></Field></div>
        <Field label="Resumo"><textarea rows={2} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></Field>
        <Field label="Conteúdo" hint="Separe parágrafos com uma linha vazia."><textarea rows={10} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></Field>
        <Field label="Estado"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">Rascunho</option><option value="published">Publicado</option><option value="pending">Pendente</option><option value="archived">Arquivado</option></select></Field>
        <div className="admin-form__actions"><button type="submit" className="btn btn--primary">Guardar artigo</button><button type="button" className="btn btn--outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</button></div>
      </form>
    </Modal>
  </AdminSection>;
}

function AdminBlogCategories() {
  const { data } = useJson<{ posts: Post[] }>('/api/admin/content/posts');
  const categories = useMemo(() => { const map = new Map<string, number>(); for (const post of data?.posts ?? []) map.set(post.category, (map.get(post.category) ?? 0) + 1); return [...map.entries()].sort((a, b) => b[1] - a[1]); }, [data]);
  return <AdminSection title="Categorias do blog" subtitle="Distribuição de artigos por categoria editorial."><div className="admin-platform-grid">{categories.map(([name, count]) => <article key={name}><strong>{name}</strong><span>{count} artigos</span></article>)}</div></AdminSection>;
}

function AdminComments() {
  const [status, setStatus] = useState('pending');
  const { data, loading, reload } = useJson<{ comments: Comment[] }>(`/api/admin/comments?status=${status}`, [status]);
  const [message, setMessage] = useState('');
  const update = async (comment: Comment, next: string) => { const result = await api(`/api/admin/comments/${comment.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) }); setMessage(result.ok ? `Comentário ${next === 'approved' ? 'aprovado' : 'rejeitado'}.` : result.error ?? 'Falha ao atualizar.'); if (result.ok) await reload(); };
  const remove = async (comment: Comment) => { if (!window.confirm('Eliminar este comentário?')) return; const result = await api(`/api/admin/comments/${comment.id}`, { method: 'DELETE' }); setMessage(result.ok ? 'Comentário eliminado.' : result.error ?? 'Falha ao eliminar.'); if (result.ok) await reload(); };
  return <AdminSection title="Comentários" subtitle="Moderação dos comentários do blog. Nenhum comentário é publicado sem aprovação." actions={<select className="admin-inline-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Pendentes</option><option value="approved">Aprovados</option><option value="rejected">Rejeitados</option><option value="all">Todos</option></select>}>
    <Notice message={message} tone={message.includes('Falha') ? 'error' : 'success'} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Autor</th><th>Comentário</th><th>Artigo</th><th>Data</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={5}><Empty>A carregar…</Empty></td></tr> : data?.comments.length ? data.comments.map((comment) => <tr key={comment.id}><td>{comment.author_name}<small>{comment.author_email}</small></td><td>{comment.content}</td><td>{comment.post_title ?? comment.post_slug}</td><td>{formatDate(comment.created_at)}</td><td><div className="admin-row-actions">{comment.status !== 'approved' && <button type="button" className="btn btn--primary btn--sm" onClick={() => void update(comment, 'approved')}>Aprovar</button>}{comment.status !== 'rejected' && <button type="button" className="btn btn--outline btn--sm" onClick={() => void update(comment, 'rejected')}>Rejeitar</button>}<button type="button" className="btn btn--outline btn--sm" onClick={() => void remove(comment)}>Eliminar</button></div></td></tr>) : <tr><td colSpan={5}><Empty>Sem comentários nesta vista.</Empty></td></tr>}</tbody></table></div>
  </AdminSection>;
}

function AdminMessages() {
  const { data, loading, reload } = useJson<{ messages: Message[] }>('/api/admin/contact-messages');
  const [message, setMessage] = useState('');
  const update = async (entry: Message, next: string) => { const result = await api(`/api/admin/contact-messages/${entry.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) }); setMessage(result.ok ? 'Mensagem atualizada.' : result.error ?? 'Falha ao atualizar.'); if (result.ok) await reload(); };
  return <AdminSection title="Mensagens de contacto" subtitle="Mensagens recebidas pelo formulário do website.">
    <Notice message={message} tone={message.includes('Falha') ? 'error' : 'success'} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Contacto</th><th>Assunto / mensagem</th><th>Data</th><th>Estado</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={5}><Empty>A carregar…</Empty></td></tr> : data?.messages.length ? data.messages.map((entry) => <tr key={entry.id}><td><strong>{entry.name}</strong><small>{entry.email} · {entry.phone}</small></td><td><strong>{entry.subject}</strong><small>{entry.message}</small></td><td>{formatDate(entry.created_at)}</td><td><Badge tone={entry.status === 'new' ? 'warning' : 'muted'}>{entry.status}</Badge></td><td><div className="admin-row-actions"><button type="button" className="btn btn--outline btn--sm" onClick={() => void update(entry, 'read')}>Marcar lida</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void update(entry, 'replied')}>Respondida</button><a className="btn btn--outline btn--sm" href={`mailto:${entry.email}?subject=Resposta GameAO: ${encodeURIComponent(entry.subject ?? '')}`}>Responder</a></div></td></tr>) : <tr><td colSpan={5}><Empty>Sem mensagens recebidas.</Empty></td></tr>}</tbody></table></div>
  </AdminSection>;
}

function AdminPages() {
  const settings = useSettings();
  const [draft, setDraft] = useState<Array<{ slug: string; title: string; content: string }> | null>(null);
  const [message, setMessage] = useState('');
  const pages = draft ?? (Array.isArray(settings.data?.settings?.pages) ? settings.data.settings.pages as Array<{ slug: string; title: string; content: string }> : [{ slug: 'sobre', title: 'Sobre a GameAO', content: '' }, { slug: 'termos', title: 'Termos e condições', content: '' }, { slug: 'privacidade', title: 'Política de privacidade', content: '' }]);
  const save = async () => { const result = await api('/api/admin/site-settings/pages', { method: 'PUT', body: JSON.stringify({ value: pages }) }); setMessage(result.ok ? 'Páginas guardadas.' : result.error ?? 'Falha ao guardar.'); if (result.ok) await settings.reload(); };
  return <AdminSection title="Páginas institucionais" subtitle="Conteúdo editável das páginas de informação da loja.">
    <Notice message={message} tone={message.includes('Falha') ? 'error' : 'success'} />
    <div className="admin-form">{pages.map((page, index) => <fieldset key={index} className="admin-fieldset"><legend>{page.title || `Página ${index + 1}`}</legend><div className="form-row"><Field label="Slug"><input value={page.slug} onChange={(event) => { const next = [...pages]; next[index] = { ...page, slug: event.target.value }; setDraft(next); }} /></Field><Field label="Título"><input value={page.title} onChange={(event) => { const next = [...pages]; next[index] = { ...page, title: event.target.value }; setDraft(next); }} /></Field></div><Field label="Conteúdo"><textarea rows={5} value={page.content} onChange={(event) => { const next = [...pages]; next[index] = { ...page, content: event.target.value }; setDraft(next); }} /></Field></fieldset>)}<button type="button" className="btn btn--primary" onClick={() => void save()}>Guardar páginas</button></div>
  </AdminSection>;
}

function AdminFaq() {
  const settings = useSettings();
  const [draft, setDraft] = useState<Array<{ question: string; answer: string }> | null>(null);
  const [message, setMessage] = useState('');
  const faq = draft ?? (Array.isArray(settings.data?.settings?.faq) ? settings.data.settings.faq as Array<{ question: string; answer: string }> : [{ question: 'Como recebo o meu jogo digital?', answer: '' }, { question: 'Que métodos de pagamento aceitam?', answer: '' }]);
  const save = async () => { const result = await api('/api/admin/site-settings/faq', { method: 'PUT', body: JSON.stringify({ value: faq }) }); setMessage(result.ok ? 'FAQ guardada.' : result.error ?? 'Falha ao guardar.'); if (result.ok) await settings.reload(); };
  return <AdminSection title="Perguntas frequentes" subtitle="Perguntas apresentadas na página de apoio ao cliente." actions={<button type="button" className="btn btn--outline btn--sm" onClick={() => setDraft([...faq, { question: '', answer: '' }])}>Adicionar pergunta</button>}>
    <Notice message={message} tone={message.includes('Falha') ? 'error' : 'success'} />
    <div className="admin-form">{faq.map((item, index) => <fieldset key={index} className="admin-fieldset"><legend>Pergunta {index + 1}</legend><Field label="Pergunta"><input value={item.question} onChange={(event) => { const next = [...faq]; next[index] = { ...item, question: event.target.value }; setDraft(next); }} /></Field><Field label="Resposta"><textarea rows={3} value={item.answer} onChange={(event) => { const next = [...faq]; next[index] = { ...item, answer: event.target.value }; setDraft(next); }} /></Field></fieldset>)}<button type="button" className="btn btn--primary" onClick={() => void save()}>Guardar FAQ</button></div>
  </AdminSection>;
}
