interface RatingProps {
  value: number;
  count?: number;
  showCount?: boolean;
  className?: string;
}

export function Rating({ value, count, showCount = false, className = '' }: RatingProps) {
  const safe = Math.max(0, Math.min(5, value));
  const width = `${(safe / 5) * 100}%`;
  return (
    <div className={`rating ${className}`.trim()}>
      <span className="rating__stars" role="img" aria-label={`Avaliação ${safe.toFixed(1)} de 5`}>
        <span className="rating__base" aria-hidden="true">
          ★★★★★
        </span>
        <span className="rating__fill" style={{ width }} aria-hidden="true">
          ★★★★★
        </span>
      </span>
      {showCount && count !== undefined && (
        <span className="rating__count">
          ({count} {count === 1 ? 'avaliação' : 'avaliações'})
        </span>
      )}
    </div>
  );
}
