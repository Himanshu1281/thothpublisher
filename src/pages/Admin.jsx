import { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { LangToggle, ThothLogo, ZrythMark } from '../components/Brand';
import { FxLayer, Icon, Loader, Modal, toast } from '../components/ui';
import { BarChart, Donut } from '../components/Charts';
import { Art } from '../components/Art';

// Resize uploads in the browser so book images stay small in the database.
function fileToDataUrl(file, max = 900) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.85)); };
    img.onerror = rej; img.src = url;
  });
}
const csv = (name, rows) => { const b = new Blob(['﻿' + rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u); };

export default function Admin() {
  const { t } = useI18n();
  const { logout, user } = useAuth();
  const [tab, setTab] = useState('analytics');
  return (
    <div className="dash">
      <div className="dash-top">
        <ThothLogo h={42} />
        <h1 style={{ fontSize: 22 }}>{t('adminTitle')}</h1>
        <span style={{ flex: 1 }} />
        <span className="small muted">{user?.email}</span>
        <LangToggle />
        <button className="chip" onClick={logout}><Icon n="out" /><span className="t">{t('logout')}</span></button>
      </div>
      <main className="dash-main">
        <div className="tabs">{[['analytics', 'chart'], ['books', 'book'], ['codes', 'qr']].map(([k, i]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon n={i} />{t(k)}</button>)}</div>
        {tab === 'analytics' && <Analytics />}
        {tab === 'books' && <Books />}
        {tab === 'codes' && <Codes />}
        <div className="footer"><ZrythMark /></div>
      </main>
      <FxLayer />
    </div>
  );
}

function Analytics() {
  const { t, L } = useI18n();
  const [s, setS] = useState(null);
  useEffect(() => { api('/admin/stats').then(setS); }, []);
  if (!s) return <Loader />;
  return <>
    <div className="kpis">
      <div className="kpi gold"><b>{s.parents}</b><small>{t('families')}</small></div>
      <div className="kpi blue"><b>{s.children}</b><small>{t('explorers')}</small></div>
      <div className="kpi"><b>{s.runs}</b><small>{t('runsL')}</small></div>
      <div className="kpi green"><b>{s.completions}</b><small>{t('completions')}</small></div>
      <div className="kpi terra"><b>{s.avgAccuracy ?? '–'}{s.avgAccuracy != null && '%'}</b><small>{t('avgAccuracy')}</small></div>
      <div className="kpi gold"><b>{s.totalMinutes}</b><small>{t('minutesTotal')}</small></div>
    </div>
    <div className="dash-grid">
      <div className="panel col-8"><h3>{t('runsDaily')}</h3><BarChart data={Object.entries(s.daily).map(([k, v]) => ({ label: k.slice(8), v }))} color="#1a8fe0" /></div>
      <div className="panel col-4"><h3>{t('ageMix')}</h3><div className="row" style={{ justifyContent: 'center' }}><Donut parts={[{ label: t('band_little'), v: s.bands.little, color: '#F7B500' }, { label: t('band_early'), v: s.bands.early, color: '#1a8fe0' }, { label: t('band_reader'), v: s.bands.reader, color: '#e8622c' }]} /></div>
        <div className="stack" style={{ gap: 4 }}>{[['little', '#F7B500'], ['early', '#1a8fe0'], ['reader', '#e8622c']].map(([k, c]) => <div key={k} className="row small"><span style={{ width: 14, height: 14, borderRadius: 4, background: c, border: '2px solid #1b1b2f' }} />{t('band_' + k)}: <b>{s.bands[k]}</b></div>)}</div></div>
      {s.hat && <HatAnalytics h={s.hat} />}
      <div className="panel col-12"><h3>{t('byBook')}</h3><div className="table-wrap"><table className="tbl">
        <thead><tr><th>{t('books')}</th><th>{t('unlocks')}</th><th>{t('runsL')}</th><th>{t('completions')}</th><th>{t('codes')}</th><th>{t('redeemed')}</th></tr></thead>
        <tbody>{s.perBook.map(b => <tr key={b.id}><td><b>{L(b.name)}</b></td><td>{b.unlocks}</td><td>{b.runs}</td><td>{b.completions}</td><td>{b.codes}</td><td>{b.redeemed}</td></tr>)}</tbody>
      </table></div></div>
    </div>
  </>;
}

function HatAnalytics({ h }) {
  const { t } = useI18n();
  const max = Math.max(1, ...h.funnel.map(f => f.started));
  const pc = v => (v == null ? '–' : v + '%');
  return <>
    <div className="panel col-8"><h3>{t('hatFunnel')}</h3>
      <BarChart color="#7a3a6b" data={h.funnel.map(f => ({ label: t('dayN', { n: f.q }), v: f.finished }))} />
      <div className="table-wrap"><table className="tbl"><thead><tr><th>{t('dayCol')}</th><th>{t('started')}</th><th>{t('finishedN')}</th><th>{t('dropOff')}</th><th>{t('avgMin')}</th></tr></thead>
        <tbody>{h.funnel.map(f => <tr key={f.q}><td>{t('dayN', { n: f.q })}</td><td>{f.started}</td><td>{f.finished}</td><td>{f.started ? Math.round((1 - f.finished / f.started) * 100) + '%' : '–'}</td><td>{f.avgMin ?? '–'}</td></tr>)}</tbody></table></div>
      <p className="small muted">{t('funnelNote', { n: max })}</p></div>
    <div className="panel col-4"><h3>{t('hatSignals')}</h3>
      {[[t('masters'), h.masters], [t('fitFirstRate'), pc(h.fitFirst)], [t('oldHatTriesL'), h.oldHatTries], [t('openChoice'), pc(h.openChoice)], [t('causeRight'), pc(h.causeRight)],
        [t('rhythmAvg'), pc(h.rhythm)], [t('mazeBonus'), pc(h.mazeBonus)], [t('softVoice'), pc(h.softVoice)], [t('thanksCount'), h.thanks]].map(([k, v]) => <div key={k} className="between small"><span>{k}</span><b>{v ?? '–'}</b></div>)}
      <h3 style={{ marginTop: 8 }}>{t('readingByDay')}</h3>
      {h.readingByQuest.map(r => <div key={r.q} className="skill"><span>{t('dayN', { n: r.q })}</span><div className="meter"><i style={{ width: (r.accuracy || 0) + '%', background: 'var(--good)' }} /></div><span>{pc(r.accuracy)}</span></div>)}
    </div>
  </>;
}

function Books() {
  const { t, L } = useI18n();
  const [books, setBooks] = useState(null); const [edit, setEdit] = useState(null);
  const load = () => api('/admin/books').then(setBooks);
  useEffect(() => { load(); }, []);
  if (!books) return <Loader />;
  return <>
    <div className="between"><h2>{t('books')}</h2><button className="btn blue" onClick={() => setEdit({ id: '', name: { en: '', ar: '' }, book: { en: '', ar: '' }, desc: { en: '', ar: '' }, value: { en: '', ar: '' }, skill: { en: '', ar: '' }, teaser: { en: [], ar: [] }, pages: {}, published: false, playable: false, _new: true })}><Icon n="plus" />{t('newBook')}</button></div>
    <div className="dash-grid">{books.map(b => <div key={b.id} className="panel col-6"><div className="book-row">
      {b.cover ? <img src={b.cover} alt="" /> : <span className="ph"><Art n="book" size={30} /></span>}
      <div><b style={{ fontFamily: 'var(--f-display)', fontSize: 19 }}>{L(b.name)}</b><div className="small muted">{L(b.book)} · <code>{b.id}</code></div>
        <div className="row" style={{ marginTop: 4 }}><span className={'pill ' + (b.published ? 'ok' : 'mute')}>{t('published')}</span>{b.playable && !b.locked && <span className="pill ok"><Art n="game" size={16} /></span>}{b.locked && <span className="pill no"><Icon n="lock" /> {t('locked')}</span>}{['read', 'clue', 'trick'].filter(k => b.pages?.[k]).length > 0 && <span className="pill mute"><Art n="image" size={14} /> {['read', 'clue', 'trick'].filter(k => b.pages?.[k]).length}</span>}</div></div>
      <button className="btn sm ghost" onClick={() => setEdit(structuredClone(b))}><Art n="pencil" size={16} /> {t('edit')}</button>
    </div></div>)}</div>
    {edit && <BookEditor book={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); toast(t('saved')); }} />}
  </>;
}

