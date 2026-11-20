/**
 * Única fonte de formatação monetária do website.
 * Todos os preços visíveis devem passar por estas funções.
 */

/** Compatibilidade histórica: os preços do catálogo já são valores nativos em AOA/Kz. */
export function usdToAoa(value: number, _rate?: number): number {
  return Number.isFinite(value) ? value : 0;
}

function formatKz(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(safe)} Kz`;
}

export function formatAoa(value: number): string {
  return formatKz(value);
}

/** Compatibilidade histórica: formata diretamente o valor nativo em AOA/Kz, sem conversão. */
export function formatUsdAsAoa(value: number, _rate?: number): string {
  return formatKz(value);
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
