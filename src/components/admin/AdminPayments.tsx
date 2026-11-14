import { useMemo, useState } from 'react';
import { AdminSection, Badge, Empty, Field, Modal, Notice, StatusBadge, api, downloadUrl, formatDate, formatKz, useJson } from './ui';
import type { AdminSectionId } from './adminNav';

type Method = { id: number; code: string; name: string; description: string; instructions: string; is_active: number; requires_proof: number; sort_order: number; payment_deadline_hours: number; customer_message: string; receiving_data_json?: Record<string, unknown> | string | null };
type Proof = { id: number; order_number: string; customer_name: string; total_aoa: number; payment_method_name?: string; original_name: string; mime_type: string; size_bytes: number; status: string; admin_note?: string; submitted_at: string };
type Transaction = { id: number; order_number: string; customer_name: string; provider: string; status: string; amount_aoa: number; reference?: string; created_at: string };
type Finance = { totals: { revenue: string; discounts: string; shipping: string; orders: string }; byMethod: Array<{ method: string; orders: string; revenue: string }>; refunds: Array<{ order_number: string; customer_name: string; total_aoa: number; updated_at: string }> };

const RECEIVING_FIELDS: Record<string, Array<{ key: string; label: string }>> = {
  mobile: [{ key: 'service', label: 'Serviço' }, { key: 'phone', label: 'Número de telefone' }, { key: 'holder', label: 'Nome do titular' }],
  bank: [{ key: 'bank', label: 'Banco' }, { key: 'beneficiary', label: 'Beneficiário' }, { key: 'iban', label: 'IBAN' }, { key: 'account_number', label: 'Número de conta' }],
  in_person: [{ key: 'location', label: 'Local de atendimento' }, { key: 'schedule', label: 'Horário' }],
  integration: [{ key: 'provider', label: 'Fornecedor' }, { key: 'webhook', label: 'Webhook (URL)' }, { key: 'mode', label: 'Modo (teste/produção)' }],
};

function methodKind(code: string): string {
  if (/express|paypay|unitel|mobile|movicel|africell/i.test(code)) return 'mobile';
  if (/bai|bfa|bank|transfer|iban/i.test(code)) return 'bank';
  if (/presencial|in.person|cash|balcao/i.test(code)) return 'in_person';
  if (/gateway|api|stripe|paypal|autom/i.test(code)) return 'integration';
  return 'mobile';
}

