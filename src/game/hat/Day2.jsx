import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { sfx } from '../../lib/audio';
import { Sheet } from '../../components/ui';
import { Set3D, Story, Face, useTown } from './art';
import ReadLines from './ReadLines';
import { CUSTOMERS, ROOM_SPOTS, POSTER_TITLES, STICKERS, NET_RULES } from './content';
import { Art } from '../../components/Art';

export default function Day2({ band, guide, onFinish }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState('intro'); // intro | room | names | poster | rules | send
  const [met, setMet] = useState([]);
  const R = useRef({ readings: [], room: null, titleFirst: null, rules: null, stickers: 0, found: [] }).current;
  const [, force] = useState(0);

  const zizSit = { id: 'zizoun', at: [0.4, -1.75], anim: 'sit', y: -0.15 };
  if (phase === 'intro') return <Story tag={t('dayN', { n: 2 })} onDone={() => { setPhase('room'); guide(t('d2RoomSay'), 0, true); }} shots={[
    { dur: 4.6, cap: t('d2c1'), set: { at: 'house', cast: [zizSit] } },
    { dur: 4.6, cap: t('d2c2'), set: { at: 'studio', cast: [{ id: 'said', at: [-1.2, -1.8], anim: 'hop' }] } },
    { dur: 4.6, cap: t('d2c3'), set: { at: 'house', cam: { pos: [-3.5, 3, 7], look: [-1, 1.4, -1] }, cast: [zizSit, { id: 'said', from: [-4, 3.2], at: [-2.6, 1.6], anim: 'idle', face: 0.5, speed: 0.9 }] } },
  ]} />;

  const finish = () => {
    const room = R.room || {};
    const stars = 1 + (room.wakes === 0 ? 1 : 0) + (R.titleFirst && R.rules?.right === NET_RULES.length ? 1 : 0);
    onFinish({ stars, readings: R.readings, data: { room, titleFirst: !!R.titleFirst, rules: R.rules, stickers: R.stickers }, summary: t('d2Sum') });
  };
  const lines = CUSTOMERS.map(c => ({ ar: band === 'little' ? c.shortName : c.readName, en: c.name.en }));

  return <>
    {phase === 'room' && <Set3D at="house" found={R.found || []} cast={[zizSit, { id: 'said', at: [-2.6, 1.6], anim: 'idle', face: 0.5 }]} />}
    {phase === 'names' && <Set3D at="shop" lit={2} cast={[{ id: 'said', at: [-5, 6], anim: 'wave', face: 0.6 }, ...CUSTOMERS.filter(c => met.includes(c.id)).map((c, i) => ({ id: c.id, from: [8, 12], at: [-3 + CUSTOMERS.indexOf(c) * 2.2, 5.2], anim: 'bob' }))]} />}
    {(phase === 'poster' || phase === 'rules') && <Set3D at="studio" cast={[{ id: 'said', at: [-1.2, -1.8], anim: 'sew' }]} />}
    {phase === 'send' && <Set3D at="shop" lit={2} cam="wide" cast={CUSTOMERS.map((c, i) => ({ id: c.id, at: [-4.4 + i * 2.2, 5.4 + (i % 2) * 0.6], anim: 'dance', letter: true }))} />}

    {phase === 'room' && <Sheet size="tall"><Room band={band} guide={guide} onFound={f => { R.found = f; force(x => x + 1); }} onDone={r => { R.room = r; sfx('chime'); setPhase('names'); guide(t('d2NamesSay'), 0, true); }} /></Sheet>}
    {phase === 'names' && <Sheet size="tall"><ReadLines id="names" lines={lines} band={band} eyebrow={t('d2NamesEy')} intro={t('d2NamesIntro')}
      onLine={i => { setMet(m => [...m, CUSTOMERS[i].id]); sfx('pop'); }} onDone={r => { R.readings.push(r); setPhase('poster'); guide(t('d2PosterSay'), 0, true); }} /></Sheet>}
    {phase === 'poster' && <Sheet size="tall"><Poster onDone={(titleFirst, n) => { R.titleFirst = titleFirst; R.stickers = n; setPhase('rules'); guide(t('d2RulesSay'), 0, true); }} /></Sheet>}
    {phase === 'rules' && <Sheet size="tall"><Rules onDone={r => { R.rules = r; setPhase('send'); sfx('whoosh'); guide(t('d2Sent'), 0, true); }} /></Sheet>}
    {phase === 'send' && <Sheet size="slim"><div className="stack">
      <h2>{t('d2SentTitle')}</h2><p>{t('d2SentBody')}</p>
      <div className="row">{CUSTOMERS.map(c => <Face key={c.id} id={c.id} bg={c.bg} size={48} />)}</div>
      <button className="btn big" onClick={finish}>{t('finishDay')}</button>
    </div></Sheet>}
  </>;
}

