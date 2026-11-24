// Zizoun's Hat Town: one connected 3D town. Every scene of the week happens in a real place here and
// the camera travels between them. Low-poly sets + soft toon characters, in the book's palette:
// dusty mauve and plum, mustard, teal and cream, purple swirl trees and cactus blobs.
import * as THREE from 'three';
import { Character, T, mk, EXTRA } from './chars3d';
import { buildHat } from './hat3d';

THREE.ColorManagement.enabled = false;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const C = (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);
const S = (r, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h);
const F = (c, o = {}) => new THREE.MeshPhongMaterial({ color: c, flatShading: true, shininess: 4, ...o }); // set dressing: low-poly
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function gradTex(stops) { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, 4, 256); return new THREE.CanvasTexture(c); }
const SKIES = {
  day: gradTex([[0, '#b97aa0'], [0.45, '#e2b3c6'], [0.8, '#f8e4d2'], [1, '#fff3df']]),
  dusk: gradTex([[0, '#3e2347'], [0.5, '#7a4a72'], [1, '#c98a8a']]),
  gold: gradTex([[0, '#e59a6b'], [0.5, '#f7cf9a'], [1, '#fff1cf']]),
};

/* ---------- town dressing ---------- */
/** a soft curved feather (vane + quill + barbs), like the ones floating through the book */
export function featherMesh(len = 1) {
  const g = new THREE.Group(), cream = F('#f3dca0'), dark = F('#c9a35c');
  const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push(new THREE.Vector2(Math.sin(u * Math.PI) * (0.22 - u * 0.08) * len, u * len)); }
  const vane = mk(new THREE.LatheGeometry(pts, 10), cream); vane.scale.z = 0.18; g.add(vane);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.18 * len, 0), new THREE.Vector3(0, 0.5 * len, 0.02 * len), new THREE.Vector3(0.05 * len, 1.02 * len, 0.06 * len)]);
  g.add(mk(new THREE.TubeGeometry(curve, 12, 0.014 * len, 5, false), dark));
  for (let i = 1; i < 7; i++) { const y = i / 7 * len, w = Math.sin(i / 7 * Math.PI) * 0.18 * len; [-1, 1].forEach(sx => { const b = at(mk(C(0.006 * len, 0.006 * len, w, 3), dark, false), sx * w / 2, y - 0.04 * len, 0.03 * len); b.rotation.z = sx * 1.2; g.add(b); }); }
  g.rotation.z = 0.15; return g;
}
export function swirlTree(s = 1) {
  const g = new THREE.Group(), h = 2.8;
  const trunk = at(mk(C(0.22, 0.45, h, 8), F('#d9c2dd')), 0, h / 2, 0); trunk.rotation.z = 0.12; g.add(trunk);
  for (let i = 0; i < 4; i++) { const r = at(mk(new THREE.TorusGeometry(0.26, 0.06, 5, 10), F('#9b6fa6')), 0.06, 0.5 + i * 0.55, 0.3); r.rotation.y = 0.3; g.add(r); }
  for (let i = 0; i < 3; i++) { const root = at(mk(C(0.06, 0.16, 0.9, 6), F('#cdb2d2')), Math.cos(i * 2.1) * 0.4, 0.25, Math.sin(i * 2.1) * 0.4); root.rotation.set(Math.sin(i * 2.1) * 0.9, 0, -Math.cos(i * 2.1) * 0.9); g.add(root); }
  const cap = at(mk(new THREE.SphereGeometry(1.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.9), F('#b4527a')), 0, h, 0); cap.scale.y = 0.72; g.add(cap);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const d = at(mk(new THREE.TorusGeometry(0.2, 0.05, 4, 10), F(i % 2 ? '#e6a7c4' : '#8fd3c7')), Math.cos(a) * 1.0, h + 0.42, Math.sin(a) * 1.0); d.lookAt(0, h + 3, 0); g.add(d); }
  g.scale.setScalar(s); return g;
}
export function cactus(s = 1) {
  const g = new THREE.Group();
  [[0, 0.5, 0, 0.5, '#7fbf4d'], [0.42, 0.3, 0.12, 0.34, '#9ad06a'], [-0.4, 0.28, -0.1, 0.3, '#9ad06a']].forEach(([x, y, z, r, c]) => g.add(at(mk(new THREE.CapsuleGeometry(r, r * 1.3, 3, 8), F(c)), x, y + r, z)));
  g.scale.setScalar(s); return g;
}
function bunting(a, b, sag = 0.8, n = 12) {
  const g = new THREE.Group(), cols = ['#e98bb5', '#a7d7e8', '#f2c14e', '#e8504f', '#9ad1c6'];
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20; const p = A.clone().lerp(B, u); p.y -= Math.sin(u * Math.PI) * sag; pts.push(p); }
  g.add(mk(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.02, 4), F('#7a5a3a'), false));
  for (let i = 1; i < n; i++) { const u = i / n; const p = A.clone().lerp(B, u); p.y -= Math.sin(u * Math.PI) * sag; const f = at(mk(new THREE.ConeGeometry(0.2, 0.42, 3), F(cols[i % 5]), false), p.x, p.y - 0.22, p.z); f.rotation.x = Math.PI; f.rotation.y = Math.atan2(B.x - A.x, B.z - A.z) + Math.PI / 2; g.add(f); }
  return g;
}

