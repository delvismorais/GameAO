import { useEffect, useMemo, useState } from 'react';
import { AdminIcon } from './AdminIcon';
import { ManualEmail, ManualSms } from './ManualCommunication';
import { AdminSection, Badge, Empty, Field, Modal, Notice, StatusBadge, Tabs, api, formatDate, formatKz, useJson } from './ui';

type AdminAlert = { id: number; title: string; message: string; level: string; link?: string; is_read: number; created_at: string; event_key?: string };
type Template = { id: number; event_key: string; automatic_event_key?: string | null; channel: string; name: string; subject: string; body: string; is_active: number };
type Delivery = { id: number; event_key: string; channel: string; recipient: string; status: string; subject?: string; error_message?: string; order_number?: string; created_at: string };
type OrderLookup = {
  order: { id: number; order_number: string; user_id?: number | null; customer_name: string; customer_email: string; customer_phone?: string | null; total_aoa: number; status: string; payment_status: string; payment_method?: string | null; created_at: string };
  items: Array<{ product_name: string; quantity: number; subtotal_aoa: number; player_id?: string | null; player_nickname?: string | null }>;
  notifications: Delivery[];
};
type Campaign = { id: number; name: string; subject: string; body_html: string; body_text: string; audience_status: string; status: string; recipient_count: number; sent_count: number; created_at: string; sent_at?: string | null };
type Tab = 'alerts' | 'templates' | 'deliveries' | 'manual' | 'manual-email' | 'manual-sms' | 'campaigns' | 'test';

const CHANNELS = [
  { id: 'email', label: 'Email', icon: 'mail' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'mail' },
  { id: 'sms', label: 'SMS', icon: 'mail' },
  { id: 'in_app', label: 'Notificação interna', icon: 'bell' },
] as const;
const VARIABLES = ['{{site_name}}', '{{site_url}}', '{{site_email}}', '{{site_phone}}', '{{customer_name}}', '{{customer_email}}', '{{customer_phone}}', '{{order_number}}', '{{order_total}}', '{{order_status}}', '{{order_items}}', '{{order_link}}', '{{payment_method}}', '{{payment_instructions}}', '{{admin_link}}', '{{reset_link}}', '{{affiliate_code}}', '{{commission_rate}}', '{{commission}}', '{{payout_amount}}', '{{admin_note}}'];
const DEFAULT_BODY = '<p>Olá {{customer_name}},</p><p>Temos uma atualização sobre a encomenda <strong>{{order_number}}</strong>.</p><p>Equipa {{site_name}}</p>';
const EMPTY_TEMPLATE: Template = { id: 0, event_key: 'order.created', automatic_event_key: null, channel: 'email', name: '', subject: '', body: DEFAULT_BODY, is_active: 1 };

function channelLabel(channel: string): string { return CHANNELS.find((item) => item.id === channel)?.label ?? channel; }
function previewTemplate(body: string): string {
  return body
    .replace(/\{\{\s*site_name\s*\}\}/g, 'GameAO')
    .replace(/\{\{\s*customer_name\s*\}\}/g, 'Cliente GameAO')
    .replace(/\{\{\s*customer_email\s*\}\}/g, 'cliente@exemplo.com')
    .replace(/\{\{\s*customer_phone\s*\}\}/g, '973 929 712')
    .replace(/\{\{\s*order_number\s*\}\}/g, 'GA123')
    .replace(/\{\{\s*order_total\s*\}\}/g, '25.000,00 Kz')
    .replace(/\{\{\s*order_status\s*\}\}/g, 'Em processamento')
    .replace(/\{\{\s*payment_method\s*\}\}/g, 'Transferência bancária')
    .replace(/\{\{\s*order_link\s*\}\}/g, '#')
    .replace(/\{\{\s*admin_link\s*\}\}/g, '#')
    .replace(/\{\{\s*order_items\s*\}\}/g, '<ul><li>Produto GameAO × 1 — 25.000,00 Kz</li></ul>');
}

