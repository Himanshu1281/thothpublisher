// Web Audio: sound effects + the "Try Again" jingle.
let AC = null, OUT = null;
export function ac() {
  if (!AC) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    AC = new C(); OUT = AC.createGain(); OUT.gain.value = 0.8; OUT.connect(AC.destination);
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
export const audioNow = () => (AC ? AC.currentTime : 0);
const n2f = m => 440 * Math.pow(2, (m - 69) / 12);
function tone(f, t, d, { type = 'triangle', vol = 0.16, att = 0.01 } = {}) {
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(OUT); o.start(t); o.stop(t + d + 0.05);
}
export function bubble(t, vol = 0.25) {
  const a = ac(); if (!a) return; t = t ?? a.currentTime;
  const o = a.createOscillator(), g = a.createGain(); o.type = 'sine';
  o.frequency.setValueAtTime(380, t); o.frequency.exponentialRampToValueAtTime(1300, t + 0.09);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  o.connect(g); g.connect(OUT); o.start(t); o.stop(t + 0.15);
}
export function sfx(name) {
  const a = ac(); if (!a) return; const t = a.currentTime;
  if (name === 'pop') { tone(660, t, 0.12, { type: 'sine', vol: 0.2 }); tone(990, t + 0.05, 0.12, { type: 'sine', vol: 0.15 }); }
  else if (name === 'ok') { tone(784, t, 0.15); tone(1046, t + 0.09, 0.22); }
  else if (name === 'soft') { tone(440, t, 0.2, { type: 'sine', vol: 0.12 }); tone(523, t + 0.12, 0.25, { type: 'sine', vol: 0.1 }); }
  else if (name === 'chime') [72, 76, 79, 84].forEach((m, i) => tone(n2f(m), t + i * 0.09, 0.5, { type: 'sine', vol: 0.14 }));
  else if (name === 'bub') bubble(t, 0.18);
  else if (name === 'air') { bubble(t, 0.2); tone(n2f(84), t, 0.2, { type: 'sine', vol: 0.08 }); }
  else if (name === 'splash') for (let i = 0; i < 5; i++) bubble(t + i * 0.05, 0.12);
  try { if (name === 'soft') navigator.vibrate?.(60); } catch { /* ignore */ }
}
export const SONG = {
  melody: [[64, 1], [64, 1], [67, 2], [64, 1], [62, 1], [60, 2], [62, 1], [64, 1], [67, 1], [69, 1], [67, 4],
    [69, 1], [69, 1], [67, 1], [64, 1], [62, 1], [64, 1], [60, 2], [62, 1], [62, 1], [64, 1], [62, 1], [60, 4]],
  bass: [48, 43, 41, 48, 41, 48, 43, 48],
  lyrics: [
    { en: 'Try again, little pearl,', ar: 'حاوِلي يا لُؤْلُؤَتي،', at: 0 },
    { en: 'the light is shining through.', ar: 'النّورُ قَريبٌ مِنْكِ.', at: 8 },
    { en: 'Take a breath, and one more try,', ar: 'خُذي نَفَسًا وَحاوِلي،', at: 16 },
    { en: 'the sea believes in you!', ar: 'البَحْرُ يُؤْمِنُ بِكِ!', at: 24 },
  ],
};
let current = null;
export function playSong({ loops = 1, onBeat, bpm = 96, beats = 32 } = {}) {
  const a = ac(); if (!a) return { t0: 0, stop() {} }; stopSong();
  const spb = 60 / bpm, t0 = a.currentTime + 0.15, total = beats * loops;
  for (let L = 0; L < loops; L++) {
    let b = 0; for (const [m, d] of SONG.melody) { if (b >= beats) break; tone(n2f(m), t0 + (L * beats + b) * spb, d * spb * 0.95, { type: 'triangle', vol: 0.13 }); b += d; }
    SONG.bass.forEach((m, i) => { if (i * 4 >= beats) return; for (let k = 0; k < 4; k += 2) tone(n2f(m), t0 + (L * beats + i * 4 + k) * spb, spb * 1.6, { type: 'sine', vol: 0.12 }); });
  }
  let alive = true, raf;
  const tick = () => { if (!alive) return; const beat = (a.currentTime - t0) / spb; onBeat?.(beat); if (beat >= total) { alive = false; onBeat?.(-1); return; } raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  const ctl = { t0, spb, stop() { alive = false; cancelAnimationFrame(raf); try { OUT.disconnect(); OUT = a.createGain(); OUT.gain.value = 0.8; OUT.connect(a.destination); } catch { /* */ } onBeat?.(-1); } };
  current = ctl; return ctl;
}
export function stopSong() { if (current) { const s = current; current = null; s.stop(); } }
