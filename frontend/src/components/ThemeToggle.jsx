import { useLanguage } from '../i18n/LanguageContext';
import { SunIcon, MoonIcon } from './icons';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <SunIcon width={15} height={15} /> : <MoonIcon width={15} height={15} />}
    </button>
  );
}