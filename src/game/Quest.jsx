import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { sfx, stopSong } from '../lib/audio';
import { hush } from '../lib/speech';
import { Icon, Sheet, Stars, confetti } from '../components/ui';
import { lerp } from './world';
import { BANDS, pageArt, PEARL_SVG } from './content';
import ReadAloud from './ReadAloud';
import DiveGame from './DiveGame';
import Rhythm from './Rhythm';
import VoiceTicket from './VoiceTicket';
import { PageScan } from './Scanner';

const STEP_OF = { intro: 1, readPages: 1, read: 1, findScan: 2, findPick: 2, prep: 3, dive: 3, page7: 3, stone: 3, rhythm: 3, reflect1: 4, reflect2: 4, ending: 4, rewards: 4 };

export function Stepper({ step, done }) {
  const { t } = useI18n();
  return <nav className="stepper" aria-label="Quest steps">{t('steps').map((s, i) => { const n = i + 1; return <div key={n} className={'st' + (n === step ? ' on' : '') + (done.includes(n) ? ' done' : '')}><b>{done.includes(n) ? <Icon n="check" /> : n}</b><span>{s}</span></div>; })}</nav>;
}

export default function Quest({ ctx }) {
  const { t, L, lang } = useI18n();
  const { world, book, child, guide, cine, onComplete, onAbort, registerAbort } = ctx;
  const band = child.band; const cfg = BANDS[band];
  const [phase, setPhase] = useState('intro');
  const [attempt, setAttempt] = useState(1);
  const run = useRef({ dives: [], hints: 0, rhythm: [], stone: false, tips: [], bonus: 0, easy: 0, startedAt: Date.now() });
  const [, force] = useState(0);
  const R = run.current;
  const step = STEP_OF[phase];
  const done = [1, 2, 3, 4].filter(n => n < step);

  useEffect(() => { registerAbort(() => ({ ...R, completed: false })); }, []); // eslint-disable-line

  /* ---- step 1: intro video ---- */
  useEffect(() => {
    if (phase !== 'intro') return;
    const P = world.P.userData, rel = world.rel.bind(world);
    cine([
      { cap: t('cine1'), dur: 3.8, from: rel(-14, 18, 30), fromLook: rel(0, 0, 0), to: rel(-4, 9, 20), look: rel(0, 0, 0) },
      { cap: t('cine2'), dur: 4.2, to: rel(2.5, 3.2, 5), look: rel(0, 1.1, 0), start: () => { P.lid.rotation.x = -0.5; }, update: p => { P.lid.rotation.x = -0.5 + Math.sin(p * Math.PI * 3) * 0.12; } },
      { cap: t('cine3'), dur: 4, to: rel(0, 2.2, 3.6), look: rel(0, 1.1, 0), update: p => { P.pearl.position.y = 1.05 + Math.abs(Math.sin(p * Math.PI * 4)) * 0.15; } },
      { cap: t('cine4'), dur: 3.4, to: rel(-12, 6, 15), look: rel(-7.6, 0.5, 3.5) },
    ], { tag: L(book.name) }).then(() => {
      P.lid.rotation.x = -0.25; world.setMode({ type: 'pearl' });
      guide(t('introLearn'), 0, true); setPhase('readPages');
    });
  }, [phase]); // eslint-disable-line

  /* ---- step 4: ending video ---- */
  useEffect(() => {
    if (phase !== 'ending') return;
    const n = R.dives.length; const u = world.P.userData; const rel = world.rel.bind(world);
    const fin = () => { u.pearl.userData.free = true; u.pearl.position.set(0, 6, 0); u.pearl.scale.setScalar(1.2); u.lid.rotation.x = -1.1; u.glow.intensity = 1.2; world.goldenSky(); };
    cine([
      { cap: t('end1'), dur: 3.6, from: rel(3, 2.4, 5), fromLook: rel(0, 1, 0), to: rel(2.5, 3, 5.5), look: rel(0, 1.5, 0), start: () => { u.pearl.userData.free = true; }, update: p => { u.lid.rotation.x = lerp(-0.25, -1.1, p); u.glow.intensity = p * 1.2; u.pearl.position.y = 1.05 + p * 0.8; }, final: fin },
      { cap: t('end2'), dur: 4, to: rel(0, 7, 12), look: rel(0, 5, 0), start: () => world.goldenSky(), update: p => { u.pearl.position.y = 1.85 + p * 4.2; u.pearl.rotation.y = p * Math.PI * 2; u.pearl.scale.setScalar(0.85 + p * 0.35); } },
      { cap: t('end3', { n }), dur: 4.2, to: rel(-6, 8, 14), look: rel(0, 5.5, 0), update: p => { u.pearl.position.y = 6 + Math.sin(p * Math.PI * 3) * 0.3; } },
      { cap: t('end4'), dur: 3.4, to: rel(0, 10, 20), look: rel(0, 4, 0) },
    ], { tag: L(book.name), badge: t('endBadge', { n }) }).then(() => {
      fin(); confetti(); sfx('chime');
      const stars = n <= 4 ? 3 : 2;
      R.stars = stars; R.completed = true;
      onComplete({ ...R, durationSec: Math.round((Date.now() - R.startedAt) / 1000) });
      guide(t('youDidIt'), 7000, true);
      setPhase('rewards');
    });
  }, [phase]); // eslint-disable-line

  const startFind = () => { setPhase('findScan'); guide(t('findIntro'), 0, true); };
  const breath = cfg.breath + R.bonus + R.easy;

  const diveDone = async res => {
    R.dives.push({ ok: res.ok, reason: res.reason, depth: Math.round(res.depth), secs: Math.round(res.secs * 10) / 10, againstTide: Math.round(res.against * 10) / 10, air: res.air });
    if (res.ok) { R.lastChange = R.stone ? 'stone' : (R.lastTip || 'breath'); confetti(); sfx('chime'); setPhase('reflect1'); return; }
    const key = res.reason === 'pressure' ? 'pressure' : (cfg.tide && res.against > 1.2 ? 'tide' : 'breath');
    if (!R.tips.includes(key)) R.tips.push(key); R.lastTip = key;
    // adaptive difficulty: after 2 failed dives, quietly give more breath
    if (R.dives.filter(d => !d.ok).length >= 2) { R.easy = Math.min(4, R.easy + 1.5); }
    guide(t('tip_' + key), 0, true);
    setAttempt(a => a + 1);
    if (R.dives.length >= 3 && !R.stone) { setTimeout(() => guide(t('page7'), 0, true), 2500); setPhase('page7'); }
    else setPhase('rhythm');
  };

  const n = R.dives.length;
  const body = (() => {
    switch (phase) {
      case 'intro': case 'ending': case 'dive': return null;
      case 'readPages': return <Sheet size="slim"><div className="stack">
        <div className="eyebrow">1 · {L(book.book)}</div>
        <h2>{t('readPages')}</h2>
        {book.cover && <div className="bookref"><img src={book.cover} alt="" /><div><b>{L(book.book)}</b><p className="small muted">{t('bookRef')}</p></div></div>}
        <p>{t('readPagesBody')}</p>
        <button className="btn big" onClick={() => setPhase('read')}><Icon n="book" />{t('weRead')}</button>
      </div></Sheet>;
      case 'read': return <Sheet size="tall"><ReadAloud band={band} bandCfg={cfg} name={child.name} bookImg={book.pages?.read} guide={(x, ms) => guide(x, ms)} onDone={r => { R.reading = r; startFind(); }} /></Sheet>;
      case 'findScan': return <Sheet size="tall"><PageScan eyebrow={t('findStep')} title={t('findQ')} img={book.pages?.clue} art={pageArt('wave')} btnLabel={t('scanPage')} foundLabel={t('pageFound')} onDone={() => { sfx('chime'); setPhase('findPick'); }} /></Sheet>;
      case 'findPick': return <Sheet size="tall"><FindPick onHint={i => { R.hints++; guide(t(i === 0 ? 'hint1' : 'hint2'), 5000, true); }} onRight={() => { guide(t('yesWave'), 0, true); setTimeout(() => setPhase('prep'), 1800); }} /></Sheet>;
      case 'prep': return <Sheet size="tall"><div className="stack">
        <div className="eyebrow">{t('missionStep', { n: attempt })}</div>
        <h2>{attempt === 1 ? t('diveDown') : t('readyAgain')}</h2>
        <div className="tips">
          <div>{t('rule1')}</div><div>{t('rule2')}</div>
          {cfg.tide && <div>{t('ruleTide')}</div>}{cfg.pressure && <div>{t('rulePress')}</div>}
          {R.tips.map(k => <div key={k} className="tip">💡 {t('tip_' + k)}</div>)}
          {R.stone && <div className="power">🪨 {t('stoneTip')}</div>}
          {R.easy > 0 && <div className="power">🐦 {t('easier')}</div>}
        </div>
        <div className="row"><span className="tag s">{t('breathL')}: {breath.toFixed(1)}s</span>{R.bonus > 0 && <span className="tag l">+{R.bonus.toFixed(1)}s {t('fromSong')}</span>}</div>
        <button className="btn big sea" onClick={() => { if (attempt === 1) guide(t('letsDive'), 3000, true); setPhase('dive'); }}><Icon n="down" />{t('dive')}</button>
      </div></Sheet>;
      case 'page7': return <Sheet size="tall"><PageScan eyebrow={t('backToBook')} title={t('page7')} img={book.pages?.trick} art={pageArt('trick')} btnLabel={t('scanPage7')} foundLabel={t('page7Found')} plum onDone={() => { sfx('chime'); setPhase('stone'); }} /></Sheet>;
      case 'stone': return <Sheet size="slim"><div className="stack">
        <div className="eyebrow">{t('powerUp')}</div><h2>{t('stoneTitle')}</h2><p>{t('stoneBody')}</p>
        <p className="ar" lang="ar" style={{ fontSize: 22 }}>الحَجَر 🪨</p>
        <button className="btn big" onClick={() => { R.stone = true; force(x => x + 1); setPhase('rhythm'); }}>{t('useStone')}</button>
      </div></Sheet>;
      case 'rhythm': return <Sheet size="tall"><Rhythm bpm={cfg.bpm} beats={16} little={band === 'little'} eyebrow={'3 · ' + t('rhythmBreak')} title={t('fillBreath')} sub={t('fillBreathSub')} doneLabel={t('backToDive')}
        onDone={r => { R.rhythm.push(r.acc); R.bonus = Math.round(r.acc / 100 * 4.5 * 10) / 10; setPhase('prep'); }} /></Sheet>;
      case 'reflect1': { const q = n > 1 ? t('triedN', { n }) : t('triedOne'); return <Sheet size="tall"><VoiceTicket key="v1" eyebrow={t('voiceTicket')} question={q} chips={t('chips1')} onSend={a => { R.voice = [{ q, a, at: Date.now() }]; guide(t('whenTry'), 0, true); setPhase('reflect2'); }} /></Sheet>; }
      case 'reflect2': return <Sheet size="tall"><VoiceTicket key="v2" eyebrow={t('realLife')} question={t('whenTry')} chips={t('chips2')} onSend={a => { R.voice.push({ q: t('whenTry'), a, at: Date.now() }); sfx('ok'); guide('', 1); setPhase('ending'); }} /></Sheet>;
      case 'rewards': return <Sheet size="tall"><div className="stack">
        <div className="eyebrow">{t('complete')}</div>
        <div className="between"><h2>{t('reachedLight')}</h2><Stars n={R.stars} /></div>
        <p>{t('tookYou', { n })}</p>
        <div className="reward">
          <Reward bg="#1a8fe0" icon="🏅" title={t('badge')} sub={t('regionBadge')} />
          <Reward bg="#7b4fd6" icon="🎵" title={t('song')} sub={t('songSub')} />
          <Reward bg="#ffe9f1" html={PEARL_SVG} title={lang === 'ar' ? 'لؤلؤة' : "Lu'lu'a"} sub={t('newChar')} />
          <Reward bg="#e9e4f9" icon="🔒" title={lang === 'ar' ? 'يوميات كتكوت' : 'Diaries of a Chick'} sub={t('nextUnlock')} />
        </div>
        <div className="row">
          <button className="btn big" onClick={() => { onAbort(true); setTimeout(() => guide(t('chickNext'), 5000, true), 600); }}>{t('backMap')}</button>
          <button className="btn ghost" onClick={() => onAbort(true, 'music')}><Icon n="music" />{t('playSong')}</button>
        </div>
      </div></Sheet>;
      default: return null;
    }
  })();

  return <>
    {phase !== 'dive' && phase !== 'intro' && phase !== 'ending' && <Stepper step={step} done={phase === 'rewards' ? [1, 2, 3, 4] : done} />}
    {body}
    {phase === 'dive' && <DiveGame key={'d' + attempt} opts={{ breath, tide: cfg.tide, cycle: cfg.cycle, pressure: cfg.pressure, stone: R.stone, attempt }} onDone={diveDone} />}
  </>;
}

const Reward = ({ bg, icon, html, title, sub }) => (
  <div className="rw"><div className="em" style={{ background: bg }}>{html ? <span dangerouslySetInnerHTML={{ __html: html }} /> : icon}</div>{title}<small className="muted">{sub}</small></div>
);

function FindPick({ onHint, onRight }) {
  const { t } = useI18n();
  const [no, setNo] = useState([]); const [yes, setYes] = useState(false);
  const opts = [['fish', 'optFish'], ['wave', 'optWave'], ['sleep', 'optSleep']];
  return <div className="stack">
    <div className="eyebrow">{t('findStep')}</div>
    <h3>{t('pictureQ')}</h3>
    <div className="pick">{opts.map(([k, l]) => <button key={k} disabled={yes || no.includes(k)} className={no.includes(k) ? 'no' : yes && k === 'wave' ? 'yes' : ''}
      onClick={() => { if (k === 'wave') { sfx('chime'); setYes(true); onRight(); } else { sfx('soft'); onHint(no.length); setNo([...no, k]); } }}>
      <span style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: pageArt(k) }} /><span>{t(l)}</span></button>)}</div>
  </div>;
}

export function cleanupQuest(world) { stopSong(); hush(); world?.resetPearl(); }