/* ---------- the shop (cover, p.5): round orange house wearing a giant wavy purple hat ---------- */
function buildShop() {
  const g = new THREE.Group();
  const yard = at(mk(C(7, 7.4, 0.3, 20), F('#f3dcb0')), 0, 0.12, 0); g.add(yard);
  const house = at(mk(C(2.6, 3.0, 3.6, 16), F('#f0a25a')), 0, 2.1, 0); g.add(house);
  // painted swirls on the walls
  for (let i = 0; i < 10; i++) { const a = -1.2 + i * 0.27; const sw = at(mk(new THREE.TorusGeometry(0.16, 0.035, 4, 10), F('#f6bd7c'), false), Math.sin(a) * 2.82, 1.0 + (i % 3) * 1.0, Math.cos(a) * 2.82); sw.lookAt(0, sw.position.y, 0); g.add(sw); }
  const sign = at(mk(new THREE.BoxGeometry(2.0, 0.55, 0.14), F('#9c4f2c')), -0.5, 3.2, 2.75); sign.rotation.z = 0.08; g.add(sign);
  const sc = document.createElement('canvas'); sc.width = 256; sc.height = 64; const sx = sc.getContext('2d'); sx.fillStyle = '#9c4f2c'; sx.fillRect(0, 0, 256, 64); sx.fillStyle = '#fbe6c2'; sx.font = 'bold 34px "Baloo Bhaijaan 2", sans-serif'; sx.textAlign = 'center'; sx.textBaseline = 'middle'; sx.direction = 'rtl'; sx.fillText('زيزون للقبعات', 128, 34);
  const signFace = at(new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.48), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc) })), -0.5, 3.2, 2.83); signFace.rotation.z = 0.08; g.add(signFace);
  // window: 3×3 panes that light up line by line
  const frame = at(mk(new THREE.BoxGeometry(1.15, 1.15, 0.12), F('#3a2a2a')), -0.8, 1.75, 2.82); g.add(frame);
  const panes = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const p = at(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), new THREE.MeshBasicMaterial({ color: '#4a3a46' })), -1.15 + c * 0.35, 2.1 - r * 0.35, 2.9); panes.push(p); g.add(p); }
  const glow = at(new THREE.PointLight('#ffcf7a', 0, 7), -0.8, 1.8, 3.6); g.add(glow);
  const door = at(new THREE.Group(), 0.35, 0.3, 2.86); const dm = at(mk(new THREE.BoxGeometry(0.85, 1.7, 0.1), F('#c2412f')), 0.42, 0.85, 0); door.add(dm); door.add(at(mk(S(0.06, 6, 4), F('#e3a81b')), 0.74, 0.85, 0.08)); g.add(door);
  // the giant hat roof
  const brim = at(mk(new THREE.TorusGeometry(3.0, 0.55, 8, 24), F('#5a2a4f')), 0, 3.95, 0); brim.rotation.x = Math.PI / 2; brim.scale.z = 0.55; g.add(brim);
  const prof = []; for (let i = 0; i <= 12; i++) prof.push(new THREE.Vector2(2.35 - i * 0.1 + Math.sin(i * 1.3) * 0.12, i * 0.42));
  const crown = at(mk(new THREE.LatheGeometry(prof, 16), F('#7a3a6b', { side: THREE.DoubleSide })), 0, 4.0, 0); crown.rotation.z = -0.07; g.add(crown);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const st = at(mk(C(0.04, 0.04, 4.6, 4), F('#9a5a8a'), false), Math.cos(a) * 1.95, 6.4, Math.sin(a) * 1.95); st.rotation.z = -0.07; g.add(st); }
  { const _m = at(mk(new THREE.CircleGeometry(1.1, 16), F('#7a3a6b')), 0.35, 9.05, 0); _m.rotation.x = -Math.PI / 2; g.add(_m); }
  g.add(at(mk(new THREE.BoxGeometry(0.6, 1.5, 0.6), F('#d98a4a')), 1.3, 8.6, 0.4));
  const feather = at(featherMesh(5), -1.9, 4.6, 0.8); feather.rotation.set(0.1, 0.35, 0.6); g.add(feather);
  // ribbon posts, microphone and bunting for the reopening (hidden until day 7)
  const fest = new THREE.Group(); fest.visible = false; g.add(fest);
  fest.add(bunting([-6.5, 4.2, 4], [6.5, 4.2, 4], 1.2, 16)); fest.add(bunting([-6.5, 3.5, 6], [6.5, 3.5, 6], 0.9, 14));
  [-6.5, 6.5].forEach(x => fest.add(at(mk(C(0.08, 0.1, 4.4, 6), F('#8a5a2b')), x, 2.2, 5)));
  const ribbon = new THREE.Group(); at(ribbon, 0, 0, 6.6); fest.add(ribbon);
  [-1.6, 1.6].forEach(x => { ribbon.add(at(mk(C(0.1, 0.12, 1.3, 8), F('#c9a35c')), x, 0.65, 0)); ribbon.add(at(mk(S(0.13, 8, 6), F('#c9a35c')), x, 1.35, 0)); });
  const halves = [-1, 1].map(s => { const h = at(new THREE.Group(), s * 1.6, 1.1, 0); h.add(at(mk(new THREE.BoxGeometry(1.6, 0.16, 0.05), F('#e2302f')), -s * 0.8, 0, 0)); ribbon.add(h); return h; });
  const bow = at(mk(S(0.18, 8, 6), F('#e2302f')), 0, 1.1, 0.05); ribbon.add(bow);
  const mic = at(new THREE.Group(), 2.3, 0, 6.2); mic.add(at(mk(C(0.025, 0.025, 1.4, 6), F('#aab0b8')), 0, 0.7, 0)); mic.add(at(mk(S(0.09, 8, 6), F('#33363d')), 0, 1.45, 0)); mic.add(at(mk(C(0.2, 0.2, 0.03, 10), F('#aab0b8')), 0, 0.02, 0)); fest.add(mic);
  const stage = at(mk(C(1.4, 1.5, 0.25, 16), F('#c98fb0')), 2.3, 0.12, 6.2); fest.add(stage); mic.position.y = 0.25;
  g.userData = { panes, glow, door: door, fest, ribbon: { halves, bow }, feather };
  return g;
}

