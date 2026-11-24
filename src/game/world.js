// Low-poly 3D sea map (three.js). Ported from the original single-file game.
import * as THREE from 'three';

THREE.ColorManagement.enabled = false; // keep the original flat, saturated look

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const MATS = {};
export function M(c, o = {}) { const k = c + JSON.stringify(o); if (!MATS[k]) MATS[k] = new THREE.MeshPhongMaterial({ color: c, flatShading: true, shininess: 6, ...o }); return MATS[k]; }
function mesh(geo, mat, { cast = true, recv = true } = {}) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; return m; }
function gradTex(stops) { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, 4, 256); return new THREE.CanvasTexture(c); }

function palm(s = 1) {
  const g = new THREE.Group(); let y = 0;
  for (let i = 0; i < 4; i++) { const seg = mesh(new THREE.CylinderGeometry(0.16 - 0.02 * i, 0.2 - 0.02 * i, 0.7, 6), M('#b98552')); seg.position.set(i * 0.07, y + 0.35, 0); seg.rotation.z = -0.08; g.add(seg); y += 0.66; }
  for (let i = 0; i < 6; i++) { const piv = new THREE.Group(); piv.rotation.y = i * Math.PI / 3; const leaf = mesh(new THREE.ConeGeometry(0.28, 2, 4), M(i % 2 ? '#2fae63' : '#43c477')); leaf.position.set(0.9, y, 0); leaf.rotation.set(0, 0, -Math.PI / 2 - 0.45); piv.add(leaf); g.add(piv); }
  g.scale.setScalar(s); return g;
}
const bush = (c = '#43c477', s = 1) => { const m = mesh(new THREE.IcosahedronGeometry(0.7 * s, 0), M(c)); m.scale.y = 0.75; return m; };
const rock = (c = '#9aa7b4', s = 1) => mesh(new THREE.DodecahedronGeometry(0.7 * s, 0), M(c));
function cloud() { const g = new THREE.Group(); [[0, 0, 0, 1.6], [1.5, -0.2, 0.2, 1.2], [-1.5, -0.3, 0, 1.1], [0.6, 0.6, -0.2, 1.1]].forEach(([x, y, z, r]) => { const s = mesh(new THREE.IcosahedronGeometry(r, 1), M('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.25 }), { recv: false }); s.position.set(x, y, z); g.add(s); }); return g; }
function foam(r) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.08, 12), new THREE.MeshBasicMaterial({ color: '#e9fdff', transparent: true, opacity: 0.55 })); m.position.y = -0.05; return m; }
function baseIsland(r, sand = '#ffd98a', grass = '#59c97a', goff = [0, 0]) {
  const g = new THREE.Group(); g.add(foam(r * 1.2));
  const s = mesh(new THREE.CylinderGeometry(r, r * 1.12, 1.4, 10), M(sand)); s.position.y = -0.2; g.add(s);
  if (grass) { const gr = mesh(new THREE.CylinderGeometry(r * 0.74, r * 0.8, 0.8, 10), M(grass)); gr.position.set(goff[0], 0.6, goff[1]); g.add(gr); }
  return g;
}
// Sacred ibis (Thoth's bird): white body, black head and wing tips, gold collar.
export function makeIbis() {
  const g = new THREE.Group(), white = M('#fdfbf5'), dark = M('#1b1b2f'), gold = M('#F7B500'), blue = M('#1a8fe0');
  const b = mesh(new THREE.SphereGeometry(0.5, 10, 8), white); b.scale.set(0.8, 0.75, 1.35); b.position.y = 1.0; g.add(b);
  const collar = mesh(new THREE.TorusGeometry(0.17, 0.06, 6, 12), gold); collar.position.set(0, 1.35, 0.36); collar.rotation.x = 1.1; g.add(collar);
  const neck = mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.7, 6), dark); neck.position.set(0, 1.5, 0.45); neck.rotation.x = 0.45; g.add(neck);
  const head = mesh(new THREE.SphereGeometry(0.2, 10, 8), dark); head.position.set(0, 1.86, 0.62); g.add(head);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.85, 0.78), new THREE.Vector3(0, 1.8, 1.15), new THREE.Vector3(0, 1.55, 1.4), new THREE.Vector3(0, 1.25, 1.5)]);
  g.add(mesh(new THREE.TubeGeometry(curve, 12, 0.045, 6, false), M('#f0a020')));
  [-1, 1].forEach(sx => { const e = mesh(new THREE.SphereGeometry(0.045, 6, 4), M('#ffffff')); e.position.set(0.12 * sx, 1.92, 0.74); g.add(e); const leg = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 5), dark); leg.position.set(0.14 * sx, 0.35, 0); g.add(leg); });
  const wings = [-1, 1].map(sx => { const p = new THREE.Group(); p.position.set(0.3 * sx, 1.15, 0); const w = mesh(new THREE.BoxGeometry(1.4, 0.06, 0.8), white); w.position.x = 0.7 * sx; const stripe = mesh(new THREE.BoxGeometry(0.3, 0.07, 0.8), blue); stripe.position.x = 1.05 * sx; const tip = mesh(new THREE.BoxGeometry(0.4, 0.07, 0.6), dark); tip.position.x = 1.5 * sx; p.add(w, stripe, tip); g.add(p); return p; });
  g.userData = { wings }; return g;
}
export function makeLulua() {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), new THREE.MeshPhongMaterial({ color: '#ffffff', shininess: 120, specular: '#d6f0ff', emissive: '#ffe3ee', emissiveIntensity: 0.25 })); g.add(p);
  [-1, 1].forEach(sx => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M('#17324d', { flatShading: false })); e.position.set(0.17 * sx, 0.08, 0.5); g.add(e);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), new THREE.MeshBasicMaterial({ color: '#fff' })); hl.position.set(0.17 * sx + 0.025, 0.11, 0.565); g.add(hl);
    const ch = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffb3c7' })); ch.scale.set(1, 0.6, 0.4); ch.position.set(0.3 * sx, -0.07, 0.44); g.add(ch);
  });
  const sm = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 6, 12, Math.PI), M('#17324d')); sm.rotation.z = Math.PI; sm.position.set(0, -0.08, 0.53); g.add(sm);
  return g;
}

