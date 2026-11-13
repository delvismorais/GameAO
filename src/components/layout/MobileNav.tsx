import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Icon } from '../ui/Icon';

interface MobileNavProps {
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  onOpenCart: () => void;
}

export function MobileNav({ onOpenMenu, onOpenSearch, onOpenCart }: MobileNavProps) {
  const { wishlist, cartCount } = useStore();
  return (
    <nav className="mobile-nav" aria-label="Navegação rápida">
      <button type="button" className="mobile-nav__item" onClick={onOpenMenu}>
        <Icon name="category" />
        <span>Categorias</span>
      </button>
      <button type="button" className="mobile-nav__item" onClick={onOpenSearch}>
        <Icon name="search" />
        <span>Pesquisar</span>
      </button>
      <Link to="/wishlist" className="mobile-nav__item">
        <span className="mobile-nav__badge">{wishlist.length}</span>
        <Icon name="heart" />
        <span>Desejos</span>
      </Link>
      <button type="button" className="mobile-nav__item mobile-nav__item--cart" onClick={onOpenCart}>
        <span className="mobile-nav__badge">{cartCount}</span>
        <Icon name="cart" />
        <span>Carrinho</span>
      </button>
    </nav>
  );
}
