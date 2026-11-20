import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { ProofUpload } from '../components/shop/ProofUpload';
import { formatUsdAsAoa } from '../lib/pricing';
import { useSeo } from '../lib/seo';

type HistoryEntry = { from_status?: string | null; to_status: string; note?: string | null; created_at: string };
type Result = { order: { order_number: string; customer_name: string; total_aoa: number; subtotal_aoa: number; exchange_rate_usd_aoa?: number; shipping_aoa?: number; status: string; payment_status: string; payment_method?: string; created_at: string; updated_at?: string; delivery_city?: string; delivery_province?: string }; items: Array<{ product_name: string; variant_name?: string; quantity: number; subtotal_aoa: number; image_card_url?: string; player_id?: string; player_nickname?: string }>; history?: HistoryEntry[] };
const STATUS_STEPS = [['awaiting_payment', 'A aguardar pagamento'], ['payment_confirmed', 'Pagamento confirmado'], ['processing', 'Em processamento'], ['ready_for_delivery', 'Pronto para entrega'], ['completed', 'Concluído']] as const;
const EMAIL_KEY = 'gameao-tracking-email';
function labelFor(status: string): string { return STATUS_STEPS.find(([value]) => value === status)?.[1] ?? ({ cancelled: 'Cancelado', refunded: 'Reembolsado', payment_verification: 'Comprovativo em verificação' }[status] ?? status); }

function readParams(search: string) {
  const params = new URLSearchParams(search);
  return {
    order: (params.get('order') ?? params.get('number') ?? '').trim(),
    token: (params.get('token') ?? '').trim(),
    email: (params.get('email') ?? '').trim(),
  };
}

