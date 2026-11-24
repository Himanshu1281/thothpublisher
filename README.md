# Thoth Story Worlds (تحوت)

React (Vite) frontend + lightweight Express API in one folder. Arabic (RTL) and English, works on phone, tablet and PC.

## Run
```
npm install
npm run dev        # API on :4000 + web on :5173 (proxy /api)
```
Production: `npm run build && NODE_ENV=production PORT=8080 JWT_SECRET=... npm start` (Express serves `dist/`).

## Test accounts (local development only, created by `server/seed.js`)
- Publisher admin: `admin@thoth.test` / `Publisher#2026`  → `/publisher`
- Demo parent: `parent@thoth.test` / `Parent#2026`  → `/`
- Demo book codes: `PEARL-DEMO`, `STORK-DEMO`, … (reusable). Real codes are generated per book in the admin panel and bind to one child.

## Structure
- `server/` – Express API, JWT auth (bcrypt), JSON-file DB at `server/data/db.json` (swap `db.js` for Postgres/Mongo later)
- `src/pages` – Landing (parent email login/signup), AdminLogin, Kids (child profiles), Play (3D map + quest), Parent (analytics), Admin (books, images, QR codes, stats)
- `src/game` – three.js world, quest steps, dive, rhythm, read-aloud, voice tickets, My Space
- `src/lib/speech.js` – Arabic speech matching (diacritic/hamza normalisation, fuzzy + in-order alignment)
- `src/lib/i18n.jsx` – all English/Arabic strings
- `public/zryth-logo.png` – official Zryth logo (from zryth.com)
- `legacy/original-game.html` – the original single-file game