/* ----- islands ----- */
function buildStork() {
  const g = baseIsland(7, '#ffd98a', '#5fcf7f', [-0.6, -1]);
  for (let i = 0; i < 22; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 1.5; const c = mesh(new THREE.ConeGeometry(0.12, 1.6 + Math.random() * 1.1, 4), M(i % 3 ? '#2f9e58' : '#6cc46b')); c.position.set(-4.2 + Math.cos(a) * r, 1.8, 1.2 + Math.sin(a) * r); g.add(c); }
  const trunk = mesh(new THREE.CylinderGeometry(0.35, 0.5, 3.4, 7), M('#9c6b43')); trunk.position.set(2.4, 2.7, -2.4); g.add(trunk);
  const can = mesh(new THREE.IcosahedronGeometry(2, 1), M('#3aa860')); can.position.set(2.4, 5.6, -2.8); can.scale.set(1.1, 0.8, 1); g.add(can);
  const nest = mesh(new THREE.TorusGeometry(0.75, 0.25, 6, 10), M('#c7924f')); nest.rotation.x = Math.PI / 2; nest.position.set(2.4, 4.25, -1.3); g.add(nest);
  [[-2.4, 1.5, -4.8, 1.4], [-0.6, 1.5, -4.9, 1.3], [-1.5, 2.6, -5.1, 1.3]].forEach(([x, y, z, s]) => { const r = rock('#a2acb8', s); r.position.set(x, y, z); g.add(r); });
  [[4.6, 0.5, 3.2, 0.95], [5.4, 0.5, -0.5, 1.1], [-5.6, 0.5, -2, 1]].forEach(([x, y, z, s]) => { const p = palm(s); p.position.set(x, y, z); g.add(p); });
  return g;
}
function buildAfra() {
  const g = baseIsland(7, '#f4cf86', '#86d16c');
  const h1 = mesh(new THREE.ConeGeometry(2.8, 3.4, 7), M('#5fbf5a')); h1.position.set(-2.4, 2.6, -1.6); g.add(h1);
  const h2 = mesh(new THREE.ConeGeometry(2.4, 2.8, 7), M('#79cf63')); h2.position.set(2.6, 2.3, -2.2); g.add(h2);
  const river = mesh(new THREE.BoxGeometry(1.1, 0.12, 8), M('#46c9e0', { shininess: 60 })); river.position.set(0.2, 1.02, 0.6); river.rotation.y = 0.25; g.add(river);
  [[-4, 1, 2.4], [3.8, 1, 2], [1.6, 1, 3.8]].forEach(([x, y, z]) => { const b = bush('#2f9e58', 0.9); b.position.set(x, y + 0.3, z); g.add(b); });
  return g;
}
function buildPearl() {
  const g = new THREE.Group(); g.add(foam(8));
  const ring = mesh(new THREE.TorusGeometry(5.6, 1.3, 6, 14), M('#ffe2a3')); ring.rotation.x = Math.PI / 2; ring.position.y = 0.1; ring.scale.z = 0.6; g.add(ring);
  g.add(mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.2, 14), M('#7ee6ee', { shininess: 80 })));
  const shellBase = mesh(new THREE.SphereGeometry(1.3, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M('#ffb3c1', { side: THREE.DoubleSide })); shellBase.scale.y = 0.45; shellBase.position.y = 0.65; g.add(shellBase);
  const lidPiv = new THREE.Group(); lidPiv.position.set(0, 0.65, -1.25);
  const lid = mesh(new THREE.SphereGeometry(1.3, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), M('#ff9fb3', { side: THREE.DoubleSide })); lid.scale.y = 0.45; lid.position.z = 1.25; lidPiv.add(lid); lidPiv.rotation.x = -0.25; g.add(lidPiv);
  const pearl = makeLulua(); pearl.position.set(0, 1.05, 0); pearl.scale.setScalar(0.85); g.add(pearl);
  const glow = new THREE.PointLight('#fff1f6', 0, 8); glow.position.set(0, 2, 1); g.add(glow);
  [[4.4, 0.6, -3.4], [-4.6, 0.6, 3], [-3.8, 0.6, -3.6]].forEach(([x, y, z]) => { const p = palm(0.8); p.position.set(x, y, z); g.add(p); });
  const dhow = new THREE.Group(); const hull = mesh(new THREE.CylinderGeometry(1, 0.6, 3.6, 6, 1, false, 0, Math.PI), M('#9c6b43')); hull.rotation.set(Math.PI / 2, 0, Math.PI / 2); hull.scale.set(1, 1, 0.5); hull.position.y = 0.2; dhow.add(hull);
  const mast = mesh(new THREE.CylinderGeometry(0.06, 0.06, 3, 6), M('#5d3a22')); mast.position.y = 1.7; dhow.add(mast);
  const sail = mesh(new THREE.ConeGeometry(1.1, 2.4, 3), M('#f6efe0')); sail.scale.z = 0.12; sail.position.set(0, 1.9, 0.3); sail.rotation.z = 0.25; dhow.add(sail);
  dhow.position.set(-7.6, 0, 3.5); dhow.rotation.y = 0.6; g.add(dhow);
  Object.assign(g.userData, { pearl, lid: lidPiv, glow, dhow }); return g;
}
function buildHat() {
  const g = baseIsland(7, '#ffd98a', '#f7c873'); const cols = ['#e8622c', '#7b4fd6', '#1a8fe0', '#F7B500', '#2fae63'];
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3, r = 3.6; const st = new THREE.Group(); const box = mesh(new THREE.BoxGeometry(1.6, 1.1, 1.2), M('#f4e6cc')); box.position.y = 1.55; const roof = mesh(new THREE.BoxGeometry(1.9, 0.2, 1.6), M(cols[i])); roof.position.y = 2.3; roof.rotation.x = 0.15; st.add(box, roof); st.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); st.rotation.y = -a + Math.PI / 2; g.add(st); }
  const brim = mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.18, 14), M('#7b4fd6')); brim.position.y = 3.6;
  const crown = mesh(new THREE.CylinderGeometry(1, 1.1, 1.6, 12), M('#7b4fd6')); crown.position.y = 4.4;
  const band = mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.3, 12), M('#F7B500')); band.position.y = 3.85;
  g.add(brim, crown, band); return g;
}
function buildSahl() {
  const g = baseIsland(7.4, '#f6d48f', '#a6d96a');
  const tr = mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.4, 7), M('#9c6b43')); tr.position.y = 2.2; const cp = mesh(new THREE.ConeGeometry(2.4, 1.4, 8), M('#4cb86a')); cp.position.y = 3.8; g.add(tr, cp);
  const cols = ['#e8622c', '#F7B500', '#1a8fe0', '#7b4fd6', '#2fae63'];
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const t = mesh(new THREE.ConeGeometry(0.75, 1.4, 6), M(cols[i])); t.position.set(Math.cos(a) * 4, 1.7, Math.sin(a) * 4); g.add(t); }
  return g;
}
function buildChick() {
  const g = baseIsland(5, '#ffe3a6', '#9ad97a');
  const nest = mesh(new THREE.TorusGeometry(1.1, 0.38, 6, 12), M('#c7924f')); nest.rotation.x = Math.PI / 2; nest.position.y = 1.2; g.add(nest);
  const body = mesh(new THREE.SphereGeometry(0.7, 10, 8), M('#ffd84a')); body.position.y = 1.7; g.add(body);
  const head = mesh(new THREE.SphereGeometry(0.45, 10, 8), M('#ffd84a')); head.position.set(0, 2.55, 0.2); g.add(head);
  const beak = mesh(new THREE.ConeGeometry(0.12, 0.3, 5), M('#ff8a2b')); beak.rotation.x = Math.PI / 2; beak.position.set(0, 2.5, 0.7); g.add(beak);
  const shell = mesh(new THREE.SphereGeometry(0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M('#ffffff')); shell.position.set(0, 2.95, 0.15); shell.scale.set(0.9, 0.7, 0.9); g.add(shell);
  [[2.8, 0.5, 1.2, 0.75], [-2.8, 0.5, -1, 0.7]].forEach(([x, y, z, s]) => { const p = palm(s); p.position.set(x, y, z); g.add(p); });
  return g;
}
function buildGeneric() {
  const g = baseIsland(6, '#ffd98a', '#7fd17a');
  const ob = mesh(new THREE.ConeGeometry(0.9, 4.5, 4), M('#F7B500')); ob.position.y = 3; g.add(ob);
  [[3.5, 0.5, 2, 0.9], [-3.5, 0.5, -1.5, 0.8]].forEach(([x, y, z, s]) => { const p = palm(s); p.position.set(x, y, z); g.add(p); });
  return g;
}
// Home: a little Egyptian temple in Thoth colours.
function buildHome() {
  const g = baseIsland(4.2, '#ffe3a6', '#6fd58a');
  const base = mesh(new THREE.BoxGeometry(3.4, 0.4, 2.6), M('#f4dfb0')); base.position.y = 1.2; g.add(base);
  for (const x of [-1.2, -0.4, 0.4, 1.2]) { const c = mesh(new THREE.CylinderGeometry(0.22, 0.26, 2.2, 8), M('#fff6e6')); c.position.set(x, 2.5, 0.9); g.add(c); const cap = mesh(new THREE.CylinderGeometry(0.36, 0.22, 0.3, 8), M('#1a8fe0')); cap.position.set(x, 3.7, 0.9); g.add(cap); }
  const wall = mesh(new THREE.BoxGeometry(3.2, 2.4, 1.2), M('#f7e6c2')); wall.position.set(0, 2.5, -0.4); g.add(wall);
  const roof = mesh(new THREE.BoxGeometry(3.8, 0.4, 2.6), M('#F7B500')); roof.position.y = 4.0; g.add(roof);
  const door = mesh(new THREE.BoxGeometry(0.8, 1.4, 0.1), M('#e8622c')); door.position.set(0, 2.0, 0.22); g.add(door);
  const flag = mesh(new THREE.BoxGeometry(0.8, 0.45, 0.04), M('#e8622c')); flag.position.set(0.4, 5.4, 0);
  const fp = mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4), M('#5d3a22')); fp.position.set(0, 4.8, 0); g.add(fp, flag);
  [[2.8, 0.5, 1.6, 0.8], [-2.8, 0.5, 1.1, 0.7]].forEach(([x, y, z, s]) => { const p = palm(s); p.position.set(x, y, z); g.add(p); });
  g.userData.flag = flag; return g;
}
const BUILD = { stork: buildStork, afra: buildAfra, pearl: buildPearl, hat: buildHat, sahl: buildSahl, chick: buildChick };

