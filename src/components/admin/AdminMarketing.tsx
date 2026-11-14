import { useState } from 'react';
import { AdminOperationsManager } from './AdminOperationsManager';
import { AdminSection, Badge, Empty, Field, Modal, Notice, api, formatDate, formatKz, useJson } from './ui';
import type { AdminSectionId } from './adminNav';

type Coupon = { id: number; code: string; description: string; discount_type: string; discount_value: number; min_order_aoa: number; max_discount_aoa?: number | null; usage_limit?: number | null; used_count: number; per_user_limit: number; starts_at?: string; ends_at?: string; is_active: number };
type Affiliate = { id: number; user_name: string; user_email: string; code: string; commission_rate: number; status: string; balance_aoa: number; total_earned_aoa: number; total_paid_aoa: number; clicks: number; referral_count: number; created_at: string };
type Payout = { id: number; user_name: string; code: string; amount_aoa: number; method?: string; reference?: string; status: string; created_at: string };
type Social = { label: string; href: string; icon: string };

export function AdminMarketing({ section }: { section: AdminSectionId }) {
  if (section === 'campaigns') return <AdminOperationsManager key="campaigns" initialModule="marketing" />;
  if (section === 'emails') return <AdminOperationsManager key="emails" initialModule="email" />;
  if (section === 'affiliates') return <AdminAffiliates />;
  if (section === 'social') return <AdminSocial />;
  return <AdminCoupons promotions={section === 'promotions'} />;
}

function AdminCoupons({ promotions }: { promotions: boolean }) {
  const { data, loading, reload } = useJson<{ coupons: Coupon[] }>('/api/admin/coupons');
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error'>('success');
  const empty = { code: '', description: '', type: 'percent', value: '', minOrderAoa: '', maxDiscountAoa: '', usageLimit: '', perUserLimit: '1', startsAt: '', endsAt: '', isActive: true };
  const [form, setForm] = useState(empty);
  const openEdit = (coupon: Coupon) => { setForm({ code: coupon.code, description: coupon.description, type: coupon.discount_type, value: String(coupon.discount_value), minOrderAoa: String(coupon.min_order_aoa ?? ''), maxDiscountAoa: coupon.max_discount_aoa == null ? '' : String(coupon.max_discount_aoa), usageLimit: coupon.usage_limit == null ? '' : String(coupon.usage_limit), perUserLimit: String(coupon.per_user_limit), startsAt: coupon.starts_at?.slice(0, 10) ?? '', endsAt: coupon.ends_at?.slice(0, 10) ?? '', isActive: Boolean(coupon.is_active) }); setEditing(coupon); };
  const save = async () => {
    const payload = { code: form.code, description: form.description, type: form.type, value: Number(form.value), minOrderAoa: form.minOrderAoa ? Number(form.minOrderAoa) : 0, maxDiscountAoa: form.maxDiscountAoa ? Number(form.maxDiscountAoa) : null, usageLimit: form.usageLimit ? Number(form.usageLimit) : null, perUserLimit: Number(form.perUserLimit || 1), startsAt: form.startsAt || null, endsAt: form.endsAt || null, isActive: form.isActive };
    const result = editing ? await api(`/api/admin/coupons/${editing.id}`, { method: 'PUT', body: JSON.stringify(payload) }) : await api('/api/admin/coupons', { method: 'POST', body: JSON.stringify(payload) });
    setMessage(result.ok ? 'Cupão guardado.' : result.error ?? 'Falha ao guardar.'); setTone(result.ok ? 'success' : 'error'); if (result.ok) { setCreating(false); setEditing(null); await reload(); }
  };
  const remove = async (coupon: Coupon) => { if (!window.confirm(`Eliminar o cupão ${coupon.code}?`)) return; const result = await api(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' }); setMessage(result.ok ? 'Cupão eliminado.' : result.error ?? 'Falha ao eliminar.'); if (result.ok) await reload(); };
  return <AdminSection title={promotions ? 'Promoções e cupões' : 'Cupões'} subtitle="Cupões validados no servidor no momento da encomenda. O desconto nunca é calculado no navegador." actions={<button type="button" className="btn btn--primary btn--sm" onClick={() => { setForm(empty); setCreating(true); }}>Novo cupão</button>}>
    <Notice message={message} tone={tone} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Código</th><th>Desconto</th><th>Mínimo</th><th>Utilizações</th><th>Validade</th><th>Estado</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={7}><Empty>A carregar…</Empty></td></tr> : data?.coupons.length ? data.coupons.map((coupon) => <tr key={coupon.id}><td><strong>{coupon.code}</strong><small>{coupon.description}</small></td><td>{coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : formatKz(coupon.discount_value)}</td><td>{formatKz(coupon.min_order_aoa)}</td><td>{coupon.used_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}</td><td>{coupon.ends_at ? formatDate(coupon.ends_at, false) : 'Sem fim'}</td><td><Badge tone={coupon.is_active ? 'success' : 'muted'}>{coupon.is_active ? 'Ativo' : 'Inativo'}</Badge></td><td><div className="admin-row-actions"><button type="button" className="btn btn--outline btn--sm" onClick={() => openEdit(coupon)}>Editar</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void remove(coupon)}>Eliminar</button></div></td></tr>) : <tr><td colSpan={7}><Empty>Sem cupões criados.</Empty></td></tr>}</tbody></table></div>
    <Modal open={creating || Boolean(editing)} title={editing ? `Editar ${editing.code}` : 'Novo cupão'} onClose={() => { setCreating(false); setEditing(null); }}>
      <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <div className="form-row"><Field label="Código *"><input required value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} /></Field><Field label="Tipo"><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="percent">Percentagem</option><option value="fixed">Valor fixo (USD)</option></select></Field></div>
        <Field label="Descrição"><input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
        <div className="form-row"><Field label={form.type === 'percent' ? 'Desconto (%)' : 'Desconto'}><input required type="number" min="0" step="0.01" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} /></Field><Field label="Mínimo"><input type="number" min="0" value={form.minOrderAoa} onChange={(event) => setForm({ ...form, minOrderAoa: event.target.value })} /></Field></div>
        <div className="form-row"><Field label="Desconto máximo"><input type="number" min="0" value={form.maxDiscountAoa} onChange={(event) => setForm({ ...form, maxDiscountAoa: event.target.value })} /></Field><Field label="Limite de utilizações"><input type="number" min="1" value={form.usageLimit} onChange={(event) => setForm({ ...form, usageLimit: event.target.value })} /></Field></div>
        <div className="form-row"><Field label="Início"><input type="date" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></Field><Field label="Fim"><input type="date" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></Field></div>
        <label className="admin-check"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Ativo</label>
        <div className="admin-form__actions"><button type="submit" className="btn btn--primary">Guardar cupão</button><button type="button" className="btn btn--outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</button></div>
      </form>
    </Modal>
  </AdminSection>;
}

