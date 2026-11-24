// 3D hats for the Hat Studio. Hand-painted look: canvas textures with crayon grain, soft lighting.
import * as THREE from 'three';

function fabricTex(kind, colour, book) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const base = new THREE.Color(colour); const dark = base.clone().multiplyScalar(0.72).getStyle(); const light = base.clone().lerp(new THREE.Color('#ffffff'), 0.35).getStyle();
  x.fillStyle = colour; x.fillRect(0, 0, 256, 256);
  if (kind === 'stripes') { x.fillStyle = light; for (let i = 0; i < 256; i += 32) x.fillRect(i, 0, 12, 256); }
  else if (kind === 'dots') { x.fillStyle = light; for (let i = 0; i < 256; i += 32) for (let j = 0; j < 256; j += 32) { x.beginPath(); x.arc(i + 16 + (j / 32 % 2) * 8, j + 16, 6, 0, 7); x.fill(); } }
  else if (kind === 'straw') { x.strokeStyle = dark; x.lineWidth = 3; for (let i = -256; i < 256; i += 14) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 256, 256); x.stroke(); x.beginPath(); x.moveTo(i + 256, 0); x.lineTo(i, 256); x.globalAlpha = .5; x.stroke(); x.globalAlpha = 1; } }
  else if (kind === 'book' && book?.length) { const w = 256 / book.length; book.forEach((b, i) => { x.fillStyle = b; x.fillRect(i * w, 0, w + 1, 256); }); }
  // crayon grain: speckles and short strokes like the book's texture
  for (let i = 0; i < 2600; i++) { x.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.18)' : 'rgba(40,10,30,.14)'; x.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1); }
  x.strokeStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 90; i++) { const a = Math.random() * 256, b = Math.random() * 256; x.beginPath(); x.moveTo(a, b); x.lineTo(a + 6 + Math.random() * 10, b + Math.random() * 3); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); return t;
}
const mat = (o) => new THREE.MeshPhongMaterial({ shininess: 8, ...o });

function deco(kind, top, r) {
  const g = new THREE.Group();
  if (kind === 'feather') {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 2.2, 8), mat({ color: '#f3dca0' })); f.scale.z = 0.25; f.position.set(r * 0.55, top + 0.7, -0.1); f.rotation.z = -0.5; g.add(f);
    const q = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 5), mat({ color: '#b8873a' })); q.position.copy(f.position); q.rotation.z = -0.5; g.add(q);
  } else if (kind === 'flowers') {
    const cols = ['#f2a7c3', '#ffffff', '#e8504f', '#f2c14e'];
    for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; const fl = new THREE.Group(); for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat({ color: cols[i % 4] })); p.scale.set(1, 0.5, 1); p.position.set(Math.cos(k * 1.26) * 0.15, 0, Math.sin(k * 1.26) * 0.15); fl.add(p); } fl.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), mat({ color: '#f2c14e' }))); fl.position.set(Math.sin(a) * r, top * 0.55, Math.cos(a) * r); fl.rotation.x = 1.2; g.add(fl); }
  } else if (kind === 'ribbon') {
    const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, 0.09, 8, 32), mat({ color: '#f2a7c3' })); band.rotation.x = Math.PI / 2; band.position.y = top * 0.35; g.add(band);
    [-1, 1].forEach(s => { const tail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.04), mat({ color: '#f2a7c3' })); tail.position.set(s * 0.15, top * 0.35 - 0.45, -r); tail.rotation.z = s * 0.25; g.add(tail); });
  } else if (kind === 'bow') {
    [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 4), mat({ color: '#8e5bb5' })); w.rotation.z = s * Math.PI / 2; w.position.set(s * 0.3, top * 0.4, r * 0.98); g.add(w); });
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat({ color: '#6e3f94' })); k.position.set(0, top * 0.4, r); g.add(k);
  } else if (kind === 'tassels') {
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 0.5, 5), mat({ color: '#3b2a1a' })); t.position.set(Math.cos(a) * r, -0.3, Math.sin(a) * r); g.add(t); }
  }
  return g;
}

