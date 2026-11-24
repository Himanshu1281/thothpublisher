import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { ac, audioNow, playSong, stopSong, sfx } from '../../lib/audio';
import { Icon, Sheet, Stars } from '../../components/ui';
import { Set3D, useTown } from './art';
import { HAT_SONG, TOOLS } from './content';
import { Art, artImage } from '../../components/Art';

const BPM = { little: 84, early: 96, reader: 108 };
const ROUND = 8; // beats per round = one line of the jingle
const HAT_HUE = [0, 60, 140, 200, 260, 320, 30];

/** Workshop Beat: tap along to the jingle. 7 rounds = 7 hats = the 7 days. */
export default function Day6({ band, guide, onFinish }) {
  const { t, lang } = useI18n(); const town = useTown();
  const cv = useRef(null); const S = useRef(null);
  useEffect(() => { town.clearShelf(); }, []); // eslint-disable-line
  const [round, setRound] = useState(0); const [phase, setPhase] = useState('ready'); // ready | play | between | done
  const [shelf, setShelf] = useState([]); const [tool, setTool] = useState(TOOLS[0]);
  const bpm = BPM[band]; const spb = 60 / bpm; const every = band === 'little' ? 2 : 1;
  const lyric = HAT_SONG.lyrics[round % 4];

  useEffect(() => { guide(t('d6Say'), 0, true); }, []); // eslint-disable-line
  useEffect(() => {
    const c = cv.current, x = c.getContext('2d'); const dpr = Math.min(devicePixelRatio, 2);
    const fit = () => { const r = c.getBoundingClientRect(); c.width = Math.max(300, r.width * dpr); c.height = 150 * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }; fit();
    const hitX = 70, speed = 160; let raf;
    const draw = () => {
      const s = S.current; const w = c.width / dpr; const now = audioNow();
      x.fillStyle = '#5a2a4f'; x.fillRect(0, 0, w, 150);
      for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(255,255,255,.04)'; x.fillRect((i * 37) % w, 0, 2, 150); }
      x.lineWidth = 5; x.strokeStyle = s?.flashT > 0 ? '#F7B500' : '#ffd9e8'; x.beginPath(); x.arc(hitX, 70, 30, 0, 7); x.stroke();
      if (s?.running) {
        const cb = (now - s.t0) / spb;
        for (const n of s.notes) {
          if (!n.res && now - (s.t0 + n.b * spb) > 0.25) n.res = 'miss';
          if (n.res) continue; const px = hitX + (n.b - cb) * spb * speed; if (px < -30 || px > w + 30) continue;
          x.fillStyle = '#fbf3df'; x.beginPath(); x.arc(px, 70, 22, 0, 7); x.fill(); x.strokeStyle = '#1b1b2f'; x.lineWidth = 3; x.stroke();
          const im = artImage(n.tool.icon); if (im.complete) x.drawImage(im, px - 15, 55, 30, 30);
        }
        if (s.flashT > 0) { x.fillStyle = '#F7B500'; x.font = '900 20px Nunito, sans-serif'; x.textAlign = 'start'; x.fillText(s.flash, hitX + 44, 30); s.flashT -= 1 / 60; }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const key = e => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) tap(); } };
    addEventListener('keydown', key);
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', key); stopSong(); clearTimeout(S.current?.end); };
  }, []); // eslint-disable-line

  const startRound = r => {
    if (!ac()) { finishAll([50]); return; }
    const notes = []; for (let b = 0; b < ROUND; b += every) notes.push({ b, res: null, tool: TOOLS[(b / every) % 3] });
    const ctl = playSong({ song: HAT_SONG, bpm, beats: ROUND, from: (r % 4) * ROUND, lead: spb * 2 });
    S.current = { notes, t0: ctl.t0, running: true, perfect: 0, good: 0, flashT: 0, flash: '' };
    setPhase('play');
    S.current.end = setTimeout(() => {
      const s = S.current; s.running = false; stopSong();
      const acc = Math.round((s.perfect + s.good * 0.6) / s.notes.length * 100);
      const kind = acc >= 80 ? 'sparkly' : acc >= 45 ? 'ok' : 'wonky';
      town.shelfHat(r, kind);
      setShelf(sh => { const n = [...sh, { acc, kind }]; if (n.length >= 7) setTimeout(() => finishAll(n.map(x => x.acc)), 900); return n; });
      sfx(kind === 'wonky' ? 'boing' : 'chime'); setPhase('between');
      if (r + 1 < 7) setTimeout(() => { setRound(r + 1); startRound(r + 1); }, 1500);
    }, (ROUND + 2.6) * spb * 1000);
  };
  const tap = () => {
    const s = S.current; if (!s?.running) return; const now = audioNow();
    let best = null, bd = 9; for (const n of s.notes) { if (n.res) continue; const d = Math.abs(now - (s.t0 + n.b * spb)); if (d < bd) { bd = d; best = n; } }
    const tl = best?.tool || tool; sfx(tl.id); setTool(tl);
    if (best && bd < 0.24) { best.res = bd < 0.11 ? 'perfect' : 'good'; if (best.res === 'perfect') { s.perfect++; s.flash = t('perfect'); } else { s.good++; s.flash = t('good'); } s.flashT = 0.4; }
  };
  const finishAll = accs => {
    setPhase('done');
    const avg = Math.round(accs.reduce((a, b) => a + b, 0) / accs.length);
    onFinish({ stars: avg >= 80 ? 3 : avg >= 50 ? 2 : 1, data: { rounds: accs, avg, bpm }, summary: t('d6Sum', { a: avg }) });
  };

  const last = shelf.at(-1);
  return <>
    <Set3D at="studio" cam={{ pos: [1.2, 3.2, 7.6], look: [1.0, 1.6, -1.2] }} cast={[{ id: 'said', at: [-1.2, -1.8], anim: phase === 'play' ? 'sew' : phase === 'between' && last?.kind !== 'wonky' ? 'hop' : 'idle' }]} />
    <Sheet size="tall"><div className="stack">
      <div className="eyebrow">{t('d6Ey')} · {t('roundN', { n: Math.min(7, round + 1), m: 7 })}</div>
      <h3>{t('d6Q')}</h3>
      <p className="small muted">{t('d6Help')}</p>
      <div className="row">{TOOLS.map(tl => <span key={tl.id} className={'tag' + (tool.id === tl.id ? ' l' : '')}><Art n={tl.icon} size={20} /> {lang === 'ar' ? tl.ar : tl.en}</span>)}</div>
      <canvas ref={cv} className="rh" aria-label={t('d6Lane')} />
      <div className="lyrics" style={{ background: '#5a2a4f' }} lang={lang}>{lang === 'ar' ? lyric.ar : lyric.en}</div>
      <div className="shelf" aria-label={t('d6Shelf')}>{Array.from({ length: 7 }, (_, i) => <span key={i} className={shelf[i]?.kind || ''} title={shelf[i] ? shelf[i].acc + '%' : ''}>{shelf[i] ? <Art n="hat" size={30} style={{ filter: `hue-rotate(${HAT_HUE[i]}deg)` }} /> : ''}</span>)}</div>
      {phase === 'ready' && <button className="btn big plum" onClick={() => startRound(0)}><Icon n="play" />{t('startSong')}</button>}
      {phase === 'play' && <button className="btn big tap" onPointerDown={e => { e.preventDefault(); tap(); }}><Art n={tool.icon} size={28} /> {t('tapSpace')}</button>}
      {phase === 'between' && last && <div className="row"><b>{t(last.kind === 'sparkly' ? 'd6Sparkly' : last.kind === 'ok' ? 'd6Good' : 'd6Wonky')}</b><Stars n={last.kind === 'sparkly' ? 3 : last.kind === 'ok' ? 2 : 1} /></div>}
    </div></Sheet>
  </>;
}
