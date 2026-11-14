import { useCallback, useEffect, useState, type ReactNode } from 'react';

export const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatKz(value: number | string | null | undefined): string {
  return money.format(Number(value ?? 0));
}

export function formatDate(value: string | null | undefined, withTime = true): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('pt-AO', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' });
}

export function shortDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export async function api<T = unknown>(url: string, options?: RequestInit): Promise<{ ok: boolean; data: T; error?: string }> {
  try {
    const response = await fetch(url, { credentials: 'include', ...options, headers: { ...(options?.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...options?.headers } });
    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json') ? await response.json() as T & { message?: string; error?: string } : await response.text() as unknown as T;
    if (!response.ok) return { ok: false, data, error: (data as { message?: string; error?: string })?.message ?? (data as { error?: string })?.error ?? `HTTP ${response.status}` };
    return { ok: true, data };
  } catch {
    return { ok: false, data: {} as T, error: 'Não foi possível contactar o servidor.' };
  }
}

export function useJson<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setLoading(true);
    const result = await api<T>(url);
    if (result.ok) { setData(result.data); setError(''); } else setError(result.error ?? 'Erro ao carregar.');
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload, setData };
}

export function AdminSection({ title, subtitle, actions, children, className = '' }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`admin-card admin-section ${className}`.trim()}>
      <div className="admin-card__head">
        <div><h2>{title}</h2>{subtitle && <p className="admin-card__subhead">{subtitle}</p>}</div>
        {actions && <div className="admin-section__actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function Notice({ message, tone = 'info' }: { message?: string; tone?: 'info' | 'success' | 'error' | 'warning' }) {
  if (!message) return null;
  return <p className={`admin-notice admin-notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{message}</p>;
}

export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'success' | 'warning' | 'danger' | 'info' | 'muted' }) {
  return <span className={`admin-badge admin-badge--${tone}`}>{children}</span>;
}

const STATUS_META: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'muted' }> = {
  awaiting_payment: { label: 'A aguardar pagamento', tone: 'warning' },
  payment_verification: { label: 'Comprovativo em verificação', tone: 'info' },
  payment_confirmed: { label: 'Pagamento confirmado', tone: 'success' },
  processing: { label: 'Em processamento', tone: 'info' },
  ready_for_delivery: { label: 'Pronta para entrega', tone: 'info' },
  completed: { label: 'Concluída', tone: 'success' },
  cancelled: { label: 'Cancelada', tone: 'danger' },
  refunded: { label: 'Reembolsada', tone: 'muted' },
  paid: { label: 'Pago', tone: 'success' },
  pending: { label: 'Pendente', tone: 'warning' },
  submitted: { label: 'Enviado', tone: 'info' },
  approved: { label: 'Aprovado', tone: 'success' },
  rejected: { label: 'Rejeitado', tone: 'danger' },
  request_new: { label: 'Novo envio pedido', tone: 'warning' },
  active: { label: 'Ativo', tone: 'success' },
  suspended: { label: 'Suspenso', tone: 'danger' },
  sent: { label: 'Enviado', tone: 'success' },
  failed: { label: 'Falhou', tone: 'danger' },
  not_configured: { label: 'Não configurado', tone: 'warning' },
  skipped: { label: 'Ignorado', tone: 'muted' },
};

export function statusLabel(status: string): string { return STATUS_META[status]?.label ?? status.replaceAll('_', ' '); }
export function statusTone(status: string) { return STATUS_META[status]?.tone ?? 'muted'; }

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{statusLabel(status)}</Badge>;
}

export function Modal({ open, title, onClose, children, wide = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className={`admin-modal__panel ${wide ? 'is-wide' : ''}`.trim()} onClick={(event) => event.stopPropagation()}>
        <header><h2>{title}</h2><button type="button" className="admin-modal__close" onClick={onClose} aria-label="Fechar">×</button></header>
        <div className="admin-modal__body">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) { return <p className="admin-empty-state">{children}</p>; }

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field admin-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: Array<{ id: T; label: string }>; active: T; onChange: (id: T) => void }) {
  return <div className="admin-tabs">{tabs.map((tab) => <button key={tab.id} type="button" className={active === tab.id ? 'is-active' : ''} onClick={() => onChange(tab.id)}>{tab.label}</button>)}</div>;
}

export function downloadUrl(url: string) { const anchor = document.createElement('a'); anchor.href = url; anchor.rel = 'noopener'; document.body.appendChild(anchor); anchor.click(); anchor.remove(); }
