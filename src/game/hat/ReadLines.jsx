import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { alignWords, canListen, listen, say, hush, prefetchSpeech, normAr } from '../../lib/speech';
import { ac, sfx } from '../../lib/audio';
import { Icon, Wave } from '../../components/ui';
import { GLOSS } from './content';

export const THR = { little: 0.58, early: 0.64, reader: 0.7 };
const clean = w => w.replace(/[.,!،:؟?؛«»"“”()-]/g, '');

/**
 * Arabic read-aloud, line by line, with the browser speech recogniser (ar-SA): diacritic-insensitive,
 * fuzzy, in-order word matching. Each line that is read well fires onLine(i, score) so the scene can
 * react (a window lights up, the crowd claps…). Little explorers hear each line first and say it back.
 * Without a microphone it falls back to "tap each word you read" (marked as self-reported).
 */
export default function ReadLines({ id, lines, band, eyebrow, intro, onLine, onDone, doneLabel, hideEn }) {
  const { t, lang } = useI18n();
  const thr = THR[band] || 0.64; const little = band === 'little';
  const words = useMemo(() => lines.map(l => l.ar.split(/\s+/).filter(Boolean)), [lines]);
  const [li, setLi] = useState(0);
  const [scores, setScores] = useState(() => words.map(w => w.map(() => 0)));
  const [phase, setPhase] = useState('ready'); // ready | listening | checked | tap | done
  const [heard, setHeard] = useState('');
  const [err, setErr] = useState('');
  const [tries, setTries] = useState(() => lines.map(() => 0));
  const secs = useRef(0), t0 = useRef(0), rec = useRef(null), selfMode = useRef(!canListen), fired = useRef(new Set());

  useEffect(() => {
    lines.forEach(l => prefetchSpeech(l.ar, 'ar'));
    if (!canListen) { setPhase('tap'); setErr(t('noMic')); }
    else if (little) { ac(); setTimeout(() => say(lines[0].ar, 'ar'), 500); }
    return () => { rec.current?.stop(); hush(); };
  }, []); // eslint-disable-line

  const lineScore = (i, s = scores) => s[i].filter(x => x >= thr).length / s[i].length;
  const fire = (i, s) => { if (!fired.current.has(i)) { fired.current.add(i); sfx('ok'); onLine?.(i, lineScore(i, s)); } };

  const start = () => {
    ac(); hush(); setErr(''); setHeard('');
    setPhase('listening'); t0.current = performance.now(); let failed = false;
    const target = words[li].map(clean);
    rec.current = listen({
      lang: 'ar-SA', continuous: true, maxMs: Math.min(30000, 4000 + target.length * 1400),
      pick: tr => alignWords(target, tr).reduce((a, b) => a + b, 0),
      onUpdate: (tr, fin) => {
        setHeard(tr);
        const s = alignWords(target, tr);
        setScores(prev => prev.map((row, k) => (k === li ? row.map((p, j) => Math.max(p, s[j])) : row)));
        if (!fin && s.every(x => x >= thr)) rec.current?.stop();
      },
      onEnd: () => { if (failed) return; secs.current += (performance.now() - t0.current) / 1000; setTries(p => p.map((x, k) => (k === li ? x + 1 : x))); setPhase('checked'); },
      onError: e => { failed = true; selfMode.current = true; setErr(e === 'not-allowed' || e === 'service-not-allowed' ? t('micDenied') : t('noMic')); setPhase('tap'); },
    });
  };

  // after listening: light the line if it was read well, else offer one more go
  useEffect(() => {
    if (phase !== 'checked') return;
    const ok = lineScore(li) >= 0.75;
    if (ok) { fire(li, scores); next(); }
    else if (tries[li] >= 2) { fire(li, scores); next(); }
    else { const miss = words[li].findIndex((w, j) => scores[li][j] < thr); if (miss >= 0) { say(clean(words[li][miss]), 'ar'); } }
  }, [phase]); // eslint-disable-line

  const next = () => {
    if (li + 1 < lines.length) {
      const n = li + 1; setLi(n); setHeard('');
      setPhase(selfMode.current ? 'tap' : 'ready');
      if (little && !selfMode.current) setTimeout(() => say(lines[n].ar, 'ar'), 700);
    } else finish();
  };
  const tapWord = (i, j) => {
    if (i !== li) return;
    if (phase === 'tap') { sfx('pop'); setScores(p => p.map((row, k) => (k === i ? row.map((x, m) => (m === j ? 1 : x)) : row))); }
    else say(clean(words[i][j]), 'ar');
  };
  const tapLineDone = () => { const s = scores; fire(li, s); next(); };

  function finish() {
    const flat = scores.flat(); const all = words.flat().map(clean);
    const accuracy = Math.round(flat.reduce((a, s) => a + Math.min(1, s / thr), 0) / flat.length * 60 + flat.filter(s => s >= thr).length / flat.length * 40);
    const hard = [...new Set(all.filter((w, k) => flat[k] < thr))].slice(0, 12).map(w => {
      const g = Object.entries(GLOSS).find(([k]) => normAr(clean(k)) === normAr(w));
      return { ar: w, en: g ? g[1].en : '', arGloss: g ? g[1].ar : '' };
    });
    const r = { id, words: selfMode.current ? flat.filter(s => s >= thr).length : all.length, accuracy: Math.min(100, accuracy),
      wpm: selfMode.current || !secs.current ? null : Math.round(all.length / secs.current * 60), hard, mode: selfMode.current ? 'self' : 'speech', transcript: heard.slice(0, 500) };
    setPhase('done'); sfx('chime'); onDone(r);
  }

  const wcls = (i, j) => 'w' + (scores[i][j] >= thr ? ' ok' : i === li && phase === 'checked' && scores[i][j] < thr ? ' hard' : '');
  return (
    <div className="stack">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      {intro && <p style={{ fontWeight: 800 }}>{intro}</p>}
      <div className="rlines">
        {lines.map((l, i) => <div key={i} className={'rline' + (i === li && phase !== 'done' ? ' now' : '') + (fired.current.has(i) ? ' ok' : '') + (l.joke ? ' joke' : '')} style={{ opacity: i > li ? 0.45 : 1 }}>
          <div className={'line-ar' + (little ? ' big' : '')} lang="ar" dir="rtl">{words[i].map((w, j) => <button key={j} className={wcls(i, j)} onClick={() => tapWord(i, j)}>{w}</button>)}</div>
          {lang === 'en' && !hideEn && <p className="small muted">{l.en}</p>}
        </div>)}
      </div>
      {phase === 'listening' && <div className="transcript" lang="ar">{heard || '…'}</div>}
      {err && <p className="err">{err}</p>}
      {phase === 'ready' && <div className="row">
        <button className="btn big sea" onClick={start}><Icon n="mic" />{little ? t('sayItBack') : t('readAloud')}</button>
        <button className="btn ghost" onClick={() => { ac(); say(lines[li].ar, 'ar'); }}><Icon n="speaker" />{t('hearIt')}</button>
      </div>}
      {phase === 'listening' && <div className="row"><Wave /><b>{t('listening')}</b><button className="btn sm ghost" onClick={() => rec.current?.stop()}>{t('done')}</button></div>}
      {phase === 'checked' && lineScore(li) < 0.75 && tries[li] < 2 && <div className="row">
        <p className="small" style={{ fontWeight: 800 }}>{t('tryLineAgain')}</p>
        <button className="btn big terra" onClick={start}><Icon n="mic" />{t('again')}</button>
        <button className="btn ghost" onClick={() => say(lines[li].ar, 'ar')}><Icon n="speaker" /></button>
        <button className="btn sm ghost" onClick={() => { fire(li, scores); next(); }}>{t('skip')}</button>
      </div>}
      {phase === 'tap' && <>
        <p className="small muted">{t('tapWordsMode')}</p>
        <div className="row"><button className="btn big" onClick={tapLineDone}>{li + 1 < lines.length ? t('nextLine') : (doneLabel || t('finishReading'))}</button>
          <button className="btn ghost" onClick={() => say(lines[li].ar, 'ar')}><Icon n="speaker" />{t('hearIt')}</button></div>
      </>}
    </div>
  );
}
