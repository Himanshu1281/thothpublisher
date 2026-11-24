// Tiny document database.
//  - Default: a JSON file at server/data/db.json (local development).
//  - If MONGODB_URI is set (e.g. free MongoDB Atlas):
//      * users, children, progress, books, codes and meta are each stored as one document
//        in the `store` collection (small, bounded collections).
//      * runs (one per quest play, unbounded) live in their own `runs` collection, one
//        document per run, so the store never approaches Mongo's 16 MB document limit.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const FILE = path.join(DIR, 'db.json');
const EMPTY = { users: [], children: [], progress: {}, runs: [], books: [], codes: [], meta: {} };
const KEYS = Object.keys(EMPTY);
const STORE_KEYS = KEYS.filter(k => k !== 'runs');
const DOC_LIMIT = 15 * 1024 * 1024; // Mongo hard limit is 16 MB per document

let data = null, store = null, runsCol = null;

export async function initDb() {
  if (process.env.MONGODB_URI) {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const mdb = client.db(process.env.MONGODB_DB || 'thoth');
    store = mdb.collection('store'); runsCol = mdb.collection('runs');
    data = structuredClone(EMPTY);
    let legacyRuns = null;
    for (const d of await store.find({}).toArray()) {
      if (d._id === 'runs') legacyRuns = d.v;
      else if (STORE_KEYS.includes(d._id)) data[d._id] = d.v;
    }
    // one-time move: runs used to be a single array document inside `store`
    if (Array.isArray(legacyRuns) && legacyRuns.length && !(await runsCol.countDocuments({}, { limit: 1 }))) {
      await runsCol.insertMany(legacyRuns.map(r => ({ ...r })));
      console.log(`Database: moved ${legacyRuns.length} runs to their own collection`);
    }
    if (legacyRuns) await store.deleteOne({ _id: 'runs' });
    await runsCol.createIndex({ childId: 1, at: -1 });
    await runsCol.createIndex({ id: 1 }, { unique: true });
    data.runs = await runsCol.find({}, { projection: { _id: 0 } }).toArray();
    console.log('Database: MongoDB');
  } else {
    fs.mkdirSync(DIR, { recursive: true });
    data = fs.existsSync(FILE) ? { ...structuredClone(EMPTY), ...JSON.parse(fs.readFileSync(FILE, 'utf8')) } : structuredClone(EMPTY);
    console.log('Database: ' + FILE);
  }
  for (const k of KEYS) if (data[k] == null) data[k] = structuredClone(EMPTY[k]);
}

export function db() {
  if (!data) throw new Error('initDb() not called');
  return data;
}

let t = null, writing = Promise.resolve();
export function save() {
  clearTimeout(t);
  t = setTimeout(() => {
    if (store) {
      const snap = {};
      for (const k of STORE_KEYS) {
        const size = Buffer.byteLength(JSON.stringify(data[k]));
        if (size > DOC_LIMIT) { console.error(`DB: "${k}" is ${(size / 1048576).toFixed(1)} MB, too big for one Mongo document; not saved`); continue; }
        snap[k] = structuredClone(data[k]);
      }
      writing = writing.then(() => Promise.all(Object.entries(snap).map(([k, v]) => store.replaceOne({ _id: k }, { _id: k, v }, { upsert: true }))))
        .catch(e => console.error('DB save failed', e.message));
    } else {
      const tmp = FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(data, null, 1));
      fs.renameSync(tmp, FILE);
    }
  }, 150);
}

/** Append one run (quest play). Mongo: one insert, never rewrites the whole history. */
export async function addRun(r) {
  data.runs.push(r);
  if (runsCol) await runsCol.insertOne({ ...r });
  else save();
}
export async function deleteRunsOf(childId) {
  data.runs = data.runs.filter(r => r.childId !== childId);
  if (runsCol) await runsCol.deleteMany({ childId });
  else save();
}
export const id = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
