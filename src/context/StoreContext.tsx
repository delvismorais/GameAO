import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STORAGE_KEYS } from '../config/store';
import { readStorage, writeStorage } from '../lib/storage';
import { usdToAoa } from '../lib/pricing';
import {
  getEffectivePriceUsd,
  getProductById,
  type Product,
} from '../data/products';
import { SEED_REVIEWS, type Review } from '../data/reviews';

export interface CartLine {
  productId: string;
  qty: number;
}

export interface Customer {
  firstName: string;
  lastName: string;
  company: string;
  country: string;
  address: string;
  apartment: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  notes: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  qty: number;
  unitPriceUsd: number;
  unitPriceAoa: number;
  lineTotalAoa: number;
}

export interface Order {
  id: string;
  createdAt: string;
  items: OrderItem[];
  subtotalAoa: number;
  discountAoa: number;
  totalAoa: number;
  exchangeRate: number;
  customer: Customer;
  note: string;
  paymentMethod: string;
  status: 'Pendente' | 'Em processamento' | 'Concluída';
}

export interface User {
  name: string;
  email: string;
  phone: string;
  role?: string;
}

export interface BlogComment {
  id: string;
  postSlug: string;
  author: string;
  date: string;
  text: string;
}

interface StoreContextValue {
  cart: CartLine[];
  cartCount: number;
  cartLines: { product: Product; qty: number }[];
  cartSubtotalUsd: number;
  cartDiscountUsd: number;
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clearCart: () => void;

  wishlist: string[];
  toggleWishlist: (productId: string) => 'added' | 'removed';
  isWishlisted: (productId: string) => boolean;

  compare: string[];
  toggleCompare: (productId: string) => 'added' | 'removed' | 'full';
  isCompared: (productId: string) => boolean;
  clearCompare: () => void;

  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<boolean>;

  orders: Order[];
  placeOrder: (customer: Customer, note: string, rate: number) => Order;

  reviews: Review[];
  addReview: (productId: string, author: string, rating: number, text: string) => void;

