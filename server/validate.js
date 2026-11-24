// Input checking for everything the game client writes. Nothing from the client is stored
// without passing through here: unknown keys are dropped, numbers clamped, strings cut,
// arrays capped, and nesting limited.

export const int = (v, lo, hi, dflt = lo) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt; };
export const num = (v, lo, hi, dflt = null) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt; };
export const str = (v, max = 300) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max) : '');
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);

/** Generic deep clean for quest-specific `data`: plain JSON only, bounded size. */
export function cleanJson(v, depth = 0) {
  if (depth > 4) return null;
  if (typeof v === 'string') return str(v, 300);
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v * 1000) / 1000 : null;
  if (typeof v === 'boolean' || v === null) return v;
  if (Array.isArray(v)) return v.slice(0, 60).map(x => cleanJson(x, depth + 1));
  if (isObj(v)) { const o = {}; for (const k of Object.keys(v).slice(0, 40)) if (/^[\w-]{1,40}$/.test(k)) o[k] = cleanJson(v[k], depth + 1); return o; }
  return null;
}

export function cleanReading(r) {
  if (!isObj(r)) return null;
  return {
    id: str(r.id, 40), words: int(r.words, 0, 2000, 0), accuracy: int(r.accuracy, 0, 100, 0), wpm: r.wpm == null ? null : int(r.wpm, 0, 400, 0),
    mode: r.mode === 'self' ? 'self' : 'speech', transcript: str(r.transcript, 600),
    hard: (Array.isArray(r.hard) ? r.hard : []).slice(0, 30).map(w => ({ ar: str(w?.ar, 40), en: str(w?.en, 60), arGloss: str(w?.arGloss, 60) })).filter(w => w.ar),
  };
}
const cleanVoice = v => (Array.isArray(v) ? v : []).slice(0, 6).map(x => ({ q: str(x?.q, 300), a: str(x?.a, 600), at: int(x?.at, 0, 9e15, Date.now()) }));

const AUDIO_MAX = 700 * 1024; // ~20 s of opus
function cleanThanks(t) {
  if (!isObj(t)) return null;
  const out = { text: str(t.text, 600) };
  if (typeof t.audio === 'string' && /^data:audio\/(webm|ogg|mp4|mpeg|aac|wav)(;[\w=.+-]+)*;base64,[A-Za-z0-9+/=]+$/.test(t.audio) && t.audio.length <= AUDIO_MAX) out.audio = t.audio;
  return out.text || out.audio ? out : null;
}

/** A finished (or stopped) quest play. Server fills id/childId/band/at. */
export function cleanRun(body, { world, band }) {
  const b = isObj(body) ? body : {};
  const r = {
    world, band, completed: b.completed === true,
    durationSec: int(b.durationSec, 0, 4 * 3600, 0), stars: int(b.stars, 0, 3, 0), hints: int(b.hints, 0, 99, 0),
  };
  if (world === 'hat') {
    r.quest = Number(b.quest); if (!Number.isInteger(r.quest) || r.quest < 1 || r.quest > 7) return null;
    r.readings = (Array.isArray(b.readings) ? b.readings : []).slice(0, 10).map(cleanReading).filter(Boolean);
    r.reading = r.readings.length ? {
      words: r.readings.reduce((s, x) => s + x.words, 0),
      accuracy: Math.round(r.readings.reduce((s, x) => s + x.accuracy, 0) / r.readings.length),
      wpm: (() => { const w = r.readings.filter(x => x.wpm != null); return w.length ? Math.round(w.reduce((s, x) => s + x.wpm, 0) / w.length) : null; })(),
      hard: [...new Map(r.readings.flatMap(x => x.hard).map(h => [h.ar, h])).values()].slice(0, 30),
      mode: r.readings.some(x => x.mode === 'speech') ? 'speech' : 'self',
    } : null;
    r.voice = cleanVoice(b.voice);
    const data = cleanJson(b.data);
    r.data = isObj(data) && Buffer.byteLength(JSON.stringify(data)) <= 24 * 1024 ? data : {};
    const th = cleanThanks(b.thanks); if (th) r.thanks = th;
    return r;
  }
  // legacy worlds keep their old shape (read-only now, but stopped runs may still arrive from old tabs)
  r.reading = b.reading ? cleanReading(b.reading) : null;
  r.voice = cleanVoice(b.voice);
  r.dives = (Array.isArray(b.dives) ? b.dives : []).slice(0, 30).map(d => cleanJson(d));
  r.rhythm = b.rhythm == null ? null : int(b.rhythm, 0, 100, 0);
  return r;
}

/** Progress for Hat Town: which days are done and stars per day. */
export function cleanHatProgress(p) {
  const o = isObj(p) ? p : {};
  const done = [...new Set((Array.isArray(o.done) ? o.done : []).map(Number).filter(x => Number.isInteger(x) && x >= 1 && x <= 7))];
  // a day can only be done if the day before it is done (the week is played in order)
  const ordered = []; for (let q = 1; q <= 7; q++) { if (done.includes(q)) ordered.push(q); else break; }
  const stars = {}; if (isObj(o.stars)) for (const k of Object.keys(o.stars)) { const q = Number(k); if (Number.isInteger(q) && ordered.includes(q)) stars[q] = int(o.stars[k], 0, 3, 0); }
  return { done: ordered, stars, title: ordered.length === 7 ? 'master' : '', updatedAt: Date.now() };
}

const SONGS = ['tryagain', 'hatjingle'];
const CHARS = ['ibis', 'lulua', 'said', 'zizoun', 'strawberry', 'frog', 'swan', 'corn', 'ostrich'];
export const cleanSongs = v => [...new Set((Array.isArray(v) ? v : []).filter(s => SONGS.includes(s)))];
export const cleanCollect = v => [...new Set(['ibis', ...(Array.isArray(v) ? v : []).filter(s => CHARS.includes(s))])];
export const cleanBadges = v => [...new Set((Array.isArray(v) ? v : []).filter(s => typeof s === 'string' && /^[a-z-]{2,30}$/.test(s)))].slice(0, 30);

/** Book fields a publisher may change. */
export function cleanBookPatch(b) {
  const o = {}; const loc = v => (isObj(v) ? { en: str(v.en, 600), ar: str(v.ar, 600) } : undefined);
  for (const k of ['name', 'book', 'value', 'skill', 'desc']) if (k in b) o[k] = loc(b[k]);
  if (isObj(b.teaser)) o.teaser = { en: (b.teaser.en || []).slice(0, 6).map(s => str(s, 200)), ar: (b.teaser.ar || []).slice(0, 6).map(s => str(s, 200)) };
  for (const k of ['playable', 'published', 'locked']) if (k in b) o[k] = b[k] === true;
  if ('shopUrl' in b) o.shopUrl = /^https?:\/\//.test(b.shopUrl || '') ? str(b.shopUrl, 400) : '';
  const img = v => (v === null ? null : typeof v === 'string' && (/^data:image\/(png|jpe?g|webp);base64,/.test(v) || /^\/[\w/.-]+$/.test(v)) && v.length < 1.5e6 ? v : undefined);
  if ('cover' in b) { const v = img(b.cover); if (v !== undefined) o.cover = v; }
  if (isObj(b.pages)) { o.pages = {}; for (const k of ['read', 'clue', 'trick']) if (k in b.pages) { const v = img(b.pages[k]); if (v !== undefined) o.pages[k] = v; } }
  if (Array.isArray(b.pos) && b.pos.length === 3) o.pos = b.pos.map(x => num(x, -40, 40, 0));
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  return o;
}
