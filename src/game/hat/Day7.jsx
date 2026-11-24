import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { sfx } from '../../lib/audio';
import { Icon, Sheet, Wave } from '../../components/ui';
import VoiceTicket from '../VoiceTicket';
import { Set3D, Story } from './art';
import ReadLines from './ReadLines';
import { SPEECH, ENDING, Q7_TICKET, Q7_CHIPS } from './content';
import { Art } from '../../components/Art';

const CROWD = ['strawberry', 'frog', 'corn', 'swan', 'ostrich'];

// the crowd stands on both sides of the ribbon, facing the shop door
const SPOTS = { strawberry: [-4.2, 8.2, 0.9], frog: [-5.8, 7.0, 1.2], corn: [4.4, 8.6, -0.9], swan: [-6.4, 9.4, 0.8], ostrich: [6.0, 7.4, -1.2] };
function square({ ribbon, said = 'mic', zizoun = 'idle', crowd = 'bob', sky = 'day', cam = 'wide' }) {
  return { at: 'shop', lit: 9, open: true, ribbon, sky, cam, cast: [
    { id: 'zizoun', at: [0, 5.7], anim: zizoun },
    said === 'mic' ? { id: 'said', at: [2.3, 5.75], y: 0.25, anim: 'talk', face: -0.2 } : { id: 'said', at: [-1.4, 6.0], anim: said },
    ...CROWD.map(id => ({ id, at: SPOTS[id].slice(0, 2), face: SPOTS[id][2], anim: crowd })),
  ] };
}

/** Ending "video" (pages 20–21). Also replayable from My Space. */
export function EndingStory({ onDone }) {
  const { t, L } = useI18n();
  return <Story tag={t('myReopening')} onDone={onDone} shots={[
    { dur: 4.8, cap: L(ENDING[0]), sfx: () => sfx('clap'), set: square({ ribbon: 'cut', said: 'hop', zizoun: 'clap', crowd: 'clap', sky: 'gold' }) },
    { dur: 5.6, cap: L(ENDING[1]), set: { ...square({ ribbon: 'cut', said: 'idle', zizoun: 'talk', crowd: 'idle', sky: 'gold' }), cam: { pos: [-0.6, 2.9, 10.5], look: [-0.6, 2.0, 5.8] } } },
    { dur: 5.2, cap: L(ENDING[2]), sfx: () => sfx('cheer'), set: { ...square({ ribbon: 'cut', said: 'dance', zizoun: 'clap', crowd: 'dance', sky: 'gold' }), cast: [
      { id: 'zizoun', at: [0.8, 4.2], anim: 'clap' }, { id: 'said', at: [-0.8, 4.4], anim: 'dance' },
      ...CROWD.map((id, i) => ({ id, at: SPOTS[id].slice(0, 2), to: [-2.4 + i * 1.2, 3.6 + (i % 2) * 0.4], anim: 'dance' }))] } },
  ]} />;
}

export default function Day7({ band, guide, onFinish }) {
  const { t, L, lang } = useI18n();
  const [phase, setPhase] = useState('ribbon'); // ribbon | speech | ending | ticket | thanks
  const [cut, setCut] = useState(false); const [claps, setClaps] = useState([]); const [laugh, setLaugh] = useState(false);
  const R = useRef({ readings: [], voice: [], jokes: 0 }).current;
  const lines = SPEECH[band];

  useEffect(() => { guide(t('d7RibbonSay'), 0, true); }, []); // eslint-disable-line

  const onLine = (i, score) => {
    const loud = Math.max(1, Math.round(score * 5)); setClaps(c => [...c, loud]);
    sfx(score >= 0.75 ? 'cheer' : 'clap');
    if (lines[i].joke) { R.jokes++; setLaugh(true); sfx('laugh'); setTimeout(() => setLaugh(false), 1800); }
  };
  const finish = thanks => {
    const acc = R.readings[0]?.accuracy || 0;
    onFinish({ stars: acc >= 85 ? 3 : acc >= 60 ? 2 : 1, readings: R.readings, voice: R.voice, thanks,
      data: { claps, jokesLanded: R.jokes, thanks: !!thanks }, summary: t('d7Sum') });
  };

  if (phase === 'ending') return <EndingStory onDone={() => { setPhase('ticket'); guide(L(Q7_TICKET), 0, true); }} />;

  return <>
    {phase === 'ribbon' && <Set3D {...square({ ribbon: cut ? 'cut' : 'up', said: 'idle', zizoun: cut ? 'gasp' : 'idle', crowd: cut ? 'clap' : 'bob' })} />}
    {phase === 'speech' && <Set3D {...square({ ribbon: 'cut', said: 'mic', zizoun: 'cross', crowd: laugh ? 'hop' : claps.length ? 'clap' : 'idle' })} />}
    {(phase === 'ticket' || phase === 'thanks') && <Set3D {...square({ ribbon: 'cut', said: 'idle', zizoun: 'clap', crowd: 'dance', sky: 'gold' })} cam={{ pos: [-0.6, 2.9, 10.5], look: [-0.6, 2.0, 5.8] }} />}

    {phase === 'ribbon' && <Sheet size="slim"><div className="stack">
      <div className="eyebrow">{t('d7Ey')}</div><h2>{t('d7RibbonQ')}</h2><p>{t('d7RibbonBody')}</p>
      <button className="btn big terra" disabled={cut} onClick={() => { setCut(true); sfx('snip'); setTimeout(() => sfx('gasp'), 500); setTimeout(() => sfx('cheer'), 900); guide(t('d7Gasp'), 0, true); setTimeout(() => { setPhase('speech'); guide(t('d7SpeechSay'), 0, true); }, 3600); }}><Art n="scissors" size={26} /> {t('d7Cut')}</button>
    </div></Sheet>}

    {phase === 'speech' && <Sheet size="tall"><div className="stack">
      <div className="crowd-meter" aria-label={t('d7Crowd')}>{lines.map((_, i) => <i key={i} style={{ height: ((claps[i] || 0) * 20) + '%' }} />)}</div>
      <ReadLines id="speech" lines={lines} band={band} eyebrow={t('d7SpeechEy')} intro={t('d7SpeechIntro')} onLine={onLine}
        onDone={r => { R.readings.push(r); sfx('cheer'); setTimeout(() => setPhase('ending'), 1500); }} />
    </div></Sheet>}

    {phase === 'ticket' && <Sheet size="tall"><VoiceTicket key="v" eyebrow={t('voiceTicket')} question={L(Q7_TICKET)} chips={Q7_CHIPS[lang]}
      onSend={a => { R.voice.push({ q: L(Q7_TICKET), a, at: Date.now() }); sfx('ok'); setPhase('thanks'); guide(t('d7ThanksSay'), 0, true); }} /></Sheet>}
    {phase === 'thanks' && <Sheet size="tall"><Thanks onDone={finish} /></Sheet>}
  </>;
}

