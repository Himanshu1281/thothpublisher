import { useEffect, useState } from 'react';

export const ICON = {
  play: <path d="M7 4l13 8-13 8z" fill="currentColor" />,
  pause: <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" />,
  mic: <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" />,
  speaker: <><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" /><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></>,
  mute: <><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" /><path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2.4" fill="none" /></>,
  star: <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z" fill="currentColor" />,
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="currentColor" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />,
  qr: <><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M14 14h3v3h-3zM18 18h3v3h-3z" stroke="currentColor" strokeWidth="2" /></>,
  check: <path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  x: <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />,
  music: <><path d="M9 18V5l11-2v13" stroke="currentColor" strokeWidth="2" fill="none" /><circle cx="6.5" cy="18" r="2.8" fill="currentColor" /><circle cx="17.5" cy="16" r="2.8" fill="currentColor" /></>,
  film: <><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M10 9l5 3-5 3z" fill="currentColor" /></>,
  cube: <path d="M12 2l9 5v10l-9 5-9-5V7z M3 7l9 5 9-5M12 12v10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />,
  book: <path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />,
  hand: <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5v-6a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V13m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a7 7 0 0 1-5.5-2.7L5 15.5a1.6 1.6 0 0 1 2.6-1.9L8 14" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  replay: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  down: <path d="M12 4v16M5 13l7 7 7-7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  up: <path d="M12 20V4M5 11l7-7 7 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M4 16V5a1 1 0 0 1 1-1h11" stroke="currentColor" strokeWidth="2" fill="none" /></>,
  plus: <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
  globe: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" stroke="currentColor" strokeWidth="2" fill="none" /></>,
  user: <><circle cx="12" cy="8" r="4" fill="currentColor" /><path d="M4 21a8 8 0 0 1 16 0z" fill="currentColor" /></>,
  out: <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="2" fill="none" /></>,
};
export const Icon = ({ n, size }) => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" style={size ? { width: size, height: size } : undefined}>{ICON[n]}</svg>;

export const Loader = () => <div className="loader"><div className="bubble-spin" /></div>;

export function Modal({ children, onClose, wide }) {
  useEffect(() => {
    const k = e => e.key === 'Escape' && onClose?.();
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="back" onMouseDown={e => e.target === e.currentTarget && onClose?.()}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true">{children}</div>
    </div>
  );
}
export const Sheet = ({ children, size = '' }) => <section className={'sheet ' + size}>{children}</section>;

export function Stars({ n, max = 3 }) {
  return <span className="stars" aria-label={`${n}/${max}`}>{Array.from({ length: max }, (_, i) => <span key={i} className={i < n ? '' : 'off'}><Icon n="star" /></span>)}</span>;
}
export const CloseX = ({ onClick, label = 'Close' }) => <button className="x" aria-label={label} onClick={onClick}><Icon n="x" /></button>;

/* toast + confetti via tiny event bus */
const bus = new EventTarget();
export const toast = msg => bus.dispatchEvent(new CustomEvent('toast', { detail: msg }));
export const confetti = () => bus.dispatchEvent(new Event('confetti'));
export function FxLayer() {
  const [msg, setMsg] = useState(null);
  const [burst, setBurst] = useState(0);
  useEffect(() => {
    let tm;
    const a = e => { setMsg(e.detail); clearTimeout(tm); tm = setTimeout(() => setMsg(null), 2400); };
    const b = () => { setBurst(x => x + 1); setTimeout(() => setBurst(0), 2400); };
    bus.addEventListener('toast', a); bus.addEventListener('confetti', b);
    return () => { bus.removeEventListener('toast', a); bus.removeEventListener('confetti', b); };
  }, []);
  const cols = ['#F7B500', '#1a8fe0', '#e8622c', '#2fae63', '#7b4fd6', '#ff6b9b'];
  return <>
    {msg && <div className="toast" role="status">{msg}</div>}
    {burst > 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches &&
      <div className="confetti" key={burst}>{Array.from({ length: 70 }, (_, i) =>
        <i key={i} style={{ left: Math.random() * 100 + '%', background: cols[i % cols.length], animationDelay: Math.random() * 0.5 + 's', transform: `rotate(${Math.random() * 360}deg)` }} />)}</div>}
  </>;
}

export const Wave = () => <span className="wave"><i /><i /><i /><i /><i /></span>;
