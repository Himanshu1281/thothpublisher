// The 3D stage for Zizoun's Hat Town and the small pieces of UI around it.
// One HatTown (three.js) lives for the whole quest; each moment of the story declares what the
// town should show (<Set3D …/>), so the camera travels from place to place like one continuous world.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { hush, say } from '../../lib/speech';
import { HatTown } from './town3d';
import { portrait } from './chars3d';
import { PAGE, DAYS } from './content';
import { Art } from '../../components/Art';
import { Icon } from '../../components/ui';

const TownCtx = createContext(null);
export const useTown = () => useContext(TownCtx);

export function HatStage({ children }) {
  const cv = useRef(null); const [town, setTown] = useState(null);
  useEffect(() => { const t = new HatTown(cv.current); setTown(t); if (import.meta.env.DEV) window.__town = t; return () => t.dispose(); }, []);
  return <TownCtx.Provider value={town}>
    <canvas ref={cv} className="town3d" aria-label="Zizoun's Hat Town" />
    {town && children}
  </TownCtx.Provider>;
}

/** Declare what the town shows right now (place, cast, camera, lights…). */
export function Set3D(spec) {
  const town = useTown(); const key = JSON.stringify(spec);
  useEffect(() => { town?.show(spec); }, [town, key]); // eslint-disable-line
  return null;
}

/** A short 3D "video": each shot moves the camera to a moment in the town, with a spoken caption. */
export function Story({ shots, tag, onDone }) {
  const { t, lang } = useI18n(); const town = useTown();
  const [i, setI] = useState(0); const done = useRef(false);
  // no side panel during a story: centre the shots
  useEffect(() => { if (!town) return; town.panel = false; town.resize(); return () => { town.panel = true; town.resize(); }; }, [town]);
  const finish = () => { if (done.current) return; done.current = true; hush(); onDone(); };
  useEffect(() => {
    const sh = shots[i]; if (!sh) { finish(); return; }
    town?.show({ camDur: 2.2, ...sh.set }); sh.sfx?.(town); if (sh.cap) say(sh.cap, lang);
    const tm = setTimeout(() => setI(x => x + 1), (sh.dur || 4) * 1000);
    return () => clearTimeout(tm);
  }, [i]); // eslint-disable-line
  const sh = shots[Math.min(i, shots.length - 1)];
  return <div className="cine hstory">
    <div className="bar t" /><div className="bar b" />
    {tag && <div className="tag2">{tag}</div>}
    <div className="cap" key={'c' + i}>{sh.cap}</div>
    <button className="btn sm ghost skip" onClick={finish}>{t('skip')}</button>
  </div>;
}

export function BookPage({ p, alt = '', className = '' }) {
  return <figure className={'bookpage ' + className}><img src={PAGE(p)} alt={alt} loading="lazy" /></figure>;
}

/** The 7-day countdown to the reopening. */
export function Calendar({ done = [], current }) {
  const { t, L } = useI18n();
  const left = 7 - done.length;
  return <div className="hcal" role="list" aria-label={t('hatWeek')}>
    {DAYS.map(d => <div key={d.q} role="listitem" className={'hday' + (done.includes(d.q) ? ' done' : '') + (d.q === current ? ' on' : '')} title={L(d.title)}>
      <small>{t('dayN', { n: d.q })}</small><b>{done.includes(d.q) ? <Icon n="check" /> : <Art n={d.icon} size={22} />}</b></div>)}
    <div className="hleft">{left ? t('daysLeft', { n: left }) : t('openToday')}</div>
  </div>;
}

/** Round portrait of a 3D character (rendered from the same model as the town). */
export const Face = ({ id, bg = '#fff3c4', size = 56, full }) => <span className="hface" style={{ width: size, height: size, background: bg }}><img src={portrait(id, { full })} alt="" /></span>;
export const charImg = (id, full = true) => portrait(id, { full });