/* ---------- Zizoun's living room (pp. 10–11), open on the camera side ---------- */
function buildHouse() {
  const g = new THREE.Group(); const pick = (o, id) => { o.traverse(c => { c.userData.pick = id; }); return o; };
  g.add(at(mk(new THREE.BoxGeometry(9, 0.2, 6), F('#a9d6d2')), 0, 0, 0));
  g.add(at(mk(new THREE.BoxGeometry(9, 5, 0.2), F('#fbf3df')), 0, 2.5, -3));
  g.add(at(mk(new THREE.BoxGeometry(0.2, 5, 6), F('#f6e8cc')), -4.5, 2.5, 0));
  g.add(at(mk(new THREE.BoxGeometry(9.2, 0.25, 0.3), F('#c98fb0')), 0, 5, -2.9));
  // red sofa
  const sofa = at(new THREE.Group(), 0.4, 0, -1.9); g.add(sofa);
  const red = F('#b3333f'); sofa.add(at(mk(new THREE.BoxGeometry(3.6, 0.6, 1.3), red), 0, 0.55, 0)); sofa.add(at(mk(new THREE.BoxGeometry(3.6, 1.1, 0.35), red), 0, 1.2, -0.5));
  [-1.95, 1.95].forEach(x => sofa.add(at(mk(new THREE.BoxGeometry(0.35, 0.95, 1.3), red), x, 0.75, 0)));
  for (let i = 0; i < 6; i++) sofa.add(at(mk(new THREE.BoxGeometry(0.04, 0.6, 1.32), F('#d9636c'), false), -1.5 + i * 0.6, 0.56, 0.0));
  const blanket = pick(at(mk(new THREE.BoxGeometry(1.1, 0.25, 1.35), F('#3f8f8c')), 1.6, 1.0, 0), 'blanket'); blanket.rotation.z = -0.12; sofa.add(blanket);
  // side table with a drawer and a lamp
  const table = at(new THREE.Group(), -3.0, 0, -1.6); g.add(table);
  table.add(at(mk(new THREE.BoxGeometry(1.0, 0.9, 0.8), F('#e8c98a')), 0, 0.75, 0)); [-0.4, 0.4].forEach(x => table.add(at(mk(C(0.04, 0.04, 0.5, 5), F('#8a5a2b')), x, 0.25, 0.3)));
  const drawer = pick(at(mk(new THREE.BoxGeometry(0.8, 0.3, 0.1), F('#d7a95e')), 0, 0.85, 0.42), 'drawer'); table.add(drawer); table.add(at(mk(S(0.05, 6, 4), F('#5a2a1a')), 0, 0.85, 0.5));
  const lamp = pick(new THREE.Group(), 'lamp'); at(lamp, 0, 1.2, -0.1); lamp.add(at(mk(C(0.04, 0.04, 1.1, 6), F('#e3a81b')), 0, 0.55, 0)); const shade = at(mk(new THREE.ConeGeometry(0.45, 0.6, 10, 1, true), F('#7a2f4e', { side: THREE.DoubleSide })), 0, 1.25, 0); lamp.add(shade);
  for (let i = 0; i < 10; i++) lamp.add(at(mk(C(0.015, 0.015, 0.14, 3), F('#fbf3df'), false), Math.cos(i * 0.63) * 0.43, 0.92, Math.sin(i * 0.63) * 0.43)); table.add(lamp);
  // pictures and the sunburst mirror
  const frame = pick(new THREE.Group(), 'frame'); at(frame, -2.6, 3.4, -2.85); frame.add(mk(new THREE.BoxGeometry(1.2, 1.5, 0.08), F('#8a5a3a'))); frame.add(at(mk(new THREE.BoxGeometry(1.0, 1.3, 0.05), F('#f8f1e0')), 0, 0, 0.04));
  [[-0.15, 0.2, '#7a2f4e'], [0.2, -0.15, '#9b3a5e']].forEach(([x, y, c]) => frame.add(at(mk(S(0.14, 8, 6), F(c)), x, y, 0.08))); g.add(frame);
  g.add(at(mk(new THREE.BoxGeometry(0.35, 0.45, 0.06), F('#e3a81b')), -1.6, 3.6, -2.88));
  const mirror = pick(new THREE.Group(), 'mirror'); at(mirror, 2.4, 3.4, -2.85); mirror.add(mk(new THREE.CircleGeometry(0.45, 20), new THREE.MeshPhongMaterial({ color: '#cfe8f0', shininess: 80 })));
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const r = at(mk(new THREE.ConeGeometry(0.08, 0.38, 4), F('#b8873a')), Math.cos(a) * 0.62, Math.sin(a) * 0.62, -0.02); r.rotation.z = a - Math.PI / 2; mirror.add(r); }
  mirror.add(at(mk(new THREE.TorusGeometry(0.47, 0.05, 6, 20), F('#b8873a')), 0, 0, 0)); g.add(mirror);
  const under = pick(at(mk(new THREE.BoxGeometry(3.2, 0.25, 0.3), F('#7a2026')), 0.4, 0.15, -1.15), 'floor'); g.add(under);
  const plant = at(new THREE.Group(), 3.8, 0, -2.2); plant.add(at(mk(C(0.25, 0.35, 0.9, 8), F('#8a5a8a')), 0, 0.45, 0)); for (let i = 0; i < 7; i++) { const l = at(mk(new THREE.ConeGeometry(0.1, 0.6, 4), F('#6a9ab0')), Math.cos(i) * 0.2, 1.2 + (i % 3) * 0.2, Math.sin(i) * 0.2); l.rotation.set(Math.sin(i) * 0.5, 0, Math.cos(i) * 0.5); plant.add(l); } g.add(plant);
  // the newspaper Zizoun hides behind
  const nc = document.createElement('canvas'); nc.width = 128; nc.height = 96; const nx = nc.getContext('2d'); nx.fillStyle = '#f2efe6'; nx.fillRect(0, 0, 128, 96); nx.fillStyle = '#9a9a9a'; for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) nx.fillRect(8 + j * 60, 10 + i * 9, 50, 3); nx.fillStyle = '#555'; nx.fillRect(8, 4, 110, 4);
  const paper = at(new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(nc), side: THREE.DoubleSide })), 0.4, 1.85, -1.05); paper.rotation.x = -0.1; g.add(paper);
  const key = at(new THREE.Group(), 1.9, 1.25, -1.7); key.add(mk(new THREE.TorusGeometry(0.08, 0.025, 6, 12), F('#e3a81b'))); key.add(at(mk(new THREE.BoxGeometry(0.22, 0.04, 0.04), F('#e3a81b')), 0.15, 0, 0)); key.visible = false; g.add(key);
  const book = at(mk(new THREE.BoxGeometry(0.5, 0.08, 0.36), F('#c2412f')), -3.0, 1.32, -1.0); book.visible = false; g.add(book);
  g.userData = { paper, key, book };
  return g;
}

