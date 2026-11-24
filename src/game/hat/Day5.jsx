import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { sfx } from '../../lib/audio';
import { Sheet } from '../../components/ui';
import { PageScan } from '../Scanner';
import { Set3D, charImg } from './art';
import { PAGE, NEEDS, cust, gk } from './content';
import { EXTRA, portrait } from './chars3d';
import { buildHat } from './hat3d';

// pictures of the finished hats (the same 3D hats as the studio)
for (const id of ['strawberry', 'swan', 'ostrich']) EXTRA['hat:' + id] ||= () => { const h = buildHat({ ...NEEDS[id], fabric: 'felt' }); const s = 1 / h.userData.size; h.scale.setScalar(s * 1.4); h.userData.top = 1.6; return h; };
const img = id => (id.startsWith('hat:') ? portrait(id, { full: true }) : charImg(id));

/* ---------- maze generation (seeded recursive backtracker) ---------- */
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const DIRS = [[0, -1, 'n', 's'], [1, 0, 'e', 'w'], [0, 1, 's', 'n'], [-1, 0, 'w', 'e']];
export function makeMaze(W, H, seed) {
  const r = rng(seed); const cells = Array.from({ length: H }, () => Array.from({ length: W }, () => ({ n: 1, e: 1, s: 1, w: 1, v: 0 })));
  const st = [[0, 0]]; cells[0][0].v = 1;
  while (st.length) {
    const [x, y] = st.at(-1); const opts = DIRS.filter(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < W && ny < H && !cells[ny][nx].v; });
    if (!opts.length) { st.pop(); continue; }
    const [dx, dy, a, b] = opts[Math.floor(r() * opts.length)]; cells[y][x][a] = 0; cells[y + dy][x + dx][b] = 0; cells[y + dy][x + dx].v = 1; st.push([x + dx, y + dy]);
  }
  return cells;
}
const canGo = (m, x, y, d) => { const D = DIRS.find(q => q[2] === d); const nx = x + D[0], ny = y + D[1]; return !m[y][x][d] && ny >= 0 && ny < m.length && nx >= 0 && nx < m[0].length ? [nx, ny] : null; };
function path(m, from, to) {
  const key = ([x, y]) => x + ',' + y; const prev = { [key(from)]: null }; const q = [from];
  while (q.length) { const c = q.shift(); if (c[0] === to[0] && c[1] === to[1]) break; for (const [, , d] of DIRS) { const n = canGo(m, c[0], c[1], d); if (n && !(key(n) in prev)) { prev[key(n)] = c; q.push(n); } } }
  const out = []; let c = to; while (c) { out.unshift(c); c = prev[key(c)]; } return out;
}
/** Zizoun walks out of a side branch onto the route and back again. */
function patrol(m, route) {
  const on = new Set(route.map(c => c + ''));
  for (let i = Math.floor(route.length * 0.35); i < route.length - 2; i++) {
    const [x, y] = route[i];
    for (const [, , d] of DIRS) {
      let n = canGo(m, x, y, d); if (!n || on.has(n + '')) continue;
      const br = [n]; let prevC = [x, y];
      for (let k = 0; k < 3; k++) { const c = br.at(-1); const nx = DIRS.map(q => canGo(m, c[0], c[1], q[2])).find(z => z && !(z[0] === prevC[0] && z[1] === prevC[1]) && !on.has(z + '')); if (!nx) break; prevC = c; br.push(nx); }
      const out = [...br.reverse(), [x, y]]; return [...out, ...out.slice(1, -1).reverse()];
    }
  }
  return null;
}

