import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { canListen, listen } from '../lib/speech';
import { ac } from '../lib/audio';
import { Icon, Wave } from '../components/ui';

// Spoken answer, transcribed live in the current UI language. Editable before sending.
export default function VoiceTicket({ eyebrow, question, chips, onSend }) {
  const { t, lang } = useI18n();
  const [text, setText] = useState('');
  const [rec, setRec] = useState(false);
  const [note, setNote] = useState(canListen ? '' : t('noMic'));
  const r = useRef(null);
  useEffect(() => () => r.current?.stop(), []);
  const go = () => {
    if (rec) { r.current?.stop(); return; }
    ac(); setRec(true); setNote(''); let failed = false;
    r.current = listen({
      lang: lang === 'ar' ? 'ar-SA' : 'en-US', continuous: true, maxMs: 15000,
      onUpdate: tr => setText(tr),
      onEnd: () => { setRec(false); if (!failed) setNote(t('heardAnswer')); },
      onError: e => { failed = true; setRec(false); setNote(e === 'not-allowed' ? t('micDenied') : t('noMic')); },
    });
  };
  return (
    <div className="stack">
      <div className="eyebrow">{eyebrow}</div>
      <h3>{question}</h3>
      <p className="small muted">{t('answerGoes')}</p>
      {canListen && <button className={'btn big ' + (rec ? 'rec' : 'sea')} onClick={go}><Icon n="mic" />{rec ? t('recording') : text ? t('recordAgain') : t('answerOut')}</button>}
      {rec && <div className="row"><Wave /></div>}
      {note && <p className="small muted">{note}</p>}
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t('answerHere')} aria-label={question} />
      <div className="chips">{chips.map(c => <button key={c} onClick={() => setText(c)}>{c}</button>)}</div>
      <button className="btn big" onClick={() => onSend(text.trim() || '—')}>{t('sendAnswer')}</button>
    </div>
  );
}
