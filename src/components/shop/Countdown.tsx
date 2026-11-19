import { useEffect, useState } from 'react';

const FALLBACK_TARGET = '2028-09-29T00:00:00';

function getParts(targetDate: string) {
  const target = new Date(targetDate || FALLBACK_TARGET).getTime();
  const diff = Math.max(0, (Number.isFinite(target) ? target : new Date(FALLBACK_TARGET).getTime()) - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

export function Countdown({ endsAt }: { endsAt?: string }) {
  const [parts, setParts] = useState(() => getParts(endsAt ?? FALLBACK_TARGET));

  useEffect(() => {
    setParts(getParts(endsAt ?? FALLBACK_TARGET));
    const timer = window.setInterval(() => setParts(getParts(endsAt ?? FALLBACK_TARGET)), 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  const blocks = [
    { value: String(parts.days).padStart(3, '0'), label: 'Dias' },
    { value: String(parts.hours).padStart(2, '0'), label: 'Horas' },
    { value: String(parts.minutes).padStart(2, '0'), label: 'Min' },
    { value: String(parts.seconds).padStart(2, '0'), label: 'Seg' },
  ];

  return (
    <div className="countdown" aria-label="Tempo restante das ofertas">
      {blocks.map((block) => (
        <div className="countdown__block" key={block.label}>
          <span className="countdown__value">{block.value}</span>
          <span className="countdown__label">{block.label}</span>
        </div>
      ))}
    </div>
  );
}
