import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { StoreProvider } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { Home1 } from './pages/Home1';
import { Home2 } from './pages/Home2';
import { Shop } from './pages/Shop';
import { Category } from './pages/Category';
import { Product } from './pages/Product';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Wishlist } from './pages/Wishlist';
import { Compare } from './pages/Compare';
import { Account } from './pages/Account';
import { AccountOrders } from './pages/AccountOrders';
import { News } from './pages/News';
import { BlogPost } from './pages/BlogPost';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Faq } from './pages/Faq';
import { Admin } from './pages/Admin';
import { OrderTracking } from './pages/OrderTracking';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <SettingsProvider>
      <StoreProvider>
        <ToastProvider>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home1 />} />
                <Route path="/homepage-2" element={<Home2 />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product-category/:slug" element={<Category />} />
                <Route path="/product/:slug" element={<Product />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout/confirmacao" element={<OrderConfirmation />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/my-account" element={<Account />} />
                <Route path="/my-account/orders" element={<AccountOrders />} />
                <Route path="/category/news" element={<News />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/about-us" element={<About />} />
                <Route path="/contact-us" element={<Contact />} />
                <Route path="/faqs" element={<Faq />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/acompanhar-pedido" element={<OrderTracking />} />
                <Route path="/pedido" element={<OrderTracking />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ToastProvider>
      </StoreProvider>
    </SettingsProvider>
  );
}
