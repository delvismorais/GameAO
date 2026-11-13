import { useSettings } from '../../context/SettingsContext';
import { formatUsdAsAoa } from '../../lib/pricing';

interface PriceProps {
  /** Preço efetivo (promocional, se existir) em USD. */
  usd: number;
  /** Preço-base em USD, para mostrar o valor anterior riscado. */
  baseUsd?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  align?: 'left' | 'center';
}

/**
 * Única porta de entrada para preços no website.
 * Converte sempre com a taxa configurada no SettingsContext.
 */
export function Price({ usd, baseUsd, size = 'md', className = '', align }: PriceProps) {
  const { rate } = useSettings();
  const hasDiscount = typeof baseUsd === 'number' && baseUsd > usd;
  return (
    <div
      className={`price price--${size} ${align ? `price--${align}` : ''} ${className}`.trim()}
    >
      <span className="price__current">{formatUsdAsAoa(usd, rate)}</span>
      {hasDiscount && <del className="price__old">{formatUsdAsAoa(baseUsd, rate)}</del>}
    </div>
  );
}
