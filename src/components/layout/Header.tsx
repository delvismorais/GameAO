import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Icon } from '../ui/Icon';
import { SOCIALS } from '../../data/site';

interface HeaderProps {
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onOpenMenu: () => void;
}

export function Header({ onOpenCart, onOpenSearch, onOpenMenu }: HeaderProps) {
  const { cartCount, wishlist, user } = useStore();
  const { showToast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setScrolled(window.scrollY > 12);
  }, [location.pathname]);

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`.trim()}>
      <div className="container site-header__inner">
        <Link to="/" className="site-logo" aria-label="GameAO — página inicial">
          <img src="/assets/gameao-logo.png" alt="GameAO" width={150} height={58} />
        </Link>

        <nav className="primary-nav" aria-label="Navegação principal">
          <ul>
            <li className="has-sub">
              <NavLink to="/" end>
                Início <Icon name="arrowDown" className="nav-caret" />
              </NavLink>
              <ul className="sub-menu">
                <li><Link to="/">Página Inicial 1</Link></li>
                <li><Link to="/homepage-2">Página Inicial 2</Link></li>
              </ul>
            </li>
            <li className="has-sub">
              <NavLink to="/shop">
                Loja <Icon name="arrowDown" className="nav-caret" />
              </NavLink>
              <ul className="sub-menu">
                <li><Link to="/shop">Todos os jogos</Link></li>
                <li><Link to="/product-category/featured">Destaques</Link></li>
                <li><Link to="/product-category/game">Jogos</Link></li>
                <li><Link to="/product-category/xbox">Xbox</Link></li>
                <li><Link to="/product-category/playstation">PlayStation</Link></li>
                <li><Link to="/product-category/pc">PC</Link></li>
              </ul>
            </li>
            <li><NavLink to="/category/news">Notícias</NavLink></li>
            <li><NavLink to="/product-category/game">Jogos</NavLink></li>
            <li><NavLink to="/product-category/xbox">Xbox</NavLink></li>
            <li><NavLink to="/product-category/playstation">PlayStation</NavLink></li>
            <li><NavLink to="/product-category/pc">PC</NavLink></li>
            <li><NavLink to="/pedido">Acompanhar pedido</NavLink></li>
          </ul>
        </nav>

        <div className="header-tools">
          <button type="button" className="tool tool--search" onClick={onOpenSearch} aria-label="Pesquisar produtos">
            <Icon name="search" />
          </button>
          <div className="tool tool--social">
            <Icon name="social" />
            <div className="social-menu">
              {SOCIALS.map((social) => (
                <button
                  key={social.label}
                  type="button"
                  onClick={() => showToast('As redes sociais serão configuradas na fase seguinte.', 'info')}
                  aria-label={social.label}
                >
                  <Icon name={social.icon} />
                </button>
              ))}
            </div>
          </div>
          <Link to="/my-account" className="tool tool--account">
            <Icon name="user" />
            <span>{user ? user.name.split(' ')[0] : 'Minha Conta'}</span>
          </Link>
          <Link to="/wishlist" className="tool tool--badge" aria-label={`Lista de desejos (${wishlist.length})`}>
            <span className="tool__count">{wishlist.length}</span>
            <Icon name="heart" />
          </Link>
          <button type="button" className="tool tool--badge" onClick={onOpenCart} aria-label={`Carrinho (${cartCount})`}>
            <span className="tool__count">{cartCount}</span>
            <Icon name="cart" />
          </button>
        </div>

        <button type="button" className="mobile-toggle" onClick={onOpenMenu} aria-label="Abrir menu">
          <Icon name="menu" />
        </button>
        <Link to="/my-account" className="mobile-account" aria-label="Minha conta">
          <Icon name="user" />
        </Link>
      </div>
    </header>
  );
}
