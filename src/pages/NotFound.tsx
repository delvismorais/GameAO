import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { useSeo } from '../lib/seo';

export function NotFound() {
  useSeo({
    title: 'Página não encontrada | GameAO',
    description: 'A página que procura não existe ou foi movida.',
    noindex: true,
  });
  return (
    <PageShell crumbs={[{ label: 'Página não encontrada' }]}>
      <EmptyState
        title="404 — Página não encontrada"
        icon="🎮"
        action={
          <div className="empty-actions">
            <Link to="/" className="btn btn--primary">Voltar ao Início</Link>
            <Link to="/shop" className="btn btn--outline">Ir para a Loja</Link>
          </div>
        }
      >
        O endereço que procura não existe ou foi alterado. Explore a loja para continuar.
      </EmptyState>
    </PageShell>
  );
}
