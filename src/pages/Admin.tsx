import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { Icon } from '../components/ui/Icon';
import { useSettings } from '../context/SettingsContext';
import { formatUsdAsAoa } from '../lib/pricing';

type Overview = {
  orders: { total: number; revenue: number; revenueToday: number; revenueMonth: number; pending: number; paymentPending: number; paid: number; processing: number; completed: number };
  customers: { total: number };
  products: { total: number; active: number };
  posts: { total: number; published: number };
};
type AdminProduct = { id: string; name: string; slug: string; basePriceUsd: number; salePriceUsd?: number; isActive: boolean; image: string };
type AdminOrder = { order_number: string; customer_name: string; customer_email: string; total_aoa: number; status: string; payment_status: string; created_at: string; item_count: number };
type PaymentMethod = { id: number; code: string; name: string; description: string; instructions: string; is_active: number; requires_proof: number; payment_deadline_hours: number; customer_message: string; receiving_data_json?: unknown };
type PaymentProof = { id: number; order_number: string; customer_name: string; customer_email: string; total_aoa: number; payment_method_name?: string; original_name: string; mime_type: string; size_bytes: number; status: string; admin_note?: string; submitted_at: string; payment_status: string };
type AdminTab = 'dashboard' | 'orders' | 'products' | 'payments' | 'proofs' | 'settings';

const ORDER_STATUS_OPTIONS = [
  ['awaiting_payment', 'A aguardar pagamento'], ['payment_verification', 'Comprovativo em verificação'], ['payment_confirmed', 'Pagamento confirmado'], ['processing', 'Em processamento'],
  ['ready_for_delivery', 'Pronta para entrega'], ['completed', 'Concluída'], ['cancelled', 'Cancelada'], ['refunded', 'Reembolsada'],
] as const;
const EMPTY_FORM = { name: '', slug: '', basePriceUsd: '', salePriceUsd: '', image: '/assets/products/game-1.jpg', imageCard: '/assets/products/game-1-card.jpg', shortDescription: '', platform: '', categoryType: 'digital', productSubtype: 'digital_game', requiresPlayerId: false, shippingCostAoa: '', isDynamic: false };
const money = new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2 });

