// Seeds test accounts + catalogue, and runs schema migrations on existing databases.
// Test credentials (local development only):
//   Publisher admin: admin@thoth.test / Publisher#2026
//   Demo parent:     parent@thoth.test / Parent#2026
import bcrypt from 'bcryptjs';
import { db, save, id, initDb } from './db.js';
import { DEFAULT_BOOKS, HAT_BOOK, OLD_HAT_NAME_EN } from './books.js';

// Each migration runs once per database, in order, and is recorded in meta.schema.
const MIGRATIONS = [
  [2, 'Lock Pearl Sea, open Zizoun\'s Hat Town', d => {
    const pearl = d.books.find(b => b.id === 'pearl');
    if (pearl) { pearl.locked = true; pearl.playable = false; }
    let hat = d.books.find(b => b.id === 'hat');
    if (!hat) { d.books.push(structuredClone(HAT_BOOK)); hat = d.books.at(-1); }
    else {
      // only replace the text if the publisher never edited the old placeholder
      const untouched = !hat.name?.en || hat.name.en === OLD_HAT_NAME_EN;
      if (untouched) for (const k of ['name', 'book', 'value', 'skill', 'desc', 'teaser']) hat[k] = structuredClone(HAT_BOOK[k]);
      if (!hat.cover) hat.cover = HAT_BOOK.cover;
      if (!hat.shopUrl) hat.shopUrl = HAT_BOOK.shopUrl;
      hat.playable = true; hat.published = true; hat.locked = false;
    }
    for (const b of d.books) { if (b.locked == null) b.locked = false; if (!b.pages || typeof b.pages !== 'object') b.pages = {}; }
  }],
];

export async function seed({ force = false } = {}) {
  const d = db();
  if (!d.books.length || force) { d.books = structuredClone(DEFAULT_BOOKS); d.meta.schema = MIGRATIONS.at(-1)[0]; }
  const from = d.meta.schema || 1;
  for (const [v, name, fn] of MIGRATIONS) if (v > from) { fn(d); d.meta.schema = v; console.log(`Migration ${v}: ${name}`); }
  const add = (email, pass, role, name) => {
    if (d.users.find(u => u.email === email)) return;
    d.users.push({ id: id('u_'), email, pass: bcrypt.hashSync(pass, 10), role, name, createdAt: Date.now() });
  };
  if (process.env.NODE_ENV === 'production') {
    // Production: no shared test passwords. The publisher admin comes from env vars.
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD)
      add(process.env.ADMIN_EMAIL.trim().toLowerCase(), process.env.ADMIN_PASSWORD, 'publisher', 'Thoth Publisher');
  } else {
    add('admin@thoth.test', 'Publisher#2026', 'publisher', 'Thoth Publisher');
    add('parent@thoth.test', 'Parent#2026', 'parent', 'Demo Parent');
  }
  for (const b of d.books) if (!d.codes.some(c => c.bookId === b.id))
    d.codes.push({ code: b.id.toUpperCase() + '-DEMO', bookId: b.id, usedBy: null, createdAt: Date.now() });
  save();
}
if (process.argv[1]?.endsWith('seed.js')) { await initDb(); await seed({ force: process.argv.includes('--force') }); setTimeout(() => console.log('Seeded.'), 200); }
