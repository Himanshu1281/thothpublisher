import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, save, id, initDb } from './db.js';
import { seed } from './seed.js';

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
const fresh = () => ({ unlocked: [], quest: {}, stars: 0, songs: [], collect: ['ibis'], playSec: 0, voiceOn: true });
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
app.delete('/api/children/:cid', auth('parent'), ownChild, (req, res) => {
  const d = db(); d.children = d.children.filter(c => c.id !== req.child.id); delete d.progress[req.child.id];
  d.runs = d.runs.filter(r => r.childId !== req.child.id); save(); res.json({ ok: true });
});
app.get('/api/children/:cid/state', auth('parent'), ownChild, (req, res) => res.json(db().progress[req.child.id] || fresh()));
app.put('/api/children/:cid/state', auth('parent'), ownChild, (req, res) => {
  const cur = db().progress[req.child.id] || fresh();
  const allowed = ['quest', 'stars', 'songs', 'collect', 'playSec', 'voiceOn']; // unlocked only via redeem
  for (const k of allowed) if (k in req.body) cur[k] = req.body[k];
  db().progress[req.child.id] = cur; save(); res.json(cur);
});
app.post('/api/children/:cid/redeem', auth('parent'), ownChild, (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const c = db().codes.find(x => x.code === code);
  if (!c) return res.status(404).json({ error: 'bad_code' });
  const st = db().progress[req.child.id] ||= fresh();
  if (st.unlocked.includes(c.bookId)) return res.status(409).json({ error: 'already_linked', bookId: c.bookId });
  // demo codes are reusable; real codes bind to one child
  if (c.usedBy && c.usedBy !== req.child.id && !code.endsWith('-DEMO')) return res.status(409).json({ error: 'code_used' });
  if (!code.endsWith('-DEMO')) { c.usedBy = req.child.id; c.usedAt = Date.now(); }
  st.unlocked.push(c.bookId); save();
  res.json({ bookId: c.bookId, state: st });
});
app.get('/api/children/:cid/runs', auth('parent'), ownChild, (req, res) =>
  res.json(db().runs.filter(r => r.childId === req.child.id).sort((a, b) => b.at - a.at)));
app.post('/api/children/:cid/runs', auth('parent'), ownChild, (req, res) => {
  const r = { ...req.body, id: id('r_'), childId: req.child.id, at: Date.now() };
  db().runs.push(r); save(); res.json(r);
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
  const nb = { id: bid, pos: [Math.round(Math.random() * 30 - 15), 0, Math.round(Math.random() * 30 - 15)], playable: false, published: false, cover: null, pages: {}, shopUrl: '',
    name: { en: '', ar: '' }, book: { en: '', ar: '' }, value: { en: '', ar: '' }, skill: { en: '', ar: '' }, desc: { en: '', ar: '' }, teaser: { en: [], ar: [] }, ...b, id: bid };
  db().books.push(nb); save(); res.json(nb);
});
app.put('/api/admin/books/:bid', admin, (req, res) => {
  const b = db().books.find(x => x.id === req.params.bid);
  if (!b) return res.status(404).json({ error: 'not_found' });
  const { id: _ignore, ...rest } = req.body || {};
  Object.assign(b, rest); save(); res.json(b);
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
  const bands = { little: 0, early: 0, reader: 0 }; d.children.forEach(c => bands[c.band]++);
  res.json({
    parents: parents.length, children: d.children.length, runs: d.runs.length, completions: done.length,
    avgAccuracy: avg(done.map(r => r.reading?.accuracy).filter(Number.isFinite)),
    avgDives: avg(done.map(r => r.dives?.length).filter(Number.isFinite)),
    totalMinutes: Math.round(Object.values(d.progress).reduce((a, p) => a + (p.playSec || 0), 0) / 60),
    perBook, daily: last30, bands,
  });
});

/* ---------- static frontend in production ---------- */
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`Thoth API on http://localhost:${PORT}`));
