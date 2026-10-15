import { useLanguage } from '../i18n/LanguageContext';
import { GlobeIcon } from './icons';

export default function LanguageToggle({ className = '' }) {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      className={`lang-toggle ${className}`.trim()}
      onClick={toggleLanguage}
      aria-label="Switch language"
    >
      <GlobeIcon width={15} height={15} />
      <span>{lang === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
}
