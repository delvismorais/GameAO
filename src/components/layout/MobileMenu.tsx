import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { CATEGORIES } from '../../data/products';
import { CONTACT_INFO } from '../../data/site';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className={`mobile-menu ${open ? 'is-open' : ''}`.trim()} aria-hidden={!open}>
      <div className="mobile-menu__overlay" onClick={onClose} />
      <aside className="mobile-menu__panel" role="dialog" aria-modal="true" aria-label="Menu de navegação">
        <div className="mobile-menu__head">
          <img src="/assets/logo.png" alt="GameAO" />
          <button type="button" className="mobile-menu__close" onClick={onClose} aria-label="Fechar menu">
            <Icon name="close" />
          </button>
        </div>
        <nav className="mobile-menu__nav" aria-label="Menu mobile">
          <p className="mobile-menu__label">Navegação</p>
          <Link to="/" onClick={onClose}>Página Inicial 1</Link>
          <Link to="/homepage-2" onClick={onClose}>Página Inicial 2</Link>
          <Link to="/shop" onClick={onClose}>Loja</Link>
          <Link to="/category/news" onClick={onClose}>Notícias</Link>
          <Link to="/product-category/featured" onClick={onClose}>Destaques</Link>
          <p className="mobile-menu__label">Categorias</p>
          {CATEGORIES.map((category) => (
            <Link key={category.slug} to={`/product-category/${category.slug}`} onClick={onClose}>
              {category.name}
            </Link>
          ))}
          <p className="mobile-menu__label">Conta</p>
          <Link to="/my-account" onClick={onClose}>Minha Conta</Link>
          <Link to="/wishlist" onClick={onClose}>Lista de Desejos</Link>
          <Link to="/compare" onClick={onClose}>Comparar Produtos</Link>
          <Link to="/configuracoes" onClick={onClose}>Configurações</Link>
        </nav>
        <div className="mobile-menu__foot">
          <p>{CONTACT_INFO.email}</p>
          <p>{CONTACT_INFO.phones[0].value}</p>
        </div>
      </aside>
    </div>
  );
}
