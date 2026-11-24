import { useI18n } from '../lib/i18n';
import { Icon } from './ui';

export const ThothLogo = ({ h = 56 }) => <img src="/thoth-logo.jpg" alt="Thoth تحوت" className="thoth-logo" style={{ height: h }} />;

// The Thoth character, cropped from the logo, used as the in-game guide avatar.
export const ThothAvatar = ({ size = 52 }) => (
  <span className="thoth-av" style={{ width: size, height: size }}><img src="/thoth-logo.jpg" alt="" /></span>
);

export function ZrythMark({ small }) {
  const { t } = useI18n();
  return (
    <a className={'zryth' + (small ? ' small' : '')} href="https://zryth.com" target="_blank" rel="noreferrer">
      <span>{t('poweredBy')}</span><img src="/zryth-logo.png" alt="Zryth" />
    </a>
  );
}

export function LangToggle({ className = '' }) {
  const { t, toggle } = useI18n();
  return <button className={'chip lang ' + className} onClick={toggle} aria-label="Language"><Icon n="globe" /><span>{t('language')}</span></button>;
}
