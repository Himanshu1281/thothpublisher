import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { playSong, sfx, stopSong } from '../lib/audio';
import { say } from '../lib/speech';
import { CloseX, Icon, Sheet } from '../components/ui';
import * as THREE from 'three';
import { HAT_SONG, CAST, SPEECH } from './hat/content';
import { Character, portrait } from './hat/chars3d';
import { swirlTree } from './hat/town3d';

export default function Space({ tab: tab0 = 'music', state, child, books, lastReading, onClose, onVideo }) {
  const { t, L } = useI18n();
  const [tab, setTab] = useState(tab0);
  useEffect(() => () => stopSong(), []);
  const hatDone = state.quest?.hat?.done || [];
  const tabs = [['music', 'music'], ['videos', 'film'], ['characters', 'cube'], ['readingCorner', 'book']];
  return (
    <Sheet size="tall"><div className="stack">
      <div className="between"><div><div className="eyebrow">{t('spaceOf', { n: child.name })}</div><h2>{t('myspace')}</h2></div><CloseX onClick={onClose} label={t('close')} /></div>
      <div className="tabs" role="tablist">{tabs.map(([k, i]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => { stopSong(); setTab(k); }}><Icon n={i} />{t(k)}</button>)}</div>
      {tab === 'music' && <Music has={state.songs?.includes('hatjingle')} books={books} />}
      {tab === 'videos' && <div className="list">
        <VideoItem title={t('hatIntroVideo')} ok={state.unlocked.includes('hat')} col="#7a3a6b" onWatch={() => onVideo('teaser', 'hat')} sub={!state.unlocked.includes('hat') ? t('unlockHint') : ''} />
        <VideoItem title={t('myReopening')} ok={hatDone.length >= 7} col="#e3a81b" onWatch={() => onVideo('ending')} sub={hatDone.length < 7 ? t('finishHatToUnlock') : ''} />
        {books.filter(b => b.id !== 'hat' && !b.locked).map(b => <VideoItem key={b.id} title={L(b.name)} ok col="#e8622c" sub={t('watchTeaser')} onWatch={() => onVideo('teaser', b.id)} />)}
      </div>}
      {tab === 'characters' && <Characters collected={state.collect || ['ibis']} />}
      {tab === 'readingCorner' && <Corner reading={lastReading} band={child.band} />}
    </div></Sheet>
  );
}

function VideoItem({ title, sub, ok, col, onWatch }) {
  const { t } = useI18n();
  return <div className={'item' + (ok ? '' : ' locked')}><div className="ic" style={{ background: ok ? col : '#b7c4cf' }}><Icon n="film" /></div><div className="tx"><b>{title}</b>{sub && <small>{sub}</small>}</div>
    {ok ? <button className="btn sm ghost" onClick={onWatch}><Icon n="play" />{t('watch')}</button> : <Icon n="lock" />}</div>;
}

function Music({ has, books }) {
  const { t, L, lang } = useI18n();
  const [playing, setPlaying] = useState(false); const [line, setLine] = useState(-1);
  const toggle = () => {
    if (playing) { stopSong(); setPlaying(false); return; }
    setPlaying(true);
    playSong({ song: HAT_SONG, loops: 2, bpm: 100, onBeat: b => { if (b < 0) { setPlaying(false); setLine(-1); return; } const bb = b % 32; setLine(HAT_SONG.lyrics.reduce((a, l, i) => (bb >= l.at ? i : a), 0)); } });
  };
  return <div className="stack">
    <div className={'item' + (has ? '' : ' locked')}><div className="ic" style={{ background: '#7a3a6b' }}><Icon n="music" /></div><div className="tx"><b>{t('hatSong')}</b><small>{has ? L(books.find(b => b.id === 'hat')?.name) : t('finishDay6')}</small></div>
      {has ? <button className="btn sm plum" onClick={toggle}><Icon n={playing ? 'pause' : 'play'} />{playing ? t('stop') : t('play')}</button> : <Icon n="lock" />}</div>
    {has && <div className="lyrics" style={{ background: '#5a2a4f' }}>{HAT_SONG.lyrics.map((l, i) => <div key={i} className={i === line ? 'on' : ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}>{lang === 'ar' ? l.ar : l.en}</div>)}</div>}
    {books.filter(b => b.id !== 'hat').map(b => <div key={b.id} className="item locked"><div className="ic" style={{ background: '#b7c4cf' }}><Icon n="music" /></div><div className="tx"><b>{t('jingle', { w: L(b.name) })}</b><small>{b.locked ? t('worldLocked') : t('getBook')}</small></div><Icon n="lock" /></div>)}
  </div>;
}

