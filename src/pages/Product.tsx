import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { Price } from '../components/ui/Price';
import { Rating } from '../components/ui/Rating';
import { Quantity } from '../components/ui/Quantity';
import { Tabs } from '../components/ui/Tabs';
import { Icon } from '../components/ui/Icon';
import { ProductGrid } from '../components/shop/ProductGrid';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { formatDatePt } from '../lib/pricing';
import {
  CATEGORIES,
  getEffectivePriceUsd,
  getProductBySlug,
  SHOP_PRODUCTS,
} from '../data/products';

export function Product() {
  const { slug } = useParams();
  const product = slug ? getProductBySlug(slug) : undefined;
  const { addToCart, toggleWishlist, isWishlisted, toggleCompare, isCompared, reviews, addReview } = useStore();
  const { showToast } = useToast();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const [lightbox, setLightbox] = useState(false);
  const [form, setForm] = useState({ author: '', email: '', rating: '5', text: '' });

  useEffect(() => {
    setQty(1);
    setTab('description');
  }, [slug]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('has-overlay');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('has-overlay');
    };
  }, [lightbox]);

  const related = useMemo(() => {
    if (!product) return [];
    const sameCategory = SHOP_PRODUCTS.filter(
      (item) =>
        item.id !== product.id &&
        item.categories.some((category) => product.categories.includes(category)),
    );
    return sameCategory.slice(0, 6);
  }, [product]);

  if (!product) return <Navigate to="/shop" replace />;

  const effective = getEffectivePriceUsd(product);
  const productReviews = reviews.filter((review) => review.productId === product.id);
  const categoryLabel = CATEGORIES.find((category) => category.slug === product.categories[0])?.name ?? 'Jogos';
  const categoryLink = `/product-category/${product.categories[0]}`;

  const handleAdd = () => {
    addToCart(product.id, qty);
    showToast(`${product.name} foi adicionado ao carrinho.`);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link do produto copiado para a área de transferência.', 'info');
    } catch {
      showToast('Não foi possível copiar o link neste browser.', 'error');
    }
  };

  const submitReview = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.author.trim() || !form.email.trim() || form.text.trim().length < 10) {
      showToast('Preencha o nome, email e uma avaliação com pelo menos 10 caracteres.', 'error');
      return;
    }
    addReview(product.id, form.author, Number(form.rating), form.text);
    setForm({ author: '', email: '', rating: '5', text: '' });
    showToast('Avaliação registada. Obrigado pelo contributo!');
  };

  return (
    <PageShell
      crumbs={[
        { label: 'Loja', href: '/shop' },
        { label: categoryLabel, href: categoryLink },
        { label: product.name },
      ]}
    >
      <div className="product-layout">
        <div className="product-gallery">
          <div className="product-gallery__main">
            <img src={product.image} alt={`Capa de ${product.name}`} />
            <button
              type="button"
              className="product-gallery__zoom"
              onClick={() => setLightbox(true)}
              aria-label="Ampliar imagem"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
          </div>
          <div className="product-gallery__thumbs">
            <span className="is-active"><img src={product.imageCard} alt="" /></span>
          </div>
        </div>

        <div className="product-summary">
          <h1 className="product-title">{product.name}</h1>
          <div className="product-meta-top">
            <Rating value={product.rating} />
            <span className="product-reviews-count">({productReviews.length} {productReviews.length === 1 ? 'avaliação' : 'avaliações'})</span>
          </div>
          <Price usd={effective} baseUsd={product.basePriceUsd} size="lg" className="product-price" />
          <p className="product-short">{product.shortDescription}</p>

          <div className="product-stock">
            <span className="product-stock__dot" /> Em stock — {product.categoryType === 'physical' ? 'entrega a partir de 24 horas' : 'entrega instantânea após confirmação'}
          </div>

          <div className="product-buy">
            <Quantity value={qty} onChange={setQty} />
            <button type="button" className="btn btn--primary btn--lg product-add" onClick={handleAdd}>
              <Icon name="cart" /> Adicionar ao carrinho
            </button>
          </div>

          <div className="product-links">
            <button
              type="button"
              className={isWishlisted(product.id) ? 'is-active' : ''}
              onClick={() => {
                const result = toggleWishlist(product.id);
                showToast(result === 'added' ? 'Adicionado à lista de desejos.' : 'Removido da lista de desejos.', result === 'added' ? 'success' : 'info');
              }}
            >
              <Icon name="heart" /> Lista de desejos
            </button>
            <button
              type="button"
              className={isCompared(product.id) ? 'is-active' : ''}
              onClick={() => {
                const result = toggleCompare(product.id);
                showToast(
                  result === 'full' ? 'Pode comparar no máximo 4 produtos.' : result === 'added' ? 'Adicionado à comparação.' : 'Removido da comparação.',
                  result === 'full' ? 'error' : result === 'added' ? 'success' : 'info',
                );
              }}
            >
              <Icon name="compare" /> Comparar
            </button>
          </div>

          <div className="product-meta">
            <p>
              <strong>Categorias:</strong>{' '}
              {product.categories.map((category, index) => {
                const info = CATEGORIES.find((item) => item.slug === category);
                return (
                  <span key={category}>
                    {index > 0 && ', '}
                    <Link to={`/product-category/${category}`}>{info?.name}</Link>
                  </span>
                );
              })}
            </p>
            <p>
              <strong>Etiquetas:</strong>{' '}
              {product.tags.map((tag, index) => (
                <span key={tag}>
                  {index > 0 && ', '}
                  <Link to={`/shop?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
                </span>
              ))}
            </p>
            <p><strong>Plataformas:</strong> {product.platform}</p>
            <p><strong>Editora:</strong> {product.developer} · {product.releaseYear}</p>
          </div>

          <div className="product-share">
            <span>Partilhar:</span>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noreferrer" aria-label="Partilhar no Facebook"><Icon name="facebook" /></a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noreferrer" aria-label="Partilhar no X"><Icon name="twitter" /></a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noreferrer" aria-label="Partilhar no Telegram"><Icon name="telegram" /></a>
            <a href={`https://wa.me/?text=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} target="_blank" rel="noreferrer" aria-label="Partilhar no WhatsApp"><Icon name="whatsapp" /></a>
            <button type="button" onClick={handleShare} aria-label="Copiar link"><Icon name="share" /></button>
          </div>
        </div>
      </div>

      <div className="product-tabs">
        <Tabs
          tabs={[
            { id: 'description', label: 'Descrição' },
            { id: 'reviews', label: `Avaliações (${productReviews.length})` },
          ]}
          active={tab}
          onChange={setTab}
          ariaLabel="Informação do produto"
        />
        {tab === 'description' ? (
          <div className="product-description">
            {product.description.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
            <div className="product-description__notice">
              <strong>Informação editorial:</strong> as descrições são apresentadas em português. Os nomes e capas pertencem aos respetivos titulares.
            </div>
          </div>
        ) : (
          <div className="product-reviews">
            {productReviews.length === 0 ? (
              <p>Ainda não há avaliações para este produto.</p>
            ) : (
              <ul className="review-list">
                {productReviews.map((review) => (
                  <li key={review.id} className="review">
                    <div className="review__avatar" aria-hidden="true">
                      {review.author.charAt(0).toUpperCase()}
                    </div>
                    <div className="review__body">
                      <div className="review__head">
                        <strong>{review.author}</strong>
                        <span>{formatDatePt(review.date)}</span>
                      </div>
                      <Rating value={review.rating} />
                      <p>{review.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form className="review-form" onSubmit={submitReview}>
              <h3>Adicionar uma avaliação</h3>
              <p className="review-form__note">
                A sua opinião ajuda outros jogadores. A avaliação fica guardada neste dispositivo.
              </p>
              <div className="review-form__rating">
                <span>A sua classificação</span>
                <div className="review-form__stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={Number(form.rating) >= star ? 'is-active' : ''}
                      onClick={() => setForm((current) => ({ ...current, rating: String(star) }))}
                      aria-label={`${star} estrelas`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <label className="field">
                  <span>Nome *</span>
                  <input value={form.author} onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))} required />
                </label>
                <label className="field">
                  <span>Email *</span>
                  <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
                </label>
              </div>
              <label className="field">
                <span>A sua avaliação *</span>
                <textarea rows={4} value={form.text} onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} required />
              </label>
              <button type="submit" className="btn btn--primary">Enviar avaliação</button>
            </form>
          </div>
        )}
      </div>

      <section className="related-products">
        <h2 className="section-heading__title">Produtos Relacionados</h2>
        <ProductGrid products={related} columns={3} showCategory />
      </section>

      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Imagem de ${product.name}`} onClick={() => setLightbox(false)}>
          <button type="button" className="lightbox__close" aria-label="Fechar imagem"><Icon name="close" /></button>
          <img src={product.image} alt={`Capa de ${product.name}`} onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </PageShell>
  );
}
