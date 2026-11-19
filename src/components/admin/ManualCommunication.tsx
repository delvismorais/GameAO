import { useEffect, useMemo, useState } from 'react';
import { Badge, Empty, Field, Notice, api, useJson } from './ui';

type EmailTemplate = { id: number; event_key: string; channel: string; name: string; subject: string; body: string; is_active: number };
type NoticeState = { tone: 'success' | 'error' | 'warning' | 'info'; text: string } | null;
type NotificationJob = { id: string; status: string; result?: { status?: string; error?: string; sentCount?: number; failedCount?: number; recipientCount?: number } | null; error?: string | null; campaign?: boolean };

function finalJobNotice(job: NotificationJob): NoticeState {
  if (job.status === 'failed') return { tone: 'error', text: job.error || 'O envio falhou. Consulte o histórico de entregas.' };
  if (job.campaign) {
    const sent = job.result?.sentCount ?? 0;
    const failed = job.result?.failedCount ?? 0;
    return { tone: failed ? 'warning' : 'success', text: `Campanha processada: ${sent} emails enviados${failed ? ` e ${failed} falhas` : ''}.` };
  }
  if (job.result?.status === 'sent') return { tone: 'success', text: 'Envio concluído e registado no histórico de entregas.' };
  if (job.result?.status === 'not_configured') return { tone: 'warning', text: job.result.error || 'O serviço do canal ainda não está configurado.' };
  if (job.result?.status === 'skipped') return { tone: 'warning', text: job.result.error || 'O envio foi ignorado: verifique destinatário e modelo.' };
  return { tone: 'error', text: job.result?.error || 'O envio não foi concluído; consulte o histórico de entregas.' };
}

const EMAIL_CATEGORY_ORDER = [
  'Agradecimento', 'Aniversário', 'Anúncio', 'Boas-vindas', 'Confirmação', 'Feedback', 'Lançamento', 'Lembrete',
  'Notificação', 'Novo produto', 'Oferta especial', 'Onboarding', 'Post de blog', 'Progresso', 'Reengajamento', 'Saudação', 'Venda',
];

function previewEmail(body: string): string {
  const sample = body
    .replace(/\{\{\s*site_name\s*\}\}/g, 'GameAO')
    .replace(/\{\{\s*site_url\s*\}\}/g, window.location.origin)
    .replace(/\{\{\s*site_email\s*\}\}/g, 'geral@gameao.shop')
    .replace(/\{\{\s*site_phone\s*\}\}/g, '973 929 712')
    .replace(/\{\{\s*customer_name\s*\}\}/g, 'Cliente GameAO')
    .replace(/\{\{\s*customer_email\s*\}\}/g, 'cliente@exemplo.com')
    .replace(/\{\{\s*customer_phone\s*\}\}/g, '973 929 712')
    .replace(/\{\{\s*order_number\s*\}\}/g, 'GA241')
    .replace(/\{\{\s*order_total\s*\}\}/g, '25.000,00 Kz')
    .replace(/\{\{\s*order_status\s*\}\}/g, 'Em processamento')
    .replace(/\{\{\s*order_link\s*\}\}/g, `${window.location.origin}/shop`)
    .replace(/\{\{\s*admin_link\s*\}\}/g, `${window.location.origin}/admin`)
    .replace(/\{\{\s*order_items\s*\}\}/g, '<ul><li>Produto GameAO × 1</li></ul>');
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#eff2fa;padding:18px;font-family:Arial,Helvetica,sans-serif;color:#182028;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;"><tr><td style="padding:20px 24px;background:#00080f;"><a href="${window.location.origin}" style="text-decoration:none;"><img src="${window.location.origin}/assets/gameao-logo.png" alt="GameAO" width="150" style="display:block;width:150px;max-width:100%;height:auto;border:0;"></a></td></tr><tr><td style="height:4px;background:#cd3d0f;font-size:0;line-height:0;">&nbsp;</td></tr><tr><td style="padding:30px 28px 24px;font-size:15px;line-height:1.65;color:#3c4852;">${sample}</td></tr><tr><td style="padding:20px 28px;background:#f7f8fa;border-top:1px solid #e6e9ef;font-size:12px;line-height:1.6;color:#7d8893;"><p style="margin:0 0 6px;font-weight:700;color:#182028;">GameAO</p><p style="margin:0 0 8px;">A sua loja de videojogos em Angola.</p><p style="margin:0;"><a href="mailto:geral@gameao.shop" style="color:#cd3d0f;">geral@gameao.shop</a> · <a href="tel:+244973929712" style="color:#cd3d0f;">973 929 712</a> · <a href="https://wa.me/244973929712" style="color:#cd3d0f;">WhatsApp</a> · Luanda, Angola</p><p style="margin:14px 0 0;color:#3c4852;">Atenciosamente,<br><strong>Equipe GameAO</strong></p><p style="margin:10px 0 0;">Este email foi enviado automaticamente. Se não reconhecer a operação, fale com a nossa equipe.</p></td></tr></table></body></html>`;
}

