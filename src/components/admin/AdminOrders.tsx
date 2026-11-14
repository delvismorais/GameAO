import { useMemo, useState } from 'react';
import { AdminSection, Badge, Empty, Field, Modal, Notice, StatusBadge, api, downloadUrl, formatDate, formatKz, shortDate, statusLabel, useJson } from './ui';
import type { AdminSectionId } from './adminNav';

export type AdminOrder = { order_number: string; customer_name: string; customer_email: string; customer_phone?: string; total_aoa: number; status: string; payment_status: string; payment_method?: string | null; created_at: string; item_count: number };
type Detail = {
  order: Record<string, unknown> & { order_number: string; customer_name: string; customer_email: string; customer_phone: string; total_aoa: number; subtotal_aoa: number; shipping_aoa: number; discount_aoa: number; status: string; payment_status: string; payment_method: string; payment_reference: string; internal_notes: string; created_at: string; billing_address: string; billing_city: string; billing_province: string; delivery_address: string; delivery_date: string };
  items: Array<{ id: number; product_name: string; variant_name?: string; quantity: number; unit_price_aoa: number; subtotal_aoa: number; player_id?: string; player_nickname?: string }>;
  history: Array<{ id: number; to_status: string; note?: string; created_at: string; changed_by?: string }>;
  proofs: Array<{ id: number; original_name: string; mime_type: string; size_bytes: number; status: string; admin_note?: string; submitted_at: string }>;
  notifications: Array<{ id: number; event_key: string; channel: string; recipient: string; status: string; subject?: string; error_message?: string; created_at: string }>;
};

const STATUS_OPTIONS = [['awaiting_payment', 'A aguardar pagamento'], ['payment_verification', 'Comprovativo em verificação'], ['payment_confirmed', 'Pagamento confirmado'], ['processing', 'Em processamento'], ['ready_for_delivery', 'Pronta para entrega'], ['completed', 'Concluída'], ['cancelled', 'Cancelada'], ['refunded', 'Reembolsada']] as const;

const PRESETS: Partial<Record<AdminSectionId, { title: string; statuses?: string[]; paid?: boolean }>> = {
  orders: { title: 'Todas as encomendas' },
  'orders-pending': { title: 'Encomendas pendentes', statuses: ['awaiting_payment', 'payment_verification'] },
  'orders-paid': { title: 'Encomendas pagas', paid: true },
  'orders-processing': { title: 'Encomendas em processamento', statuses: ['payment_confirmed', 'processing', 'ready_for_delivery'] },
  'orders-completed': { title: 'Encomendas concluídas', statuses: ['completed'] },
  'orders-cancelled': { title: 'Encomendas canceladas', statuses: ['cancelled', 'refunded'] },
};

