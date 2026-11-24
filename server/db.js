// Tiny document database.
//  - Default: a JSON file at server/data/db.json (local development).
//  - If MONGODB_URI is set (e.g. free MongoDB Atlas): each collection is stored as one
//    document in Mongo, so data survives restarts on free hosts with no persistent disk.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const FILE = path.join(DIR, 'db.json');
const EMPTY = { users: [], children: [], progress: {}, runs: [], books: [], codes: [] };
const KEYS = Object.keys(EMPTY);

let data = null, mongo = null;

export async function initDb() {
  if (process.env.MONGODB_URI) {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    mongo = client.db(process.env.MONGODB_DB || 'thoth').collection('store');
    data = structuredClone(EMPTY);
    for (const d of await mongo.find({}).toArray()) if (KEYS.includes(d._id)) data[d._id] = d.v;
    console.log('Database: MongoDB');
  } else {
    fs.mkdirSync(DIR, { recursive: true });
    data = fs.existsSync(FILE) ? { ...EMPTY, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) } : structuredClone(EMPTY);
    console.log('Database: ' + FILE);
  }
}

export function db() {
  if (!data) throw new Error('initDb() not called');
  return data;
}

let t = null, writing = Promise.resolve();
export function save() {
  clearTimeout(t);
  t = setTimeout(() => {
    if (mongo) {
      const snap = structuredClone(data);
      writing = writing.then(() => Promise.all(KEYS.map(k => mongo.replaceOne({ _id: k }, { _id: k, v: snap[k] }, { upsert: true }))))
        .catch(e => console.error('DB save failed', e.message));
    } else {
      const tmp = FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(data, null, 1));
      fs.renameSync(tmp, FILE);
    }
  }, 150);
}
export const id = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