/** Find the notebook in Zizoun's living room (pp. 10–11) without waking him behind his newspaper.
 *  The child taps things in the 3D room; tapping the wrong things, or moving fast, makes noise. */
function Room({ band, guide, onFound, onDone }) {
  const { t, L } = useI18n(); const town = useTown();
  const [noise, setNoise] = useState(0); const [have, setHave] = useState([]); const [frozen, setFrozen] = useState(false);
  const S = useRef({ wrong: 0, wakes: 0, peak: 0, last: null, t0: Date.now(), twitch: false, frozen: false, have: [] }).current;
  const k = band === 'little' ? 0.55 : band === 'early' ? 0.8 : 1;
  const add = v => setNoise(n => { const x = Math.min(110, n + v * k); S.peak = Math.max(S.peak, x); return x; });
  useEffect(() => { const iv = setInterval(() => setNoise(n => Math.max(0, n - 4)), 250); return () => clearInterval(iv); }, []);
  useEffect(() => {
    if (noise >= 100 && !S.frozen) { S.frozen = true; setFrozen(true); S.wakes++; town.paper('peek'); sfx('rustle'); guide(t('d2Freeze'), 0, true); setTimeout(() => { S.frozen = false; setFrozen(false); }, 2600); }
    else if (noise >= 65 && !S.twitch) { S.twitch = true; town.paper('twitch'); sfx('rustle'); setTimeout(() => { S.twitch = false; }, 1200); }
  }, [noise]); // eslint-disable-line
  const tap = id => {
    const s = ROOM_SPOTS.find(x => x.id === id);
    if (S.frozen) { add(20); return; }
    if (!s) { if (id !== 'nothing') return; S.wrong++; add(12); return; }
    if (s.find && (!s.needs || S.have.includes(s.needs))) {
      if (S.have.includes(s.find)) return;
      S.have = [...S.have, s.find]; setHave(S.have); onFound(S.have); sfx(s.find === 'notebook' ? 'chime' : 'ok');
      if (s.find === 'key') guide(t('d2Key'), 0, true);
      else setTimeout(() => onDone({ secs: Math.round((Date.now() - S.t0) / 1000), wrong: S.wrong, wakes: S.wakes, peakNoise: Math.round(S.peak) }), 1500);
    } else if (s.needs) { sfx('soft'); guide(t('d2Locked'), 3500, true); add(10); }
    else { S.wrong++; sfx('soft'); add(24); guide(t('d2Nothing', { w: L(s.label) }), 2500); }
  };
  useEffect(() => {
    town.onPick = tap;
    town.onMove = e => { const now = performance.now(); if (S.last) { const v = Math.hypot(e.clientX - S.last.x, e.clientY - S.last.y) / Math.max(1, now - S.last.t); if (v > 2.2) add(3); } S.last = { x: e.clientX, y: e.clientY, t: now }; };
    return () => { town.onPick = null; town.onMove = null; };
  }); // eslint-disable-line
  return <div className="stack">
    <div className="eyebrow">{t('d2RoomEy')}</div>
    <h3>{have.includes('key') ? t('d2FindNotebook') : t('d2FindKey')}</h3>
    <div className="noise"><Art n="shh" size={26} /><div className="meter"><i style={{ width: Math.min(100, noise) + '%' }} /></div><Art n={noise >= 65 ? 'awake' : 'sleep'} size={26} /></div>
    <p className="small" style={{ fontWeight: 800 }}>{t('d2TapRoom')}</p>
    <p className="small muted">{t('d2RoomHelp')}</p>
    <div className="chips" aria-label={t('d2Places')}>{ROOM_SPOTS.map(s => <button key={s.id} disabled={frozen} onClick={() => tap(s.id)}>{L(s.label)}</button>)}</div>
    {have.length > 0 && <div className="row">{have.includes('key') && <span className="tag l"><Art n="key" size={20} /> {t('d2GotKey')}</span>}{have.includes('notebook') && <span className="tag s"><Art n="notebook" size={20} /> {t('d2GotBook')}</span>}</div>}
  </div>;
}

