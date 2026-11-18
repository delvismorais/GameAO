import { useMemo, useState } from 'react';
import { ProductCatalogManager } from './ProductCatalogManager';
import { AdminSection, Badge, Empty, Field, Modal, Notice, api, formatKz, useJson } from './ui';
import { useSettings } from '../../context/SettingsContext';
import type { AdminSectionId } from './adminNav';

type Product = { id: string; name: string; slug: string; basePriceUsd: number; salePriceUsd?: number | null | undefined; isActive: boolean; image: string; imageCard?: string; categoryType?: 'digital' | 'physical'; productSubtype?: string; requiresPlayerId?: boolean; shippingCostAoa?: number; platform?: string; shortDescription?: string; isDynamic?: boolean; stockQuantity?: number | null; lowStockThreshold?: number; hot?: boolean; featuredOrder?: number; dealOrder?: number };
type Category = { id: number; slug: string; name: string; description?: string; image_url?: string; is_active: number; show_on_home?: number; sort_order: number; product_count: number };

export function AdminProductsSection({ section }: { section: AdminSectionId }) {
  const { rate } = useSettings();
  const products = useJson<{ products: Product[] }>('/api/admin/products');
  const [message, setMessage] = useState('');
  if (section === 'categories') return <AdminCategories />;
  if (section === 'platforms') return <AdminPlatforms products={products.data?.products ?? []} />;
  if (section === 'stock') return <AdminStock products={products.data?.products ?? []} reload={products.reload} />;
  if (section === 'featured') return <AdminProductFlags products={products.data?.products ?? []} reload={products.reload} mode="featured" />;
  if (section === 'promos') return <AdminProductFlags products={products.data?.products ?? []} reload={products.reload} mode="promos" />;
    return <div>
    {message && <Notice message={message} tone={message.includes('Não') ? 'error' : 'success'} />}
    {products.loading ? <p className="admin-state">A carregar catálogo…</p> : products.error ? <Notice tone="error" message={products.error} /> : <ProductCatalogManager openCreate={section === 'product-new'} products={(products.data?.products ?? []) as unknown as Parameters<typeof ProductCatalogManager>[0]['products']} rate={rate} onRefresh={products.reload} onMessage={setMessage} />}
  </div>;
}

