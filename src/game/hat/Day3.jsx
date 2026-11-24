import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { ac, sfx } from '../../lib/audio';
import { say, hush } from '../../lib/speech';
import { Icon, Sheet } from '../../components/ui';
import { PageScan } from '../Scanner';
import { Set3D, Face, useTown, charImg } from './art';
import { PAGE, HEADS, FACTS, FACT_QUIZ, cust } from './content';
import { Art } from '../../components/Art';

// visit order follows the fact-card pages: scan page 27, meet three; scan page 26, meet two
const PLAN = [{ scan: 27 }, { who: 'frog' }, { who: 'swan' }, { who: 'ostrich' }, { scan: 26 }, { who: 'corn' }, { who: 'strawberry' }];
const GAME = { frog: FrogGame, corn: CornGame, swan: SwanGame, strawberry: StrawberryGame, ostrich: OstrichGame };
// where each customer lives, and where they and Said stand
const HOME = {
  frog: { at: 'pond', me: [-1.6, 2.4], said: [1.9, 2.8] }, swan: { at: 'lake', me: [0.3, 0.2], said: [-1.2, 0.62] }, ostrich: { at: 'dunes', me: [0, 0], said: [2.2, 2.4] },
  corn: { at: 'field', me: [0, 1.6], said: [2.0, 2.6] }, strawberry: { at: 'patch', me: [0, 1.6], said: [2.0, 2.6] },
};

export default function Day3({ band, guide, onFinish }) {
  const { t, L } = useI18n();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('plan'); // plan | fact | compare | quiz
  const R = useRef({ customers: [], ostrich: null }).current;
  const cur = PLAN[step];

  useEffect(() => {
    if (phase !== 'plan' || !cur) return;
    if (cur.scan) guide(t('d3ScanSay', { n: cur.scan }), 0, true);
    else guide(L(HEADS[cur.who].how), 0, true);
  }, [step, phase]); // eslint-disable-line

  const measured = res => { R.customers.push({ id: cur.who, cm: HEADS[cur.who].cm, tries: res.tries }); if (cur.who === 'ostrich') R.ostrich = res.ostrich; sfx('chime'); setPhase('fact'); };
  const nextStep = () => { hush(); if (step + 1 < PLAN.length) { setStep(step + 1); setPhase('plan'); } else { setPhase('compare'); guide(t(band === 'little' ? 'd3BiggestSay' : 'd3OrderSay'), 0, true); } };
  const finish = quiz => {
    const stars = 1 + (R.compareFirst ? 1 : 0) + (quiz.right / quiz.of >= 0.75 ? 1 : 0);
    onFinish({ stars, data: { customers: R.customers, compareFirst: !!R.compareFirst, quiz, ostrich: R.ostrich }, summary: t('d3Sum') });
  };

  const c = cur?.who && cust(cur.who); const G = cur?.who && GAME[cur.who];
  const H = c && HOME[c.id];
  const lineup = ['swan', 'ostrich', 'strawberry', 'frog', 'corn'];
  return <>
    {phase === 'plan' && cur?.scan && <Set3D at="shop" lit={3} cast={[{ id: 'said', at: [-0.8, 5.6], anim: 'bob' }]} />}
    {(phase === 'plan' || phase === 'fact') && c && <Set3D at={H.at} ladder={c.id === 'swan' && phase === 'plan'} cast={[
      { id: c.id, at: H.me, anim: phase === 'fact' ? 'dance' : 'idle' },
      { id: 'said', at: H.said, anim: c.id === 'swan' && phase === 'plan' ? 'climb' : 'idle', face: c.id === 'swan' && phase === 'plan' ? Math.PI : -0.6 }]} />}
    {(phase === 'compare' || phase === 'quiz') && <Set3D at="shop" lit={3} cam="wide" cast={lineup.map((id, i) => ({ id, at: [-4.4 + i * 2.2, 5.6], anim: phase === 'quiz' ? 'bob' : 'idle' }))} />}

    {phase === 'plan' && cur?.scan && <Sheet size="tall"><PageScan eyebrow={t('bookLink')} title={t('d3ScanQ', { n: cur.scan })} img={PAGE(cur.scan)} btnLabel={t('scanPageN', { n: cur.scan })} foundLabel={t('housesOpen')} onDone={() => { sfx('chime'); nextStep(); }} /></Sheet>}
    {phase === 'plan' && c && <Sheet size="tall"><div className="stack">
      <div className="eyebrow">{t('d3Visit')} · {L(c.name)}</div>
      <h3>{L(HEADS[c.id].problem)}</h3>
      <p className="small muted">{L(HEADS[c.id].how)}</p>
      <G key={c.id} band={band} onDone={measured} guide={guide} />
    </div></Sheet>}
    {phase === 'fact' && c && <Sheet size="tall"><FactCard id={c.id} onNext={nextStep} /></Sheet>}
    {phase === 'compare' && <Sheet size="tall"><Compare band={band} customers={R.customers} onDone={first => { R.compareFirst = first; setPhase('quiz'); guide(t('d3QuizSay'), 0, true); }} /></Sheet>}
    {phase === 'quiz' && <Sheet size="tall"><Quiz band={band} onDone={finish} /></Sheet>}
  </>;
}