  comments: BlogComment[];
  addComment: (postSlug: string, author: string, text: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const SEED_COMMENTS: BlogComment[] = [
  {
    id: 'c-1',
    postSlug: 'escolher-jogo-para-jogar-com-amigos',
    author: 'Mário Kiala',
    date: '2026-11-06',
    text: 'Excelente guia. No nosso grupo, It Takes Two foi a melhor escolha e rendeu várias noites seguidas.',
  },
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(() =>
    readStorage<CartLine[]>(STORAGE_KEYS.cart, []),
  );
  const [wishlist, setWishlist] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.wishlist, []),
  );
  const [compare, setCompare] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.compare, []),
  );
  const [user, setUser] = useState<User | null>(null);
  const [serverProducts, setServerProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>(() =>
    readStorage<Order[]>(STORAGE_KEYS.orders, []),
  );
  const [reviews, setReviews] = useState<Review[]>(() =>
    readStorage<Review[]>(STORAGE_KEYS.reviews, SEED_REVIEWS),
  );
  const [comments, setComments] = useState<BlogComment[]>(() =>
    readStorage<BlogComment[]>(STORAGE_KEYS.comments, SEED_COMMENTS),
  );

  useEffect(() => writeStorage(STORAGE_KEYS.cart, cart), [cart]);
  useEffect(() => writeStorage(STORAGE_KEYS.wishlist, wishlist), [wishlist]);
  useEffect(() => writeStorage(STORAGE_KEYS.compare, compare), [compare]);
  useEffect(() => writeStorage(STORAGE_KEYS.user, user), [user]);
  useEffect(() => writeStorage(STORAGE_KEYS.orders, orders), [orders]);
  useEffect(() => writeStorage(STORAGE_KEYS.reviews, reviews), [reviews]);
  useEffect(() => writeStorage(STORAGE_KEYS.comments, comments), [comments]);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((data: { user: User | null }) => {
        if (active) setUser(data.user);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/catalog/products')
      .then((response) => response.ok ? response.json() : { products: [] })
      .then((data: { products?: Product[] }) => { if (active && Array.isArray(data.products)) setServerProducts(data.products); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const addToCart = useCallback((productId: string, qty = 1) => {
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (existing) {
        return current.map((line) =>
          line.productId === productId
            ? { ...line, qty: Math.min(99, line.qty + qty) }
            : line,
        );
      }
      return [...current, { productId, qty: Math.max(1, qty) }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    const safe = Math.max(1, Math.min(99, Math.floor(qty) || 1));
    setCart((current) =>
      current.map((line) => (line.productId === productId ? { ...line, qty: safe } : line)),
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((productId: string) => {
    let result: 'added' | 'removed' = 'added';
    setWishlist((current) => {
      if (current.includes(productId)) {
        result = 'removed';
        return current.filter((id) => id !== productId);
      }
      return [...current, productId];
    });
    return result;
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist],
  );

  const toggleCompare = useCallback((productId: string): 'added' | 'removed' | 'full' => {
    if (compare.includes(productId)) {
      setCompare((current) => current.filter((id) => id !== productId));
      return 'removed';
    }
    if (compare.length >= 4) return 'full';
    setCompare((current) => [...current, productId]);
    return 'added';
  }, [compare]);

  const isCompared = useCallback(
    (productId: string) => compare.includes(productId),
    [compare],
  );

  const clearCompare = useCallback(() => setCompare([]), []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email.trim() || password.trim().length < 6) return false;
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return false;
    const data = await response.json() as { user: User };
    setUser(data.user);
    return true;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    if (!name.trim() || !email.trim() || password.trim().length < 6) return false;
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });
    if (!response.ok) return false;
    const data = await response.json() as { user: User };
    setUser(data.user);
    return true;
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch: Partial<User>) => {
    if (!user) return false;
    const response = await fetch('/api/account/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...user, ...patch }),
    });
    if (!response.ok) return false;
    const data = await response.json() as { user: User };
    setUser(data.user);
    return true;
  }, [user]);

  const cartLines = useMemo(
    () =>
      cart
        .map((line) => {
          const product = serverProducts.find((item) => item.id === line.productId) ?? getProductById(line.productId);
          return product ? { product, qty: line.qty } : null;
        })
        .filter((line): line is { product: Product; qty: number } => line !== null),
    [cart, serverProducts],
  );

  const cartSubtotalUsd = useMemo(
    () =>
      cartLines.reduce(
        (total, line) => total + line.product.basePriceUsd * line.qty,
        0,
      ),
    [cartLines],
  );

  const cartDiscountUsd = useMemo(
    () =>
      cartLines.reduce((total, line) => {
        const base = line.product.basePriceUsd;
        const effective = getEffectivePriceUsd(line.product);
        return total + Math.max(0, base - effective) * line.qty;
      }, 0),
    [cartLines],
  );

  const cartTotalUsd = cartSubtotalUsd - cartDiscountUsd;

  const cartCount = useMemo(
    () => cart.reduce((total, line) => total + line.qty, 0),
    [cart],
  );

  const placeOrder = useCallback(
    (customer: Customer, note: string, rate: number): Order => {
      const now = new Date();
      const sequence = orders.length + 1;
      const order: Order = {
        id: `GAO-${now.getFullYear()}-${String(sequence).padStart(4, '0')}`,
        createdAt: now.toISOString(),
        items: cartLines.map((line) => {
          const unit = getEffectivePriceUsd(line.product);
          return {
            productId: line.product.id,
            name: line.product.name,
            image: line.product.imageCard,
            qty: line.qty,
            unitPriceUsd: unit,
            unitPriceAoa: usdToAoa(unit, rate),
            lineTotalAoa: usdToAoa(unit * line.qty, rate),
          };
        }),
        subtotalAoa: usdToAoa(cartSubtotalUsd, rate),
        discountAoa: usdToAoa(cartDiscountUsd, rate),
        totalAoa: usdToAoa(cartTotalUsd, rate),
        exchangeRate: rate,
        customer,
        note,
        paymentMethod: 'Pagamento na entrega',
        status: 'Pendente',
      };
      setOrders((current) => [order, ...current]);
      setCart([]);
      return order;
    },
    [cartLines, cartSubtotalUsd, cartDiscountUsd, cartTotalUsd, orders.length],
  );

  const addReview = useCallback(
    (productId: string, author: string, rating: number, text: string) => {
      const review: Review = {
        id: `r-${Date.now()}`,
        productId,
        author: author.trim() || 'Cliente GameAO',
        rating,
        date: new Date().toISOString().slice(0, 10),
        text: text.trim(),
      };
      setReviews((current) => [...current, review]);
    },
    [],
  );

  const addComment = useCallback((postSlug: string, author: string, text: string) => {
    const comment: BlogComment = {
      id: `c-${Date.now()}`,
      postSlug,
      author: author.trim() || 'Leitor GameAO',
      date: new Date().toISOString().slice(0, 10),
      text: text.trim(),
    };
    setComments((current) => [...current, comment]);
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      cartCount,
      cartLines,
      cartSubtotalUsd,
      cartDiscountUsd,
      addToCart,
      removeFromCart,
      setQty,
      clearCart,
      wishlist,
      toggleWishlist,
      isWishlisted,
      compare,
      toggleCompare,
      isCompared,
      clearCompare,
      user,
      login,
      register,
      logout,
      updateProfile,
      orders,
      placeOrder,
      reviews,
      addReview,
      comments,
      addComment,
    }),
    [
      cart,
      cartCount,
      cartLines,
      cartSubtotalUsd,
      cartDiscountUsd,
      addToCart,
      removeFromCart,
      setQty,
      clearCart,
      wishlist,
      toggleWishlist,
      isWishlisted,
      compare,
      toggleCompare,
      isCompared,
      clearCompare,
      user,
      login,
      register,
      logout,
      updateProfile,
      orders,
      placeOrder,
      reviews,
      addReview,
      comments,
      addComment,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore deve ser usado dentro de StoreProvider');
  return context;
}
