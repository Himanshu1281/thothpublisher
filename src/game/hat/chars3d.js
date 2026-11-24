// 3D characters of Zizoun's Hat Town, modelled from Latifa Ahmed's illustrations in "The Hat Maker".
// Soft toon shading (3 painted tones), big round eyes, rounded shapes, the book's palette.
import * as THREE from 'three';

/* ---------- materials: painted toon look ---------- */
const GRAD = (() => { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const TM = {};
export function T(color, o = {}) { const k = color + JSON.stringify(o); if (!TM[k]) TM[k] = new THREE.MeshToonMaterial({ color, gradientMap: GRAD, ...o }); return TM[k]; }
export function mk(geo, mat, cast = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; return m; }
const S = (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h);
const C = (rt, rb, h, s = 12) => new THREE.CylinderGeometry(rt, rb, h, s);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };

/* striped fabric (Said's t-shirt, Zizoun's shirt) */
function stripes(a, b, n = 8, vertical = false) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = a; x.fillRect(0, 0, 64, 64); x.fillStyle = b;
  for (let i = 0; i < n; i++) vertical ? x.fillRect(i * 64 / n, 0, 64 / n / 2.6, 64) : x.fillRect(0, i * 64 / n, 64, 64 / n / 2.6);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const TEX = {};
const striped = (key, a, b, n, v) => (TEX[key] ||= new THREE.MeshToonMaterial({ map: stripes(a, b, n, v), gradientMap: GRAD }));

/* big round cartoon eyes, like the book */
function eyes(g, { x = 0.11, y = 0, z = 0.27, r = 0.085, lash = false, lids = 0 } = {}) {
  const out = [];
  [-1, 1].forEach(s => {
    const e = new THREE.Group(); at(e, s * x, y, z);
    const w = mk(S(r, 14, 10), T('#ffffff'), false); w.scale.z = 0.55; e.add(w);
    const p = at(mk(S(r * 0.62, 12, 8), T('#2a1a22'), false), 0, -r * 0.05, r * 0.32); p.scale.z = 0.5; e.add(p);
    e.add(at(mk(S(r * 0.2, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff' }), false), r * 0.22, r * 0.2, r * 0.6));
    if (lids) { const l = at(mk(new THREE.SphereGeometry(r * 1.04, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), T(lids), false), 0, 0, 0); l.rotation.x = -0.5; l.scale.z = 0.6; e.add(l); }
    if (lash) for (let i = 0; i < 3; i++) { const la = at(mk(C(0.006, 0.012, r * 0.8, 4), T('#2a1a22'), false), s * (i - 1) * r * 0.45, r * 1.05, r * 0.2); la.rotation.z = -s * (i - 1) * 0.5; e.add(la); }
    g.add(e); out.push(e);
  });
  return out;
}
const smile = (g, y, z, w = 0.08, col = '#6b2a2a') => { const m = at(mk(new THREE.TorusGeometry(w, 0.014, 6, 14, Math.PI), T(col), false), 0, y, z); m.rotation.z = Math.PI; g.add(m); return m; };
const cheeks = (g, y, z, x = 0.17, col = '#f29a9a') => [-1, 1].forEach(s => { const c = at(mk(S(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 }), false), s * x, y, z); c.scale.set(1.3, 0.8, 0.4); g.add(c); });

/** limb on a pivot so it can swing: returns the pivot */
function limb(parent, { x, y, z = 0, len, r = 0.05, mat, end, endMat }) {
  const p = at(new THREE.Group(), x, y, z); const l = at(mk(C(r, r * 0.85, len, 8), mat), 0, -len / 2, 0); p.add(l);
  if (end) p.add(at(mk(end, endMat || mat), 0, -len, 0.03));
  parent.add(p); return p;
}

/* ---------- the cast ---------- */
function said() { // the boy: brown curls, orange striped tee, purple trousers
  const g = new THREE.Group(), skin = T('#e9a77a');
  const legs = [-1, 1].map(s => limb(g, { x: s * 0.09, y: 0.62, len: 0.56, r: 0.07, mat: T('#4a3a8c'), end: new THREE.BoxGeometry(0.13, 0.08, 0.22), endMat: T('#4a2a1c') }));
  const body = at(mk(C(0.2, 0.24, 0.5, 14), striped('said', '#f08a2c', '#ffc27a', 7)), 0, 0.88, 0); g.add(body);
  const arms = [-1, 1].map(s => { const a = limb(g, { x: s * 0.26, y: 1.08, len: 0.42, r: 0.05, mat: skin, end: S(0.06, 8, 6) }); a.rotation.z = s * 0.15; return a; });
  [-1, 1].forEach(s => g.add(at(mk(S(0.09, 10, 8), striped('said', '#f08a2c', '#ffc27a', 7)), s * 0.25, 1.08, 0)));
  const head = at(new THREE.Group(), 0, 1.42, 0); g.add(head);
  head.add(mk(S(0.3, 18, 14), skin));
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, b = Math.random() * 0.9; const c = mk(S(0.09 + Math.random() * 0.03, 8, 6), T(i % 3 ? '#4a2a1c' : '#5e3a26')); c.position.set(Math.cos(a) * 0.26 * Math.cos(b), 0.12 + Math.sin(b) * 0.2, Math.sin(a) * 0.26 * Math.cos(b) - 0.04); if (c.position.z > 0.18 && c.position.y < 0.2) continue; head.add(c); }
  const ey = eyes(head, { y: 0.02, z: 0.25, r: 0.085 }); smile(head, -0.12, 0.27, 0.07); cheeks(head, -0.08, 0.24);
  [-1, 1].forEach(s => head.add(at(mk(S(0.06, 8, 6), skin), s * 0.3, -0.02, 0)));
  return { g, head, legs, arms, eyes: ey, top: 1.78, headR: 0.32 };
}

function zizoun() { // tall, curled moustache, purple feathered hat, olive striped shirt, mustard trousers
  const g = new THREE.Group(), skin = T('#d98f62');
  const legs = [-1, 1].map(s => limb(g, { x: s * 0.13, y: 1.0, len: 0.95, r: 0.11, mat: T('#e8b53a'), end: new THREE.BoxGeometry(0.18, 0.1, 0.32), endMat: T('#4a1f24') }));
  g.add(at(mk(C(0.27, 0.27, 0.08, 16), T('#6b3a22')), 0, 1.02, 0));
  const body = at(mk(C(0.27, 0.3, 0.72, 16), striped('ziz', '#8a9a55', '#a6b471', 10, true)), 0, 1.4, 0); g.add(body);
  const collar = at(mk(new THREE.ConeGeometry(0.2, 0.14, 4), T('#7d8c4a')), 0, 1.72, 0.12); collar.rotation.x = Math.PI; g.add(collar);
  const arms = [-1, 1].map(s => { const a = limb(g, { x: s * 0.34, y: 1.7, len: 0.62, r: 0.07, mat: skin, end: S(0.08, 8, 6) }); a.rotation.z = s * 0.12; return a; });
  [-1, 1].forEach(s => g.add(at(mk(S(0.12, 10, 8), striped('ziz', '#8a9a55', '#a6b471', 10, true)), s * 0.32, 1.7, 0)));
  const head = at(new THREE.Group(), 0, 2.12, 0); g.add(head);
  const hd = mk(S(0.3, 18, 14), skin); hd.scale.set(0.95, 1.12, 1); head.add(hd);
  [-1, 1].forEach(s => { const hair = at(mk(S(0.16, 10, 8), T('#1e1a22')), s * 0.26, 0.02, -0.08); hair.scale.set(0.6, 1.1, 1); head.add(hair); head.add(at(mk(S(0.06, 8, 6), skin), s * 0.31, -0.02, 0.02)); });
  const ey = eyes(head, { y: 0.05, z: 0.25, r: 0.09, lids: '#d98f62' });
  const nose = at(mk(S(0.07, 10, 8), T('#c97a4e')), 0, -0.06, 0.3); nose.scale.set(0.9, 1.1, 1); head.add(nose);
  // curled moustache
  [-1, 1].forEach(s => { const m = at(mk(new THREE.TorusGeometry(0.07, 0.022, 6, 16, Math.PI * 1.5), T('#1e1a22')), s * 0.09, -0.15, 0.29); m.rotation.set(0, 0, s > 0 ? -0.6 : Math.PI + 0.6); head.add(m); });
  smile(head, -0.22, 0.27, 0.05);
  // the tall purple wavy hat with mustard band and cream feather
  const hat = at(new THREE.Group(), 0, 0.22, -0.02); head.add(hat);
  const brim = mk(new THREE.TorusGeometry(0.33, 0.07, 8, 24), T('#5a2a4f')); brim.rotation.x = Math.PI / 2; brim.scale.z = 0.7; hat.add(brim);
  const prof = []; for (let i = 0; i <= 10; i++) prof.push(new THREE.Vector2(0.3 - i * 0.012 + Math.sin(i * 1.4) * 0.025, i * 0.06));
  hat.add(at(mk(new THREE.LatheGeometry(prof, 16), T('#7a3a6b', { side: THREE.DoubleSide })), 0, 0, 0));
  { const _m = at(mk(new THREE.CircleGeometry(0.19, 14), T('#7a3a6b')), 0, 0.6, 0); _m.rotation.x = -Math.PI / 2; hat.add(_m); }
  hat.add(at(mk(C(0.31, 0.31, 0.08, 16, 1), T('#e3a81b')), 0, 0.06, 0));
  const fe = at(mk(new THREE.ConeGeometry(0.07, 0.55, 8), T('#f3dca0')), 0.2, 0.32, 0.12); fe.scale.z = 0.3; fe.rotation.z = -0.6; hat.add(fe);
  return { g, head, legs, arms, eyes: ey, top: 2.9, headR: 0.34, hat };
}

function frog() { // Mr. Frog: round bald green head, big glasses, orange coat, lilac waistcoat, purple bow tie
  const g = new THREE.Group(), green = T('#7fae3e');
  const legs = [-1, 1].map(s => limb(g, { x: s * 0.1, y: 0.6, len: 0.55, r: 0.06, mat: T('#6a3a8c'), end: new THREE.ConeGeometry(0.12, 0.1, 5), endMat: green }));
  legs.forEach(l => { l.children[1].rotation.x = Math.PI / 2; l.children[1].scale.set(1.2, 0.5, 1.4); });
  g.add(at(mk(C(0.2, 0.26, 0.6, 14), T('#e87a2c')), 0, 0.92, 0));
  g.add(at(mk(new THREE.BoxGeometry(0.22, 0.42, 0.06), T('#c9b2e6')), 0, 0.98, 0.2));
  const bow = new THREE.Group(); at(bow, 0, 1.2, 0.25); [-1, 1].forEach(s => { const w = at(mk(new THREE.ConeGeometry(0.08, 0.14, 4), T('#7a4ba6')), s * 0.07, 0, 0); w.rotation.z = s * Math.PI / 2; bow.add(w); }); bow.add(mk(S(0.035, 6, 4), T('#5a2f80'))); g.add(bow);
  const arms = [-1, 1].map(s => { const a = limb(g, { x: s * 0.25, y: 1.15, len: 0.42, r: 0.055, mat: T('#e87a2c'), end: S(0.06, 8, 6), endMat: green }); a.rotation.z = s * 0.2; return a; });
  const head = at(new THREE.Group(), 0, 1.45, 0); g.add(head);
  const hd = mk(S(0.33, 18, 14), green); hd.scale.set(1.15, 0.85, 1); head.add(hd);
  const ey = eyes(head, { x: 0.15, y: 0.16, z: 0.2, r: 0.1 });
  [-1, 1].forEach(s => { const gl = at(mk(new THREE.TorusGeometry(0.12, 0.018, 6, 20), T('#c9a35c')), s * 0.15, 0.16, 0.27); head.add(gl); });
  { const _m = at(mk(C(0.008, 0.008, 0.06, 4), T('#c9a35c')), 0, 0.16, 0.29); _m.rotation.z = Math.PI / 2; head.add(_m); }
  const mouth = at(mk(new THREE.TorusGeometry(0.2, 0.025, 6, 20, Math.PI), T('#5a2030')), 0, -0.02, 0.24); mouth.rotation.z = Math.PI; mouth.scale.y = 0.6; head.add(mouth);
  return { g, head, legs, arms, eyes: ey, top: 1.75, headR: 0.36 };
}

function corn() { // Mazyoun: a corn cob in a brown robe, long straw hair, red straw hat
  const g = new THREE.Group(), y = T('#f2c230');
  const legs = [-1, 1].map(s => limb(g, { x: s * 0.1, y: 0.45, len: 0.42, r: 0.05, mat: T('#6b8c3a'), end: S(0.07, 8, 6), endMat: T('#4a2a1c') }));
  const cob = at(mk(new THREE.CapsuleGeometry(0.28, 1.0, 6, 16), y), 0, 1.15, 0); g.add(cob);
  // kernels
  const kg = new THREE.SphereGeometry(0.06, 6, 5), km = T('#f7d24a');
  for (let r = 0; r < 9; r++) for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + r * 0.26, hy = 0.8 + r * 0.1; if (Math.cos(a) > 0.55 && hy > 1.25) continue; const k = at(mk(kg, km, false), Math.sin(a) * 0.28, hy, Math.cos(a) * 0.28); k.scale.set(1, 0.8, 0.6); k.lookAt(0, hy, 0); g.add(k); }
  const robe = at(mk(C(0.32, 0.4, 0.6, 16, 1), T('#8a4b2a')), 0, 0.72, 0); g.add(robe);
  { const _m = at(mk(new THREE.TorusGeometry(0.33, 0.035, 6, 20), T('#e3a81b')), 0, 0.92, 0); _m.rotation.x = Math.PI / 2; g.add(_m); }
  const arms = [-1, 1].map(s => { const a = limb(g, { x: s * 0.3, y: 1.0, len: 0.4, r: 0.04, mat: T('#6b8c3a'), end: new THREE.ConeGeometry(0.06, 0.2, 5), endMat: T('#6b8c3a') }); a.rotation.z = s * 0.3; return a; });
  const head = at(new THREE.Group(), 0, 1.55, 0.02); g.add(head);
  const ey = eyes(head, { y: 0, z: 0.24, r: 0.08 }); smile(head, -0.14, 0.27, 0.07, '#7a3a2a');
  // long hair (moves aside for the measuring game)
  const hair = new THREE.Group(); head.add(hair);
  for (let i = 0; i < 16; i++) { const a = -1.4 + i / 15 * 2.8; const h = at(mk(C(0.025, 0.012, 0.9, 5), T(i % 2 ? '#e8c25b' : '#d4a840')), Math.sin(a) * 0.3, -0.05, Math.cos(a) * -0.05 - 0.15); h.rotation.z = Math.sin(a) * 0.35; hair.add(h); }
  const hat = at(new THREE.Group(), 0, 0.3, -0.02); head.add(hat);
  hat.add(mk(C(0.48, 0.48, 0.04, 20), T('#c2412f')));
  hat.add(at(mk(C(0.22, 0.26, 0.2, 14), T('#c2412f')), 0, 0.12, 0));
  hat.add(at(mk(C(0.265, 0.265, 0.05, 14), T('#5a2a1a')), 0, 0.05, 0));
  return { g, head, legs, arms, eyes: ey, top: 2.1, headR: 0.32, hair, hat };
}

function strawberry() { // Miss Strawberry: red berry with seeds, leafy collar, teal-and-pink flower bonnet, thin green legs
  const g = new THREE.Group(), red = T('#e2473f');
  const legs = [-1, 1].map(s => limb(g, { x: s * 0.1, y: 0.62, len: 0.6, r: 0.03, mat: T('#d98f62'), end: new THREE.CylinderGeometry(0.05, 0.07, 0.16, 6), endMat: T('#5c9e3c') }));
  const berry = at(mk(S(0.42, 20, 16), red), 0, 1.15, 0); berry.scale.set(1, 1.15, 0.95); g.add(berry);
  const seed = new THREE.SphereGeometry(0.022, 5, 4), sm = T('#f7d24a');
  for (let i = 0; i < 46; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); const p = new THREE.Vector3(r * Math.cos(a), u, r * Math.sin(a)); if (p.z > 0.55 && p.y > -0.1 && p.y < 0.5) continue; const s = at(mk(seed, sm, false), p.x * 0.42, 1.15 + p.y * 0.48, p.z * 0.4); s.scale.z = 0.5; s.lookAt(0, 1.15, 0); g.add(s); }
  // leafy collar (the leaves that must not be squashed)
  const leaves = at(new THREE.Group(), 0, 0.62, 0); g.add(leaves);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; const l = at(mk(new THREE.ConeGeometry(0.09, 0.32, 5), T(i % 2 ? '#5c9e3c' : '#7fbf4d')), Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22); l.rotation.set(Math.sin(a) * 2.6, 0, -Math.cos(a) * 2.6); leaves.add(l); }
  const top = at(new THREE.Group(), 0, 1.66, 0); g.add(top);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const l = at(mk(new THREE.ConeGeometry(0.07, 0.26, 5), T('#5c9e3c')), Math.cos(a) * 0.1, 0.05, Math.sin(a) * 0.1); l.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); top.add(l); }
  const arms = [-1, 1].map(s => { const a = limb(g, { x: s * 0.4, y: 1.2, len: 0.42, r: 0.03, mat: T('#d98f62'), end: S(0.05, 8, 6), endMat: T('#5c9e3c') }); a.rotation.z = s * 0.5; return a; });
  const head = at(new THREE.Group(), 0, 1.32, 0.05); g.add(head);
  const ey = eyes(head, { x: 0.12, y: 0, z: 0.32, r: 0.085, lash: true }); smile(head, -0.15, 0.36, 0.06, '#6b1a1a'); cheeks(head, -0.1, 0.34, 0.2, '#ff8ab0');
  const bon = at(new THREE.Group(), 0, 0.42, -0.05); head.add(bon);
  const b1 = mk(new THREE.TorusGeometry(0.26, 0.11, 10, 24), T('#5bb7a6')); b1.rotation.x = Math.PI / 2; bon.add(b1);
  const b2 = at(mk(new THREE.TorusGeometry(0.3, 0.05, 8, 24), T('#f2a7c3')), 0, -0.04, 0); b2.rotation.x = Math.PI / 2; bon.add(b2);
  for (let i = 0; i < 3; i++) bon.add(at(mk(S(0.07, 8, 6), T('#ff8ab0')), -0.15 + i * 0.12, 0.08, 0.2));
  return { g, head, legs, arms, eyes: ey, top: 2.0, headR: 0.3, leaves, hat: bon };
}

