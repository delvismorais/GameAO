import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { formatUsdAsAoa } from '../lib/pricing';

type HistoryEntry = { from_status?: string | null; to_status: string; note?: string | null; created_at: string };
type Result = { order: { order_number: string; customer_name: string; total_aoa: number; subtotal_aoa: number; exchange_rate_usd_aoa?: number; shipping_aoa?: number; status: string; payment_status: string; payment_method?: string; created_at: string; updated_at?: string; delivery_city?: string; delivery_province?: string }; items: Array<{ product_name: string; quantity: number; subtotal_aoa: number; image_card_url?: string }>; history?: HistoryEntry[] };
const STATUS_STEPS = [['awaiting_payment', 'A aguardar pagamento'], ['payment_confirmed', 'Pagamento confirmado'], ['processing', 'Em processamento'], ['ready_for_delivery', 'Pronto para entrega'], ['completed', 'Concluído']] as const;
function labelFor(status: string): string { return STATUS_STEPS.find(([value]) => value === status)?.[1] ?? ({ cancelled: 'Cancelado', refunded: 'Reembolsado' }[status] ?? status); }
function initialNumber(search: string): string { const params = new URLSearchParams(search); return (params.get('order') ?? params.get('number') ?? search.replace(/^\?/, '').split('&')[0].split('?')[0] ?? '').trim(); }

export function OrderTracking() {
  const location = useLocation();
  const [number, setNumber] = useState(() => initialNumber(location.search));
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const search = async (event?: FormEvent) => {
    event?.preventDefault(); const cleanNumber = number.trim().toUpperCase();
    if (!cleanNumber) { setError('Indique o número do pedido.'); return; }
    setError(''); setResult(null); setLoading(true);
    try { const response = await fetch(`/api/orders/${encodeURIComponent(cleanNumber)}`); if (response.ok) setResult(await response.json() as Result); else setError('Não encontrámos este pedido. Confirme o número, por exemplo GA8.'); }
    catch { setError('Não foi possível contactar o servidor. Tente novamente.'); } finally { setLoading(false); }
  };
  useEffect(() => { const fromUrl = initialNumber(location.search); if (fromUrl) { setNumber(fromUrl); void search(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [location.search]);
  const currentIndex = result ? STATUS_STEPS.findIndex(([value]) => value === result.order.status) : -1;
  return <PageShell crumbs={[{ label: 'Acompanhar pedido' }]}><div className="tracking-page">
    <p className="page-kicker">Estado da compra</p><h1 className="page-title">Acompanhar pedido</h1><p className="page-subtitle">Consulte o estado, os artigos e o percurso do seu pedido usando apenas o número, por exemplo <strong>GA8</strong>.</p>
    <form className="tracking-form" onSubmit={search}><label className="field"><span>Número do pedido *</span><input required value={number} onChange={(event) => setNumber(event.target.value)} placeholder="GA8" autoCapitalize="characters" /></label><button className="btn btn--primary" type="submit">{loading ? 'A procurar…' : 'Consultar pedido'}</button></form>
    {error && <p className="tracking-error" role="alert">{error}</p>}
    {result && <section className="tracking-result" aria-live="polite"><header><div><span>Pedido</span><strong>{result.order.order_number}</strong><small>Cliente: {result.order.customer_name}</small></div><span className={`order-status order-status--${result.order.status === 'completed' ? 'done' : 'pending'}`}>{labelFor(result.order.status)}</span></header>
      <div className="tracking-timeline" aria-label="Percurso do pedido">{STATUS_STEPS.map(([value, label], index) => <div key={value} className={`tracking-step ${index < currentIndex ? 'is-done' : ''} ${index === currentIndex ? 'is-current' : ''}`}><span className="tracking-step__dot">{index < currentIndex ? '✓' : index + 1}</span><span>{label}</span></div>)}</div>
      {result.order.status === 'cancelled' && <p className="tracking-error">Este pedido foi cancelado. Contacte o suporte GameAO se precisar de ajuda.</p>}
      <div className="tracking-meta"><div><span>Data do pedido</span><strong>{new Date(result.order.created_at).toLocaleString('pt-AO')}</strong></div><div><span>Pagamento</span><strong>{result.order.payment_status === 'paid' ? 'Pago' : 'Pendente'}</strong></div>{result.order.delivery_city && <div><span>Entrega</span><strong>{[result.order.delivery_city, result.order.delivery_province].filter(Boolean).join(', ')}</strong></div>}</div>
      <h2 className="tracking-heading">Artigos do pedido</h2><div className="tracking-items">{result.items.map((item) => <div key={`${item.product_name}-${item.quantity}`}><img src={item.image_card_url ?? '/assets/gameao-logo.png'} alt="" /><span>{item.product_name} × {item.quantity}</span><strong>{formatUsdAsAoa(Number(item.subtotal_aoa) / Number(result.order.exchange_rate_usd_aoa || 1))}</strong></div>)}</div><div className="tracking-total"><span>Total</span><strong>{formatUsdAsAoa(Number(result.order.total_aoa) / Number(result.order.exchange_rate_usd_aoa || 1))}</strong></div>
      {(result.history?.length ?? 0) > 0 && <><h2 className="tracking-heading">Histórico de estados</h2><ol className="tracking-history">{result.history?.map((entry, index) => <li key={`${entry.created_at}-${index}`}><span>{new Date(entry.created_at).toLocaleString('pt-AO')}</span><strong>{labelFor(entry.to_status)}</strong>{entry.note && <small>{entry.note}</small>}</li>)}</ol></>}
      <div className="order-confirmation__actions"><a className="btn btn--primary" href={`/api/orders/${encodeURIComponent(result.order.order_number)}/invoice?template=classic`} download>Baixar fatura clássica</a><a className="btn btn--outline" href={`/api/orders/${encodeURIComponent(result.order.order_number)}/invoice?template=modern`} download>Baixar fatura moderna</a></div>
    </section>}
    <Link to="/shop" className="order-summary__back">← Voltar à loja</Link>
  </div></PageShell>;
}
