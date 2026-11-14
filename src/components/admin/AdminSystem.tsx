import { useState } from 'react';
import { AdminSection, Badge, Empty, Notice, api, downloadUrl, formatDate, useJson } from './ui';
import type { AdminSectionId } from './adminNav';

type Integrations = {
  email: { configured: boolean; host: string; from: string };
  whatsapp: { configured: boolean; phoneNumberId: string; version: string };
  storage: { configured: boolean; bucket: string };
  freefire: { configured: boolean; provider: string };
  openai: { configured: boolean };
  site: { name: string; email: string; phone: string };
  publicUrl: string;
};
type Log = { id: number; action: string; entity_type: string; entity_id?: string; user_name?: string; user_email?: string; metadata_json?: unknown; created_at: string };
type Session = { token_hash: string; user_name: string; user_email: string; role: string; created_at: string; expires_at: string };
type Webhook = { id: number; provider: string; event_type?: string; status: string; signature_valid: number; created_at: string; error_message?: string };

export function AdminIntegrations({ section }: { section: AdminSectionId | 'dashboard' }) {
  const { data, loading } = useJson<Integrations>('/api/admin/integrations');
  const webhooks = useJson<{ events: Webhook[] }>(section === 'webhooks' ? '/api/admin/webhooks' : '/api/admin/webhooks?limit=1');
  const methods = useJson<{ methods: Array<{ id: number; name: string; code: string; is_active: number }> }>(section === 'gateways' ? '/api/admin/payment-methods' : '/api/admin/payment-methods');
  if (loading) return <p className="admin-state">A carregar estado das integrações…</p>;
  if (section === 'webhooks') return <AdminSection title="Webhooks" subtitle="Eventos recebidos de fornecedores externos. Assinaturas validadas no servidor.">
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Fornecedor</th><th>Evento</th><th>Assinatura</th><th>Estado</th><th>Data</th></tr></thead><tbody>{webhooks.data?.events.length ? webhooks.data.events.map((event) => <tr key={event.id}><td>{event.provider}</td><td>{event.event_type ?? '—'}</td><td><Badge tone={event.signature_valid ? 'success' : 'warning'}>{event.signature_valid ? 'Válida' : 'Não validada'}</Badge></td><td><Badge tone={event.status === 'processed' ? 'success' : 'muted'}>{event.status}</Badge>{event.error_message && <small>{event.error_message}</small>}</td><td>{formatDate(event.created_at)}</td></tr>) : <tr><td colSpan={5}><Empty>Ainda não foram recebidos webhooks.</Empty></td></tr>}</tbody></table></div>
  </AdminSection>;
  if (section === 'gateways') return <AdminSection title="Gateways de pagamento" subtitle="Métodos automáticos e respetivo estado. As chaves privadas ficam apenas no servidor.">
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Método</th><th>Código</th><th>Estado</th><th>Tipo</th></tr></thead><tbody>{(methods.data?.methods ?? []).map((method) => <tr key={method.id}><td>{method.name}</td><td>{method.code}</td><td><Badge tone={method.is_active ? 'success' : 'muted'}>{method.is_active ? 'Ativo' : 'Inativo'}</Badge></td><td>{/api|gateway|pay/i.test(method.code) ? 'Integração automática' : 'Pagamento manual'}</td></tr>)}</tbody></table></div>
    <p className="admin-note">Para ativar um gateway automático são necessárias credenciais próprias da GameAO (públicas e secretas), URL de webhook e teste em modo sandbox. Nenhuma credencial é exposta no navegador.</p>
  </AdminSection>;
  if (section === 'storage') return <AdminSection title="Armazenamento de ficheiros" subtitle="Cloudflare R2 com bucket público e privado.">
    <div className="admin-kpis admin-kpis--compact"><article><span>R2</span><strong>{data?.storage.configured ? 'Configurado' : 'Pendente'}</strong><small>Bucket: {data?.storage.bucket || '—'}</small></article><article><span>Bucket público</span><strong>Media</strong><small>produtos, banners, blog</small></article><article><span>Bucket privado</span><strong>Documentos</strong><small>comprovativos e faturas</small></article></div>
    <EnvList vars={['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_BUCKET', 'R2_PUBLIC_BASE_URL']} configured={data?.storage.configured ?? false} />
    <p className="admin-note">O upload usa URLs pré-assinadas; o navegador nunca recebe as chaves do R2. Os comprovativos são servidos por links temporários.</p>
  </AdminSection>;
  if (section === 'apis') return <AdminSection title="APIs externas" subtitle="Integrações opcionais usadas pelo backend.">
    <div className="admin-kpis admin-kpis--compact"><article><span>OpenAI (gerador de emails)</span><strong>{data?.openai.configured ? 'Configurado' : 'Opcional'}</strong><small>OPENAI_API_KEY</small></article><article><span>Verificação Free Fire</span><strong>{data?.freefire.configured ? 'Configurado' : 'Não configurado'}</strong><small>FREEFIRE_VERIFY_URL</small></article><article><span>URL pública</span><strong>{data?.publicUrl}</strong><small>PUBLIC_SITE_URL</small></article></div>
  </AdminSection>;
  if (section === 'email-integration') return <AdminSection title="Serviço de email" subtitle="Emails transacionais com a identidade GameAO.">
    <IntegrationCard title="SMTP" configured={data?.email.configured ?? false} details={[`Servidor: ${data?.email.host || '—'}`, `Remetente: ${data?.email.from || '—'}`]} vars={['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM', 'SMTP_SECURE']} />
  </AdminSection>;
  if (section === 'whatsapp') return <AdminSection title="WhatsApp Business" subtitle="Notificações de encomendas por WhatsApp.">
    <IntegrationCard title="WhatsApp Cloud API" configured={data?.whatsapp.configured ?? false} details={[`Phone Number ID: ${data?.whatsapp.phoneNumberId || '—'}`, `Versão: ${data?.whatsapp.version || '—'}`]} vars={['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_API_VERSION']} />
  </AdminSection>;
  return <AdminSection title="Integrações" subtitle="Estado real das ligações do backend.">
    <div className="admin-kpis admin-kpis--compact"><article><span>Email SMTP</span><strong>{data?.email.configured ? 'Ativo' : 'Pendente'}</strong><small>{data?.email.host || 'SMTP_HOST'}</small></article><article><span>WhatsApp</span><strong>{data?.whatsapp.configured ? 'Ativo' : 'Pendente'}</strong><small>Cloud API</small></article><article><span>Cloudflare R2</span><strong>{data?.storage.configured ? 'Ativo' : 'Pendente'}</strong><small>{data?.storage.bucket || 'R2_BUCKET'}</small></article><article><span>Free Fire</span><strong>{data?.freefire.configured ? 'Ativo' : 'Opcional'}</strong><small>verificação de ID</small></article><article><span>OpenAI</span><strong>{data?.openai.configured ? 'Ativo' : 'Opcional'}</strong><small>gerador de emails</small></article></div>
  </AdminSection>;
}

