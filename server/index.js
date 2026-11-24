import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, save, id, initDb, addRun, deleteRunsOf } from './db.js';
import { cleanRun, cleanHatProgress, cleanSongs, cleanCollect, cleanBadges, cleanBookPatch, int } from './validate.js';
import { seed } from './seed.js';
import { ttsEnabled, synth, allowed } from './tts.js';

// API_PORT wins so a dev tool that sets PORT for Vite doesn't move the API.
const PORT = process.env.API_PORT || (process.env.NODE_ENV === 'production' ? process.env.PORT : 0) || 4000;
const SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-only-change-me');
if (!SECRET) { console.error('JWT_SECRET must be set in production'); process.exit(1); }
const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' })); // book images are sent as data URLs

await initDb();
await seed();

/* ---------- helpers ---------- */
const sign = u => jwt.sign({ sub: u.id, role: u.role }, SECRET, { expiresIn: '30d' });
const pub = u => ({ id: u.id, email: u.email, role: u.role, name: u.name });
const fresh = () => ({ unlocked: [], quest: {}, stars: 0, songs: [], collect: ['ibis'], badges: [], playSec: 0, voiceOn: true });
const bookOf = bid => db().books.find(b => b.id === bid);
const playableWorld = bid => { const b = bookOf(bid); return !!(b && b.playable && b.published && !b.locked); };
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

function auth(role) {
  return (req, res, next) => {
    try {
      const tok = (req.headers.authorization || '').replace(/^Bearer /, '');
      const p = jwt.verify(tok, SECRET);
      const u = db().users.find(x => x.id === p.sub);
      if (!u) throw 0;
      if (role && u.role !== role) return res.status(403).json({ error: 'forbidden' });
      req.user = u; next();
    } catch { res.status(401).json({ error: 'unauthorized' }); }
  };
}
function ownChild(req, res, next) {
  const c = db().children.find(x => x.id === req.params.cid && x.parentId === req.user.id);
  if (!c) return res.status(404).json({ error: 'child_not_found' });
  req.child = c; next();
}

/* ---------- auth ---------- */
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body || {};
  const e = (email || '').trim().toLowerCase();
  if (!emailOk(e)) return res.status(400).json({ error: 'invalid_email' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'weak_password' });
  if (db().users.find(u => u.email === e)) return res.status(409).json({ error: 'email_taken' });
  const u = { id: id('u_'), email: e, pass: bcrypt.hashSync(password, 10), role: 'parent', name: (name || '').trim().slice(0, 40) || e.split('@')[0], createdAt: Date.now() };
  db().users.push(u); save();
  res.json({ token: sign(u), user: pub(u) });
});
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body || {};
  const u = db().users.find(x => x.email === (email || '').trim().toLowerCase());
  if (!u || !bcrypt.compareSync(password || '', u.pass)) return res.status(401).json({ error: 'bad_credentials' });
  if (role && u.role !== role) return res.status(403).json({ error: 'wrong_portal' });
  res.json({ token: sign(u), user: pub(u) });
});
app.get('/api/me', auth(), (req, res) => res.json({ user: pub(req.user) }));

/* ---------- text-to-speech (Azure) ---------- */
app.get('/api/tts/status', (_req, res) => res.json({ enabled: ttsEnabled }));
app.get('/api/tts', auth(), async (req, res) => {
  if (!ttsEnabled) return res.status(503).json({ error: 'tts_disabled' });
  const text = String(req.query.text || '').trim().slice(0, 400);
  const lang = req.query.lang === 'en' ? 'en' : 'ar';
  if (!text) return res.status(400).json({ error: 'no_text' });
  if (!allowed(req.user.id)) return res.status(429).json({ error: 'slow_down' });
  try {
    const mp3 = await synth(text, lang);
    res.set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400' }).send(mp3);
  } catch (e) { console.error('TTS failed', e.message); res.status(502).json({ error: 'tts_failed' }); }
});

