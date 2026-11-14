import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export interface BellNotification { id: number; title: string; message: string; link?: string | null; is_read?: number; created_at: string; type?: string }

interface Props {
  endpoint: string;
  markAllEndpoint?: string;
  markOneEndpoint?: (id: number) => string;
  viewAllHref: string;
  className?: string;
  compact?: boolean;
}

export function NotificationBell({ endpoint, markAllEndpoint, markOneEndpoint, viewAllHref, className = '', compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<BellNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(async () => {
    try {
      const response = await fetch(endpoint.includes('?') ? `${endpoint}&unread=1` : `${endpoint}?unread=1`, { credentials: 'include' });
      if (!response.ok) return;
      const data = await response.json() as { unread?: number; notifications?: BellNotification[] };
      setUnread(Number(data.unread ?? 0));
      if (data.notifications) setItems(data.notifications);
    } catch { /* silencioso */ }
  }, [endpoint]);

  useEffect(() => {
    void loadCount();
    const timer = window.setInterval(() => void loadCount(), 60_000);
    return () => window.clearInterval(timer);
  }, [loadCount]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => { if (open && root.current && !root.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const toggle = async () => {
    setOpen((value) => !value);
    if (open) return;
    setLoading(true);
    try {
      const response = await fetch(endpoint, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json() as { notifications?: BellNotification[]; unread?: number };
        setItems(data.notifications ?? []);
        setUnread(Number(data.unread ?? unread));
      }
    } finally { setLoading(false); }
  };

  const markAll = async () => {
    if (!markAllEndpoint) return;
    await fetch(markAllEndpoint, { method: 'POST', credentials: 'include' });
    setItems((current) => current.map((item) => ({ ...item, is_read: 1 })));
    setUnread(0);
  };

  const markOne = async (item: BellNotification) => {
    if (!markOneEndpoint || item.is_read) return;
    await fetch(markOneEndpoint(item.id), { method: 'PATCH', credentials: 'include' });
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: 1 } : entry));
    setUnread((value) => Math.max(0, value - 1));
  };

  return (
    <div className={`notif-bell ${compact ? 'is-compact' : ''} ${className}`.trim()} ref={root}>
      <button type="button" className="notif-bell__button" onClick={() => void toggle()} aria-label={`Notificações (${unread} não lidas)`} aria-expanded={open}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>
        {unread > 0 && <span className="notif-bell__count">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-bell__panel" role="menu">
          <header><strong>Notificações</strong>{markAllEndpoint && unread > 0 && <button type="button" onClick={() => void markAll()}>Marcar todas como lidas</button>}</header>
          <div className="notif-bell__list">
            {loading && <p className="notif-bell__empty">A carregar…</p>}
            {!loading && items.length === 0 && <p className="notif-bell__empty">Sem notificações por agora.</p>}
            {items.slice(0, 8).map((item) => {
              const content = <><strong>{item.title}</strong><span>{item.message}</span><small>{new Date(item.created_at).toLocaleString('pt-AO')}</small></>;
              const target = item.link || viewAllHref;
              return (
                <a key={item.id} className={`notif-bell__item ${item.is_read ? '' : 'is-unread'}`.trim()} href={target} onClick={() => void markOne(item)}>
                  {content}
                </a>
              );
            })}
          </div>
          <Link className="notif-bell__all" to={viewAllHref} onClick={() => setOpen(false)}>Ver todas</Link>
        </div>
      )}
    </div>
  );
}
