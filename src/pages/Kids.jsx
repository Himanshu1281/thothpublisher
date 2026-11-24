import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { LangToggle, ThothLogo, ZrythMark } from '../components/Brand';
import { Icon, Modal, Loader } from '../components/ui';
import { Art } from '../components/Art';

export const AVATARS = { ibis: ['ibis', '#ffe3d6'], cat: ['cat', '#fff1c4'], camel: ['camel', '#ffe7b0'], fish: ['fish', '#d6f2ff'], owl: ['owl', '#ece3ff'], turtle: ['turtle', '#dff5e7'] };
export const Face = ({ a, size = 32 }) => { const [e, bg] = AVATARS[a] || AVATARS.ibis; return <span className="face" style={{ background: bg, width: size, height: size, display: 'inline-grid', placeItems: 'center' }}><Art n={e} size={Math.round(size * 0.78)} /></span>; };

export function ChildForm({ initial, onDone, onCancel, onDelete }) {
  const { t } = useI18n();
  const [name, setName] = useState(initial?.name || '');
  const [band, setBand] = useState(initial?.band || 'early');
  const [avatar, setAvatar] = useState(initial?.avatar || 'ibis');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!name.trim()) return; setBusy(true);
    const c = initial ? await api('/children/' + initial.id, { method: 'PATCH', body: { name, band, avatar } }) : await api('/children', { method: 'POST', body: { name, band, avatar } });
    setBusy(false); onDone(c);
  };
  return (
    <div className="stack">
      <h2>{initial ? t('edit') : t('addChild')}</h2>
      <div className="field"><label htmlFor="cn">{t('childName')}</label><input id="cn" type="text" maxLength={20} value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
      <div className="eyebrow">{t('pickAvatar')}</div>
      <div className="avatar-pick">{Object.keys(AVATARS).map(k => <button key={k} type="button" className={avatar === k ? 'on' : ''} aria-pressed={avatar === k} onClick={() => setAvatar(k)}><Art n={AVATARS[k][0]} size={34} /></button>)}</div>
      <div className="eyebrow">{t('age')}</div>
      <div className="bands">{['little', 'early', 'reader'].map(k => <button key={k} type="button" className={'band' + (band === k ? ' on' : '')} aria-pressed={band === k} onClick={() => setBand(k)}>{t('band_' + k)}<small>{t('ages_' + k)}</small></button>)}</div>
      <p className="small muted">{t('bandNote')}</p>
      <div className="row">
        <button className="btn big plum" disabled={busy || !name.trim()} onClick={save}>{t('save')}</button>
        <button className="btn ghost" onClick={onCancel}>{t('cancel')}</button>
        {onDelete && <><span className="spacer" style={{ flex: 1 }} /><button className="btn sm terra" onClick={onDelete}>{t('delete')}</button></>}
      </div>
    </div>
  );
}

export default function Kids() {
  const { t } = useI18n();
  const { setChild, logout, user } = useAuth();
  const nav = useNavigate();
  const [kids, setKids] = useState(null);
  const [form, setForm] = useState(null); // null | 'new' | child
  const load = () => api('/children').then(setKids);
  useEffect(() => { load(); }, []);
  useEffect(() => { if (kids && !kids.length) setForm('new'); }, [kids]);
  if (!kids) return <Loader />;
  const pick = c => { setChild(c); nav('/play'); };
  return (
    <div className="page-bg">
      <div className="topline">
        <ThothLogo h={48} />
        <div className="row"><LangToggle /><button className="chip" onClick={() => nav('/parent')}><Icon n="chart" />{t('parents')}</button><button className="chip" onClick={logout}><Icon n="out" /><span className="t">{t('logout')}</span></button></div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '24px 0', flex: 1 }} className="stack">
        <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', textAlign: 'center' }}>{t('whoPlaying')}</h1>
        <p className="muted" style={{ textAlign: 'center', fontWeight: 800 }}>{user?.name}</p>
        <div className="kids-grid">
          {kids.map(c => (
            <div key={c.id} style={{ position: 'relative' }}>
              <button className="kid" style={{ width: '100%' }} onClick={() => pick(c)}>
                <Face a={c.avatar} size={88} />
                <span className="nm">{c.name}</span>
                <span className="small muted">{t('band_' + c.band)}</span>
              </button>
              <button className="x edit" style={{ position: 'absolute', top: 8, insetInlineEnd: 8, width: 34, height: 34 }} aria-label={t('edit')} onClick={() => setForm(c)}><Art n="pencil" size={18} /></button>
            </div>
          ))}
          <button className="kid add" onClick={() => setForm('new')}><Icon n="plus" size={40} /><span>{t('addChild')}</span></button>
        </div>
      </div>
      <div className="footer"><ZrythMark /></div>
      {form && <Modal onClose={() => kids.length && setForm(null)}>
        <ChildForm initial={form === 'new' ? null : form}
          onCancel={() => kids.length ? setForm(null) : null}
          onDelete={form !== 'new' ? async () => { if (confirm(t('delete') + ' ' + form.name + '?')) { await api('/children/' + form.id, { method: 'DELETE' }); setForm(null); load(); } } : null}
          onDone={c => { setForm(null); if (form === 'new') pick(c); else load(); }} />
      </Modal>}
    </div>
  );
}
