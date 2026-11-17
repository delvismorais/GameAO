import { useMemo, useState } from 'react';
import { AdminSection, Badge, Empty, Field, Modal, Notice, StatusBadge, Tabs, api, formatDate, useJson } from './ui';

type AdminAlert = { id: number; title: string; message: string; level: string; link?: string; is_read: number; created_at: string; event_key?: string };
type Template = { id: number; event_key: string; channel: string; name: string; subject: string; body: string; is_active: number };
type Delivery = { id: number; event_key: string; channel: string; recipient: string; status: string; subject?: string; error_message?: string; created_at: string };
type Tab = 'alerts' | 'templates' | 'deliveries' | 'test';

const CHANNELS = [{ id: 'email', label: 'Email' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'sms', label: 'SMS' }, { id: 'in_app', label: 'Notificação interna' }];
const VARIABLES = ['{{site_name}}', '{{site_url}}', '{{customer_name}}', '{{customer_email}}', '{{order_number}}', '{{order_total}}', '{{order_status}}', '{{order_items}}', '{{order_link}}', '{{payment_method}}', '{{payment_instructions}}', '{{reset_link}}', '{{admin_link}}', '{{affiliate_code}}', '{{commission}}', '{{payout_amount}}', '{{admin_note}}'];

export function AdminNotifications() {
  const [tab, setTab] = useState<Tab>('alerts');
  return <AdminSection title="Centro de notificações" subtitle="Alertas administrativos, modelos por evento e histórico de entregas em email, SMS, WhatsApp e notificações internas." actions={<Tabs tabs={[{ id: 'alerts', label: 'Alertas' }, { id: 'templates', label: 'Modelos' }, { id: 'deliveries', label: 'Entregas' }, { id: 'test', label: 'Enviar teste' }]} active={tab} onChange={(id) => setTab(id as Tab)} />}>
    {tab === 'alerts' && <Alerts />}
    {tab === 'templates' && <Templates />}
    {tab === 'deliveries' && <Deliveries />}
    {tab === 'test' && <TestSender />}
  </AdminSection>;
}

function Alerts() {
  const { data, loading, reload } = useJson<{ notifications: AdminAlert[] }>('/api/admin/notifications');
  const [message, setMessage] = useState('');
  const markAll = async () => { const result = await api('/api/admin/notifications/read-all', { method: 'POST' }); setMessage(result.ok ? 'Todos os alertas marcados como lidos.' : result.error ?? 'Falha.'); if (result.ok) await reload(); };
  const markOne = async (id: number) => { await api(`/api/admin/notifications/${id}/read`, { method: 'PATCH' }); await reload(); };
  const remove = async (id: number) => { await api(`/api/admin/notifications/${id}`, { method: 'DELETE' }); await reload(); };
  return <div>
    <Notice message={message} tone={message.includes('Falha') ? 'error' : 'success'} />
    <div className="admin-section__inline-actions"><button type="button" className="btn btn--outline btn--sm" onClick={() => void markAll()}>Marcar todas como lidas</button><button type="button" className="btn btn--outline btn--sm" onClick={() => void reload()}>Atualizar</button></div>
    {loading ? <p className="admin-state">A carregar…</p> : data?.notifications.length ? <ul className="admin-alert-list">{data.notifications.map((alert) => <li key={alert.id} className={alert.is_read ? '' : 'is-unread'}><div><strong>{alert.title}</strong><p>{alert.message}</p><small>{formatDate(alert.created_at)}{alert.event_key ? ` · ${alert.event_key}` : ''}</small></div><div className="admin-row-actions"><Badge tone={alert.level === 'warning' ? 'warning' : alert.level === 'error' ? 'danger' : alert.level === 'success' ? 'success' : 'info'}>{alert.level}</Badge>{!alert.is_read && <button type="button" className="btn btn--outline btn--sm" onClick={() => void markOne(alert.id)}>Marcar lida</button>}<button type="button" className="btn btn--outline btn--sm" onClick={() => void remove(alert.id)}>Eliminar</button></div></li>)}</ul> : <Empty>Sem alertas administrativos.</Empty>}
  </div>;
}

