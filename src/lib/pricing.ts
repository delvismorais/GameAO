/**
 * Única fonte de conversão e formatação monetária do website.
 * Todos os preços visíveis devem passar por estas funções.
 */

/** Conversão interna dos preços-base para a moeda padrão de apresentação da loja. */
export function usdToAoa(usd: number, rate: number): number {
  if (!Number.isFinite(usd) || !Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round(usd * rate * 100) / 100;
}

function formatKz(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(safe)} Kz`;
}

export function formatAoa(value: number): string {
  return formatKz(value);
}

/** Formata o preço base na moeda padrão Kz. */
export function formatUsdAsAoa(usd: number, rate = 913): string {
  return formatKz(usdToAoa(usd, rate));
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
