import { useState } from 'react';
import { AdminSection, Empty, Notice, downloadUrl, formatKz, useJson } from './ui';
import { LineChart } from './AdminCharts';
import type { AdminSectionId } from './adminNav';

type Stats = { daily: Array<{ day: string; orders: string; revenue: string }>; statuses: Array<{ status: string; total: string; revenue: string }>; topProducts: Array<{ product_name: string; units: string; revenue: string }>; customers: { total: number; recent: number }; content: { posts: number; views: number; pending_comments: number; new_messages: number }; topPosts: Array<{ slug: string; title: string; views: number; comments_count: number }>; notifications: { unread_admin: number; sent: number; failed: number; not_configured: number } };
type Finance = { totals: { revenue: string; discounts: string; shipping: string; orders: string }; byMethod: Array<{ method: string; orders: string; revenue: string }> };

const STATUS_LABEL: Record<string, string> = { awaiting_payment: 'A aguardar pagamento', payment_verification: 'Em verificação', payment_confirmed: 'Pagamento confirmado', processing: 'Em processamento', ready_for_delivery: 'Pronta', completed: 'Concluída', cancelled: 'Cancelada', refunded: 'Reembolsada' };

export function AdminStats({ section }: { section: AdminSectionId }) {
  const [days, setDays] = useState(30);
  const stats = useJson<Stats>(`/api/admin/stats?days=${days}`, [days]);
  const finance = useJson<Finance>(`/api/admin/reports/finance?days=${days}`, [days]);
  const title = section === 'reports' ? 'Relatórios' : 'Estatísticas de vendas';
  return <AdminSection title={title} subtitle="Dados reais da base de dados, atualizados a cada consulta." actions={<><label className="admin-period"><span>Período</span><select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={7}>7 dias</option><option value={30}>30 dias</option><option value={90}>90 dias</option><option value={365}>365 dias</option></select></label><button type="button" className="btn btn--outline btn--sm" onClick={() => downloadUrl('/api/admin/export?type=orders')}>Exportar CSV</button></>}>
    {stats.error && <Notice tone="error" message={stats.error} />}
    <div className="admin-kpis admin-kpis--compact"><article><span>Receita</span><strong>{formatKz(finance.data?.totals.revenue)}</strong><small>{finance.data?.totals.orders ?? 0} encomendas</small></article><article><span>Descontos</span><strong>{formatKz(finance.data?.totals.discounts)}</strong><small>cupões</small></article><article><span>Portes</span><strong>{formatKz(finance.data?.totals.shipping)}</strong><small>entregas</small></article><article><span>Clientes</span><strong>{stats.data?.customers.total ?? 0}</strong><small>{stats.data?.customers.recent ?? 0} novos em 30 dias</small></article></div>
    <div className="admin-dashboard__grid">
      <AdminSection title="Evolução diária" className="is-span-2">{stats.data?.daily?.length ? <LineChart data={stats.data.daily.map((point) => ({ day: point.day, revenue: Number(point.revenue), orders: Number(point.orders) }))} height={240} /> : <Empty>Sem dados.</Empty>}</AdminSection>
      <AdminSection title="Receita por método">{finance.data?.byMethod.length ? <table className="admin-table"><thead><tr><th>Método</th><th>Encomendas</th><th>Receita</th></tr></thead><tbody>{finance.data.byMethod.map((row) => <tr key={row.method}><td>{row.method.replaceAll('_', ' ')}</td><td>{row.orders}</td><td>{formatKz(row.revenue)}</td></tr>)}</tbody></table> : <Empty>Sem dados.</Empty>}</AdminSection>
      <AdminSection title="Produtos mais vendidos">{stats.data?.topProducts.length ? <table className="admin-table"><thead><tr><th>Produto</th><th>Unidades</th><th>Receita</th></tr></thead><tbody>{stats.data.topProducts.map((product) => <tr key={product.product_name}><td>{product.product_name}</td><td>{product.units}</td><td>{formatKz(product.revenue)}</td></tr>)}</tbody></table> : <Empty>Sem vendas.</Empty>}</AdminSection>
      <AdminSection title="Estado das encomendas"><table className="admin-table"><thead><tr><th>Estado</th><th>Total</th><th>Receita</th></tr></thead><tbody>{(stats.data?.statuses ?? []).map((row) => <tr key={row.status}><td>{STATUS_LABEL[row.status] ?? row.status}</td><td>{row.total}</td><td>{formatKz(row.revenue)}</td></tr>)}</tbody></table></AdminSection>
      <AdminSection title="Conteúdo mais visto">{stats.data?.topPosts.length ? <table className="admin-table"><thead><tr><th>Artigo</th><th>Views</th><th>Comentários</th></tr></thead><tbody>{stats.data.topPosts.map((post) => <tr key={post.slug}><td>{post.title}</td><td>{post.views}</td><td>{post.comments_count}</td></tr>)}</tbody></table> : <Empty>Sem artigos.</Empty>}</AdminSection>
      <AdminSection title="Comunicação">{stats.data ? <div className="admin-mini-stats"><div><strong>{stats.data.notifications.sent}</strong><span>Envios com sucesso</span></div><div><strong>{stats.data.notifications.failed}</strong><span>Falhas</span></div><div><strong>{stats.data.notifications.not_configured}</strong><span>Não configurados</span></div><div><strong>{stats.data.content.pending_comments}</strong><span>Comentários pendentes</span></div></div> : <Empty>A carregar…</Empty>}</AdminSection>
    </div>
  </AdminSection>;
}