function Tape({ cm, show }) {
  const { t } = useI18n();
  if (!show) return null;
  return <div className="row" style={{ justifyContent: 'center' }}><span className="tag l" style={{ fontSize: 18 }}><Art n="tape" size={22} /> {t('cmN', { n: cm })}</span></div>;
}

function FrogGame({ band, onDone }) {
  const { t } = useI18n(); const town = useTown();
  const [ok, setOk] = useState(false); const tries = useRef(0); const S = useRef({ T: 0, y: 0 }).current;
  const speed = band === 'little' ? 1.4 : band === 'early' ? 1.9 : 2.4;
  useEffect(() => {
    const fr = town.char('frog'); let raf, lastBoing = 0;
    const loop = () => { if (!ok) { S.T += 1 / 60; S.y = Math.abs(Math.sin(S.T * speed)); fr.extraY = S.y * 1.3; if (S.y < 0.05 && S.T - lastBoing > 0.5) { lastBoing = S.T; sfx('boing'); } } raf = requestAnimationFrame(loop); };
    loop(); return () => { cancelAnimationFrame(raf); fr.extraY = 0; town.tape(null); };
  }, [ok, speed]); // eslint-disable-line
  const measure = () => { tries.current++; if (S.y > (band === 'little' ? 0.45 : 0.6)) { setOk(true); town.tape('frog', 0.7); sfx('chime'); setTimeout(() => onDone({ tries: tries.current }), 1400); } else sfx('soft'); };
  return <>
    <Tape cm={HEADS.frog.cm} show={ok} />
    {!ok && <button className="btn big sea" onClick={measure}><Art n="tape" size={26} /> {t('measure')}</button>}
  </>;
}

function CornGame({ onDone }) {
  const { t } = useI18n(); const town = useTown();
  const [dx, setDx] = useState(0); const [ok, setOk] = useState(false); const drag = useRef(null); const tries = useRef(0);
  useEffect(() => () => { town.hair(0); town.tape(null); }, []); // eslint-disable-line
  const down = e => { drag.current = { x: e.clientX, d: dx }; e.currentTarget.setPointerCapture(e.pointerId); tries.current++; sfx('rustle'); };
  const move = e => { if (!drag.current || ok) return; const v = Math.max(-120, Math.min(120, drag.current.d + (e.clientX - drag.current.x))); setDx(v); town.hair(v / 120); if (Math.abs(v) > 90) { setOk(true); sfx('ok'); town.tape('corn', 0.6); setTimeout(() => onDone({ tries: tries.current }), 1400); } };
  return <>
    <div className="hairtrack" dir="ltr"><div className="hair" role="slider" aria-label={t('pushHair')} aria-valuenow={Math.round(Math.abs(dx) / 1.2)} tabIndex={0}
      onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { const v = dx + (e.key === 'ArrowRight' ? 30 : -30); setDx(v); town.hair(v / 120); if (Math.abs(v) > 90 && !ok) { setOk(true); town.tape('corn', 0.6); setTimeout(() => onDone({ tries: 1 }), 1400); } } }}
      style={{ transform: `translateX(${dx}px)` }} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }}><Art n="comb" size={34} /></div></div>
    <Tape cm={HEADS.corn.cm} show={ok} />
    {!ok && <p className="small muted">↔ {t('pushHair')}</p>}
  </>;
}

