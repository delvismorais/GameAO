import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';

export function Settings() {
  return (
    <PageShell crumbs={[{ label: 'Configurações' }]}>
      <h1 className="page-title">Configurações da Loja</h1>
      <p className="page-subtitle">Os preços da GameAO são apresentados diretamente no catálogo, carrinho, checkout e encomendas.</p>
      <div className="settings-current">
        <div><span>Apresentação de preços</span><strong>Direta</strong></div>
        <div><span>Loja</span><strong>GameAO</strong></div>
        <div><span>Estado</span><strong>Ativo</strong></div>
      </div>
      <section className="settings-panel">
        <h2>Informações da loja</h2>
        <p>Os valores apresentados no website não dependem de uma taxa de conversão visível. O painel administrativo mantém apenas os dados técnicos necessários para preservar o histórico das encomendas.</p>
        <div className="settings-actions"><Link className="btn btn--primary" to="/shop">Abrir loja</Link><Link className="btn btn--outline" to="/cart">Ver carrinho</Link></div>
      </section>
    </PageShell>
  );
}