export function OrderTracking() {
  const location = useLocation();
  const initial = useMemo(() => readParams(location.search), [location.search]);
  const [number, setNumber] = useState(initial.order);
  const [email, setEmail] = useState(() => initial.email || (typeof localStorage !== 'undefined' ? localStorage.getItem(EMAIL_KEY) ?? '' : ''));
  const [token, setToken] = useState(initial.token);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const search = async (event?: FormEvent, override?: { number?: string; email?: string; token?: string }) => {
    event?.preventDefault();
    const cleanNumber = (override?.number ?? number).trim().toUpperCase();
    const cleanEmail = (override?.email ?? email).trim();
    const cleanToken = (override?.token ?? token).trim();
    if (!cleanNumber) { setError('Indique o número do pedido.'); return; }
    if (!cleanEmail && !cleanToken) { setError('Indique o email usado na compra para confirmar que é o titular do pedido.'); return; }
    setError(''); setResult(null); setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cleanEmail) params.set('email', cleanEmail);
      if (cleanToken) params.set('token', cleanToken);
      const response = await fetch(`/api/orders/${encodeURIComponent(cleanNumber)}?${params.toString()}`);
      if (response.ok) {
        setResult(await response.json() as Result);
        if (cleanEmail) localStorage.setItem(EMAIL_KEY, cleanEmail);
      } else if (response.status === 403) {
        setError('Os dados não coincidem com este pedido. Confirme o número e o email usados na compra.');
      } else if (response.status === 404) {
        setError('Não encontrámos este pedido. Confirme o número, por exemplo GA8.');
      } else {
        setError('Não foi possível consultar o pedido agora. Tente novamente em instantes.');
      }
    } catch { setError('Não foi possível contactar o servidor. Tente novamente.'); } finally { setLoading(false); }
  };

  useEffect(() => {
    const fromUrl = readParams(location.search);
    if (fromUrl.order && (fromUrl.token || fromUrl.email)) {
      setNumber(fromUrl.order); setToken(fromUrl.token); if (fromUrl.email) setEmail(fromUrl.email);
      void search(undefined, { number: fromUrl.order, email: fromUrl.email, token: fromUrl.token });
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [location.search]);

  const currentIndex = result ? STATUS_STEPS.findIndex(([value]) => value === result.order.status) : -1;
  const access = `?${new URLSearchParams({ ...(email ? { email } : {}), ...(token ? { token } : {}) }).toString()}`;

  useSeo({
    title: 'Acompanhar pedido | GameAO',
    description: 'Consulte o estado da sua encomenda e envie o comprovativo de pagamento.',
    path: '/acompanhar-pedido',
  });
  return <PageShell crumbs={[{ label: 'Acompanhar pedido' }]}><div className="tracking-page">
    <p className="page-kicker">Estado da compra</p><h1 className="page-title">Acompanhar pedido</h1><p className="page-subtitle">Introduza o número do pedido e o email usado na compra. Também pode abrir o link seguro que enviámos por email.</p>
    <form className="tracking-form" onSubmit={search}>
      <label className="field"><span>Número do pedido *</span><input required value={number} onChange={(event) => setNumber(event.target.value)} placeholder="GA8" autoCapitalize="characters" /></label>
      <label className="field"><span>Email da compra *</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="o-seu-email@exemplo.com" autoComplete="email" /></label>
      <button className="btn btn--primary" type="submit">{loading ? 'A procurar…' : 'Consultar pedido'}</button>
    </form>
    {error && <p className="tracking-error" role="alert">{error}</p>}
    {result && <section className="tracking-result" aria-live="polite"><header><div><span>Pedido</span><strong>{result.order.order_number}</strong><small>Cliente: {result.order.customer_name}</small></div><span className={`order-status order-status--${result.order.status === 'completed' ? 'done' : 'pending'}`}>{labelFor(result.order.status)}</span></header>
      <div className="tracking-timeline" aria-label="Percurso do pedido">{STATUS_STEPS.map(([value, label], index) => <div key={value} className={`tracking-step ${index < currentIndex ? 'is-done' : ''} ${index === currentIndex ? 'is-current' : ''}`}><span className="tracking-step__dot">{index < currentIndex ? '✓' : index + 1}</span><span>{label}</span></div>)}</div>
      {result.order.status === 'cancelled' && <p className="tracking-error">Este pedido foi cancelado. Contacte o suporte GameAO se precisar de ajuda.</p>}
      <div className="tracking-meta"><div><span>Data do pedido</span><strong>{new Date(result.order.created_at).toLocaleString('pt-AO')}</strong></div><div><span>Pagamento</span><strong>{result.order.payment_status === 'paid' ? 'Pago' : 'Pendente'}</strong></div>{result.order.delivery_city && <div><span>Entrega</span><strong>{[result.order.delivery_city, result.order.delivery_province].filter(Boolean).join(', ')}</strong></div>}</div>
      <h2 className="tracking-heading">Artigos do pedido</h2><div className="tracking-items">{result.items.map((item) => <div key={`${item.product_name}-${item.quantity}-${item.player_id ?? ''}`}><img src={item.image_card_url ?? '/assets/gameao-logo.png'} alt="" /><span>{item.product_name}{item.variant_name ? ` · ${item.variant_name}` : ''} × {item.quantity}{item.player_id && <small className="tracking-item-player">ID do jogador: {item.player_id}{item.player_nickname ? ` · Nickname: ${item.player_nickname}` : ''}</small>}</span><strong>{formatUsdAsAoa(Number(item.subtotal_aoa))}</strong></div>)}</div><div className="tracking-total"><span>Total</span><strong>{formatUsdAsAoa(Number(result.order.total_aoa))}</strong></div>
      {result.order.payment_status !== 'paid' && <div className="tracking-payment"><h2 className="tracking-heading">Enviar comprovativo de pagamento</h2><p>Se já pagou, anexe o comprovativo. O documento fica em verificação e a equipa confirma o pagamento manualmente.</p><ProofUpload orderNumber={result.order.order_number} email={email} token={token} onUploaded={() => search(undefined, { number: result.order.order_number, email, token })} /></div>}
      {(result.history?.length ?? 0) > 0 && <><h2 className="tracking-heading">Histórico de estados</h2><ol className="tracking-history">{result.history?.map((entry, index) => <li key={`${entry.created_at}-${index}`}><span>{new Date(entry.created_at).toLocaleString('pt-AO')}</span><strong>{labelFor(entry.to_status)}</strong>{entry.note && <small>{entry.note}</small>}</li>)}</ol></>}
      <div className="order-confirmation__actions"><a className="btn btn--primary" href={`/api/orders/${encodeURIComponent(result.order.order_number)}/invoice${access}&template=classic`} download>Baixar fatura clássica</a><a className="btn btn--outline" href={`/api/orders/${encodeURIComponent(result.order.order_number)}/invoice${access}&template=modern`} download>Baixar fatura moderna</a></div>
    </section>}
    <Link to="/shop" className="order-summary__back">← Voltar à loja</Link>
  </div></PageShell>;
}