export function AdminNotifications({ initialTab = 'alerts' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  return <AdminSection title="Centro de comunicação" subtitle="Procure encomendas, componha mensagens manuais, edite modelos e acompanhe email, SMS, WhatsApp e notificações internas." actions={<Tabs tabs={[{ id: 'alerts', label: 'Alertas' }, { id: 'manual', label: 'Por encomenda' }, { id: 'manual-email', label: 'Email manual' }, { id: 'manual-sms', label: 'SMS manual' }, { id: 'templates', label: 'Modelos' }, { id: 'deliveries', label: 'Entregas' }, { id: 'campaigns', label: 'Campanhas' }, { id: 'test', label: 'Teste' }]} active={tab} onChange={(id) => setTab(id as Tab)} />}>
    {tab === 'alerts' && <Alerts />}
    {tab === 'manual' && <ManualSender />}
    {tab === 'manual-email' && <ManualEmail />}
    {tab === 'manual-sms' && <ManualSms />}
    {tab === 'templates' && <Templates />}
    {tab === 'deliveries' && <Deliveries />}
    {tab === 'campaigns' && <Campaigns onOpenEmail={() => setTab('manual-email')} onOpenSms={() => setTab('manual-sms')} />}
    {tab === 'test' && <TestSender />}
  </AdminSection>;
}

function Alerts() {
  const { data, loading, reload } = useJson<{ notifications: AdminAlert[] }>('/api/admin/notifications');
  const [message, setMessage] = useState('');
  const markAll = async () => { const result = await api('/api/admin/notifications/read-all', { method: 'POST' }); setMessage(result.ok ? 'Todos os alertas marcados como lidos.' : result.error ?? 'Falha.'); if (result.ok) await reload(); };
  const markOne = async (id: number) => { await api(`/api/admin/notifications/${id}/read`, { method: 'PATCH' }); await reload(); };
  const remove = async (id: number) => { if (!window.confirm('Eliminar este alerta?')) return; await api(`/api/admin/notifications/${id}`, { method: 'DELETE' }); await reload(); };
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
  const automaticEvents = useMemo(() => [...new Set((data?.templates ?? []).map((template) => template.event_key).filter((eventKey) => !eventKey.startsWith('email.template.')))].sort(), [data]);
  const save = async (template: Template) => {
    const payload = { eventKey: template.event_key, automaticEventKey: template.automatic_event_key ?? '', channel: template.channel, name: template.name, subject: template.subject, body: template.body, isActive: Boolean(template.is_active) };
    const result = template.id ? await api(`/api/admin/notification-templates/${template.id}`, { method: 'PUT', body: JSON.stringify(payload) }) : await api('/api/admin/notification-templates', { method: 'POST', body: JSON.stringify(payload) });
    setMessage(result.ok ? 'Modelo guardado.' : result.error ?? 'Falha ao guardar.'); setTone(result.ok ? 'success' : 'error'); if (result.ok) { setEditing(null); await reload(); }
  };
  const remove = async (template: Template) => { if (!window.confirm(`Eliminar o modelo “${template.name || template.event_key}”?`)) return; const result = await api(`/api/admin/notification-templates/${template.id}`, { method: 'DELETE' }); setMessage(result.ok ? 'Modelo eliminado.' : result.error ?? 'Falha ao eliminar.'); setTone(result.ok ? 'success' : 'error'); if (result.ok) await reload(); };
  return <div>
    <div className="admin-section__inline-actions"><button type="button" className="btn btn--primary btn--sm" onClick={() => setEditing({ ...EMPTY_TEMPLATE })}>Novo modelo</button></div>
    <Notice message={message} tone={tone} />
    <p className="admin-message">Variáveis disponíveis: {VARIABLES.join(' · ')}</p>
    {loading ? <p className="admin-state">A carregar modelos…</p> : <div className="admin-template-list">{grouped.map(([eventKey, templates]) => <article key={eventKey}><header><strong>{eventKey}</strong><div>{templates.map((template) => <Badge key={template.id} tone={template.is_active ? 'success' : 'muted'}>{channelLabel(template.channel)}{template.is_active ? '' : ' · inativo'}</Badge>)}</div></header><div className="admin-template-list__rows">{templates.map((template) => <div className="admin-template-row" key={template.id}><button type="button" onClick={() => setEditing(template)}><span>{template.name}</span><small>{template.automatic_event_key ? `Automático: ${template.automatic_event_key} · ` : ''}{template.subject || template.body.slice(0, 100)}</small><em>Editar</em></button><button type="button" className="admin-link admin-template-row__delete" onClick={() => void remove(template)}>Eliminar</button></div>)}</div></article>)}</div>}
    <Modal open={Boolean(editing)} title={editing ? `${editing.id ? 'Editar' : 'Novo'} modelo de comunicação` : ''} onClose={() => setEditing(null)} wide>
      {editing && <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save(editing); }}>
        <div className="form-row"><Field label="Evento *" hint={editing.channel === 'sms' ? 'Os modelos SMS ativos são escolhidos automaticamente pela chave deste evento; não precisam de uma associação separada.' : undefined}><input required value={editing.event_key} disabled={Boolean(editing.id)} onChange={(event) => setEditing({ ...editing, event_key: event.target.value })} placeholder="order.processing" /></Field><Field label="Canal *"><select value={editing.channel} disabled={Boolean(editing.id)} onChange={(event) => setEditing({ ...editing, channel: event.target.value })}>{CHANNELS.map((channel) => <option key={channel.id} value={channel.id}>{channel.label}</option>)}</select></Field></div>
        <Field label="Nome"><input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} placeholder="Atualização de encomenda" /></Field>
        {editing.channel === 'email' && <Field label="Evento automático (opcional)" hint="Ao ocorrer este evento, o motor de notificações usa este modelo em vez do modelo email diretamente associado ao evento."><select value={editing.automatic_event_key ?? ''} onChange={(event) => setEditing({ ...editing, automatic_event_key: event.target.value || null })}><option value="">Não associar a um evento automático</option>{automaticEvents.map((eventKey) => <option key={eventKey} value={eventKey}>{eventKey}</option>)}</select></Field>}
        <Field label="Assunto / título"><input value={editing.subject} onChange={(event) => setEditing({ ...editing, subject: event.target.value })} placeholder="Atualização da encomenda {{order_number}}" /></Field>
        <Field label="Conteúdo" hint={`Variáveis: ${VARIABLES.join(' ')}`}><textarea rows={10} value={editing.body} onChange={(event) => setEditing({ ...editing, body: event.target.value })} /></Field>
        <label className="admin-check"><input type="checkbox" checked={Boolean(editing.is_active)} onChange={(event) => setEditing({ ...editing, is_active: event.target.checked ? 1 : 0 })} /> Modelo ativo</label>
        <iframe className="admin-preview-frame" title="Pré-visualização do modelo" sandbox="" srcDoc={previewTemplate(editing.body)} />
        <div className="admin-form__actions"><button type="submit" className="btn btn--primary">Guardar modelo</button><button type="button" className="btn btn--outline" onClick={() => setEditing(null)}>Cancelar</button></div>
      </form>}
    </Modal>
  </div>;
}

