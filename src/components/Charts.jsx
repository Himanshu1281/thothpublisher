// Tiny dependency-free SVG charts.
export function LineChart({ data, max = 100, color = '#1a8fe0', suffix = '', height = 170 }) {
  const W = 520, H = height, p = { l: 34, r: 12, t: 14, b: 26 };
  if (!data.length) return null;
  const x = i => p.l + (data.length === 1 ? (W - p.l - p.r) / 2 : i * (W - p.l - p.r) / (data.length - 1));
  const y = v => p.t + (1 - v / max) * (H - p.t - p.b);
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.v)}`).join('');
  return <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img">
    {[0, 0.5, 1].map(f => <g key={f}><line x1={p.l} x2={W - p.r} y1={y(max * f)} y2={y(max * f)} stroke="#f0e6d2" strokeWidth="2" /><text x={p.l - 6} y={y(max * f) + 4} textAnchor="end">{Math.round(max * f)}{suffix}</text></g>)}
    <path d={`${path}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={color} opacity=".12" />
    <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
    {data.map((d, i) => <g key={i}><circle cx={x(i)} cy={y(d.v)} r="6" fill="#fff" stroke={color} strokeWidth="3"><title>{d.label}: {d.v}{suffix}</title></circle>
      {(data.length <= 8 || i % Math.ceil(data.length / 8) === 0) && <text x={x(i)} y={H - 6} textAnchor="middle">{d.label}</text>}</g>)}
  </svg>;
}
export function BarChart({ data, color = '#F7B500', height = 170, suffix = '' }) {
  const W = 520, H = height, p = { l: 30, r: 8, t: 14, b: 26 };
  if (!data.length) return null;
  const max = Math.max(1, ...data.map(d => d.v));
  const bw = (W - p.l - p.r) / data.length;
  const y = v => p.t + (1 - v / max) * (H - p.t - p.b);
  return <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img">
    <line x1={p.l} x2={W - p.r} y1={y(0)} y2={y(0)} stroke="#1b1b2f" strokeWidth="2" />
    <text x={p.l - 6} y={y(max) + 4} textAnchor="end">{max}</text>
    {data.map((d, i) => <g key={i}>
      <rect x={p.l + i * bw + bw * 0.15} y={y(d.v)} width={bw * 0.7} height={Math.max(0, y(0) - y(d.v))} rx="5" fill={d.color || color} stroke="#1b1b2f" strokeWidth="2"><title>{d.label}: {d.v}{suffix}</title></rect>
      {(data.length <= 15 || i % Math.ceil(data.length / 10) === 0) && <text x={p.l + i * bw + bw / 2} y={H - 6} textAnchor="middle">{d.label}</text>}
    </g>)}
  </svg>;
}
export function Donut({ parts, size = 150 }) {
  const total = parts.reduce((a, b) => a + b.v, 0) || 1; let acc = 0; const R = 50, C = 2 * Math.PI * R;
  return <svg viewBox="0 0 140 140" width={size} height={size} role="img">
    <circle cx="70" cy="70" r={R} fill="none" stroke="#f0e6d2" strokeWidth="22" />
    {parts.map((p, i) => { const len = p.v / total * C; const el = <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={p.color} strokeWidth="22" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)"><title>{p.label}: {p.v}</title></circle>; acc += len; return el; })}
    <text x="70" y="77" textAnchor="middle" style={{ fontSize: 22, fontWeight: 900, fill: '#1b1b2f' }}>{total === 1 && !parts.some(p => p.v) ? 0 : parts.reduce((a, b) => a + b.v, 0)}</text>
  </svg>;
}
