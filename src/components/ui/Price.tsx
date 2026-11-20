import { formatUsdAsAoa } from '../../lib/pricing';

interface PriceProps {
  /** Preço efetivo (promocional, se existir) em AOA/Kz. */
  usd: number;
  /** Preço-base em AOA/Kz, para mostrar o valor anterior riscado. */
  baseUsd?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  align?: 'left' | 'center';
}

/**
 * Única porta de entrada para preços no website.
 * Os valores já são nativos em kwanzas; nenhuma taxa cambial é aplicada.
 */
export function Price({ usd, baseUsd, size = 'md', className = '', align }: PriceProps) {
  const hasDiscount = typeof baseUsd === 'number' && baseUsd > usd;
  return (
    <div
      className={`price price--${size} ${align ? `price--${align}` : ''} ${className}`.trim()}
    >
      <span className="price__current">{formatUsdAsAoa(usd)}</span>
      {hasDiscount && <del className="price__old">{formatUsdAsAoa(baseUsd)}</del>}
    </div>
  );
}