function ImgField({ label, value, onChange }) {
  const { t } = useI18n();
  return <div className="field"><label>{label}</label><div className="img-up">
    {value ? <img src={value} alt="" /> : <span className="ph"><Art n="image" size={30} /></span>}
    <label className="btn sm ghost" style={{ cursor: 'pointer' }}>{t('upload')}<input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files[0]; if (f) onChange(await fileToDataUrl(f)); }} /></label>
    {value && <button type="button" className="btn sm ghost" onClick={() => onChange(null)}>{t('remove')}</button>}
  </div></div>;
}

function BookEditor({ book, onClose, onSaved }) {
  const { t } = useI18n();
  const [b, setB] = useState(book); const [err, setErr] = useState('');
  const set = (path, v) => setB(prev => { const n = structuredClone(prev); const ks = path.split('.'); let o = n; ks.slice(0, -1).forEach(k => { o[k] = o[k] || {}; o = o[k]; }); o[ks.at(-1)] = v; return n; });
  const tx = (label, path, area, dir) => <div className="field"><label>{label}</label>{area
    ? <textarea dir={dir} value={path.split('.').reduce((o, k) => o?.[k], b) || ''} onChange={e => set(path, e.target.value)} />
    : <input type="text" dir={dir} value={path.split('.').reduce((o, k) => o?.[k], b) || ''} onChange={e => set(path, e.target.value)} />}</div>;
  const save = async () => {
    setErr('');
    const { _new, ...body } = b;
    try { if (_new) await api('/admin/books', { method: 'POST', body }); else await api('/admin/books/' + b.id, { method: 'PUT', body }); onSaved(); }
    catch (e) { setErr(e.code || t('err_generic')); }
  };
  const del = async () => { if (confirm(t('delete') + '?')) { await api('/admin/books/' + b.id, { method: 'DELETE' }); onSaved(); } };
  return <Modal wide onClose={onClose}><div className="stack">
    <div className="between"><h2>{b._new ? t('newBook') : t('edit')}</h2><button className="x" onClick={onClose} aria-label={t('close')}><Icon n="x" /></button></div>
    {b._new && tx(t('bookId'), 'id', false, 'ltr')}
    <div className="form-grid">
      {tx(t('nameEn'), 'name.en', false, 'ltr')}{tx(t('nameAr'), 'name.ar', false, 'rtl')}
      {tx(t('titleEn'), 'book.en', false, 'ltr')}{tx(t('titleAr'), 'book.ar', false, 'rtl')}
      {tx(t('descEn'), 'desc.en', true, 'ltr')}{tx(t('descAr'), 'desc.ar', true, 'rtl')}
      {tx(t('valueEn'), 'value.en', false, 'ltr')}{tx(t('valueAr'), 'value.ar', false, 'rtl')}
      {tx(t('skillEn'), 'skill.en', false, 'ltr')}{tx(t('skillAr'), 'skill.ar', false, 'rtl')}
    </div>
    {tx(t('shopUrl'), 'shopUrl', false, 'ltr')}
    <div className="form-grid">
      <ImgField label={t('coverImg')} value={b.cover} onChange={v => set('cover', v)} />
      <ImgField label={t('readImg')} value={b.pages?.read} onChange={v => set('pages.read', v)} />
      <ImgField label={t('clueImg')} value={b.pages?.clue} onChange={v => set('pages.clue', v)} />
      <ImgField label={t('trickImg')} value={b.pages?.trick} onChange={v => set('pages.trick', v)} />
    </div>
    <div className="row"><label className="toggle"><input type="checkbox" checked={!!b.published} onChange={e => set('published', e.target.checked)} />{t('published')}</label>
      <label className="toggle"><input type="checkbox" checked={!!b.playable} onChange={e => set('playable', e.target.checked)} />{t('playable')}</label>
      <label className="toggle"><input type="checkbox" checked={!!b.locked} onChange={e => set('locked', e.target.checked)} /><Icon n="lock" /> {t('locked')}</label></div>
    {err && <p className="err">{err}</p>}
    <div className="row"><button className="btn blue big" onClick={save}>{t('save')}</button><button className="btn ghost" onClick={onClose}>{t('cancel')}</button>
      {!b._new && <><span style={{ flex: 1 }} /><button className="btn sm terra" onClick={del}>{t('delete')}</button></>}</div>
  </div></Modal>;
}