function Characters({ collected }) {
  const { t, L } = useI18n();
  const cast = CAST.map(c => ({ ...c, ok: collected.includes(c.id) }));
  const [sel, setSel] = useState(cast.find(c => c.ok)?.id || null);
  const cv = useRef(null); const api = useRef(null);
  useEffect(() => {
    if (!sel) return;
    const c = cv.current; const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true }); r.outputColorSpace = THREE.LinearSRGBColorSpace; r.useLegacyLights = true; r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.shadowMap.enabled = true;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff1f4', '#c48a9a', 1)); const dl = new THREE.DirectionalLight('#fff0d8', 0.7); dl.position.set(3, 6, 4); dl.castShadow = true; sc.add(dl);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.3, 24), new THREE.MeshPhongMaterial({ color: '#c98fb0', flatShading: true })); ped.position.y = -0.15; ped.receiveShadow = true; sc.add(ped);
    const tree = swirlTree(0.55); tree.position.set(-2.2, -0.1, -1.6); sc.add(tree);
    const ch = new Character(sel); sc.add(ch.root);
    const cam = new THREE.PerspectiveCamera(32, 2, 0.1, 50); const look = ch.top * 0.5; cam.position.set(0, look + 0.6, ch.top * 2.1 + 1); cam.lookAt(0, look, 0);
    let alive = true, rot = 0.3, drag = null, last = performance.now();
    const fit = () => { const w = c.clientWidth || 300, h = c.clientHeight || 260; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }; fit();
    c.onpointerdown = e => { drag = { x: e.clientX, r: rot }; c.setPointerCapture(e.pointerId); }; c.onpointermove = e => { if (drag) rot = drag.r + (e.clientX - drag.x) * 0.012; }; c.onpointerup = () => { drag = null; };
    const tick = now => { if (!alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!drag) rot += dt * 0.35; ch.face = rot; ch.root.rotation.y = rot; ch.update(dt); r.render(sc, cam); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    api.current = { dance() { ch.anim = 'dance'; setTimeout(() => { ch.anim = 'idle'; }, 2500); } };
    return () => { alive = false; r.dispose(); };
  }, [sel]);
  const cur = cast.find(c => c.id === sel && c.ok);
  return <div className="stack">
    {cur ? <canvas ref={cv} className="gallery" aria-label={L(cur.name)} /> : <p className="muted">{t('charsEmpty')}</p>}
    {cur && <div className="row"><button className="btn ghost" onClick={() => { api.current?.dance(); sfx('boing'); say(cur.name.ar, 'ar'); }}>{t('makeDance')}</button><b>{L(cur.name)}</b><span className="small muted">{t('dragSpin')}</span></div>}
    <div className="chars">{cast.map(c => <button key={c.id} className={'chr' + (sel === c.id ? ' on' : '')} disabled={!c.ok} onClick={() => setSel(c.id)}>
      <span className="sil" style={{ background: c.ok ? c.bg : '#d9e0e6', overflow: 'hidden' }}>{c.ok ? <img src={portrait(c.id)} alt="" style={{ width: '100%', height: '100%' }} /> : <Icon n="lock" />}</span>{L(c.name)}{!c.ok && <small className="muted">{t('finishHatToUnlock')}</small>}</button>)}</div>
  </div>;
}

function Corner({ reading, band }) {
  const { t, lang } = useI18n();
  const lines = SPEECH[band] || SPEECH.early;
  return <div className="stack">
    {reading ? <>
      <div className="kpis"><div className="kpi green"><b>{reading.accuracy}%</b><small>{t('accuracy')}</small></div><div className="kpi blue"><b>{reading.words}</b><small>{t('wordsRead')}</small></div><div className="kpi gold"><b>{reading.hard?.length || 0}</b><small>{t('practised')}</small></div></div>
      {!!reading.hard?.length && <><div className="eyebrow">{t('tapWordHear')}</div><div className="chips">{reading.hard.map(w => <button key={w.ar} lang="ar" style={{ fontFamily: 'var(--f-display)', fontSize: 18 }} onClick={() => say(w.ar, 'ar')}>{w.ar}{lang === 'en' && w.en ? ' · ' + w.en : ''}</button>)}</div></>}
    </> : <p className="muted">{t('readingEmpty')}</p>}
    <div className="eyebrow">{t('saidSpeech')}</div>
    {lines.map((l, i) => <div key={i} className="item"><div className="tx"><b className="ar" lang="ar" dir="rtl" style={{ textAlign: 'right', fontSize: 19 }}>{l.ar}</b>{lang === 'en' && <small>{l.en}</small>}</div>
      <button className="btn sm ghost" aria-label={t('hearIt')} onClick={() => say(l.ar, 'ar')}><Icon n="speaker" /></button></div>)}
  </div>;
}
