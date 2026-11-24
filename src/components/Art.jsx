// Hand-drawn icon set for Thoth Story Worlds (replaces emoji): chunky ink outlines in the
// Hat Town palette (plum, mauve, mustard, teal, cream, strawberry red). 48×48 viewBox.
// <Art n="hat" size={28} /> in React, artUrl('hat') for canvas / SVG <image>.
const K = '#1b1b2f', W = 2.6;
// `extra` may override the ink stroke or its width (an attribute can only appear once in SVG)
const s = (d, fill = 'none', extra = '') => `<path d="${d}" fill="${fill}"${/(^|\s)stroke=/.test(extra) ? '' : ` stroke="${K}"`}${/stroke-width=/.test(extra) ? '' : ` stroke-width="${W}"`} stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const c = (x, y, r, fill = 'none') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${K}" stroke-width="${W}"/>`;
const dot = (x, y, r, fill = K) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;

const A = {
  hat: s('M8 36c4 3 28 3 32 0M12 35c0-6 2-20 4-25 4-2 12-2 16 0 2 5 4 19 4 25', '#7a3a6b') + s('M13 28c6 2 16 2 22 0v5c-6 2-16 2-22 0z', '#e3a81b') + s('M30 12c6-6 12-4 12-4-4 2-6 8-10 10', '#f3dca0'),
  notebook: s('M10 8h24a4 4 0 0 1 4 4v28H14a4 4 0 0 1-4-4z', '#c2412f') + s('M14 8v32M18 16h14M18 22h12', 'none') + s('M10 36a4 4 0 0 1 4-4h24', 'none'),
  tape: c(20, 22, 12, '#f2c14e') + c(20, 22, 4, '#fbf3df') + s('M20 34h20v6H20', '#f2c14e') + s('M26 34v3M31 34v3M36 34v3', 'none'),
  scissors: c(14, 34, 6, '#5bb7a6') + c(30, 34, 6, '#5bb7a6') + s('M18 30L34 8M26 30L12 8', 'none'),
  route: s('M8 38c8 0 6-10 14-10s6-12 14-12', 'none', 'stroke-dasharray="3 5"') + s('M36 6c-4 0-7 3-7 7 0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z', '#e8504f') + dot(36, 13, 2.4, '#fff') + c(9, 38, 3, '#5bb7a6'),
  drum: s('M8 18v14c0 4 7 7 16 7s16-3 16-7V18', '#e8504f') + `<ellipse cx="24" cy="18" rx="16" ry="6" fill="#fbf3df" stroke="${K}" stroke-width="${W}"/>` + s('M10 24l8 12M38 24l-8 12M24 25v14', 'none') + s('M16 4l6 10M32 4l-6 10', 'none'),
  bunting: s('M4 10c12 8 28 8 40 0', 'none') + s('M8 13l4 12 4-10z', '#e98bb5') + s('M18 16l4 12 4-12z', '#f2c14e') + s('M28 16l4 11 3-12z', '#5bb7a6') + s('M37 13l3 10 3-12z', '#e8504f'),
  needle: s('M10 38L36 10', 'none') + `<ellipse cx="35" cy="11" rx="2" ry="4" transform="rotate(45 35 11)" fill="#fff" stroke="${K}" stroke-width="2"/>` + s('M35 11c6 4 4 14-4 18s-12 10-6 14', 'none', `stroke="#e8504f"`),
  hammer: s('M22 18l16 20', 'none') + s('M8 12l10-6 10 12-10 6z', '#7a3a6b') + s('M24 26l14 16', 'none', 'stroke-width="5" stroke="#c98a4a"'),
  feather: s('M10 40C14 22 24 10 40 6c-2 16-12 28-30 34z', '#f3dca0') + s('M10 40L34 12M20 30l-6-2M26 24l-6-3M31 18l-5-3', 'none'),
  flower: [0, 72, 144, 216, 288].map(a => `<ellipse cx="24" cy="13" rx="6" ry="8" transform="rotate(${a} 24 24)" fill="#f2a7c3" stroke="${K}" stroke-width="2.2"/>`).join('') + c(24, 24, 5, '#f2c14e'),
  ribbon: s('M24 24C16 12 6 14 8 22s12 4 16 2c4 2 14 6 16-2s-8-10-16 2z', '#e98bb5') + s('M22 26l-8 16 6-2 2 6 4-18M26 26l6 16', '#e98bb5') + c(24, 24, 3.5, '#c2412f'),
  bow: s('M24 24L8 14v20zM24 24l16-10v20z', '#8e5bb5') + c(24, 24, 4.5, '#6e3f94'),
  tassels: s('M6 14h36', 'none', 'stroke-width="4"') + [10, 18, 26, 34].map(x => s(`M${x} 14v10m-3 0h6l1 14h-8z`, '#3b2a1a')).join(''),
  none: c(24, 24, 15) + s('M14 34L34 14', 'none'),
  star: s('M24 5l5.6 11.6 12.7 1.6-9.3 8.8 2.4 12.6L24 33.5 12.6 39.6 15 27 5.7 18.2l12.7-1.6z', '#f2c14e'),
  heart: s('M24 40S6 29 6 17a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 12-18 23-18 23z', '#e8504f'),
  spool: s('M12 8h24v6H12zM12 34h24v6H12z', '#c98a4a') + s('M15 14h18v20H15z', '#5bb7a6') + s('M15 19h18M15 24h18M15 29h18', 'none'),
  key: c(14, 24, 7, '#e3a81b') + dot(14, 24, 2.5, '#fbf3df') + s('M21 24h20M34 24v6M40 24v5', 'none', 'stroke-width="4"'),
  letter: s('M6 12h36v24H6z', '#fbf3df') + s('M6 12l18 14 18-14', 'none') + c(24, 26, 4, '#e8504f'),
  up: s('M14 24h6V10a4 4 0 0 1 8 0v8h8a4 4 0 0 1 4 5l-3 13a4 4 0 0 1-4 3H20zM6 24h8v16H6z', '#f2c14e'),
  down: s('M14 24h6v14a4 4 0 0 0 8 0v-8h8a4 4 0 0 0 4-5l-3-13a4 4 0 0 0-4-3H20zM6 24h8V8H6z', '#e3d8f5'),
  shh: c(24, 24, 17, '#f2c2a0') + dot(18, 20, 2.2) + dot(30, 20, 2.2) + s('M20 30h8', 'none') + s('M24 22v18', 'none', 'stroke-width="5" stroke="#d98f62"'),
  sleep: c(22, 26, 15, '#f2c2a0') + s('M15 24c2 2 4 2 6 0M25 24c2 2 4 2 6 0M19 32c2 1 4 1 6 0', 'none') + s('M34 6h7l-7 8h7', 'none', 'stroke="#7a3a6b"'),
  awake: c(24, 24, 17, '#f2c2a0') + c(18, 21, 4, '#fff') + c(30, 21, 4, '#fff') + dot(18, 21, 2) + dot(30, 21, 2) + `<ellipse cx="24" cy="32" rx="3" ry="4" fill="#7a2020" stroke="${K}" stroke-width="2"/>`,
  medal: s('M16 4l8 14 8-14', '#5bb7a6') + c(24, 30, 12, '#f2c14e') + s('M24 23l2.2 4.6 5 .6-3.7 3.4 1 5L24 34l-4.5 2.6 1-5-3.7-3.4 5-.6z', '#fff'),
  music: s('M18 34V10l20-4v24', 'none') + `<ellipse cx="13" cy="35" rx="6" ry="5" fill="#7a3a6b" stroke="${K}" stroke-width="${W}"/><ellipse cx="33" cy="31" rx="6" ry="5" fill="#7a3a6b" stroke="${K}" stroke-width="${W}"/>`,
  film: s('M6 10h36v28H6z', '#5bb7a6') + s('M20 18l10 6-10 6z', '#fbf3df'),
  mirror: `<ellipse cx="24" cy="20" rx="12" ry="15" fill="#cfe8f0" stroke="${K}" stroke-width="${W}"/>` + s('M24 35v8M16 43h16', 'none') + s('M18 14c2-3 5-4 7-4', 'none', 'stroke="#fff"'),
  ladder: s('M14 4v40M34 4v40M14 12h20M14 22h20M14 32h20M14 42h20', 'none', 'stroke="#8a5a2b" stroke-width="3.4"'),
  mic: s('M18 8a6 6 0 0 1 12 0v12a6 6 0 0 1-12 0z', '#7a3a6b') + s('M12 20a12 12 0 0 0 24 0M24 32v10M16 42h16', 'none'),
  crayon: s('M10 38l22-22 6 6-22 22H10z', '#e8504f') + s('M32 16l4-6 6 6-6 4', '#f2c14e') + s('M14 34l6 6', 'none'),
  comb: s('M8 18h32v8H8z', '#e3a81b') + [11, 15, 19, 23, 27, 31, 35].map(x => s(`M${x} 26v12`, 'none')).join(''),
  bulb: s('M17 30c-5-4-7-9-5-14a12 12 0 0 1 24 0c2 5 0 10-5 14v4H17z', '#f2c14e') + s('M18 38h12M20 42h8', 'none'),
  chat: s('M6 10h36v22H20l-8 8v-8H6z', '#fbf3df') + dot(16, 21, 2.4) + dot(24, 21, 2.4) + dot(32, 21, 2.4),
  book: s('M6 10c6-2 12-2 18 2v28c-6-4-12-4-18-2z', '#5bb7a6') + s('M42 10c-6-2-12-2-18 2v28c6-4 12-4 18-2z', '#5bb7a6'),
  clock: c(24, 24, 17, '#fbf3df') + s('M24 13v11l7 5', 'none'),
  flame: s('M24 42c-9 0-13-7-11-14 2-6 7-8 7-16 6 4 10 9 9 15 3-2 3-5 3-7 5 5 6 10 4 15-2 4-6 7-12 7z', '#f2944a') + s('M24 42c-4 0-6-3-5-6 1-3 4-4 4-8 3 3 6 6 5 10-1 3-2 4-4 4z', '#f2c14e'),
  speaker: s('M8 18h8l10-8v28l-10-8H8z', '#5bb7a6') + s('M32 18a8 8 0 0 1 0 12M36 13a14 14 0 0 1 0 22', 'none'),
  game: s('M8 18c0-4 3-6 7-6h18c4 0 7 2 7 6l2 14c0 4-4 6-7 3l-4-5H17l-4 5c-3 3-7 1-7-3z', '#7a3a6b') + s('M15 20v6M12 23h6', 'none', 'stroke="#fff"') + dot(31, 21, 2.2, '#f2c14e') + dot(35, 25, 2.2, '#e8504f'),
  image: s('M6 10h36v28H6z', '#a7d7e8') + s('M6 34l10-10 8 8 6-5 12 9', '#5c9e3c') + c(32, 18, 3.5, '#f2c14e'),
  pencil: s('M10 38l4-10 20-20 6 6-20 20z', '#f2c14e') + s('M30 12l6 6M10 38l10-4', 'none'),
  wave: s('M4 28c5-6 10-6 15 0s10 6 15 0 8-6 10-3', 'none', 'stroke="#1a8fe0" stroke-width="4"') + s('M4 36c5-6 10-6 15 0s10 6 15 0 8-6 10-3', 'none', 'stroke="#5bb7a6" stroke-width="4"'),
  house: s('M8 22L24 8l16 14v18H8z', '#f0a25a') + s('M20 40V28h8v12', '#c2412f'),
  // explorer buddies (avatars)
  ibis: c(24, 26, 15, '#fdfbf5') + c(24, 14, 8, '#1b1b2f') + s('M30 15c8 2 10 8 12 14', 'none', 'stroke="#f0a020" stroke-width="3.4"') + dot(27, 13, 1.8, '#fff') + s('M16 30c4 3 10 3 14 0', 'none', 'stroke="#1a8fe0"'),
  cat: s('M10 14l4 12h20l4-12-8 6h-12z', '#f2c14e') + c(24, 28, 13, '#f2c14e') + dot(19, 27, 2.2) + dot(29, 27, 2.2) + s('M22 32l2 2 2-2M12 30h-6M36 30h6', 'none'),
  camel: s('M8 30c0-8 4-14 10-14 4 0 4 6 8 6s4-6 8-6 6 6 6 14z', '#d9a460') + s('M14 30v12M34 30v12M38 18c2-4 6-6 6-2', 'none') + dot(42, 14, 1.8),
  fish: s('M6 24c6-10 22-12 30 0-8 12-24 10-30 0zM36 24l8-8v16z', '#f2944a') + dot(16, 22, 2.4) + s('M22 18c2 4 2 8 0 12', 'none'),
  owl: s('M10 12l6 6h16l6-6v20c0 6-6 10-14 10s-14-4-14-10z', '#b38bd6') + c(18, 24, 5, '#fff') + c(30, 24, 5, '#fff') + dot(18, 24, 2.2) + dot(30, 24, 2.2) + s('M22 30l2 3 2-3z', '#f2944a'),
  turtle: s('M8 30c0-10 8-16 16-16s16 6 16 16z', '#5c9e3c') + s('M14 30l4-8h12l4 8M24 14v8', 'none') + c(42, 28, 4, '#9ad06a') + s('M12 30v6M34 30v6', 'none'),
};

export const ART_NAMES = Object.keys(A);
const svg = n => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${A[n] || ''}</svg>`;
const URLS = {};
export const artUrl = n => (URLS[n] ||= 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(n)));
export function Art({ n, size = 24, title, style }) {
  return <img className="art" src={artUrl(n)} width={size} height={size} alt={title || ''} aria-hidden={title ? undefined : true} style={{ verticalAlign: '-0.25em', ...style }} draggable="false" />;
}
/** for <canvas>: a ready Image of an icon */
const IMGS = {};
export function artImage(n) { if (!IMGS[n]) { const im = new Image(); im.src = artUrl(n); IMGS[n] = im; } return IMGS[n]; }
