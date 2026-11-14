import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ADMIN_NAV, GROUP_LABELS, SECTION_LABELS, type AdminSectionId } from './adminNav';
import { AdminIcon } from './AdminIcon';
import { NotificationBell } from '../layout/NotificationBell';

interface AdminShellProps {
  section: AdminSectionId;
  onNavigate: (section: AdminSectionId) => void;
  children: ReactNode;
  pendingProofs?: number;
  pendingOrders?: number;
}

export function AdminShell({ section, onNavigate, children, pendingProofs = 0, pendingOrders = 0 }: AdminShellProps) {
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(ADMIN_NAV.map((group) => [group.id, true])));
  const [drawer, setDrawer] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    void fetch('/api/auth/me', { credentials: 'include' }).then((response) => response.ok ? response.json() : null).then((data: { user?: { name: string; email: string; role: string } } | null) => { if (data?.user) setUser(data.user); }).catch(() => undefined);
  }, []);

  useEffect(() => { setDrawer(false); }, [section]);

  const activeGroup = ADMIN_NAV.find((group) => group.items.some((item) => item.id === section));

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return ADMIN_NAV;
    return ADMIN_NAV.map((group) => ({ ...group, items: group.items.filter((item) => `${item.label} ${group.label}`.toLowerCase().includes(query)) })).filter((group) => group.items.length > 0);
  }, [search]);

  const badgeFor = (id: AdminSectionId) => id === 'proofs' ? pendingProofs : id === 'orders-pending' ? pendingOrders : 0;

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    window.location.href = '/my-account';
  };

  const nav = (
    <nav className="admin-nav" aria-label="Menu administrativo">
      <div className="admin-nav__identity"><img src="/assets/gameao-logo.png" alt="GameAO" /><span>Painel Admin<br />{user?.role === 'super_admin' ? 'Super Administrador' : user?.role === 'admin' ? 'Administrador' : 'Equipa GameAO'}</span></div>
      <label className="admin-nav__search"><span className="sr-only">Pesquisar opções do menu</span><AdminIcon name="search" size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar opções…" /></label>
      <div className="admin-nav__scroll">
        {filtered.map((group) => {
          const isOpen = search.trim() ? true : openGroups[group.id] !== false;
          return (
            <section className="admin-nav__group" key={group.id}>
              <button type="button" className={`admin-nav__group-head ${group.id === activeGroup?.id ? 'is-current' : ''}`.trim()} onClick={() => setOpenGroups((current) => ({ ...current, [group.id]: !isOpen }))} aria-expanded={isOpen}>
                <AdminIcon name={group.icon} size={14} /><span>{group.label}</span><AdminIcon name="chevron" size={12} />
              </button>
              {isOpen && <div className="admin-nav__items">{group.items.map((item) => <button type="button" key={item.id} className={section === item.id ? 'is-active' : ''} onClick={() => onNavigate(item.id)}><AdminIcon name={item.icon} size={15} /><span>{item.label}</span>{badgeFor(item.id) > 0 && <em>{badgeFor(item.id)}</em>}</button>)}</div>}
            </section>
          );
        })}
        {filtered.length === 0 && <p className="admin-nav__empty">Nenhuma opção encontrada.</p>}
      </div>
      <div className="admin-nav__bottom"><Link to="/" target="_blank" rel="noopener noreferrer"><AdminIcon name="home" size={15} /> Ver website</Link><button type="button" onClick={() => void logout()}><AdminIcon name="logout" size={15} /> Terminar sessão</button></div>
    </nav>
  );

  return (
    <div className={`admin-shell ${drawer ? 'is-drawer-open' : ''}`.trim()}>
      <div className="admin-drawer-backdrop" onClick={() => setDrawer(false)} aria-hidden="true" />
      <aside className="admin-sidebar">{nav}</aside>
      <main className="admin-main">
        <div className="admin-topbar">
          <button type="button" className="admin-topbar__menu" onClick={() => setDrawer(true)} aria-label="Abrir menu administrativo"><AdminIcon name="menu" /></button>
          <div className="admin-topbar__crumb"><span>{activeGroup ? GROUP_LABELS[activeGroup.id] : 'Administração'}</span><AdminIcon name="chevron" size={12} /><strong>{SECTION_LABELS[section] ?? 'Dashboard'}</strong></div>
          <div className="admin-topbar__tools">
            <NotificationBell endpoint="/api/admin/notifications?limit=10" markAllEndpoint="/api/admin/notifications/read-all" markOneEndpoint={(id) => `/api/admin/notifications/${id}/read`} viewAllHref="/admin?secao=notifications" compact />
            <Link to="/" className="admin-topbar__link" title="Ver website">Ver website</Link>
            <div className="admin-topbar__user" title={user?.email}><span>{user?.name ?? 'Administrador'}</span><small>{user?.role === 'super_admin' ? 'Super Admin' : user?.role ?? ''}</small></div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
