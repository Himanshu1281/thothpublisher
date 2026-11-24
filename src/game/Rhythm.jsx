import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { ac, audioNow, bubble, playSong, stopSong, SONG } from '../lib/audio';
import { Icon, Stars } from '../components/ui';
import { clamp } from './world';

export default function Rhythm({ bpm, beats = 16, little, eyebrow, title, sub, doneLabel, onDone }) {
  const { t, lang } = useI18n();
  const cvRef = useRef(null), st = useRef(null);
  const [phase, setPhase] = useState('ready');
  const [lyric, setLyric] = useState(SONG.lyrics[0]);
  const [res, setRes] = useState(null);

  useEffect(() => {
    const spb = 60 / bpm; let on = [], tt = 0;
    for (const [, dd] of SONG.melody) { if (tt >= beats) break; on.push(tt); tt += dd; }
    if (little) on = on.filter(x => x % 2 === 0);
    const notes = on.map(b => ({ b, res: null }));
    const cv = cvRef.current, ctx = cv.getContext('2d'); const dpr = Math.min(devicePixelRatio, 2);
    const fit = () => { const r = cv.getBoundingClientRect(); cv.width = Math.max(300, r.width * dpr); cv.height = 150 * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }; fit();
    const S = st.current = { notes, t0: 0, running: false, perfect: 0, good: 0, flashT: 0, flash: '', fill: 0, spb };
    const hitX = 64, speed = 170; let raf;
    const draw = () => {
      const now = audioNow(), cb = S.running ? (now - S.t0) / spb : -2, w = cv.width / dpr;
      ctx.fillStyle = '#0f3b63'; ctx.fillRect(0, 0, w, 150);
      ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(0, 128, w, 22); ctx.fillStyle = '#2fae63'; ctx.fillRect(0, 128, w * S.fill, 22);
      ctx.fillStyle = '#cfefff'; ctx.font = '800 12px Nunito, sans-serif'; ctx.fillText('+' + (S.fill * 4.5).toFixed(1) + 's', 8, 143);
      for (let b = Math.ceil(cb); b < cb + 14; b++) { const x = hitX + (b - cb) * spb * speed; if (x > w) break; ctx.fillStyle = b % 4 === 0 ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.07)'; ctx.fillRect(x - 1, 20, 2, 100); }
      ctx.lineWidth = 5; ctx.strokeStyle = S.flashT > 0 ? '#F7B500' : '#7dffb0'; ctx.beginPath(); ctx.arc(hitX, 68, 28, 0, 7); ctx.stroke();
      for (const n of notes) { if (n.res) continue; const x = hitX + (n.b - cb) * spb * speed; if (x < -30 || x > w + 30) continue; const g = ctx.createRadialGradient(x - 5, 63, 2, x, 68, 18); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(160,230,255,.5)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, 68, 17, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
      if (S.flashT > 0) { ctx.fillStyle = '#F7B500'; ctx.font = '900 20px Nunito, sans-serif'; ctx.fillText(S.flash, hitX + 44, 34); S.flashT -= 1 / 60; }
      if (S.running) for (const n of notes) if (!n.res && now - (S.t0 + n.b * spb) > 0.25) n.res = 'miss';
      raf = requestAnimationFrame(draw);
    };
    draw();
    const key = e => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) S.tap?.(); } };
    addEventListener('keydown', key);
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', key); stopSong(); clearTimeout(S.endTimer); };
  }, [bpm, beats, little]);

  const tap = () => {
    const S = st.current; if (!S.running) return; const now = audioNow(); bubble(now, 0.3);
    let best = null, bd = 9; for (const n of S.notes) { if (n.res) continue; const dd = Math.abs(now - (S.t0 + n.b * S.spb)); if (dd < bd) { bd = dd; best = n; } }
    if (best && bd < 0.24) { best.res = bd < 0.11 ? 'perfect' : 'good'; if (best.res === 'perfect') { S.perfect++; S.flash = t('perfect'); } else { S.good++; S.flash = t('good'); } S.flashT = 0.4; S.fill = clamp((S.perfect + S.good * 0.6) / S.notes.length, 0, 1); }
  };
  if (st.current) st.current.tap = tap;

  const start = () => {
    const S = st.current; if (!ac()) { onDone({ acc: 50 }); return; }
    setPhase('play');
    const ctl = playSong({ bpm, beats, onBeat: b => { if (b < 0) return; const L = [...SONG.lyrics].reverse().find(l => b >= l.at) || SONG.lyrics[0]; setLyric(L); } });
    S.t0 = ctl.t0; S.running = true;
    S.endTimer = setTimeout(() => { S.running = false; stopSong(); const acc = Math.round((S.perfect + S.good * 0.6) / S.notes.length * 100); setRes({ acc, perfect: S.perfect, good: S.good, total: S.notes.length }); setPhase('done'); }, ((beats + 2) * S.spb + 0.3) * 1000);
  };

  return (
    <div className="stack">
      <div className="eyebrow">{eyebrow}</div>
      {phase !== 'done' ? <>
        <h3>{title}</h3>{sub && <p className="small muted">{sub}</p>}
        <canvas ref={cvRef} className="rh" aria-label="Rhythm lane" />
        <div className="lyrics" style={{ fontSize: 17, padding: '10px 14px' }}>{lang === 'ar' ? lyric.ar : lyric.en}</div>
        {phase === 'ready' && <button className="btn big plum" onClick={start}><Icon n="play" />{t('startSong')}</button>}
        {phase === 'play' && <button className="btn big tap" autoFocus onPointerDown={e => { e.preventDefault(); tap(); }}>{t('tapSpace')}</button>}
      </> : <>
        <div className="between"><h2>{res.acc >= 55 ? t('lungsFull') : t('goodTry')}</h2><Stars n={res.acc >= 85 ? 3 : res.acc >= 55 ? 2 : 1} /></div>
        <div className="kpis">
          <div className="kpi blue"><b>{res.acc}%</b><small>{t('onBeat')}</small></div>
          <div className="kpi green"><b>+{(res.acc / 100 * 4.5).toFixed(1)}s</b><small>{t('extraBreath')}</small></div>
          <div className="kpi gold"><b>{res.perfect}</b><small>{t('perfectTaps')}</small></div>
        </div>
        <button className="btn big" onClick={() => onDone(res)}>{doneLabel}</button>
      </>}
    </div>
  );
}
