import { useEffect, useState } from 'react';
import { AdminSection, Field, Notice, api, useJson } from './ui';
import type { AdminSectionId } from './adminNav';

type Settings = Record<string, any>;

export function AdminSettings({ section }: { section: AdminSectionId }) {
  const state = useJson<{ settings: Settings }>('/api/admin/site-settings');
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error'>('success');
  const notify = (text: string, ok: boolean) => { setMessage(text); setTone(ok ? 'success' : 'error'); };
  const save = async (key: string, value: Record<string, unknown>) => {
    const result = await api(`/api/admin/site-settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) });
    notify(result.ok ? 'Configuração guardada.' : result.error ?? 'Falha ao guardar.', result.ok);
    if (result.ok) await state.reload();
  };
  const settings = state.data?.settings ?? {};
  const props = { settings, save, message, tone, loading: state.loading };
  if (section === 'settings-currency') return <AdminCurrency />;
  if (section === 'settings-identity') return <AdminIdentity {...props} />;
  if (section === 'settings-business') return <AdminBusiness {...props} />;
  if (section === 'settings-checkout') return <AdminCheckout {...props} />;
  if (section === 'settings-delivery') return <AdminDelivery {...props} />;
  if (section === 'settings-seo') return <AdminSeo {...props} />;
  return <AdminGeneral {...props} />;
}

interface SectionProps { settings: Settings; save: (key: string, value: Record<string, unknown>) => Promise<void>; message: string; tone: 'success' | 'error'; loading: boolean }

function AdminGeneral({ settings, save, message, tone, loading }: SectionProps) {
  const [draft, setDraft] = useState<Settings | null>(null);
  const current = draft ?? { ...(settings.store_status ?? {}), ...(settings.notifications_config ?? {}), ...(settings.sales_counter ?? {}) };
  if (loading) return <p className="admin-state">A carregar configurações…</p>;
  const update = (key: string, value: unknown) => setDraft({ ...current, [key]: value });
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await save('store_status', { acceptingOrders: current.acceptingOrders !== false, maintenanceMessage: current.maintenanceMessage ?? '', announcement: current.announcement ?? '', announcementActive: Boolean(current.announcementActive) });
    await save('notifications_config', { inApp: current.inApp !== false, email: current.email !== false, whatsapp: current.whatsapp !== false, adminEmail: current.adminEmail !== false, lowStockThreshold: Number(current.lowStockThreshold ?? 5) });
    await save('sales_counter', { enabled: current.counterEnabled !== false, baseCount: Number(current.baseCount ?? 0), label: current.counterLabel ?? 'pedidos realizados', showOnHome: current.showOnHome !== false, showOnProduct: current.showOnProduct !== false });
  };
  return <AdminSection title="Configurações gerais" subtitle="Estado da loja, canais de notificação e contador de vendas.">
    <Notice message={message} tone={tone} />
    <form className="admin-form" onSubmit={(event) => void submit(event)}>
      <h3>Loja</h3>
      <label className="admin-check"><input type="checkbox" checked={current.acceptingOrders !== false} onChange={(event) => update('acceptingOrders', event.target.checked)} /> Aceitar novas encomendas</label>
      <Field label="Mensagem de manutenção"><textarea rows={2} value={current.maintenanceMessage ?? ''} onChange={(event) => update('maintenanceMessage', event.target.value)} /></Field>
      <h3>Notificações</h3>
      <div className="admin-checks"><label className="admin-check"><input type="checkbox" checked={current.inApp !== false} onChange={(event) => update('inApp', event.target.checked)} /> Notificações internas</label><label className="admin-check"><input type="checkbox" checked={current.email !== false} onChange={(event) => update('email', event.target.checked)} /> Email</label><label className="admin-check"><input type="checkbox" checked={current.whatsapp !== false} onChange={(event) => update('whatsapp', event.target.checked)} /> WhatsApp</label><label className="admin-check"><input type="checkbox" checked={current.adminEmail !== false} onChange={(event) => update('adminEmail', event.target.checked)} /> Alertas para administração</label></div>
      <Field label="Limiar de stock baixo"><input type="number" min="0" value={current.lowStockThreshold ?? 5} onChange={(event) => update('lowStockThreshold', Number(event.target.value))} /></Field>
      <h3>Contador de vendas</h3>
      <label className="admin-check"><input type="checkbox" checked={current.counterEnabled !== false} onChange={(event) => update('counterEnabled', event.target.checked)} /> Mostrar contador no website</label>
      <div className="form-row"><Field label="Texto do contador"><input value={current.counterLabel ?? ''} onChange={(event) => update('counterLabel', event.target.value)} /></Field><Field label="Base inicial"><input type="number" min="0" value={current.baseCount ?? 0} onChange={(event) => update('baseCount', Number(event.target.value))} /></Field></div>
      <p className="admin-message">O contador soma encomendas reais não canceladas à base inicial.</p>
      <button type="submit" className="btn btn--primary">Guardar configurações</button>
    </form>
  </AdminSection>;
}

function AdminIdentity({ settings, save, message, tone, loading }: SectionProps) {
  const [draft, setDraft] = useState<Settings | null>(null);
  const site = draft ?? settings.site_config ?? {};
  if (loading) return <p className="admin-state">A carregar…</p>;
  const update = (key: string, value: unknown) => setDraft({ ...site, [key]: value });
  return <AdminSection title="Identidade da GameAO" subtitle="Nome, contactos e presença usados em emails, faturas e no website.">
    <Notice message={message} tone={tone} />
    <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save('site_config', site); }}>
      <div className="form-row"><Field label="Nome comercial"><input value={site.name ?? ''} onChange={(event) => update('name', event.target.value)} /></Field><Field label="Slogan"><input value={site.tagline ?? ''} onChange={(event) => update('tagline', event.target.value)} /></Field></div>
      <div className="form-row"><Field label="Email"><input type="email" value={site.email ?? ''} onChange={(event) => update('email', event.target.value)} /></Field><Field label="Telefone"><input value={site.phone ?? ''} onChange={(event) => update('phone', event.target.value)} /></Field></div>
      <div className="form-row"><Field label="WhatsApp (com indicativo)"><input value={site.whatsapp ?? ''} onChange={(event) => update('whatsapp', event.target.value)} placeholder="244973929712" /></Field><Field label="Localização"><input value={site.location ?? ''} onChange={(event) => update('location', event.target.value)} /></Field></div>
      <Field label="Horário de apoio"><input value={site.supportHours ?? ''} onChange={(event) => update('supportHours', event.target.value)} /></Field>
      <button type="submit" className="btn btn--primary">Guardar identidade</button>
    </form>
  </AdminSection>;
}

function AdminBusiness({ settings, save, message, tone, loading }: SectionProps) {
  const [draft, setDraft] = useState<Settings | null>(null);
  const business = draft ?? settings.business_info ?? {};
  if (loading) return <p className="admin-state">A carregar…</p>;
  const update = (key: string, value: unknown) => setDraft({ ...business, [key]: value });
  return <AdminSection title="Informações comerciais" subtitle="Dados usados nas faturas. Preencha apenas dados próprios da GameAO.">
    <Notice message={message} tone={tone} />
    <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save('business_info', business); }}>
      <div className="form-row"><Field label="Razão social"><input value={business.legalName ?? ''} onChange={(event) => update('legalName', event.target.value)} /></Field><Field label="NIF"><input value={business.nif ?? ''} onChange={(event) => update('nif', event.target.value)} /></Field></div>
      <Field label="Endereço"><input value={business.address ?? ''} onChange={(event) => update('address', event.target.value)} /></Field>
      <div className="form-row"><Field label="Cidade"><input value={business.city ?? ''} onChange={(event) => update('city', event.target.value)} /></Field><Field label="Província"><input value={business.province ?? ''} onChange={(event) => update('province', event.target.value)} /></Field></div>
      <div className="form-row"><Field label="Email fiscal"><input value={business.email ?? ''} onChange={(event) => update('email', event.target.value)} /></Field><Field label="Telefone"><input value={business.phone ?? ''} onChange={(event) => update('phone', event.target.value)} /></Field></div>
      <button type="submit" className="btn btn--primary">Guardar informações comerciais</button>
    </form>
  </AdminSection>;
}

function AdminCheckout({ settings, save, message, tone, loading }: SectionProps) {
  const [draft, setDraft] = useState<Settings | null>(null);
  const checkout = draft ?? settings.checkout_config ?? {};
  if (loading) return <p className="admin-state">A carregar…</p>;
  const update = (key: string, value: unknown) => setDraft({ ...checkout, [key]: value });
  return <AdminSection title="Configurações do checkout" subtitle="Regras aplicadas no servidor durante a criação da encomenda.">
    <Notice message={message} tone={tone} />
    <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save('checkout_config', checkout); }}>
      <label className="admin-check"><input type="checkbox" checked={checkout.guestCheckout !== false} onChange={(event) => update('guestCheckout', event.target.checked)} /> Permitir compra como convidado</label>
      <label className="admin-check"><input type="checkbox" checked={checkout.requirePhone !== false} onChange={(event) => update('requirePhone', event.target.checked)} /> Telefone obrigatório</label>
      <Field label="Valor mínimo da encomenda"><input type="number" min="0" value={checkout.minOrderAoa ?? 0} onChange={(event) => update('minOrderAoa', Number(event.target.value))} /></Field>
      <Field label="Texto de termos no checkout"><textarea rows={3} value={checkout.termsText ?? ''} onChange={(event) => update('termsText', event.target.value)} /></Field>
      <button type="submit" className="btn btn--primary">Guardar checkout</button>
    </form>
  </AdminSection>;
}

function AdminDelivery({ settings, save, message, tone, loading }: SectionProps) {
  const [draft, setDraft] = useState<Settings | null>(null);
  const delivery = draft ?? settings.delivery_config ?? {};
  if (loading) return <p className="admin-state">A carregar…</p>;
  const update = (key: string, value: unknown) => setDraft({ ...delivery, [key]: value });
  return <AdminSection title="Configurações de entrega" subtitle="Portes, prazo estimado e províncias atendidas.">
    <Notice message={message} tone={tone} />
    <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save('delivery_config', delivery); }}>
      <div className="form-row"><Field label="Custo base"><input type="number" min="0" value={delivery.feeAoa ?? 0} onChange={(event) => update('feeAoa', Number(event.target.value))} /></Field><Field label="Grátis acima de"><input type="number" min="0" value={delivery.freeAboveAoa ?? 0} onChange={(event) => update('freeAboveAoa', Number(event.target.value))} /></Field></div>
      <Field label="Prazo estimado (dias)"><input type="number" min="0" value={delivery.estimatedDays ?? 2} onChange={(event) => update('estimatedDays', Number(event.target.value))} /></Field>
      <Field label="Províncias atendidas" hint="Separadas por vírgula."><input value={delivery.provinces ?? ''} onChange={(event) => update('provinces', event.target.value)} placeholder="Luanda, Benguela, Huíla…" /></Field>
      <Field label="Notas para o cliente"><textarea rows={3} value={delivery.notes ?? ''} onChange={(event) => update('notes', event.target.value)} /></Field>
      <button type="submit" className="btn btn--primary">Guardar entregas</button>
    </form>
  </AdminSection>;
}

function AdminSeo({ settings, save, message, tone, loading }: SectionProps) {
  const [draft, setDraft] = useState<Settings | null>(null);
  const seo = draft ?? settings.seo_config ?? {};
  if (loading) return <p className="admin-state">A carregar…</p>;
  const update = (key: string, value: unknown) => setDraft({ ...seo, [key]: value });
  return <AdminSection title="SEO" subtitle="Título, descrição e imagem de partilha para motores de busca e redes sociais.">
    <Notice message={message} tone={tone} />
    <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save('seo_config', seo); }}>
      <Field label="Título"><input value={seo.title ?? ''} onChange={(event) => update('title', event.target.value)} /></Field>
      <Field label="Descrição"><textarea rows={3} value={seo.description ?? ''} onChange={(event) => update('description', event.target.value)} /></Field>
      <Field label="Palavras-chave"><input value={seo.keywords ?? ''} onChange={(event) => update('keywords', event.target.value)} /></Field>
      <Field label="Imagem Open Graph"><input value={seo.ogImage ?? ''} onChange={(event) => update('ogImage', event.target.value)} /></Field>
      <button type="submit" className="btn btn--primary">Guardar SEO</button>
    </form>
  </AdminSection>;
}

function AdminCurrency() {
  return <AdminSection title="Moeda" subtitle="Os preços do catálogo, carrinho, checkout e faturas são apresentados diretamente, sem conversão cambial visível.">
    <Notice message="A apresentação monetária direta está ativa." tone="success" />
    <div className="admin-note">Os dados históricos de encomendas continuam preservados internamente para compatibilidade. A loja não apresenta taxa, fórmula ou conversão ao cliente.</div>
  </AdminSection>;
}
