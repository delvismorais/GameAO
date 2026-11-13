import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../../data/products';
import { Icon } from '../ui/Icon';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('cat', category);
    navigate(`/shop${params.toString() ? `?${params.toString()}` : ''}`);
    onClose();
    setQuery('');
  };

  return (
    <div className={`search-overlay ${open ? 'is-open' : ''}`.trim()} aria-hidden={!open}>
      <div className="search-overlay__backdrop" onClick={onClose} />
      <div className="search-overlay__panel" role="dialog" aria-modal="true" aria-label="Pesquisar produtos">
        <div className="container">
          <form className="search-form" onSubmit={submit}>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Categoria"
            >
              <option value="">Todas as categorias</option>
              {CATEGORIES.map((item) => (
                <option key={item.slug} value={item.slug}>{item.name}</option>
              ))}
            </select>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar jogos, consolas, etiquetas…"
              aria-label="Termo de pesquisa"
            />
            <button type="submit" className="btn btn--primary">
              <Icon name="search" /> Pesquisar
            </button>
            <button type="button" className="search-form__close" onClick={onClose} aria-label="Fechar pesquisa">
              <Icon name="close" />
            </button>
          </form>
          <p className="search-overlay__hint">
            Experimente pesquisar por “Forza”, “Xbox”, “Aventura” ou “God of War”.
          </p>
        </div>
      </div>
    </div>
  );
}
