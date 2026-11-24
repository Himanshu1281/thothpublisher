import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { sfx } from '../../lib/audio';
import { say } from '../../lib/speech';
import { Icon, Sheet } from '../../components/ui';
import { Set3D, BookPage, useTown } from './art';
import ReadLines from './ReadLines';
import { createViewer } from './hat3d';
import { NEEDS, SHAPES, FABRICS, COLOURS, DECOS, cust, gk } from './content';
import { Art } from '../../components/Art';

const ORDER = ['frog', 'strawberry', 'swan', 'corn', 'ostrich'];
const DEMO_BOOK = ['#e8504f', '#5bb7a6', '#f2c14e', '#8e5bb5'];

export default function Day4({ band, guide, onFinish }) {
  const { t, L, lang } = useI18n();
  const list = band === 'little' ? ORDER.slice(0, 3) : ORDER;
  const [phase, setPhase] = useState('colours'); // colours | note | design
  const [i, setI] = useState(0);
  const [book, setBook] = useState(null);
  const R = useRef({ readings: [], designs: [], bookColours: false }).current;
  const who = list[i]; const c = cust(who);

  useEffect(() => { guide(t('d4ColoursSay'), 0, true); }, []); // eslint-disable-line
  useEffect(() => { if (phase === 'note') guide(t(gk('d4NoteSay', c, lang), { c: L(c.name) }), 0, true); }, [phase, i]); // eslint-disable-line

  const done = d => {
    R.designs.push(d);
    if (i + 1 < list.length) { setI(i + 1); setPhase('note'); }
    else {
      const fit = R.designs.filter(x => x.fitFirst).length / R.designs.length, taste = R.designs.filter(x => x.taste).length / R.designs.length;
      onFinish({ stars: 1 + (fit >= 0.8 ? 1 : 0) + (taste >= 0.6 ? 1 : 0), readings: R.readings,
        data: { designs: R.designs, bookColours: R.bookColours, oldHatTries: R.designs.filter(x => x.triedOld).length }, summary: t('d4Sum') });
    }
  };
  const note = NEEDS[who].note;
  return <>
    <Set3D at="studio" cast={[{ id: 'said', at: [-1.2, -1.8], anim: phase === 'design' ? 'sew' : 'idle' },
      ...(phase !== 'colours' ? [{ id: who, from: [5, 4], at: [1.7, 0.9], anim: 'idle', face: -0.35 }] : [])]} />
    {phase === 'colours' && <Sheet size="tall"><BookColours onDone={(cols, real) => { setBook(cols); R.bookColours = real; setPhase('note'); }} /></Sheet>}
    {phase === 'note' && <Sheet size="tall"><div className="stack">
      <div className="eyebrow">{t('d4Customer', { n: i + 1, m: list.length })} · {L(c.name)}</div>
      <div className="note"><ReadLines key={who} id={'note-' + who} band={band} lines={[{ ar: band === 'reader' || band === 'early' ? note.long : note.short, en: note.en }]}
        intro={t('d4NoteIntro')} doneLabel={t('d4ToDesign')} onDone={r => { R.readings.push(r); setPhase('design'); guide(t('d4DesignSay'), 5000, true); }} /></div>
    </div></Sheet>}
    {phase === 'design' && <Sheet size="tall"><Studio key={who} who={who} book={book} band={band} guide={guide} onDone={done} /></Sheet>}
  </>;
}

