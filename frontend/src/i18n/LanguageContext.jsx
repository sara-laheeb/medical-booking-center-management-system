import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('medicare_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('medicare_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  const t = translations[lang] || translations.en;
  const dir = t.dir || (lang === 'ar' ? 'rtl' : 'ltr');

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    try {
      localStorage.setItem('medicare_lang', lang);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [lang, dir]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('medicare_theme', theme);
    } catch {
      // Ignore storage errors in restricted environments
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      lang,
      dir,
      t,
      theme,
      setLang,
      setTheme,
      toggleLanguage: () => setLang((prev) => (prev === 'en' ? 'ar' : 'en')),
      toggleTheme: () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light')),
    }),
    [lang, dir, t, theme]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}