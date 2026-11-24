import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { ac, sfx, stopSong } from '../lib/audio';
import { hush, say, speechState } from '../lib/speech';
import { World } from '../game/world';
import Quest, { cleanupQuest } from '../game/Quest';
import Space from '../game/Space';
import { ScanFrame } from '../game/Scanner';
import { qrSvg } from '../game/content';
import { CloseX, FxLayer, Icon, Loader, Modal, Sheet, Stars, confetti, toast } from '../components/ui';
import { LangToggle, ThothAvatar, ZrythMark } from '../components/Brand';
import { Face } from './Kids';

export default function Play() {
  const { child } = useAuth();
  if (!child) return <Navigate to="/kids" replace />;
  return <Game child={child} />;
}

function Game({ child }) {
  const { t, L, lang } = useI18n();
  const nav = useNavigate();
  const canvas = useRef(null); const world = useRef(null);
  const [books, setBooks] = useState(null);
  const [st, setSt] = useState(null);
  const [lastReading, setLastReading] = useState(null);
  const [mode, setMode] = useState({ type: 'map' });
  const [bubble, setBubble] = useState(null);
  const [cineUI, setCineUI] = useState(null);
  const [modal, setModal] = useState(null);
  const [, setTick] = useState(0);
  const cineCtl = useRef(null); const abortRef = useRef(null); const bubbleTm = useRef(null);

  /* load */
  useEffect(() => {
    Promise.all([api('/books'), api(`/children/${child.id}/state`), api(`/children/${child.id}/runs`)]).then(([b, s, runs]) => {
      setBooks(b); setSt(s); speechState.on = s.voiceOn !== false;
      setLastReading(runs.find(r => r.reading)?.reading || null);
    }).catch(() => nav('/kids'));
  }, [child.id]); // eslint-disable-line

  /* world */
  useEffect(() => {
    if (!books || !canvas.current) return;
    const w = world.current = new World(canvas.current, books, { onPick: p => window.__thothPick?.(p) });
    setTick(x => x + 1);
    return () => { w.dispose(); world.current = null; };
  }, [books]);
  useEffect(() => { if (world.current && st) world.current.setMist(st.unlocked, mode.type === 'quest'); }, [st, mode]);
  useEffect(() => { world.current?.setMode(mode.type === 'quest' ? { type: 'pearl' } : mode.type === 'focus' ? { type: 'focus', id: mode.id } : mode.type === 'space' ? { type: 'focus', id: 'home' } : { type: 'map' }); }, [mode]);

  /* tell the user once when the device can't speak a language, instead of staying silent */
  useEffect(() => {
    const warned = new Set();
    const h = e => { if (warned.has(e.detail)) return; warned.add(e.detail); toast(t(e.detail === 'ar' ? 'noArVoice' : 'noEnVoice')); };
    addEventListener('thoth-novoice', h); return () => removeEventListener('thoth-novoice', h);
  }, [t]);

  /* play-time tracking */
  useEffect(() => {
    const iv = setInterval(() => { if (document.visibilityState === 'visible') api(`/children/${child.id}/time`, { method: 'POST', body: { sec: 30 } }).catch(() => {}); }, 30000);
    return () => clearInterval(iv);
  }, [child.id]);

  const guide = useCallback((text, ms = 0, speak = false) => {
    clearTimeout(bubbleTm.current);
    if (!text) { setBubble(null); return; }
    setBubble(text); if (ms) bubbleTm.current = setTimeout(() => setBubble(null), ms);
    if (speak) say(text, lang);
  }, [lang]);
  const persist = async patch => { const s = await api(`/children/${child.id}/state`, { method: 'PUT', body: patch }); setSt(s); return s; };

  const cine = useCallback(async (shots, { tag, badge } = {}) => {
    const ctl = cineCtl.current = { skipped: false };
    setCineUI({ tag, badge, cap: '' }); setBubble(null);
    await world.current.playCine(shots, ctl, sh => { setCineUI(c => ({ ...c, cap: sh.cap || '' })); if (sh.cap) say(sh.cap, lang); });
    hush(); setCineUI(null); cineCtl.current = null;
  }, [lang]);

  /* greet */
  useEffect(() => {
    if (!st || !world.current) return;
    const first = !st.unlocked.length && !st.quest?.pearl;
    guide(first ? t('hiIbis', { n: child.name }) : t('welcomeBack', { n: child.name }), 6000, first);
  }, [!!st, !!world.current]); // eslint-disable-line

  const busy = () => { if (mode.type === 'quest' || cineUI) { toast(t('finishFirst')); return true; } return false; };
  const openWorld = id => { if (mode.type === 'quest' || cineUI) return; ac(); sfx('pop'); setMode({ type: 'focus', id }); };
  window.__thothPick = p => { if (p.home) { if (!busy()) setMode({ type: 'space' }); } else if (p.world) openWorld(p.world); };

  const teaser = async id => {
    const b = books.find(x => x.id === id); const g = world.current.islands[id]; if (!g) return; const p = g.position; const portrait = innerWidth / innerHeight < 0.9;
    const caps = L(b.teaser) || [];
    const shots = caps.map((c, i) => { const a0 = i * 1.1 - 0.6, a1 = a0 + 1.1, r = portrait ? 26 : 20; return { cap: c, dur: 3.4, from: [p.x + Math.sin(a0) * r, 7 + i * 2, p.z + Math.cos(a0) * r], to: [p.x + Math.sin(a1) * r, 8 + i * 2, p.z + Math.cos(a1) * r], fromLook: [p.x, 1.5, p.z], look: [p.x, 1.5, p.z] }; });
    shots.push({ cap: st.unlocked.includes(id) ? '' : t('unlockHint'), dur: 2.4, to: [p.x, 22, p.z + 26], look: [p.x, 0, p.z] });
    const prev = mode; setMode({ type: 'cine' });
    await cine(shots, { tag: L(b.name) }); setMode(prev.type === 'space' ? prev : { type: 'focus', id });
  };
  const replayEnding = async () => {
    const w = world.current, u = w.P.userData, rel = w.rel.bind(w), n = st.quest?.pearl?.attempts || 1;
    setMode({ type: 'cine' });
    await cine([
      { cap: t('end1'), dur: 3.2, from: rel(3, 2.4, 5), fromLook: rel(0, 1, 0), to: rel(2.5, 3, 5.5), look: rel(0, 1.5, 0), update: p => { u.pearl.userData.free = true; u.lid.rotation.x = -0.25 - p * 0.85; u.glow.intensity = p * 1.2; u.pearl.position.y = 1.05 + p * 0.8; } },
      { cap: t('end2'), dur: 3.6, to: rel(0, 7, 12), look: rel(0, 5, 0), start: () => w.goldenSky(), update: p => { u.pearl.position.y = 1.85 + p * 4.2; u.pearl.rotation.y = p * Math.PI * 2; } },
      { cap: t('end4'), dur: 3, to: rel(0, 10, 20), look: rel(0, 4, 0) },
    ], { tag: t('myEnding'), badge: t('endBadge', { n }) });
    w.resetPearl(); setMode({ type: 'space' });
  };

  const redeem = async code => {
    const r = await api(`/children/${child.id}/redeem`, { method: 'POST', body: { code } });
    setModal(null); setSt(r.state); setMode({ type: 'focus', id: r.bookId }); sfx('chime');
    await world.current.revealIsland(r.bookId); confetti();
    const b = books.find(x => x.id === r.bookId); guide(t('worldOpen', { w: L(b?.name) }), 6000, true);
  };

  const startQuest = () => { ac(); world.current.resetPearl(); setMode({ type: 'quest' }); };
  const finishQuest = async (run) => {
    const prev = st.quest?.pearl; const stars = Math.max(run.stars, prev?.stars || 0);
    const gained = Math.max(0, run.stars - (prev?.stars || 0));
    await api(`/children/${child.id}/runs`, { method: 'POST', body: { world: 'pearl', band: child.band, completed: true, dives: run.dives, reading: run.reading, hints: run.hints, rhythm: run.rhythm.length ? Math.round(run.rhythm.reduce((a, b) => a + b, 0) / run.rhythm.length) : null, stone: run.stone, voice: run.voice, lastChange: run.lastChange, durationSec: run.durationSec, stars: run.stars } });
    await persist({ quest: { ...st.quest, pearl: { done: true, stars, attempts: run.dives.length } }, stars: (st.stars || 0) + gained, songs: [...new Set([...(st.songs || []), 'tryagain'])], collect: [...new Set([...(st.collect || []), 'lulua'])] });
    if (run.reading) setLastReading(run.reading);
  };
  const exitQuest = async (completed, toSpace) => {
    if (!completed && abortRef.current) {
      const R = abortRef.current();
      api(`/children/${child.id}/runs`, { method: 'POST', body: { world: 'pearl', band: child.band, completed: false, dives: R.dives, reading: R.reading, hints: R.hints, durationSec: Math.round((Date.now() - R.startedAt) / 1000) } }).catch(() => {});
    }
    cleanupQuest(world.current); abortRef.current = null; setModal(null); guide('');
    setMode(toSpace ? { type: 'space', tab: toSpace } : { type: 'map' });
  };

  if (!books || !st) return <><canvas ref={canvas} className="stage" /><Loader /></>;
  const focus = mode.type === 'focus' ? books.find(b => b.id === mode.id) : null;
  const showLabels = mode.type === 'map' || mode.type === 'focus';
  const toggleVoice = () => { const on = !(st.voiceOn !== false); speechState.on = on; if (!on) hush(); persist({ voiceOn: on }); };

  return (
    <>
      <canvas ref={canvas} className="stage" aria-label="Story worlds map" />
      <div className="labels" style={{ visibility: showLabels ? 'visible' : 'hidden' }}>
        {world.current && books.map(b => {
          const open = st.unlocked.includes(b.id); const q = st.quest?.[b.id];
          const isNext = b.id === 'chick' && st.quest?.pearl?.done;
          return <button key={b.id} ref={el => world.current?.addLabel(b.id, el, b.id === 'chick' ? 5 : 6.5)}
            className={'ilabel' + (open ? ' open' : '') + ((!open && b.playable && !st.unlocked.length) || isNext ? ' pulse' : '')} onClick={() => openWorld(b.id)}>
            {L(b.name)}
            <small>{open ? (q?.done ? <>{'★'.repeat(q.stars)} {t('playAgain')}</> : <><Icon n="play" /> {t('playQuest')}</>) : <><Icon n="lock" /> {b.playable ? t('scanBook') : isNext ? t('nextBook') : t('getBook')}</>}</small>
          </button>;
        })}
        {world.current && <button ref={el => world.current?.addLabel('home', el, 6.2)} className="ilabel home" onClick={() => !busy() && setMode({ type: 'space' })}>{t('myspace')}<small>🎵 🎬 🐦</small></button>}
      </div>

      {!cineUI && mode.type !== 'cine' && <header className="topbar">
        <span className="brand"><img src="/thoth-logo.jpg" alt="Thoth" /></span>
        <button className="chip kid-chip" onClick={() => !busy() && nav('/kids')} title={t('switchKid')}><Face a={child.avatar} size={28} /><span>{child.name}</span></button>
        <span className="chip gold" title={t('stars')}><Icon n="star" /> {st.stars || 0}</span>
        <span className="spacer" />
        <LangToggle />
        <button className="chip" onClick={toggleVoice} aria-label={st.voiceOn !== false ? t('voiceOn') : t('voiceOff')}><Icon n={st.voiceOn !== false ? 'speaker' : 'mute'} /><span className="t">{st.voiceOn !== false ? t('voiceOn') : t('voiceOff')}</span></button>
        <button className="chip" onClick={() => !busy() && setMode({ type: 'space' })}><Icon n="home" /><span className="t">{t('myspace')}</span></button>
        <button className="chip" onClick={() => !busy() && setModal('gate')}><Icon n="chart" /><span className="t">{t('parents')}</span></button>
      </header>}

      {mode.type === 'quest' && !cineUI && <button className="chip leave" onClick={() => setModal('leave')}><Icon n="x" /><span className="t">{t('leaveQuest')}</span></button>}

      <div className={'guide' + (bubble && !cineUI ? '' : ' hide')} aria-live="polite"><ThothAvatar size={54} /><div className="bub">{bubble}</div></div>

      {focus && <Sheet size="slim"><div className="stack">
        <div className="between"><div>
          <div className="eyebrow">{st.unlocked.includes(focus.id) ? t('bookLinked') : t('bookLabel') + ': ' + L(focus.book)}</div>
          <h2>{L(focus.name)}</h2>
        </div><CloseX onClick={() => setMode({ type: 'map' })} label={t('close')} /></div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {focus.cover && <img src={focus.cover} alt="" style={{ width: 84, borderRadius: 12, border: 'var(--outline)', flex: 'none' }} />}
          <p className="desc" style={{ flex: 1 }}>{L(focus.desc)}</p>
        </div>
        <div className="row"><span className="tag v">{t('valueL')}: {L(focus.value)}</span><span className="tag s">{t('skillL')}: {L(focus.skill)}</span>{st.quest?.[focus.id]?.done && <Stars n={st.quest[focus.id].stars} />}</div>
        {!st.unlocked.includes(focus.id) && <p className="small muted">{focus.playable ? t('unlockHint') : t('comingSoon')}</p>}
        <div className="row">
          {st.unlocked.includes(focus.id)
            ? (focus.playable ? <button className="btn big" onClick={startQuest}><Icon n="play" />{st.quest?.[focus.id]?.done ? t('playAgain') : t('startQuest')}</button> : <span className="tag">{t('comingSoon')}</span>)
            : focus.playable ? <button className="btn big" onClick={() => setModal({ scan: focus.id })}><Icon n="qr" />{t('scanBook')}</button>
              : <button className="btn big" onClick={() => focus.shopUrl ? window.open(focus.shopUrl, '_blank', 'noopener') : toast(t('shopSoon'))}><Icon n="book" />{t('getBook')}</button>}
          <button className="btn ghost" onClick={() => teaser(focus.id)}><Icon n="film" />{st.unlocked.includes(focus.id) ? t('watchIntro') : t('watchTeaser')}</button>
        </div>
      </div></Sheet>}

      {mode.type === 'space' && <Space tab={mode.tab} state={st} child={child} books={books} lastReading={lastReading} onClose={() => { stopSong(); setMode({ type: 'map' }); }}
        onVideo={(k, id) => k === 'teaser' ? teaser(id) : replayEnding()} />}

      {mode.type === 'quest' && world.current && <Quest ctx={{
        world: world.current, book: books.find(b => b.id === 'pearl'), child, guide, cine,
        onComplete: finishQuest, onAbort: exitQuest, registerAbort: fn => { abortRef.current = fn; },
      }} />}

      {cineUI && <div className="cine">
        <div className="bar t" /><div className="bar b" />
        {cineUI.tag && <div className="tag2">{cineUI.tag}</div>}
        {cineUI.badge && <div className="tries">{cineUI.badge}</div>}
        <div className="cap">{cineUI.cap}</div>
        <button className="btn sm ghost skip" onClick={() => { if (cineCtl.current) cineCtl.current.skipped = true; hush(); }}>{t('skip')}</button>
      </div>}

      {modal?.scan && <ScanModal book={books.find(b => b.id === modal.scan)} onClose={() => setModal(null)} onRedeem={redeem} />}
      {modal === 'gate' && <ParentGate onClose={() => setModal(null)} onOpen={() => nav('/parent')} />}
      {modal === 'leave' && <Modal onClose={() => setModal(null)}><div className="stack">
        <h2>{t('leaveTitle')}</h2><p className="muted">{t('leaveBody')}</p>
        <div className="row"><button className="btn" onClick={() => setModal(null)}>{t('stay')}</button><button className="btn ghost" onClick={() => exitQuest(false)}>{t('leave')}</button></div>
      </div></Modal>}
      {mode.type === 'map' && !bubble && <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom,0px) + 10px)', insetInlineStart: 'var(--gl)', zIndex: 5, background: 'rgba(255,255,255,.85)', borderRadius: 14, padding: '4px 10px' }}><ZrythMark small /></div>}
      <FxLayer />
    </>
  );
}