function swan() { // Mrs. Zakiyya: elegant pink-white swan, very long neck, tiny head, lilac bonnet, orange legs
  const g = new THREE.Group(), white = T('#fbeef2'), pink = T('#f2a7c3');
  const legs = [-1, 1].map(s => limb(g, { x: s * 0.12, y: 0.75, len: 0.72, r: 0.03, mat: T('#f2944a'), end: new THREE.ConeGeometry(0.1, 0.06, 3), endMat: T('#f2944a') }));
  const body = at(mk(S(0.45, 18, 14), pink), 0, 1.05, -0.05); body.scale.set(1, 0.8, 1.2); g.add(body);
  const dress = at(mk(new THREE.ConeGeometry(0.48, 0.5, 16, 1, true), T('#f7b9d0', { side: THREE.DoubleSide })), 0, 0.82, 0); g.add(dress);
  const arms = [-1, 1].map(s => { const w = at(new THREE.Group(), s * 0.4, 1.12, -0.05); const f = at(mk(S(0.32, 12, 8), white), s * 0.12, -0.08, -0.05); f.scale.set(0.35, 0.8, 1.1); w.add(f); g.add(w); return w; });
  // neck: a gentle S curve
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.25, 0.15), new THREE.Vector3(0, 1.7, 0.25), new THREE.Vector3(0, 2.15, 0.1), new THREE.Vector3(0, 2.5, 0.12)]);
  g.add(mk(new THREE.TubeGeometry(curve, 20, 0.07, 8, false), white));
  const head = at(new THREE.Group(), 0, 2.56, 0.14); g.add(head);
  head.add(mk(S(0.15, 14, 10), white));
  const beak = at(mk(new THREE.ConeGeometry(0.05, 0.22, 8), T('#f2944a')), 0, -0.04, 0.2); beak.rotation.x = Math.PI / 2; head.add(beak);
  const ey = eyes(head, { x: 0.075, y: 0.03, z: 0.11, r: 0.05, lash: true });
  const bon = at(new THREE.Group(), 0, 0.08, -0.06); head.add(bon);
  const bb = mk(new THREE.SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.7), T('#c9b6ef')); bb.rotation.x = -0.6; bon.add(bb);
  bon.add(at(mk(S(0.04, 6, 4), T('#f2a7c3')), 0.1, 0.06, 0.06));
  return { g, head, legs, arms, eyes: ey, top: 2.75, headR: 0.16, hat: bon };
}

