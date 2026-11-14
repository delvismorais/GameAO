import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { Pagination } from '../ui/Pagination';
import { Icon } from '../ui/Icon';
import { EmptyState } from '../ui/EmptyState';
import { ProductGrid } from './ProductGrid';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { formatDatePt, formatUsdAsAoa, usdToAoa } from '../../lib/pricing';
import { normalizeText } from '../../lib/storage';
import {
  CATEGORIES,
  getCategoryBySlug,
  getEffectivePriceUsd,
  productsInCategory,
  SHOP_PRODUCTS,
  type CategorySlug,
  type Product,
} from '../../data/products';
import { POSTS } from '../../data/posts';

interface ShopViewProps {
  category?: CategorySlug;
}

const SORT_OPTIONS = [
  { value: 'default', label: 'Ordem predefinida' },
  { value: 'price-asc', label: 'Preço: do mais baixo' },
  { value: 'price-desc', label: 'Preço: do mais alto' },
  { value: 'rating', label: 'Avaliação mais alta' },
  { value: 'name', label: 'Nome: A–Z' },
  { value: 'newest', label: 'Mais recentes' },
];

const PER_PAGE_OPTIONS = [12, 16, 20, 24];

export function ShopView({ category }: ShopViewProps) {
  const [params, setParams] = useSearchParams();
  const { rate } = useSettings();
  const { showToast } = useToast();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoryInfo = category ? getCategoryBySlug(category) : undefined;
  const pageTitle = categoryInfo?.name ?? 'Loja';

  const q = params.get('q') ?? '';
  const catParam = params.get('cat') ?? '';
  const tag = params.get('tag') ?? '';
  const rating = Number(params.get('rating') ?? 0);
  const min = Number(params.get('min') ?? 0);
  const max = Number(params.get('max') ?? 0);
  const sort = params.get('sort') ?? 'default';
  const page = Math.max(1, Number(params.get('page') ?? 1));
  const perPage = PER_PAGE_OPTIONS.includes(Number(params.get('perPage')))
    ? Number(params.get('perPage'))
    : 12;

  const [minDraft, setMinDraft] = useState(params.get('min') ?? '');
  const [maxDraft, setMaxDraft] = useState(params.get('max') ?? '');

  useEffect(() => {
    setMinDraft(params.get('min') ?? '');
    setMaxDraft(params.get('max') ?? '');
  }, [params]);

  useEffect(() => {
    document.body.classList.toggle('has-overlay', filtersOpen);
    return () => document.body.classList.remove('has-overlay');
  }, [filtersOpen]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    SHOP_PRODUCTS.forEach((product) => product.tags.forEach((item) => tags.add(item)));
    return Array.from(tags).sort((a, b) => a.localeCompare(b, 'pt'));
  }, []);

  const filtered = useMemo(() => {
    let list: Product[] = [...SHOP_PRODUCTS];

    if (category) list = list.filter((product) => product.categories.includes(category));
    if (catParam) list = list.filter((product) => product.categories.includes(catParam as CategorySlug));

    if (q.trim()) {
      const needle = normalizeText(q);
      list = list.filter((product) => {
        const categoryNames = product.categories
          .map((slug) => CATEGORIES.find((item) => item.slug === slug)?.name ?? '')
          .join(' ');
        const haystack = normalizeText(
          `${product.name} ${product.tags.join(' ')} ${categoryNames} ${product.shortDescription}`,
        );
        return haystack.includes(needle);
      });
    }

    if (tag) list = list.filter((product) => product.tags.includes(tag));
    if (rating > 0) list = list.filter((product) => product.rating >= rating);

    if (min > 0) {
      list = list.filter((product) => usdToAoa(getEffectivePriceUsd(product), rate) >= min);
    }
    if (max > 0) {
      list = list.filter((product) => usdToAoa(getEffectivePriceUsd(product), rate) <= max);
    }

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => getEffectivePriceUsd(a) - getEffectivePriceUsd(b));
        break;
      case 'price-desc':
        list.sort((a, b) => getEffectivePriceUsd(b) - getEffectivePriceUsd(a));
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name, 'pt'));
        break;
      case 'newest':
        list.sort((a, b) => b.releaseYear - a.releaseYear);
        break;
      default:
        list.sort((a, b) => a.shopOrder - b.shopOrder);
    }

    return list;
  }, [category, catParam, q, tag, rating, min, max, sort, rate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * perPage;
  const visible = filtered.slice(start, start + perPage);

  const updateParams = (patch: Record<string, string | number | null>, keepPage = false) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value === null || value === 0 || value === '0') next.delete(key);
      else next.set(key, String(value));
    });
    if (!keepPage && !('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  const applyPrice = () => {
    const nextMin = Math.max(0, Number(minDraft) || 0);
    const nextMax = Math.max(0, Number(maxDraft) || 0);
    if (nextMin > 0 && nextMax > 0 && nextMin > nextMax) {
      showToast('O preço mínimo não pode ser superior ao máximo.', 'error');
      return;
    }
    updateParams({ min: nextMin || null, max: nextMax || null });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (perPage !== 12) next.set('perPage', String(perPage));
    setParams(next, { replace: true });
  };

  const hasFilters = Boolean(q || catParam || tag || rating || min || max || sort !== 'default');

  const sidebar = (
    <div className="shop-sidebar__inner">
      <div className="widget">
        <h3 className="widget__title">Categorias de Produtos</h3>
        <ul className="widget-list widget-list--categories">
          <li className={!category && !catParam ? 'is-active' : ''}>
            <Link to="/shop">Todos os jogos <span>{SHOP_PRODUCTS.length}</span></Link>
          </li>
          {CATEGORIES.map((item) => (
            <li
              key={item.slug}
              className={category === item.slug || catParam === item.slug ? 'is-active' : ''}
            >
              <Link to={`/product-category/${item.slug}`}>
                {item.name} <span>{productsInCategory(item.slug).length}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="widget">
        <h3 className="widget__title">Filtrar por Preço</h3>
        <div className="price-filter">
          <div className="price-filter__row">
            <input
              type="number"
              min={0}
              step={1000}
              value={minDraft}
              onChange={(event) => setMinDraft(event.target.value)}
              placeholder="Mínimo"
              aria-label="Preço mínimo"
            />
            <span>—</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={maxDraft}
              onChange={(event) => setMaxDraft(event.target.value)}
              placeholder="Máximo"
              aria-label="Preço máximo"
            />
          </div>
          <button type="button" className="btn btn--primary btn--sm" onClick={applyPrice}>
            Filtrar
          </button>
          <p className="price-filter__hint">
            Intervalo de preços. Ex.: {formatUsdAsAoa(15, rate)} — {formatUsdAsAoa(89, rate)}.
          </p>
        </div>
      </div>

      <div className="widget">
        <h3 className="widget__title">Filtrar por Avaliação</h3>
        <ul className="rating-filter">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = SHOP_PRODUCTS.filter((product) => Math.round(product.rating) >= stars).length;
            return (
              <li key={stars} className={rating === stars ? 'is-active' : ''}>
                <button
                  type="button"
                  onClick={() => updateParams({ rating: rating === stars ? null : stars })}
                >
                  <span className="rating-filter__stars" aria-hidden="true">
                    {'★'.repeat(stars)}
                    <span className="rating-filter__off">{'★'.repeat(5 - stars)}</span>
                  </span>
                  <span className="rating-filter__count">({count})</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="widget">
        <h3 className="widget__title">Blog</h3>
        <ul className="widget-posts">
          {POSTS.slice(0, 3).map((post) => (
            <li key={post.slug}>
              <Link to={`/blog/${post.slug}`} className="widget-post">
                <img src={post.imageThumb} alt="" loading="lazy" />
                <span>
                  <strong>{post.title}</strong>
                  <small>{formatDatePt(post.date)}</small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="widget">
        <h3 className="widget__title">Etiquetas</h3>
        <div className="tag-cloud tag-cloud--sidebar">
          {allTags.map((item) => (
            <button
              key={item}
              type="button"
              className={`tag ${tag === item ? 'is-active' : ''}`.trim()}
              onClick={() => updateParams({ tag: tag === item ? null : item })}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="widget">
        <h3 className="widget__title">Informações</h3>
        <ul className="widget-list">
          <li><Link to="/about-us">Sobre Nós</Link></li>
          <li><Link to="/contact-us">Contacte-nos</Link></li>
          <li><Link to="/faqs">Perguntas Frequentes</Link></li>
          <li><Link to="/category/news">Notícias</Link></li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="shop-page">
      <div className="container">
        <Breadcrumbs
          items={[
            { label: 'Loja', href: '/shop' },
            ...(categoryInfo ? [{ label: categoryInfo.name }] : []),
          ]}
        />
      </div>
      <div className="container">
        <div className="page-card shop-card">
          <h1 className="page-title">{pageTitle}</h1>
          {categoryInfo && <p className="page-subtitle">{categoryInfo.description}</p>}

          <div className="shop-layout">
            <aside className={`shop-sidebar ${filtersOpen ? 'is-open' : ''}`.trim()} aria-label="Filtros da loja">
              <div className="shop-sidebar__head">
                <h2>Filtros</h2>
                <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Fechar filtros">
                  <Icon name="close" />
                </button>
              </div>
              {sidebar}
            </aside>

            <div className="shop-main">
              <div className="shop-toolbar">
                <div className="shop-toolbar__left">
                  <button type="button" className="shop-filter-btn" onClick={() => setFiltersOpen(true)}>
                    <Icon name="menu" /> Filtros
                  </button>
                  <span className="shop-results">
                    {filtered.length === 0
                      ? 'Nenhum resultado'
                      : `A mostrar ${start + 1}–${Math.min(start + perPage, filtered.length)} de ${filtered.length} resultados`}
                  </span>
                </div>
                <div className="shop-toolbar__right">
                  <label className="shop-select">
                    <span className="sr-only">Ordenar por</span>
                    <select value={sort} onChange={(event) => updateParams({ sort: event.target.value })}>
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="shop-select shop-select--per">
                    <span className="sr-only">Produtos por página</span>
                    <select
                      value={perPage}
                      onChange={(event) => updateParams({ perPage: event.target.value })}
                    >
                      {PER_PAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>Mostrar {option}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {(q || catParam || tag || rating > 0 || min > 0 || max > 0) && (
                <div className="shop-active-filters">
                  <span>Filtros ativos:</span>
                  {q && <button type="button" onClick={() => updateParams({ q: null })}>“{q}” <Icon name="close" /></button>}
                  {catParam && <button type="button" onClick={() => updateParams({ cat: null })}>{CATEGORIES.find((item) => item.slug === catParam)?.name} <Icon name="close" /></button>}
                  {tag && <button type="button" onClick={() => updateParams({ tag: null })}>{tag} <Icon name="close" /></button>}
                  {rating > 0 && <button type="button" onClick={() => updateParams({ rating: null })}>{rating}★ e acima <Icon name="close" /></button>}
                  {min > 0 && <button type="button" onClick={() => updateParams({ min: null })}>Mín. {formatUsdAsAoa(min / rate, rate)} <Icon name="close" /></button>}
                  {max > 0 && <button type="button" onClick={() => updateParams({ max: null })}>Máx. {formatUsdAsAoa(max / rate, rate)} <Icon name="close" /></button>}
                  <button type="button" className="shop-clear" onClick={clearFilters}>Limpar tudo</button>
                </div>
              )}

              {visible.length === 0 ? (
                <EmptyState
                  title="Nenhum produto encontrado"
                  icon="🔍"
                  action={<button type="button" className="btn btn--primary" onClick={clearFilters}>Limpar filtros</button>}
                >
                  Experimente outra pesquisa, categoria ou intervalo de preço.
                </EmptyState>
              ) : (
                <>
                  <ProductGrid products={visible} columns={4} showCategory />
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    onChange={(nextPage) => updateParams({ page: nextPage }, true)}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {filtersOpen && <div className="shop-filters-overlay" onClick={() => setFiltersOpen(false)} />}
    </div>
  );
}