/** Colour the hats on pages 22–23 with crayons, then scan: the crayon colours become a fabric. */
function BookColours({ onDone }) {
  const { t } = useI18n();
  const v = useRef(null); const [cam, setCam] = useState(false); const [cols, setCols] = useState(null); const stream = useRef(null);
  useEffect(() => () => stream.current?.getTracks().forEach(x => x.stop()), []);
  const open = async () => {
    try { stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); setCam(true); setTimeout(() => { v.current.srcObject = stream.current; v.current.play(); }, 0); }
    catch { setCols(DEMO_BOOK); }
  };
  const capture = () => {
    const c = document.createElement('canvas'); c.width = 96; c.height = 72; const x = c.getContext('2d'); x.drawImage(v.current, 0, 0, 96, 72);
    const d = x.getImageData(0, 0, 96, 72).data; const buckets = {};
    for (let k = 0; k < d.length; k += 4) {
      const r = d[k], g = d[k + 1], b = d[k + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn < 45 || mx < 60) continue; // skip paper, pencil lines, shadows
      let h = 0; if (mx === r) h = ((g - b) / (mx - mn)) % 6; else if (mx === g) h = (b - r) / (mx - mn) + 2; else h = (r - g) / (mx - mn) + 4;
      const key = Math.round(((h * 60 + 360) % 360) / 30); (buckets[key] ||= { n: 0, r: 0, g: 0, b: 0 }); const o = buckets[key]; o.n++; o.r += r; o.g += g; o.b += b;
    }
    const top = Object.values(buckets).filter(o => o.n > 40).sort((a, b) => b.n - a.n).slice(0, 4).map(o => `rgb(${o.r / o.n | 0},${o.g / o.n | 0},${o.b / o.n | 0})`);
    stream.current?.getTracks().forEach(x => x.stop()); setCam(false);
    if (top.length) { sfx('chime'); setCols(top); } else { sfx('soft'); setCols(DEMO_BOOK); }
  };
  return <div className="stack">
    <div className="eyebrow">{t('bookLink')} · {t('pagesN', { n: '22–23' })}</div>
    <h3>{t('d4ColoursQ')}</h3>
    <p className="small muted">{t('d4ColoursHelp')}</p>
    {!cam && !cols && <div className="row" style={{ gap: 8 }}><BookPage p={22} className="" /><BookPage p={23} /></div>}
    {cam && <div className="scanner"><video ref={v} playsInline muted /><div className="line" /></div>}
    {cols && <div className="row"><b>{t('yourColours')}</b><span className="colour-from-book">{cols.map((x, i) => <i key={i} style={{ background: x }} />)}</span></div>}
    <div className="row">
      {!cam && !cols && <button className="btn big sea" onClick={open}><Icon n="camera" />{t('scanColours')}</button>}
      {cam && <button className="btn big" onClick={capture}><Icon n="camera" />{t('capture')}</button>}
      {!cols && <button className="btn ghost" onClick={() => { stream.current?.getTracks().forEach(x => x.stop()); setCam(false); setCols(DEMO_BOOK); }}>{t('useDemoColours')}</button>}
      {cols && <button className="btn big" onClick={() => onDone(cols, cols !== DEMO_BOOK)}>{t('toStudio')}</button>}
    </div>
  </div>;
}