export function AdminPayments({ section }: { section: AdminSectionId }) {
  const methods = useJson<{ methods: Method[] }>('/api/admin/payment-methods');
  const proofs = useJson<{ proofs: Proof[] }>('/api/admin/payment-proofs');
  const transactions = useJson<{ transactions: Transaction[] }>('/api/admin/transactions');
  const finance = useJson<Finance>('/api/admin/reports/finance?days=90');
  const [editing, setEditing] = useState<Method | null>(null);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error'>('success');

  const notify = (text: string, kind: 'success' | 'error' = 'success') => { setMessage(text); setTone(kind); };

  const save = async (method: Method) => {
    const result = await api(`/api/admin/payment-methods/${method.id}`, { method: 'PUT', body: JSON.stringify({ name: method.name, description: method.description, instructions: method.instructions, customer_message: method.customer_message, receiving_data: method.receiving_data_json, is_active: Boolean(method.is_active), requires_proof: Boolean(method.requires_proof), sort_order: Number(method.sort_order), payment_deadline_hours: Number(method.payment_deadline_hours) }) });
    if (result.ok) { notify(`${method.name} atualizado.`); setEditing(null); await methods.reload(); } else notify(result.error ?? 'Não foi possível guardar.', 'error');
  };

  const review = async (proof: Proof, action: 'approve' | 'reject' | 'request_new') => {
    const note = action === 'approve' ? '' : window.prompt('Observação para o cliente (opcional):', '') ?? '';
    const result = await api(`/api/admin/payment-proofs/${proof.id}/review`, { method: 'PATCH', body: JSON.stringify({ action, note }) });
    notify(result.ok ? 'Comprovativo revisto; cliente notificado.' : result.error ?? 'Falha ao rever comprovativo.', result.ok ? 'success' : 'error');
    if (result.ok) await proofs.reload();
  };
  const openFile = async (id: number) => { const result = await api<{ url: string }>(`/api/admin/payment-proofs/${id}/file`); if (result.ok) window.open(result.data.url, '_blank', 'noopener,noreferrer'); else notify(result.error ?? 'Ficheiro indisponível.', 'error'); };

  const title = section === 'receiving' ? 'Dados de recebimento' : section === 'transactions' ? 'Transações' : section === 'proofs' || section.startsWith('payments-') ? 'Comprovativos de pagamento' : section === 'refunds' ? 'Reembolsos' : section === 'finance-reports' ? 'Relatórios financeiros' : 'Métodos de pagamento';
  const filteredProofs = proofs.data?.proofs.filter((proof) => section === 'payments-pending' ? ['submitted', 'request_new'].includes(proof.status) : section === 'payments-confirmed' ? proof.status === 'approved' : true) ?? [];
  const subtitle = section === 'receiving' ? 'Dados próprios da GameAO por modalidade. Métodos sem dados configurados permanecem desativados no checkout.' : section === 'finance-reports' ? 'Faturação, descontos, portes, reembolsos e receita por método nos últimos 90 dias.' : 'O envio de um comprovativo não confirma o pagamento. A aprovação é sempre manual.';

  if (section === 'transactions') return <AdminSection title={title} subtitle="Registo de pagamentos registados pelos fornecedores e integrações.">
    <Notice message={message} tone={tone} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Encomenda</th><th>Cliente</th><th>Fornecedor</th><th>Valor</th><th>Estado</th><th>Data</th></tr></thead><tbody>{transactions.loading ? <tr><td colSpan={6}><Empty>A carregar…</Empty></td></tr> : transactions.data?.transactions.length ? transactions.data.transactions.map((transaction) => <tr key={transaction.id}><td>{transaction.order_number}</td><td>{transaction.customer_name}</td><td>{transaction.provider}</td><td>{formatKz(transaction.amount_aoa)}</td><td><StatusBadge status={transaction.status} /></td><td>{formatDate(transaction.created_at)}</td></tr>) : <tr><td colSpan={6}><Empty>Ainda sem transações automáticas. Os pagamentos manuais ficam registados nos comprovativos.</Empty></td></tr>}</tbody></table></div>
  </AdminSection>;

  if (section === 'finance-reports') return <AdminSection title={title} subtitle={subtitle} actions={<button type="button" className="btn btn--outline btn--sm" onClick={() => downloadUrl('/api/admin/export?type=orders')}>Exportar encomendas</button>}>
    <Notice message={message} tone={tone} />
    <div className="admin-kpis admin-kpis--compact"><article><span>Faturação</span><strong>{formatKz(finance.data?.totals.revenue)}</strong><small>{finance.data?.totals.orders ?? 0} encomendas</small></article><article><span>Descontos</span><strong>{formatKz(finance.data?.totals.discounts)}</strong><small>Cupões aplicados</small></article><article><span>Portes</span><strong>{formatKz(finance.data?.totals.shipping)}</strong><small>Entregas físicas</small></article><article><span>Reembolsos</span><strong>{finance.data?.refunds.length ?? 0}</strong><small>Pedidos reembolsados</small></article></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Método</th><th>Encomendas</th><th>Receita</th></tr></thead><tbody>{finance.data?.byMethod.map((row) => <tr key={row.method}><td>{row.method.replaceAll('_', ' ')}</td><td>{row.orders}</td><td>{formatKz(row.revenue)}</td></tr>)}</tbody></table></div>
    <h3 className="admin-subheading">Reembolsos</h3>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Encomenda</th><th>Cliente</th><th>Total</th><th>Data</th></tr></thead><tbody>{finance.data?.refunds.length ? finance.data.refunds.map((refund) => <tr key={refund.order_number}><td>{refund.order_number}</td><td>{refund.customer_name}</td><td>{formatKz(refund.total_aoa)}</td><td>{formatDate(refund.updated_at)}</td></tr>) : <tr><td colSpan={4}><Empty>Sem reembolsos registados.</Empty></td></tr>}</tbody></table></div>
  </AdminSection>;

  if (section === 'refunds') return <AdminSection title="Reembolsos" subtitle="Encomendas com estado reembolsado.">
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Encomenda</th><th>Cliente</th><th>Total</th><th>Data</th></tr></thead><tbody>{finance.data?.refunds.length ? finance.data.refunds.map((refund) => <tr key={refund.order_number}><td>{refund.order_number}</td><td>{refund.customer_name}</td><td>{formatKz(refund.total_aoa)}</td><td>{formatDate(refund.updated_at)}</td></tr>) : <tr><td colSpan={4}><Empty>Sem reembolsos registados.</Empty></td></tr>}</tbody></table></div>
  </AdminSection>;

  if (section === 'proofs' || section === 'payments-pending' || section === 'payments-confirmed') return <AdminSection title={title} subtitle={subtitle} actions={<button type="button" className="btn btn--outline btn--sm" onClick={() => void proofs.reload()}>Atualizar</button>}>
    <Notice message={message} tone={tone} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Encomenda</th><th>Cliente</th><th>Ficheiro</th><th>Método</th><th>Valor</th><th>Estado</th><th>Ações</th></tr></thead><tbody>{proofs.loading ? <tr><td colSpan={7}><Empty>A carregar…</Empty></td></tr> : filteredProofs.length ? filteredProofs.map((proof) => <tr key={proof.id}><td>{proof.order_number}</td><td>{proof.customer_name}<small>{formatDate(proof.submitted_at)}</small></td><td><button type="button" className="admin-link" onClick={() => void openFile(proof.id)}>{proof.original_name}</button><small>{(proof.size_bytes / 1024).toFixed(0)} KB</small></td><td>{proof.payment_method_name ?? '—'}</td><td>{formatKz(proof.total_aoa)}</td><td><StatusBadge status={proof.status} />{proof.admin_note && <small>{proof.admin_note}</small>}</td><td><div className="admin-row-actions"><button type="button" className="btn btn--outline btn--sm" onClick={() => void openFile(proof.id)}>Ver</button><button type="button" className="btn btn--primary btn--sm" disabled={proof.status === 'approved'} onClick={() => void review(proof, 'approve')}>Aprovar</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void review(proof, 'request_new')}>Pedir novo</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void review(proof, 'reject')}>Rejeitar</button></div></td></tr>) : <tr><td colSpan={7}><Empty>Sem comprovativos nesta vista.</Empty></td></tr>}</tbody></table></div>
  </AdminSection>;

  return <AdminSection title={title} subtitle={subtitle} actions={<button type="button" className="btn btn--outline btn--sm" onClick={() => void methods.reload()}>Atualizar</button>}>
    <Notice message={message} tone={tone} />
    {section === 'receiving' && <div className="admin-note">Os dados abaixo são os únicos usados no checkout. A GameAO não reutiliza dados financeiros de outros projetos.</div>}
    <div className="admin-method-grid">
      {(methods.data?.methods ?? []).map((method) => {
        const kind = methodKind(method.code);
        const receiving = (typeof method.receiving_data_json === 'string' ? JSON.parse(method.receiving_data_json || '{}') : method.receiving_data_json) as Record<string, unknown> | null;
        const fields = RECEIVING_FIELDS[kind] ?? RECEIVING_FIELDS.mobile;
        const configured = fields.some((field) => receiving?.[field.key]);
        return (
          <article className="admin-method" key={method.id}>
            <header><div><strong>{method.name}</strong><small>{method.code} · ordem {method.sort_order}</small></div><Badge tone={method.is_active ? 'success' : 'muted'}>{method.is_active ? 'Ativo' : 'Inativo'}</Badge></header>
            <p>{method.description || 'Sem descrição.'}</p>
            <dl>{fields.map((field) => <div key={field.key}><dt>{field.label}</dt><dd>{String(receiving?.[field.key] ?? '—')}</dd></div>)}</dl>
            <footer><Badge tone={method.requires_proof ? 'info' : 'muted'}>{method.requires_proof ? 'Exige comprovativo' : 'Sem comprovativo'}</Badge><Badge tone={configured ? 'success' : 'warning'}>{configured ? 'Dados configurados' : 'Dados por configurar'}</Badge><button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing(method)}>Editar</button></footer>
          </article>
        );
      })}
    </div>
    <Modal open={Boolean(editing)} title={editing ? `Editar ${editing.name}` : ''} onClose={() => setEditing(null)} wide>
      {editing && <MethodForm method={editing} onChange={setEditing} onSave={() => void save(editing)} onCancel={() => setEditing(null)} />}
    </Modal>
  </AdminSection>;
}