/* ---------- books (public catalogue) ---------- */
app.get('/api/books', (_req, res) => res.json(db().books.filter(b => b.published)));

/* ---------- children ---------- */
app.get('/api/children', auth('parent'), (req, res) => res.json(db().children.filter(c => c.parentId === req.user.id)));
app.post('/api/children', auth('parent'), (req, res) => {
  const { name, band, avatar } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'name_required' });
  const c = { id: id('c_'), parentId: req.user.id, name: name.trim().slice(0, 20), band: ['little', 'early', 'reader'].includes(band) ? band : 'early', avatar: avatar || 'ibis', createdAt: Date.now() };
  db().children.push(c); db().progress[c.id] = fresh(); save(); res.json(c);
});
app.patch('/api/children/:cid', auth('parent'), ownChild, (req, res) => {
  const { name, band, avatar } = req.body || {};
  if (name) req.child.name = name.trim().slice(0, 20);
  if (['little', 'early', 'reader'].includes(band)) req.child.band = band;
  if (avatar) req.child.avatar = avatar;
  save(); res.json(req.child);
});
app.delete('/api/children/:cid', auth('parent'), ownChild, async (req, res) => {
  const d = db(); d.children = d.children.filter(c => c.id !== req.child.id); delete d.progress[req.child.id];
  save(); await deleteRunsOf(req.child.id); res.json({ ok: true });
});
app.get('/api/children/:cid/state', auth('parent'), ownChild, (req, res) => res.json(db().progress[req.child.id] || fresh()));
app.put('/api/children/:cid/state', auth('parent'), ownChild, (req, res) => {
  // unlocked only changes via redeem, playSec only via /time. Everything else is checked.
  const cur = db().progress[req.child.id] || fresh(); const b = req.body || {};
  if (b.quest && typeof b.quest === 'object') {
    cur.quest = cur.quest || {};
    // only worlds the child can actually play may be written; old (locked) worlds stay read-only
    if ('hat' in b.quest && cur.unlocked.includes('hat') && playableWorld('hat')) cur.quest.hat = cleanHatProgress(b.quest.hat);
  }
  if ('stars' in b) cur.stars = int(b.stars, 0, 100000, cur.stars || 0);
  if ('songs' in b) cur.songs = cleanSongs(b.songs);
  if ('collect' in b) cur.collect = cleanCollect(b.collect);
  if ('badges' in b) cur.badges = cleanBadges(b.badges);
  if ('voiceOn' in b) cur.voiceOn = b.voiceOn !== false;
  db().progress[req.child.id] = cur; save(); res.json(cur);
});
app.post('/api/children/:cid/redeem', auth('parent'), ownChild, (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const c = db().codes.find(x => x.code === code);
  if (!c) return res.status(404).json({ error: 'bad_code' });
  const book = bookOf(c.bookId);
  if (!book || !book.published) return res.status(404).json({ error: 'bad_code' });
  if (book.locked) return res.status(423).json({ error: 'world_locked', bookId: c.bookId });
  const st = db().progress[req.child.id] ||= fresh();
  if (st.unlocked.includes(c.bookId)) return res.status(409).json({ error: 'already_linked', bookId: c.bookId });
  // demo codes are reusable; real codes bind to one child
  if (c.usedBy && c.usedBy !== req.child.id && !code.endsWith('-DEMO')) return res.status(409).json({ error: 'code_used' });
  if (!code.endsWith('-DEMO')) { c.usedBy = req.child.id; c.usedAt = Date.now(); }
  st.unlocked.push(c.bookId); save();
  res.json({ bookId: c.bookId, state: st });
});
// list without the recorded thank-you audio (fetched on demand, it can be large)
const lite = r => (r.thanks?.audio ? { ...r, thanks: { text: r.thanks.text, hasAudio: true } } : r);
app.get('/api/children/:cid/runs', auth('parent'), ownChild, (req, res) =>
  res.json(db().runs.filter(r => r.childId === req.child.id).sort((a, b) => b.at - a.at).map(lite)));
