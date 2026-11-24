import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { say } from '../lib/speech';
import { LangToggle, ThothLogo, ZrythMark } from '../components/Brand';
import { FxLayer, Icon, Loader, Modal, toast } from '../components/ui';
import { BarChart, LineChart } from '../components/Charts';
import { ChildForm, Face } from './Kids';

const dayKey = d => new Date(d).toISOString().slice(0, 10);

export default function Parent() {
  const { t, L, lang } = useI18n();
  const { logout, setChild, child: activeChild } = useAuth();
  const nav = useNavigate();
  const [kids, setKids] = useState(null);
  const [sel, setSel] = useState(null);
  const [data, setData] = useState(null);
  const [books, setBooks] = useState([]);
  const [edit, setEdit] = useState(null);
  const loadKids = () => api('/children').then(k => { setKids(k); setSel(s => (k.find(c => c.id === s) ? s : (k.find(c => c.id === activeChild?.id) || k[0])?.id)); });
  useEffect(() => { loadKids(); api('/books').then(setBooks); }, []); // eslint-disable-line
  useEffect(() => {
    if (!sel) return; setData(null);
    Promise.all([api(`/children/${sel}/state`), api(`/children/${sel}/runs`)]).then(([state, runs]) => setData({ state, runs }));
  }, [sel]);
  const kid = kids?.find(k => k.id === sel);
  const fmtDate = d => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });

  const a = useMemo(() => {
    if (!data) return null;
    const { state, runs } = data;
    const asc = [...runs].sort((x, y) => x.at - y.at);
    const done = asc.filter(r => r.completed);
    const withReading = asc.filter(r => r.reading);
    const avgAcc = withReading.length ? Math.round(withReading.reduce((s, r) => s + r.reading.accuracy, 0) / withReading.length) : null;
    const daily = state.daily || {};
    const days14 = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() - (13 - i) * 864e5); return { k: dayKey(d), label: d.getDate() + '', v: Math.round((daily[dayKey(d)] || 0) / 60) }; });
    runs.forEach(r => { const k = dayKey(r.at); if (!daily[k]) { const d = days14.find(x => x.k === k); if (d && !d.v) d.v = Math.max(1, Math.round((r.durationSec || 60) / 60)); } });
    let streak = 0; const active = new Set([...Object.keys(daily).filter(k => daily[k] > 0), ...runs.map(r => dayKey(r.at))]);
    for (let i = active.has(dayKey(Date.now())) ? 0 : 1; ; i++) { if (active.has(dayKey(Date.now() - i * 864e5))) streak++; else break; }
    const last = done[done.length - 1] || null;
    const lastAny = asc[asc.length - 1] || null;
    const words = {}; withReading.forEach(r => r.reading.hard.forEach(w => { words[w.ar] = words[w.ar] || { ...w, n: 0 }; words[w.ar].n++; }));
    const persistence = asc.length ? Math.round(done.length / asc.length * 60 + Math.min(40, done.reduce((s, r) => s + Math.max(0, r.dives.length - 1), 0) * 10)) : 0;
    const skills = last ? [
      [t('readingSkill'), last.reading?.accuracy ?? 0],
      [t('understanding'), Math.max(40, 100 - (last.hints || 0) * 25)],
      [t('rhythm'), last.rhythm ?? 0],
      [t('persistence'), Math.min(100, persistence)],
    ] : [];
    const voice = asc.flatMap(r => (r.voice || []).map(v => ({ ...v, at: v.at || r.at }))).reverse().slice(0, 6);
    const recs = [];
    if (avgAcc != null && avgAcc < 85) recs.push(['📖', t('rec_reading', { a: avgAcc })]);
    if (last && (last.rhythm ?? 100) < 60) recs.push(['🎵', t('rec_rhythm')]);
    recs.push(['💬', t('rec_persist')]);
    if (days14.reduce((s, d) => s + d.v, 0) / 14 > 25) recs.push(['⏱️', t('rec_time')]);
    if (done.length) recs.push(['📚', t('rec_next')]);
    return { done, asc, avgAcc, days14, streak, last, lastAny, words: Object.values(words).sort((x, y) => y.n - x.n), skills, voice, recs, mins: Math.round((state.playSec || 0) / 60) };
  }, [data, t]);

  const message = a?.last && kid ? (() => {
    const R = a.last.reading; const nw = (R?.hard || []).map(w => (lang === 'ar' ? w.ar : w.en || w.ar));
    const own = a.last.voice?.[0]?.a;
    return lang === 'ar'
      ? `أنهى ${kid.name} مهمة بحر اللؤلؤ! قرأ ${R?.words || 0} كلمات بصوت عالٍ${nw.length ? ` (كلمات جديدة: ${nw.join('، ')})` : ''}، واحتاج ${a.last.dives.length} غوصات ولم يستسلم.${own && own !== '—' ? ` بكلماته: «${own}»` : ''} اسألوه الليلة: متى حاولت مرة أخرى في شيء صعب؟`
      : `${kid.name} finished Pearl Sea! Read ${R?.words || 0} words aloud${nw.length ? ` (new words: ${nw.join(', ')})` : ''}, needed ${a.last.dives.length} dive${a.last.dives.length > 1 ? 's' : ''} and didn't give up.${own && own !== '—' ? ` In their own words: “${own}”` : ''} Ask tonight: when did you try again at something hard?`;
  })() : null;

  const exportCsv = () => {
    const rows = [['date', 'world', 'completed', 'dives', 'reading_accuracy', 'wpm', 'hints', 'rhythm', 'stone', 'minutes']].concat(
      a.asc.map(r => [new Date(r.at).toISOString(), r.world, r.completed, r.dives?.length || 0, r.reading?.accuracy ?? '', r.reading?.wpm ?? '', r.hints ?? '', r.rhythm ?? '', !!r.stone, Math.round((r.durationSec || 0) / 60)]));
    const blob = new Blob(['﻿' + rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const u = URL.createObjectURL(blob); const el = document.createElement('a'); el.href = u; el.download = `${kid.name}-thoth-report.csv`; el.click(); URL.revokeObjectURL(u);
  };

  if (!kids) return <Loader />;
  return (
    <div className="dash">
      <div className="dash-top">
        <ThothLogo h={42} />
        <h1 style={{ fontSize: 22 }}>{t('dashboard')}</h1>
        <span className="spacer" style={{ flex: 1 }} />
        <LangToggle />
        {kid && <button className="chip gold" onClick={() => { setChild(kid); nav('/play'); }}><Icon n="play" /><span>{t('back2')}</span></button>}
        <button className="chip" onClick={() => nav('/kids')}><Icon n="user" /><span className="t">{t('manageKids')}</span></button>
        <button className="chip" onClick={logout}><Icon n="out" /><span className="t">{t('logout')}</span></button>
      </div>
      <main className="dash-main">
        <div className="kid-tabs">
          {kids.map(k => <button key={k.id} className={k.id === sel ? 'on' : ''} onClick={() => setSel(k.id)}><Face a={k.avatar} />{k.name}</button>)}
          <button onClick={() => setEdit('new')}><span className="face" style={{ background: '#fff' }}><Icon n="plus" /></span>{t('addChild')}</button>
        </div>
        {!kid ? <p className="muted">{t('nothingYet')}</p> : !a ? <Loader /> : <>
          <div className="between">
            <div><div className="eyebrow">{t('band_' + kid.band)} · {t('ages_' + kid.band)}</div><h2 style={{ fontSize: 30 }}>{kid.name}</h2></div>
            <div className="row"><button className="btn sm ghost" onClick={() => setEdit(kid)}>✎ {t('edit')}</button>{a.asc.length > 0 && <button className="btn sm ghost" onClick={exportCsv}><Icon n="copy" />{t('exportCsv')}</button>}</div>
          </div>
          <div className="kpis">
            <div className="kpi gold"><b>{a.mins} {t('min')}</b><small>{t('timePlaying')}</small></div>
            <div className="kpi green"><b>{a.done.length}</b><small>{t('questsDone')}</small></div>
            <div className="kpi blue"><b>{a.avgAcc != null ? a.avgAcc + '%' : '–'}</b><small>{t('avgAccuracy')}</small></div>
            <div className="kpi terra"><b>🔥 {a.streak}</b><small>{t('streak')}</small></div>
            <div className="kpi"><b>{data.state.unlocked.length}</b><small>{t('booksLinked')}</small></div>
            <div className="kpi gold"><b>★ {data.state.stars || 0}</b><small>{t('totalStars')}</small></div>
          </div>
          {!a.asc.length && <div className="panel"><p className="muted">{t('nothingYet')}</p></div>}
          <div className="dash-grid">
            {message && <div className="panel col-8"><h3>{t('msgTitle')}</h3><div className="msgcard">{message}</div>
              <div className="row"><button className="btn sm ghost" onClick={async () => { try { await navigator.clipboard.writeText(message); toast(t('copied')); } catch { /* */ } }}><Icon n="copy" />{t('copy')}</button></div></div>}
            <div className={'panel ' + (message ? 'col-4' : 'col-12')}><h3>{t('recommendations')}</h3>{a.recs.map(([e, r], i) => <div key={i} className="rec"><span>{e}</span><span>{r}</span></div>)}</div>
            {a.skills.length > 0 && <div className="panel col-6"><h3>{t('skills')}</h3>
              {a.skills.map(([n, v]) => <div key={n} className="skill"><span>{n}</span><div className="meter"><i style={{ width: v + '%', background: v >= 75 ? 'var(--good)' : v >= 50 ? 'var(--warn)' : 'var(--bad)' }} /></div><span>{v}%</span></div>)}</div>}
            <div className={'panel ' + (a.skills.length ? 'col-6' : 'col-12')}><h3>{t('dailyMinutes')}</h3><BarChart data={a.days14} suffix={' ' + t('min')} /></div>
            {a.asc.filter(r => r.reading).length > 0 && <div className="panel col-6"><h3>{t('accuracyTrend')}</h3><LineChart data={a.asc.filter(r => r.reading).map(r => ({ label: fmtDate(r.at), v: r.reading.accuracy }))} suffix="%" /></div>}
            {a.done.length > 0 && <div className="panel col-6"><h3>{t('divesTrend')}</h3><BarChart color="#1a8fe0" data={a.done.map(r => ({ label: fmtDate(r.at), v: r.dives.length }))} /></div>}
            {a.words.length > 0 && <div className="panel col-6"><h3>{t('wordsPractise')}</h3><div className="chips">{a.words.map(w => <button key={w.ar} lang="ar" style={{ fontFamily: 'var(--f-display)', fontSize: 18 }} onClick={() => say(w.ar, 'ar')}>🔊 {w.ar}{lang === 'en' && w.en ? ' · ' + w.en : ''}{w.n > 1 ? ` ×${w.n}` : ''}</button>)}</div></div>}
            {a.voice.length > 0 && <div className="panel col-6"><h3>{t('voiceTickets')}</h3>{a.voice.map((v, i) => <div key={i} className="quote"><small>{v.q} · {fmtDate(v.at)}</small>“{v.a}”</div>)}</div>}
            {a.lastAny?.dives?.length > 0 && <div className="panel col-6"><h3>{t('diveByDive')}</h3>
              {a.lastAny.dives.map((d, i) => <div key={i} className="row small"><span className={'pill ' + (d.ok ? 'ok' : 'no')}>{i + 1}</span>{d.ok ? t('diveOk') : t('diveStop', { m: Math.round(d.depth / 5), r: t(d.reason === 'pressure' ? 'r_pressure' : d.againstTide > 1.2 ? 'r_tide' : 'r_breath') })}</div>)}</div>}
            {a.asc.length > 0 && <div className="panel col-12"><h3>{t('sessions')}</h3><div className="table-wrap"><table className="tbl">
              <thead><tr><th>{t('date')}</th><th>{t('world')}</th><th>{t('result')}</th><th>🌊</th><th>{t('accuracy')}</th><th>{t('wpm')}</th><th>⏱</th></tr></thead>
              <tbody>{[...a.asc].reverse().map(r => <tr key={r.id}><td>{new Date(r.at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td><td>{L(books.find(b => b.id === r.world)?.name) || r.world}</td>
                <td><span className={'pill ' + (r.completed ? 'ok' : 'mute')}>{r.completed ? t('finished') : t('stopped')}</span></td><td>{r.dives?.length || 0}</td><td>{r.reading ? r.reading.accuracy + '%' : '–'}</td><td>{r.reading?.wpm ?? '–'}</td><td>{Math.round((r.durationSec || 0) / 60)} {t('min')}</td></tr>)}</tbody>
            </table></div></div>}
          </div>
        </>}
        <div className="footer"><ZrythMark /></div>
      </main>
      {edit && <Modal onClose={() => setEdit(null)}><ChildForm initial={edit === 'new' ? null : edit} onCancel={() => setEdit(null)}
        onDelete={edit !== 'new' ? async () => { if (confirm(t('delete') + ' ' + edit.name + '?')) { await api('/children/' + edit.id, { method: 'DELETE' }); setEdit(null); loadKids(); } } : null}
        onDone={c => { setEdit(null); loadKids().then(() => setSel(c.id)); }} /></Modal>}
      <FxLayer />
    </div>
  );
}