function ManualSender() {
  const { data: templateData } = useJson<{ templates: Template[] }>('/api/admin/notification-templates');
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<OrderLookup | null>(null);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState('email');
  const [eventKey, setEventKey] = useState('order.processing');
  const [templateId, setTemplateId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState(DEFAULT_BODY);
  const [message, setMessage] = useState<{ tone: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [job, setJob] = useState<{ id: string; status: string } | null>(null);
  const templates = templateData?.templates ?? [];
  const events = useMemo(() => [...new Set(templates.map((template) => template.event_key))].sort(), [templates]);
  const channelTemplates = useMemo(() => templates.filter((template) => template.channel === channel), [templates, channel]);
  const applyTemplate = (template: Template | undefined) => { if (!template) return; setTemplateId(String(template.id)); setEventKey(template.event_key); setSubject(template.subject); setBody(template.body); };
  useEffect(() => {
    if (!job || ['completed', 'failed'].includes(job.status)) return;
    let active = true;
    let timer = 0;
    const poll = async () => {
      const result = await api<{ job: { status: string; result?: { status?: string; error?: string } | null; error?: string | null } }>(`/api/admin/notification-jobs/${job.id}`);
      if (!active) return;
      if (result.ok && result.data.job) {
        const current = result.data.job;
        setJob((old) => old ? { ...old, status: current.status } : old);
        if (current.status === 'completed' || current.status === 'failed') {
          const tone = current.status === 'failed' || current.result?.status === 'failed' ? 'error' : current.result?.status === 'sent' ? 'success' : 'warning';
          setMessage({ tone, text: current.error || current.result?.error || (tone === 'success' ? 'Mensagem enviada e registada no histórico.' : 'Envio concluído sem confirmação de sucesso; consulte o histórico de entregas.') });
          return;
        }
        setMessage({ tone: 'info', text: current.status === 'processing' ? 'A mensagem está a ser processada em segundo plano…' : 'Mensagem aceite e aguardando processamento.' });
      }
      timer = window.setTimeout(poll, 1600);
    };
    timer = window.setTimeout(poll, 700);
    return () => { active = false; window.clearTimeout(timer); };
  }, [job?.id, job?.status]);
  const lookup = async () => {
    if (orderNumber.trim().length < 2) { setMessage({ tone: 'error', text: 'Indique o número da encomenda.' }); return; }
    setLoading(true); setMessage(null);
    const result = await api<OrderLookup>(`/api/admin/notification-orders/lookup?orderNumber=${encodeURIComponent(orderNumber.trim())}`);
    if (!result.ok) { setOrder(null); setMessage({ tone: 'error', text: result.error ?? 'Encomenda não encontrada.' }); setLoading(false); return; }
    setOrder(result.data); setOrderNumber(result.data.order.order_number);
    const defaultTemplate = templates.find((template) => template.event_key === eventKey && template.channel === channel) ?? channelTemplates[0];
    if (defaultTemplate) applyTemplate(defaultTemplate);
    setRecipient(channel === 'email' ? result.data.order.customer_email : result.data.order.customer_phone ?? '');
    setLoading(false);
  };
  const changeChannel = (next: string) => { setChannel(next); const nextTemplate = templates.find((template) => template.event_key === eventKey && template.channel === next) ?? templates.find((template) => template.channel === next); if (nextTemplate) applyTemplate(nextTemplate); if (order) setRecipient(next === 'email' ? order.order.customer_email : next === 'in_app' ? '' : order.order.customer_phone ?? ''); };
  const changeEvent = (next: string) => { setEventKey(next); const nextTemplate = templates.find((template) => template.event_key === next && template.channel === channel); if (nextTemplate) applyTemplate(nextTemplate); };
  const send = async () => {
    if (!order || !body.trim()) { setMessage({ tone: 'error', text: 'Pesquise uma encomenda e escreva o conteúdo.' }); return; }
    setMessage(null); setJob(null); setSending(true);
    const result = await api<{ jobId?: string }>('/api/admin/notifications/manual', { method: 'POST', body: JSON.stringify({ orderNumber: order.order.order_number, channel, eventKey: eventKey || 'admin.manual_order', recipient: channel === 'in_app' ? '' : recipient, subject, body }) });
    setSending(false);
    if (result.ok && result.data.jobId) { setJob({ id: result.data.jobId, status: 'queued' }); setMessage({ tone: 'info', text: 'Mensagem aceite e colocada na fila de envio.' }); }
    else setMessage({ tone: 'error', text: result.error ?? 'Não foi possível colocar a mensagem na fila.' });
  };
  return <div className="admin-communication-workspace">
    <div className="admin-communication-intro"><div><p className="page-kicker">Comunicação operacional</p><h3>Enviar atualização por número de encomenda</h3><p>Procure a encomenda primeiro. O painel preenche os contactos e mantém a mensagem ligada ao histórico do pedido.</p></div><Badge tone="info"><AdminIcon name="shield" size={13} /> Apenas administradores</Badge></div>
    <div className="admin-communication-grid">
      <section className="admin-communication-panel"><div className="admin-card__head"><div><h3>1. Encontrar encomenda</h3><p className="admin-card__subhead">Use o número completo ou parte dele, por exemplo GA123.</p></div></div><div className="admin-order-lookup"><input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void lookup(); } }} placeholder="GA123" aria-label="Número da encomenda" /><button type="button" className="btn btn--primary" onClick={() => void lookup()} disabled={loading}><AdminIcon name="search" size={15} />{loading ? 'A procurar…' : 'Procurar pedido'}</button></div>{order && <div className="admin-order-result"><div><span>Encomenda</span><strong>{order.order.order_number}</strong><small>{formatDate(order.order.created_at)}</small></div><div><span>Cliente</span><strong>{order.order.customer_name}</strong><small>{order.order.customer_email} · {order.order.customer_phone || 'Sem telefone'}</small></div><div><span>Total</span><strong>{formatKz(order.order.total_aoa)}</strong><small><StatusBadge status={order.order.status} /></small></div><div><span>Itens</span><strong>{order.items.length}</strong><small>{order.items.map((item) => `${item.product_name} × ${item.quantity}`).join(' · ')}</small></div></div>}</section>
      <section className="admin-communication-panel"><div className="admin-card__head"><div><h3>2. Compor mensagem</h3><p className="admin-card__subhead">O assunto e o corpo podem ser personalizados antes do envio.</p></div></div><div className="admin-form"><div className="form-row"><Field label="Canal"><select value={channel} onChange={(event) => changeChannel(event.target.value)}>{CHANNELS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Modelo"><select value={templateId} onChange={(event) => applyTemplate(templates.find((template) => String(template.id) === event.target.value))}><option value="">Mensagem personalizada</option>{channelTemplates.map((template) => <option key={template.id} value={template.id}>{template.name || template.event_key}</option>)}</select></Field></div><Field label="Evento de registo"><select value={eventKey} onChange={(event) => changeEvent(event.target.value)}>{events.length ? events.map((event) => <option key={event} value={event}>{event}</option>) : <option value="admin.manual_order">admin.manual_order</option>}</select></Field>{channel !== 'in_app' && <Field label="Destinatário" hint="Pode substituir o contacto guardado na encomenda."><input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder={channel === 'email' ? 'cliente@exemplo.com' : '973929712'} /></Field>}<Field label="Assunto / título"><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Atualização da encomenda {{order_number}}" /></Field><Field label="Mensagem" hint={`Variáveis: ${VARIABLES.join(' ')}`}><textarea rows={8} value={body} onChange={(event) => setBody(event.target.value)} /></Field><div className="admin-form__actions"><button type="button" className="btn btn--primary" onClick={() => void send()} disabled={!order || sending || Boolean(job && !['completed', 'failed'].includes(job.status))}>{sending ? 'A colocar na fila…' : job && !['completed', 'failed'].includes(job.status) ? 'Envio em curso…' : `Enviar ${channelLabel(channel).toLowerCase()}`}</button><button type="button" className="btn btn--outline" onClick={() => { setBody(DEFAULT_BODY); setSubject(''); }}>Limpar personalização</button></div>{message && <Notice tone={message.tone} message={message.text} />}</div></section>
    </div>
    {order && <div className="admin-communication-history"><h3>Últimas entregas desta encomenda</h3>{order.notifications.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Evento</th><th>Canal</th><th>Destinatário</th><th>Estado</th><th>Data</th></tr></thead><tbody>{order.notifications.map((notification) => <tr key={notification.id}><td>{notification.event_key}</td><td>{channelLabel(notification.channel)}</td><td>{notification.recipient}</td><td><StatusBadge status={notification.status} />{notification.error_message && <small>{notification.error_message}</small>}</td><td>{formatDate(notification.created_at)}</td></tr>)}</tbody></table></div> : <Empty>Ainda não existem entregas para esta encomenda.</Empty>}</div>}
  </div>;
}