export class World {
  constructor(canvas, books, { onPick } = {}) {
    this.canvas = canvas; this.onPick = onPick; this.labels = []; this.tweens = []; this.cine = null; this.mode = { type: 'map' }; this.yaw = 0; this.paused = false;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    r.outputColorSpace = THREE.LinearSRGBColorSpace; r.useLegacyLights = true;
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
    this.SKY = gradTex([[0, '#5fc8ef'], [0.55, '#a9e6f7'], [1, '#fff1c9']]);
    this.GOLD = gradTex([[0, '#ffb86b'], [0.5, '#ffd9a0'], [1, '#fff4d6']]);
    scene.background = this.SKY; scene.fog = new THREE.Fog('#bfeaf6', 70, 170);
    this.hemi = new THREE.HemisphereLight('#d4f4ff', '#ffd59a', 0.95); scene.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight('#fff4d6', 0.85); sun.position.set(30, 50, 22); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 140 }); scene.add(sun);
    const oceanGeo = new THREE.PlaneGeometry(320, 320, 80, 80); oceanGeo.rotateX(-Math.PI / 2);
    this.oceanBase = oceanGeo.attributes.position.array.slice(); this.oceanPos = oceanGeo.attributes.position;
    const ocean = mesh(oceanGeo, M('#25bfd3', { shininess: 40, specular: '#bff6ff' }), { cast: false }); ocean.position.y = -0.15; scene.add(ocean);

    this.islands = {}; this.clickables = [];
    for (const b of books) {
      const g = (BUILD[b.id] || buildGeneric)(); g.position.set(...(b.pos || [0, 0, 0]));
      g.traverse(o => { o.userData.pick = { world: b.id }; }); scene.add(g); this.clickables.push(g); this.islands[b.id] = g;
      const R = b.id === 'chick' ? 3.3 : 4.5; const mist = new THREE.Group();
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const s = mesh(new THREE.IcosahedronGeometry(R / 3 + Math.random() * 0.6, 1), new THREE.MeshPhongMaterial({ color: '#ffffff', flatShading: true, transparent: true, opacity: 0.82 }), { cast: false }); s.position.set(Math.cos(a) * R, 2.5 + Math.random() * 1.5, Math.sin(a) * R); mist.add(s); }
      const top = mesh(new THREE.IcosahedronGeometry(R * 0.7, 1), new THREE.MeshPhongMaterial({ color: '#ffffff', flatShading: true, transparent: true, opacity: 0.82 }), { cast: false }); top.position.y = 4; mist.add(top);
      g.add(mist); g.userData.mist = mist;
    }
    this.home = buildHome(); this.home.traverse(o => { o.userData.pick = { home: true }; }); scene.add(this.home); this.clickables.push(this.home);
    this.clouds = []; for (let i = 0; i < 7; i++) { const c = cloud(); c.position.set(-60 + i * 20, 15 + Math.random() * 5, -30 + Math.random() * 30); c.scale.setScalar(0.8 + Math.random() * 0.6); scene.add(c); this.clouds.push(c); }
    this.ibis = makeIbis(); scene.add(this.ibis);
    this.P = this.islands.pearl;
    this.cam = { pos: new THREE.Vector3(0, 60, 70), look: new THREE.Vector3() };
    this.goal = { pos: new THREE.Vector3(), look: new THREE.Vector3() };

    this._resize = () => this.resize(); addEventListener('resize', this._resize); this.resize();
    this._bindPointer();
    this.T = 0; this.last = performance.now(); this.alive = true;
    const loop = now => { if (!this.alive) return; this.frame(now); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  portrait() { return innerWidth / innerHeight < 0.9; }
  resize() { this.renderer.setSize(innerWidth, innerHeight, false); this.camera.aspect = innerWidth / innerHeight; this.camera.fov = this.portrait() ? 55 : 45; this.camera.updateProjectionMatrix(); }
  _bindPointer() {
    const c = this.canvas; let down = null; const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    c.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, yaw: this.yaw }; });
    c.addEventListener('pointermove', e => { if (down && this.mode.type === 'map') this.yaw = clamp(down.yaw - (e.clientX - down.x) * 0.004, -0.75, 0.75); });
    c.addEventListener('pointerup', e => {
      if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null; if (moved >= 7) return;
      ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, this.camera);
      for (const h of ray.intersectObjects(this.clickables, true)) { const p = h.object.userData.pick; if (p) { this.onPick?.(p); return; } }
    });
    c.addEventListener('pointercancel', () => { down = null; });
  }
  setMist(unlocked, hideAll = false) { for (const [id, g] of Object.entries(this.islands)) g.userData.mist.visible = !hideAll && !unlocked.includes(id); }
  setMode(m) { this.mode = m; }
  addLabel(id, el, y) { this.labels = this.labels.filter(l => l.id !== id); if (el) this.labels.push({ id, el, y }); }
  computeGoal() {
    const P = this.portrait(), k = P ? 1.55 : 1, m = this.mode, wide = innerWidth >= 1100, sg = document.documentElement.dir === 'rtl' ? -1 : 1;
    if (m.type === 'map') { const d = P ? 80 : 60, ht = P ? 72 : 46; this.goal.pos.set(Math.sin(this.yaw) * d + (wide ? 8 * sg : 0), ht, Math.cos(this.yaw) * d); this.goal.look.set(wide ? 8 * sg : 0, 0, P ? 5 : 3); }
    else if (m.type === 'focus') { const p = (this.islands[m.id] || this.home).position; const off = wide ? 9 * sg : 0; this.goal.pos.set(p.x + off, 25 * k, p.z + 31 * k); this.goal.look.set(p.x + off, 0, p.z + (P ? 12 : 9)); }
    else if (m.type === 'pearl') { const p = this.P.position; const off = wide ? 3 * sg : 0; this.goal.pos.set(p.x + (P ? 1.5 : 3) + off, 4.6 * k, p.z + 8.5 * k); this.goal.look.set(p.x + off, 0.4, p.z + (P ? 4.2 : 3.2)); }
  }
  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; if (this.paused) return; this.T += dt; const T = this.T;
    for (let i = this.tweens.length - 1; i >= 0; i--) { const tw = this.tweens[i]; tw.t += dt; const p = clamp(tw.t / tw.dur, 0, 1); tw.update(ease(p), p); if (p >= 1) { this.tweens.splice(i, 1); tw.res(); } }
    const a = this.oceanPos.array, b = this.oceanBase; for (let i = 0; i < a.length; i += 3) a[i + 1] = Math.sin(b[i] * 0.14 + T * 1.1) * 0.28 + Math.cos(b[i + 2] * 0.11 + T * 0.8) * 0.28; this.oceanPos.needsUpdate = true;
    this.clouds.forEach((c, i) => { c.position.x += dt * (0.6 + i * 0.08); if (c.position.x > 90) c.position.x = -90; });
    const an = T * 0.35; this.ibis.position.set(Math.cos(an) * 11, 8 + Math.sin(T * 1.3) * 0.5, Math.sin(an) * 11); this.ibis.rotation.y = -an;
    this.ibis.userData.wings.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * Math.sin(T * 8) * 0.6; });
    this.home.userData.flag.rotation.y = Math.sin(T * 3) * 0.25;
    for (const g of Object.values(this.islands)) if (g.userData.mist.visible) g.userData.mist.rotation.y += dt * 0.15;
    if (this.P) { const pr = this.P.userData.pearl; if (!pr.userData.free) { pr.position.y = 1.05 + Math.sin(T * 2) * 0.05; pr.rotation.y = Math.sin(T * 0.8) * 0.4; } this.P.userData.dhow.position.y = Math.sin(T * 1.6) * 0.1; this.P.userData.dhow.rotation.z = Math.sin(T * 1.2) * 0.05; }
    this.computeGoal();
    if (this.cine) { this.cam.pos.copy(this.cine.pos); this.cam.look.copy(this.cine.look); }
    else { const k = 1 - Math.exp(-dt * (reduceMotion() ? 20 : 2.6)); this.cam.pos.lerp(this.goal.pos, k); this.cam.look.lerp(this.goal.look, k); }
    this.camera.position.copy(this.cam.pos); this.camera.lookAt(this.cam.look);
    this.renderer.render(this.scene, this.camera);
    const v = new THREE.Vector3();
    for (const L of this.labels) {
      const obj = L.id === 'home' ? this.home : this.islands[L.id]; if (!obj || !L.el.isConnected) continue;
      obj.getWorldPosition(v); v.y += L.y; v.project(this.camera);
      if (v.z > 1) { L.el.style.visibility = 'hidden'; continue; }
      L.el.style.visibility = '';
      L.el.style.transform = `translate(${((v.x * 0.5 + 0.5) * innerWidth).toFixed(1)}px,${((-v.y * 0.5 + 0.5) * innerHeight).toFixed(1)}px) translate(-50%,-100%)`;
    }
  }
  tween(dur, update) { if (reduceMotion()) dur = Math.min(dur, 0.2); return new Promise(res => this.tweens.push({ t: 0, dur: Math.max(dur, 0.001), update, res })); }
  async revealIsland(id) {
    const g = this.islands[id]; if (!g) return; const mist = g.userData.mist; mist.visible = true;
    await this.tween(1.2, p => { mist.scale.setScalar(1 + p * 1.2); mist.children.forEach(c => { c.material.opacity = 0.82 * (1 - p); }); });
    mist.visible = false; mist.scale.setScalar(1); mist.children.forEach(c => { c.material.opacity = 0.82; });
    await this.tween(0.6, p => g.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.12));
  }
  rel(x, y, z, base = this.P.position) { return [base.x + x, base.y + y, base.z + z]; }
  /** shots: [{to, look, from?, fromLook?, dur, start?, update?, end?, final?, cap?}] ; ctl.skipped flag lets UI skip */
  async playCine(shots, ctl, onShot) {
    const v3 = a => (Array.isArray(a) ? new THREE.Vector3(...a) : a.clone());
    const cp = new THREE.Vector3(), cl = new THREE.Vector3();
    this.cine = { pos: this.cam.pos.clone(), look: this.cam.look.clone() };
    for (const sh of shots) {
      if (ctl.skipped) break;
      onShot?.(sh); sh.start?.();
      const fromP = sh.from ? v3(sh.from) : this.cine.pos.clone(), fromL = sh.fromLook ? v3(sh.fromLook) : this.cine.look.clone();
      const toP = v3(sh.to), toL = v3(sh.look); const dur = (sh.dur || 3.5) * 1000; const t0 = performance.now();
      await new Promise(res => { const step = () => { if (ctl.skipped || !this.alive) { res(); return; } const p = clamp((performance.now() - t0) / dur, 0, 1), e = ease(p); cp.lerpVectors(fromP, toP, e); cl.lerpVectors(fromL, toL, e); this.cine.pos.copy(cp); this.cine.look.copy(cl); sh.update?.(p); if (p >= 1) res(); else requestAnimationFrame(step); }; requestAnimationFrame(step); });
      sh.end?.();
    }
    if (ctl.skipped) shots.forEach(s => s.final?.());
    this.cam.pos.copy(this.cine.pos); this.cam.look.copy(this.cine.look); this.cine = null;
  }
  resetPearl() {
    if (!this.P) return; const u = this.P.userData; const pr = u.pearl; pr.userData.free = false; pr.position.set(0, 1.05, 0); pr.scale.setScalar(0.85); pr.rotation.set(0, 0, 0);
    u.lid.rotation.x = -0.25; u.glow.intensity = 0; this.scene.background = this.SKY; this.hemi.color.set('#d4f4ff'); this.sun.color.set('#fff4d6');
  }
  goldenSky() { this.scene.background = this.GOLD; this.hemi.color.set('#ffe6c4'); this.sun.color.set('#ffd29a'); }
  dispose() { this.alive = false; cancelAnimationFrame(this.raf); removeEventListener('resize', this._resize); this.renderer.dispose(); }
}