function Studio({ who, book, guide, onDone }) {
  const { t, L, lang } = useI18n(); const town = useTown();
  const need = NEEDS[who]; const c = cust(who);
  const cv = useRef(null); const view = useRef(null);
  const [d, setD] = useState({ shape: 'classic', fabric: 'felt', colour: '#7a3a6b', deco: 'none' });
  const [tryon, setTryon] = useState(null); // {img, result}
  const S = useRef({ tries: 0, triedOld: false, first: null }).current;
  useEffect(() => () => { town.putHat(who, null); town.char(who).anim = 'idle'; }, []); // eslint-disable-line
  useEffect(() => { view.current = createViewer(cv.current); const r = () => view.current?.resize(); addEventListener('resize', r); return () => { removeEventListener('resize', r); view.current.dispose(); }; }, []);
  useEffect(() => { view.current?.set({ ...d, book }); }, [d, book]);
  const set = (k, v) => { sfx('pop'); setD(o => ({ ...o, [k]: v })); setTryon(null); town.putHat(who, null); town.char(who).anim = 'idle'; };

  const tryOn = () => {
    S.tries++;
    const result = d.shape === 'classic' ? 'old' : d.shape !== need.shape ? 'wrong' : 'fit';
    const failCls = { frog: 'off', corn: 'off', strawberry: 'squash', swan: 'cover', ostrich: 'squash' }[who];
    town.putHat(who, { ...d, book }, result === 'old' ? failCls : 'fit');
    town.char(who).anim = result === 'fit' ? 'dance' : result === 'old' ? 'shake' : 'idle';
    if (result === 'old' && who === 'ostrich') setTimeout(() => { town.char('ostrich').extraY = -1.2; setTimeout(() => { town.char('ostrich').extraY = 0; }, 1600); }, 500);
    if (S.first == null) S.first = result === 'fit';
    if (result === 'old') S.triedOld = true;
    setTryon({ result });
    if (result === 'old') { sfx(who === 'frog' ? 'boing' : 'soft'); guide(L(need.fail) + ' ' + t('d4OldLesson'), 0, true); }
    else if (result === 'wrong') { sfx('soft'); guide(t('d4Wrong'), 0, true); say(need.note.short, 'ar'); }
    else { sfx('cheer'); guide(d.deco === need.deco ? t(gk('d4Taste', c, lang), { c: L(c.name) }) : t(gk('d4Fit', c, lang), { c: L(c.name), d: L(DECOS.find(x => x.id === need.deco)) }), 0, true); }
  };
  const accept = () => onDone({ id: who, ...d, fabric: d.fabric, tries: S.tries, fitFirst: !!S.first, triedOld: S.triedOld, taste: d.deco === need.deco });

  return <div className="stack studio">
    <div className="eyebrow">{t('d4StudioEy')} · {L(c.name)}</div>
    <div className="note small"><b lang="ar" className="ar">{need.note.long}</b>{lang === 'en' && <div className="muted">{need.note.en}</div>}</div>
    <canvas ref={cv} aria-label={t('d4Preview')} />
    <div className="opt-row" role="group" aria-label={t('shape')}>{SHAPES.map(s => <button key={s.id} className={d.shape === s.id ? 'on' : ''} onClick={() => set('shape', s.id)}>{s.id === 'classic' && <Art n="hat" size={18} />} {L(s)}</button>)}</div>
    <div className="opt-row" role="group" aria-label={t('fabric')}>{FABRICS.map(s => <button key={s.id} className={d.fabric === s.id ? 'on' : ''} onClick={() => set('fabric', s.id)}>{L(s)}</button>)}
      {book && <button className={d.fabric === 'book' ? 'on' : ''} onClick={() => set('fabric', 'book')}><Art n="crayon" size={18} /> {t('myBookColours')}</button>}</div>
    <div className="opt-row" role="group" aria-label={t('colour')}>{COLOURS.map(col => <button key={col} className={'sw' + (d.colour === col ? ' on' : '')} style={{ background: col }} aria-label={col} onClick={() => set('colour', col)} />)}</div>
    <div className="opt-row" role="group" aria-label={t('decoration')}>{DECOS.map(s => <button key={s.id} className={d.deco === s.id ? 'on' : ''} onClick={() => set('deco', s.id)}><Art n={s.icon} size={20} /> {L(s)}</button>)}</div>
    {tryon && <p className={'desc'}>{tryon.result === 'fit' ? (d.deco === need.deco ? t(gk('d4Taste', c, lang), { c: L(c.name) }) : t(gk('d4Fit', c, lang), { c: L(c.name), d: L(DECOS.find(x => x.id === need.deco)) })) : tryon.result === 'old' ? L(need.fail) : t('d4Wrong')}</p>}
    <div className="row">
      <button className="btn big sea" onClick={tryOn}><Art n="mirror" size={24} /> {t('tryOn')}</button>
      {tryon?.result === 'fit' && <button className="btn big" onClick={accept}><Icon n="check" /> {t('d4Give')}</button>}
    </div>
  </div>;
}
