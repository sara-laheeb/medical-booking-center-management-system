import { useLanguage } from '../i18n/LanguageContext';

/**
 * Official Brand Logo for Vita Medical Complex (مجمع فيتا الطبي)
 * Provides both icon-only badge and full dual-language branding lockup.
 */
export default function BrandLogo({
  variant = 'full', // 'full' | 'icon'
  size = 32,
  className = '',
  showSubtitle = true,
}) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const iconSvg = (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className="shrink-0 transition-transform duration-200 group-hover:scale-105"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <linearGradient id="vitaBadgeGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="vitaBadgeFill" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      {/* Protective Shield */}
      <path
        d="M32 7 C48 7, 56 14, 56 29 C56 47, 32 60, 32 60 C32 60, 8 47, 8 29 C8 14, 16 7, 32 7 Z"
        fill="url(#vitaBadgeFill)"
        stroke="url(#vitaBadgeGrad)"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />

      {/* Stylized 'V' for Vita */}
      <path
        d="M22 20 L32 42 L42 20"
        stroke="#0284c7"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 28 H40"
        stroke="#0ea5e9"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Vital Pulse Rhythm */}
      <path
        d="M16 32 L22 32 L26 23 L31 41 L36 25 L40 32 L48 32"
        stroke="#10b981"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Core Vital Spark */}
      <circle cx="32" cy="27" r="2.6" fill="#38bdf8" />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {iconSvg}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {iconSvg}
      <div className="flex flex-col text-left rtl:text-right leading-tight">
        <div className="font-bold text-[17px] tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
          <span>{isAr ? 'مجمع فيتا' : 'Vita'}</span>
          <span className="text-sky-600 dark:text-sky-400 font-semibold text-[15px]">
            {isAr ? 'الطبي' : 'Medical'}
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase">
            {isAr ? 'مجمع طبي تخصصي متكامل' : 'Specialized Complex'}
          </span>
        )}
      </div>
    </div>
  );
}
