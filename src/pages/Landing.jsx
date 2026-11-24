import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { LangToggle, ZrythMark } from '../components/Brand';
import { Icon } from '../components/ui';

export function AuthForm({ role }) {
  const { t } = useI18n();
  const { login, signup } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', password: '', name: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const isPub = role === 'publisher';
  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const u = mode === 'signup' && !isPub ? await signup(f.email, f.password, f.name) : await login(f.email, f.password, role);
      nav(u.role === 'publisher' ? '/admin' : '/kids');
    } catch (ex) { setErr(t('err_' + ex.code) !== 'err_' + ex.code ? t('err_' + ex.code) : t('err_generic')); }
    finally { setBusy(false); }
  };
  const up = k => e => setF({ ...f, [k]: e.target.value });
  return (
    <form className="card stack" onSubmit={submit}>
      <h2 style={{ fontSize: 28 }}>{isPub ? t('publisherLogin') : t('parentLogin')}</h2>
      {!isPub && <div className="seg" role="tablist">
        <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>{t('login')}</button>
        <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>{t('signup')}</button>
      </div>}
      {mode === 'signup' && !isPub && <div className="field"><label htmlFor="nm">{t('yourName')}</label><input id="nm" type="text" value={f.name} onChange={up('name')} autoComplete="name" /></div>}
      <div className="field"><label htmlFor="em">{t('email')}</label><input id="em" type="email" dir="ltr" required value={f.email} onChange={up('email')} autoComplete="email" /></div>
      <div className="field"><label htmlFor="pw">{t('password')}</label><input id="pw" type="password" dir="ltr" required value={f.password} onChange={up('password')} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
        {mode === 'signup' && <small className="muted">{t('pwHint')}</small>}</div>
      <p className="err" role="alert">{err}</p>
      <button className={'btn big full ' + (isPub ? 'blue' : '')} disabled={busy}>{mode === 'signup' && !isPub ? t('signup') : t('login')}</button>
      {isPub ? <Link to="/" className="small muted" style={{ textAlign: 'center' }}>{t('backToFamily')}</Link>
        : <Link to="/publisher" className="small muted" style={{ textAlign: 'center' }}>{t('areYouPublisher')} {t('publisherLogin')}</Link>}
    </form>
  );
}

export default function Landing() {
  const { t } = useI18n();
  return (
    <div className="page-bg">
      <div className="topline"><ZrythMark /><LangToggle /></div>
      <div className="auth-wrap">
        <div className="hero">
          <div className="logo-card"><img src="/thoth-logo.jpg" alt="Thoth تحوت" /></div>
          <h1>{t('appName')}</h1>
          <p style={{ fontSize: 19, fontWeight: 800 }}>{t('tagline')}</p>
          <div className="feature-row">
            <div className="feature"><b>📚</b>{t('scanBook')}</div>
            <div className="feature"><b>🎤</b>{t('readAloud')}</div>
            <div className="feature"><b>🌊</b>{t('dive')}</div>
          </div>
        </div>
        <AuthForm role="parent" />
      </div>
      <div className="footer"><span className="small muted"><Icon n="lock" /> {t('grownUps')}</span></div>
    </div>
  );
}