/* ---------- Said's design corner (pp. 9, 14–15) ---------- */
function buildStudio() {
  const g = new THREE.Group();
  g.add(at(mk(new THREE.BoxGeometry(9, 0.2, 6), F('#f0d6a8')), 0, 0, 0));
  g.add(at(mk(new THREE.BoxGeometry(9, 5, 0.2), F('#e9d3ef')), 0, 2.5, -3));
  for (let i = 0; i < 6; i++) g.add(at(mk(new THREE.TorusGeometry(0.3, 0.04, 4, 12), F('#d7b8e2'), false), -3.6 + i * 1.45, 3.9, -2.88));
  const table = at(new THREE.Group(), -1.2, 0, -0.8); g.add(table);
  table.add(at(mk(new THREE.BoxGeometry(2.6, 0.12, 1.3), F('#c98a4a')), 0, 1.0, 0)); [[-1.2, -0.55], [1.2, -0.55], [-1.2, 0.55], [1.2, 0.55]].forEach(([x, z]) => table.add(at(mk(C(0.05, 0.05, 1, 5), F('#8a5a2b')), x, 0.5, z)));
  const machine = at(new THREE.Group(), -0.4, 1.06, 0); machine.add(at(mk(new THREE.BoxGeometry(0.9, 0.25, 0.4), F('#2d3a8c')), 0, 0.12, 0)); machine.add(at(mk(new THREE.BoxGeometry(0.22, 0.6, 0.35), F('#2d3a8c')), 0.33, 0.45, 0)); machine.add(at(mk(new THREE.BoxGeometry(0.8, 0.2, 0.3), F('#2d3a8c')), 0.0, 0.75, 0)); machine.add(at(mk(C(0.02, 0.02, 0.3, 4), F('#ccc')), -0.3, 0.5, 0)); table.add(machine);
  ['#e98bb5', '#5bb7a6', '#f2c14e', '#7a3a6b', '#e8504f'].forEach((c, i) => { const r = at(mk(C(0.13, 0.13, 1.1, 10), F(c)), 0.6 + (i % 3) * 0.28, 1.2 + Math.floor(i / 3) * 0.26, 0.2); r.rotation.z = Math.PI / 2; table.add(r); });
  const cup = at(mk(C(0.13, 0.11, 0.3, 10), F('#f2a7c3')), 1.1, 1.2, -0.4); table.add(cup); for (let i = 0; i < 4; i++) table.add(at(mk(C(0.015, 0.015, 0.4, 4), F(['#e8504f', '#2d3a8c', '#f2c14e', '#5c9e3c'][i])), 1.05 + i * 0.03, 1.45, -0.4));
  // shelf for the week's hats (Workshop Beat)
  const shelf = at(new THREE.Group(), 2.6, 0, -2.5); g.add(shelf);
  [1.4, 2.6].forEach(y => shelf.add(at(mk(new THREE.BoxGeometry(3.2, 0.12, 0.7), F('#8a5a2b')), 0, y, 0)));
  const slots = []; for (let i = 0; i < 7; i++) slots.push(at(new THREE.Group(), -1.3 + (i % 4) * 0.85, i < 4 ? 1.48 : 2.68, 0.05)); slots.forEach(s => shelf.add(s));
  const stand = at(new THREE.Group(), 3.4, 0, 0.6); stand.add(at(mk(C(0.04, 0.12, 1.4, 6), F('#8a5a2b')), 0, 0.7, 0)); stand.add(at(mk(S(0.24, 10, 8), F('#f0d6a8')), 0, 1.55, 0)); g.add(stand);
  for (let i = 0; i < 5; i++) { const p = at(mk(new THREE.PlaneGeometry(0.5, 0.4), F('#ffffff', { side: THREE.DoubleSide })), -3.6 + i * 0.5, 0.12, 1.2 + (i % 2) * 0.4); p.rotation.x = -Math.PI / 2; p.rotation.z = i; g.add(p); }
  g.userData = { slots };
  return g;
}

/* ---------- the customers' homes (fact cards pp. 26–27) ---------- */
const ground = (col, r = 6.5) => at(mk(C(r, r + 0.3, 0.25, 22), F(col)), 0, 0.1, 0);
function buildPatch() { const g = new THREE.Group(); g.add(ground('#b9d98a'));
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { const p = at(new THREE.Group(), -4 + i * 1.6, 0.2, -4 + r * 1.3); if (Math.abs(-4 + i * 1.6) < 2 && r === 2) continue; for (let k = 0; k < 4; k++) { const l = at(mk(new THREE.ConeGeometry(0.18, 0.4, 4), F('#5c9e3c')), Math.cos(k * 1.6) * 0.18, 0.15, Math.sin(k * 1.6) * 0.18); l.rotation.set(Math.sin(k * 1.6) * 1.2, 0, -Math.cos(k * 1.6) * 1.2); p.add(l); } p.add(at(mk(S(0.14, 8, 6), F('#e2473f')), 0.15, 0.1, 0.15)); g.add(p); }
  g.add(at(swirlTree(0.8), 4.6, 0, -2)); g.add(at(cactus(0.8), -5, 0.2, 1)); return g; }
