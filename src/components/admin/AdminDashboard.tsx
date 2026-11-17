import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bars, Donut, LineChart } from './AdminCharts';
import { AdminSection, Empty, Notice, StatusBadge, formatDate, formatKz, useJson } from './ui';
import { AdminIcon } from './AdminIcon';
import type { AdminSectionId } from './adminNav';

type Overview = { orders: { total: number; revenue: number; revenueToday: number; revenueMonth: number; pending: number; paymentPending: number; paid: number; processing: number; completed: number }; customers: { total: number }; products: { total: number; active: number }; posts: { total: number; published: number } };
type Stats = { daily: Array<{ day: string; orders: string | number; revenue: string | number }>; statuses: Array<{ status: string; total: string | number; revenue: string | number }>; topProducts: Array<{ product_name: string; units: string | number; revenue: string | number }>; customers: { total: number; recent: number }; content: { posts: number; views: number; pending_comments: number; new_messages: number }; topPosts: Array<{ slug: string; title: string; views: number; comments_count: number }>; notifications: { unread_admin: number; sent: number; failed: number; not_configured: number } };
type Order = { order_number: string; customer_name: string; total_aoa: number; status: string; payment_status: string; created_at: string };
type Finance = { byMethod: Array<{ method: string; orders: number; revenue: string }> };
type AuditLog = { id: number; action: string; entity_type: string; entity_id?: string; user_name?: string; created_at: string };

const STATUS_LABEL: Record<string, string> = { awaiting_payment: 'A aguardar pagamento', payment_verification: 'Em verificação', payment_confirmed: 'Pagamento confirmado', processing: 'Em processamento', ready_for_delivery: 'Pronta', completed: 'Concluída', cancelled: 'Cancelada', refunded: 'Reembolsada' };

