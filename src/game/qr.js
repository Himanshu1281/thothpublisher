// Decorative QR shown in the scan frame before the camera opens.
export function qrSvg() {
  let s = '<svg viewBox="0 0 21 21" width="100%" height="100%" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="21" height="21" fill="#fff"/>';
  const fin = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#1b1b2f"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#1b1b2f"/>`;
  s += fin(0, 0) + fin(14, 0) + fin(0, 14);
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) { if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue; if (rnd() > 0.55) s += `<rect x="${x}" y="${y}" width="1" height="1" fill="#1b1b2f"/>`; }
  return s + '</svg>';
}