function Templates() {
  const { data, loading, reload } = useJson<{ templates: Template[] }>('/api/admin/notification-templates');
  const [editing, setEditing] = useState<Template | null>(null);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error'>('success');
  const grouped = useMemo(() => { const map = new Map<string, Template[]>(); for (const template of data?.templates ?? []) { const list = map.get(template.event_key) ?? []; list.push(template); map.set(template.event_key, list); } return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])); }, [data]);
  const save = async (template: Template) => { const result = await api(`/api/admin/notification-templates/${template.id}`, { method: 'PUT', body: JSON.stringify({ name: template.name, subject: template.subject, body: template.body, isActive: Boolean(template.is_active) }) }); setMessage(result.ok ? 'Modelo atualizado.' : result.error ?? 'Falha ao guardar.'); setTone(result.ok ? 'success' : 'error'); if (result.ok) { setEditing(null); await reload(); } };
  return <div>
    <Notice message={message} tone={tone} />
    {loading ? <p className="admin-state">A carregar modelos…</p> : <div className="admin-template-list">{grouped.map(([eventKey, templates]) => <article key={eventKey}><header><strong>{eventKey}</strong><div>{templates.map((template) => <Badge key={template.id} tone={template.is_active ? 'success' : 'muted'}>{CHANNELS.find((channel) => channel.id === template.channel)?.label ?? template.channel}{template.is_active ? '' : ' · inativo'}</Badge>)}</div></header><div className="admin-template-list__rows">{templates.map((template) => <button type="button" key={template.id} onClick={() => setEditing(template)}><span>{template.name}</span><small>{template.subject || template.body.slice(0, 80)}</small><em>Editar</em></button>)}</div></article>)}</div>}
    <Modal open={Boolean(editing)} title={editing ? `Modelo ${editing.event_key} · ${editing.channel}` : ''} onClose={() => setEditing(null)} wide>
      {editing && <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save(editing); }}>
        <Field label="Nome"><input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></Field>
        <Field label="Assunto / título"><input value={editing.subject} onChange={(event) => setEditing({ ...editing, subject: event.target.value })} /></Field>
        <Field label="Conteúdo" hint={`Variáveis disponíveis: ${VARIABLES.join(' ')}`}><textarea rows={10} value={editing.body} onChange={(event) => setEditing({ ...editing, body: event.target.value })} /></Field>
        <label className="admin-check"><input type="checkbox" checked={Boolean(editing.is_active)} onChange={(event) => setEditing({ ...editing, is_active: event.target.checked ? 1 : 0 })} /> Modelo ativo</label>
        <div className="admin-preview" dangerouslySetInnerHTML={{ __html: editing.body.replace(/\{\{\s*site_name\s*\}\}/g, 'GameAO').replace(/\{\{\s*customer_name\s*\}\}/g, 'Cliente GameAO').replace(/\{\{\s*order_number\s*\}\}/g, 'GA123').replace(/\{\{\s*order_total\s*\}\}/g, '$25.00').replace(/\{\{\s*order_link\s*\}\}/g, '#').replace(/\{\{\s*order_items\s*\}\}/g, '<ul><li>Produto × 1 — $25.00</li></ul>') }} />
        <div className="admin-form__actions"><button type="submit" className="btn btn--primary">Guardar modelo</button><button type="button" className="btn btn--outline" onClick={() => setEditing(null)}>Cancelar</button></div>
      </form>}
    </Modal>
  </div>;
}

function Deliveries() {
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState('all');
  const { data, loading } = useJson<{ deliveries: Delivery[]; summary: Array<{ channel: string; status: string; total: string }> }>(`/api/admin/notification-deliveries?channel=${channel}&status=${status}&limit=200`, [channel, status]);
  return <div>
    <div className="admin-filterbar"><select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="all">Todos os canais</option>{CHANNELS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos os estados</option><option value="sent">Enviado</option><option value="failed">Falhou</option><option value="not_configured">Não configurado</option><option value="skipped">Ignorado</option></select></div>
    <div className="admin-kpis admin-kpis--compact">{(data?.summary ?? []).slice(0, 6).map((row) => <article key={`${row.channel}-${row.status}`}><span>{row.channel} · {row.status}</span><strong>{row.total}</strong><small>últimos 30 dias</small></article>)}</div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Evento</th><th>Canal</th><th>Destinatário</th><th>Assunto</th><th>Estado</th><th>Data</th></tr></thead><tbody>{loading ? <tr><td colSpan={6}><Empty>A carregar…</Empty></td></tr> : data?.deliveries.length ? data.deliveries.map((delivery) => <tr key={delivery.id}><td>{delivery.event_key}</td><td>{delivery.channel}</td><td>{delivery.recipient}</td><td>{delivery.subject ?? '—'}{delivery.error_message && <small>{delivery.error_message}</small>}</td><td><StatusBadge status={delivery.status} /></td><td>{formatDate(delivery.created_at)}</td></tr>) : <tr><td colSpan={6}><Empty>Sem entregas registadas.</Empty></td></tr>}</tbody></table></div>
  </div>;
}

function TestSender() {
  const { data } = useJson<{ templates: Template[] }>('/api/admin/notification-templates');
  const [eventKey, setEventKey] = useState('order.created');
  const [channel, setChannel] = useState('email');
  const [to, setTo] = useState('');
  const [result, setResult] = useState<{ tone: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const events = useMemo(() => [...new Set((data?.templates ?? []).map((template) => template.event_key))].sort(), [data]);
  const send = async () => {
    const response = await api<{ status: string; error?: string }>('/api/admin/notifications/test', { method: 'POST', body: JSON.stringify({ eventKey, channel, to }) });
    if (!response.ok) { setResult({ tone: 'error', message: response.error ?? 'Falha no envio.' }); return; }
    const status = response.data.status;
    setResult(status === 'sent' ? { tone: 'success', message: 'Notificação de teste enviada.' } : { tone: 'warning', message: status === 'not_configured' ? 'Canal ainda não configurado. Configure as variáveis de ambiente no Render.' : `Estado: ${status}. ${response.data.error ?? ''}` });
  };
  return <form className="admin-form admin-form--narrow" onSubmit={(event) => { event.preventDefault(); void send(); }}>
    <Field label="Evento"><select value={eventKey} onChange={(event) => setEventKey(event.target.value)}>{events.map((event) => <option key={event} value={event}>{event}</option>)}</select></Field>
    <Field label="Canal"><select value={channel} onChange={(event) => setChannel(event.target.value)}>{CHANNELS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
    <Field label="Destinatário" hint="Para SMS, use um número com indicativo ou os 9 dígitos nacionais."><input value={to} onChange={(event) => setTo(event.target.value)} placeholder={channel === 'sms' ? '973929712' : 'email@exemplo.com'} /></Field>
    <button type="submit" className="btn btn--primary">Enviar notificação de teste</button>
    {result && <Notice message={result.message} tone={result.tone} />}
    <p className="admin-message">O email requer SMTP, o WhatsApp requer WhatsApp Business API e o SMS utiliza a conta TelcoSMS de produção. As notificações internas funcionam sempre.</p>
  </form>;
}
