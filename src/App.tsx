import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { StoreProvider } from './context/StoreContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { Home1 } from './pages/Home1';
import { Home2 } from './pages/Home2';
import { captureAffiliateCodeFromUrl } from './lib/affiliate';
import { useHomepageContent } from './lib/homepageContent';

// As páginas secundárias são carregadas a pedido, o que mantém o arranque leve.
const Shop = lazy(() => import('./pages/Shop').then((module) => ({ default: module.Shop })));
const Category = lazy(() => import('./pages/Category').then((module) => ({ default: module.Category })));
const Product = lazy(() => import('./pages/Product').then((module) => ({ default: module.Product })));
const Cart = lazy(() => import('./pages/Cart').then((module) => ({ default: module.Cart })));
const Checkout = lazy(() => import('./pages/Checkout').then((module) => ({ default: module.Checkout })));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation').then((module) => ({ default: module.OrderConfirmation })));
const Wishlist = lazy(() => import('./pages/Wishlist').then((module) => ({ default: module.Wishlist })));
const Compare = lazy(() => import('./pages/Compare').then((module) => ({ default: module.Compare })));
const Account = lazy(() => import('./pages/Account').then((module) => ({ default: module.Account })));
const AccountOrders = lazy(() => import('./pages/AccountOrders').then((module) => ({ default: module.AccountOrders })));
const Affiliate = lazy(() => import('./pages/Affiliate').then((module) => ({ default: module.Affiliate })));
const News = lazy(() => import('./pages/News').then((module) => ({ default: module.News })));
const BlogPost = lazy(() => import('./pages/BlogPost').then((module) => ({ default: module.BlogPost })));
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Contact = lazy(() => import('./pages/Contact').then((module) => ({ default: module.Contact })));
const Faq = lazy(() => import('./pages/Faq').then((module) => ({ default: module.Faq })));
const Admin = lazy(() => import('./pages/Admin').then((module) => ({ default: module.Admin })));
const OrderTracking = lazy(() => import('./pages/OrderTracking').then((module) => ({ default: module.OrderTracking })));
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));
const Legal = lazy(() => import('./pages/Legal').then((module) => ({ default: module.Legal })));

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="page-loader__spinner" aria-hidden="true" />
      <span>A carregar…</span>
    </div>
  );
}

function PrimaryHomepage() {
  const { content, posts } = useHomepageContent();
  return content.primaryHome === 'home1'
    ? <Home1 configuredContent={content} configuredPosts={posts} />
    : <Home2 configuredContent={content} configuredPosts={posts} />;
}

export default function App() {
  useEffect(() => { captureAffiliateCodeFromUrl(); }, []);
  return (
    <SettingsProvider>
      <StoreProvider>
        <ToastProvider>
          <BrowserRouter>
            <Layout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                <Route path="/" element={<PrimaryHomepage />} />
                <Route path="/homepage-1" element={<Home1 />} />
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
                <Route path="/my-account/affiliate" element={<Affiliate />} />
                <Route path="/category/news" element={<News />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/about-us" element={<About />} />
                <Route path="/contact-us" element={<Contact />} />
                <Route path="/faqs" element={<Faq />} />
                <Route path="/politica-de-privacidade" element={<Legal kind="privacy" />} />
                <Route path="/termos-e-condicoes" element={<Legal kind="terms" />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/acompanhar-pedido" element={<OrderTracking />} />
                <Route path="/pedido" element={<OrderTracking />} />
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </BrowserRouter>
        </ToastProvider>
      </StoreProvider>
    </SettingsProvider>
  );
}
