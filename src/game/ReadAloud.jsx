import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { alignWords, canListen, listen, say, wordSim, hush, prefetchSpeech } from '../lib/speech';
import { ac, sfx } from '../lib/audio';
import { Icon, Stars, Wave } from '../components/ui';
import { READ, clean } from './content';

/**
 * Real Arabic read-aloud. Uses the browser speech recogniser (ar-SA) with:
 *  - diacritic / hamza / ta-marbuta normalisation
 *  - fuzzy per-word matching (Levenshtein + article stripping), best of 5 alternatives
 *  - in-order alignment that tolerates skipped/merged words, live highlighting
 *  - a per-word retry round for missed words
 * Falls back to "tap each word" when the browser cannot listen.
 */
export default function ReadAloud({ band, bandCfg, name, bookImg, onDone, guide }) {
  const { t, L, lang } = useI18n();
  const R = READ[band]; const little = band === 'little';
  const words = useMemo(() => R.words.split(/\s+/), [R]);
  const thr = bandCfg.thr;
  const [scores, setScores] = useState(() => words.map(() => 0));
  const [phase, setPhase] = useState('ready'); // ready | listening | retry | tap | result
  const [heard, setHeard] = useState('');
  const [err, setErr] = useState('');
  const [retryIdx, setRetryIdx] = useState(-1);
  const [tries, setTries] = useState({});
  const t0 = useRef(0), dur = useRef(0), rec = useRef(null);

  useEffect(() => {
    prefetchSpeech(R.words, 'ar'); words.forEach(w => prefetchSpeech(clean(w), 'ar'));
    if (little) { ac(); setTimeout(() => say(R.words, 'ar'), 400); }
    return () => { rec.current?.stop(); hush(); };
  }, []); // eslint-disable-line

  const sumScore = tr => alignWords(words.map(clean), tr).reduce((a, b) => a + b, 0);
  const start = () => {
    ac(); hush(); setErr('');
    if (!canListen) { setPhase('tap'); setErr(t('noMic')); return; }
    setPhase('listening'); t0.current = performance.now(); let failed = false;
    rec.current = listen({
      lang: 'ar-SA', pick: sumScore, maxMs: little ? 10000 : 25000,
      onUpdate: (tr, fin) => {
        setHeard(tr);
        const s = alignWords(words.map(clean), tr);
        setScores(prev => prev.map((p, i) => Math.max(p, s[i])));
        // stop early once every word is matched
        if (!fin && s.every(x => x >= thr)) rec.current?.stop();
      },
      onEnd: () => { if (failed) return; dur.current = (performance.now() - t0.current) / 1000; setPhase('checked'); },
      onError: e => { failed = true; setErr(e === 'not-allowed' || e === 'service-not-allowed' ? t('micDenied') : t('noMic')); setPhase('tap'); },
    });
  };
  // after the first pass, walk through the missed words one by one
  useEffect(() => {
    if (phase !== 'checked') return;
    const miss = scores.findIndex((s, i) => s < thr && !(tries[i] >= 2));
    if (miss === -1) { finish(); return; }
    setRetryIdx(miss); setPhase('retry');
    guide(t('tryWord', { w: clean(words[miss]) }), 3500);
    say(clean(words[miss]), 'ar');
  }, [phase]); // eslint-disable-line

  const retryWord = () => {
    const i = retryIdx; ac(); hush(); setPhase('retryListening');
    rec.current = listen({
      lang: 'ar-SA', continuous: false, maxMs: 6000,
      pick: tr => Math.max(...tr.split(/\s+/).map(w => wordSim(clean(words[i]), w))),
      onUpdate: tr => { const s = Math.max(0, ...tr.split(/\s+/).map(w => wordSim(clean(words[i]), w))); setHeard(tr); setScores(prev => prev.map((p, k) => (k === i ? Math.max(p, s) : p))); },
      onEnd: () => { setTries(tr => ({ ...tr, [i]: (tr[i] || 0) + 1 })); setPhase('checked'); },
      onError: () => { setTries(tr => ({ ...tr, [i]: 2 })); setPhase('checked'); },
    });
  };
  const skipWord = () => { setTries(tr => ({ ...tr, [retryIdx]: 2 })); setPhase('checked'); };

  const [result, setResult] = useState(null);
  function finish(tapMode) {
    sfx('chime');
    const final = tapMode ? scores : scores;
    const hardKeys = Object.keys(R.hard).map(clean);
    const helped = words.map(clean).filter((w, i) => final[i] < thr || (tries[i] || 0) > 0);
    const extra = hardKeys.filter(h => !helped.includes(h) && final[words.map(clean).indexOf(h)] < 0.9);
    const practise = [...new Set([...helped, ...extra])];
    const accuracy = Math.round(final.reduce((a, s) => a + Math.min(1, s / Math.max(thr, 0.01)), 0) / words.length * 100 * 0.6 + final.filter(s => s >= thr).length / words.length * 100 * 0.4);
    const seconds = dur.current || Math.max(2, words.length * 0.6);
    const r = {
      words: tapMode ? final.filter(s => s >= thr).length : words.length, accuracy: Math.min(100, accuracy),
      wpm: tapMode ? null : Math.round(words.length / seconds * 60),
      hard: practise.map(w => { const k = Object.keys(R.hard).find(h => clean(h) === w); return { ar: w, en: k ? R.hard[k].en : '', arGloss: k ? R.hard[k].ar : '' }; }),
      mode: tapMode ? 'self' : 'speech', transcript: heard,
    };
    setResult(r); setPhase('result');
    guide(r.accuracy >= 85 ? t('beautiful', { n: name }) : t('goodReading'), 4000);
  }
  const tapWord = i => { if (phase === 'tap') { setScores(p => p.map((s, k) => (k === i ? 1 : s))); sfx('pop'); } else say(clean(words[i]), 'ar'); };

  if (phase === 'result') return (
    <div className="stack">
      <div className="eyebrow">{t('readAloudStep')}</div>
      <div className="between"><h2>{t('heardYou')}</h2><Stars n={result.accuracy >= 92 ? 3 : result.accuracy >= 75 ? 2 : 1} /></div>
      <div className="kpis">
        <div className="kpi green"><b>{result.accuracy}%</b><small>{t('accuracy')}</small></div>
        <div className="kpi blue"><b>{result.wpm ?? '–'}</b><small>{t('wpm')}</small></div>
        <div className="kpi gold"><b>{result.hard.length}</b><small>{t('practised')}</small></div>
      </div>
      {!!result.hard.length && <div className="chips">{result.hard.map(w => <button key={w.ar} lang="ar" style={{ fontFamily: 'var(--f-display)', fontSize: 18 }} onClick={() => say(w.ar, 'ar')}>{w.ar}{w.en && lang === 'en' ? ' · ' + w.en : ''}</button>)}</div>}
      <button className="btn big" onClick={() => onDone(result)}>{t('nextFind')}</button>
    </div>
  );

  const cls = i => 'w' + (scores[i] >= thr ? ' ok' : (phase === 'retry' || phase === 'retryListening') && i === retryIdx ? ' now' : phase !== 'ready' && phase !== 'listening' && phase !== 'tap' && scores[i] < thr ? ' hard' : '');
  return (
    <div className="stack">
      <div className="eyebrow">{t('readAloudStep')}</div>
      <p style={{ fontWeight: 800 }}>{L(R.intro)}</p>
      {bookImg && <div className="bookref"><img src={bookImg} alt="" /><div><b>{t('bookRef')}</b><p className="small muted">{t('seeBook')}</p></div></div>}
      <div className="pagecard">
        <div className={'line-ar' + (little ? ' big' : '')} lang="ar" dir="rtl">
          {words.map((w, i) => <button key={i} className={cls(i)} onClick={() => tapWord(i)}>{w}</button>)}
        </div>
        {lang === 'en' && <p className="small muted">{R.en}</p>}
        {(phase === 'listening' || phase === 'retryListening') && <div className="transcript" lang="ar">{heard || '…'}</div>}
      </div>
      {err && <p className="err">{err}</p>}
      {phase === 'ready' && <div className="row">
        <button className="btn big sea" onClick={start}><Icon n="mic" />{little ? t('sayItBack') : t('readAloud')}</button>
        <button className="btn ghost" onClick={() => { ac(); say(R.words, 'ar'); }}><Icon n="speaker" />{t('hearIt')}</button>
      </div>}
      {phase === 'listening' && <div className="row"><Wave /><b>{t('listening')}</b><button className="btn sm ghost" onClick={() => rec.current?.stop()}>{t('done')}</button></div>}
      {phase === 'retry' && <div className="row">
        <button className="btn big terra" onClick={retryWord}><Icon n="mic" />{clean(words[retryIdx])}</button>
        <button className="btn ghost" onClick={() => say(clean(words[retryIdx]), 'ar')}><Icon n="speaker" /></button>
        <button className="btn sm ghost" onClick={skipWord}>{t('skip')}</button>
      </div>}
      {phase === 'retryListening' && <div className="row"><Wave /><b>{t('listening')}</b></div>}
      {phase === 'tap' && <>
        <p className="small muted">{t('tapWordsMode')}</p>
        <button className="btn big" onClick={() => finish(true)}>{t('finishReading')}</button>
      </>}
    </div>
  );
}