function ostrich() { // Hashoura: navy feathery body, long pink neck and legs, red-orange flower crest, long lashes
  const g = new THREE.Group(), navy = T('#2d3a8c'), pinkSkin = T('#f2b8a8');
  const legs = [-1, 1].map(s => limb(g, { x: s * 0.14, y: 1.1, len: 1.05, r: 0.04, mat: pinkSkin, end: new THREE.BoxGeometry(0.16, 0.05, 0.2), endMat: T('#3a2a2a') }));
  const body = at(new THREE.Group(), 0, 1.35, -0.1); g.add(body);
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const f = at(mk(new THREE.ConeGeometry(0.14, 0.7, 5), T(i % 3 ? '#2d3a8c' : '#3f4fb0')), Math.cos(a) * 0.32, Math.sin(i) * 0.08, Math.sin(a) * 0.32); f.rotation.set(Math.sin(a) * 1.9, 0, -Math.cos(a) * 1.9); body.add(f); }
  body.add(mk(S(0.38, 14, 10), navy));
  const arms = [-1, 1].map(s => { const w = at(new THREE.Group(), s * 0.36, 1.45, -0.1); const f = at(mk(new THREE.ConeGeometry(0.16, 0.6, 5), T('#3f4fb0')), s * 0.1, -0.2, 0); f.rotation.z = s * 2.6; w.add(f); g.add(w); return w; });
  const neck = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.55, 0.05), new THREE.Vector3(0, 2.05, 0.18), new THREE.Vector3(0, 2.55, 0.12)]);
  g.add(mk(new THREE.TubeGeometry(neck, 16, 0.06, 8, false), pinkSkin));
  const head = at(new THREE.Group(), 0, 2.65, 0.14); g.add(head);
  const hd = mk(S(0.2, 14, 10), T('#f2c2a0')); hd.scale.set(1, 1, 1.05); head.add(hd);
  for (let i = 0; i < 8; i++) { const fz = at(mk(S(0.05, 6, 4), T('#f29a6a')), Math.cos(i) * 0.16, -0.05 + Math.sin(i * 2) * 0.08, Math.sin(i) * 0.14 - 0.02); head.add(fz); }
  const beak = at(mk(new THREE.ConeGeometry(0.08, 0.26, 8), T('#f2944a')), 0, -0.08, 0.24); beak.rotation.x = Math.PI / 2; beak.scale.y = 1; head.add(beak);
  const ey = eyes(head, { x: 0.09, y: 0.05, z: 0.15, r: 0.075, lash: true });
  const crest = at(new THREE.Group(), 0, 0.2, 0); head.add(crest);
  for (let i = 0; i < 5; i++) { const p = at(mk(S(0.09, 8, 6), T(i % 2 ? '#e2473f' : '#f2944a')), Math.cos(i * 1.25) * 0.09, 0.03, Math.sin(i * 1.25) * 0.09); p.scale.y = 0.5; crest.add(p); }
  for (let i = 0; i < 3; i++) { const a = at(mk(C(0.008, 0.008, 0.2, 4), T('#2d3a8c')), (i - 1) * 0.05, 0.12, 0); a.rotation.z = (i - 1) * 0.4; crest.add(a); crest.add(at(mk(S(0.025, 6, 4), T('#2d3a8c')), (i - 1) * 0.09, 0.22, 0)); }
  return { g, head, legs, arms, eyes: ey, top: 2.95, headR: 0.22, hat: crest };
}