function Deliveries() {
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState('all');
  const [orderNumber, setOrderNumber] = useState('');
  const [queryOrder, setQueryOrder] = useState('');
  const { data, loading } = useJson<{ deliveries: Delivery[]; summary: Array<{ channel: string; status: string; total: string }> }>(`/api/admin/notification-deliveries?channel=${channel}&status=${status}&orderNumber=${encodeURIComponent(queryOrder)}&limit=200`, [channel, status, queryOrder]);
  return <div>
    <div className="admin-filterbar admin-delivery-filter"><input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') setQueryOrder(orderNumber.trim()); }} placeholder="Número da encomenda…" aria-label="Filtrar pelo número da encomenda" /><select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="all">Todos os canais</option>{CHANNELS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Todos os estados</option><option value="sent">Enviado</option><option value="failed">Falhou</option><option value="not_configured">Não configurado</option><option value="skipped">Ignorado</option></select><button type="button" className="btn btn--outline btn--sm" onClick={() => setQueryOrder(orderNumber.trim())}>Aplicar filtros</button></div>
    <div className="admin-kpis admin-kpis--compact">{(data?.summary ?? []).slice(0, 6).map((row) => <article key={`${row.channel}-${row.status}`}><span>{channelLabel(row.channel)} · {row.status}</span><strong>{row.total}</strong><small>últimos 30 dias</small></article>)}</div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Evento</th><th>Encomenda</th><th>Canal</th><th>Destinatário</th><th>Assunto</th><th>Estado</th><th>Data</th></tr></thead><tbody>{loading ? <tr><td colSpan={7}><Empty>A carregar…</Empty></td></tr> : data?.deliveries.length ? data.deliveries.map((delivery) => <tr key={delivery.id}><td>{delivery.event_key}</td><td>{delivery.order_number || '—'}</td><td>{channelLabel(delivery.channel)}</td><td>{delivery.recipient}</td><td>{delivery.subject ?? '—'}{delivery.error_message && <small>{delivery.error_message}</small>}</td><td><StatusBadge status={delivery.status} /></td><td>{formatDate(delivery.created_at)}</td></tr>) : <tr><td colSpan={7}><Empty>Sem entregas registadas.</Empty></td></tr>}</tbody></table></div>
  </div>;
}