function Codes() {
  const { t, L } = useI18n();
  const [books, setBooks] = useState([]); const [book, setBook] = useState(''); const [codes, setCodes] = useState(null); const [n, setN] = useState(20);
  useEffect(() => { api('/admin/books').then(b => { setBooks(b); setBook(b[0]?.id || ''); }); }, []);
  const load = () => book && api('/admin/codes?book=' + book).then(setCodes);
  useEffect(() => { load(); }, [book]); // eslint-disable-line
  const gen = async () => { await api(`/admin/books/${book}/codes`, { method: 'POST', body: { count: n } }); load(); toast(t('saved')); };
  return <div className="panel">
    <div className="row">
      <select value={book} onChange={e => setBook(e.target.value)} style={{ maxWidth: 280 }}>{books.map(b => <option key={b.id} value={b.id}>{L(b.name)}</option>)}</select>
      <label className="row small"><b>{t('howMany')}</b><input type="number" min="1" max="500" value={n} onChange={e => setN(+e.target.value)} style={{ width: 100 }} /></label>
      <button className="btn blue" onClick={gen}><Icon n="plus" />{t('generate')}</button>
      {codes?.length > 0 && <button className="btn ghost" onClick={() => csv(`${book}-codes.csv`, [['code', 'book', 'used', 'created']].concat(codes.map(c => [c.code, c.bookId, c.usedBy ? 'yes' : 'no', new Date(c.createdAt).toISOString()])))}>{t('download')}</button>}
    </div>
    {!codes ? <Loader /> : <>
      <div className="row small"><span className="pill ok">{t('used')}: {codes.filter(c => c.usedBy).length}</span><span className="pill mute">{t('unused')}: {codes.filter(c => !c.usedBy).length}</span></div>
      <div className="table-wrap"><table className="tbl"><thead><tr><th>Code</th><th>{t('result')}</th><th>{t('date')}</th></tr></thead>
        <tbody>{[...codes].reverse().slice(0, 300).map(c => <tr key={c.code}><td><code dir="ltr">{c.code}</code></td><td><span className={'pill ' + (c.usedBy ? 'ok' : 'mute')}>{c.usedBy ? t('used') : t('unused')}</span></td><td>{new Date(c.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>
    </>}
  </div>;
}
