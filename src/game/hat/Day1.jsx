import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { sfx } from '../../lib/audio';
import { say } from '../../lib/speech';
import { Sheet } from '../../components/ui';
import { PageScan } from '../Scanner';
import { Set3D, Story } from './art';
import { ShopScene } from './HatQuest';
import ReadLines from './ReadLines';
import { P5, Q1_ROUNDS, Q1_REPLIES, Q1_CAUSE, PAGE, cust, gk } from './content';

export default function Day1({ band, guide, onFinish }) {
  const { t, L, lang } = useI18n();
  const [phase, setPhase] = useState('intro'); // intro | read | choice | cause | scan
  const [lit, setLit] = useState(0);
  const [round, setRound] = useState(0);
  const [reaction, setReaction] = useState(null); // {kind, reply}
  const [leaving, setLeaving] = useState(false);
  const R = useRef({ readings: [], choices: [], causeTries: 0 }).current;
  const lines = P5[band].map((ar, i) => ({ ar, en: P5.en[band][i] }));

  useEffect(() => { if (phase === 'read') guide(t('d1Read'), 0, true); }, [phase]); // eslint-disable-line

  if (phase === 'intro') return <Story tag={t('dayN', { n: 1 })} onDone={() => setPhase('read')} shots={[
    { dur: 4.4, cap: t('d1c1'), set: { at: 'shop', lit: 9, cam: 'wide', cast: [
      { id: 'strawberry', from: [-9, 10], at: [-2.2, 4.6], anim: 'bob' }, { id: 'frog', from: [9, 11], at: [2.4, 4.8], anim: 'hop' }, { id: 'swan', from: [-11, 6], at: [-4.4, 5.6], anim: 'idle', face: 0.4 },
      { id: 'zizoun', at: [0.9, 4.0], anim: 'cross' }] } },
    { dur: 4.4, cap: t('d1c2'), sfx: town => { for (let k = 0; k < 9; k++) setTimeout(() => { town.setLit(8 - k); sfx('soft'); }, 300 + k * 350); }, set: { at: 'shop', cast: [
      { id: 'strawberry', at: [-2.2, 4.6], anim: 'sad' }, { id: 'frog', at: [2.4, 4.8], anim: 'sad' }, { id: 'swan', at: [-4.4, 5.6], anim: 'sad', face: 0.4 }, { id: 'zizoun', at: [0.9, 4.0], anim: 'shake' }] } },
    { dur: 4.2, cap: t('d1c3'), set: { at: 'shop', lit: 0, cam: 'wide', cast: [
      { id: 'strawberry', at: [-2.2, 4.6], to: [-12, 14] }, { id: 'frog', at: [2.4, 4.8], to: [12, 15] }, { id: 'swan', at: [-4.4, 5.6], to: [-14, 9] }, { id: 'zizoun', at: [0.9, 4.0], anim: 'cross' }] } },
    { dur: 4.6, cap: t('d1c4'), sfx: () => sfx('door'), set: { at: 'house', sky: 'dusk', cast: [{ id: 'zizoun', at: [0.4, -1.75], anim: 'sit', y: -0.15 }] } },
    { dur: 4.4, cap: t('d1c5'), set: { at: 'shop', lit: 0, cast: [{ id: 'said', from: [-7, 9], at: [-1.2, 5.4], anim: 'hop' }] } },
  ]} />;

  const finish = () => {
    const stars = 1 + (R.readings[0]?.accuracy >= 80 ? 1 : 0) + (R.causeFirst ? 1 : 0);
    onFinish({ stars, readings: R.readings, data: { windowsLit: R.windowsLit ?? lit, choices: R.choices, causeFirst: !!R.causeFirst, causeTries: R.causeTries, spottedOpen: R.choices.some(c => c.kind === 'open') },
      summary: t('d1Sum') });
  };

  const rd = Q1_ROUNDS[round]; const c = rd && cust(rd.who);
  const reply = r => {
    if (reaction) return;
    R.choices.push({ customer: rd.who, kind: r.kind, reply: Q1_REPLIES.indexOf(r) });
    setReaction(r); say(L(r), lang);
    if (r.kind === 'old') { sfx('soft'); setTimeout(() => { setLeaving(true); setLit(l => Math.max(0, l - 3)); sfx('door'); }, 1600); guide(t(gk('d1Left', c, lang), { c: L(c.name) }), 0, false); }
    else { sfx('gasp'); guide(t('d1Open'), 0, true); setTimeout(() => setLeaving(true), 3800); }
  };
  const nextRound = () => { setReaction(null); setLeaving(false); if (round + 1 < Q1_ROUNDS.length) setRound(round + 1); else { setPhase('cause'); guide(t('d1CauseSay'), 0, true); } };

  const old = reaction?.kind === 'old';
  return <>
    {phase === 'read' && <ShopScene lit={lit} />}
    {phase === 'choice' && c && <Set3D at="shop" lit={Math.max(0, 9 - round * 3 - (leaving && old ? 3 : 0))} cast={[
      { id: 'zizoun', at: [2.4, 4.6], anim: old ? 'shake' : reaction ? 'cross' : 'idle', face: -0.5 },
      { id: 'said', at: [-0.6, 5.6], anim: reaction ? (old ? 'sad' : 'hop') : 'talk', face: 0.6 },
      leaving && old ? { id: rd.who, at: [-3.2, 6.2], to: [-13, 13] } : { id: rd.who, from: [-11, 11], at: [-3.2, 6.2], anim: 'idle', face: 0.5 }]} />}
    {phase === 'cause' && <Set3D at="shop" lit={0} cast={[{ id: 'zizoun', at: [2.4, 4.6], anim: 'cross', face: -0.5 }, { id: 'said', at: [-0.6, 5.6], anim: 'sad', face: 0.4 }]} />}
    {phase === 'scan' && <Set3D at="shop" lit={0} cast={[{ id: 'said', at: [-0.8, 5.6], anim: 'bob' }]} />}
    {reaction && phase === 'choice' && <div className="say3d"><b>{t('zizounSays')}</b> {L(reaction)}</div>}

    {phase === 'read' && <Sheet size="tall"><ReadLines id="p5" lines={lines} band={band} eyebrow={t('d1ReadEy')} intro={t('d1ReadIntro')}
      onLine={(i) => setLit(Math.round(9 * (i + 1) / lines.length))}
      onDone={r => { R.readings.push(r); setLit(l => { R.windowsLit = l; return l; }); guide(t('d1Awake'), 0, true); setTimeout(() => { setPhase('choice'); guide(t('d1ChoiceSay'), 0, true); }, 1800); }} /></Sheet>}

    {phase === 'choice' && rd && <Sheet size="slim"><div className="stack">
      <div className="eyebrow">{t('d1ChoiceEy', { n: round + 1, m: Q1_ROUNDS.length })}</div>
      <h3>{L(rd.ask)}</h3>
      <p className="small muted">{t('d1Pick')}</p>
      <div className="list">{Q1_REPLIES.map((r, i) => <button key={i} className="btn ghost" style={{ justifyContent: 'flex-start', textAlign: 'start' }} disabled={!!reaction} onClick={() => reply(r)}>{L(r)}</button>)}</div>
      {reaction && <p className="desc">{reaction.kind === 'old' ? t(gk('d1OldResult', c, lang), { c: L(c.name) }) : t('d1OpenResult')}</p>}
      {reaction && <button className="btn big" onClick={nextRound}>{t('next')}</button>}
    </div></Sheet>}

    {phase === 'cause' && <Sheet size="slim"><Cause onRight={first => { R.causeFirst = first; setPhase('scan'); guide(t('d1ScanSay'), 0, true); }} onTry={() => { R.causeTries++; }} /></Sheet>}

    {phase === 'scan' && <Sheet size="tall"><PageScan eyebrow={t('bookLink')} title={t('d1ScanQ')} img={PAGE(7)} btnLabel={t('scanPageN', { n: 7 })} foundLabel={t('pageFoundN', { n: 7 })} plum onDone={() => { sfx('chime'); finish(); }} /></Sheet>}
  </>;
}

function Cause({ onRight, onTry }) {
  const { t, L } = useI18n();
  const [no, setNo] = useState([]); const [yes, setYes] = useState(false);
  return <div className="stack">
    <div className="eyebrow">{t('causeEffect')}</div>
    <h3>{L(Q1_CAUSE.q)}</h3>
    <div className="list">{Q1_CAUSE.opts.map((o, i) => <button key={i} className={'btn ' + (yes && o.ok ? '' : 'ghost')} style={{ justifyContent: 'flex-start', textAlign: 'start', opacity: no.includes(i) ? 0.45 : 1 }} disabled={yes || no.includes(i)}
      onClick={() => { onTry(); if (o.ok) { sfx('chime'); setYes(true); setTimeout(() => onRight(no.length === 0), 1400); } else { sfx('soft'); setNo([...no, i]); } }}>{L(o)}</button>)}</div>
    {no.length > 0 && !yes && <p className="small muted">{t('d1CauseHint')}</p>}
  </div>;
}