function Poster({ onDone }) {
  const { t, L } = useI18n();
  const [title, setTitle] = useState(null); const [tries, setTries] = useState(0); const [msg, setMsg] = useState('');
  const [stk, setStk] = useState([]); const drag = useRef(null); const box = useRef(null);
  const pickTitle = (p, i) => { setTries(x => x + 1); if (p.ok) { setTitle(i); setMsg(''); sfx('ok'); } else { sfx('soft'); setMsg(t('d2TitleNo')); } };
  const addSticker = s => { if (stk.length >= 8) return; sfx('pop'); setStk(a => [...a, { s, x: 15 + Math.random() * 70, y: 45 + Math.random() * 40 }]); };
  const onMove = e => { if (drag.current == null) return; const r = box.current.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100; setStk(a => a.map((o, i) => (i === drag.current ? { ...o, x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } : o))); };
  return <div className="stack">
    <div className="eyebrow">{t('d2PosterEy')}</div>
    <h3>{t('d2PosterQ')}</h3>
    <div className="list">{POSTER_TITLES.map((p, i) => <button key={i} className={'btn ' + (title === i ? '' : 'ghost')} style={{ justifyContent: 'flex-start', textAlign: 'start' }} onClick={() => pickTitle(p, i)}>{L(p)}</button>)}</div>
    {msg && <p className="err">{msg}</p>}
    {title != null && <>
      <div ref={box} className="poster" onPointerMove={onMove} onPointerUp={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }}>
        <h4>{L(POSTER_TITLES[title])}</h4>
        {stk.map((o, i) => <span key={i} className="stk" style={{ left: o.x + '%', top: o.y + '%' }} onPointerDown={e => { e.preventDefault(); drag.current = i; }}><Art n={o.s} size={42} /></span>)}
      </div>
      <p className="small muted">{t('d2StickerHelp')}</p>
      <div className="chips">{STICKERS.map(s => <button key={s} onClick={() => addSticker(s)} aria-label={s}><Art n={s} size={30} /></button>)}</div>
      <button className="btn big" disabled={stk.length < 2} onClick={() => onDone(tries === 1, stk.length)}>{t('d2PosterDone')}</button>
    </>}
  </div>;
}

function Rules({ onDone }) {
  const { t, L } = useI18n();
  const [ans, setAns] = useState({}); const first = useRef({});
  const pick = (i, v) => { if (!(i in first.current)) first.current[i] = v === NET_RULES[i].ok; sfx(v === NET_RULES[i].ok ? 'ok' : 'soft'); setAns(a => ({ ...a, [i]: v })); };
  const allRight = NET_RULES.every((r, i) => ans[i] === r.ok);
  return <div className="stack">
    <div className="eyebrow">{t('d2RulesEy')}</div>
    <h3>{t('d2RulesQ')}</h3>
    <div className="sorter">{NET_RULES.map((r, i) => <div key={i} className={'q' + (i in ans ? (ans[i] === r.ok ? ' ok' : ' no') : '')}>
      <span>{L(r)}</span>
      <button className="btn sm ghost" aria-label={t('goodIdea')} onClick={() => pick(i, true)}><Art n="up" size={24} /></button>
      <button className="btn sm ghost" aria-label={t('badIdea')} onClick={() => pick(i, false)}><Art n="down" size={24} /></button>
    </div>)}</div>
    {Object.keys(ans).length === NET_RULES.length && !allRight && <p className="err">{t('d2RulesFix')}</p>}
    <button className="btn big" disabled={!allRight} onClick={() => onDone({ right: Object.values(first.current).filter(Boolean).length, of: NET_RULES.length })}><Art n="letter" size={26} /> {t('d2Send')}</button>
  </div>;
}