function MethodForm({ method, onChange, onSave, onCancel }: { method: Method; onChange: (method: Method) => void; onSave: () => void; onCancel: () => void }) {
  const kind = methodKind(method.code);
  const fields = RECEIVING_FIELDS[kind] ?? RECEIVING_FIELDS.mobile;
  const receiving = (typeof method.receiving_data_json === 'string' ? JSON.parse(method.receiving_data_json || '{}') : method.receiving_data_json ?? {}) as Record<string, unknown>;
  const update = (patch: Partial<Method>) => onChange({ ...method, ...patch });
  const updateReceiving = (key: string, value: string) => update({ receiving_data_json: { ...receiving, [key]: value } });
  return (
    <form className="admin-form" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
      <div className="form-row"><Field label="Nome do método"><input required value={method.name} onChange={(event) => update({ name: event.target.value })} /></Field><Field label="Código interno"><input value={method.code} readOnly /></Field></div>
      <Field label="Descrição"><input value={method.description ?? ''} onChange={(event) => update({ description: event.target.value })} /></Field>
      <Field label="Mensagem ao cliente"><input value={method.customer_message ?? ''} onChange={(event) => update({ customer_message: event.target.value })} /></Field>
      <Field label="Instruções de pagamento"><textarea rows={4} value={method.instructions ?? ''} onChange={(event) => update({ instructions: event.target.value })} placeholder="Explique passo a passo como o cliente deve pagar…" /></Field>
      <h3>Dados de recebimento</h3>
      <div className="form-row">{fields.map((field) => <Field key={field.key} label={field.label}><input value={String(receiving?.[field.key] ?? '')} onChange={(event) => updateReceiving(field.key, event.target.value)} /></Field>)}</div>
      <div className="form-row"><Field label="Ordem no checkout"><input type="number" min="0" value={method.sort_order} onChange={(event) => update({ sort_order: Number(event.target.value) })} /></Field><Field label="Prazo (horas)"><input type="number" min="1" value={method.payment_deadline_hours} onChange={(event) => update({ payment_deadline_hours: Number(event.target.value) })} /></Field></div>
      <div className="admin-checks"><label className="admin-check"><input type="checkbox" checked={Boolean(method.is_active)} onChange={(event) => update({ is_active: event.target.checked ? 1 : 0 })} /> Ativo no checkout</label><label className="admin-check"><input type="checkbox" checked={Boolean(method.requires_proof)} onChange={(event) => update({ requires_proof: event.target.checked ? 1 : 0 })} /> Exige comprovativo</label></div>
      <div className="admin-form__actions"><button type="submit" className="btn btn--primary">Guardar método</button><button type="button" className="btn btn--outline" onClick={onCancel}>Cancelar</button></div>
    </form>
  );
}
