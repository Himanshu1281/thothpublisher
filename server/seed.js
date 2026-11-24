// Seeds test accounts + catalogue. Test credentials (local development only):
//   Publisher admin: admin@thoth.test / Publisher#2026
//   Demo parent:     parent@thoth.test / Parent#2026
import bcrypt from 'bcryptjs';
import { db, save, id, initDb } from './db.js';
import { DEFAULT_BOOKS } from './books.js';

export async function seed({ force = false } = {}) {
  const d = db();
  if (!d.books.length || force) d.books = structuredClone(DEFAULT_BOOKS);
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
