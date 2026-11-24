import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useI18n } from '../lib/i18n';
import { playSong, sfx, stopSong, SONG } from '../lib/audio';
import { say } from '../lib/speech';
import { CloseX, Icon, Sheet } from '../components/ui';
import { M, makeIbis, makeLulua } from './world';
import { BANDS, READ, PEARL_SVG } from './content';
import Rhythm from './Rhythm';

export default function Space({ tab: tab0 = 'music', state, child, books, lastReading, onClose, onVideo }) {
  const { t, L, lang } = useI18n();
  const [tab, setTab] = useState(tab0);
  useEffect(() => () => stopSong(), []);
  const tabs = [['music', 'music'], ['videos', 'film'], ['characters', 'cube'], ['readingCorner', 'book']];
  return (
    <Sheet size="tall"><div className="stack">
      <div className="between"><div><div className="eyebrow">{t('spaceOf', { n: child.name })}</div><h2>{t('myspace')}</h2></div><CloseX onClick={onClose} label={t('close')} /></div>
      <div className="tabs" role="tablist">{tabs.map(([k, i]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => { stopSong(); setTab(k); }}><Icon n={i} />{t(k)}</button>)}</div>
      {tab === 'music' && <Music has={state.songs?.includes('tryagain')} band={child.band} books={books} />}
      {tab === 'videos' && <div className="list">
        <VideoItem title={t('introVideo')} ok={state.unlocked.includes('pearl')} col="#1a8fe0" onWatch={() => onVideo('teaser', 'pearl')} />
        <VideoItem title={t('myEnding')} ok={!!state.quest?.pearl?.done} col="#7b4fd6" onWatch={() => onVideo('ending')} sub={!state.quest?.pearl?.done ? t('finishToUnlock') : ''} />
        {books.filter(b => b.id !== 'pearl').map(b => <VideoItem key={b.id} title={L(b.name)} ok col="#e8622c" sub={t('watchTeaser')} onWatch={() => onVideo('teaser', b.id)} />)}
      </div>}
      {tab === 'characters' && <Characters collected={state.collect || ['ibis']} />}
      {tab === 'readingCorner' && <Corner reading={lastReading} band={child.band} lang={lang} />}
    </div></Sheet>
  );
}

function VideoItem({ title, sub, ok, col, onWatch }) {
  const { t } = useI18n();
  return <div className={'item' + (ok ? '' : ' locked')}><div className="ic" style={{ background: ok ? col : '#b7c4cf' }}><Icon n="film" /></div><div className="tx"><b>{title}</b>{sub && <small>{sub}</small>}</div>
    {ok ? <button className="btn sm ghost" onClick={onWatch}><Icon n="play" />{t('watch')}</button> : <Icon n="lock" />}</div>;
}

function Music({ has, band, books }) {
  const { t, L, lang } = useI18n();
  const [playing, setPlaying] = useState(false); const [line, setLine] = useState(-1); const [rhythm, setRhythm] = useState(false);
  const toggle = () => {
    if (playing) { stopSong(); setPlaying(false); return; }
    setPlaying(true);
    playSong({ loops: 2, bpm: 100, onBeat: b => { if (b < 0) { setPlaying(false); setLine(-1); return; } const bb = b % 32; setLine(SONG.lyrics.reduce((a, l, i) => (bb >= l.at ? i : a), 0)); } });
  };
  if (rhythm) return <Rhythm bpm={BANDS[band].bpm} beats={32} little={band === 'little'} eyebrow={t('rhythmMode')} title={t('song')} doneLabel={t('done')} onDone={() => setRhythm(false)} />;
  return <div className="stack">
    <div className={'item' + (has ? '' : ' locked')}><div className="ic" style={{ background: '#7b4fd6' }}><Icon n="music" /></div><div className="tx"><b>{t('song')}</b><small>{has ? L(books.find(b => b.id === 'pearl')?.name) : t('finishToUnlock')}</small></div>
      {has ? <button className="btn sm plum" onClick={toggle}><Icon n={playing ? 'pause' : 'play'} />{playing ? t('stop') : t('play')}</button> : <Icon n="lock" />}</div>
    {has && <>
      <div className="lyrics">{SONG.lyrics.map((l, i) => <div key={i} className={i === line ? 'on' : ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}>{lang === 'ar' ? l.ar : l.en}</div>)}</div>
      <div className="row"><button className="btn ghost" onClick={() => { stopSong(); setPlaying(false); setRhythm(true); }}><Icon n="hand" />{t('rhythmMode')}</button></div>
    </>}
    {books.filter(b => b.id !== 'pearl').map(b => <div key={b.id} className="item locked"><div className="ic" style={{ background: '#b7c4cf' }}><Icon n="music" /></div><div className="tx"><b>{t('jingle', { w: L(b.name) })}</b><small>{t('getBook')}</small></div><Icon n="lock" /></div>)}
  </div>;
}

