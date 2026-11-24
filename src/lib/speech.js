// Text-to-speech + speech recognition with Arabic-aware matching.

/* ---------------- TTS ---------------- */
let voices = [];
const loadVoices = () => { try { voices = speechSynthesis.getVoices(); } catch { /* */ } };
if (typeof window !== 'undefined' && 'speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

function bestVoice(lang) {
  const pre = lang === 'ar' ? 'ar' : 'en';
  const list = voices.filter(v => v.lang?.toLowerCase().startsWith(pre));
  const score = v => (/natural|online|neural/i.test(v.name) ? 4 : 0) + (/google|microsoft/i.test(v.name) ? 2 : 0) + (/sa|ae|eg/i.test(v.lang) ? 1 : 0);
  return list.sort((a, b) => score(b) - score(a))[0] || null;
}
export const speechState = { on: true };
/** false only when we know the device has voices but none for this language. */
export function hasVoice(lang) { loadVoices(); return !voices.length || !!bestVoice(lang); }

/* ---- server voice (Azure neural, same on every device) ---- */
let serverTTS = null; // null = unknown, true/false once checked
const ttsReady = fetch('/api/tts/status').then(r => r.json()).then(j => { serverTTS = !!j.enabled; }).catch(() => { serverTTS = false; });
const clips = new Map(); let audioEl = null;
const useServer = lang => serverTTS && (lang === 'ar' || !bestVoice(lang));
async function clipUrl(text, lang) {
  const k = lang + '|' + text; if (clips.has(k)) return clips.get(k);
  const p = fetch(`/api/tts?lang=${lang}&text=${encodeURIComponent(text)}`, { headers: { Authorization: 'Bearer ' + (localStorage.getItem('thoth-token') || '') } })
    .then(r => { if (!r.ok) throw new Error('tts ' + r.status); return r.blob(); })
    .then(b => URL.createObjectURL(b));
  clips.set(k, p); p.catch(() => clips.delete(k));
  return p;
}
/** warm the cache so the first tap plays instantly */
export function prefetchSpeech(text, lang = 'ar') { ttsReady.then(() => { if (useServer(lang) && text) clipUrl(text, lang).catch(() => {}); }); }
function playServer(text, lang) {
  return clipUrl(text, lang).then(url => new Promise(res => {
    hush(); audioEl = new Audio(url); audioEl.onended = res; audioEl.onerror = res; audioEl.play().catch(res);
  }));
}

export async function say(text, lang = 'en', { rate } = {}) {
  if (!speechState.on || !text) return;
  if (serverTTS === null) await Promise.race([ttsReady, new Promise(r => setTimeout(r, 1500))]);
  if (useServer(lang)) { try { await playServer(text, lang); return; } catch { /* fall back to the device voice */ } }
  return sayDevice(text, lang, { rate });
}
function sayDevice(text, lang, { rate } = {}) {
  if (!('speechSynthesis' in window)) return Promise.resolve();
  if (!hasVoice(lang)) { window.dispatchEvent(new CustomEvent('thoth-novoice', { detail: lang })); return Promise.resolve(); }
  return new Promise(res => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = bestVoice(lang); if (v) u.voice = v;
      u.lang = v?.lang || (lang === 'ar' ? 'ar-SA' : 'en-US');
      u.rate = rate ?? (lang === 'ar' ? 0.78 : 0.98); u.pitch = 1.1;
      u.onend = res; u.onerror = res; speechSynthesis.speak(u);
      setTimeout(res, Math.min(12000, 1500 + text.length * 85));
    } catch { res(); }
  });
}
export function hush() {
  try { if (audioEl) { audioEl.pause(); audioEl = null; } } catch { /* */ }
  try { window.speechSynthesis?.cancel(); } catch { /* */ }
}

/* ---------------- Arabic normalisation + fuzzy match ---------------- */
const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
export function normAr(s) {
  return (s || '')
    .replace(TASHKEEL, '')
    .replace(/[إأآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^ء-يa-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}
// strips the article and one-letter conjunction/prepositions which recognisers often drop or merge
const core = w => w.replace(/^(و|ف|ب|ل|ك)?(ال)?/, '') || w;

function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
export function wordSim(target, heard) {
  const a = normAr(target), b = normAr(heard); if (!a || !b) return 0;
  if (a === b) return 1;
  const s1 = 1 - lev(a, b) / Math.max(a.length, b.length);
  const ca = core(a), cb = core(b);
  const s2 = 1 - lev(ca, cb) / Math.max(ca.length, cb.length);
  return Math.max(s1, s2 * 0.97);
}

/**
 * Align a spoken transcript to the target words, in order, allowing skipped and
 * merged words. Returns an array of {score} per target word (0..1).
 */
export function alignWords(targetWords, transcript) {
  const heard = normAr(transcript).split(' ').filter(Boolean);
  const out = targetWords.map(() => 0);
  let p = 0;
  targetWords.forEach((tw, i) => {
    let best = 0, bestJ = -1, glued = false;
    const nt = normAr(tw);
    for (let j = p; j < Math.min(heard.length, p + 4); j++) {
      let s = wordSim(tw, heard[j]), g = false;
      // two heard tokens may be one target word ("ال صدفه")
      if (j + 1 < heard.length) s = Math.max(s, wordSim(tw, heard[j] + heard[j + 1]) - 0.02);
      // one heard token may hold this word glued to the next ("منالصدفه")
      if (nt.length >= 2 && heard[j].length > nt.length + 1) {
        if (heard[j].startsWith(nt)) { if (0.92 > s) { s = 0.92; g = true; } }
        else if (heard[j].endsWith(nt) || heard[j].endsWith(core(nt))) { if (0.9 > s) s = 0.9; }
      }
      if (s > best) { best = s; bestJ = j; glued = g; }
    }
    out[i] = best;
    if (best >= 0.55 && bestJ >= 0) p = glued ? bestJ : bestJ + 1;
  });
  return out;
}

/* ---------------- recognition ---------------- */
const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
export const canListen = !!SR;

/**
 * Start listening. onUpdate(bestTranscript, isFinal) is called with the best of all
 * alternatives (chosen by `pick` when given). Returns {stop()}.
 */
export function listen({ lang = 'ar-SA', onUpdate, onEnd, onError, pick, continuous = true, maxMs = 20000 }) {
  if (!SR) { onError?.('unsupported'); return { stop() {} }; }
  const r = new SR();
  r.lang = lang; r.interimResults = true; r.continuous = continuous; r.maxAlternatives = 5;
  let finals = '', stopped = false;
  r.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      const alts = Array.from(res).map(a => a.transcript);
      const best = pick ? alts.map(a => [a, pick(finals + ' ' + a)]).sort((x, y) => y[1] - x[1])[0][0] : alts[0];
      if (res.isFinal) finals += ' ' + best; else interim += ' ' + best;
    }
    onUpdate?.((finals + ' ' + interim).trim(), false);
  };
  r.onerror = e => { if (e.error !== 'no-speech' && e.error !== 'aborted') onError?.(e.error); };
  r.onend = () => { stopped = true; clearTimeout(tm); onUpdate?.(finals.trim(), true); onEnd?.(finals.trim()); };
  const tm = setTimeout(() => { try { r.stop(); } catch { /* */ } }, maxMs);
  try { r.start(); } catch { onError?.('start_failed'); }
  return { stop() { if (!stopped) try { r.stop(); } catch { /* */ } } };
}