function SwanGame({ band, onDone }) {
  const { t } = useI18n(); const town = useTown();
  const need = band === 'little' ? 3 : band === 'early' ? 4 : 5; const [n, setN] = useState(0);
  useEffect(() => () => { town.char('said').extraY = 0; town.tape(null); }, []); // eslint-disable-line
  useEffect(() => { town.char('said').extraY = n / need * 2.1; }, [n]); // eslint-disable-line
  const climb = () => { if (n >= need) return; const k = n + 1; setN(k); sfx('tap'); if (k >= need) { sfx('chime'); town.tape('swan', 0.6); setTimeout(() => onDone({ tries: k }), 1400); } };
  return <>
    <Tape cm={HEADS.swan.cm} show={n >= need} />
    {n < need && <button className="btn big sea" onClick={climb}><Art n="ladder" size={26} /> {t('climb')} ({n}/{need})</button>}
  </>;
}

function StrawberryGame({ band, onDone }) {
  const { t } = useI18n(); const town = useTown();
  const [v, setV] = useState(0); const [hold, setHold] = useState(false); const [st, setSt] = useState(''); const tries = useRef(0);
  const zone = band === 'little' ? [50, 88] : band === 'early' ? [58, 84] : [64, 82];
  useEffect(() => { town.tape('strawberry', 0); return () => { town.tape(null); town.squash('strawberry', false); }; }, []); // eslint-disable-line
  useEffect(() => { town.tape('strawberry', v / 100); }, [v]); // eslint-disable-line
  useEffect(() => { if (!hold) return; const iv = setInterval(() => setV(x => { const nx = x + 2.2; if (nx > 95 && x <= 95) { setHold(false); setSt('squash'); sfx('soft'); tries.current++; town.squash('strawberry', true); } return Math.min(100, nx); }), 40); return () => clearInterval(iv); }, [hold]); // eslint-disable-line
  const release = () => {
    if (!hold) return; setHold(false); tries.current++;
    if (v >= zone[0] && v <= zone[1]) { setSt('ok'); sfx('chime'); town.char('strawberry').anim = 'dance'; setTimeout(() => onDone({ tries: tries.current }), 1300); }
    else { setSt(v > zone[1] ? 'squash' : 'loose'); sfx('soft'); if (v > zone[1]) town.squash('strawberry', true); }
  };
  const reset = () => { setV(0); setSt(''); town.squash('strawberry', false); };
  return <>
    <div className="meter" style={{ position: 'relative' }}><i style={{ width: v + '%', background: v > zone[1] ? 'var(--bad)' : v >= zone[0] ? 'var(--good)' : 'var(--warn)' }} />
      <span style={{ position: 'absolute', insetInlineStart: zone[0] + '%', width: (zone[1] - zone[0]) + '%', top: 0, bottom: 0, outline: '2px dashed var(--good)' }} /></div>
    {st === 'squash' && <p className="err">{t('squashed')}</p>}{st === 'loose' && <p className="err">{t('tooLoose')}</p>}
    <Tape cm={HEADS.strawberry.cm} show={st === 'ok'} />
    {st !== 'ok' && (st ? <button className="btn big" onClick={reset}>{t('again')}</button>
      : <button className="btn big sea" onPointerDown={e => { e.preventDefault(); ac(); setHold(true); }} onPointerUp={release} onPointerLeave={release}
        onKeyDown={e => { if (e.key === ' ' && !e.repeat) { e.preventDefault(); setHold(true); } }} onKeyUp={e => e.key === ' ' && release()}><Art n="tape" size={26} /> {t('holdTape')}</button>)}
  </>;
}