function IntegrationCard({ title, configured, details, vars }: { title: string; configured: boolean; details: string[]; vars: string[] }) {
  return <div className="admin-integration"><header><strong>{title}</strong><Badge tone={configured ? 'success' : 'warning'}>{configured ? 'Configurado' : 'Não configurado'}</Badge></header><ul>{details.map((detail) => <li key={detail}>{detail}</li>)}</ul><EnvList vars={vars} configured={configured} /></div>;
}

function EnvList({ vars, configured }: { vars: string[]; configured: boolean }) {
  return <div className="admin-env"><strong>Variáveis de ambiente {configured ? 'configuradas' : 'necessárias'}</strong><code>{vars.join(' · ')}</code><small>Configure no Render → Environment. Nunca coloque segredos no repositório.</small></div>;
}

export function AdminSystem({ section }: { section: AdminSectionId }) {
  const logs = useJson<{ logs: Log[] }>('/api/admin/audit-logs?limit=300');
  const sessions = useJson<{ sessions: Session[] }>('/api/admin/sessions');
  const integrations = useJson<Integrations>('/api/admin/integrations');
  const status = useJson<Record<string, unknown>>('/api/admin/status');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('');
  const filteredLogs = (logs.data?.logs ?? []).filter((log) => !filter || `${log.action} ${log.entity_type} ${log.entity_id ?? ''} ${log.user_name ?? ''}`.toLowerCase().includes(filter.toLowerCase()));
  const revoke = async (session: Session) => { if (!window.confirm(`Terminar a sessão de ${session.user_name}?`)) return; const result = await api(`/api/admin/sessions/${session.token_hash}`, { method: 'DELETE' }); setMessage(result.ok ? 'Sessão terminada.' : result.error ?? 'Falha ao terminar sessão.'); if (result.ok) await sessions.reload(); };
  if (section === 'sessions') return <AdminSection title="Sessões" subtitle="Sessões ativas. Terminar uma sessão força novo início de sessão.">
    <Notice message={message} tone={message.includes('Falha') ? 'error' : 'success'} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Utilizador</th><th>Função</th><th>Início</th><th>Expira</th><th /></tr></thead><tbody>{sessions.loading ? <tr><td colSpan={5}><Empty>A carregar…</Empty></td></tr> : sessions.data?.sessions.map((session) => <tr key={session.token_hash}><td>{session.user_name}<small>{session.user_email}</small></td><td>{session.role}</td><td>{formatDate(session.created_at)}</td><td>{formatDate(session.expires_at)}</td><td><button type="button" className="btn btn--outline btn--sm" onClick={() => void revoke(session)}>Terminar</button></td></tr>)}</tbody></table></div>
  </AdminSection>;
  if (section === 'permissions') return <AdminSection title="Permissões" subtitle="Resumo das funções. A autorização é sempre verificada no servidor.">
    <div className="admin-role-grid">{[['Super Administrador', 'Acesso total'], ['Administrador', 'Operação completa'], ['Gestor de produtos', 'Catálogo e stock'], ['Gestor de encomendas', 'Encomendas e pagamentos'], ['Gestor de conteúdos', 'Blog e website'], ['Suporte', 'Consulta e mensagens']].map(([role, scope]) => <article key={role} className="admin-role"><header><strong>{role}</strong></header><p>{scope}</p></article>)}</div>
  </AdminSection>;
  if (section === 'integration-status') return <AdminIntegrations section="dashboard" />;
  if (section === 'backups') return <AdminSection title="Backups e exportações" subtitle="Exportações seguras de dados operacionais. Os backups completos são geridos pelo Supabase conforme o plano.">
    <div className="admin-links-grid"><button type="button" onClick={() => downloadUrl('/api/admin/export?type=orders')}>Exportar encomendas (CSV)</button><button type="button" onClick={() => downloadUrl('/api/admin/export?type=customers')}>Exportar clientes (CSV)</button><button type="button" onClick={() => downloadUrl('/api/admin/export?type=products')}>Exportar produtos (CSV)</button><button type="button" onClick={async () => { const result = await api<{ settings: unknown }>('/api/admin/site-settings'); if (result.ok) { const blob = new Blob([JSON.stringify(result.data.settings, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `gameao-settings-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url); } }}>Exportar configurações (JSON)</button></div>
    <div className="admin-note">Base de dados: {(status.data as { database?: { ready?: boolean } })?.database?.ready ? 'ligada e pronta' : 'a verificar'}. Para recuperação total, use os backups do projeto Supabase (gameao-production).</div>
  </AdminSection>;
  return <AdminSection title={section === 'admin-history' ? 'Histórico administrativo' : 'Registos de atividades'} subtitle="Todas as ações administrativas relevantes, com utilizador, entidade e data." actions={<input className="admin-inline-input" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filtrar ações…" />}>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Utilizador</th><th>Ação</th><th>Entidade</th><th>Detalhes</th></tr></thead><tbody>{logs.loading ? <tr><td colSpan={5}><Empty>A carregar…</Empty></td></tr> : filteredLogs.length ? filteredLogs.map((log) => <tr key={log.id}><td>{formatDate(log.created_at)}</td><td>{log.user_name ?? 'Sistema'}<small>{log.user_email}</small></td><td>{log.action}</td><td>{log.entity_type} {log.entity_id && <small>{log.entity_id}</small>}</td><td><small>{log.metadata_json ? JSON.stringify(log.metadata_json).slice(0, 120) : '—'}</small></td></tr>) : <tr><td colSpan={5}><Empty>Sem registos.</Empty></td></tr>}</tbody></table></div>
    {integrations.data && <p className="admin-note">Estado das integrações: email {integrations.data.email.configured ? 'ativo' : 'pendente'} · WhatsApp {integrations.data.whatsapp.configured ? 'ativo' : 'pendente'} · R2 {integrations.data.storage.configured ? 'ativo' : 'pendente'}.</p>}
  </AdminSection>;
}
