import { useState } from 'react';
import { AdminSection, Badge, Empty, Field, Modal, Notice, api, formatDate, formatKz, useJson } from './ui';
import type { AdminSectionId } from './adminNav';

type Customer = { id: number; name: string; email: string; phone?: string; role: string; is_active: number; created_at: string; last_login_at?: string; order_count: number; total_spent: number; last_order_at?: string };
type Admin = { id: number; name: string; email: string; phone?: string; role: string; is_active: number; last_login_at?: string; created_at: string };

const ROLES: Array<{ id: string; label: string; description: string; permissions: string[] }> = [
  { id: 'super_admin', label: 'Super Administrador', description: 'Acesso total, incluindo criar e alterar administradores.', permissions: ['Tudo', 'Administradores', 'Configurações', 'Pagamentos'] },
  { id: 'admin', label: 'Administrador', description: 'Gestão operacional completa sem alterar super administradores.', permissions: ['Encomendas', 'Produtos', 'Conteúdos', 'Pagamentos', 'Clientes'] },
  { id: 'product_manager', label: 'Gestor de produtos', description: 'Catálogo, categorias, stock e imagens.', permissions: ['Produtos', 'Categorias', 'Stock', 'Multimédia'] },
  { id: 'order_manager', label: 'Gestor de encomendas', description: 'Encomendas, comprovativos e entregas.', permissions: ['Encomendas', 'Comprovativos', 'Entregas', 'Faturas'] },
  { id: 'content_manager', label: 'Gestor de conteúdos', description: 'Blog, banners, popups e páginas.', permissions: ['Blog', 'Banners', 'Popups', 'Páginas'] },
  { id: 'support', label: 'Suporte', description: 'Consulta de encomendas e mensagens de clientes.', permissions: ['Encomendas (leitura)', 'Mensagens', 'Comentários'] },
];

export function AdminCustomers({ section }: { section: AdminSectionId }) {
  if (section === 'admins') return <AdminAdmins />;
  if (section === 'roles') return <AdminRoles />;
  return <AdminCustomerList accounts={section === 'accounts'} />;
}

function AdminCustomerList({ accounts }: { accounts: boolean }) {
  const [search, setSearch] = useState('');
  const { data, loading, reload } = useJson<{ customers: Customer[] }>(`/api/admin/customers?q=${encodeURIComponent(search)}`, [search]);
  return <AdminSection title={accounts ? 'Contas registadas' : 'Clientes'} subtitle="Clientes com encomendas, total gasto e último acesso." actions={<><button type="button" className="btn btn--outline btn--sm" onClick={() => void reload()}>Atualizar</button><button type="button" className="btn btn--outline btn--sm" onClick={() => { window.location.href = '/api/admin/export?type=customers'; }}>Exportar CSV</button></>}>
    <div className="admin-filterbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar nome, email ou telefone…" /></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Cliente</th><th>Contacto</th><th>Encomendas</th><th>Total gasto</th><th>Registo</th><th>Último acesso</th></tr></thead><tbody>{loading ? <tr><td colSpan={6}><Empty>A carregar…</Empty></td></tr> : data?.customers.length ? data.customers.map((customer) => <tr key={customer.id}><td><strong>{customer.name}</strong><small>#{customer.id} · {customer.role}</small></td><td>{customer.email}<small>{customer.phone ?? 'Sem telefone'}</small></td><td>{customer.order_count}<small>Última: {formatDate(customer.last_order_at)}</small></td><td>{formatKz(customer.total_spent)}</td><td>{formatDate(customer.created_at)}</td><td>{formatDate(customer.last_login_at)}</td></tr>) : <tr><td colSpan={6}><Empty>Sem clientes registados.</Empty></td></tr>}</tbody></table></div>
  </AdminSection>;
}

function AdminAdmins() {
  const { data, loading, reload } = useJson<{ admins: Admin[] }>('/api/admin/admins');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<'success' | 'error'>('success');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'admin', isActive: true });
  const openCreate = () => { setForm({ name: '', email: '', phone: '', password: '', role: 'admin', isActive: true }); setCreating(true); };
  const openEdit = (admin: Admin) => { setForm({ name: admin.name, email: admin.email, phone: admin.phone ?? '', password: '', role: admin.role, isActive: Boolean(admin.is_active) }); setEditing(admin); };
  const save = async () => {
    const result = editing ? await api(`/api/admin/admins/${editing.id}`, { method: 'PUT', body: JSON.stringify({ name: form.name, phone: form.phone, role: form.role, isActive: form.isActive, password: form.password || undefined }) }) : await api('/api/admin/admins', { method: 'POST', body: JSON.stringify(form) });
    setMessage(result.ok ? 'Administrador guardado.' : result.error ?? 'Falha ao guardar.'); setTone(result.ok ? 'success' : 'error'); if (result.ok) { setCreating(false); setEditing(null); await reload(); }
  };
  return <AdminSection title="Administradores" subtitle="Contas com acesso ao painel. Apenas o Super Administrador pode criar ou alterar outras contas." actions={<button type="button" className="btn btn--primary btn--sm" onClick={openCreate}>Novo administrador</button>}>
    <Notice message={message} tone={tone} />
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nome</th><th>Email</th><th>Função</th><th>Estado</th><th>Último acesso</th><th /></tr></thead><tbody>{loading ? <tr><td colSpan={6}><Empty>A carregar…</Empty></td></tr> : data?.admins.map((admin) => <tr key={admin.id}><td>{admin.name}<small>{admin.phone ?? 'Sem telefone'}</small></td><td>{admin.email}</td><td><Badge tone="info">{ROLES.find((role) => role.id === admin.role)?.label ?? admin.role}</Badge></td><td><Badge tone={admin.is_active ? 'success' : 'danger'}>{admin.is_active ? 'Ativo' : 'Inativo'}</Badge></td><td>{formatDate(admin.last_login_at)}</td><td><button type="button" className="btn btn--outline btn--sm" onClick={() => openEdit(admin)}>Editar</button></td></tr>)}</tbody></table></div>
    <Modal open={creating || Boolean(editing)} title={editing ? `Editar ${editing.name}` : 'Novo administrador'} onClose={() => { setCreating(false); setEditing(null); }}>
      <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <Field label="Nome *"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        {!editing && <Field label="Email *"><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>}
        <Field label="Telefone"><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        <Field label={editing ? 'Nova palavra-passe (opcional)' : 'Palavra-passe *'} hint="Mínimo 6 caracteres."><input type="password" required={!editing} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field>
        <Field label="Função"><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></Field>
        <label className="admin-check"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} /> Conta ativa</label>
        <div className="admin-form__actions"><button type="submit" className="btn btn--primary">Guardar</button><button type="button" className="btn btn--outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</button></div>
      </form>
    </Modal>
  </AdminSection>;
}

function AdminRoles() {
  return <AdminSection title="Funções e permissões" subtitle="As permissões são verificadas no servidor em cada pedido. As funções abaixo definem o alcance operacional.">
    <div className="admin-role-grid">{ROLES.map((role) => <article key={role.id} className="admin-role"><header><strong>{role.label}</strong><code>{role.id}</code></header><p>{role.description}</p><ul>{role.permissions.map((permission) => <li key={permission}>{permission}</li>)}</ul></article>)}</div>
  </AdminSection>;
}