/** Bonus: record a short thank-you for mum or dad (like Said's surprise for his father). Goes to the parent report. */
function Thanks({ onDone }) {
  const { t } = useI18n();
  const [st, setSt] = useState('idle'); const [url, setUrl] = useState(null); const [text, setText] = useState(''); const [err, setErr] = useState('');
  const S = useRef({ rec: null, chunks: [], data: null, tm: 0, stream: null }).current;
  const can = typeof window !== 'undefined' && 'MediaRecorder' in window && navigator.mediaDevices?.getUserMedia;
  useEffect(() => () => { clearTimeout(S.tm); S.stream?.getTracks().forEach(x => x.stop()); }, []); // eslint-disable-line
  const start = async () => {
    setErr('');
    try {
      S.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(x => MediaRecorder.isTypeSupported?.(x)) || '';
      S.rec = new MediaRecorder(S.stream, { ...(type && { mimeType: type }), audioBitsPerSecond: 24000 }); S.chunks = [];
      S.rec.ondataavailable = e => e.data.size && S.chunks.push(e.data);
      S.rec.onstop = () => {
        S.stream.getTracks().forEach(x => x.stop());
        const blob = new Blob(S.chunks, { type: S.rec.mimeType || 'audio/webm' }); setUrl(URL.createObjectURL(blob));
        const fr = new FileReader(); fr.onload = () => { S.data = String(fr.result).length < 690000 ? String(fr.result) : null; if (!S.data) setErr(t('tooLong')); }; fr.readAsDataURL(blob);
        setSt('done');
      };
      S.rec.start(); setSt('rec'); S.tm = setTimeout(() => S.rec?.state === 'recording' && S.rec.stop(), 15000);
    } catch { setErr(t('micDenied')); }
  };
  const stop = () => { clearTimeout(S.tm); if (S.rec?.state === 'recording') S.rec.stop(); };
  const send = () => onDone(S.data || text.trim() ? { audio: S.data || undefined, text: text.trim() } : null);
  return <div className="stack">
    <div className="eyebrow">{t('d7ThanksEy')}</div>
    <h3>{t('d7ThanksQ')}</h3>
    <p className="small muted">{t('d7ThanksHelp')}</p>
    {can && <div className="thanks-rec">
      {st !== 'rec' && <button className="btn big sea" onClick={start}><Icon n="mic" />{st === 'done' ? t('recordAgain') : t('d7Record')}</button>}
      {st === 'rec' && <><button className="btn big rec" onClick={stop}><Icon n="mic" />{t('recording')}</button><Wave /></>}
      {url && <audio controls src={url} />}
    </div>}
    {err && <p className="err">{err}</p>}
    <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t('d7ThanksType')} aria-label={t('d7ThanksType')} maxLength={500} />
    <div className="row"><button className="btn big" onClick={send} disabled={st === 'rec'}><Art n="heart" size={24} /> {t('d7SendThanks')}</button><button className="btn ghost" onClick={() => onDone(null)}>{t('skip')}</button></div>
  </div>;
}