function AdminCategories() {
  const { data, loading, reload } = useJson<{ categories: Category[] }>('/api/admin/categories');
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error'>('success');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', image: '', sortOrder: 0, isActive: true, showOnHome: true });
  const openCreate = () => { setForm({ name: '', slug: '', description: '', image: '', sortOrder: 0, isActive: true, showOnHome: true }); setCreating(true); };
  const openEdit = (category: Category) => { setForm({ name: category.name, slug: category.slug, description: category.description ?? '', image: category.image_url ?? '', sortOrder: category.sort_order, isActive: Boolean(category.is_active), showOnHome: category.show_on_home !== 0 }); setEditing(category); };
  const save = async () => {
    const result = editing ? await api(`/api/admin/categories/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) }) : await api('/api/admin/categories', { method: 'POST', body: JSON.stringify(form) });
    setMessage(result.ok ? 'Categoria guardada.' : result.error ?? 'Não foi possível guardar.'); setTone(result.ok ? 'success' : 'error');
    if (result.ok) { setEditing(null); setCreating(false); await reload(); }
  };
  const uploadImage = async (file: File) => { setUploading(true); const body = new FormData(); body.append('file', file); body.append('kind', 'site'); const result = await api<{ url?: string }>('/api/admin/media', { method: 'POST', body }); setUploading(false); if (result.ok && result.data.url) setForm((current) => ({ ...current, image: result.data.url! })); else { setMessage(result.error ?? 'Não foi possível enviar a imagem.'); setTone('error'); } };
  const deactivate = async (category: Category) => {
    if (!window.confirm(`Desativar a categoria ${category.name}?`)) return;
    const result = await api(`/api/admin/categories/${category.id}`, { method: 'DELETE' });
    setMessage(result.ok ? 'Categoria desativada.' : result.error ?? 'Falha ao desativar.'); setTone(result.ok ? 'success' : 'error');
    if (result.ok) await reload();
  };
  return <AdminSection title="Categorias" subtitle="Categorias usadas na navegação pública e nos filtros da loja." actions={<button type="button" className="btn btn--primary btn--sm" onClick={openCreate}>Nova categoria</button>}>
    <Notice message={message} tone={tone} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nome</th><th>Slug</th><th>Produtos</th><th>Homepage</th><th>Estado</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={6}><Empty>A carregar…</Empty></td></tr> : data?.categories.map((category) => <tr key={category.id}><td><strong>{category.name}</strong><small>{category.description}</small></td><td>{category.slug}</td><td>{category.product_count}</td><td><Badge tone={category.show_on_home === 0 ? 'muted' : 'info'}>{category.show_on_home === 0 ? 'Oculta' : 'Visível'}</Badge></td><td><Badge tone={category.is_active ? 'success' : 'muted'}>{category.is_active ? 'Ativa' : 'Inativa'}</Badge></td><td><div className="admin-row-actions"><button type="button" className="btn btn--outline btn--sm" onClick={() => openEdit(category)}>Editar</button>{category.is_active ? <button type="button" className="btn btn--outline btn--sm" onClick={() => void deactivate(category)}>Desativar</button> : null}</div></td></tr>)}</tbody></table></div>
    <Modal open={creating || Boolean(editing)} title={editing ? `Editar ${editing.name}` : 'Nova categoria'} onClose={() => { setCreating(false); setEditing(null); }}>
      <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <Field label="Nome *"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Slug" hint="Deixe vazio para gerar automaticamente."><input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></Field>
        <Field label="Descrição"><textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
        <div className="form-row"><Field label="Imagem (URL)"><input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} /><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.target.value = ''; }} /></Field><Field label="Ordem"><input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} /></Field></div>
        <label className="admin-check"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Ativa</label><label className="admin-check"><input type="checkbox" checked={form.showOnHome} onChange={(event) => setForm({ ...form, showOnHome: event.target.checked })} /> Exibir na homepage</label>
        <div className="admin-form__actions"><button type="submit" className="btn btn--primary">Guardar</button><button type="button" className="btn btn--outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</button></div>
      </form>
    </Modal>
  </AdminSection>;
}

function AdminPlatforms({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');
  const platforms = useMemo(() => {
    const map = new Map<string, { name: string; count: number; active: number }>();
    for (const product of products) {
      for (const platform of String(product.platform ?? '').split(',').map((item) => item.trim()).filter(Boolean)) {
        const entry = map.get(platform) ?? { name: platform, count: 0, active: 0 };
        entry.count += 1; if (product.isActive) entry.active += 1; map.set(platform, entry);
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [products]);
  const filtered = platforms.filter((platform) => platform.name.toLowerCase().includes(search.toLowerCase()));
  const matching = products.filter((product) => search && String(product.platform ?? '').toLowerCase().includes(search.toLowerCase()));
  return <AdminSection title="Plataformas" subtitle="Plataformas declaradas nos produtos do catálogo.">
    <div className="admin-filterbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar plataforma…" /></div>
    <div className="admin-platform-grid">{filtered.map((platform) => <article key={platform.name}><strong>{platform.name}</strong><span>{platform.count} produtos · {platform.active} ativos</span></article>)}</div>
    {search && <><h3 className="admin-subheading">Produtos em {search}</h3><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Produto</th><th>Preço</th><th>Estado</th></tr></thead><tbody>{matching.map((product) => <tr key={product.id}><td>{product.name}</td><td>{formatKz(product.salePriceUsd ?? product.basePriceUsd)}</td><td><Badge tone={product.isActive ? 'success' : 'muted'}>{product.isActive ? 'Ativo' : 'Inativo'}</Badge></td></tr>)}</tbody></table></div></>}
  </AdminSection>;
}

function AdminStock({ products, reload }: { products: Product[]; reload: () => Promise<void> }) {
  const [draft, setDraft] = useState<Record<string, { stock: string; threshold: string }>>({});
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error'>('success');
  const rows = products.filter((product) => product.categoryType !== 'physical' && product.stockQuantity !== null && product.stockQuantity !== undefined);
  const save = async (product: Product) => {
    const entry = draft[product.id] ?? { stock: product.stockQuantity == null ? '' : String(product.stockQuantity), threshold: String(product.lowStockThreshold ?? 5) };
    const result = await api(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: 'PUT', body: JSON.stringify({ stockQuantity: entry.stock === '' ? null : Number(entry.stock), lowStockThreshold: Number(entry.threshold) }) });
    setMessage(result.ok ? `Stock de ${product.name} atualizado.` : result.error ?? 'Falha ao guardar stock.'); setTone(result.ok ? 'success' : 'error');
    if (result.ok) await reload();
  };
  return <AdminSection title="Stock" subtitle="Stock por produto e alerta automático de stock baixo. Produtos sem stock definido não são controlados." actions={<button type="button" className="btn btn--outline btn--sm" onClick={() => void reload()}>Atualizar</button>}>
    <Notice message={message} tone={tone} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Produto</th><th>Stock atual</th><th>Alerta mínimo</th><th>Estado</th><th /></tr></thead><tbody>{rows.length ? rows.map((product) => { const entry = draft[product.id] ?? { stock: product.stockQuantity == null ? '' : String(product.stockQuantity), threshold: String(product.lowStockThreshold ?? 5) }; return <tr key={product.id}><td>{product.name}<small>{product.platform}</small></td><td><input className="admin-inline-input" type="number" min="0" placeholder="∞" value={entry.stock} onChange={(event) => setDraft({ ...draft, [product.id]: { ...entry, stock: event.target.value } })} /></td><td><input className="admin-inline-input" type="number" min="0" value={entry.threshold} onChange={(event) => setDraft({ ...draft, [product.id]: { ...entry, threshold: event.target.value } })} /></td><td>{product.stockQuantity == null ? <Badge tone="muted">Não controlado</Badge> : Number(product.stockQuantity) <= Number(product.lowStockThreshold ?? 5) ? <Badge tone="danger">Stock baixo ({product.stockQuantity})</Badge> : <Badge tone="success">{product.stockQuantity} disponíveis</Badge>}</td><td><button type="button" className="btn btn--outline btn--sm" onClick={() => void save(product)}>Guardar</button></td></tr>; }) : <tr><td colSpan={5}><Empty>Sem produtos para controlo de stock.</Empty></td></tr>}</tbody></table></div>
  </AdminSection>;
}

function AdminProductFlags({ products, reload, mode }: { products: Product[]; reload: () => Promise<void>; mode: 'featured' | 'promos' }) {
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error'>('success');
  const [draft, setDraft] = useState<Record<string, string>>({});
  const list = products.filter((product) => mode === 'featured' ? Boolean(product.hot) || product.featuredOrder != null : product.salePriceUsd != null);
  const toggleHot = async (product: Product) => {
    const result = await api(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: 'PUT', body: JSON.stringify({ hot: !product.hot }) });
    setMessage(result.ok ? 'Destaque atualizado.' : result.error ?? 'Falha ao atualizar.'); setTone(result.ok ? 'success' : 'error'); if (result.ok) await reload();
  };
  const savePrice = async (product: Product) => {
    const value = draft[product.id];
    const result = await api(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: 'PUT', body: JSON.stringify({ salePriceUsd: value === '' || value == null ? null : Number(value) }) });
    setMessage(result.ok ? 'Preço promocional atualizado.' : result.error ?? 'Falha ao atualizar.'); setTone(result.ok ? 'success' : 'error'); if (result.ok) await reload();
  };
  return <AdminSection title={mode === 'featured' ? 'Produtos em destaque' : 'Produtos promocionais'} subtitle={mode === 'featured' ? 'Produtos marcados como destaque na homepage e na loja.' : 'Produtos com preço promocional ativo.'}>
    <Notice message={message} tone={tone} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Produto</th><th>Preço base</th>{mode === 'promos' && <th>Preço promo (USD)</th>}<th>Estado</th><th /></tr></thead><tbody>{list.length ? list.map((product) => <tr key={product.id}><td>{product.name}<small>{product.platform}</small></td><td>{formatKz(product.basePriceUsd)}</td>{mode === 'promos' && <td><input className="admin-inline-input" type="number" step="0.01" value={draft[product.id] ?? (product.salePriceUsd == null ? '' : String(product.salePriceUsd))} onChange={(event) => setDraft({ ...draft, [product.id]: event.target.value })} /></td>}<td>{product.hot ? <Badge tone="success">Destaque</Badge> : <Badge tone="muted">Normal</Badge>}</td><td>{mode === 'featured' ? <button type="button" className="btn btn--outline btn--sm" onClick={() => void toggleHot(product)}>{product.hot ? 'Remover destaque' : 'Destacar'}</button> : <button type="button" className="btn btn--outline btn--sm" onClick={() => void savePrice(product)}>Guardar preço</button>}</td></tr>) : <tr><td colSpan={5}><Empty>Sem produtos nesta vista. Marque produtos como destaque ou defina um preço promocional no catálogo.</Empty></td></tr>}</tbody></table></div>
  </AdminSection>;
}
