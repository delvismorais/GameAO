import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { MobileMenu } from './MobileMenu';
import { SearchOverlay } from './SearchOverlay';
import { CartDrawer } from './CartDrawer';
import { AnnouncementPopup } from './AnnouncementPopup';
import { AssistantWidget } from '../chat/AssistantWidget';

export function Layout({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [popups, setPopups] = useState<Array<{ id: number; title: string; message?: string | null; image_url?: string | null; cta_label?: string | null; cta_href?: string | null; variant?: string | null; delay_seconds?: number | null; frequency?: string | null }>>([]);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setMenuOpen(false);
    setSearchOpen(false);
    setCartOpen(false);
  }, [location.pathname, location.search]);

  const overlayOpen = cartOpen || searchOpen || menuOpen;

  useEffect(() => {
    let active = true;
    void fetch('/api/site/popups').then((response) => response.ok ? response.json() : { popups: [] }).then((data: { popups?: typeof popups }) => { if (active) setPopups(data.popups ?? []); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

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
      {popups.slice(0, 3).map((popup) => <AnnouncementPopup key={popup.id} popup={popup} />)}
      <AssistantWidget />
    </div>
  );
}