function AdminAffiliates() {
  const { data, loading, reload } = useJson<{ affiliates: Affiliate[]; payouts: Payout[] }>('/api/admin/affiliates');
  const [paying, setPaying] = useState<Affiliate | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error'>('success');
  const update = async (affiliate: Affiliate, patch: Record<string, unknown>) => { const result = await api(`/api/admin/affiliates/${affiliate.id}`, { method: 'PUT', body: JSON.stringify(patch) }); setMessage(result.ok ? 'Afiliado atualizado.' : result.error ?? 'Falha ao atualizar.'); setTone(result.ok ? 'success' : 'error'); if (result.ok) await reload(); };
  const pay = async () => {
    if (!paying) return;
    const result = await api(`/api/admin/affiliates/${paying.id}/payouts`, { method: 'POST', body: JSON.stringify({ amount: Number(amount), method: 'Transferência bancária' }) });
    setMessage(result.ok ? 'Pagamento registado e afiliado notificado.' : result.error ?? 'Falha no pagamento.'); setTone(result.ok ? 'success' : 'error'); if (result.ok) { setPaying(null); setAmount(''); await reload(); }
  };
  return <AdminSection title="Afiliados" subtitle="Códigos, comissões e pagamentos. A comissão é creditada quando o pagamento da encomenda é confirmado.">
    <Notice message={message} tone={tone} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Afiliado</th><th>Código</th><th>Comissão</th><th>Saldo</th><th>Ganho total</th><th>Cliques</th><th>Estado</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={8}><Empty>A carregar…</Empty></td></tr> : data?.affiliates.length ? data.affiliates.map((affiliate) => <tr key={affiliate.id}><td>{affiliate.user_name}<small>{affiliate.user_email}</small></td><td><strong>{affiliate.code}</strong></td><td>{affiliate.commission_rate}%</td><td>{formatKz(affiliate.balance_aoa)}</td><td>{formatKz(affiliate.total_earned_aoa)}<small>{affiliate.referral_count} indicações</small></td><td>{affiliate.clicks}</td><td><Badge tone={affiliate.status === 'active' ? 'success' : 'danger'}>{affiliate.status}</Badge></td><td><div className="admin-row-actions"><button type="button" className="btn btn--primary btn--sm" disabled={Number(affiliate.balance_aoa) <= 0} onClick={() => { setPaying(affiliate); setAmount(String(affiliate.balance_aoa)); }}>Pagar</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void update(affiliate, { status: affiliate.status === 'active' ? 'suspended' : 'active' })}>{affiliate.status === 'active' ? 'Suspender' : 'Ativar'}</button></div></td></tr>) : <tr><td colSpan={8}><Empty>Ainda não existem afiliados.</Empty></td></tr>}</tbody></table></div>
    <h3 className="admin-subheading">Histórico de pagamentos</h3>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Afiliado</th><th>Código</th><th>Valor</th><th>Método</th><th>Estado</th><th>Data</th></tr></thead><tbody>{data?.payouts.length ? data.payouts.map((payout) => <tr key={payout.id}><td>{payout.user_name}</td><td>{payout.code}</td><td>{formatKz(payout.amount_aoa)}</td><td>{payout.method ?? '—'}</td><td><Badge tone={payout.status === 'paid' ? 'success' : 'warning'}>{payout.status}</Badge></td><td>{formatDate(payout.created_at)}</td></tr>) : <tr><td colSpan={6}><Empty>Sem pagamentos registados.</Empty></td></tr>}</tbody></table></div>
    <Modal open={Boolean(paying)} title={paying ? `Pagar comissões a ${paying.user_name}` : ''} onClose={() => setPaying(null)}>
      <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void pay(); }}>
        <Field label="Valor" hint={`Saldo disponível: ${formatKz(paying?.balance_aoa)}`}><input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></Field>
        <div className="admin-form__actions"><button type="submit" className="btn btn--primary">Confirmar pagamento</button><button type="button" className="btn btn--outline" onClick={() => setPaying(null)}>Cancelar</button></div>
      </form>
    </Modal>
  </AdminSection>;
}