/** Talk softly into the mic to coax Hashoura out of the sand. Loud voices make her hide. */
function OstrichGame({ band, onDone, guide }) {
  const { t } = useI18n(); const town = useTown();
  const [p, setP] = useState(0); const [vol, setVol] = useState(0); const [mode, setMode] = useState('ask');
  const S = useRef({ shouts: 0, t0: Date.now(), stream: null, raf: 0, hold: false, taps: [], mode: 'ask', done: false }).current;
  const need = band === 'little' ? 60 : 100;
  const loudAt = band === 'little' ? 0.28 : 0.2;
  // set after the scene has placed her (parent effects run after this one)
  useEffect(() => { const k = setTimeout(() => { town.char('ostrich').extraY = -2.45 * (1 - p / need); }, 0); return () => clearTimeout(k); }, [p]); // eslint-disable-line
  const step = (soft, shout) => setP(x => {
    if (shout) { if (x > 10) { S.shouts++; sfx('soft'); guide(t('tooLoud'), 2500); town.char('ostrich').anim = 'shake'; setTimeout(() => { if (!S.done) town.char('ostrich').anim = 'idle'; }, 700); } return Math.max(0, x - 35); }
    const nx = soft ? x + 0.9 : x; if (nx >= need && !S.done) { S.done = true; sfx('chime'); setTimeout(() => finish(), 1200); } return Math.min(need, nx);
  });
  const finish = () => { cleanup(); setMode('done'); town.char('ostrich').anim = 'dance'; town.tape('ostrich', 0.5); onDone({ tries: S.shouts + 1, ostrich: { mic: S.mode === 'mic', shouts: S.shouts, secs: Math.round((Date.now() - S.t0) / 1000) } }); };
  const cleanup = () => { cancelAnimationFrame(S.raf); S.stream?.getTracks().forEach(tr => tr.stop()); S.stream = null; };
  useEffect(() => () => { cleanup(); town.char('ostrich').extraY = 0; town.tape(null); }, []); // eslint-disable-line
  const startMic = async () => {
    try {
      const a = ac(); const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); S.stream = stream;
      const an = a.createAnalyser(); an.fftSize = 1024; a.createMediaStreamSource(stream).connect(an); const buf = new Float32Array(an.fftSize);
      setMode('mic'); S.mode = 'mic';
      const loop = () => { an.getFloatTimeDomainData(buf); let s = 0; for (const x of buf) s += x * x; const rms = Math.sqrt(s / buf.length); setVol(Math.min(1, rms * 4)); step(rms > 0.012 && rms < loudAt, rms >= loudAt + 0.08); S.raf = requestAnimationFrame(loop); };
      loop();
    } catch { setMode('button'); S.mode = 'button'; guide(t('noMicSoft'), 4000); }
  };
  useEffect(() => { if (mode !== 'button') return; const iv = setInterval(() => { if (S.hold) step(true, false); }, 30); return () => clearInterval(iv); }, [mode]); // eslint-disable-line
  const tapDown = () => { const now = Date.now(); S.taps = [...S.taps.filter(x => now - x < 1200), now]; if (S.taps.length >= 4) { S.taps = []; step(false, true); } S.hold = true; };
  return <>
    {mode === 'mic' && <div className="volume" aria-label={t('volume')}><i className={vol > loudAt * 4 ? 'loud' : ''} style={{ width: vol * 100 + '%' }} /></div>}
    <div className="meter"><i style={{ width: p / need * 100 + '%', background: 'var(--teal)' }} /></div>
    <Tape cm={HEADS.ostrich.cm} show={mode === 'done'} />
    {mode === 'ask' && <div className="row"><button className="btn big sea" onClick={startMic}><Icon n="mic" />{t('talkSoftly')}</button><button className="btn ghost" onClick={() => { setMode('button'); S.mode = 'button'; }}>{t('noMicBtn')}</button></div>}
    {mode === 'mic' && <p className="small" style={{ fontWeight: 800 }}><Art n="mic" size={22} /> {t('whisperHint')}</p>}
    {mode === 'button' && <button className="btn big sea" onPointerDown={e => { e.preventDefault(); tapDown(); }} onPointerUp={() => { S.hold = false; }} onPointerLeave={() => { S.hold = false; }}><Art n="shh" size={26} /> {t('holdWhisper')}</button>}
  </>;
}