app.get('/api/children/:cid/runs/:rid/audio', auth('parent'), ownChild, (req, res) => {
  const r = db().runs.find(x => x.id === req.params.rid && x.childId === req.child.id);
  if (!r?.thanks?.audio) return res.status(404).json({ error: 'not_found' });
  const [, mime, b64] = r.thanks.audio.match(/^data:([^;,]+)[^,]*;base64,(.*)$/) || [];
  if (!b64) return res.status(404).json({ error: 'not_found' });
  res.set({ 'Content-Type': mime, 'Cache-Control': 'private, max-age=3600' }).send(Buffer.from(b64, 'base64'));
});
app.post('/api/children/:cid/runs', auth('parent'), ownChild, async (req, res) => {
  const world = String(req.body?.world || '');
  const st = db().progress[req.child.id] || fresh();
  if (!bookOf(world)) return res.status(400).json({ error: 'unknown_world' });
  if (!playableWorld(world)) return res.status(423).json({ error: 'world_locked' });
  if (!st.unlocked.includes(world)) return res.status(403).json({ error: 'not_unlocked' });
  const clean = cleanRun(req.body, { world, band: req.child.band });
  if (!clean) return res.status(400).json({ error: 'bad_run' });
  const r = { ...clean, id: id('r_'), childId: req.child.id, at: Date.now() };
  try { await addRun(r); } catch (e) { console.error('run save failed', e.message); return res.status(500).json({ error: 'save_failed' }); }
  res.json(lite(r));
});
app.post('/api/children/:cid/time', auth('parent'), ownChild, (req, res) => {
  const st = db().progress[req.child.id] ||= fresh();
  const sec = Math.min(120, Math.max(0, Number(req.body?.sec) || 0));
  st.playSec += sec;
  const day = new Date().toISOString().slice(0, 10);
  st.daily = st.daily || {}; st.daily[day] = (st.daily[day] || 0) + sec;
  save(); res.json({ ok: true });
});