function buildPond() { const g = new THREE.Group(); g.add(ground('#b9d98a'));
  const w = at(mk(C(3.6, 3.6, 0.1, 24), new THREE.MeshPhongMaterial({ color: '#5bb7c9', shininess: 90, specular: '#e0fbff' })), 0.5, 0.25, -1.5); g.add(w);
  for (let i = 0; i < 5; i++) { const lp = at(mk(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 10, 1, false, 0, Math.PI * 1.8), F('#5c9e3c')), 0.5 + Math.cos(i * 1.3) * 2.2, 0.32, -1.5 + Math.sin(i * 1.3) * 2); g.add(lp); }
  for (let i = 0; i < 9; i++) g.add(at(mk(C(0.03, 0.04, 1.2 + (i % 3) * 0.3, 4), F('#6b8c3a')), -3.2 + (i % 3) * 0.2, 0.7, -3 + i * 0.3));
  g.add(at(mk(new THREE.BoxGeometry(1.2, 0.3, 1.2), F('#a3c06a')), -1.6, 0.35, 1.1));
  g.add(at(swirlTree(0.75), 4.8, 0, -3)); return g; }
function buildLake() { const g = new THREE.Group(); g.add(ground('#c9df8f', 7));
  g.add(at(mk(C(5, 5, 0.1, 28), new THREE.MeshPhongMaterial({ color: '#7cc7d8', shininess: 90, specular: '#e0fbff' })), 0, 0.24, -3.5));
  for (let i = 0; i < 12; i++) g.add(at(mk(C(0.03, 0.04, 1.4, 4), F('#6b8c3a')), -4.8 + i * 0.25, 0.8, 0.8 + Math.sin(i) * 0.3));
  const ladder = at(new THREE.Group(), -1.2, 0, 0.3); [-0.3, 0.3].forEach(x => ladder.add(at(mk(new THREE.BoxGeometry(0.08, 3.2, 0.08), F('#8a5a2b')), x, 1.6, 0))); for (let i = 0; i < 7; i++) ladder.add(at(mk(new THREE.BoxGeometry(0.6, 0.06, 0.06), F('#a8743a')), 0, 0.35 + i * 0.42, 0)); ladder.visible = false; g.add(ladder);
  g.add(at(swirlTree(0.9), 5.2, 0, -1)); g.userData = { ladder }; return g; }
function buildField() { const g = new THREE.Group(); g.add(ground('#d9c27a'));
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { const x = -5 + i * 1.25, z = -4.5 + r * 1.2; const s = at(new THREE.Group(), x, 0.2, z); s.add(at(mk(C(0.05, 0.07, 2.4, 5), F('#7f9e3a')), 0, 1.2, 0)); for (let k = 0; k < 3; k++) { const l = at(mk(new THREE.ConeGeometry(0.1, 1.0, 3), F('#8fb24a')), 0, 0.8 + k * 0.5, 0); l.rotation.z = (k % 2 ? 1 : -1) * 1.0; s.add(l); } s.add(at(mk(new THREE.CapsuleGeometry(0.1, 0.3, 3, 6), F('#f2c230')), 0.1, 1.6, 0)); g.add(s); }
  return g; }
function buildDunes() { const g = new THREE.Group(); g.add(ground('#f2d28d', 7));
  [[-3.5, -3, 2.4], [3, -3.5, 2], [5, 0, 1.4], [-5, 0.5, 1.2]].forEach(([x, z, r]) => { const d = at(mk(S(r, 12, 8), F('#ecc77a')), x, 0, z); d.scale.y = 0.45; g.add(d); });
  const hole = at(mk(C(0.9, 0.9, 0.04, 16), F('#c9a35c')), 0, 0.24, 0); g.add(hole);
  g.add(at(cactus(1.1), -2.4, 0.2, 1.4)); g.add(at(cactus(0.9), 2.8, 0.2, 1.2)); g.add(at(cactus(0.7), 4.2, 0.2, -2)); return g; }

/* ---------- camera + places ---------- */
export const PLACES = {
  shop: { r: 7.1, floor: 0.27, o: [0, 0, 0], build: buildShop, cam: [0, 3.6, 15.5], look: [0, 2.6, 2], wide: [0, 8, 24], wlook: [0, 3.5, 0] },
  house: { room: [4.5, 3], floor: 0.1, o: [-38, 0, 2], build: buildHouse, cam: [0, 3.6, 8.5], look: [0, 1.6, -1] },
  studio: { room: [4.5, 3], floor: 0.1, o: [38, 0, 2], build: buildStudio, cam: [0, 3.4, 8.2], look: [0, 1.5, -0.8] },
  patch: { r: 6.6, floor: 0.225, o: [-58, 0, -42], build: buildPatch, cam: [0, 3.2, 8.5], look: [0, 1.4, 0] },
  pond: { r: 6.6, floor: 0.225, o: [-20, 0, -42], build: buildPond, cam: [0, 3.2, 8.5], look: [0, 1.3, 0] },
  lake: { r: 7.1, floor: 0.225, o: [20, 0, -42], build: buildLake, cam: [0, 3.6, 9.5], look: [0, 2.0, 0] },
  field: { r: 6.6, floor: 0.225, o: [58, 0, -42], build: buildField, cam: [0, 3.2, 8.5], look: [0, 1.5, 0] },
  dunes: { r: 7.1, floor: 0.225, o: [0, 0, -84], build: buildDunes, cam: [0, 3.6, 9.5], look: [0, 1.9, 0] },
};
const v3 = a => new THREE.Vector3(...a);