export const BUILDERS = { said, zizoun, frog, corn, strawberry, swan, ostrich };

/** A living character: animations are blended every frame. */
export class Character {
  constructor(id) {
    const b = BUILDERS[id](); this.id = id; Object.assign(this, b);
    this.root = new THREE.Group(); this.root.add(this.g); this.g.traverse(o => { o.userData.char = id; });
    this.anim = 'idle'; this.t = Math.random() * 10; this.target = null; this.speed = 2.2; this.extraY = 0; this.face = 0;
    this.hatSlot = new THREE.Group(); this.head.add(this.hatSlot); this.hatSlot.position.y = this.headR * 0.85;
    this.blinkT = 2 + Math.random() * 3;
  }
  walkTo(x, z, then = 'idle') { this.target = new THREE.Vector3(x, 0, z); this.then = then; this.anim = 'walk'; }
  update(dt) {
    const t = (this.t += dt), g = this.g, a = this.anim;
    // reset pose
    g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.set(1, 1, 1); this.head.rotation.set(0, 0, 0);
    this.legs.forEach(l => l.rotation.set(0, 0, 0)); this.arms.forEach((l, i) => l.rotation.set(0, 0, (i ? 1 : -1) * 0.12));
    // blink
    this.blinkT -= dt; const bl = this.blinkT < 0.12 ? 0.1 : 1; if (this.blinkT < 0) this.blinkT = 2 + Math.random() * 4;
    this.eyes.forEach(e => { e.scale.y = bl; });
    if (a === 'walk' && this.target) {
      const p = this.root.position, d = this.target.clone().sub(p); d.y = 0; const dist = d.length();
      if (dist < 0.05) { this.target = null; this.anim = this.then || 'idle'; }
      else { d.normalize(); p.addScaledVector(d, Math.min(dist, this.speed * dt)); this.root.rotation.y = Math.atan2(d.x, d.z); }
      const s = Math.sin(t * 9); this.legs[0].rotation.x = s * 0.55; this.legs[1].rotation.x = -s * 0.55; this.arms[0].rotation.x = -s * 0.5; this.arms[1].rotation.x = s * 0.5; g.position.y = Math.abs(Math.cos(t * 9)) * 0.05;
    } else {
      if (!this.target) this.root.rotation.y += (this.face - this.root.rotation.y) * Math.min(1, dt * 5);
      if (a === 'idle' || a === 'breathe') { g.scale.y = 1 + Math.sin(t * 2) * 0.012; this.head.rotation.z = Math.sin(t * 0.9) * 0.05; this.arms.forEach((l, i) => { l.rotation.x = Math.sin(t * 2 + i) * 0.05; }); }
      else if (a === 'bob') { g.position.y = Math.abs(Math.sin(t * 3)) * 0.06; this.head.rotation.z = Math.sin(t * 3) * 0.08; }
      else if (a === 'wave') { this.arms[1].rotation.z = 2.6 + Math.sin(t * 8) * 0.4; this.head.rotation.z = 0.1; }
      else if (a === 'dance') { g.rotation.y = Math.sin(t * 6) * 0.35; g.position.y = Math.abs(Math.sin(t * 6)) * 0.18; this.arms[0].rotation.z = -2.4 + Math.sin(t * 6) * 0.4; this.arms[1].rotation.z = 2.4 - Math.sin(t * 6) * 0.4; this.legs[0].rotation.x = Math.sin(t * 6) * 0.3; this.legs[1].rotation.x = -Math.sin(t * 6) * 0.3; }
      else if (a === 'hop') { const h = Math.abs(Math.sin(t * 5)); g.position.y = h * 0.5; g.scale.set(1 + (1 - h) * 0.06, 1 - (1 - h) * 0.08, 1); this.arms.forEach((l, i) => { l.rotation.z = (i ? 1 : -1) * (0.3 + h * 1.2); }); }
      else if (a === 'clap') { const c = Math.abs(Math.sin(t * 10)); this.arms.forEach((l, i) => { l.rotation.x = -1.3; l.rotation.z = (i ? -1 : 1) * (0.2 + c * 0.35); }); this.head.rotation.z = Math.sin(t * 3) * 0.1; g.position.y = Math.abs(Math.sin(t * 5)) * 0.04; }
      else if (a === 'sad') { this.head.rotation.x = 0.35; g.rotation.x = 0.08; g.position.y = Math.sin(t) * 0.01; this.arms.forEach((l, i) => { l.rotation.z = (i ? 1 : -1) * 0.05; }); }
      else if (a === 'shake') { g.rotation.z = Math.sin(t * 30) * 0.05; this.head.rotation.y = Math.sin(t * 14) * 0.35; this.arms.forEach((l, i) => { l.rotation.z = (i ? 1 : -1) * 0.9; l.rotation.x = -0.4; }); }
      else if (a === 'cross') { this.arms.forEach((l, i) => { l.rotation.x = -1.4; l.rotation.z = (i ? -1 : 1) * 1.1; }); this.head.rotation.x = -0.12; this.head.rotation.y = Math.sin(t * 0.8) * 0.2; }
      else if (a === 'gasp') { this.arms.forEach((l, i) => { l.rotation.x = -2.6; l.rotation.z = (i ? -1 : 1) * 0.3; }); this.head.rotation.x = -0.2; g.position.y = 0.04; }
      else if (a === 'sit') { this.legs.forEach(l => { l.rotation.x = -1.35; }); this.arms.forEach(l => { l.rotation.x = -1.1; }); }
      else if (a === 'sew') { this.arms.forEach((l, i) => { l.rotation.x = -1.2 + Math.sin(t * 12 + i) * 0.12; }); this.head.rotation.x = 0.25; }
      else if (a === 'climb') { this.arms.forEach((l, i) => { l.rotation.x = -2.6 + Math.sin(t * 6 + i * 3) * 0.3; }); this.legs.forEach((l, i) => { l.rotation.x = -0.6 + Math.sin(t * 6 + i * 3) * 0.3; }); }
      else if (a === 'talk') { this.arms[1].rotation.x = -1.3; this.arms[1].rotation.z = 0.4 + Math.sin(t * 3) * 0.2; this.head.rotation.z = Math.sin(t * 4) * 0.06; }
    }
    g.position.y += this.extraY;
  }
}