/* ---------- publisher admin ---------- */
const admin = auth('publisher');
app.get('/api/admin/books', admin, (_req, res) => res.json(db().books));
app.post('/api/admin/books', admin, (req, res) => {
  const b = req.body || {};
  const bid = String(b.id || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24) || id('b');
  if (db().books.find(x => x.id === bid)) return res.status(409).json({ error: 'id_taken' });
  const nb = { id: bid, pos: [Math.round(Math.random() * 30 - 15), 0, Math.round(Math.random() * 30 - 15)], playable: false, published: false, locked: false, cover: null, pages: {}, shopUrl: '',
    name: { en: '', ar: '' }, book: { en: '', ar: '' }, value: { en: '', ar: '' }, skill: { en: '', ar: '' }, desc: { en: '', ar: '' }, teaser: { en: [], ar: [] }, ...cleanBookPatch(b), id: bid };
  db().books.push(nb); save(); res.json(nb);
});
app.put('/api/admin/books/:bid', admin, (req, res) => {
  const b = db().books.find(x => x.id === req.params.bid);
  if (!b) return res.status(404).json({ error: 'not_found' });
  const patch = cleanBookPatch(req.body || {});
  if (patch.pages) { b.pages = { ...(b.pages || {}), ...patch.pages }; delete patch.pages; }
  Object.assign(b, patch); save(); res.json(b);
});
app.delete('/api/admin/books/:bid', admin, (req, res) => {
  const d = db(); d.books = d.books.filter(b => b.id !== req.params.bid); save(); res.json({ ok: true });
});
app.get('/api/admin/codes', admin, (req, res) => res.json(db().codes.filter(c => !req.query.book || c.bookId === req.query.book)));
app.post('/api/admin/books/:bid/codes', admin, (req, res) => {
  const n = Math.min(500, Math.max(1, Number(req.body?.count) || 10));
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const made = [];
  for (let i = 0; i < n; i++) {
    let code; do { code = req.params.bid.toUpperCase().slice(0, 5) + '-' + Array.from({ length: 6 }, () => A[Math.floor(Math.random() * A.length)]).join(''); }
    while (db().codes.some(c => c.code === code));
    const c = { code, bookId: req.params.bid, usedBy: null, createdAt: Date.now() }; db().codes.push(c); made.push(c);
  }
  save(); res.json(made);
});
app.get('/api/admin/stats', admin, (_req, res) => {
  const d = db();
  const parents = d.users.filter(u => u.role === 'parent');
  const done = d.runs.filter(r => r.completed);
  const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const perBook = d.books.map(b => ({
    id: b.id, name: b.name,
    unlocks: Object.values(d.progress).filter(p => p.unlocked.includes(b.id)).length,
    runs: d.runs.filter(r => r.world === b.id).length,
    completions: done.filter(r => r.world === b.id).length,
    codes: d.codes.filter(c => c.bookId === b.id).length,
    redeemed: d.codes.filter(c => c.bookId === b.id && c.usedBy).length,
  }));
  const last30 = {};
  for (let i = 29; i >= 0; i--) last30[new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)] = 0;
  for (const r of d.runs) { const k = new Date(r.at).toISOString().slice(0, 10); if (k in last30) last30[k]++; }
  const bands = { little: 0, early: 0, reader: 0 }; d.children.forEach(c => { if (c.band in bands) bands[c.band]++; });
  // Hat Town: the 7-day funnel and what children did in each day
  const hat = d.runs.filter(r => r.world === 'hat');
  const hatDone = hat.filter(r => r.completed);
  const byQ = q => hatDone.filter(r => r.quest === q);
  const pct = (a, b) => (b ? Math.round(a / b * 100) : null);
  const designs = hatDone.filter(r => r.quest === 4).flatMap(r => r.data?.designs || []);
  const q1 = byQ(1); const choices = q1.flatMap(r => r.data?.choices || []);
  const hatStats = {
    funnel: [1, 2, 3, 4, 5, 6, 7].map(q => ({ q, started: new Set(hat.filter(r => r.quest === q).map(r => r.childId)).size, finished: new Set(byQ(q).map(r => r.childId)).size,
      avgMin: avg(byQ(q).map(r => r.durationSec / 60)) })),
    readingByQuest: [1, 2, 4, 7].map(q => ({ q, accuracy: avg(byQ(q).map(r => r.reading?.accuracy).filter(Number.isFinite)) })),
    fitFirstTry: pct(designs.filter(x => x.fitFirst).length, designs.length),
    oldHatTries: designs.filter(x => x.triedOld).length,
    openChoice: pct(choices.filter(c => c.kind === 'open').length, choices.length),
    causeRight: pct(q1.filter(r => r.data?.causeFirst).length, q1.length),
    rhythm: avg(byQ(6).map(r => r.data?.avg).filter(Number.isFinite)),
    mazeBonus: pct(byQ(5).filter(r => r.data?.bookBonus).length, byQ(5).length),
    softVoice: pct(byQ(3).filter(r => r.data?.ostrich?.mic).length, byQ(3).length),
    thanks: byQ(7).filter(r => r.thanks).length,
    masters: Object.values(d.progress).filter(p => p.quest?.hat?.done?.length === 7).length,
  };
  res.json({
    parents: parents.length, children: d.children.length, runs: d.runs.length, completions: done.length,
    avgAccuracy: avg(done.map(r => r.reading?.accuracy).filter(Number.isFinite)),
    avgDives: avg(done.filter(r => r.world === 'pearl').map(r => r.dives?.length).filter(Number.isFinite)),
    totalMinutes: Math.round(Object.values(d.progress).reduce((a, p) => a + (p.playSec || 0), 0) / 60),
    perBook, daily: last30, bands, hat: hatStats,
  });
});

/* ---------- static frontend in production ---------- */
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`Thoth API on http://localhost:${PORT}`));
