import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api, token } from '../lib/api';
import { say } from '../lib/speech';
import { LangToggle, ThothLogo, ZrythMark } from '../components/Brand';
import { FxLayer, Icon, Loader, Modal, Stars, toast } from '../components/ui';
import { BarChart, LineChart } from '../components/Charts';
import { ChildForm, Face } from './Kids';
import { DAYS, CUSTOMERS } from '../game/hat/content';
import { portrait } from '../game/hat/chars3d';
import { Art } from '../components/Art';

const dayKey = d => new Date(d).toISOString().slice(0, 10);
const avg = a => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null);
const pct = (a, b) => (b ? Math.round(a / b * 100) : null);

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
    const withReading = asc.filter(r => r.reading && Number.isFinite(r.reading.accuracy));
    const avgAcc = avg(withReading.map(r => r.reading.accuracy));
    const daily = state.daily || {};
    const days14 = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() - (13 - i) * 864e5); return { k: dayKey(d), label: d.getDate() + '', v: Math.round((daily[dayKey(d)] || 0) / 60) }; });
    runs.forEach(r => { const k = dayKey(r.at); if (!daily[k]) { const d = days14.find(x => x.k === k); if (d && !d.v) d.v = Math.max(1, Math.round((r.durationSec || 60) / 60)); } });
    let streak = 0; const active = new Set([...Object.keys(daily).filter(k => daily[k] > 0), ...runs.map(r => dayKey(r.at))]);
    for (let i = active.has(dayKey(Date.now())) ? 0 : 1; ; i++) { if (active.has(dayKey(Date.now() - i * 864e5))) streak++; else break; }
    const words = {}; withReading.forEach(r => (r.reading.hard || []).forEach(w => { words[w.ar] = words[w.ar] || { ...w, n: 0 }; words[w.ar].n++; }));
    const voice = asc.flatMap(r => (r.voice || []).map(v => ({ ...v, at: v.at || r.at }))).filter(v => v.a && v.a !== '—').reverse().slice(0, 6);

    // ---- Hat Town ----
    const hat = done.filter(r => r.world === 'hat');
    const lastQ = q => [...hat].reverse().find(r => r.quest === q) || null;
    const q = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(n => [n, lastQ(n)]));
    const designs = q[4]?.data?.designs || [];
    const quiz = q[3]?.data?.quiz;
    const skills = [];
    const hatReading = avg(hat.filter(r => r.reading).map(r => r.reading.accuracy));
    if (hatReading != null) skills.push([t('readingSkill'), hatReading]);
    if (q[1] || q[3]) skills.push([t('understanding'), avg([q[1] && (q[1].data?.causeFirst ? 100 : 60), quiz && pct(quiz.right, quiz.of)].filter(x => x != null))]);
    if (designs.length) skills.push([t('empathy'), pct(designs.filter(d => d.fitFirst).length + designs.filter(d => d.taste).length, designs.length * 2)]);
    if (q[5]) { const m = q[5].data?.maze1; skills.push([t('planning'), m ? Math.max(30, Math.min(100, Math.round((m.shortest || m.moves) / Math.max(1, m.moves) * 100) - (m.caught || 0) * 10)) : 70]); }
    if (q[6]) skills.push([t('rhythm'), q[6].data?.avg ?? 0]);
    if (q[3]?.data?.ostrich) skills.push([t('gentleVoice'), Math.max(30, 100 - (q[3].data.ostrich.shouts || 0) * 20)]);
    const thanks = [...hat].reverse().find(r => r.thanks);
    const recs = [];
    if (avgAcc != null && avgAcc < 85) recs.push(['book', t('rec_readingHat', { a: avgAcc })]);
    if (designs.some(d => d.triedOld)) recs.push(['hat', t('rec_oldHat')]);
    if (q[6] && (q[6].data?.avg ?? 100) < 60) recs.push(['music', t('rec_rhythmHat')]);
    recs.push(['chat', t('rec_taste')]);
    if (state.quest?.hat?.done?.length === 7) recs.push(['crayon', t('rec_colour')]);
    if (days14.reduce((s, d) => s + d.v, 0) / 14 > 25) recs.push(['clock', t('rec_time')]);
    const latest = [...hat].reverse()[0] || null;
    return { done, asc, avgAcc, days14, streak, words: Object.values(words).sort((x, y) => y.n - x.n), voice, recs, mins: Math.round((state.playSec || 0) / 60),
      hat: { prog: state.quest?.hat || { done: [], stars: {} }, q, designs, quiz, skills, thanks, latest, choices: q[1]?.data?.choices || [] },
      pearl: asc.filter(r => r.world === 'pearl') };
  }, [data, t]);

  const message = a?.hat.latest && kid ? (() => {
    const r = a.hat.latest; const n = kid.name; const d = r.data || {};
    const extra = {
      1: t('msg1', { n }), 2: t('msg2', { n, w: d.room?.wakes ?? 0 }), 3: t('msg3', { n, q: d.quiz ? `${d.quiz.right}/${d.quiz.of}` : '–' }),
      4: t('msg4', { n, f: (d.designs || []).filter(x => x.fitFirst).length, m: (d.designs || []).length }), 5: t('msg5', { n }), 6: t('msg6', { n, a: d.avg ?? 0 }), 7: t('msg7', { n }),
    }[r.quest] || '';
    const own = r.voice?.[0]?.a;
    return `${extra}${r.reading ? ' ' + t('msgRead', { w: r.reading.words, a: r.reading.accuracy }) : ''}${own && own !== '—' ? ' ' + t('msgOwn', { a: own }) : ''} ${t('msgAsk' + r.quest)}`;
  })() : null;

  const exportCsv = () => {
    const rows = [['date', 'world', 'day', 'completed', 'stars', 'reading_accuracy', 'wpm', 'words_read', 'minutes', 'details']].concat(
      a.asc.map(r => [new Date(r.at).toISOString(), r.world, r.quest ?? '', r.completed, r.stars ?? '', r.reading?.accuracy ?? '', r.reading?.wpm ?? '', r.reading?.words ?? '', Math.round((r.durationSec || 0) / 60),
        '"' + JSON.stringify(r.data || (r.dives ? { dives: r.dives.length } : {})).replace(/"/g, '""') + '"']));
    const blob = new Blob(['﻿' + rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const u = URL.createObjectURL(blob); const el = document.createElement('a'); el.href = u; el.download = `${kid.name}-thoth-report.csv`; el.click(); URL.revokeObjectURL(u);
  };

  if (!kids) return <Loader />;
  const H = a?.hat;
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
            <div className="row"><button className="btn sm ghost" onClick={() => setEdit(kid)}><Art n="pencil" size={16} /> {t('edit')}</button>{a.asc.length > 0 && <button className="btn sm ghost" onClick={exportCsv}><Icon n="copy" />{t('exportCsv')}</button>}</div>
          </div>
          <div className="kpis">
            <div className="kpi gold"><b>{a.mins} {t('min')}</b><small>{t('timePlaying')}</small></div>
            <div className="kpi green"><b>{H.prog.done?.length || 0}/7</b><small>{t('hatDays')}</small></div>
            <div className="kpi blue"><b>{a.avgAcc != null ? a.avgAcc + '%' : '–'}</b><small>{t('avgAccuracy')}</small></div>
            <div className="kpi terra"><b><Art n="flame" size={26} /> {a.streak}</b><small>{t('streak')}</small></div>
            <div className="kpi"><b>{data.state.unlocked.length}</b><small>{t('booksLinked')}</small></div>
            <div className="kpi gold"><b><Art n="star" size={26} /> {data.state.stars || 0}</b><small>{t('totalStars')}</small></div>
          </div>
          {!a.asc.length && <div className="panel"><p className="muted">{t('nothingYet')}</p></div>}
          <div className="dash-grid">
            {H.thanks && <ThanksPanel kid={kid} run={H.thanks} />}
            {message && <div className="panel col-8"><h3>{t('msgTitle')}</h3><div className="msgcard">{message}</div>
              <div className="row"><button className="btn sm ghost" onClick={async () => { try { await navigator.clipboard.writeText(message); toast(t('copied')); } catch { /* */ } }}><Icon n="copy" />{t('copy')}</button></div></div>}
            <div className={'panel ' + (message ? 'col-4' : 'col-12')}><h3>{t('recommendations')}</h3>{a.recs.map(([e, r], i) => <div key={i} className="rec"><Art n={e} size={22} /><span>{r}</span></div>)}</div>

            {(data.state.unlocked.includes('hat') || H.latest) && <div className="panel col-12"><h3>{t('hatWeekReport')}</h3>
              <div className="days">{DAYS.map(d => { const r = H.q[d.q]; return <div key={d.q} className={'dayc' + (r ? ' done' : '')}>
                <span className="ic"><Art n={d.icon} size={30} /></span><small>{t('dayN', { n: d.q })}</small><b>{L(d.title)}</b>
                <small>{r ? <><Stars n={r.stars || 0} /> · {fmtDate(r.at)}</> : t('notYet')}</small><small>{L(d.learn)}</small></div>; })}</div></div>}

            {H.skills.length > 0 && <div className="panel col-6"><h3>{t('skills')}</h3>
              {H.skills.map(([n, v]) => <div key={n} className="skill"><span>{n}</span><div className="meter"><i style={{ width: v + '%', background: v >= 75 ? 'var(--good)' : v >= 50 ? 'var(--warn)' : 'var(--bad)' }} /></div><span>{v}%</span></div>)}</div>}
            <div className={'panel ' + (H.skills.length ? 'col-6' : 'col-12')}><h3>{t('dailyMinutes')}</h3><BarChart data={a.days14} suffix={' ' + t('min')} /></div>

            {H.designs.length > 0 && <div className="panel col-6"><h3>{t('designsTitle')}</h3>
              {H.designs.map(d => { const c = CUSTOMERS.find(x => x.id === d.id); return <div key={d.id} className="row small">
                <span className="hface" style={{ width: 36, height: 36, background: c?.bg }}><img src={portrait(d.id)} alt="" /></span><b>{L(c?.name)}</b>
                <span className={'pill ' + (d.fitFirst ? 'ok' : 'no')}>{d.fitFirst ? t('fitFirst') : t('fitAfter', { n: d.tries })}</span>
                {d.taste && <span className="pill ok">{t('theirTaste')}</span>}{d.triedOld && <span className="pill mute"><Art n="hat" size={14} /> {t('triedOld')}</span>}</div>; })}
              <p className="small muted">{t('designsNote')}</p></div>}

            {H.choices.length > 0 && <div className="panel col-6"><h3>{t('choicesTitle')}</h3>
              <p className="small">{t('choicesBody', { o: H.choices.filter(c => c.kind === 'open').length, m: H.choices.length })}</p>
              {H.q[1]?.data && <div className="row small"><span className={'pill ' + (H.q[1].data.causeFirst ? 'ok' : 'no')}>{H.q[1].data.causeFirst ? t('causeFirst') : t('causeLater')}</span></div>}
              {H.quiz && <div className="row small"><span className="pill ok">{t('factQuiz', { r: H.quiz.right, m: H.quiz.of })}</span></div>}</div>}

            {a.asc.filter(r => r.reading).length > 0 && <div className="panel col-6"><h3>{t('accuracyTrend')}</h3><LineChart data={a.asc.filter(r => r.reading).map(r => ({ label: fmtDate(r.at), v: r.reading.accuracy }))} suffix="%" /></div>}
            {H.q[6]?.data?.rounds && <div className="panel col-6"><h3>{t('beatTitle')}</h3><BarChart color="#7a3a6b" data={H.q[6].data.rounds.map((v, i) => ({ label: t('dayN', { n: i + 1 }), v }))} suffix="%" /></div>}
            {a.words.length > 0 && <div className="panel col-6"><h3>{t('wordsPractise')}</h3><div className="chips">{a.words.map(w => <button key={w.ar} lang="ar" style={{ fontFamily: 'var(--f-display)', fontSize: 18 }} onClick={() => say(w.ar, 'ar')}><Art n="speaker" size={16} /> {w.ar}{lang === 'en' && w.en ? ' · ' + w.en : ''}{w.n > 1 ? ` ×${w.n}` : ''}</button>)}</div></div>}
            {a.voice.length > 0 && <div className="panel col-6"><h3>{t('voiceTickets')}</h3>{a.voice.map((v, i) => <div key={i} className="quote"><small>{v.q} · {fmtDate(v.at)}</small>“{v.a}”</div>)}</div>}

            {a.asc.length > 0 && <div className="panel col-12"><h3>{t('sessions')}</h3><div className="table-wrap"><table className="tbl">
              <thead><tr><th>{t('date')}</th><th>{t('world')}</th><th>{t('dayCol')}</th><th>{t('result')}</th><th><Art n="star" size={16} /></th><th>{t('accuracy')}</th><th>{t('wpm')}</th><th><Art n="clock" size={16} /></th></tr></thead>
              <tbody>{[...a.asc].reverse().map(r => <tr key={r.id}><td>{new Date(r.at).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td><td>{L(books.find(b => b.id === r.world)?.name) || r.world}</td>
                <td>{r.quest ? L(DAYS[r.quest - 1]?.title) : '–'}</td>
                <td><span className={'pill ' + (r.completed ? 'ok' : 'mute')}>{r.completed ? t('finished') : t('stopped')}</span></td><td>{r.stars ?? '–'}</td><td>{r.reading ? r.reading.accuracy + '%' : '–'}</td><td>{r.reading?.wpm ?? '–'}</td><td>{Math.round((r.durationSec || 0) / 60)} {t('min')}</td></tr>)}</tbody>
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

/** The child's recorded thank-you (Day 7 bonus). Audio is fetched only when this panel shows. */
function ThanksPanel({ kid, run }) {
  const { t } = useI18n();
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!run.thanks?.hasAudio) return; let u;
    fetch(`/api/children/${kid.id}/runs/${run.id}/audio`, { headers: { Authorization: 'Bearer ' + token.get() } })
      .then(r => (r.ok ? r.blob() : null)).then(b => { if (b) { u = URL.createObjectURL(b); setUrl(u); } }).catch(() => {});
    return () => u && URL.revokeObjectURL(u);
  }, [kid.id, run.id, run.thanks]);
  return <div className="panel col-12" style={{ background: '#fff3c4' }}><h3><Art n="heart" size={22} /> {t('thanksTitle', { n: kid.name })}</h3>
    {url && <audio controls src={url} style={{ maxWidth: '100%' }} />}
    {run.thanks.text && <div className="quote">“{run.thanks.text}”</div>}
    <p className="small muted">{t('thanksNote')}</p></div>;
}
