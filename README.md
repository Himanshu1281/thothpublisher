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

## Free deployment (Render + MongoDB Atlas)
1. **Database (free, keeps data):** create a free M0 cluster at https://cloud.mongodb.com → Database Access: add a user → Network Access: allow `0.0.0.0/0` → Connect → Drivers → copy the `mongodb+srv://…` string.
2. **Code on GitHub:** create an empty repo at https://github.com/new, then in this folder:
   `git remote add origin https://github.com/<you>/thoth.git` and `git push -u origin main`
3. **Host (free):** https://dashboard.render.com → New → Blueprint → pick the repo. Render reads `render.yaml` and asks for:
   - `MONGODB_URI` – the Atlas string from step 1
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` – your publisher login (created on first start)
   `JWT_SECRET` is generated automatically.
4. Open the `https://thoth-story-worlds.onrender.com` URL Render gives you. Publisher login is at `/publisher`.

Notes: the free Render service sleeps after 15 min idle (first visit then takes ~30–50 s). Without `MONGODB_URI` it still runs, but all data resets on every restart/deploy. In production the `@thoth.test` test accounts are not created. HTTPS is provided by Render, which the microphone and camera require.

### Option: frontend on Netlify (free), API on Render
1. Deploy the API on Render as above (steps 1–3). Note its URL, e.g. `https://thoth-story-worlds.onrender.com`.
2. If that URL differs, edit the `/api/*` redirect in `netlify.toml` and push.
3. https://app.netlify.com → Add new site → Import from GitHub → pick the repo. Netlify reads `netlify.toml` (build `npm run build`, publish `dist`). Deploy.
4. Use the Netlify URL for the app. The Render URL keeps working too, but you only need to share the Netlify one.

## Arabic narration (Azure AI Speech, free tier)
Devices without an Arabic voice stay silent with the browser's built-in speech, so the server can speak instead.
Set on Render → thoth-story-worlds → Environment: `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` (e.g. `centralindia`).
Voices: `ar-SA-ZariyahNeural` (Arabic), `en-US-AnaNeural` (English fallback). Audio is cached in memory; free tier = 500k characters/month.