function FactCard({ id, onNext }) {
  const { t, L, lang } = useI18n();
  const c = cust(id); const f = FACTS[id];
  useEffect(() => { say(f.ar.join(' '), 'ar'); return () => hush(); }, []); // eslint-disable-line
  return <div className="stack">
    <div className="eyebrow">{t('factCard')} · {t('pageN', { n: f.page })}</div>
    <div className="factcard"><img src={charImg(c.id)} alt="" /><div><h4>{L(c.name)}</h4>
      <ul lang="ar" dir="rtl" className="ar">{f.ar.map((x, i) => <li key={i}>{x}</li>)}</ul>
      {lang === 'en' && <ul className="small muted" style={{ marginTop: 6 }}>{f.en.map((x, i) => <li key={i}>{x}</li>)}</ul>}</div></div>
    {id === 'ostrich' && <p className="small muted"><Art n="bulb" size={20} /> {t('ostrichMyth')}</p>}
    <div className="row"><button className="btn ghost" onClick={() => say(f.ar.join(' '), 'ar')}><Icon n="speaker" />{t('hearIt')}</button><button className="btn big" onClick={onNext}>{t('nextHouse')}</button></div>
  </div>;
}

function Compare({ band, customers, onDone }) {
  const { t, L } = useI18n();
  const sorted = [...customers].sort((a, b) => a.cm - b.cm).map(x => x.id);
  const [order, setOrder] = useState([]); const [wrong, setWrong] = useState(0); const [ok, setOk] = useState(false);
  const shuffled = useRef([...customers].sort(() => Math.random() - 0.5)).current;
  const pick = id => {
    if (ok) return;
    if (band === 'little') { if (id === sorted.at(-1)) { setOk(true); sfx('chime'); setTimeout(() => onDone(wrong === 0), 1200); } else { setWrong(w => w + 1); sfx('soft'); } return; }
    if (order.includes(id)) return;
    if (id === sorted[order.length]) { const o = [...order, id]; setOrder(o); sfx('ok'); if (o.length === sorted.length) { setOk(true); sfx('chime'); setTimeout(() => onDone(wrong === 0), 1200); } }
    else { setWrong(w => w + 1); sfx('soft'); }
  };
  return <div className="stack">
    <div className="eyebrow">{t('d3CompareEy')}</div>
    <h3>{band === 'little' ? t('d3Biggest') : t('d3Order')}</h3>
    <div className="sizes">{shuffled.map(x => { const c = cust(x.id); return <button key={x.id} className={order.includes(x.id) || (ok && band === 'little' && x.id === sorted.at(-1)) ? 'on' : ''} onClick={() => pick(x.id)}>
      <Face id={c.id} bg={c.bg} size={30 + x.cm * 1.5} /><span>{L(c.name)}</span><span className="tag">{t('cmN', { n: x.cm })}</span>
      {order.includes(x.id) && <b>#{order.indexOf(x.id) + 1}</b>}</button>; })}</div>
    {wrong > 0 && !ok && <p className="small muted">{t('d3CompareHint')}</p>}
  </div>;
}

function Quiz({ band, onDone }) {
  const { t, L } = useI18n();
  const qs = band === 'little' ? FACT_QUIZ.slice(0, 2) : FACT_QUIZ;
  const [i, setI] = useState(0); const [no, setNo] = useState([]); const right = useRef(0);
  const q = qs[i];
  useEffect(() => { say(q.q.ar, 'ar'); }, [i]); // eslint-disable-line
  const pick = id => {
    if (id === q.a) { if (!no.length) right.current++; sfx('chime'); setNo([]); if (i + 1 < qs.length) setI(i + 1); else onDone({ right: right.current, of: qs.length }); }
    else { sfx('soft'); setNo([...no, id]); }
  };
  return <div className="stack">
    <div className="eyebrow">{t('d3QuizEy', { n: i + 1, m: qs.length })}</div>
    <h3>{L(q.q)}</h3>
    <div className="pick">{q.opts.map(id => { const c = cust(id); return <button key={id} className={no.includes(id) ? 'no' : ''} disabled={no.includes(id)} onClick={() => pick(id)}><Face id={c.id} bg={c.bg} size={64} />{L(c.name)}</button>; })}</div>
  </div>;
}
