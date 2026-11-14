import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../context/StoreContext';
import { formatDatePt, formatUsdAsAoa } from '../lib/pricing';

type PaymentMethod = { id: number; code: string; name: string; description: string; instructions: string; requires_proof: number; customer_message: string; payment_deadline_hours?: number; receiving_data?: Record<string, unknown> };
type ServerOrder = { order: { order_number: string; created_at: string; customer_name: string; customer_email: string; customer_phone: string; billing_address?: string; billing_city?: string; billing_province?: string; total_aoa: number; exchange_rate_usd_aoa: number; status: string; payment_status: string }; paymentMethod?: PaymentMethod | null; proofs?: Array<{ id: number; original_name: string; status: string; submitted_at: string }>; items: Array<{ product_name: string; image_card_url?: string; quantity: number; subtotal_aoa: number }> };

function ReceivingData({ data }: { data?: Record<string, unknown> }) {
  if (!data || Object.keys(data).length === 0) return null;
  return <div className="payment-receiving-data">{Object.entries(data).map(([key, value]) => <div key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</strong></div>)}</div>;
}

export function OrderConfirmation() {
  const [params] = useSearchParams();
  const { orders } = useStore();
  const orderId = params.get('order') ?? '';
  const email = params.get('email') ?? '';
  const localOrder = orders.find((item) => item.id === orderId);
  const [serverOrder, setServerOrder] = useState<ServerOrder | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [loading, setLoading] = useState(Boolean(orderId && !localOrder));
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofMessage, setProofMessage] = useState('');
  const [proofUploading, setProofUploading] = useState(false);

  const loadOrder = async () => {
    if (!orderId || localOrder) return;
    const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}?email=${encodeURIComponent(email)}`);
    setServerOrder(response.ok ? await response.json() as ServerOrder : null);
  };
  useEffect(() => {
    void Promise.all([
      loadOrder().catch(() => setServerOrder(null)),
      fetch('/api/payment-methods').then((response) => response.ok ? response.json() : { methods: [] }).then((data: { methods?: PaymentMethod[] }) => setPaymentMethods(data.methods ?? [])).catch(() => setPaymentMethods([])),
    ]).finally(() => setLoading(false));
  }, [email, localOrder, orderId]);

  const server = serverOrder?.order;
  const number = server?.order_number ?? localOrder?.id ?? '';
  const selectedMethod = serverOrder?.paymentMethod ?? paymentMethods.find((method) => method.code === selectedPaymentMethod) ?? null;
  const canUpload = Boolean(server && server.payment_status !== 'paid' && (selectedMethod || serverOrder?.paymentMethod));

  const submitProof = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!proofFile || !number) return;
    setProofUploading(true); setProofMessage('');
    const body = new FormData(); body.append('email', email); body.append('file', proofFile); if (selectedPaymentMethod) body.append('paymentMethod', selectedPaymentMethod);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(number)}/proofs`, { method: 'POST', body });
      const data = await response.json().catch(() => null) as { message?: string } | null;
      if (response.ok) { setProofMessage(data?.message ?? 'Comprovativo recebido. Pagamento marcado como pago.'); setProofFile(null); await loadOrder(); }
      else setProofMessage(data?.message ?? 'Não foi possível enviar o comprovativo.');
    } catch { setProofMessage('Não foi possível contactar o servidor. Tente novamente.'); }
    finally { setProofUploading(false); }
  };

  if (loading) return <PageShell crumbs={[{ label: 'Confirmação' }]}><p className="admin-state">A carregar a encomenda…</p></PageShell>;
  if (!localOrder && !serverOrder) return <PageShell crumbs={[{ label: 'Confirmação' }]}><EmptyState title="Encomenda não encontrada" icon="🧾" action={<Link to="/shop" className="btn btn--primary">Voltar à loja</Link>}>Confirme o número e o email usados no checkout.</EmptyState></PageShell>;

  const createdAt = server?.created_at ?? localOrder?.createdAt ?? new Date().toISOString();
  const rate = Number(server?.exchange_rate_usd_aoa ?? localOrder?.exchangeRate ?? 913);
  const total = Number(server?.total_aoa ?? localOrder?.totalAoa ?? 0);
  const items = serverOrder?.items;
  const paid = server?.payment_status === 'paid';

  return <PageShell crumbs={[{ label: 'Confirmação da encomenda' }]}>
    <div className="order-confirmation">
      <div className="order-confirmation__icon"><Icon name="check" /></div>
      <h1>{paid ? 'Pagamento recebido' : 'Encomenda registada'}</h1>
      <p className="order-confirmation__lead">A sua encomenda foi registada com o número único <strong>{number}</strong>. Guarde-o para acompanhamento e descarga da fatura.</p>
      <div className="order-confirmation__summary"><div><span>Número da encomenda</span><strong>{number}</strong></div><div><span>Data</span><strong>{formatDatePt(createdAt)}</strong></div><div><span>Estado</span><strong>{server?.status ?? localOrder?.status ?? 'Pendente'}</strong></div><div><span>Total</span><strong>{formatUsdAsAoa(total / rate, rate)}</strong></div><div><span>Taxa aplicada</span><strong>1 USD = {formatUsdAsAoa(1, rate)}</strong></div><div><span>Pagamento</span><strong>{paid ? 'Pago' : 'Pendente'}</strong></div></div>
      {items && <><h2 className="order-confirmation__heading">Artigos</h2><ul className="order-confirmation__items">{items.map((item) => <li key={item.product_name}><img src={item.image_card_url ?? '/assets/logo.png'} alt="" /><span>{item.product_name} × {item.quantity}</span><strong>{formatUsdAsAoa(Number(item.subtotal_aoa) / rate, rate)}</strong></li>)}</ul></>}

      {!paid && <section className="payment-box order-confirmation__payment"><h2 className="order-confirmation__heading">Pagamento e comprovativo</h2><p>Se já efetuou o pagamento, escolha o método, consulte os dados de recebimento e envie o comprovativo. O pedido será marcado como pago automaticamente.</p>{paymentMethods.length > 0 ? <label className="field"><span>Método utilizado</span><select value={serverOrder?.paymentMethod?.code ?? selectedPaymentMethod} onChange={(event) => setSelectedPaymentMethod(event.target.value)}><option value="">Escolher método de pagamento</option>{paymentMethods.map((method) => <option key={method.code} value={method.code}>{method.name}</option>)}</select></label> : <p className="admin-message">Ainda não existem métodos de pagamento ativos. A equipa GameAO precisa configurá-los no painel.</p>}{selectedMethod && <div className="payment-instructions"><h3>{selectedMethod.name}</h3><p>{selectedMethod.customer_message}</p><p>{selectedMethod.instructions}</p><ReceivingData data={selectedMethod.receiving_data} /></div>}{canUpload && <form className="admin-form" onSubmit={submitProof}><label className="field"><span>Comprovativo (JPG, PNG, WEBP ou PDF; máximo 10 MB)</span><input required type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setProofFile(event.target.files?.[0] ?? null)} /></label><button className="btn btn--primary" type="submit" disabled={proofUploading}>{proofUploading ? 'A enviar…' : 'Enviar comprovativo e marcar como pago'}</button>{proofMessage && <p className="admin-message">{proofMessage}</p>}</form>}</section>}
      {paid && <section className="payment-box order-confirmation__payment"><h2 className="order-confirmation__heading">Pagamento confirmado</h2><p>O comprovativo foi recebido e o pedido está marcado como pago. A equipa GameAO dará seguimento ao processamento.</p>{serverOrder?.proofs?.length ? <p className="admin-message">Comprovativo: {serverOrder.proofs[0].original_name} · {serverOrder.proofs[0].status}</p> : null}</section>}
      <div className="order-confirmation__actions"><a href={`/api/orders/${encodeURIComponent(number)}/invoice?email=${encodeURIComponent(email)}&template=classic`} className="btn btn--primary" download>Baixar fatura · Modelo clássico</a><a href={`/api/orders/${encodeURIComponent(number)}/invoice?email=${encodeURIComponent(email)}&template=modern`} className="btn btn--outline" download>Baixar fatura · Modelo moderno</a><Link to="/my-account/orders" className="btn btn--outline">Ver encomendas</Link><Link to="/shop" className="btn btn--outline">Continuar a comprar</Link></div>
    </div>
  </PageShell>;
}
