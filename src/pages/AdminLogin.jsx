import { useI18n } from '../lib/i18n';
import { LangToggle, ZrythMark } from '../components/Brand';
import { AuthForm } from './Landing';

export default function AdminLogin() {
  const { t } = useI18n();
  return (
    <div className="page-bg admin">
      <div className="topline"><ZrythMark /><LangToggle /></div>
      <div className="auth-wrap">
        <div className="hero">
          <div className="logo-card"><img src="/thoth-logo.jpg" alt="Thoth تحوت" /></div>
          <h1>{t('publisherPortal')}</h1>
          <p style={{ fontSize: 18, fontWeight: 700 }} className="muted">{t('books')} · {t('codes')} · {t('analytics')}</p>
        </div>
        <AuthForm role="publisher" />
      </div>
    </div>
  );
}
