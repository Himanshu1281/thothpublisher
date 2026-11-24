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
  else if (name === 'needle') { tone(1800, t, 0.03, { type: 'square', vol: 0.06 }); tone(1800, t + 0.06, 0.03, { type: 'square', vol: 0.06 }); }
  else if (name === 'snip') noise(t, 0.07, 0.22, 5200);
  else if (name === 'tap') { tone(180, t, 0.09, { type: 'sine', vol: 0.3 }); noise(t, 0.03, 0.12, 2500); }
  else if (name === 'clap') for (let i = 0; i < 6; i++) noise(t + i * 0.07 + Math.random() * 0.03, 0.05, 0.16, 1800);
  else if (name === 'cheer') { for (let i = 0; i < 14; i++) noise(t + i * 0.05 + Math.random() * 0.04, 0.05, 0.13, 1500 + Math.random() * 800); [72, 76, 79].forEach((m, i) => tone(n2f(m), t + 0.1 + i * 0.08, 0.4, { type: 'sine', vol: 0.08 })); }
  else if (name === 'laugh') [0, 0.16, 0.32, 0.48].forEach((d, i) => { tone(n2f(70 - i), t + d, 0.12, { type: 'sawtooth', vol: 0.05 }); });
  else if (name === 'gasp') { const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.25); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); o.connect(g); g.connect(OUT); o.start(t); o.stop(t + 0.32); }
  else if (name === 'boing') { const o = a.createOscillator(), g = a.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(620, t + 0.12); o.frequency.exponentialRampToValueAtTime(220, t + 0.35); g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(g); g.connect(OUT); o.start(t); o.stop(t + 0.42); }
  else if (name === 'rustle') noise(t, 0.25, 0.1, 3000);
  else if (name === 'whoosh') noise(t, 0.35, 0.14, 900);
  else if (name === 'door') { tone(110, t, 0.25, { type: 'sine', vol: 0.3 }); noise(t, 0.08, 0.2, 600); }
  try { if (name === 'soft') navigator.vibrate?.(60); } catch { /* ignore */ }
}
// short filtered noise burst (scissors, claps, paper)
function noise(t, d, vol, freq) {
  const a = ac(); if (!a) return;
  const len = Math.max(1, Math.floor(a.sampleRate * d)); const buf = a.createBuffer(1, len, a.sampleRate); const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); src.connect(f); f.connect(g); g.connect(OUT); src.start(t);
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
// `from` starts part-way into the song (in beats), so a round can play just one line of it
export function playSong({ loops = 1, onBeat, bpm = 96, beats = 32, song = SONG, from = 0, lead = 0.15 } = {}) {
  const a = ac(); if (!a) return { t0: 0, spb: 60 / bpm, stop() {} }; stopSong();
  const spb = 60 / bpm, t0 = a.currentTime + lead, total = beats * loops;
  for (let L = 0; L < loops; L++) {
    let b = 0; for (const [m, d] of song.melody) { if (b >= from + beats) break; if (b >= from) tone(n2f(m), t0 + (L * beats + b - from) * spb, d * spb * 0.95, { type: 'triangle', vol: 0.13 }); b += d; }
    song.bass.forEach((m, i) => { const bb = i * 4 - from; if (bb < 0 || bb >= beats) return; for (let k = 0; k < 4; k += 2) tone(n2f(m), t0 + (L * beats + bb + k) * spb, spb * 1.6, { type: 'sine', vol: 0.12 }); });
  }
  let alive = true, raf;
  const tick = () => { if (!alive) return; const beat = (a.currentTime - t0) / spb; onBeat?.(beat); if (beat >= total) { alive = false; onBeat?.(-1); return; } raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  const ctl = { t0, spb, stop() { alive = false; cancelAnimationFrame(raf); try { OUT.disconnect(); OUT = a.createGain(); OUT.gain.value = 0.8; OUT.connect(a.destination); } catch { /* */ } onBeat?.(-1); } };
  current = ctl; return ctl;
}
export function stopSong() { if (current) { const s = current; current = null; s.stop(); } }
