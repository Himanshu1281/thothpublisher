export const BANDS = {
  little: { bpm: 84, breath: 8, tide: false, pressure: false, cycle: 0, thr: 0.58 },
  early: { bpm: 96, breath: 10, tide: true, pressure: false, cycle: 6, thr: 0.64 },
  reader: { bpm: 108, breath: 10, tide: true, pressure: true, cycle: 4.4, thr: 0.7 },
};
export const READ = {
  little: { intro: { en: 'Listen to Thoth, then say the line back.', ar: 'استمع إلى تحوت، ثم ردّد السطر.' }, words: 'لُؤْلُؤَةٌ في صَدَفَةٍ.', en: 'A pearl in a shell.', hard: { 'صَدَفَةٍ': { en: 'shell', ar: 'صدفة' } } },
  early: { intro: { en: 'Read one sentence from page 3 out loud.', ar: 'اقرأ جملة واحدة من الصفحة ٣ بصوت عالٍ.' }, words: 'حاوَلَتْ لُؤْلُؤَةُ أَنْ تَخْرُجَ مِنَ الصَّدَفَةِ.', en: 'Lu’lu’a tried to get out of the shell.', hard: { 'حاوَلَتْ': { en: 'tried', ar: 'حاولت' }, 'الصَّدَفَةِ': { en: 'shell', ar: 'الصدفة' } } },
  reader: { intro: { en: 'Read the whole of page 3 out loud.', ar: 'اقرأ الصفحة ٣ كلها بصوت عالٍ.' }, words: 'حاوَلَتْ لُؤْلُؤَةُ أَنْ تَخْرُجَ مِنَ الصَّدَفَةِ. جاءَتْ مَوْجَةٌ كَبيرَةٌ وَأَعادَتْها إِلى القاعِ العَميقِ. قالَتْ: سَأُحاوِلُ مَرَّةً أُخْرى!', en: 'Lu’lu’a tried to get out of the shell. A big wave came and pushed her back to the deep bottom. She said: I will try again!', hard: { 'مَوْجَةٌ': { en: 'wave', ar: 'موجة' }, 'الصَّدَفَةِ': { en: 'shell', ar: 'الصدفة' }, 'العَميقِ': { en: 'deep', ar: 'العميق' } } },
};
export const clean = w => w.replace(/[.,!،:؟?]/g, '');

export function pageArt(kind) {
  const base = '<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="90" rx="10" fill="#e3f7fb"/>';
  if (kind === 'wave') return base + '<path d="M0 60c15-25 35-35 55-25 10 5 5 15-5 12 15 10 35-5 40-20 8 10 15 25 30 30v33H0z" fill="#1fb5c9"/><path d="M0 70c20-8 40 8 60 0s40-8 60 0v20H0z" fill="#0b6f8c"/><circle cx="78" cy="40" r="7" fill="#fff" stroke="#17324d" stroke-width="1.5"/></svg>';
  if (kind === 'fish') return base + '<ellipse cx="62" cy="45" rx="20" ry="11" fill="#ff9b5b"/><path d="M80 45l14-10v20z" fill="#ff9b5b"/><circle cx="50" cy="42" r="2.5" fill="#17324d"/><circle cx="30" cy="55" r="7" fill="#fff" stroke="#17324d" stroke-width="1.5"/></svg>';
  if (kind === 'sleep') return base + '<path d="M30 60q30-28 60 0z" fill="#ffb3c1"/><circle cx="60" cy="55" r="9" fill="#fff" stroke="#17324d" stroke-width="1.5"/><path d="M78 22h10l-10 10h10" stroke="#7b4fd6" stroke-width="3" fill="none"/></svg>';
  if (kind === 'trick') return base + '<rect x="52" y="10" width="3" height="40" fill="#9c6b43"/><circle cx="54" cy="56" r="10" fill="#8a97a6"/><circle cx="54" cy="30" r="7" fill="#ffd2a6"/><rect x="47" y="27" width="14" height="5" rx="2" fill="#17324d"/><path d="M20 80h80" stroke="#ffd98a" stroke-width="6"/></svg>';
  return base + '</svg>';
}
export function qrSvg() {
  let s = '<svg viewBox="0 0 21 21" width="100%" height="100%" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="21" height="21" fill="#fff"/>';
  const fin = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#1b1b2f"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#1b1b2f"/>`;
  s += fin(0, 0) + fin(14, 0) + fin(0, 14);
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) { if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue; if (rnd() > 0.55) s += `<rect x="${x}" y="${y}" width="1" height="1" fill="#1b1b2f"/>`; }
  return s + '</svg>';
}
export const PEARL_SVG = '<svg viewBox="0 0 48 48" width="34" height="34"><circle cx="24" cy="24" r="17" fill="#fff" stroke="#1b1b2f" stroke-width="2"/><circle cx="18" cy="23" r="2.4" fill="#17324d"/><circle cx="30" cy="23" r="2.4" fill="#17324d"/><ellipse cx="14" cy="29" rx="3" ry="2" fill="#ffb3c7"/><ellipse cx="34" cy="29" rx="3" ry="2" fill="#ffb3c7"/><path d="M20 29q4 4 8 0" stroke="#17324d" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