export class HatTown {
  constructor(canvas) {
    this.canvas = canvas; this.alive = true; this.T = 0; this.tweens = []; this.onPick = null;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    r.outputColorSpace = THREE.LinearSRGBColorSpace; r.useLegacyLights = true; r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const sc = this.scene = new THREE.Scene(); sc.background = SKIES.day; sc.fog = new THREE.Fog('#efd3d6', 45, 150);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
    this.hemi = new THREE.HemisphereLight('#fff1f4', '#b07a90', 0.72); sc.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight('#fff0d8', 0.62); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 80 }); sun.shadow.bias = -0.0008; sc.add(sun); sc.add(sun.target);
    // the land: cream sand, grass meadows, paths joining every place
    const land = mk(new THREE.CircleGeometry(150, 48), F('#f1d9ae'), false); land.rotation.x = -Math.PI / 2; sc.add(land);
    [[-30, -20, 30], [30, -20, 30], [0, -60, 34], [-70, -10, 22], [70, -10, 22]].forEach(([x, z, r]) => { const m = mk(new THREE.CircleGeometry(r, 24), F('#cfe0a0'), false); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z); sc.add(m); });
    const path = (a, b) => { const A = v3(a), B = v3(b), d = B.clone().sub(A), len = d.length(); const p = mk(new THREE.PlaneGeometry(2.4, len), F('#fbe9c8'), false); p.rotation.x = -Math.PI / 2; p.rotation.z = -Math.atan2(d.x, d.z) + Math.PI; p.position.copy(A.clone().add(B).multiplyScalar(0.5)); p.position.y = 0.04; sc.add(p); };
    const P = PLACES; ['house', 'studio', 'pond', 'lake'].forEach(k => path(P.shop.o, P[k].o)); path(P.pond.o, P.patch.o); path(P.lake.o, P.field.o); path(P.pond.o, P.dunes.o); path(P.lake.o, P.dunes.o);
    // purple swirl trees, cactus blobs and clouds all around
    let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 46; i++) { const x = rnd() * 180 - 90, z = rnd() * 150 - 120; if (Object.values(P).some(p => Math.hypot(p.o[0] - x, p.o[2] - z) < 11) || Math.abs(x) < 4) continue; const o = rnd() < 0.6 ? swirlTree(0.7 + rnd() * 0.6) : cactus(0.8 + rnd() * 0.8); o.position.set(x, 0, z); o.rotation.y = rnd() * 6; sc.add(o); }
    this.clouds = []; for (let i = 0; i < 9; i++) { const c = new THREE.Group(); [[0, 0, 0, 2], [2, -0.3, 0, 1.5], [-2, -0.3, 0, 1.4]].forEach(([x, y, z, rr]) => c.add(at(mk(new THREE.IcosahedronGeometry(rr, 1), new THREE.MeshPhongMaterial({ color: '#fff8fb', flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.25 }), false), x, y, z))); c.position.set(-90 + i * 22, 20 + rnd() * 8, -110 + rnd() * 60); sc.add(c); this.clouds.push(c); }
    // floating feathers, like the pages of the book
    this.feathers = []; for (let i = 0; i < 14; i++) { const f = featherMesh(0.6); f.traverse(o => { o.castShadow = false; }); f.position.set(rnd() * 30 - 15, 2 + rnd() * 8, rnd() * 10 - 8); f.userData.s = rnd(); sc.add(f); this.feathers.push(f); }
    // places
    this.places = {}; for (const [k, p] of Object.entries(P)) { const g = p.build(); g.position.set(...p.o); sc.add(g); this.places[k] = g; }
    EXTRA.shop = () => { const g = buildShop(); g.userData.top = 10; g.scale.setScalar(0.2); g.userData.top = 2; return g; };
    // the cast
    this.chars = {}; for (const id of ['said', 'zizoun', 'frog', 'corn', 'strawberry', 'swan', 'ostrich']) { const c = new Character(id); c.root.visible = false; sc.add(c.root); this.chars[id] = c; }
    this.props = new THREE.Group(); sc.add(this.props);
    this.cam = { pos: new THREE.Vector3(0, 14, 34), look: new THREE.Vector3(0, 3, 0) };
    this.place = 'shop'; this.state = {};
    this._resize = () => this.resize(); addEventListener('resize', this._resize); this.resize();
    this._bind();
    this.last = performance.now();
    const loop = now => { if (!this.alive) return; this.frame(now); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  resize() {
    const w = innerWidth, h = innerHeight; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.fov = w / h < 0.9 ? 55 : 42;
    // keep the action centred in the part of the screen the panel doesn't cover
    if (this.panel === false) this.camera.clearViewOffset();
    else if (w >= 1100) { const rtl = document.documentElement.dir === 'rtl'; this.camera.setViewOffset(w + 500, h, rtl ? 0 : 500, 0, w, h); }
    else { const k = Math.round(h * 0.2); this.camera.setViewOffset(w, h + 2 * k, 0, 2 * k, w, h); }
    this.camera.updateProjectionMatrix();
  }
  _bind() {
    const c = this.canvas, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
    c.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    c.addEventListener('pointermove', e => this.onMove?.(e));
    c.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8) { down = null; return; } down = null;
      const r = c.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, this.camera);
      for (const h of ray.intersectObjects(this.scene.children, true)) { const p = h.object.userData.pick; if (p) { this.onPick?.(p); return; } if (h.object.userData.char) { this.onPick?.('char:' + h.object.userData.char); return; } }
      this.onPick?.('nothing');
    });
  }
  /** world position of a point given in a place's local coordinates */
  W(place, x = 0, y = 0, z = 0) { const o = PLACES[place].o; return new THREE.Vector3(o[0] + x, o[1] + y, o[2] + z); }
  char(id) { return this.chars[id]; }
  /** height of the ground at a world point: the yard, floor or grass disc of a place, else the open sand */
  groundAt(x, z) {
    for (const p of Object.values(PLACES)) {
      const dx = x - p.o[0], dz = z - p.o[2];
      if (p.room ? Math.abs(dx) <= p.room[0] && Math.abs(dz) <= p.room[1] : Math.hypot(dx, dz) <= p.r) return p.floor;
    }
    return 0;
  }

  /**
   * Show a moment of the story.
   * spec: { at: place, cast: [{ id, at:[x,z], from?:[x,z], to?:[x,z], anim, face }], cam: 'close'|'wide'|{pos,look},
   *         lit (0–9 shop windows), open (bunting), ribbon ('up'|'cut'), sky ('day'|'dusk'|'gold'), paper, found, ladder, letters }
   */
  show(spec) {
    const p = spec.at || this.place, P = PLACES[p]; const changed = p !== this.place; this.place = p;
    // cast
    const ids = new Set((spec.cast || []).map(c => c.id));
    for (const [id, ch] of Object.entries(this.chars)) if (!ids.has(id)) { ch.root.visible = false; ch.target = null; if (ch.letter) ch.letter.visible = false; }
    for (const c of spec.cast || []) {
      const ch = this.chars[c.id]; const was = ch.root.visible && ch.place === p; ch.root.visible = true; ch.place = p;
      const dst = this.W(p, c.at[0], 0, c.at[1]);
      if (c.from) { if (!was || c.restart) ch.root.position.copy(this.W(p, c.from[0], 0, c.from[1])); ch.walkTo(dst.x, dst.z, c.anim || 'idle'); }
      else if (c.to) { if (!was) ch.root.position.copy(dst); const tt = this.W(p, c.to[0], 0, c.to[1]); ch.walkTo(tt.x, tt.z, c.anim || 'idle'); ch.speed = c.speed || 1.6; }
      else { if (!was || c.snap) ch.root.position.copy(dst); else if (ch.root.position.distanceTo(dst) > 0.05) { ch.walkTo(dst.x, dst.z, c.anim || 'idle'); } if (!ch.target) ch.anim = c.anim || 'idle'; else ch.then = c.anim || 'idle'; }
      if (!was || c.snap) ch.root.position.y = this.groundAt(ch.root.position.x, ch.root.position.z);
      ch.face = c.face ?? 0; ch.speed = c.speed || ch.speed || 2.2; if (c.y != null) ch.extraY = c.y; else if (!was) ch.extraY = 0;
      ch.letter && (ch.letter.visible = !!c.letter); if (c.letter && !ch.letter) { const l = new THREE.Group(); l.add(mk(new THREE.BoxGeometry(0.42, 0.28, 0.03), F('#ffffff'))); const fl = at(mk(new THREE.ConeGeometry(0.22, 0.14, 3), F('#f2c14e')), 0, 0.05, 0.02); fl.rotation.z = Math.PI; l.add(fl); ch.letter = l; this.scene.add(l); }
    }
    // shop state
    const shop = this.places.shop.userData;
    if (spec.lit != null) this.setLit(spec.lit);
    shop.fest.visible = !!spec.open;
    if (spec.ribbon === 'up') { this.ribbonCut = false; shop.ribbon.halves.forEach(h => { h.rotation.set(0, 0, 0); }); shop.ribbon.bow.visible = true; }
    if (spec.ribbon === 'cut') this.cutRibbon();
    this.scene.background = SKIES[spec.sky || 'day'];
    const dusk = spec.sky === 'dusk'; this.hemi.intensity = dusk ? 0.45 : 0.72; this.sun.intensity = dusk ? 0.3 : 0.62; this.sun.color.set(spec.sky === 'gold' ? '#ffd29a' : '#fff0d8'); this.scene.fog.color.set(dusk ? '#5a3a5a' : spec.sky === 'gold' ? '#f7d9b0' : '#efd3d6');
    // house state
    const H = this.places.house.userData; H.key.visible = (spec.found || []).includes('key'); H.book.visible = (spec.found || []).includes('notebook');
    if (spec.paper) this.paper(spec.paper);
    this.places.lake.userData.ladder.visible = !!spec.ladder;
    // camera
    const o = P.o; let pos, look;
    if (spec.cam && typeof spec.cam === 'object') { pos = v3(spec.cam.pos).add(v3(o)); look = v3(spec.cam.look).add(v3(o)); }
    else if (spec.cam === 'wide' && P.wide) { pos = v3(P.wide).add(v3(o)); look = v3(P.wlook).add(v3(o)); }
    else if (spec.cam === 'sky') { pos = new THREE.Vector3(0, 40, 36); look = new THREE.Vector3(0, 0, -30); }
    else { pos = v3(P.cam).add(v3(o)); look = v3(P.look).add(v3(o)); }
    this.fly(pos, look, spec.camDur ?? (changed ? 2.4 : 1.2));
    this.sun.position.set(o[0] + 12, 22, o[2] + 14); this.sun.target.position.set(o[0], 0, o[2]);
  }
  fly(pos, look, dur) {
    const p0 = this.cam.pos.clone(), l0 = this.cam.look.clone(), d = p0.distanceTo(pos); this.camTween = null;
    if (reduce() || dur <= 0) { this.cam.pos.copy(pos); this.cam.look.copy(look); return Promise.resolve(); }
    return this.tween(dur, e => { this.cam.pos.lerpVectors(p0, pos, e); this.cam.pos.y += Math.sin(e * Math.PI) * Math.min(14, d * 0.25); this.cam.look.lerpVectors(l0, look, e); });
  }
  tween(dur, fn) { return new Promise(res => this.tweens.push({ t: 0, dur, fn, res })); }
  setLit(n) { const S = this.places.shop.userData; S.panes.forEach((p, i) => p.material.color.set(i < n ? '#ffd66e' : '#4a3a46')); S.glow.intensity = n / 9 * 1.2; }
  cutRibbon() { if (this.ribbonCut) return; this.ribbonCut = true; const R = this.places.shop.userData.ribbon; R.bow.visible = false; this.tween(1.2, e => { R.halves.forEach((h, i) => { h.rotation.z = (i ? 1 : -1) * e * 1.4; }); }); }
  paper(kind) { const pp = this.places.house.userData.paper; const y0 = 1.85; if (kind === 'twitch') this.tween(0.7, e => { pp.rotation.z = Math.sin(e * 30) * 0.06; }); else if (kind === 'peek') this.tween(2.2, e => { pp.position.y = y0 - Math.sin(e * Math.PI) * 0.45; }); }
  /** tape measure ring around a head (k = 0 loose … 1 tight) */
  tape(id, k) {
    if (this._tape) { this.scene.remove(this._tape); this._tape = null; } if (k == null) return;
    const ch = this.chars[id]; const r = ch.headR * (1.35 - k * 0.3);
    const t = mk(new THREE.TorusGeometry(r, 0.03, 6, 28), F('#f2c14e')); t.rotation.x = Math.PI / 2; t.userData.follow = { ch, y: 0.06 }; this._tape = t; this.scene.add(t);
  }
  hair(v) { const c = this.chars.corn; c.hair.position.x = v * 0.6; c.hair.rotation.z = v * 0.9; }
  squash(id, on) { const ch = this.chars[id]; if (ch.leaves) ch.leaves.scale.set(on ? 1.25 : 1, on ? 0.45 : 1, on ? 1.25 : 1); }
  /** put a designed hat on a customer; result: 'fit' | 'off' | 'squash' | 'cover' */
  putHat(id, design, result) {
    const ch = this.chars[id]; ch.hatSlot.clear(); if (ch.hat) ch.hat.visible = !design;
    if (!design) return;
    const hat = buildHat(design); hat.scale.setScalar(ch.headR * 1.08 / (hat.userData.r || 1)); ch.hatSlot.add(hat);
    const s0 = hat.scale.x;
    if (result === 'off') this.tween(1.3, e => { hat.position.set(e * 2.2, Math.sin(e * Math.PI) * 2.4, e * 0.5); hat.rotation.z = e * 6; });
    else if (result === 'squash') this.tween(0.6, e => { hat.scale.set(s0 * (1 + e * 0.3), s0 * (1 - e * 0.45), s0 * (1 + e * 0.3)); hat.position.y = -e * ch.headR * 0.5; if (ch.leaves) this.squash(id, e > 0.5); });
    else if (result === 'cover') this.tween(0.6, e => { hat.scale.setScalar(s0 * (1 + e * 0.8)); hat.position.y = -e * ch.headR * 1.1; });
    else hat.position.set(0, 0, 0);
  }
  /** Workshop Beat: a finished hat appears on the shelf, sparkly or wonky */
  shelfHat(i, kind) {
    const slot = this.places.studio.userData.slots[i]; if (!slot) return; slot.clear();
    const cols = ['#7a3a6b', '#5bb7a6', '#e98bb5', '#e3a81b', '#e8504f', '#3f8fd2', '#c9b6ef'];
    const shapes = ['wide', 'bonnet', 'flower', 'strap', 'ring', 'classic', 'wide'];
    const h = buildHat({ shape: shapes[i], colour: cols[i], fabric: 'felt', deco: kind === 'sparkly' ? 'feather' : 'none' }); h.scale.setScalar(0.28 / Math.max(0.6, h.userData.size * 0.4)); slot.add(h);
    if (kind === 'wonky') h.rotation.z = 0.45;
    this.tween(0.4, e => { slot.scale.setScalar(0.2 + e * 0.8); });
    if (kind === 'sparkly') { const sp = at(mk(new THREE.OctahedronGeometry(0.08), new THREE.MeshBasicMaterial({ color: '#fff3a0' }), false), 0.2, 0.45, 0.1); slot.add(sp); }
  }
  clearShelf() { this.places.studio.userData.slots.forEach(s => s.clear()); }
  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.T += dt; const T = this.T;
    for (let i = this.tweens.length - 1; i >= 0; i--) { const tw = this.tweens[i]; tw.t += dt; const p = clamp(tw.t / tw.dur, 0, 1); tw.fn(ease(p), p); if (p >= 1) { this.tweens.splice(i, 1); tw.res(); } }
    for (const ch of Object.values(this.chars)) if (ch.root.visible) {
      const rp = ch.root.position; rp.y += (this.groundAt(rp.x, rp.z) - rp.y) * Math.min(1, dt * 14); // stand on the ground, step up/down smoothly
      ch.update(dt);
      if (ch.letter) { ch.letter.visible = ch.letter.visible && ch.root.visible; ch.letter.position.copy(ch.root.position); ch.letter.position.y = ch.top + 0.5 + Math.sin(T * 3) * 0.12; ch.letter.rotation.y = T; }
    }
    if (this._tape) { const f = this._tape.userData.follow; f.ch.head.getWorldPosition(this._tape.position); this._tape.position.y += f.y; }
    this.places.shop.userData.feather.rotation.z = 0.55 + Math.sin(T * 1.3) * 0.07;
    this.clouds.forEach((c, i) => { c.position.x += dt * (0.5 + i * 0.05); if (c.position.x > 100) c.position.x = -100; });
    const o = PLACES[this.place].o;
    this.feathers.forEach(f => { const s = f.userData.s; f.position.y -= dt * (0.25 + s * 0.2); f.position.x += Math.sin(T * 0.8 + s * 9) * dt * 0.6; f.rotation.z = Math.sin(T * 1.5 + s * 5) * 0.8; f.rotation.y += dt * 0.5; if (f.position.y < 0.3) f.position.set(o[0] + (s - 0.5) * 22 + Math.sin(T + s) * 4, 8 + s * 4, o[2] - 6 + s * 6); });
    this.camera.position.copy(this.cam.pos); this.camera.lookAt(this.cam.look);
    this.renderer.render(this.scene, this.camera);
  }
  dispose() { this.alive = false; cancelAnimationFrame(this.raf); removeEventListener('resize', this._resize); this.renderer.dispose(); }
}