function Campaigns({ onOpenEmail, onOpenSms }: { onOpenEmail: () => void; onOpenSms: () => void }) {
  const { data, loading, reload } = useJson<{ campaigns: Campaign[] }>('/api/admin/email/campaigns');
  const [form, setForm] = useState({ name: '', subject: '', bodyHtml: '', bodyText: '', audienceStatus: 'subscribed' });
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<{ id: string; status: string } | null>(null);
  useEffect(() => {
    if (!job || ['completed', 'failed'].includes(job.status)) return;
    let active = true;
    let timer = 0;
    const poll = async () => {
      const response = await api<{ job: { status: string; result?: { sentCount?: number; failedCount?: number; recipientCount?: number; status?: string } | null; error?: string | null } }>(`/api/admin/notification-jobs/${job.id}`);
      if (!active) return;
      if (response.ok && response.data.job) {
        const current = response.data.job;
        setJob((old) => old ? { ...old, status: current.status } : old);
        if (current.status === 'completed' || current.status === 'failed') {
          const result = current.result;
          const failed = Number(result?.failedCount ?? 0);
          const tone = current.status === 'failed' || result?.status === 'failed' ? 'error' : failed > 0 ? 'warning' : 'success';
          const summary = `Campanha concluída: ${Number(result?.sentCount ?? 0)} enviados de ${Number(result?.recipientCount ?? 0)}${failed ? `; ${failed} falharam` : ''}.`;
          setMessage({ tone, text: current.error || (tone === 'error' ? 'O envio da campanha falhou.' : summary) });
          await reload();
          return;
        }
        setMessage({ tone: 'info', text: current.status === 'processing' ? 'A campanha está a ser processada em segundo plano…' : 'Campanha aceite e aguardando processamento.' });
      }
      timer = window.setTimeout(poll, 1800);
    };
    timer = window.setTimeout(poll, 700);
    return () => { active = false; window.clearTimeout(timer); };
  }, [job?.id, job?.status]);
  const generate = async () => { if (!topic.trim()) { setMessage({ tone: 'error', text: 'Indique o tema da campanha.' }); return; } setBusy(true); const result = await api<{ subject: string; bodyHtml: string; bodyText: string }>('/api/admin/email/generate', { method: 'POST', body: JSON.stringify({ topic, audience: 'clientes subscritos da GameAO', tone: 'profissional, direto e entusiasta', callToAction: 'Visitar a loja' }) }); setBusy(false); if (!result.ok) { setMessage({ tone: 'error', text: result.error ?? 'Não foi possível gerar o rascunho.' }); return; } setForm({ ...form, subject: result.data.subject, bodyHtml: result.data.bodyHtml, bodyText: result.data.bodyText }); setMessage({ tone: 'success', text: 'Rascunho preenchido. Reveja antes de guardar.' }); };
  const save = async () => { setBusy(true); const result = await api('/api/admin/email/campaigns', { method: 'POST', body: JSON.stringify(form) }); setBusy(false); setMessage(result.ok ? { tone: 'success', text: 'Campanha guardada como rascunho.' } : { tone: 'error', text: result.error ?? 'Falha ao guardar campanha.' }); if (result.ok) { setForm({ name: '', subject: '', bodyHtml: '', bodyText: '', audienceStatus: 'subscribed' }); await reload(); } };
  const send = async (campaign: Campaign) => { if (!window.confirm(`Enviar “${campaign.name}” para todos os leads ${campaign.audience_status === 'subscribed' ? 'subscritos' : campaign.audience_status}?`)) return; setBusy(true); setMessage(null); setJob(null); const result = await api<{ jobId?: string }>('/api/admin/email/campaigns/' + campaign.id + '/send', { method: 'POST' }); setBusy(false); if (result.ok && result.data.jobId) { setJob({ id: result.data.jobId, status: 'queued' }); setMessage({ tone: 'info', text: 'Campanha aceite e colocada na fila de envio.' }); } else setMessage({ tone: 'error', text: result.error ?? 'Não foi possível colocar a campanha na fila.' }); if (result.ok) await reload(); };
    return <div className="admin-campaign-workspace">
    <div className="admin-section__inline-actions"><button type="button" className="btn btn--outline btn--sm" onClick={onOpenEmail}>Compor email com os 17 modelos</button><button type="button" className="btn btn--outline btn--sm" onClick={onOpenSms}>Abrir envio manual de SMS</button></div>
    <div className="admin-campaign-intro"><div><p className="page-kicker">Campanhas GameAO</p><h3>Envio em massa com revisão antes de enviar</h3><p>O público desta fase é composto por leads com subscrição ativa. Cada email usa o nome do destinatário e fica no histórico de entregas.</p></div><Badge tone="warning">SMTP obrigatório</Badge></div>
    <Notice message={message?.text} tone={message?.tone ?? 'info'} />
    <div className="admin-communication-grid"><section className="admin-communication-panel"><div className="admin-card__head"><div><h3>Nova campanha</h3><p className="admin-card__subhead">Guarde como rascunho e só depois confirme o envio.</p></div></div><div className="admin-form"><Field label="Tema para rascunho assistido"><div className="admin-inline-composer"><input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Ex.: novas recargas PlayStation" /><button type="button" className="btn btn--outline btn--sm" onClick={() => void generate()} disabled={busy}>Preencher</button></div></Field><Field label="Nome interno *"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Campanha de novembro" /></Field><Field label="Assunto *"><input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Novidades GameAO para si" /></Field><Field label="Audiência"><select value={form.audienceStatus} disabled><option value="subscribed">Leads subscritos</option></select></Field><Field label="HTML da campanha *" hint="Variáveis suportadas: {{customer_name}} {{customer_email}} {{site_name}} {{site_url}}"><textarea rows={10} value={form.bodyHtml} onChange={(event) => setForm({ ...form, bodyHtml: event.target.value })} placeholder="<p>Olá {{customer_name}},</p>" /></Field><Field label="Texto alternativo"><textarea rows={4} value={form.bodyText} onChange={(event) => setForm({ ...form, bodyText: event.target.value })} /></Field><div className="admin-form__actions"><button type="button" className="btn btn--primary" onClick={() => void save()} disabled={busy || !form.name || !form.subject || !form.bodyHtml}>Guardar rascunho</button><button type="button" className="btn btn--outline" onClick={() => setForm({ ...form, subject: '', bodyHtml: '', bodyText: '' })}>Limpar</button></div></div></section><section className="admin-communication-panel"><div className="admin-card__head"><div><h3>Pré-visualização</h3><p className="admin-card__subhead">Exemplo com Cliente GameAO. As variáveis são personalizadas por destinatário no servidor.</p></div></div><iframe className="admin-campaign-preview" title="Pré-visualização da campanha" sandbox="" srcDoc={form.bodyHtml ? previewTemplate(form.bodyHtml) : '<p style="font-family:Arial;padding:24px;color:#7d8893">O rascunho aparecerá aqui.</p>'} /></section></div>
    <section className="admin-campaign-list"><div className="admin-card__head"><div><h3>Rascunhos e envios</h3><p className="admin-card__subhead">Enviar uma campanha exige confirmação e SMTP configurado.</p></div><span>{data?.campaigns.length ?? 0} campanhas</span></div>{loading ? <p className="admin-state">A carregar campanhas…</p> : data?.campaigns.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Campanha</th><th>Audiência</th><th>Estado</th><th>Resultado</th><th>Data</th><th /></tr></thead><tbody>{data.campaigns.map((campaign) => <tr key={campaign.id}><td><strong>{campaign.name}</strong><small>{campaign.subject}</small></td><td>{campaign.audience_status}</td><td><StatusBadge status={campaign.status} /></td><td>{campaign.sent_count}/{campaign.recipient_count}</td><td>{formatDate(campaign.sent_at ?? campaign.created_at)}</td><td><button type="button" className="btn btn--primary btn--sm" disabled={busy || campaign.status === 'sent' || campaign.status === 'sending'} onClick={() => void send(campaign)}>Enviar</button></td></tr>)}</tbody></table></div> : <Empty>Sem campanhas guardadas.</Empty>}</section>
  </div>;
}

