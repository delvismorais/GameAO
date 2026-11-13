import { Link } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { Price } from '../components/ui/Price';
import { Rating } from '../components/ui/Rating';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { CATEGORIES, getEffectivePriceUsd, getProductById } from '../data/products';

export function Compare() {
  const { compare, toggleCompare, addToCart, clearCompare } = useStore();
  const { showToast } = useToast();
  const products = compare.map((id) => getProductById(id)).filter((product) => product !== undefined);

  return (
    <PageShell crumbs={[{ label: 'Comparar Produtos' }]}>
      <div className="compare-head">
        <h1 className="page-title">Comparar Produtos</h1>
        {products.length > 0 && (
          <button type="button" className="btn btn--outline btn--sm" onClick={clearCompare}>
            Limpar comparação
          </button>
        )}
      </div>

      {products.length < 2 ? (
        <EmptyState
          title="Escolha pelo menos dois produtos"
          icon="⇄"
          action={<Link to="/shop" className="btn btn--primary">Ir para a Loja</Link>}
        >
          Adicione produtos com o botão de comparação nos cartões da loja. Pode comparar até quatro
          jogos ao mesmo tempo. {products.length === 1 && 'Já tem um produto selecionado.'}
        </EmptyState>
      ) : (
        <>
          <div className="compare-scroll">
            <table className="compare-table">
              <tbody>
                <tr>
                  <th>Produto</th>
                  {products.map((product) => (
                    <td key={product.id}>
                      <div className="compare-product">
                        <button
                          type="button"
                          className="remove-link"
                          onClick={() => toggleCompare(product.id)}
                          aria-label={`Remover ${product.name}`}
                        >
                          <Icon name="close" />
                        </button>
                        <Link to={`/product/${product.slug}`}>
                          <img src={product.imageCard} alt={`Capa de ${product.name}`} />
                        </Link>
                        <Link to={`/product/${product.slug}`} className="compare-product__name">{product.name}</Link>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>Preço</th>
                  {products.map((product) => (
                    <td key={product.id}><Price usd={getEffectivePriceUsd(product)} baseUsd={product.basePriceUsd} size="md" /></td>
                  ))}
                </tr>
                <tr>
                  <th>Avaliação</th>
                  {products.map((product) => (
                    <td key={product.id}><Rating value={product.rating} count={product.reviewCount} showCount /></td>
                  ))}
                </tr>
                <tr>
                  <th>Disponibilidade</th>
                  {products.map((product) => (
                    <td key={product.id}><span className="stock-in">Em stock</span></td>
                  ))}
                </tr>
                <tr>
                  <th>Categorias</th>
                  {products.map((product) => (
                    <td key={product.id}>
                      {product.categories.map((slug) => CATEGORIES.find((item) => item.slug === slug)?.name).join(', ')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>Etiquetas</th>
                  {products.map((product) => (
                    <td key={product.id}>{product.tags.join(', ')}</td>
                  ))}
                </tr>
                <tr>
                  <th>Plataformas</th>
                  {products.map((product) => (
                    <td key={product.id}>{product.platform}</td>
                  ))}
                </tr>
                <tr>
                  <th aria-label="Ações" />
                  {products.map((product) => (
                    <td key={product.id}>
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => {
                          addToCart(product.id);
                          showToast(`${product.name} adicionado ao carrinho.`);
                        }}
                      >
                        <Icon name="cart" /> Adicionar
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="compare-note">
            Pode comparar até 4 produtos. <Link to="/shop">Adicionar outro produto</Link>
          </p>
        </>
      )}
    </PageShell>
  );
}
