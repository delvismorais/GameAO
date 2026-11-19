import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { Price } from '../components/ui/Price';
import { Icon } from '../components/ui/Icon';
import { BlogSidebar } from '../components/blog/BlogSidebar';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { getEffectivePriceUsd, getProductById } from '../data/products';

export function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const { showToast } = useToast();
  const products = wishlist.map((id) => getProductById(id)).filter((product) => product !== undefined);

  return (
    <PageShell crumbs={[{ label: 'Lista de Desejos' }]}>
      <div className="sidebar-layout">
        <div className="sidebar-layout__main">
          <h1 className="page-title">Lista de Desejos</h1>
          {products.length === 0 ? (
            <EmptyState
              title="A lista de desejos está vazia."
              icon="♡"
              action={<Link to="/shop" className="btn btn--primary">Explorar a Loja</Link>}
            >
              Guarde os jogos que quer comprar mais tarde. A lista fica neste dispositivo.
            </EmptyState>
          ) : (
            <table className="wishlist-table">
              <thead>
                <tr>
                  <th aria-label="Remover" />
                  <th>Produto</th>
                  <th>Preço</th>
                  <th>Estado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <button
                        type="button"
                        className="remove-link"
                        onClick={() => {
                          toggleWishlist(product.id);
                          showToast(`${product.name} removido da lista de desejos.`, 'info');
                        }}
                        aria-label={`Remover ${product.name}`}
                      >
                        <Icon name="close" />
                      </button>
                    </td>
                    <td>
                      <Link to={`/product/${product.slug}`} className="wishlist-product">
                        <img src={product.imageCard} alt="" />
                        <span>{product.name}</span>
                      </Link>
                    </td>
                    <td><Price usd={getEffectivePriceUsd(product)} baseUsd={product.basePriceUsd} size="sm" /></td>
                    <td><span className="stock-in">Em stock</span></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => {
                          const added = addToCart(product.id);
                          showToast(added ? `${product.name} adicionado ao carrinho.` : 'Escolha uma opção na página do produto antes de adicionar ao carrinho.', added ? 'success' : 'info');
                        }}
                      >
                        <Icon name="cart" /> Adicionar ao carrinho
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <BlogSidebar />
      </div>
    </PageShell>
  );
}