function useKeys(move) {
  useEffect(() => {
    const k = e => { const d = { ArrowUp: 'n', ArrowDown: 's', ArrowLeft: 'w', ArrowRight: 'e', w: 'n', s: 's', a: 'w', d: 'e' }[e.key]; if (d) { e.preventDefault(); move(d); } };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, [move]);
}
function DPad({ move }) {
  const { t } = useI18n();
  return <div className="dpad" dir="ltr">
    <button className="u" aria-label={t('up')} onClick={() => move('n')}>▲</button><button className="l" aria-label={t('left')} onClick={() => move('w')}>◀</button>
    <button className="d" aria-label={t('down')} onClick={() => move('s')}>▼</button><button className="r" aria-label={t('right')} onClick={() => move('e')}>▶</button>
  </div>;
}
/** swipe on the maze to move one cell */
const swipe = move => { let s = null; return { onPointerDown: e => { s = [e.clientX, e.clientY]; }, onPointerUp: e => { if (!s) return; const dx = e.clientX - s[0], dy = e.clientY - s[1]; s = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return; move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n')); } }; };

function MazeSvg({ m, children, exits = [], ...rest }) {
  const H = m.length, W = m[0].length, S = 40;
  const walls = []; m.forEach((row, y) => row.forEach((c, x) => {
    const X = x * S, Y = y * S;
    if (c.n && !exits.some(e => e.x === x && e.y === y && e.side === 'n')) walls.push(`M${X} ${Y}h${S}`);
    if (c.w) walls.push(`M${X} ${Y}v${S}`);
    if (y === H - 1 && c.s) walls.push(`M${X} ${Y + S}h${S}`);
    if (x === W - 1 && c.e && !exits.some(e => e.x === x && e.y === y && e.side === 'e')) walls.push(`M${X + S} ${Y}v${S}`);
    if (c.e && x < W - 1) walls.push(`M${X + S} ${Y}v${S}`);
    if (c.s && y < H - 1) walls.push(`M${X} ${Y + S}h${S}`);
  }));
  return <svg className="maze" viewBox={`-8 -8 ${W * S + 60} ${H * S + 16}`} {...rest} dir="ltr">
    <rect x="0" y="0" width={W * S} height={H * S} fill="#cfe9ef" rx="6" />
    <path d={walls.join('')} stroke="#7a3a6b" strokeWidth="6" strokeLinecap="round" fill="none" />
    {children}
  </svg>;
}
const Tok = ({ x, y, art, emoji, s = 40, big = 1 }) => art
  ? <image href={img(art)} x={x * s + s / 2 - s * 0.5 * big} y={y * s + s / 2 - s * 0.62 * big} width={s * big} height={s * big * 1.1} preserveAspectRatio="xMidYMax meet" style={{ transition: 'x .12s, y .12s' }} />
  : <text x={x * s + s / 2} y={y * s + s / 2 + 10} fontSize="28" textAnchor="middle">{emoji}</text>;

export default function Day5({ band, guide, onFinish }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState('m1'); // m1 | m2 | bonus
  const R = useRef({}).current;
  useEffect(() => { guide(t('d5M1Say'), 0, true); }, []); // eslint-disable-line
  const finish = bonus => {
    const stars = 1 + (R.maze1.caught === 0 ? 1 : 0) + (bonus ? 1 : 0);
    onFinish({ stars, data: { maze1: R.maze1, maze2: R.maze2, bookBonus: bonus }, summary: t('d5Sum') });
  };
  return <>
    {phase === 'm1' && <Set3D at="shop" lit={6} cam="wide" cast={[{ id: 'said', at: [-6, 9], anim: 'idle', face: 0.7 }, { id: 'zizoun', at: [5, 10], to: [-7, 11], speed: 0.6 }]} />}
    {phase !== 'm1' && <Set3D at="shop" lit={6} cast={[{ id: 'said', at: [-1, 5.6], anim: phase === 'bonus' ? 'hop' : 'bob' }, ...['strawberry', 'swan', 'ostrich'].map((id, i) => ({ id, at: [1.4 + i * 1.8, 5.2 + (i % 2) * 0.5], anim: 'bob' }))]} />}
    {phase === 'm1' && <Sheet size="tall"><Stealth band={band} guide={guide} onDone={r => { R.maze1 = r; sfx('chime'); setPhase('m2'); guide(t('d5M2Say'), 0, true); }} /></Sheet>}
    {phase === 'm2' && <Sheet size="tall"><Deliver band={band} guide={guide} onDone={r => { R.maze2 = r; setPhase('bonus'); guide(t('d5BonusSay'), 0, true); }} /></Sheet>}
    {phase === 'bonus' && <Sheet size="tall"><div className="stack">
      <PageScan eyebrow={t('bookLink')} title={t('d5BonusQ')} img={PAGE(24)} btnLabel={t('d5BonusBtn')} foundLabel={t('bonusStar')} onDone={() => { sfx('cheer'); finish(true); }} />
      <button className="btn ghost" onClick={() => finish(false)}>{t('d5NoBook')}</button>
    </div></Sheet>}
  </>;
}

const SIZE = { little: 5, early: 7, reader: 9 };

/** Maze 1 (page 24): take Said to the shop without being seen by Zizoun on his walk. */
function Stealth({ band, guide, onDone }) {
  const { t } = useI18n();
  const N = SIZE[band]; const seed = useMemo(() => Math.floor(Math.random() * 1e9), []);
  const m = useMemo(() => makeMaze(N, N, seed), [N, seed]);
  const goal = [N - 1, N - 1]; const route = useMemo(() => path(m, [0, 0], goal), [m]); // eslint-disable-line
  const pat = useMemo(() => patrol(m, route), [m, route]);
  const [me, setMe] = useState([0, 0]); const [zi, setZi] = useState(0); const [flash, setFlash] = useState(false);
  const S = useRef({ moves: 0, caught: 0, t0: Date.now(), done: false }).current;
  const zz = pat ? pat[zi % pat.length] : null;
  const seen = (p, z) => z && Math.abs(p[0] - z[0]) + Math.abs(p[1] - z[1]) === 0;
  useEffect(() => { if (!pat) return; const iv = setInterval(() => setZi(i => i + 1), band === 'little' ? 1100 : band === 'early' ? 850 : 650); return () => clearInterval(iv); }, [pat, band]);
  useEffect(() => { if (zz && seen(me, zz) && !S.done) caught(); }, [zi]); // eslint-disable-line
  const caught = () => { S.caught++; sfx('gasp'); setFlash(true); setTimeout(() => setFlash(false), 700); guide(t('d5Caught'), 3000, true); setMe([0, 0]); };
  const move = d => {
    if (S.done) return; const n = canGo(m, me[0], me[1], d); if (!n) { sfx('soft'); return; }
    S.moves++; sfx('tap');
    if (zz && seen(n, zz)) { caught(); return; }
    setMe(n);
    if (n[0] === goal[0] && n[1] === goal[1]) { S.done = true; setTimeout(() => onDone({ moves: S.moves, caught: S.caught, secs: Math.round((Date.now() - S.t0) / 1000), shortest: route.length - 1 }), 600); }
  };
  useKeys(move);
  return <div className="stack">
    <div className="eyebrow">{t('d5M1Ey')}</div>
    <h3>{t('d5M1Q')}</h3>
    <div style={{ outline: flash ? '5px solid var(--bad)' : 'none', borderRadius: 16 }}>
      <MazeSvg m={m} {...swipe(move)}>
        <Tok x={goal[0]} y={goal[1]} art="shop" big={1.3} />
        {zz && <Tok x={zz[0]} y={zz[1]} art="zizoun" big={1.15} />}
        <Tok x={me[0]} y={me[1]} art="said" />
      </MazeSvg>
    </div>
    <DPad move={move} />
    <p className="small muted">{t('d5Help')}</p>
  </div>;
}

/** Maze 2 (page 25): deliver each hat to the right customer. Three doors, one is theirs. */
function Deliver({ band, guide, onDone }) {
  const { t, L, lang } = useI18n();
  const who = band === 'little' ? ['strawberry', 'swan'] : ['strawberry', 'swan', 'ostrich'];
  const hats = { strawberry: 'hat:strawberry', swan: 'hat:swan', ostrich: 'hat:ostrich' };
  const N = Math.max(5, SIZE[band] - 1);
  const [k, setK] = useState(0);
  const S = useRef({ wrong: 0, moves: 0 }).current;
  const seed = useMemo(() => Math.floor(Math.random() * 1e9) + k, [k]);
  const m = useMemo(() => makeMaze(N, N, seed), [N, seed]);
  const rows = useMemo(() => { const r = rng(seed + 7); const ys = [0, Math.floor(N / 2), N - 1]; const order = ['strawberry', 'swan', 'ostrich'].sort(() => r() - 0.5); return order.map((id, i) => ({ id, y: ys[i] })); }, [N, seed]);
  const [me, setMe] = useState([0, Math.floor(N / 2)]);
  const target = who[k]; const c = cust(target);
  useEffect(() => { setMe([0, Math.floor(N / 2)]); guide(t('d5Deliver', { c: L(c.name) }), 0, true); }, [k]); // eslint-disable-line
  const move = d => {
    const [x, y] = me;
    if (d === 'e' && x === N - 1) { const door = rows.find(r => r.y === y); if (door) { if (door.id === target) { sfx('cheer'); if (k + 1 < who.length) setK(k + 1); else onDone({ deliveries: who.length, wrong: S.wrong, moves: S.moves }); } else { S.wrong++; sfx('soft'); guide(t(gk('d5WrongDoor', cust(door.id), lang), { c: L(cust(door.id).name) }), 3000, true); } return; } }
    const n = canGo(m, x, y, d); if (!n) { sfx('soft'); return; } S.moves++; sfx('tap'); setMe(n);
  };
  useKeys(move);
  return <div className="stack">
    <div className="eyebrow">{t('d5M2Ey', { n: k + 1, m: who.length })}</div>
    <h3>{t('d5M2Q', { c: L(c.name) })}</h3>
    <MazeSvg m={m} exits={rows.map(r => ({ x: N - 1, y: r.y, side: 'e' }))} {...swipe(move)}>
      {rows.map(r => <Tok key={r.id} x={N} y={r.y} art={r.id} big={1.2} />)}
      <Tok x={me[0]} y={me[1]} art={hats[target]} big={0.9} />
    </MazeSvg>
    <DPad move={move} />
  </div>;
}