function AdminSocial() {
  const settings = useJson<{ settings: Record<string, any> }>('/api/admin/site-settings');
  const [draft, setDraft] = useState<Social[] | null>(null);
  const [message, setMessage] = useState('');
  const links = draft ?? (Array.isArray(settings.data?.settings?.social_links) ? settings.data.settings.social_links as Social[] : []);
  const save = async () => { const result = await api('/api/admin/site-settings/social_links', { method: 'PUT', body: JSON.stringify({ value: links }) }); setMessage(result.ok ? 'Redes sociais atualizadas.' : result.error ?? 'Falha ao guardar.'); if (result.ok) await settings.reload(); };
  return <AdminSection title="Redes sociais" subtitle="Ligações apresentadas no cabeçalho e rodapé do website." actions={<button type="button" className="btn btn--outline btn--sm" onClick={() => setDraft([...links, { label: '', href: '', icon: 'facebook' }])}>Adicionar rede</button>}>
    <Notice message={message} tone={message.includes('Falha') ? 'error' : 'success'} />
    <div className="admin-form">{links.map((link, index) => <div className="form-row" key={index}><Field label="Nome"><input value={link.label} onChange={(event) => { const next = [...links]; next[index] = { ...link, label: event.target.value }; setDraft(next); }} /></Field><Field label="URL"><input value={link.href} onChange={(event) => { const next = [...links]; next[index] = { ...link, href: event.target.value }; setDraft(next); }} /></Field><Field label="Ícone"><select value={link.icon} onChange={(event) => { const next = [...links]; next[index] = { ...link, icon: event.target.value }; setDraft(next); }}><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="whatsapp">WhatsApp</option><option value="twitter">X / Twitter</option><option value="telegram">Telegram</option></select></Field><button type="button" className="btn btn--outline btn--sm" onClick={() => setDraft(links.filter((_, position) => position !== index))}>Remover</button></div>)}<button type="button" className="btn btn--primary" onClick={() => void save()}>Guardar redes sociais</button></div>
  </AdminSection>;
}
