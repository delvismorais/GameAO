import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { formatAoa } from '../lib/pricing';

type Result = { order: { order_number: string; customer_name: string; customer_email: string; total_aoa: number; status: string; payment_status: string; created_at: string }; items: Array<{ product_name: string; quantity: number; subtotal_aoa: number; image_card_url?: string }> };

export function OrderTracking() {
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const search = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setResult(null); setLoading(true);
    const response = await fetch(`/api/orders/${encodeURIComponent(number.trim().toUpperCase())}?email=${encodeURIComponent(email.trim())}`);
    if (response.ok) setResult(await response.json() as Result); else setError('Não encontrámos esta encomenda. Confirme o número GA e o email usado no checkout.');
    setLoading(false);
  };
  return <PageShell crumbs={[{ label: 'Acompanhar pedido' }]}>
    <div className="tracking-page">
      <h1 className="page-title">Acompanhar pedido</h1>
      <p className="page-subtitle">Introduza o número da encomenda, por exemplo <strong>GA769</strong>, e o email do cliente.</p>
      <form className="tracking-form" onSubmit={search}>
        <label className="field"><span>Número do pedido *</span><input required value={number} onChange={(event) => setNumber(event.target.value)} placeholder="GA769" /></label>
        <label className="field"><span>Email usado na encomenda *</span><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <button className="btn btn--primary" type="submit">{loading ? 'A procurar…' : 'Acompanhar pedido'}</button>
      </form>
      {error && <p className="tracking-error">{error}</p>}
      {result && <section className="tracking-result">
        <header><div><span>Pedido</span><strong>{result.order.order_number}</strong></div><span className="order-status order-status--pending">{result.order.status}</span></header>
        <p>{result.order.customer_name} · {result.order.customer_email}</p>
        <div className="tracking-items">{result.items.map((item) => <div key={item.product_name}><img src={item.image_card_url ?? '/assets/logo.png'} alt="" /><span>{item.product_name} × {item.quantity}</span><strong>{formatAoa(Number(item.subtotal_aoa))}</strong></div>)}</div>
        <div className="tracking-total"><span>Total</span><strong>{formatAoa(Number(result.order.total_aoa))}</strong></div>
        <div className="order-confirmation__actions"><a className="btn btn--primary" href={`/api/orders/${encodeURIComponent(result.order.order_number)}/invoice?email=${encodeURIComponent(result.order.customer_email)}&template=classic`} download>Baixar fatura clássica</a><a className="btn btn--outline" href={`/api/orders/${encodeURIComponent(result.order.order_number)}/invoice?email=${encodeURIComponent(result.order.customer_email)}&template=modern`} download>Baixar fatura moderna</a></div>
      </section>}
      <Link to="/shop" className="order-summary__back">← Voltar à loja</Link>
    </div>
  </PageShell>;
}