function TestSender() {
  const { data } = useJson<{ templates: Template[] }>('/api/admin/notification-templates');
  const [eventKey, setEventKey] = useState('order.created');
  const [channel, setChannel] = useState('email');
  const [to, setTo] = useState('');
  const [result, setResult] = useState<{ tone: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const events = useMemo(() => [...new Set((data?.templates ?? []).map((template) => template.event_key))].sort(), [data]);
  const send = async () => { const response = await api<{ status: string; error?: string }>('/api/admin/notifications/test', { method: 'POST', body: JSON.stringify({ eventKey, channel, to }) }); if (!response.ok) { setResult({ tone: 'error', message: response.error ?? 'Falha no envio.' }); return; } const status = response.data.status; setResult(status === 'sent' ? { tone: 'success', message: 'Notificação de teste enviada.' } : { tone: 'warning', message: status === 'not_configured' ? 'Canal ainda não configurado. Configure as variáveis no Render.' : `Estado: ${status}. ${response.data.error ?? ''}` }); };
  return <form className="admin-form admin-form--narrow" onSubmit={(event) => { event.preventDefault(); void send(); }}>
    <Field label="Evento"><select value={eventKey} onChange={(event) => setEventKey(event.target.value)}>{events.map((event) => <option key={event} value={event}>{event}</option>)}</select></Field>
    <Field label="Canal"><select value={channel} onChange={(event) => setChannel(event.target.value)}>{CHANNELS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
    <Field label="Destinatário" hint="Para SMS e WhatsApp, use um número com indicativo ou os 9 dígitos nacionais."><input value={to} onChange={(event) => setTo(event.target.value)} placeholder={channel === 'sms' || channel === 'whatsapp' ? '973929712' : 'email@exemplo.com'} /></Field>
    <button type="submit" className="btn btn--primary">Enviar notificação de teste</button>
    {result && <Notice message={result.message} tone={result.tone} />}
    <p className="admin-message">O email requer SMTP, o WhatsApp requer WhatsApp Business API e o SMS utiliza a conta TelcoSMS de produção. As notificações internas funcionam com a base de dados disponível.</p>
  </form>;
}
