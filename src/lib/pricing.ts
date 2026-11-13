/**
 * Única fonte de conversão e formatação monetária do website.
 * Todos os preços visíveis devem passar por estas funções.
 */

/** Converte um valor base em USD para AOA com arredondamento a 2 casas. */
export function usdToAoa(usd: number, rate: number): number {
  if (!Number.isFinite(usd) || !Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round(usd * rate * 100) / 100;
}

/**
 * Formata um valor em kwanzas no padrão angolano pedido:
 * ponto para milhares, vírgula para decimais e sufixo Kz — 79.000,00 Kz.
 * A formatação é manual para garantir este formato em todos os browsers.
 */
export function formatAoa(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const fixed = Math.abs(safe).toFixed(2);
  const [integer, decimals] = fixed.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = safe < 0 ? '-' : '';
  return `${sign}${grouped},${decimals} Kz`;
}

/** Converte diretamente de USD para o texto em kwanzas. */
export function formatUsdAsAoa(usd: number, rate: number): string {
  return formatAoa(usdToAoa(usd, rate));
}

/** Percentagem de desconto inteira (ex.: 34). */
export function discountPercent(baseUsd: number, saleUsd?: number | null): number {
  if (!saleUsd || saleUsd >= baseUsd || baseUsd <= 0) return 0;
  return Math.round((1 - saleUsd / baseUsd) * 100);
}

/** Data legível em português de Angola. */
export function formatDatePt(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Data curta: 13/11/2026 */
export function formatShortDatePt(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