function Characters({ collected }) {
  const { t, lang } = useI18n();
  const cv = useRef(null); const api = useRef(null);
  const chars = [['ibis', lang === 'ar' ? 'أبو منجل' : 'Ibis', '#fdfbf5', true], ['lulua', lang === 'ar' ? 'لؤلؤة' : "Lu'lu'a", '#ffe9f1', collected.includes('lulua')], ['stork', lang === 'ar' ? 'بابا لقلق' : 'Baba Stork', '#eef1f6', false], ['afra', lang === 'ar' ? 'عفرا' : 'Afra', '#d9a460', false], ['chick', lang === 'ar' ? 'الكتكوت' : 'The chick', '#ffd84a', false]];
  const [sel, setSel] = useState(collected.includes('lulua') ? 'lulua' : 'ibis');
  useEffect(() => {
    const c = cv.current; const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true }); r.outputColorSpace = THREE.LinearSRGBColorSpace; r.useLegacyLights = true; r.setPixelRatio(Math.min(devicePixelRatio, 2));
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#ffffff', '#ffd59a', 1)); const dl = new THREE.DirectionalLight('#ffffff', 0.6); dl.position.set(3, 6, 4); sc.add(dl);
    const cam = new THREE.PerspectiveCamera(35, 2, 0.1, 50); cam.position.set(0, 2.2, 6); cam.lookAt(0, 1.1, 0);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.4, 10), M(sel === 'lulua' ? '#ff9fb3' : '#F7B500')); ped.position.y = -0.2; sc.add(ped);
    let model; if (sel === 'ibis') model = makeIbis(); else { model = new THREE.Group(); const l = makeLulua(); l.scale.setScalar(1.6); l.position.y = 1.1; model.add(l); }
    sc.add(model);
    let alive = true, rot = 0.3, drag = null, hopT = -1, tt = 0;
    const fit = () => { const w = c.clientWidth || 300, h = c.clientHeight || 240; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }; fit();
    c.onpointerdown = e => { drag = { x: e.clientX, r: rot }; c.setPointerCapture(e.pointerId); }; c.onpointermove = e => { if (drag) rot = drag.r + (e.clientX - drag.x) * 0.01; }; c.onpointerup = () => { drag = null; };
    const tick = () => { if (!alive) return; tt += 1 / 60; if (!drag) rot += 0.006; model.rotation.y = rot; if (hopT >= 0) { hopT += 1 / 60; model.position.y = Math.sin(Math.min(1, hopT / 0.5) * Math.PI) * 0.8; if (hopT > 0.5) { hopT = -1; model.position.y = 0; } } model.userData.wings?.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * Math.sin(tt * 5) * 0.4; }); r.render(sc, cam); requestAnimationFrame(tick); };
    tick();
    api.current = { hop() { if (hopT < 0) { hopT = 0; sfx('bub'); } } };
    return () => { alive = false; r.dispose(); };
  }, [sel]);
  return <div className="stack">
    <canvas ref={cv} className="gallery" aria-label={t('characters')} />
    <div className="row"><button className="btn ghost" onClick={() => api.current?.hop()}>{t('makeHop')}</button><span className="small muted">{t('dragSpin')}</span></div>
    <div className="chars">{chars.map(([id, nm, col, ok]) => <button key={id} className={'chr' + (sel === id ? ' on' : '')} disabled={!ok} onClick={() => setSel(id)}>
      <span className="sil" style={{ background: ok ? col : '#d9e0e6' }}>{ok ? (id === 'lulua' ? <span dangerouslySetInnerHTML={{ __html: PEARL_SVG }} /> : '🐦') : <Icon n="lock" />}</span>{nm}{!ok && <small className="muted">{t('getBook')}</small>}</button>)}</div>
  </div>;
}

function Corner({ reading, band, lang }) {
  const { t } = useI18n();
  const Rd = READ[band];
  if (!reading) return <p className="muted">{t('readingEmpty')}</p>;
  return <div className="stack">
    <div className="kpis"><div className="kpi green"><b>{reading.accuracy}%</b><small>{t('accuracy')}</small></div><div className="kpi blue"><b>{reading.words}</b><small>{t('wordsRead')}</small></div><div className="kpi gold"><b>{reading.hard.length}</b><small>{t('practised')}</small></div></div>
    {!!reading.hard.length && <><div className="eyebrow">{t('tapWordHear')}</div><div className="chips">{reading.hard.map(w => <button key={w.ar} lang="ar" style={{ fontFamily: 'var(--f-display)', fontSize: 18 }} onClick={() => say(w.ar, 'ar')}>{w.ar}{lang === 'en' && w.en ? ' · ' + w.en : ''}</button>)}</div></>}
    <div className="item"><div className="tx"><b className="ar" lang="ar" dir="rtl" style={{ textAlign: 'right', fontSize: 20 }}>{Rd.words}</b>{lang === 'en' && <small>{Rd.en}</small>}</div><button className="btn sm ghost" aria-label="Listen" onClick={() => say(Rd.words, 'ar')}><Icon n="speaker" /></button></div>
  </div>;
}
