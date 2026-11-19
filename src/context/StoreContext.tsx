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
import {
  getEffectivePriceUsd,
  getProductById,
  CATEGORIES,
  SHOP_PRODUCTS,
  type Product,
} from '../data/products';

export interface CartLine {
  productId: string;
  qty: number;
  variantId?: number;
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

export interface CatalogCategory {
  id?: number;
  slug: string;
  name: string;
  description: string;
  image?: string | null;
  productCount?: number;
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


interface StoreContextValue {
  catalogProducts: Product[];
  catalogLoaded: boolean;
  catalogCategories: CatalogCategory[];
  cart: CartLine[];
  cartCount: number;
  cartLines: { product: Product; qty: number; variant: NonNullable<Product['variants']>[number] | undefined; unitPriceUsd: number }[];
  cartSubtotalUsd: number;
  cartDiscountUsd: number;
  addToCart: (productId: string, qty?: number, variantId?: number) => boolean;
  removeFromCart: (productId: string, variantId?: number) => void;
  setQty: (productId: string, qty: number, variantId?: number) => void;
  setVariant: (productId: string, variantId: number, previousVariantId?: number) => void;
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
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<boolean>;

  orders: Order[];


}

const StoreContext = createContext<StoreContextValue | null>(null);


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
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>(CATEGORIES);
  // As encomendas vivem exclusivamente no servidor. O browser guarda apenas o
  // carrinho, a lista de desejos e preferências temporárias.
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => writeStorage(STORAGE_KEYS.cart, cart), [cart]);
  useEffect(() => writeStorage(STORAGE_KEYS.wishlist, wishlist), [wishlist]);
  useEffect(() => writeStorage(STORAGE_KEYS.compare, compare), [compare]);
  useEffect(() => writeStorage(STORAGE_KEYS.user, user), [user]);

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
      .catch(() => undefined)
      .finally(() => { if (active) setCatalogLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!serverProducts.length) return;
    setCart((current) => {
      let changed = false;
      const next = current.map((line) => {
        if (line.variantId) return line;
        const first = serverProducts.find((product) => product.id === line.productId)?.variants?.[0];
        if (!first) return line;
        changed = true;
        return { ...line, variantId: first.id };
      });
      return changed ? next : current;
    });
  }, [serverProducts]);
  useEffect(() => {
    let active = true;
    fetch('/api/catalog/categories')
      .then((response) => response.ok ? response.json() : { categories: [] })
      .then((data: { categories?: CatalogCategory[] }) => {
        if (active && Array.isArray(data.categories) && data.categories.length) setCatalogCategories(data.categories);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetch('/api/account/orders', { credentials: 'include' })
      .then((response) => response.ok ? response.json() : { orders: [] })
      .then((data: { orders?: Order[] }) => { if (active && Array.isArray(data.orders)) setOrders(data.orders); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [user]);

  const addToCart = useCallback((productId: string, qty = 1, requestedVariantId?: number): boolean => {
    const product = serverProducts.find((item) => item.id === productId) ?? getProductById(productId);
    if (!product) return false;
    const hasVariants = Boolean(product.isDynamic || product.variants?.length);
    if (hasVariants && (!requestedVariantId || !product.variants?.some((variant) => variant.id === requestedVariantId))) return false;
    const variantId = requestedVariantId;
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId && line.variantId === variantId);
      if (existing) return current.map((line) => line === existing ? { ...line, qty: Math.min(99, line.qty + qty) } : line);
      return [...current, { productId, ...(variantId ? { variantId } : {}), qty: Math.max(1, Math.min(99, qty)) }];
    });
    return true;
  }, [serverProducts]);
  const removeFromCart = useCallback((productId: string, variantId?: number) => setCart((current) => current.filter((line) => line.productId !== productId || line.variantId !== variantId)), []);
  const setQty = useCallback((productId: string, qty: number, variantId?: number) => {
    const safe = Math.max(1, Math.min(99, Math.floor(qty) || 1));
    setCart((current) => current.map((line) => line.productId === productId && line.variantId === variantId ? { ...line, qty: safe } : line));
  }, []);
  const setVariant = useCallback((productId: string, variantId: number, previousVariantId?: number) => setCart((current) => {
    const source = current.find((line) => line.productId === productId && line.variantId === previousVariantId);
    if (!source || source.variantId === variantId) return current;
    const remaining = current.filter((line) => line !== source);
    const target = remaining.find((line) => line.productId === productId && line.variantId === variantId);
    return target ? remaining.map((line) => line === target ? { ...line, qty: Math.min(99, line.qty + source.qty) } : line) : [...remaining, { ...source, variantId }];
  }), []);
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

  const register = useCallback(async (name: string, email: string, password: string, phone = '') => {
    if (!name.trim() || !email.trim() || password.trim().length < 6) return false;
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password, phone }),
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
          if (!product) return null;
          const variant = product.variants?.find((item) => item.id === line.variantId);
          return { product, qty: line.qty, variant, unitPriceUsd: variant?.priceUsd ?? getEffectivePriceUsd(product) };
        })
        .filter((line): line is { product: Product; qty: number; variant: Product['variants'] extends (infer V)[] | undefined ? V | undefined : undefined; unitPriceUsd: number } => line !== null),
    [cart, serverProducts],
  );

  const catalogProducts = useMemo(
    () => (serverProducts.length ? [...serverProducts].sort((a, b) => a.shopOrder - b.shopOrder) : SHOP_PRODUCTS),
    [serverProducts],
  );

  const cartSubtotalUsd = useMemo(
    () =>
      cartLines.reduce(
        (total, line) => total + (line.variant?.originalPriceUsd ?? line.unitPriceUsd) * line.qty,
        0,
      ),
    [cartLines],
  );

  const cartDiscountUsd = useMemo(
    () =>
      cartLines.reduce((total, line) => {
        const base = line.variant ? (line.variant.originalPriceUsd ?? line.unitPriceUsd) : line.product.basePriceUsd;
        return total + Math.max(0, base - line.unitPriceUsd) * line.qty;
      }, 0),
    [cartLines],
  );

  const cartTotalUsd = cartSubtotalUsd - cartDiscountUsd;

  const cartCount = useMemo(
    () => cart.reduce((total, line) => total + line.qty, 0),
    [cart],
  );



  const value = useMemo<StoreContextValue>(
    () => ({
      catalogProducts,
      catalogLoaded,
      catalogCategories,
      cart,
      cartCount,
      cartLines,
      cartSubtotalUsd,
      cartDiscountUsd,
      addToCart,
      removeFromCart,
      setQty,
      setVariant,
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
    }),
    [
      catalogProducts,
      catalogLoaded,
      catalogCategories,
      cart,
      cartCount,
      cartLines,
      cartSubtotalUsd,
      cartDiscountUsd,
      addToCart,
      removeFromCart,
      setQty,
      setVariant,
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
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore deve ser usado dentro de StoreProvider');
  return context;
}
