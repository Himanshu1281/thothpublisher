# Pearl Sea (locked)

Pearl Sea is locked on the map (`locked: true` in `server/books.js`, migration 2 in `server/seed.js`).
Its game code lives here, outside `src/`, so it is not part of the app bundle.

To bring it back: move these files into `src/game/`, re-add the pearl quest branch in
`src/pages/Play.jsx` (see git history before the Hat Town change), and set `locked: false, playable: true`
for `pearl` in the publisher panel.
