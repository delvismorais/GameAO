/**
 * Configuração central da loja.
 *
 * A taxa USD/AOA NÃO deve ser escrita diretamente nos componentes.
 * Este é o único valor por omissão; a taxa efetiva é gerida pelo
 * SettingsContext e pode ser alterada em /configuracoes.
 */

export interface ExchangeRateConfig {
  /** Quantos kwanzas vale 1 dólar americano. */
  usdToAoa: number;
  /** Entidade/fonte da taxa. */
  source: string;
  /** Data de referência da taxa (ISO: AAAA-MM-DD). */
  updatedAt: string;
  /** Nota visível na página de configurações. */
  note: string;
}

export const DEFAULT_EXCHANGE_RATE: ExchangeRateConfig = {
  usdToAoa: 913,
  source: 'Banco Nacional de Angola (BNA)',
  updatedAt: '2026-11-13',
  note: 'Valor configurável para esta demonstração; não é uma cotação em tempo real.',
};

export const STORAGE_KEYS = {
  settings: 'gameao.settings.v1',
  cart: 'gameao.cart.v1',
  wishlist: 'gameao.wishlist.v1',
  compare: 'gameao.compare.v1',
  user: 'gameao.user.v1',
  account: 'gameao.account.v1',
  orders: 'gameao.orders.v1',
  reviews: 'gameao.reviews.v1',
  comments: 'gameao.comments.v1',
} as const;

export const STORE_INFO = {
  name: 'GameAO',
  tagline: 'A sua loja de videojogos em Angola.',
  currency: 'AOA',
  currencySymbol: 'Kz',
  locale: 'pt-AO',
  country: 'Angola',
  demoNotice:
    'Conteúdos de demonstração. Os dados da loja, contactos e artigos são editáveis e serão substituídos pelos definitivos.',
};
