import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { api } from '../../lib/api';
import { sfx, stopSong } from '../../lib/audio';
import { hush } from '../../lib/speech';
import { Icon, Sheet, Stars, confetti, toast } from '../../components/ui';
import { HatStage, Set3D, Calendar, Face } from './art';
import { DAYS, CAST } from './content';
import Day1 from './Day1';
import Day2 from './Day2';
import Day3 from './Day3';
import Day4 from './Day4';
import Day5 from './Day5';
import Day6 from './Day6';
import Day7 from './Day7';
import { Art } from '../../components/Art';

const DAY = { 1: Day1, 2: Day2, 3: Day3, 4: Day4, 5: Day5, 6: Day6, 7: Day7 };
const ALL_CHARS = ['said', 'zizoun', 'strawberry', 'frog', 'swan', 'corn', 'ostrich'];

/** The shop square as it looks on a given day of the week: windows light up as the week goes by. */
export function ShopScene({ lit = 0, open = false, said = true, cast = [], cam, sky }) {
  return <Set3D at="shop" lit={lit} open={open} ribbon={open ? 'up' : undefined} cam={cam} sky={sky}
    cast={[...(said ? [{ id: 'said', at: [-2.6, 5.2], anim: 'wave', face: 0.3 }] : []), ...cast]} />;
}