/* ---------- portraits: the same 3D models rendered to small images (chips, maze tokens, cards) ---------- */
let PR = null; const CACHE = {};
export function portrait(id, { full = false, size = 256 } = {}) {
  const key = id + (full ? ':f' : '') + size; if (CACHE[key]) return CACHE[key];
  if (!PR) {
    const c = document.createElement('canvas'); const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.outputColorSpace = THREE.LinearSRGBColorSpace; r.useLegacyLights = true;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6ea', '#c4819d', 1.05)); const dl = new THREE.DirectionalLight('#ffffff', 0.7); dl.position.set(2, 4, 5); sc.add(dl);
    PR = { r, sc, cam: new THREE.PerspectiveCamera(30, 1, 0.1, 50) };
  }
  const { r, sc, cam } = PR; r.setSize(size, size, false);
  let obj, top = 2, look = 1, dist = 4;
  let headY = null, headR = 0.3;
  if (BUILDERS[id]) { const ch = new Character(id); ch.update(0.016); obj = ch.root; top = ch.top; obj.updateMatrixWorld(true); const v = new THREE.Vector3(); ch.head.getWorldPosition(v); headY = v.y + ch.headR * 0.35; headR = ch.headR; }
  else if (EXTRA[id]) { obj = EXTRA[id](); top = obj.userData.top || 2; }
  else return '';
  sc.add(obj);
  if (full) { look = top / 2; dist = top * 1.95; } else if (headY != null) { look = headY; dist = 1.2 + headR * 4; } else { look = top * 0.78; dist = Math.max(1.4, top * 0.55); }
  cam.position.set(dist * 0.18, look + dist * 0.08, dist); cam.lookAt(0, look, 0);
  r.render(sc, cam); const url = r.domElement.toDataURL('image/png'); sc.remove(obj);
  return (CACHE[key] = url);
}
/** non-character things that also need a picture (registered by the town and the studio) */
export const EXTRA = {};
