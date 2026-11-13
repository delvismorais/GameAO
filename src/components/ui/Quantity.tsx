interface QuantityProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
  label?: string;
}

export function Quantity({
  value,
  onChange,
  min = 1,
  max = 99,
  compact = false,
  label = 'Quantidade',
}: QuantityProps) {
  const clamp = (next: number) => Math.max(min, Math.min(max, next));
  return (
    <div className={`qty ${compact ? 'qty--compact' : ''}`.trim()}>
      <button
        type="button"
        className="qty__btn"
        onClick={() => onChange(clamp(value - 1))}
        aria-label={`Diminuir ${label.toLowerCase()}`}
        disabled={value <= min}
      >
        −
      </button>
      <input
        className="qty__input"
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(clamp(next));
        }}
      />
      <button
        type="button"
        className="qty__btn"
        onClick={() => onChange(clamp(value + 1))}
        aria-label={`Aumentar ${label.toLowerCase()}`}
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}
