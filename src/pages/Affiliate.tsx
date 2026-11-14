import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatUsdAsAoa } from '../lib/pricing';

type Affiliate = { id: number; code: string; status: string; commission_rate: number; balance_aoa: number; total_earned_aoa: number; total_paid_aoa: number; clicks?: number };
type Referral = { id: number; status: string; order_total_aoa: number; commission_aoa: number; created_at: string };
type Payout = { id: number; amount_aoa: number; method: string; reference?: string; status: string; created_at: string };

export function Affiliate() {
  const { user } = useStore();
  const { showToast } = useToast();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [siteUrl, setSiteUrl] = useState(window.location.origin);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = async () => {
    const response = await fetch('/api/account/affiliate', { credentials: 'include' });
    if (!response.ok) { setLoading(false); return; }
    const data = await response.json() as { affiliate?: Affiliate | null; referrals?: Referral[]; payouts?: Payout[]; siteUrl?: string };
    setAffiliate(data.affiliate ?? null); setReferrals(data.referrals ?? []); setPayouts(data.payouts ?? []); if (data.siteUrl) setSiteUrl(data.siteUrl); setLoading(false);
  };
  useEffect(() => { if (user) void load().catch(() => setLoading(false)); else setLoading(false); }, [user]);

  if (!user) return <PageShell crumbs={[{ label: 'Afiliados' }]}><EmptyState title="Inicie sessão para participar" icon="user" action={<Link to="/my-account" className="btn btn--primary">Abrir minha conta</Link>}>O programa de afiliados GameAO permite recomendar produtos e acompanhar as suas comissões.</EmptyState></PageShell>;
  if (loading) return <PageShell crumbs={[{ label: 'Afiliados' }]}><p className="admin-state">A carregar a sua área de afiliado…</p></PageShell>;

  const join = async () => { setJoining(true); const response = await fetch('/api/account/affiliate/join', { method: 'POST', credentials: 'include' }); const data = await response.json().catch(() => null) as { message?: string } | null; setJoining(false); if (response.ok) { showToast(data?.message ?? 'Programa ativado.'); await load(); } else showToast(data?.message ?? 'Não foi possível ativar o programa.', 'error'); };
  const withdraw = async () => { setWithdrawing(true); const response = await fetch('/api/account/affiliate/withdraw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ method: 'Contacto GameAO' }) }); const data = await response.json().catch(() => null) as { message?: string } | null; setWithdrawing(false); showToast(data?.message ?? (response.ok ? 'Pedido enviado.' : 'Não foi possível pedir o levantamento.'), response.ok ? 'info' : 'error'); if (response.ok) await load(); };
  const link = affiliate ? `${siteUrl}/?ref=${encodeURIComponent(affiliate.code)}` : '';

  return <PageShell crumbs={[{ label: 'Afiliados' }]}>
    <div className="account-content affiliate-page">
      <header className="static-head"><p className="page-kicker">Programa GameAO</p><h1>Área de afiliados</h1><p>Recomende a GameAO, acompanhe as vendas atribuídas ao seu código e solicite o levantamento das comissões.</p></header>
      {!affiliate ? <section className="account-section"><h2>Ative o seu código</h2><p>O programa é opcional. Ao aderir, receberá um código único para partilhar com a sua comunidade.</p><button className="btn btn--primary" type="button" onClick={() => void join()} disabled={joining}>{joining ? 'A ativar…' : 'Participar no programa'}</button></section> : <>
        <section className="account-summary"><div><span>Saldo disponível</span><strong>{formatUsdAsAoa(Number(affiliate.balance_aoa) / 913, 913)}</strong><small>Solicitar levantamento abaixo</small></div><div><span>Total gerado</span><strong>{formatUsdAsAoa(Number(affiliate.total_earned_aoa) / 913, 913)}</strong><small>{affiliate.commission_rate}% de comissão</small></div><div><span>Cliques</span><strong>{affiliate.clicks ?? 0}</strong><small>Visitas pelo seu link</small></div><div><span>Estado</span><strong>{affiliate.status === 'active' ? 'Ativo' : affiliate.status}</strong><small>Código: {affiliate.code}</small></div></section>
        <section className="account-section"><h2>O seu link de convite</h2><div className="field"><input readOnly value={link} onFocus={(event) => event.currentTarget.select()} /></div><div className="admin-row-actions"><button type="button" className="btn btn--primary" onClick={() => { void navigator.clipboard?.writeText(link); showToast('Link copiado.'); }}>Copiar link</button>{Number(affiliate.balance_aoa) > 0 && <button type="button" className="btn btn--outline" onClick={() => void withdraw()} disabled={withdrawing}>{withdrawing ? 'A enviar…' : 'Solicitar levantamento'}</button>}</div></section>
        <section className="account-section"><h2>Vendas atribuídas</h2>{referrals.length === 0 ? <p className="account-empty">Ainda não existem vendas atribuídas ao seu código.</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Estado</th><th>Valor</th><th>Comissão</th></tr></thead><tbody>{referrals.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleDateString('pt-AO')}</td><td>{row.status}</td><td>{formatUsdAsAoa(Number(row.order_total_aoa) / 913, 913)}</td><td>{formatUsdAsAoa(Number(row.commission_aoa) / 913, 913)}</td></tr>)}</tbody></table></div>}</section>
        <section className="account-section"><h2>Pedidos de levantamento</h2>{payouts.length === 0 ? <p className="account-empty">Ainda não existem pedidos de levantamento.</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Valor</th><th>Método</th><th>Estado</th></tr></thead><tbody>{payouts.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleDateString('pt-AO')}</td><td>{formatUsdAsAoa(Number(row.amount_aoa) / 913, 913)}</td><td>{row.method}</td><td>{row.status}</td></tr>)}</tbody></table></div>}</section>
      </>}
    </div>
  </PageShell>;
}
