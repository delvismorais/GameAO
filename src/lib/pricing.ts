/**
 * Única fonte de conversão e formatação monetária do website.
 * Todos os preços visíveis devem passar por estas funções.
 */

/** Compatibilidade interna para cálculos históricos; não é usado para a apresentação pública. */
export function usdToAoa(usd: number, rate: number): number {
  if (!Number.isFinite(usd) || !Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round(usd * rate * 100) / 100;
}

/**
 * Formata um valor monetário direto, sem apresentar conversão cambial.
 */
export function formatAoa(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(safe);
}

/** Formata o preço base diretamente, sem apresentar conversão cambial. */
export function formatUsdAsAoa(usd: number, _rate?: number): string {
  const safe = Number.isFinite(usd) ? usd : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(safe);
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