export function AdminOrders({ section }: { section: AdminSectionId }) {
  const preset = PRESETS[section] ?? PRESETS.orders!;
  const { data, loading, error, reload } = useJson<{ orders: AdminOrder[] }>('/api/admin/orders');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [proofOnly, setProofOnly] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error'>('success');
  const [detailNumber, setDetailNumber] = useState('');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState('');

  const methods = useMemo(() => Array.from(new Set((data?.orders ?? []).map((order) => order.payment_method).filter(Boolean))) as string[], [data]);

  const filtered = useMemo(() => (data?.orders ?? []).filter((order) => {
    if (preset.paid && order.payment_status !== 'paid') return false;
    if (preset.statuses && !preset.statuses.includes(order.status)) return false;
    if (status !== 'all' && order.status !== status) return false;
    if (method !== 'all' && order.payment_method !== method) return false;
    if (from && order.created_at.slice(0, 10) < from) return false;
    if (to && order.created_at.slice(0, 10) > to) return false;
    if (proofOnly && order.status !== 'payment_verification') return false;
    const query = search.trim().toLowerCase();
    return !query || `${order.order_number} ${order.customer_name} ${order.customer_email} ${order.customer_phone ?? ''}`.toLowerCase().includes(query);
  }), [data, preset, status, method, from, to, proofOnly, search]);

  const notify = (text: string, kind: 'success' | 'error' = 'success') => { setMessage(text); setTone(kind); };

  const openDetail = async (orderNumber: string) => {
    setDetailNumber(orderNumber); setDetail(null); setDetailLoading(true);
    const result = await api<Detail>(`/api/admin/orders/${encodeURIComponent(orderNumber)}`);
    if (result.ok) { setDetail(result.data); setNote(String(result.data.order.internal_notes ?? '')); } else notify(result.error ?? 'Não foi possível abrir a encomenda.', 'error');
    setDetailLoading(false);
  };

  const changeStatus = async (orderNumber: string, next: string) => {
    const result = await api<{ notifications?: Record<string, string> }>(`/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
    if (!result.ok) { notify(result.error ?? 'Não foi possível atualizar o estado.', 'error'); return; }
    notify(`Estado atualizado. Email: ${result.data.notifications?.email ?? '—'} · WhatsApp: ${result.data.notifications?.whatsapp ?? '—'} · Notificação interna: ${result.data.notifications?.in_app ?? '—'}.`);
    await reload();
    if (detailNumber === orderNumber) await openDetail(orderNumber);
  };

  const saveNotes = async () => {
    const result = await api(`/api/admin/orders/${encodeURIComponent(detailNumber)}/notes`, { method: 'PATCH', body: JSON.stringify({ notes: note }) });
    notify(result.ok ? 'Notas internas guardadas.' : result.error ?? 'Não foi possível guardar as notas.', result.ok ? 'success' : 'error');
  };

  const reviewProof = async (proofId: number, action: 'approve' | 'reject' | 'request_new') => {
    const adminNote = action === 'approve' ? '' : window.prompt('Observação para o cliente (opcional):', '') ?? '';
    const result = await api(`/api/admin/payment-proofs/${proofId}/review`, { method: 'PATCH', body: JSON.stringify({ action, note: adminNote }) });
    notify(result.ok ? 'Comprovativo revisto e cliente notificado.' : result.error ?? 'Não foi possível rever o comprovativo.', result.ok ? 'success' : 'error');
    await reload();
    if (detailNumber) await openDetail(detailNumber);
  };

  const openProof = async (proofId: number) => {
    const result = await api<{ url: string }>(`/api/admin/payment-proofs/${proofId}/file`);
    if (result.ok) window.open(result.data.url, '_blank', 'noopener,noreferrer'); else notify(result.error ?? 'Não foi possível abrir o ficheiro.', 'error');
  };

  const resend = async (eventKey: string) => {
    const result = await api(`/api/admin/orders/${encodeURIComponent(detailNumber)}/notifications/resend`, { method: 'POST', body: JSON.stringify({ eventKey, channels: ['email', 'whatsapp', 'in_app'] }) });
    notify(result.ok ? 'Notificação reenviada.' : result.error ?? 'Falha no reenvio.', result.ok ? 'success' : 'error');
    if (detailNumber) await openDetail(detailNumber);
  };

  return (
    <AdminSection
      title={preset.title}
      subtitle="Pesquise por número, nome, telefone ou email; filtre por estado, método e data. Todas as alterações ficam registadas com data e administrador."
      actions={<><span className="admin-section__count">{filtered.length} de {data?.orders.length ?? 0}</span><button type="button" className="btn btn--outline btn--sm" onClick={() => downloadUrl('/api/admin/export?type=orders')}>Exportar CSV</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void reload()}>Atualizar</button></>}
    >
      <Notice message={message} tone={tone} />
      {error && <Notice tone="error" message={error} />}
      <div className="admin-filterbar">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Número, cliente, email ou telefone…" aria-label="Pesquisar encomendas" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por estado"><option value="all">Todos os estados</option>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={method} onChange={(event) => setMethod(event.target.value)} aria-label="Filtrar por método"><option value="all">Todos os métodos</option>{methods.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <label className="admin-filterbar__date"><span>De</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label className="admin-filterbar__date"><span>Até</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <label className="admin-check"><input type="checkbox" checked={proofOnly} onChange={(event) => setProofOnly(event.target.checked)} /> Com comprovativo</label>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table admin-table--orders">
          <thead><tr><th>Encomenda</th><th>Cliente</th><th>Total</th><th>Pagamento</th><th>Estado</th><th>Data</th><th /></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7}><Empty>A carregar encomendas…</Empty></td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={7}><Empty>Não existem encomendas para os filtros selecionados.</Empty></td></tr>}
            {filtered.map((order) => (
              <tr key={order.order_number}>
                <td><button type="button" className="admin-link" onClick={() => void openDetail(order.order_number)}>{order.order_number}</button><small>{order.item_count} artigos</small></td>
                <td><strong>{order.customer_name}</strong><small>{order.customer_email}</small></td>
                <td>{formatKz(order.total_aoa)}</td>
                <td><StatusBadge status={order.payment_status} />{order.payment_method && <small>{order.payment_method}</small>}</td>
                <td><select className="admin-inline-select" value={order.status} onChange={(event) => void changeStatus(order.order_number, event.target.value)} aria-label={`Estado de ${order.order_number}`}>{STATUS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
                <td>{formatDate(order.created_at)}</td>
                <td><button type="button" className="btn btn--outline btn--sm" onClick={() => void openDetail(order.order_number)}>Abrir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={Boolean(detailNumber)} title={`Encomenda ${detailNumber}`} onClose={() => { setDetailNumber(''); setDetail(null); }} wide>
        {detailLoading && <p className="admin-state">A carregar ficha da encomenda…</p>}
        {detail && <>
          <div className="admin-detail__summary">
            <div><span>Cliente</span><strong>{detail.order.customer_name}</strong><small>{detail.order.customer_email} · {detail.order.customer_phone}</small></div>
            <div><span>Total</span><strong>{formatKz(detail.order.total_aoa)}</strong><small>Subtotal {formatKz(detail.order.subtotal_aoa)} · Envio {formatKz(detail.order.shipping_aoa)} · Desconto {formatKz(detail.order.discount_aoa)}</small></div>
            <div><span>Estado</span><StatusBadge status={detail.order.status} /><small>Pagamento: {statusLabel(detail.order.payment_status)}</small></div>
            <div><span>Data</span><strong>{formatDate(detail.order.created_at)}</strong><small>Ref. {detail.order.payment_reference ?? '—'}</small></div>
          </div>
          <div className="admin-detail__grid">
            <div>
              <h3>Artigos</h3>
              <table className="admin-table"><thead><tr><th>Produto</th><th>Qtd.</th><th>Preço</th><th>Total</th></tr></thead><tbody>{detail.items.map((item) => <tr key={item.id}><td>{item.product_name}{item.variant_name ? ` · ${item.variant_name}` : ''}{item.player_id ? <small>ID jogador: {item.player_id} {item.player_nickname ? `(${item.player_nickname})` : ''}</small> : null}</td><td>{item.quantity}</td><td>{formatKz(item.unit_price_aoa)}</td><td>{formatKz(item.subtotal_aoa)}</td></tr>)}</tbody></table>
              <h3>Entrega</h3>
              <p className="admin-detail__text">{detail.order.delivery_address || detail.order.billing_address || 'Sem endereço (produto digital)'}<br />{[detail.order.billing_city, detail.order.billing_province].filter(Boolean).join(', ')}{detail.order.delivery_date ? ` · ${shortDate(detail.order.delivery_date)}` : ''}</p>
              <h3>Notas internas</h3>
              <textarea className="admin-textarea" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Notas visíveis apenas para a equipa…" />
              <button type="button" className="btn btn--outline btn--sm" onClick={() => void saveNotes()}>Guardar notas</button>
              <h3>Histórico</h3>
              <ul className="admin-timeline">{detail.history.map((entry) => <li key={entry.id}><span>{formatDate(entry.created_at)}</span><strong>{statusLabel(entry.to_status)}</strong>{entry.note && <small>{entry.note}</small>}{entry.changed_by && <small>Por {entry.changed_by}</small>}</li>)}</ul>
            </div>
            <div>
              <h3>Comprovativos</h3>
              {detail.proofs.length === 0 && <p className="admin-message">Sem comprovativos enviados.</p>}
              {detail.proofs.map((proof) => <article className="admin-proof" key={proof.id}><div><strong>{proof.original_name}</strong><small>{proof.mime_type} · {(proof.size_bytes / 1024).toFixed(0)} KB · {formatDate(proof.submitted_at)}</small><StatusBadge status={proof.status} />{proof.admin_note && <small>{proof.admin_note}</small>}</div><div className="admin-proof__actions"><button type="button" className="btn btn--outline btn--sm" onClick={() => void openProof(proof.id)}>Abrir</button><button type="button" className="btn btn--primary btn--sm" disabled={proof.status === 'approved'} onClick={() => void reviewProof(proof.id, 'approve')}>Aprovar</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void reviewProof(proof.id, 'request_new')}>Pedir novo</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void reviewProof(proof.id, 'reject')}>Rejeitar</button></div></article>)}
              <h3>Notificações</h3>
              {detail.notifications.length === 0 && <p className="admin-message">Sem notificações registadas.</p>}
              <ul className="admin-activity">{detail.notifications.map((notification) => <li key={notification.id}><div><strong>{notification.event_key} · {notification.channel}</strong><small>{notification.recipient} · {formatDate(notification.created_at)}</small>{notification.error_message && <small>{notification.error_message}</small>}</div><StatusBadge status={notification.status} /><button type="button" className="admin-link" onClick={() => void resend(notification.event_key)}>Reenviar</button></li>)}</ul>
              <h3>Faturas</h3>
              <div className="admin-invoice-actions"><a className="btn btn--outline btn--sm" href={`/api/admin/orders/${encodeURIComponent(detailNumber)}/invoice?template=classic`} download>Fatura clássica</a><a className="btn btn--outline btn--sm" href={`/api/admin/orders/${encodeURIComponent(detailNumber)}/invoice?template=modern`} download>Fatura moderna</a></div>
              <div className="admin-detail__badges"><Badge tone="muted">Método: {detail.order.payment_method ?? '—'}</Badge><Badge tone="muted">ID: {String(detail.order.id)}</Badge></div>
            </div>
          </div>
        </>}
      </Modal>
    </AdminSection>
  );
}

export function AdminDeliveries() {
  const { data, loading } = useJson<{ deliveries: Array<{ order_number: string; customer_name: string; customer_phone: string; delivery_address: string; billing_city: string; billing_province: string; delivery_date: string; status: string; total_aoa: number; created_at: string }> }>('/api/admin/deliveries');
  return <AdminSection title="Acompanhamento de entregas" subtitle="Encomendas com artigos físicos e respetivo endereço de entrega." actions={<button type="button" className="btn btn--outline btn--sm" onClick={() => downloadUrl('/api/admin/export?type=orders')}>Exportar CSV</button>}>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Encomenda</th><th>Cliente</th><th>Contacto</th><th>Endereço</th><th>Data prevista</th><th>Estado</th></tr></thead><tbody>{loading ? <tr><td colSpan={6}><Empty>A carregar…</Empty></td></tr> : data?.deliveries.length ? data.deliveries.map((delivery) => <tr key={delivery.order_number}><td>{delivery.order_number}</td><td>{delivery.customer_name}</td><td>{delivery.customer_phone}</td><td>{delivery.delivery_address}<small>{[delivery.billing_city, delivery.billing_province].filter(Boolean).join(', ')}</small></td><td>{shortDate(delivery.delivery_date)}</td><td><StatusBadge status={delivery.status} /></td></tr>) : <tr><td colSpan={6}><Empty>Sem entregas físicas registadas.</Empty></td></tr>}</tbody></table></div>
  </AdminSection>;
}

export function AdminInvoices() {
  const { data, loading } = useJson<{ invoices: Array<{ id: number; template: string; created_at: string; order_number: string; customer_name: string; total_aoa: number; status: string; downloaded_by?: string }> }>('/api/admin/invoices');
  return <AdminSection title="Faturas" subtitle="Downloads de faturas registados, com modelo, encomenda e utilizador.">
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Encomenda</th><th>Cliente</th><th>Total</th><th>Modelo</th><th>Descarregada por</th><th>Data</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={7}><Empty>A carregar…</Empty></td></tr> : data?.invoices.length ? data.invoices.map((invoice) => <tr key={invoice.id}><td>{invoice.order_number}</td><td>{invoice.customer_name}</td><td>{formatKz(invoice.total_aoa)}</td><td><Badge tone="info">{invoice.template}</Badge></td><td>{invoice.downloaded_by ?? 'Cliente'}</td><td>{formatDate(invoice.created_at)}</td><td><a className="admin-link" href={`/api/admin/orders/${encodeURIComponent(invoice.order_number)}/invoice?template=${invoice.template}`} download>Descarregar</a></td></tr>) : <tr><td colSpan={7}><Empty>Ainda não foram descarregadas faturas.</Empty></td></tr>}</tbody></table></div>
  </AdminSection>;
}

export { Field };
