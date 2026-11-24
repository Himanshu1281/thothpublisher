import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { Icon } from '../components/ui';

/** Scanner frame. With `camera`, opens the rear camera and (where the browser supports
 *  BarcodeDetector) reads QR codes for real, calling onCode(text). */
export function ScanFrame({ children, msg, hit, camera, onCode }) {
  const vRef = useRef(null);
  useEffect(() => {
    if (!camera) return;
    let stream, alive = true, det = null, raf;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!alive) return; vRef.current.srcObject = stream; await vRef.current.play();
        if ('BarcodeDetector' in window) det = new window.BarcodeDetector({ formats: ['qr_code'] });
        const tick = async () => {
          if (!alive) return;
          if (det && vRef.current?.readyState >= 2) { try { const r = await det.detect(vRef.current); if (r[0]?.rawValue) { onCode?.(r[0].rawValue); return; } } catch { /* */ } }
          raf = setTimeout(tick, 350);
        };
        tick();
      } catch { /* permission denied: frame stays decorative */ }
    })();
    return () => { alive = false; clearTimeout(raf); stream?.getTracks().forEach(t => t.stop()); };
  }, [camera]); // eslint-disable-line
  return (
    <div className={'scanner' + (hit ? ' hit' : '')}>
      {camera && <video ref={vRef} playsInline muted />}
      {!camera && children}
      <div className="line" /><i className="corner c1" /><i className="corner c2" /><i className="corner c3" /><i className="corner c4" />
      {msg && <div className="msg">{msg}</div>}
    </div>
  );
}

/** "Scan this page" step: shows the publisher's page image (book reference) if uploaded. */
export function PageScan({ eyebrow, title, img, art, btnLabel, foundLabel, plum, onDone }) {
  const { t } = useI18n();
  const [state, setState] = useState('idle');
  const go = async () => {
    setState('reading'); await new Promise(r => setTimeout(r, 1400));
    setState('hit'); await new Promise(r => setTimeout(r, 700)); onDone();
  };
  return (
    <div className="stack">
      <div className="eyebrow">{eyebrow}</div>
      <h3>{title}</h3>
      <ScanFrame hit={state === 'hit'} msg={state === 'reading' ? t('readingPage') : state === 'hit' ? foundLabel : t('seeBook')}>
        <div className="pg">{img ? <img src={img} alt="" /> : <span style={{ width: '100%' }} dangerouslySetInnerHTML={{ __html: art }} />}</div>
      </ScanFrame>
      <button className={'btn big ' + (plum ? 'plum' : '')} disabled={state !== 'idle'} onClick={go}><Icon n="qr" />{btnLabel}</button>
    </div>
  );
}
