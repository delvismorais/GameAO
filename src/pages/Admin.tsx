import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { useSettings } from '../context/SettingsContext';
import { formatUsdAsAoa } from '../lib/pricing';

type Overview = {
  orders: { total: number; pending: number; paid: number };
  customers: { total: number };
  products: { total: number; active: number };
  posts: { total: number; published: number };
};

type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  basePriceUsd: number;
  salePriceUsd?: number;
  isActive: boolean;
  image: string;
};

const EMPTY_FORM = {
  name: '',
  slug: '',
  basePriceUsd: '',
  salePriceUsd: '',
  image: '/assets/products/game-1.jpg',
  imageCard: '/assets/products/game-1-card.jpg',
  shortDescription: '',
  platform: '',
};

export function Admin() {
  const { rate, config, updateConfig } = useSettings();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [message, setMessage] = useState('');
  const [rateDraft, setRateDraft] = useState(String(rate));
  const [rateSource, setRateSource] = useState(config.source);

  const load = useCallback(async () => {
    setLoading(true);
    const [overviewResponse, productsResponse] = await Promise.all([
      fetch('/api/admin/overview', { credentials: 'include' }),
      fetch('/api/admin/products', { credentials: 'include' }),
    ]);
    if (overviewResponse.status === 403 || productsResponse.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    if (overviewResponse.ok && productsResponse.ok) {
      const overviewData = await overviewResponse.json() as Overview;
      const productsData = await productsResponse.json() as { products: AdminProduct[] };
      setOverview(overviewData);
      setProducts(productsData.products);
      setForbidden(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setRateDraft(String(rate)); setRateSource(config.source); }, [rate, config.source]);

  const updateForm = (key: keyof typeof EMPTY_FORM, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const createProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...form,
        basePriceUsd: Number(form.basePriceUsd),
        salePriceUsd: form.salePriceUsd ? Number(form.salePriceUsd) : null,
        tags: [],
        description: form.shortDescription ? [form.shortDescription] : [],
        releaseYear: new Date().getFullYear(),
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null) as { message?: string } | null;
      setMessage(data?.message ?? 'Não foi possível criar o produto.');
      return;
    }
    setForm(EMPTY_FORM);
    setMessage('Produto criado e guardado na base de dados.');
    await load();
  };

  const toggleProduct = async (product: AdminProduct) => {
    const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !product.isActive }),
    });
    if (response.ok) await load();
  };

  const saveRate = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/admin/settings/exchange-rate', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ usdToAoa: Number(rateDraft), source: rateSource, note: 'Taxa configurável pelo painel administrativo.' }),
    });
    if (response.ok) {
      const saved = await response.json() as { usdToAoa: number; source: string; updatedAt: string; note: string };
      updateConfig(saved);
      setMessage('Taxa atualizada. Os preços serão recalculados em toda a loja.');
    } else setMessage('Não foi possível atualizar a taxa.');
  };

  if (forbidden) {
    return (
      <PageShell crumbs={[{ label: 'Administração' }]}>
        <div className="admin-empty">
          <h1 className="page-title">Administração</h1>
          <p>Esta área requer uma conta administrativa autorizada.</p>
          <Link to="/my-account" className="btn btn--primary">Iniciar sessão</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell crumbs={[{ label: 'Administração' }]}>
      <div className="admin-head">
        <div>
          <p className="page-kicker">GameAO · operação</p>
          <h1 className="page-title">Painel administrativo</h1>
          <p className="page-subtitle">Dados reais da base de dados. As alterações de produtos refletem-se no catálogo ligado ao backend.</p>
        </div>
        <Link to="/my-account" className="btn btn--outline btn--sm">Minha conta</Link>
      </div>

      {loading ? <p className="admin-state">A carregar dados do servidor…</p> : (
        <>
          <section className="admin-metrics" aria-label="Resumo operacional">
            <article><span>Encomendas</span><strong>{overview?.orders.total ?? 0}</strong><small>{overview?.orders.pending ?? 0} pendentes</small></article>
            <article><span>Pagas</span><strong>{overview?.orders.paid ?? 0}</strong><small>confirmadas</small></article>
            <article><span>Clientes</span><strong>{overview?.customers.total ?? 0}</strong><small>registados</small></article>
            <article><span>Produtos</span><strong>{overview?.products.active ?? 0}</strong><small>de {overview?.products.total ?? 0} ativos</small></article>
            <article><span>Artigos</span><strong>{overview?.posts.published ?? 0}</strong><small>publicados</small></article>
          </section>

          <div className="admin-grid">
            <section className="admin-card">
              <div className="admin-card__head"><h2>Taxa de câmbio</h2><span>Aplicada globalmente</span></div>
              <form className="admin-form" onSubmit={saveRate}>
                <label className="field"><span>1 USD em Kz *</span><input required type="number" min="0.01" step="0.01" value={rateDraft} onChange={(event) => setRateDraft(event.target.value)} /></label>
                <label className="field"><span>Fonte / referência</span><input value={rateSource} onChange={(event) => setRateSource(event.target.value)} /></label>
                <p className="admin-message">Atual: {formatUsdAsAoa(1, rate)} por USD.</p>
                <button type="submit" className="btn btn--primary">Guardar taxa</button>
              </form>
            </section>
            <section className="admin-card">
              <div className="admin-card__head"><h2>Novo produto</h2><span>Preço-base em USD</span></div>
              <form className="admin-form" onSubmit={createProduct}>
                <label className="field"><span>Nome *</span><input required value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></label>
                <label className="field"><span>Slug *</span><input required value={form.slug} onChange={(event) => updateForm('slug', event.target.value)} placeholder="nome-do-produto" /></label>
                <div className="form-row">
                  <label className="field"><span>Preço USD *</span><input required type="number" min="0" step="0.01" value={form.basePriceUsd} onChange={(event) => updateForm('basePriceUsd', event.target.value)} /></label>
                  <label className="field"><span>Promoção USD</span><input type="number" min="0" step="0.01" value={form.salePriceUsd} onChange={(event) => updateForm('salePriceUsd', event.target.value)} /></label>
                </div>
                <label className="field"><span>Plataforma</span><input value={form.platform} onChange={(event) => updateForm('platform', event.target.value)} placeholder="PC, Xbox, PlayStation" /></label>
                <label className="field"><span>Descrição curta</span><textarea rows={3} value={form.shortDescription} onChange={(event) => updateForm('shortDescription', event.target.value)} /></label>
                <button type="submit" className="btn btn--primary">Criar produto</button>
                {message && <p className="admin-message">{message}</p>}
              </form>
            </section>

            <section className="admin-card admin-card--wide">
              <div className="admin-card__head"><h2>Produtos</h2><span>{products.length} registos</span></div>
              <div className="admin-products-table">
                {products.map((product) => (
                  <article key={product.id} className={!product.isActive ? 'is-inactive' : ''}>
                    <img src={product.image} alt="" />
                    <div><strong>{product.name}</strong><small>{product.slug} · {product.isActive ? 'Ativo' : 'Inativo'}</small></div>
                    <span>{formatUsdAsAoa(product.salePriceUsd ?? product.basePriceUsd, rate)}</span>
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => void toggleProduct(product)}>{product.isActive ? 'Desativar' : 'Ativar'}</button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </PageShell>
  );
}