export function buildHat({ shape = 'classic', fabric = 'felt', colour = '#7a3a6b', deco: d = 'none', book }) {
  const g = new THREE.Group(); const m = mat({ map: fabricTex(fabric, fabric === 'book' && book?.length ? '#ffffff' : colour, book), side: THREE.DoubleSide });
  const accent = mat({ color: new THREE.Color(colour).multiplyScalar(0.75) });
  let top = 1, r = 1, brimR = 0;
  if (shape === 'classic') { // Zizoun's tall, wavy, old-style hat
    const prof = []; for (let i = 0; i <= 12; i++) { const y = i / 12 * 2.6; prof.push(new THREE.Vector2(1.0 - i / 12 * 0.15 + Math.sin(i) * 0.03, y)); }
    const crown = new THREE.Mesh(new THREE.LatheGeometry(prof, 18), m); g.add(crown);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.86, 18), m); cap.rotation.x = -Math.PI / 2; cap.position.y = 2.6; g.add(cap);
    const brim = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.32, 8, 24), m); brim.rotation.x = Math.PI / 2; brim.scale.z = 0.5; g.add(brim);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, 0.3, 18, 1, true), mat({ color: '#e3a81b' })); band.position.y = 0.3; g.add(band);
    top = 2.6; r = 1; brimR = 1.6;
  } else if (shape === 'strap') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m); g.add(cap);
    const peak = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.08, 20, 1, false, -0.9, 1.8), m); peak.position.set(0, 0.02, 0.2); g.add(peak);
    const strap = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 6, 24, Math.PI), accent); strap.rotation.z = Math.PI; strap.position.y = 0; g.add(strap);
    top = 1; r = 1; brimR = 1.25;
  } else if (shape === 'ring') { // open-top: room for leaves
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.38, 12, 28), m); ring.rotation.x = Math.PI / 2; ring.position.y = 0.35; g.add(ring);
    const ruffle = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.12, 6, 40), accent); ruffle.rotation.x = Math.PI / 2; ruffle.position.y = 0.1; g.add(ruffle);
    top = 0.8; r = 1.1; brimR = 1.5;
  } else if (shape === 'bonnet') { // small, tipped back: eyes stay free
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.75, 18, 12, 0, Math.PI * 2, 0, Math.PI / 1.7), m); b.rotation.x = -0.5; b.position.z = -0.2; g.add(b);
    const edge = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.09, 6, 24), accent); edge.position.set(0, 0.15, 0.15); edge.rotation.x = -0.4; g.add(edge);
    top = 0.8; r = 0.75; brimR = 0.8;
  } else if (shape === 'wide') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.1, 32), m); g.add(brim);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1, 0.8, 24), m); crown.position.y = 0.45; g.add(crown);
    top = 0.85; r = 1; brimR = 2.3;
  } else if (shape === 'flower') {
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const p = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10), m); p.scale.set(1, 0.45, 0.7); p.position.set(Math.cos(a) * 0.75, 0.35 + (i % 2) * 0.15, Math.sin(a) * 0.75); p.rotation.y = -a; p.rotation.z = 0.5; g.add(p); }
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), mat({ color: '#f2c14e' })); c.position.y = 0.55; g.add(c);
    top = 1; r = 0.9; brimR = 1.3;
  }
  const dd = deco(d, top, shape === 'wide' ? brimR * 0.95 : r); if (d === 'tassels') dd.children.forEach(o => { o.position.multiplyScalar(brimR / r); o.position.y = -0.3; }); g.add(dd);
  g.userData.size = Math.max(top, brimR); g.userData.r = r;
  return g;
}

export function createViewer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.outputColorSpace = THREE.LinearSRGBColorSpace; r.useLegacyLights = true; r.setPixelRatio(Math.min(devicePixelRatio, 2));
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6e8', '#c4819d', 1.0)); const dl = new THREE.DirectionalLight('#ffffff', 0.55); dl.position.set(3, 6, 5); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(32, 2, 0.1, 100); cam.position.set(0, 3.2, 8.5); cam.lookAt(0, 0.9, 0);
  let hat = null, rot = 0.6, drag = null, alive = true, spin = 0;
  const fit = () => { const w = canvas.clientWidth || 300, h = canvas.clientHeight || 220; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }; fit();
  canvas.onpointerdown = e => { drag = { x: e.clientX, r: rot }; canvas.setPointerCapture(e.pointerId); };
  canvas.onpointermove = e => { if (drag) rot = drag.r + (e.clientX - drag.x) * 0.012; };
  canvas.onpointerup = () => { drag = null; };
  const tick = () => { if (!alive) return; if (!drag) rot += 0.006; if (hat) { hat.rotation.y = rot; if (spin > 0) { spin -= 1 / 60; hat.rotation.y += spin * 6; } } r.render(sc, cam); requestAnimationFrame(tick); };
  tick();
  return {
    set(design) { if (hat) { sc.remove(hat); hat.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); }); } hat = buildHat(design); const s = 1.7 / hat.userData.size; hat.scale.setScalar(Math.min(1.3, s)); sc.add(hat); spin = 0.4; },
    /** transparent PNG of the hat seen from the front, for the try-on */
    snapshot() {
      const keep = rot; if (hat) hat.rotation.y = 0.35; r.render(sc, cam);
      // crop to the hat itself so it can be placed on a head
      const w = canvas.width, h = canvas.height, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(canvas, 0, 0);
      const d = x.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = 0, y1 = 0;
      for (let y = 0; y < h; y += 2) for (let i = 0; i < w; i += 2) if (d[(y * w + i) * 4 + 3] > 20) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      rot = keep; if (x1 <= x0) return { url: canvas.toDataURL('image/png'), aspect: w / h };
      const o = document.createElement('canvas'); o.width = x1 - x0 + 2; o.height = y1 - y0 + 2; o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
      return { url: o.toDataURL('image/png'), aspect: o.width / o.height };
    },
    resize: fit,
    dispose() { alive = false; r.dispose(); },
  };
}
