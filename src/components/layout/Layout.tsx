import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { MobileMenu } from './MobileMenu';
import { SearchOverlay } from './SearchOverlay';
import { CartDrawer } from './CartDrawer';

export function Layout({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  }, [location.pathname, location.search]);

  const overlayOpen = cartOpen || searchOpen || menuOpen;

  useEffect(() => {
    document.body.classList.toggle('has-overlay', overlayOpen);
    return () => document.body.classList.remove('has-overlay');
  }, [overlayOpen]);

  return (
    <div className="site">
      <Header
        onOpenCart={() => setCartOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenMenu={() => setMenuOpen(true)}
      />
      <main className="site-main">{children}</main>
      <Footer />
      <MobileNav
        onOpenMenu={() => setMenuOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenCart={() => setCartOpen(true)}
      />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
