/**
 * Configuração central da loja.
 *
 * Os preços públicos são apresentados diretamente. Os campos de compatibilidade
 * abaixo permanecem apenas para não quebrar dados históricos já guardados.
 */

export interface ExchangeRateConfig {
  /** Legacy compatibility value for historical records. */
  usdToAoa: number;
  /** Legacy compatibility metadata. */
  source: string;
  /** Legacy compatibility metadata. */
  updatedAt: string;
  /** Legacy compatibility metadata. */
  note: string;
}

export const DEFAULT_EXCHANGE_RATE: ExchangeRateConfig = {
  usdToAoa: 913,
  source: 'Banco Nacional de Angola (BNA)',
  updatedAt: '2026-11-13',
  note: 'Valor configurável no painel; não é uma cotação automática em tempo real.',
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
  currency: 'Kz',
  currencySymbol: 'Kz',
  locale: 'pt-AO',
  country: 'Angola',
  managementNote:
    'Conteúdos geridos pelo painel administrativo. Os dados da loja, contactos e artigos podem ser atualizados sem alterar o código.',
};