export default function HatQuest({ ctx }) {
  const { t, L } = useI18n();
  const { child, state, guide, onSaved, onExit, registerAbort } = ctx;
  const prog = state.quest?.hat || { done: [], stars: {} };
  const nextDay = Math.min(7, (prog.done?.length || 0) + 1);
  const [phase, setPhase] = useState('week'); // week | day | dayDone | final
  const [day, setDay] = useState(nextDay);
  const [last, setLast] = useState(null);
  const started = useRef(0);

  useEffect(() => { guide(prog.done?.length ? t('hatWelcomeBack', { n: child.name, d: nextDay }) : t('hatHello', { n: child.name }), 7000, true); }, []); // eslint-disable-line

  // a day abandoned half-way is still recorded (completed: false) so the funnel is honest
  useEffect(() => {
    registerAbort(() => (phase === 'day' ? { world: 'hat', quest: day, completed: false, durationSec: Math.round((Date.now() - started.current) / 1000) } : null));
  }, [phase, day]); // eslint-disable-line

  const play = q => { sfx('pop'); setDay(q); started.current = Date.now(); setPhase('day'); };

  const finishDay = async res => {
    const q = day; const durationSec = Math.round((Date.now() - started.current) / 1000);
    hush(); stopSong();
    try {
      await api(`/children/${child.id}/runs`, { method: 'POST', body: { world: 'hat', quest: q, completed: true, durationSec, stars: res.stars, hints: res.hints || 0, readings: res.readings || [], voice: res.voice || [], data: res.data || {}, thanks: res.thanks } });
      const prevStars = prog.stars?.[q] || 0; const gained = Math.max(0, res.stars - prevStars);
      const done = [...new Set([...(prog.done || []), q])].sort((a, b) => a - b);
      const patch = {
        quest: { hat: { done, stars: { ...prog.stars, [q]: Math.max(prevStars, res.stars) } } }, stars: (state.stars || 0) + gained,
        collect: [...new Set([...(state.collect || ['ibis']), ...(q >= 7 ? ALL_CHARS : q >= 2 ? ['said', 'zizoun'] : [])])],
        songs: q >= 6 ? [...new Set([...(state.songs || []), 'hatjingle'])] : state.songs || [],
        badges: q >= 7 ? [...new Set([...(state.badges || []), 'hat-town', 'master-hat-designer'])] : state.badges || [],
      };
      await onSaved(patch);
    } catch (e) { toast(t('err_' + e.code) !== 'err_' + e.code ? t('err_' + e.code) : t('err_save')); }
    setLast({ q, ...res }); confetti(); sfx('chime');
    setPhase(q === 7 ? 'final' : 'dayDone');
    guide(q === 7 ? t('hatMaster', { n: child.name }) : t('dayDoneSay', { n: q }), 7000, true);
  };

  const Day = DAY[day];
  const doneNow = phase === 'dayDone' || phase === 'final' ? [...new Set([...(prog.done || []), last?.q])] : prog.done || [];
  return <HatStage>
    <Calendar done={doneNow} current={phase === 'day' ? day : null} />
    {phase === 'day' && <Day band={child.band} child={child} guide={guide} onFinish={finishDay} />}

    {phase === 'week' && <>
      <ShopScene lit={Math.round((prog.done?.length || 0) * 9 / 7)} />
      <Sheet size="tall"><div className="stack">
        <div className="between"><div><div className="eyebrow">{t('hatWeek')}</div><h2>{t('oneWeek')}</h2></div><button className="x" onClick={() => onExit()} aria-label={t('close')}><Icon n="x" /></button></div>
        <p className="desc">{t('hatStory')}</p>
        <div className="days">{DAYS.map(d => {
          const done = prog.done?.includes(d.q); const locked = d.q > nextDay;
          return <button key={d.q} className={'dayc' + (done ? ' done' : d.q === nextDay ? ' next' : '')} disabled={locked} onClick={() => play(d.q)}>
            <span className="ic">{locked ? <Icon n="lock" /> : <Art n={d.icon} size={30} />}</span><small>{t('dayN', { n: d.q })}</small><b>{L(d.title)}</b>
            <small>{done ? <Stars n={prog.stars?.[d.q] || 0} /> : L(d.learn)}</small></button>;
        })}</div>
        <button className="btn big" onClick={() => play(nextDay)}><Icon n="play" />{prog.done?.includes(nextDay) ? t('playAgain') : t('playDay', { n: nextDay })}</button>
      </div></Sheet>
    </>}

    {phase === 'dayDone' && last && <>
      <ShopScene lit={Math.round(doneNow.length * 9 / 7)} said={false} cast={[{ id: 'said', at: [-1.6, 5.4], anim: 'hop' }]} />
      <Sheet size="slim"><div className="stack">
        <div className="eyebrow">{t('dayN', { n: last.q })} · {L(DAYS[last.q - 1].title)}</div>
        <div className="between"><h2>{t('dayComplete')}</h2><Stars n={last.stars} /></div>
        {last.summary && <p className="desc">{last.summary}</p>}
        <div className="row"><span className="tag s">{t('learned')}: {L(DAYS[last.q - 1].learn)}</span></div>
        <div className="row">
          <button className="btn big" onClick={() => play(last.q + 1)}><Icon n="play" />{t('playDay', { n: last.q + 1 })}</button>
          <button className="btn ghost" onClick={() => setPhase('week')}>{t('seeWeek')}</button>
          <button className="btn ghost" onClick={() => onExit()}>{t('backMap')}</button>
        </div>
      </div></Sheet>
    </>}

    {phase === 'final' && <>
      <ShopScene lit={9} open sky="gold" cam="wide" said={false} cast={[{ id: 'said', at: [-0.6, 7.4], anim: 'dance' }, { id: 'zizoun', at: [0.6, 7.2], anim: 'clap' },
        ...['strawberry', 'frog', 'swan', 'corn', 'ostrich'].map((id, i) => ({ id, at: [-5 + i * 2.5, 9.4 - (i % 2) * 0.8], anim: 'dance' }))]} />
      <Sheet size="tall"><div className="stack">
        <div className="eyebrow">{t('hatComplete')}</div>
        <div className="between"><h2>{t('masterTitle')}</h2><Stars n={last?.stars || 3} /></div>
        <p>{t('masterBody')}</p>
        <div className="reward">
          <Rw bg="#fbf3df" icon="medal" title={t('hatBadge')} sub={t('regionBadge')} />
          <Rw bg="#fbf3df" icon="music" title={t('hatSong')} sub={t('songSub')} />
          <Rw bg="#fbf3df" icon="hat" title={t('masterTitle')} sub={t('titleEarned')} />
        </div>
        <div className="eyebrow">{t('newFriends')}</div>
        <div className="row">{CAST.map(c => <span key={c.id} className="row small" style={{ gap: 4 }}><Face id={c.id} bg={c.bg} size={48} /><b>{L(c.name)}</b></span>)}</div>
        <div className="row">
          <button className="btn big" onClick={() => onExit()}>{t('backMap')}</button>
          <button className="btn ghost" onClick={() => onExit('music')}><Icon n="music" />{t('playJingle')}</button>
        </div>
      </div></Sheet>
    </>}
  </HatStage>;
}

const Rw = ({ bg, icon, title, sub }) => <div className="rw"><div className="em" style={{ background: bg }}><Art n={icon} size={34} /></div>{title}<small className="muted">{sub}</small></div>;