function ScanModal({ book, onClose, onRedeem }) {
  const { t, L } = useI18n();
  const [code, setCode] = useState(''); const [err, setErr] = useState(''); const [cam, setCam] = useState(false); const [hit, setHit] = useState(false);
  const go = async c => {
    setErr('');
    try { setHit(true); await new Promise(r => setTimeout(r, 600)); await onRedeem((c || code).trim().split('/').pop()); }
    catch (e) { setHit(false); sfx('soft'); setErr(t('err_' + e.code) !== 'err_' + e.code ? t('err_' + e.code) : t('err_generic')); }
  };
  return <Modal onClose={onClose}><div className="stack">
    <div className="between"><h2>{t('scanTitle')}</h2><CloseX onClick={onClose} label={t('close')} /></div>
    <ScanFrame camera={cam} hit={hit} msg={hit ? t('bookFound') : L(book.book)} onCode={c => go(c)}>
      {book.cover ? <img className="cover" src={book.cover} alt="" /> : <div className="qr" dangerouslySetInnerHTML={{ __html: qrSvg() }} />}
    </ScanFrame>
    <p className="small muted">{t('scanHelp')}</p>
    <button className="btn ghost" onClick={() => setCam(c => !c)}><Icon n="camera" />{t('useCamera')}</button>
    <div className="field"><label htmlFor="code">{t('codeLabel')}</label><input id="code" type="text" dir="ltr" autoComplete="off" value={code} placeholder="PEARL-XXXXXX" onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} /></div>
    <p className="err" role="alert">{err}</p>
    <div className="row"><button className="btn" onClick={() => go()} disabled={!code.trim()}>{t('unlock')}</button><button className="btn sea" onClick={() => go(book.id.toUpperCase() + '-DEMO')}><Icon n="book" />{t('useDemo')}</button></div>
  </div></Modal>;
}

export function ParentGate({ onClose, onOpen }) {
  const { t } = useI18n();
  const [p, setP] = useState(0); const tm = useRef(null);
  const stop = () => { clearInterval(tm.current); tm.current = null; setP(0); };
  const start = e => { e.preventDefault(); if (tm.current) return; let v = 0; tm.current = setInterval(() => { v += 50; setP(v / 2000); if (v >= 2000) { stop(); onOpen(); } }, 50); };
  useEffect(() => stop, []);
  return <Modal onClose={onClose}><div className="stack" style={{ textAlign: 'center' }}>
    <h2>{t('grownUps')}</h2><p className="muted">{t('holdGate')}</p>
    <button className="gate" aria-label={t('holdGate')} onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && start(e)} onKeyUp={stop}>
      <svg viewBox="0 0 136 136"><circle cx="68" cy="68" r="62" stroke="#e9e4f9" strokeWidth="8" fill="none" /><circle cx="68" cy="68" r="62" stroke="#F7B500" strokeWidth="8" fill="none" strokeDasharray="390" strokeDashoffset={390 * (1 - p)} strokeLinecap="round" /></svg>
      {t('hold')}
    </button>
    <button className="btn ghost" onClick={onClose}>{t('back')}</button>
  </div></Modal>;
}