export function Admin() {
  const { rate, config, updateConfig } = useSettings();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [message, setMessage] = useState('');
  const [rateDraft, setRateDraft] = useState(String(rate));
  const [rateSource, setRateSource] = useState(config.source);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const load = useCallback(async () => {
    setLoading(true);
    const [overviewResponse, productsResponse, ordersResponse, paymentMethodsResponse, proofsResponse] = await Promise.all([
      fetch('/api/admin/overview', { credentials: 'include' }), fetch('/api/admin/products', { credentials: 'include' }), fetch('/api/admin/orders', { credentials: 'include' }), fetch('/api/admin/payment-methods', { credentials: 'include' }), fetch('/api/admin/payment-proofs', { credentials: 'include' }),
    ]);
    if ([overviewResponse, productsResponse, ordersResponse].some((response) => response.status === 403)) { setForbidden(true); setLoading(false); return; }
    if (overviewResponse.ok && productsResponse.ok && ordersResponse.ok) {
      setOverview(await overviewResponse.json() as Overview);
      setProducts((await productsResponse.json() as { products: AdminProduct[] }).products);
      setOrders((await ordersResponse.json() as { orders: AdminOrder[] }).orders);
      if (paymentMethodsResponse.ok) setPaymentMethods((await paymentMethodsResponse.json() as { methods: PaymentMethod[] }).methods);
      if (proofsResponse.ok) setProofs((await proofsResponse.json() as { proofs: PaymentProof[] }).proofs);
      setForbidden(false);
    }
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setRateDraft(String(rate)); setRateSource(config.source); }, [rate, config.source]);

  const updateForm = (key: keyof typeof EMPTY_FORM, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const createProduct = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage('');
    const response = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...form, basePriceUsd: Number(form.basePriceUsd), salePriceUsd: form.salePriceUsd ? Number(form.salePriceUsd) : null, shippingCostAoa: Number(form.shippingCostAoa || 0), tags: [], description: form.shortDescription ? [form.shortDescription] : [], releaseYear: new Date().getFullYear() }) });
    if (!response.ok) { const data = await response.json().catch(() => null) as { message?: string } | null; setMessage(data?.message ?? 'Não foi possível criar o produto.'); return; }
    setForm(EMPTY_FORM); setMessage('Produto criado e guardado na base de dados.'); await load();
  };
  const toggleProduct = async (product: AdminProduct) => {
    const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ isActive: !product.isActive }) });
    if (response.ok) await load();
  };
  const updatePaymentMethod = async (method: PaymentMethod, patch: Partial<PaymentMethod>) => {
    const response = await fetch(`/api/admin/payment-methods/${method.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(patch) });
    if (response.ok) { setPaymentMethods((current) => current.map((item) => item.id === method.id ? { ...item, ...patch } : item)); setMessage(`${method.name} atualizado.`); } else setMessage('Não foi possível atualizar o método de pagamento.');
  };
  const updateOrderStatus = async (order: AdminOrder, status: string) => {
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.order_number)}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ status }) });
    if (response.ok) {
      const data = await response.json() as { notifications?: { email: string; whatsapp: string } };
      setOrders((current) => current.map((item) => item.order_number === order.order_number ? { ...item, status } : item));
      const email = data.notifications?.email === 'sent' ? 'email enviado' : 'email não configurado';
      const whatsapp = data.notifications?.whatsapp === 'sent' ? 'WhatsApp enviado' : 'WhatsApp não configurado';
      setMessage(`Pedido ${order.order_number} atualizado; ${email}, ${whatsapp}.`);
    } else setMessage('Não foi possível atualizar o estado do pedido.');
  };
  const reviewProof = async (proof: PaymentProof, action: 'approve' | 'reject' | 'request_new') => {
    const note = window.prompt('Nota interna (opcional):', proof.admin_note ?? '');
    if (note === null) return;
    const response = await fetch(`/api/admin/payment-proofs/${proof.id}/review`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ action, note }) });
    if (response.ok) { setMessage(`Comprovativo ${action === 'approve' ? 'aprovado' : action === 'reject' ? 'rejeitado' : 'marcado para novo envio'}.`); await load(); }
    else setMessage('Não foi possível rever o comprovativo.');
  };
  const openProof = async (proof: PaymentProof) => {
    const response = await fetch(`/api/admin/payment-proofs/${proof.id}/file`, { credentials: 'include' });
    if (!response.ok) { setMessage('Não foi possível abrir o comprovativo.'); return; }
    const data = await response.json() as { url: string };
    window.open(data.url, '_blank', 'noopener,noreferrer');
  };
  const saveRate = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/admin/settings/exchange-rate', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ usdToAoa: Number(rateDraft), source: rateSource, note: 'Taxa gerida no painel administrativo.' }) });
    if (response.ok) { const saved = await response.json() as { usdToAoa: number; source: string; updatedAt: string; note: string }; updateConfig(saved); setMessage('Taxa atualizada em toda a loja.'); }
    else setMessage('Não foi possível atualizar a taxa.');
  };

  if (forbidden) return <PageShell crumbs={[{ label: 'Administração' }]}><div className="admin-empty"><h1 className="page-title">Administração</h1><p>Esta área requer uma conta administrativa autorizada.</p><Link to="/my-account" className="btn btn--primary">Iniciar sessão</Link></div></PageShell>;

  const navItems: Array<{ id: AdminTab; label: string; icon: 'category' | 'cart' | 'clock' }> = [
    { id: 'dashboard', label: 'Visão geral', icon: 'category' }, { id: 'orders', label: 'Pedidos e faturas', icon: 'cart' }, { id: 'products', label: 'Produtos', icon: 'category' }, { id: 'payments', label: 'Pagamentos', icon: 'cart' }, { id: 'proofs', label: `Comprovativos${proofs.filter((proof) => proof.status === 'submitted').length ? ` (${proofs.filter((proof) => proof.status === 'submitted').length})` : ''}`, icon: 'cart' }, { id: 'settings', label: 'Configuração', icon: 'clock' },
  ];
  const orderList = (compact = false) => (
    <div className="admin-products-table">
      {orders.length === 0 && <p className="admin-message">Ainda não existem pedidos registados.</p>}
      {(compact ? orders.slice(0, 5) : orders).map((order) => (
        <article key={order.order_number}>
          <div><strong>{order.order_number}</strong><small>{order.customer_name} · {order.customer_email}</small></div>
          <span>{money.format(Number(order.total_aoa))} Kz</span>
          {!compact && <label className="admin-order-status"><span>Estado</span><select value={order.status} onChange={(event) => void updateOrderStatus(order, event.target.value)}>{ORDER_STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
          {!compact && <div className="admin-invoice-actions"><a className="btn btn--outline btn--sm" href={`/api/admin/orders/${encodeURIComponent(order.order_number)}/invoice?template=classic`} download>Clássica</a><a className="btn btn--outline btn--sm" href={`/api/admin/orders/${encodeURIComponent(order.order_number)}/invoice?template=modern`} download>Moderna</a></div>}
        </article>
      ))}
    </div>
  );

  return <PageShell crumbs={[{ label: 'Administração' }]}>
    <div className="admin-head"><div><p className="page-kicker">GameAO · operação</p><h1 className="page-title">Painel administrativo</h1><p className="page-subtitle">Gestão centralizada do catálogo, pedidos, preços e operação da loja.</p></div><Link to="/my-account" className="btn btn--outline btn--sm">Minha conta</Link></div>
    <div className="admin-shell">
      <nav className="admin-nav" aria-label="Menu administrativo">
        <div className="admin-nav__identity"><img src="/assets/logo.png" alt="GameAO" /><span>Área de gestão</span></div>
        {navItems.map((item) => <button type="button" key={item.id} className={activeTab === item.id ? 'is-active' : ''} onClick={() => { setActiveTab(item.id); setMessage(''); }}><Icon name={item.icon} />{item.label}</button>)}
        <div className="admin-nav__bottom"><Link to="/" target="_blank"><Icon name="arrowRight" /> Ver loja</Link><Link to="/my-account"><Icon name="user" /> Perfil</Link></div>
      </nav>
      <main className="admin-main">
        {loading ? <p className="admin-state">A carregar dados do servidor…</p> : <>
          {activeTab === 'dashboard' && <>
            <section className="admin-metrics" aria-label="Resumo operacional"><article><span>Faturação total</span><strong>{money.format(overview?.orders.revenue ?? 0)} Kz</strong><small>{money.format(overview?.orders.revenueMonth ?? 0)} Kz este mês</small></article><article><span>Vendas hoje</span><strong>{money.format(overview?.orders.revenueToday ?? 0)} Kz</strong><small>{overview?.orders.total ?? 0} encomendas no total</small></article><article><span>Pagamentos por confirmar</span><strong>{overview?.orders.paymentPending ?? 0}</strong><small>{overview?.orders.paid ?? 0} confirmados</small></article><article><span>Processamento</span><strong>{overview?.orders.processing ?? 0}</strong><small>{overview?.orders.completed ?? 0} concluídas</small></article><article><span>Clientes</span><strong>{overview?.customers.total ?? 0}</strong><small>{overview?.products.active ?? 0} produtos ativos</small></article></section>
            <div className="admin-quick-grid"><button type="button" onClick={() => setActiveTab('orders')}><Icon name="cart" /><strong>Gerir pedidos</strong><span>Atualizar estados e descarregar faturas</span></button><button type="button" onClick={() => setActiveTab('products')}><Icon name="category" /><strong>Gerir produtos</strong><span>Criar, ativar ou desativar produtos</span></button><button type="button" onClick={() => setActiveTab('settings')}><Icon name="clock" /><strong>Configurar loja</strong><span>Alterar a taxa interna de preços</span></button></div>
            <section className="admin-card"><div className="admin-card__head"><h2>Pedidos recentes</h2><button type="button" className="btn btn--outline btn--sm" onClick={() => setActiveTab('orders')}>Ver todos</button></div>{orderList(true)}</section>
          </>}
          {activeTab === 'orders' && <section className="admin-card admin-orders-card"><div className="admin-card__head"><div><h2>Pedidos e faturas</h2><p className="admin-card__subhead">Altere o estado do pedido e descarregue um dos modelos de fatura.</p></div><span>{orders.length} registos</span></div>{message && <p className="admin-message admin-message--banner">{message}</p>}{orderList()}</section>}
          {activeTab === 'products' && <div className="admin-grid admin-products-grid"><section className="admin-card"><div className="admin-card__head"><h2>Novo produto</h2><span>Preço-base em USD</span></div><form className="admin-form" onSubmit={createProduct}><label className="field"><span>Nome *</span><input required value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></label><label className="field"><span>Slug *</span><input required value={form.slug} onChange={(event) => updateForm('slug', event.target.value)} placeholder="nome-do-produto" /></label><div className="form-row"><label className="field"><span>Preço USD *</span><input required type="number" min="0" step="0.01" value={form.basePriceUsd} onChange={(event) => updateForm('basePriceUsd', event.target.value)} /></label><label className="field"><span>Promoção USD</span><input type="number" min="0" step="0.01" value={form.salePriceUsd} onChange={(event) => updateForm('salePriceUsd', event.target.value)} /></label></div><div className="form-row"><label className="field"><span>Tipo</span><select value={form.categoryType} onChange={(event) => updateForm('categoryType', event.target.value)}><option value="digital">Digital</option><option value="physical">Físico</option></select></label><label className="field"><span>Subtipo</span><select value={form.productSubtype} onChange={(event) => updateForm('productSubtype', event.target.value)}><option value="digital_game">Jogo digital</option><option value="digital_other">Digital — outro</option><option value="physical">Produto físico</option></select></label></div><div className="form-row"><label className="field"><span>Frete em Kz</span><input type="number" min="0" step="0.01" value={form.shippingCostAoa} onChange={(event) => updateForm('shippingCostAoa', event.target.value)} /></label><label className="field"><span>Plataforma</span><input value={form.platform} onChange={(event) => updateForm('platform', event.target.value)} placeholder="PC, Xbox, PlayStation" /></label></div><label className="field"><span className="checkbox-field"><input type="checkbox" checked={form.requiresPlayerId} onChange={(event) => setForm((current) => ({ ...current, requiresPlayerId: event.target.checked }))} /> Exigir ID do jogador</span></label><label className="field"><span className="checkbox-field"><input type="checkbox" checked={form.isDynamic} onChange={(event) => setForm((current) => ({ ...current, isDynamic: event.target.checked }))} /> Produto dinâmico com variantes</span></label><label className="field"><span>Descrição curta</span><textarea rows={3} value={form.shortDescription} onChange={(event) => updateForm('shortDescription', event.target.value)} /></label><button type="submit" className="btn btn--primary">Criar produto</button>{message && <p className="admin-message">{message}</p>}</form></section><section className="admin-card admin-card--wide"><div className="admin-card__head"><h2>Catálogo</h2><span>{products.length} registos</span></div><div className="admin-products-table">{products.map((product) => <article key={product.id} className={!product.isActive ? 'is-inactive' : ''}><img src={product.image} alt="" /><div><strong>{product.name}</strong><small>{product.slug} · {product.isActive ? 'Ativo' : 'Inativo'}</small></div><span>{formatUsdAsAoa(product.salePriceUsd ?? product.basePriceUsd, rate)}</span><button type="button" className="btn btn--outline btn--sm" onClick={() => void toggleProduct(product)}>{product.isActive ? 'Desativar' : 'Ativar'}</button></article>)}</div></section></div>}
          {activeTab === 'payments' && <section className="admin-card admin-orders-card"><div className="admin-card__head"><div><h2>Métodos de pagamento</h2><p className="admin-card__subhead">Configure apenas dados próprios da GameAO. Métodos novos ficam desativados até serem revistos.</p></div><span>{paymentMethods.filter((method) => method.is_active).length} ativos</span></div>{message && <p className="admin-message admin-message--banner">{message}</p>}<div className="admin-products-table">{paymentMethods.map((method) => <article key={method.id}><div><strong>{method.name}</strong><small>{method.code} · {method.requires_proof ? 'exige comprovativo' : 'sem comprovativo'}</small></div><label className="admin-order-status"><span>Ativo</span><input type="checkbox" checked={Boolean(method.is_active)} onChange={(event) => void updatePaymentMethod(method, { is_active: event.target.checked ? 1 : 0 })} /></label><button type="button" className="btn btn--outline btn--sm" onClick={() => { const instructions = window.prompt('Instruções de pagamento da GameAO:', method.instructions); if (instructions !== null) void updatePaymentMethod(method, { instructions }); }}>Editar instruções</button></article>)}</div></section>}
          {activeTab === 'proofs' && <section className="admin-card admin-orders-card"><div className="admin-card__head"><div><h2>Comprovativos de pagamento</h2><p className="admin-card__subhead">O envio não confirma o pagamento. Reveja o documento antes de aprovar.</p></div><span>{proofs.filter((proof) => proof.status === 'submitted').length} por rever</span></div>{message && <p className="admin-message admin-message--banner">{message}</p>}<div className="admin-products-table">{proofs.length === 0 && <p className="admin-message">Ainda não existem comprovativos.</p>}{proofs.map((proof) => <article key={proof.id}><div><strong>{proof.order_number} · {proof.customer_name}</strong><small>{proof.original_name} · {proof.payment_method_name ?? 'Sem método'} · {new Date(proof.submitted_at).toLocaleString('pt-AO')}</small></div><span>{money.format(Number(proof.total_aoa))} Kz<br /><small>{proof.status}</small></span><button type="button" className="btn btn--outline btn--sm" onClick={() => void openProof(proof)}>Abrir</button><div className="admin-invoice-actions"><button type="button" className="btn btn--primary btn--sm" disabled={proof.status === 'approved'} onClick={() => void reviewProof(proof, 'approve')}>Aprovar</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void reviewProof(proof, 'request_new')}>Pedir novo</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void reviewProof(proof, 'reject')}>Rejeitar</button></div></article>)}</div></section>}
          {activeTab === 'settings' && <section className="admin-card admin-settings-card"><div className="admin-card__head"><div><h2>Configuração da loja</h2><p className="admin-card__subhead">Estas definições são internas e não aparecem na navegação pública.</p></div></div><form className="admin-form admin-settings-form" onSubmit={saveRate}><label className="field"><span>1 USD em Kz *</span><input required type="number" min="0.01" step="0.01" value={rateDraft} onChange={(event) => setRateDraft(event.target.value)} /></label><label className="field"><span>Fonte / referência</span><input value={rateSource} onChange={(event) => setRateSource(event.target.value)} /></label><p className="admin-message">Valor atual: {formatUsdAsAoa(1, rate)} por USD. O preço dos produtos, carrinho e checkout acompanha esta taxa.</p><button type="submit" className="btn btn--primary">Guardar configuração</button>{message && <p className="admin-message admin-message--banner">{message}</p>}</form></section>}
        </>}
      </main>
    </div>
  </PageShell>;
}