export function AdminDashboard({ onNavigate }: { onNavigate: (section: AdminSectionId) => void }) {
  const [days, setDays] = useState(30);
  const overview = useJson<Overview>('/api/admin/overview');
  const stats = useJson<Stats>(`/api/admin/stats?days=${days}`, [days]);
  const orders = useJson<{ orders: Order[] }>('/api/admin/orders?limit=8');
  const finance = useJson<Finance>(`/api/admin/reports/finance?days=${days}`, [days]);
  const logs = useJson<{ logs: AuditLog[] }>('/api/admin/audit-logs?limit=8');
  const o = overview.data?.orders;
  const s = stats.data;
  const kpis = [
    { label: 'Faturação total', value: formatKz(o?.revenue), hint: `${formatKz(o?.revenueMonth)} este mês`, section: 'finance-reports' as AdminSectionId, tone: 'green' },
    { label: 'Vendas hoje', value: formatKz(o?.revenueToday), hint: `${o?.total ?? 0} encomendas no total`, section: 'stats' as AdminSectionId, tone: 'teal' },
    { label: 'Total de encomendas', value: String(o?.total ?? 0), hint: `${o?.processing ?? 0} em processamento`, section: 'orders' as AdminSectionId, tone: 'blue' },
    { label: 'Clientes ativos', value: String(overview.data?.customers.total ?? 0), hint: `${o?.paymentPending ?? 0} pagamentos por confirmar`, section: 'customers' as AdminSectionId, tone: 'orange' },
  ];
  return (
    <div className="admin-dashboard">
      <div className="admin-head admin-head--inner"><div><p className="page-kicker">GameAO · operação</p><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Visão em tempo real das vendas, pagamentos e atividade da loja.</p></div><label className="admin-period"><span>Período</span><select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option></select></label></div>
      {(overview.error || stats.error) && <Notice tone="error" message={overview.error || stats.error} />}
      <section className="admin-kpis" aria-label="Indicadores">{kpis.map((kpi) => <button type="button" className={`admin-kpi-card admin-kpi-card--${kpi.tone}`} key={kpi.label} onClick={() => onNavigate(kpi.section)}><span>{kpi.label}</span><strong>{kpi.value}</strong><small>{kpi.hint}</small><i aria-hidden="true" /></button>)}</section>
      <div className="admin-dashboard__grid">
        <AdminSection title="Evolução da faturação" subtitle={`Faturação diária nos últimos ${days} dias`} actions={<button type="button" className="btn btn--outline btn--sm" onClick={() => onNavigate('stats')}>Estatísticas</button>}>
          {stats.loading ? <p className="admin-state">A carregar…</p> : s?.daily?.length ? <LineChart data={s.daily.map((point) => ({ day: point.day, revenue: Number(point.revenue), orders: Number(point.orders) }))} /> : <Empty>Sem dados de vendas neste período.</Empty>}
        </AdminSection>
        <AdminSection title="Estado das encomendas" subtitle="Distribuição atual">
          {s ? <Bars data={s.statuses.map((row) => ({ label: STATUS_LABEL[row.status] ?? row.status, value: Number(row.total), tone: row.status === 'completed' ? 'success' : row.status === 'cancelled' ? 'danger' : undefined }))} /> : <p className="admin-state">A carregar…</p>}
        </AdminSection>
        <AdminSection title="Métodos de pagamento" subtitle="Receita por modalidade">
          {finance.data?.byMethod?.length ? <Donut data={finance.data.byMethod.map((row) => ({ label: row.method, value: Number(row.orders) }))} /> : <Empty>Ainda sem pagamentos registados.</Empty>}
        </AdminSection>
        <AdminSection title="Produtos mais vendidos" subtitle="Por receita no período">
          {s?.topProducts?.length ? <ol className="admin-rank">{s.topProducts.map((product, index) => <li key={product.product_name}><em>{index + 1}</em><div><strong>{product.product_name}</strong><small>{product.units} unidades</small></div><span>{formatKz(product.revenue)}</span></li>)}</ol> : <Empty>Ainda sem vendas de produtos.</Empty>}
        </AdminSection>
        <AdminSection title="Últimas encomendas" subtitle="Atividade mais recente" className="is-span-2" actions={<button type="button" className="btn btn--outline btn--sm" onClick={() => onNavigate('orders')}>Ver todas</button>}>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Encomenda</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Data</th></tr></thead><tbody>{orders.data?.orders?.length ? orders.data.orders.map((order) => <tr key={order.order_number}><td><button type="button" className="admin-link" onClick={() => onNavigate('orders')}>{order.order_number}</button></td><td>{order.customer_name}</td><td>{formatKz(order.total_aoa)}</td><td><StatusBadge status={order.status} /></td><td>{formatDate(order.created_at)}</td></tr>) : <tr><td colSpan={5}><Empty>Ainda não existem encomendas.</Empty></td></tr>}</tbody></table></div>
        </AdminSection>
        <AdminSection title="Atividade recente" subtitle="Ações administrativas" actions={<button type="button" className="btn btn--outline btn--sm" onClick={() => onNavigate('audit')}>Registos</button>}>
          {logs.data?.logs?.length ? <ul className="admin-activity">{logs.data.logs.map((log) => <li key={log.id}><AdminIcon name="activity" size={15} /><div><strong>{log.action.replaceAll('.', ' · ')}</strong><small>{log.user_name ?? 'Sistema'} · {log.entity_type} {log.entity_id ?? ''}</small></div><span>{formatDate(log.created_at)}</span></li>)}</ul> : <Empty>Sem atividade registada.</Empty>}
        </AdminSection>
        <AdminSection title="Conteúdo e comunicação" subtitle="Estado do blog e notificações">
          <div className="admin-mini-stats">
            <Link to="/admin?secao=blog"><strong>{s?.content.posts ?? 0}</strong><span>Artigos publicados</span></Link>
            <Link to="/admin?secao=blog"><strong>{s?.content.views ?? 0}</strong><span>Visualizações</span></Link>
            <Link to="/admin?secao=comments"><strong>{s?.content.pending_comments ?? 0}</strong><span>Comentários pendentes</span></Link>
            <Link to="/admin?secao=contact"><strong>{s?.content.new_messages ?? 0}</strong><span>Mensagens novas</span></Link>
            <Link to="/admin?secao=notifications"><strong>{s?.notifications.unread_admin ?? 0}</strong><span>Alertas por ler</span></Link>
            <Link to="/admin?secao=notifications"><strong>{s?.notifications.failed ?? 0}</strong><span>Envios falhados</span></Link>
          </div>
        </AdminSection>
      </div>
    </div>
  );
}
