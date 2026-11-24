import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { ac, sfx } from '../lib/audio';
import { Icon } from '../components/ui';
import { clamp, lerp } from './world';

/**
 * Canvas pearl-dive mini game. Improvements over the original:
 *  - air-bubble pockets refill breath when you swim through them
 *  - pause button (and auto-pause when the tab is hidden)
 *  - haptic buzz on fail, depth markers in metres
 */
export default function DiveGame({ opts, onDone }) {
  const { t } = useI18n();
  const cvRef = useRef(null), holdRef = useRef(null);
  const [hud, setHud] = useState({ breath: 1, press: 0, depth: 0, tide: null });
  const [msg, setMsg] = useState({ show: true, text: t('dive') + ' ' + opts.attempt, sub: '' });
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const tRef = useRef(t); tRef.current = t;

  useEffect(() => {
    const o = opts, cv = cvRef.current, ctx = cv.getContext('2d'), hold = holdRef.current;
    let W2 = 0, H2 = 0;
    const resize = () => { const dpr = Math.min(devicePixelRatio, 2); W2 = innerWidth; H2 = innerHeight; cv.width = W2 * dpr; cv.height = H2 * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener('resize', resize);
    const ppm = () => H2 / 15; const DEPTH = 100;
    let d = 0, breath = o.breath, press = 0, holding = false, started = false, done = false, tt = 0, against = 0, secs = 0, endT = 0, result = null, pull = null, airGot = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const COLS = ['#ff7b6b', '#ffb347', '#c86bd6', '#ff9ec0', '#5bc6a8'];
    const rocks = []; for (let y = 2; y < DEPTH + 8; y += 2.2) { rocks.push({ side: 0, y, x: rnd(0, 0.1), r: rnd(0.05, 0.1), c: COLS[Math.floor(rnd(0, 5))] }); rocks.push({ side: 1, y: y + 1, x: rnd(0, 0.1), r: rnd(0.05, 0.1), c: COLS[Math.floor(rnd(0, 5))] }); }
    const weeds = []; for (let i = 0; i < 40; i++) weeds.push({ side: i % 2, y: rnd(6, DEPTH + 2), len: rnd(1.2, 3), ph: rnd(0, 6) });
    const fish = []; for (let i = 0; i < 14; i++) fish.push({ y: rnd(5, DEPTH - 4), x: rnd(0, 1), v: rnd(0.03, 0.09) * (Math.random() < 0.5 ? 1 : -1), c: ['#F7B500', '#e8622c', '#7b4fd6', '#ffffff', '#ff9b5b'][i % 5], s: rnd(0.6, 1.1) });
    const airs = [25, 48, 72].map(y => ({ y: y + rnd(-4, 4), got: false }));
    const bubbles = [], streaks = []; for (let i = 0; i < 40; i++) streaks.push({ x: rnd(0, 1), y: rnd(0, 1), l: rnd(0.04, 0.1) });
    const tideIn = () => o.tide && started && ((tt % o.cycle) >= o.cycle / 2);
    const col = (a, b, p) => { const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16)); return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], p))).join(',')})`; };
    const down = () => { if (done || pausedRef.current) return; ac(); holding = true; hold.classList.add('down'); if (!started) { started = true; setMsg(m => ({ ...m, show: false })); sfx('splash'); } };
    const up = () => { holding = false; hold.classList.remove('down'); };
    const pd = e => { e.preventDefault(); hold.setPointerCapture?.(e.pointerId); down(); };
    hold.addEventListener('pointerdown', pd); hold.addEventListener('pointerup', up); hold.addEventListener('pointercancel', up); hold.addEventListener('lostpointercapture', up);
    const cpd = e => { e.preventDefault(); down(); }; cv.addEventListener('pointerdown', cpd); cv.addEventListener('pointerup', up); cv.addEventListener('pointerleave', up);
    const kd = e => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) down(); } if (e.code === 'Escape' || e.code === 'KeyP') togglePause(); };
    const ku = e => { if (e.code === 'Space') { e.preventDefault(); up(); } };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    const togglePause = () => { if (done) return; pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); up(); };
    window.__diveToggle = togglePause;
    const vis = () => { if (document.hidden && !pausedRef.current && started && !done) togglePause(); };
    document.addEventListener('visibilitychange', vis);
    const speed = o.stone ? 20 : 12;
    let lulY = DEPTH - 1.2;
    function finish(ok, reason) {
      if (done) return; done = true; up(); hold.disabled = true; result = { ok, reason, depth: d, secs, against, air: airGot };
      const T = tRef.current;
      if (ok) { setMsg({ show: true, text: T('reached'), sub: '' }); sfx('chime'); endT = 2.2; }
      else { setMsg({ show: true, text: reason === 'pressure' ? T('tooFast') : T('outBreath'), sub: T('ropePull') }); sfx('soft'); try { navigator.vibrate?.([80, 60, 80]); } catch { /* */ } pull = { from: d }; endT = 2.4; }
    }
    let last = performance.now(), raf = 0, alive = true, bubT = 0, hudT = 0;
    function step(now) {
      if (!alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; const sec = now / 1000;
      if (pausedRef.current) { raf = requestAnimationFrame(step); return; }
      if (started && !done) {
        tt += dt; secs += dt; const tin = tideIn();
        if (holding) { if (tin) { d -= 2 * dt; breath -= 2 * dt; against += dt; } else { d += speed * dt; breath -= (o.stone ? 0.8 : 1) * dt; if (o.pressure) press += speed * dt * (o.stone ? 1.0 : 2.1); } }
        else { d -= 1 * dt; breath -= 0.5 * dt; }
        if (o.pressure && !(holding && !tin)) press = Math.max(0, press - 35 * dt);
        d = clamp(d, 0, DEPTH);
        for (const a of airs) if (!a.got && Math.abs(a.y - d) < 1.6) { a.got = true; airGot++; breath = Math.min(o.breath, breath + 2); sfx('air'); }
        if (holding && !tin) { bubT -= dt; if (bubT <= 0) { bubT = 0.12; bubbles.push({ x: W2 / 2 + rnd(-8, 8), y: d, r: rnd(2, 5) }); } }
        if (d >= DEPTH - 0.5) finish(true); else if (breath <= 0) { breath = 0; finish(false, 'breath'); } else if (press >= 100) { press = 100; finish(false, 'pressure'); }
      }
      if (done) { endT -= dt; if (pull) d = Math.max(0, d - pull.from * dt / 1.6); if (result.ok) lulY -= dt * 3; if (endT <= 0) { cleanup(); onDone(result); return; } }
      draw(sec);
      hudT -= dt; if (hudT <= 0) { hudT = 0.08; setHud({ breath: clamp(breath / o.breath, 0, 1), press, depth: Math.round(d / 5), tide: o.tide ? (!started ? 'start' : tideIn() ? 'in' : 'out') : null }); }
      raf = requestAnimationFrame(step);
    }
    function draw(sec) {
      if (!(H2 > 0 && W2 > 0)) { resize(); if (!(H2 > 0)) return; }
      const P = ppm(); const camY = clamp(d * P - H2 * 0.42, -H2 * 0.3, (DEPTH + 3) * P - H2); const y = m => m * P - camY;
      const topP = clamp(camY / (DEPTH * P), 0, 1), botP = clamp((camY + H2) / (DEPTH * P), 0, 1);
      const g = ctx.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, col('#4fd6e8', '#0a2f5c', topP)); g.addColorStop(1, col('#4fd6e8', '#0a2f5c', botP)); ctx.fillStyle = g; ctx.fillRect(0, 0, W2, H2);
      if (y(0) > 0) {
        const sg = ctx.createLinearGradient(0, 0, 0, y(0)); sg.addColorStop(0, '#7fd3f5'); sg.addColorStop(1, '#fff1c9'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W2, y(0));
        ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.arc(W2 * 0.8, y(0) - H2 * 0.12, 28, 0, 7); ctx.fill();
        const bx = W2 / 2 + 60, by = y(0); ctx.fillStyle = '#9c6b43'; ctx.beginPath(); ctx.moveTo(bx - 90, by - 14); ctx.lineTo(bx + 90, by - 22); ctx.lineTo(bx + 60, by + 6); ctx.lineTo(bx - 70, by + 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5d3a22'; ctx.fillRect(bx - 3, by - 110, 5, 96); ctx.fillStyle = '#f6efe0'; ctx.beginPath(); ctx.moveTo(bx, by - 108); ctx.lineTo(bx + 70, by - 30); ctx.lineTo(bx, by - 24); ctx.closePath(); ctx.fill();
      }
      ctx.save(); ctx.globalAlpha = clamp(0.12 - topP * 0.2, 0, 0.12); ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) { const x = W2 * (0.1 + i * 0.2) + Math.sin(sec * 0.3 + i) * 20; ctx.beginPath(); ctx.moveTo(x, y(0)); ctx.lineTo(x + 40, y(0)); ctx.lineTo(x + 140, y(0) + H2 * 1.2); ctx.lineTo(x + 60, y(0) + H2 * 1.2); ctx.closePath(); ctx.fill(); } ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); for (let x = 0; x <= W2; x += 12) { const yy = y(0) + Math.sin(x * 0.03 + sec * 2) * 4; if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); } ctx.lineTo(W2, y(0) + 6); ctx.lineTo(0, y(0) + 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(230,205,160,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W2 / 2 + 60, y(0) - 6); ctx.quadraticCurveTo(W2 / 2 + 30, (y(0) + y(d)) / 2, W2 / 2 + 6, y(d) - 10); ctx.stroke();
      if (tideIn() && !done) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; for (const s of streaks) { s.y -= 0.012; if (s.y < 0) s.y = 1; const sx = s.x * W2, sy = s.y * H2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 8, sy - s.l * H2); ctx.stroke(); } }
      const wallW = W2 * 0.14;
      for (const side of [0, 1]) { ctx.fillStyle = col('#3b6f8e', '#122e4a', botP); ctx.beginPath(); const x0 = side ? W2 : 0; ctx.moveTo(x0, Math.max(0, y(1))); for (let m = 1; m < DEPTH + 12; m += 3) { const yy = y(m); if (yy < -50 || yy > H2 + 50) continue; const ww = wallW * (0.7 + 0.3 * Math.sin(m * 1.7 + side)); ctx.lineTo(side ? W2 - ww : ww, yy); } ctx.lineTo(x0, H2); ctx.closePath(); ctx.fill(); }
      for (const r of rocks) { const yy = y(r.y); if (yy < -60 || yy > H2 + 60) continue; const x = r.side ? W2 - (wallW * 0.85 + r.x * W2 * 0.4) : (wallW * 0.85 + r.x * W2 * 0.4); const R = 8 + r.r * 160; const dir = r.side ? -1 : 1; ctx.fillStyle = r.c; ctx.beginPath(); ctx.ellipse(x, yy, R, R * 0.6, 0, 0, 7); ctx.fill(); ctx.strokeStyle = r.c; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(3, R * 0.28); ctx.beginPath(); for (let k = -1; k <= 1; k++) { ctx.moveTo(x + k * R * 0.4, yy - R * 0.2); ctx.lineTo(x + k * R * 0.7 + dir * R * 0.2, yy - R * 1.2 + Math.abs(k) * R * 0.2); } ctx.stroke(); }
      ctx.lineCap = 'round'; for (const w of weeds) { const yy = y(w.y); if (yy < -120 || yy > H2 + 60) continue; const x = w.side ? W2 - wallW * 0.9 : wallW * 0.9; ctx.strokeStyle = '#3fbf6f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, yy); ctx.quadraticCurveTo(x + Math.sin(sec * 1.5 + w.ph) * 14, yy - w.len * P * 0.5, x + Math.sin(sec * 1.5 + w.ph + 1) * 20, yy - w.len * P); ctx.stroke(); }
      // air pockets
      for (const a of airs) { if (a.got) continue; const yy = y(a.y); if (yy < -40 || yy > H2 + 40) continue; const pulse = 1 + Math.sin(sec * 4) * 0.08; ctx.fillStyle = 'rgba(220,250,255,.35)'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W2 / 2, yy, 22 * pulse, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(W2 / 2 - 7, yy - 7, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#0b5fa8'; ctx.font = '900 13px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('+2s', W2 / 2, yy + 34); ctx.textAlign = 'start'; }
      for (const f of fish) { f.x += f.v * 0.016 * (tideIn() ? 2 : 1); if (f.x > 1.1) f.x = -0.1; if (f.x < -0.1) f.x = 1.1; const yy = y(f.y); if (yy < -30 || yy > H2 + 30) continue; const x = f.x * W2, s = 14 * f.s, dir = Math.sign(f.v); ctx.fillStyle = f.c; ctx.beginPath(); ctx.ellipse(x, yy, s, s * 0.55, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - dir * s * 0.9, yy); ctx.lineTo(x - dir * s * 1.6, yy - s * 0.5); ctx.lineTo(x - dir * s * 1.6, yy + s * 0.5); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#17324d'; ctx.beginPath(); ctx.arc(x + dir * s * 0.45, yy - s * 0.12, 2, 0, 7); ctx.fill(); }
      const by = y(DEPTH + 0.6);
      if (by < H2 + 200) {
        ctx.fillStyle = '#e8c98a'; ctx.beginPath(); ctx.moveTo(0, by + 20); for (let x = 0; x <= W2; x += 40) ctx.lineTo(x, by + Math.sin(x * 0.02) * 10); ctx.lineTo(W2, H2 + 300); ctx.lineTo(0, H2 + 300); ctx.closePath(); ctx.fill();
        const sx = W2 / 2, sy = by - 6, open = result?.ok ? clamp(1 - endT / 2.2, 0, 1) : 0;
        const glow = ctx.createRadialGradient(sx, sy - 20, 4, sx, sy - 20, 90 + Math.sin(sec * 3) * 10); glow.addColorStop(0, 'rgba(255,240,250,.85)'); glow.addColorStop(1, 'rgba(255,240,250,0)'); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sx, sy - 20, 110, 0, 7); ctx.fill();
        ctx.fillStyle = '#ff9fb3'; ctx.beginPath(); ctx.ellipse(sx, sy, 60, 20, 0, 0, Math.PI); ctx.fill();
        const ly = y(lulY); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx, ly, 18, 0, 7); ctx.fill(); ctx.fillStyle = '#17324d'; ctx.beginPath(); ctx.arc(sx - 6, ly - 2, 2.6, 0, 7); ctx.arc(sx + 6, ly - 2, 2.6, 0, 7); ctx.fill(); ctx.fillStyle = '#ffb3c7'; ctx.beginPath(); ctx.ellipse(sx - 11, ly + 5, 3.5, 2, 0, 0, 7); ctx.ellipse(sx + 11, ly + 5, 3.5, 2, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#17324d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, ly + 4, 4, 0.2, Math.PI - 0.2); ctx.stroke();
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(-0.25 - open * 1.1); ctx.fillStyle = '#ff7f9b'; ctx.beginPath(); ctx.ellipse(0, 0, 60, 22, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(i * 24, -18); ctx.stroke(); } ctx.restore();
      }
      for (let i = bubbles.length - 1; i >= 0; i--) { const b = bubbles[i]; b.y -= 0.05; b.x += Math.sin(sec * 4 + i) * 0.3; const yy = y(b.y); if (yy < y(0) || yy < -10) { bubbles.splice(i, 1); continue; } ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x, yy, b.r, 0, 7); ctx.stroke(); }
      drawDiver(W2 / 2, y(d), sec, holding && !tideIn() && !done);
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '800 12px Nunito, sans-serif'; for (let m = 10; m < DEPTH; m += 10) { const yy = y(m); if (yy < 0 || yy > H2) continue; ctx.fillRect(W2 * 0.14 + 8, yy, 10, 2); ctx.fillText(m / 5 + ' m', W2 * 0.14 + 22, yy + 4); }
    }
    function drawDiver(x, yy, sec, swim) {
      ctx.save(); ctx.translate(x, yy); ctx.scale(1.4, 1.4); const ang = swim ? Math.PI * 0.92 : (started ? Math.PI * 0.15 : 0); ctx.rotate(ang + Math.sin(sec * 2) * 0.05);
      const kick = swim ? Math.sin(sec * 14) * 0.5 : Math.sin(sec * 2) * 0.15;
      ctx.strokeStyle = '#c98a5b'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-5, 14); ctx.lineTo(-7 + kick * 8, 36); ctx.moveTo(5, 14); ctx.lineTo(7 - kick * 8, 36); ctx.stroke();
      if (o.stone) { ctx.fillStyle = '#8a97a6'; ctx.beginPath(); ctx.arc(-7 + kick * 8, 42, 7, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-11, -10, 22, 28, 8) : ctx.rect(-11, -10, 22, 28); ctx.fill();
      ctx.fillStyle = '#1a8fe0'; ctx.fillRect(-11, 8, 22, 8);
      ctx.strokeStyle = '#c98a5b'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-20, 8 + kick * 6); ctx.moveTo(10, -4); ctx.lineTo(20, 8 - kick * 6); ctx.stroke();
      ctx.fillStyle = '#d79b6b'; ctx.beginPath(); ctx.arc(0, -20, 11, 0, 7); ctx.fill(); ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.arc(0, -24, 11, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#F7B500'; ctx.fillRect(-10, -23, 20, 6); ctx.fillStyle = '#bdf3ff'; ctx.fillRect(-8, -22, 6, 4); ctx.fillRect(2, -22, 6, 4);
      ctx.restore();
    }
    function cleanup() { alive = false; cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', vis); }
    raf = requestAnimationFrame(step);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dive">
      <canvas ref={cvRef} />
      <button className="chip dpause" onClick={() => window.__diveToggle?.()}><Icon n={paused ? 'play' : 'pause'} />{paused ? t('resume') : t('pause')}</button>
      <div className="dhud">
        <div className="mbox"><label><span>{t('breathL')}</span><b>{hud.depth} m</b></label><div className="dbar breath"><i style={{ width: hud.breath * 100 + '%' }} /></div></div>
        {opts.pressure && <div className="mbox"><label><span>{t('earsL')}</span></label><div className="dbar press"><i style={{ width: hud.press + '%' }} /></div></div>}
        {hud.tide && <div className="mbox"><div className="tide"><span className="arw" style={{ background: hud.tide === 'in' ? '#e8622c' : '#2fae63' }}><Icon n={hud.tide === 'in' ? 'up' : 'down'} /></span><span>{hud.tide === 'start' ? t('tideStart') : hud.tide === 'in' ? t('tideIn') : t('tideOut')}</span></div></div>}
      </div>
      <div className="dctrl">
        <button ref={holdRef} className="btn big hold"><Icon n="down" />{t('holdSwim')}</button>
        <small>{t('holdHelp')}</small>
      </div>
      {(msg.show || paused) && <div className="dmsg">{paused ? t('pause') : msg.text}{!paused && msg.sub && <div style={{ fontSize: 15, fontFamily: 'var(--f-body)', color: 'var(--ink-soft)' }}>{msg.sub}</div>}</div>}
    </div>
  );
}
