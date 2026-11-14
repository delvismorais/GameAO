import { formatKz } from './ui';

export function LineChart({ data, height = 220 }: { data: Array<{ day: string; revenue: number | string; orders: number | string }>; height?: number }) {
  const width = 720;
  const padding = { top: 18, right: 16, bottom: 28, left: 56 };
  const values = data.map((point) => Number(point.revenue));
  const max = Math.max(1, ...values);
  const stepX = data.length > 1 ? (width - padding.left - padding.right) / (data.length - 1) : 0;
  const y = (value: number) => padding.top + (height - padding.top - padding.bottom) * (1 - value / max);
  const points = data.map((point, index) => `${padding.left + index * stepX},${y(Number(point.revenue))}`).join(' ');
  const area = `${padding.left},${height - padding.bottom} ${points} ${padding.left + (data.length - 1) * stepX},${height - padding.bottom}`;
  const ticks = [0, 0.5, 1];
  return (
    <svg className="admin-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolução da faturação">
      {ticks.map((tick) => <g key={tick}><line x1={padding.left} x2={width - padding.right} y1={y(max * tick)} y2={y(max * tick)} className="admin-chart__grid" /><text x={padding.left - 8} y={y(max * tick) + 4} textAnchor="end" className="admin-chart__label">{Math.round(max * tick / 1000)}k</text></g>)}
      <polygon points={area} className="admin-chart__area" />
      <polyline points={points} className="admin-chart__line" />
      {data.map((point, index) => (index % Math.ceil(data.length / 8) === 0 || index === data.length - 1) ? <text key={point.day} x={padding.left + index * stepX} y={height - 8} textAnchor="middle" className="admin-chart__label">{point.day.slice(5)}</text> : null)}
      {data.map((point, index) => <circle key={`${point.day}-dot`} cx={padding.left + index * stepX} cy={y(Number(point.revenue))} r="3" className="admin-chart__dot"><title>{`${point.day}: ${formatKz(point.revenue)} · ${point.orders} encomendas`}</title></circle>)}
    </svg>
  );
}

export function Bars({ data }: { data: Array<{ label: string; value: number; tone?: string }> }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <div className="admin-bars">
      {data.map((item) => (
        <div className="admin-bars__row" key={item.label}>
          <span>{item.label}</span>
          <div className="admin-bars__track"><div className={`admin-bars__fill ${item.tone ? `is-${item.tone}` : ''}`.trim()} style={{ width: `${Math.round((item.value / max) * 100)}%` }} /></div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

const COLORS = ['#cd3d0f', '#f19a5d', '#0d1b2a', '#4d7ea8', '#8a9a5b', '#b56576', '#6d597a'];
export function Donut({ data }: { data: Array<{ label: string; value: number }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let offset = 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="admin-donut">
      <svg viewBox="0 0 140 140" role="img" aria-label="Distribuição por método de pagamento">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#eef1f5" strokeWidth="18" />
        {data.map((item, index) => {
          const length = total ? (item.value / total) * circumference : 0;
          const circle = <circle key={item.label} cx="70" cy="70" r={radius} fill="none" stroke={COLORS[index % COLORS.length]} strokeWidth="18" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)" />;
          offset += length;
          return circle;
        })}
        <text x="70" y="66" textAnchor="middle" className="admin-donut__total">{total}</text>
        <text x="70" y="84" textAnchor="middle" className="admin-donut__caption">pedidos</text>
      </svg>
      <ul>{data.map((item, index) => <li key={item.label}><i style={{ background: COLORS[index % COLORS.length] }} /><span>{item.label.replaceAll('_', ' ')}</span><strong>{item.value}</strong></li>)}</ul>
    </div>
  );
}