function htmlToText(value: string): string {
  return value.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/\s+/g, ' ').trim();
}

export function ManualEmail() {
  const { data, loading } = useJson<{ templates: EmailTemplate[] }>('/api/admin/notification-templates');
  const { data: audience } = useJson<{ subscribedCount: number; sendLimit: number }>('/api/admin/email/audience-count');
  const templates = useMemo(() => (data?.templates ?? [])
    .filter((item) => item.channel === 'email' && item.is_active && item.event_key.startsWith('email.template.'))
    .sort((a, b) => EMAIL_CATEGORY_ORDER.indexOf(a.name) - EMAIL_CATEGORY_ORDER.indexOf(b.name)), [data]);
  const [mode, setMode] = useState<'individual' | 'mass'>('individual');
  const [templateId, setTemplateId] = useState('');
  const [to, setTo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [job, setJob] = useState<NotificationJob | null>(null);
  const selected = templates.find((item) => String(item.id) === templateId);

  useEffect(() => {
    if (!job || ['completed', 'failed'].includes(job.status)) return;
    let active = true;
    let timer = 0;
    const poll = async () => {
      const result = await api<{ job: NotificationJob }>(`/api/admin/notification-jobs/${job.id}`);
      if (result.ok && result.data.job) {
        const next = { ...result.data.job, campaign: job.campaign };
        setJob(next);
        if (next.status === 'completed' || next.status === 'failed') {
          setNotice(finalJobNotice(next));
          if (next.campaign && next.status === 'completed') setCampaignId(null);
          return;
        }
        setNotice({ tone: 'info', text: next.status === 'processing' ? 'O envio está a ser processado em segundo plano…' : 'Envio aceite e aguardando processamento.' });
      }
      if (active) timer = window.setTimeout(poll, 1600);
    };
    timer = window.setTimeout(poll, 700);
    return () => { active = false; window.clearTimeout(timer); };
  }, [job?.id, job?.status]);

  useEffect(() => {
    if (templateId || !templates.length) return;
    const first = templates[0];
    setTemplateId(String(first.id));
    setSubject(first.subject);
    setBody(first.body);
    setCampaignName(`Campanha · ${first.name}`);
  }, [templateId, templates]);

  const changeTemplate = (id: string) => {
    setTemplateId(id);
    const template = templates.find((item) => String(item.id) === id);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setCampaignName(`Campanha · ${template.name}`);
      setCampaignId(null);
    }
    setNotice(null);
  };

  const sendIndividual = async () => {
    if (!selected || !to.trim() || !subject.trim() || !body.trim()) {
      setNotice({ tone: 'error', text: 'Escolha um modelo e preencha email, assunto e conteúdo.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    setJob(null);
    const result = await api<{ jobId?: string }>('/api/admin/email/manual', {
      method: 'POST',
      body: JSON.stringify({ eventKey: selected.event_key, to, customerName, subject, body }),
    });
    setBusy(false);
    if (result.ok && result.data.jobId) {
      setJob({ id: result.data.jobId, status: 'queued' });
      setNotice({ tone: 'info', text: 'Email aceite e colocado na fila de envio.' });
    } else setNotice({ tone: 'error', text: result.error ?? 'Não foi possível colocar o email na fila.' });
  };

  const saveCampaignDraft = async () => {
    if (!selected || !campaignName.trim() || !subject.trim() || !body.trim()) {
      setNotice({ tone: 'error', text: 'Preencha o nome interno da campanha, assunto e conteúdo.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    const result = await api<{ id: number }>('/api/admin/email/campaigns', {
      method: 'POST',
      body: JSON.stringify({ name: campaignName, subject, bodyHtml: body, bodyText: htmlToText(body), audienceStatus: 'subscribed' }),
    });
    setBusy(false);
    if (!result.ok || !result.data?.id) {
      setNotice({ tone: 'error', text: result.error ?? 'Não foi possível guardar o rascunho.' });
      return;
    }
    setCampaignId(result.data.id);
    setNotice({ tone: 'success', text: 'Rascunho guardado. Nenhum email foi enviado; confirme abaixo para iniciar o envio em massa.' });
  };

  const sendCampaign = async () => {
    if (!campaignId) return;
    const count = Number(audience?.subscribedCount ?? 0);
    const limit = Number(audience?.sendLimit ?? 5000);
    if (!count) {
      setNotice({ tone: 'warning', text: 'Não há contatos subscritos disponíveis para esta campanha.' });
      return;
    }
    if (count > limit) {
      setNotice({ tone: 'error', text: `O público (${count}) ultrapassa o limite de segurança (${limit}).` });
      return;
    }
    if (!window.confirm(`Confirmar envio de “${campaignName}” para ${count} contatos com subscrição ativa? Esta ação enviará os emails.`)) return;
    setBusy(true);
    setNotice(null);
    setJob(null);
    const result = await api<{ sentCount?: number; failedCount?: number }>(`/api/admin/email/campaigns/${campaignId}/send`, { method: 'POST' });
    setBusy(false);
    if (!result.ok) {
      setNotice({ tone: 'error', text: result.error ?? 'Não foi possível colocar a campanha na fila.' });
      return;
    }
    if ('jobId' in result.data && result.data.jobId) {
      setJob({ id: String(result.data.jobId), status: 'queued', campaign: true });
      setNotice({ tone: 'info', text: 'Campanha aceite e colocada na fila de envio.' });
    } else setNotice({ tone: 'error', text: 'O servidor não devolveu o identificador do envio.' });
  };

  const editBody = (value: string) => { setBody(value); setCampaignId(null); };
  const editSubject = (value: string) => { setSubject(value); setCampaignId(null); };

  return <div className="admin-communication-workspace">
    <div className="admin-communication-intro">
      <div><p className="page-kicker">Email GameAO</p><h3>Componha uma mensagem com os modelos da loja</h3><p>Os modelos usam logo, imagem, slogan, contactos e assinatura comuns. Personalize o HTML e reveja a pré-visualização antes de enviar.</p></div>
      <Badge tone="info">17 modelos originais</Badge>
    </div>
    <Notice message={notice?.text} tone={notice?.tone ?? 'success'} />
    <div className="admin-email-mode" role="group" aria-label="Tipo de envio">
      <button type="button" className={mode === 'individual' ? 'is-active' : ''} onClick={() => { setMode('individual'); setCampaignId(null); setNotice(null); }}>Destinatário individual</button>
      <button type="button" className={mode === 'mass' ? 'is-active' : ''} onClick={() => { setMode('mass'); setNotice(null); }}>Envio em massa</button>
    </div>
    <div className="admin-communication-grid">
      <section className="admin-communication-panel">
        <div className="admin-card__head"><div><h3>Composição</h3><p className="admin-card__subhead">Selecione um dos 17 modelos e ajuste o texto se necessário.</p></div></div>
        <div className="admin-form">
          {loading ? <p className="admin-state">A carregar modelos…</p> : templates.length ? <Field label="Modelo de email *"><select value={templateId} onChange={(event) => changeTemplate(event.target.value)}>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></Field> : <Empty>Os modelos de email estarão disponíveis depois de aplicar a migração 0012.</Empty>}
          {mode === 'individual' ? <div className="form-row"><Field label="Destinatário *"><input type="email" required value={to} onChange={(event) => setTo(event.target.value)} placeholder="cliente@exemplo.com" autoComplete="email" /></Field><Field label="Nome para personalização"><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nome do destinatário" autoComplete="name" /></Field></div> : <>
            <Field label="Nome interno da campanha *"><input value={campaignName} onChange={(event) => { setCampaignName(event.target.value); setCampaignId(null); }} maxLength={180} placeholder="Campanha GameAO" /></Field>
            <div className="admin-audience-note"><strong>{audience?.subscribedCount ?? '—'}</strong><span>contatos com subscrição ativa</span><small>O envio só inclui inscritos, com limite de {audience?.sendLimit ?? 5000} contatos. Rascunhos não enviam mensagens.</small></div>
          </>}
          <Field label="Assunto *"><input value={subject} onChange={(event) => editSubject(event.target.value)} maxLength={255} placeholder="Assunto do email" /></Field>
          <Field label="Corpo HTML *" hint="Variáveis disponíveis: {{customer_name}}, {{customer_email}}, {{site_name}}, {{site_url}}, {{site_email}}, {{site_phone}}."><textarea rows={14} value={body} onChange={(event) => editBody(event.target.value)} /></Field>
          <div className="admin-form__actions">
            {mode === 'individual' ? <button type="button" className="btn btn--primary" onClick={() => void sendIndividual()} disabled={busy || Boolean(job && !['completed', 'failed'].includes(job.status)) || !selected || !to.trim() || !subject.trim() || !body.trim()}>{busy ? 'A colocar na fila…' : 'Enviar email'}</button> : <>
              <button type="button" className="btn btn--outline" onClick={() => void saveCampaignDraft()} disabled={busy || Boolean(campaignId) || !selected || !campaignName.trim() || !subject.trim() || !body.trim()}>{busy ? 'A guardar…' : campaignId ? 'Rascunho guardado' : 'Guardar rascunho de envio'}</button>
              {campaignId && <button type="button" className="btn btn--primary" onClick={() => void sendCampaign()} disabled={busy || Boolean(job && !['completed', 'failed'].includes(job.status))}>{busy ? 'A colocar na fila…' : 'Confirmar e enviar em massa'}</button>}
            </>}
          </div>
        </div>
      </section>
      <section className="admin-communication-panel">
        <div className="admin-card__head"><div><h3>Pré-visualização</h3><p className="admin-card__subhead">Exemplo com dados de demonstração; os dados reais são renderizados no servidor.</p></div></div>
        <iframe className="admin-campaign-preview admin-email-preview" title="Pré-visualização do modelo de email" sandbox="" srcDoc={body ? previewEmail(body) : '<p>Escolha um modelo para pré-visualizar.</p>'} />
      </section>
    </div>
  </div>;
}

export function ManualSms() {
  const { data: templateData, loading } = useJson<{ templates: EmailTemplate[] }>('/api/admin/notification-templates');
  const templates = useMemo(() => (templateData?.templates ?? []).filter((item) => item.channel === 'sms' && item.is_active), [templateData]);
  const [to, setTo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderTotal, setOrderTotal] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [job, setJob] = useState<NotificationJob | null>(null);
  const normalized = to.replace(/[\s()-]/g, '');
  const validPhone = /^(?:0?9\d{8}|\+?2449\d{8})$/.test(normalized);
  const selected = templates.find((item) => String(item.id) === templateId);
  const preview = message.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => ({
    site_name: 'GameAO', site_url: window.location.origin, site_email: 'geral@gameao.shop', site_phone: '973 929 712',
    customer_name: customerName || 'Cliente', customer_email: customerEmail, customer_phone: to,
    order_number: orderNumber || 'GA241', order_total: orderTotal ? `${orderTotal} Kz` : '25.000 Kz',
    order_status: orderStatus || 'Em processamento',
  }[key] ?? ''));

  useEffect(() => {
    if (templateId || !templates.length) return;
    setTemplateId(String(templates[0].id));
    setMessage(templates[0].body);
  }, [templateId, templates]);

  useEffect(() => {
    if (!job || ['completed', 'failed'].includes(job.status)) return;
    let active = true;
    let timer = 0;
    const poll = async () => {
      const result = await api<{ job: NotificationJob }>(`/api/admin/notification-jobs/${job.id}`);
      if (result.ok && result.data.job) {
        const next = result.data.job;
        setJob(next);
        if (next.status === 'completed' || next.status === 'failed') {
          setNotice(finalJobNotice(next));
          return;
        }
        setNotice({ tone: 'info', text: next.status === 'processing' ? 'O SMS está a ser enviado em segundo plano…' : 'SMS aceite e aguardando processamento.' });
      }
      if (active) timer = window.setTimeout(poll, 1600);
    };
    timer = window.setTimeout(poll, 700);
    return () => { active = false; window.clearTimeout(timer); };
  }, [job?.id, job?.status]);

  const chooseTemplate = (id: string) => {
    setTemplateId(id);
    const template = templates.find((item) => String(item.id) === id);
    if (template) setMessage(template.body);
    setJob(null);
    setNotice(null);
  };

  const send = async () => {
    if (!validPhone || !message.trim() || !preview.trim() || preview.length > 160) {
      setNotice({ tone: 'error', text: !validPhone ? 'Indique um número angolano válido.' : 'A mensagem personalizada ultrapassa 160 caracteres. Encurte-a ou ajuste os campos.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    setJob(null);
    const result = await api<{ jobId?: string }>('/api/admin/sms/manual', { method: 'POST', body: JSON.stringify({ to, message, eventKey: selected?.event_key ?? 'admin.manual_sms', customerName, customerEmail, orderNumber, orderTotal: orderTotal ? Number(orderTotal) : null, orderStatus }) });
    setBusy(false);
    if (result.ok && result.data.jobId) {
      setJob({ id: result.data.jobId, status: 'queued' });
      setNotice({ tone: 'info', text: 'SMS aceite e colocado na fila de envio.' });
    } else setNotice({ tone: 'error', text: result.error ?? 'Não foi possível colocar o SMS na fila.' });
  };

  return <div className="admin-communication-workspace">
    <div className="admin-communication-intro">
      <div><p className="page-kicker">SMS GameAO</p><h3>Envio manual personalizado</h3><p>Escolha um modelo SMS editável, reveja as variáveis e acompanhe o envio sem manter o formulário bloqueado.</p></div>
      <Badge tone="info">Até 160 caracteres</Badge>
    </div>
    <Notice message={notice?.text} tone={notice?.tone ?? 'success'} />
    <section className="admin-communication-panel admin-sms-panel">
      <div className="admin-card__head"><div><h3>Compor SMS</h3><p className="admin-card__subhead">Formatos aceitos: 973929712, 244973929712 ou +244973929712.</p></div></div>
      <div className="admin-form">
        <Field label="Modelo SMS"><select value={templateId} onChange={(event) => chooseTemplate(event.target.value)}><option value="">Mensagem personalizada</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name} · {template.event_key}</option>)}</select>{loading && <small>A carregar modelos SMS…</small>}</Field>
        <Field label="Número de destino *"><input type="tel" value={to} onChange={(event) => setTo(event.target.value)} placeholder="973929712" autoComplete="tel" aria-invalid={Boolean(to) && !validPhone} /></Field>
        <div className="form-row"><Field label="Nome do destinatário"><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nome para {{customer_name}}" /></Field><Field label="Email (opcional)"><input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="cliente@exemplo.com" /></Field></div>
        <div className="form-row"><Field label="Número da encomenda"><input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="GA241" /></Field><Field label="Total da encomenda (Kz)"><input inputMode="decimal" value={orderTotal} onChange={(event) => setOrderTotal(event.target.value)} placeholder="25000" /></Field><Field label="Estado da encomenda"><input value={orderStatus} onChange={(event) => setOrderStatus(event.target.value)} placeholder="Em processamento" /></Field></div>
        <Field label="Mensagem *" hint="Variáveis: {{customer_name}}, {{customer_email}}, {{customer_phone}}, {{order_number}}, {{order_total}}, {{order_status}}, {{site_name}}, {{site_phone}}, {{site_url}}."><textarea rows={5} maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escreva a mensagem SMS…" /></Field>
        <Field label="Pré-visualização personalizada"><textarea rows={3} readOnly value={preview} /></Field>
        <div className="admin-sms-counter"><span>{preview.length}/160 caracteres personalizados</span><span>{validPhone || !to ? 'Número válido' : 'Número inválido'}</span></div>
        <div className="admin-form__actions"><button type="button" className="btn btn--primary" onClick={() => void send()} disabled={busy || Boolean(job && !['completed', 'failed'].includes(job.status)) || !validPhone || !message.trim() || preview.length > 160}>{busy ? 'A colocar na fila…' : 'Enviar SMS'}</button></div>
      </div>
    </section>
  </div>;
}
