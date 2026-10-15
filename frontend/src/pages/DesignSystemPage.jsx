/**
 * Design System Page (Development Reference)
 * Internal component library showcase displaying all UI primitives:
 * buttons, badges, cards, form fields, inputs, alerts, and color tokens.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import Button from '../components/Button';
import Badge from '../components/common/Badge';
import Card, { AccentCard } from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import FormField from '../components/common/FormField';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';
import Skeleton, { SkeletonStatCard, SkeletonAccentCard } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';

const PALETTES = {
  primary: [
    { name: 'p-50', hex: '#F1FAF8' },
    { name: 'p-100', hex: '#DCF3EE' },
    { name: 'p-200', hex: '#B7E6DD' },
    { name: 'p-300', hex: '#8AD6C9' },
    { name: 'p-400', hex: '#4DBFAE' },
    { name: 'p-500', hex: '#16A394' },
    { name: 'p-600', hex: '#128577' },
    { name: 'p-700', hex: '#0F6E64' },
    { name: 'p-800', hex: '#0C544D' },
    { name: 'p-900', hex: '#0B3D3A' },
  ],
  accent: [
    { name: 'a-400', hex: '#F3B65C' },
    { name: 'a-500', hex: '#E8A33D' },
    { name: 'a-600', hex: '#C9822A' },
  ],
  semantic: [
    { name: 'success-500', hex: '#16A34A' },
    { name: 'warning-500', hex: '#E8A33D' },
    { name: 'error-500', hex: '#DC4E4E' },
    { name: 'info-500', hex: '#3B82C4' },
  ],
  neutral: [
    { name: 'n-0', hex: '#FFFFFF' },
    { name: 'n-100', hex: '#F1F5F9' },
    { name: 'n-300', hex: '#CBD5E1' },
    { name: 'n-500', hex: '#64748B' },
    { name: 'n-700', hex: '#334155' },
    { name: 'n-900', hex: '#111827' },
    { name: 'n-950', hex: '#0B1220' },
  ],
};

const TABLE_ROWS = [
  {
    id: 1,
    name: 'Layla Hassan',
    initials: 'LH',
    doctor: 'Dr. Ahmed Karim',
    dept: 'Cardiology',
    date: '2026-08-09 10:30',
    status: 'confirmed',
    statusLabel: 'Confirmed',
    amount: 'IQD 45,000',
  },
  {
    id: 2,
    name: 'Omar Mansour',
    initials: 'OM',
    doctor: 'Dr. Sara Nabil',
    dept: 'Dermatology',
    date: '2026-08-09 13:00',
    status: 'pending',
    statusLabel: 'Pending',
    amount: 'IQD 60,000',
  },
  {
    id: 3,
    name: 'Rana Jabbar',
    initials: 'RJ',
    doctor: 'Dr. Ahmed Karim',
    dept: 'Cardiology',
    date: '2026-08-10 09:15',
    status: 'cancelled',
    statusLabel: 'Cancelled',
    amount: 'IQD 45,000',
  },
];

export default function DesignSystemPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [activeFilter, setActiveFilter] = useState('all');
  const [switchChecked, setSwitchChecked] = useState(true);
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="shell" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Side Navigation Preview */}
      <aside
        style={{
          width: '260px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          background: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
          backdropFilter: 'blur(20px)',
          borderInlineEnd: '1px solid var(--border-default)',
          padding: 'var(--sp-6) var(--sp-4)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 8 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: 'linear-gradient(150deg, var(--p-400), var(--p-700))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              boxShadow: '0 6px 16px rgba(15,110,100,0.38)',
            }}
          >
            ✚
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)' }}>
              MediCare Center
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {isAr ? 'نظام التصميم - الإصدار 1.0' : 'Design System v1.0'}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--brand)',
            background: 'var(--brand-soft)',
            padding: '4px 10px',
            borderRadius: 'var(--r-full)',
            margin: '12px 0 16px',
            alignSelf: 'flex-start',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--success-500)',
              display: 'inline-block',
            }}
          />
          {isAr ? 'بغداد · الفرع الرئيسي' : 'Baghdad · Main Branch'}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            fontSize: '13px',
            marginTop: 'var(--sp-2)',
          }}
        >
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--n-400)',
              letterSpacing: '0.08em',
              margin: '14px 4px 6px',
            }}
          >
            {isAr ? 'الأساسيات' : 'Foundations'}
          </div>
          <a
            href="#colors"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            🎨 {isAr ? 'الألوان' : 'Colors'}
          </a>
          <a
            href="#typography"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            🔤 {isAr ? 'الطباعة' : 'Typography'}
          </a>
          <a
            href="#spacing"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            📏 {isAr ? 'المسافات والانحناءات' : 'Spacing & Radius'}
          </a>
          <a
            href="#elevation"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            ✨ {isAr ? 'الارتفاع والظلال' : 'Elevation'}
          </a>

          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--n-400)',
              letterSpacing: '0.08em',
              margin: '14px 4px 6px',
            }}
          >
            {isAr ? 'المكوّنات' : 'Components'}
          </div>
          <a
            href="#buttons"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            🔘 {isAr ? 'الأزرار' : 'Buttons'}
          </a>
          <a
            href="#forms"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            📝 {isAr ? 'عناصر النماذج' : 'Form Controls'}
          </a>
          <a
            href="#badges"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            🏷️ {isAr ? 'شارات الحالة' : 'Status Badges'}
          </a>
          <a
            href="#cards"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            🃏 {isAr ? 'البطاقات' : 'Cards'}
          </a>
          <a
            href="#table"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            📊 {isAr ? 'جدول البيانات' : 'Data Table'}
          </a>
          <a
            href="#alerts"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            ⚠️ {isAr ? 'التنبيهات' : 'Alerts'}
          </a>
          <a
            href="#loading"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            ⏳ {isAr ? 'حالات التحميل' : 'Loading States'}
          </a>
          <a
            href="#empty"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            📭 {isAr ? 'الحالات الفارغة' : 'Empty States'}
          </a>
          <a
            href="#bilingual"
            style={{
              padding: '7px 10px',
              borderRadius: 'var(--r-md)',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            🌐 {isAr ? 'عرض ثنائي اللغة' : 'Bilingual / RTL'}
          </a>
        </div>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 'var(--sp-4)',
            borderTop: '1px solid var(--border-default)',
            fontSize: '12px',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--brand)',
              fontWeight: 600,
            }}
          >
            ← {isAr ? 'العودة للصفحة الرئيسية' : 'Back to Landing Page'}
          </Link>
        </div>
      </aside>

      {/* Main Preview Content */}
      <main style={{ flex: 1, padding: '48px var(--sp-10) 96px', maxWidth: '1200px' }}>
        {/* Topbar Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--sp-4)',
            marginBottom: '48px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
                marginBottom: 8,
              }}
            >
              <span>MediCare Center</span>
              <span className="icon-mirror">›</span>
              <span style={{ color: 'var(--brand)', fontWeight: 600 }}>
                {isAr ? 'نظام التصميم' : 'Design System'}
              </span>
            </div>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 800,
                position: 'relative',
                paddingInlineStart: 18,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  insetInlineStart: 0,
                  top: 4,
                  bottom: 4,
                  width: 4,
                  borderRadius: 3,
                  background: 'linear-gradient(180deg, var(--p-400), var(--brand), var(--a-500))',
                }}
              />
              {isAr ? 'نظام التصميم والمكتبة البصرية' : 'Design System & UI Primitives'}
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginTop: 8,
                maxWidth: '680px',
                lineHeight: 1.65,
                marginInlineStart: 18,
              }}
            >
              {isAr
                ? 'هوية بصرية عصرية وراقية لمنصة حجز طبي، مبنية لتعمل بانسجام في الوضعين الفاتح والداكن، مع دعم كامل للاتجاهين LTR و RTL.'
                : 'Modern, premium, minimal healthcare SaaS visual language — built for light & dark themes with complete LTR and RTL support.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            <ThemeToggle className="btn-outline" />
            <LanguageToggle className="btn-outline" />
          </div>
        </div>

        {/* Section 1: Colors */}
        <section id="colors" style={{ marginBottom: 64 }}>
          <div className="eyebrow">{isAr ? 'الأساسيات' : 'Foundations'}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
            {isAr ? 'لوحة الألوان' : 'Color Palette'}
          </h2>
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
              marginBottom: 24,
              maxWidth: 720,
            }}
          >
            {isAr
              ? 'التركواز الطبي هو جوهر الهوية البصرية. الكهرماني يُستخدم بحذر للتمييز، والألوان الدلالية واضحة ومتباينة سريرياً.'
              : 'Clinical Teal is the brand core. Amber is reserved for highlights, never primary actions. Semantic colors are distinct and unambiguous.'}
          </p>

          <div className="stack">
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
                {isAr ? 'الأساسي — تركواز طبي' : 'Primary — Clinical Teal'}
              </div>
              <div className="swatch-grid">
                {PALETTES.primary.map((c) => (
                  <div key={c.name} className="swatch">
                    <div className="swatch-color" style={{ background: c.hex }} />
                    <div className="swatch-meta">
                      <div className="swatch-name">{c.name}</div>
                      <div className="swatch-hex">{c.hex}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
                {isAr ? 'الثانوي — كهرماني (استخدام محدود)' : 'Accent — Amber (sparing use)'}
              </div>
              <div className="swatch-grid">
                {PALETTES.accent.map((c) => (
                  <div key={c.name} className="swatch">
                    <div className="swatch-color" style={{ background: c.hex }} />
                    <div className="swatch-meta">
                      <div className="swatch-name">{c.name}</div>
                      <div className="swatch-hex">{c.hex}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
                {isAr ? 'الألوان الدلالية' : 'Semantic Colors'}
              </div>
              <div className="swatch-grid">
                {PALETTES.semantic.map((c) => (
                  <div key={c.name} className="swatch">
                    <div className="swatch-color" style={{ background: c.hex }} />
                    <div className="swatch-meta">
                      <div className="swatch-name">{c.name}</div>
                      <div className="swatch-hex">{c.hex}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
                {isAr ? 'المحايد — رمادي داكن وفاتح' : 'Neutral — Slate'}
              </div>
              <div className="swatch-grid">
                {PALETTES.neutral.map((c) => (
                  <div key={c.name} className="swatch">
                    <div className="swatch-color" style={{ background: c.hex }} />
                    <div className="swatch-meta">
                      <div className="swatch-name">{c.name}</div>
                      <div className="swatch-hex">{c.hex}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Typography */}
        <section id="typography" style={{ marginBottom: 64 }}>
          <div className="eyebrow">{isAr ? 'الأساسيات' : 'Foundations'}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
            {isAr ? 'الطباعة والخطوط' : 'Typography'}
          </h2>
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
              marginBottom: 24,
            }}
          >
            {isAr
              ? 'يُستخدم خط Rubik بجميع أوزانه لكل من الإنجليزية والعربية — صوت طباعي موحد دون أي تحول عند تبديل الاتجاه. خط IBM Plex Mono مخصص للأرقام والمعرفات.'
              : 'Rubik is unified across English and Arabic layouts. IBM Plex Mono is reserved for data, IDs, and financial figures.'}
          </p>

          <Card pad className="stack">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <span className="font-display" style={{ fontSize: 36, fontWeight: 800 }}>Display XL</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>36 / 44 · 800</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <span className="font-display" style={{ fontSize: 28, fontWeight: 700 }}>Heading 1 — Modern Clinic SaaS</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>28 / 34 · 700</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <span className="font-display" style={{ fontSize: 20, fontWeight: 700 }}>Heading 2 — Patient Consultations</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>20 / 26 · 700</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <span style={{ fontSize: 15 }}>Body — High fidelity medical management interface</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>15 / 22 · 400</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <span className="mono" style={{ fontSize: 14 }}>INV-2026-00842 · IQD 45,000</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mono · Data &amp; Finance</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span dir="rtl" style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Rubik' }}>
                حجز موعد استشارة طبية — مركز ميديكير التخصصي
              </span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Rubik · Arabic RTL</span>
            </div>
          </Card>
        </section>

        {/* Section 3: Spacing, Radius & Elevation */}
        <section id="spacing" style={{ marginBottom: 64 }}>
          <div className="eyebrow">{isAr ? 'الأساسيات' : 'Foundations'}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
            {isAr ? 'المسافات والظلال' : 'Spacing, Radius & Elevation'}
          </h2>
          <div className="grid-2">
            <Card pad>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14 }}>
                {isAr ? 'مقياس الانحناءات' : 'RADIUS SCALE'}
              </div>
              <div className="row" style={{ gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--r-sm)', background: 'var(--brand-soft)', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>sm</div>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--r-md)', background: 'var(--brand-soft)', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>md</div>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--r-lg)', background: 'var(--brand-soft)', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>lg</div>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--r-xl)', background: 'var(--brand-soft)', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>xl</div>
                <div style={{ width: 70, height: 36, borderRadius: 'var(--r-full)', background: 'var(--brand-soft)', border: '2px solid var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>pill</div>
              </div>
            </Card>

            <Card pad>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14 }}>
                {isAr ? 'الارتفاع والظلال' : 'ELEVATION SCALE'}
              </div>
              <div className="row" style={{ gap: 16 }}>
                <div className="elevation-demo" style={{ boxShadow: 'var(--shadow-sm)' }}>shadow-sm</div>
                <div className="elevation-demo" style={{ boxShadow: 'var(--shadow-md)' }}>shadow-md</div>
                <div className="elevation-demo" style={{ boxShadow: 'var(--shadow-lg)' }}>shadow-lg</div>
              </div>
            </Card>
          </div>
        </section>

        {/* Section 4: Buttons */}
        <section id="buttons" style={{ marginBottom: 64 }}>
          <div className="eyebrow">{isAr ? 'المكوّنات' : 'Components'}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
            {isAr ? 'الأزرار' : 'Buttons'}
          </h2>
          <Card pad className="stack">
            <div className="row">
              <Button variant="primary">{isAr ? 'تأكيد الموعد' : 'Confirm Appointment'}</Button>
              <Button variant="secondary">{isAr ? 'عرض التفاصيل' : 'View Details'}</Button>
              <Button variant="outline">{isAr ? 'إعادة الجدولة' : 'Reschedule'}</Button>
              <Button variant="ghost">{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button variant="danger">{isAr ? 'حذف السجل' : 'Delete Record'}</Button>
              <Button variant="primary" disabled>{isAr ? 'معطّل' : 'Disabled'}</Button>
            </div>
            <div className="row">
              <Button variant="primary" size="sm">{isAr ? 'زر أساسي صغير' : 'Small Primary'}</Button>
              <Button variant="outline" size="sm">{isAr ? 'زر بإطار صغير' : 'Small Outline'}</Button>
              <Button variant="primary" size="lg">{isAr ? 'زر كبير' : 'Large Button'}</Button>
              <Button variant="outline" className="btn-icon">✚</Button>
              <Button variant="primary" className="btn-icon">✓</Button>
            </div>
          </Card>
        </section>

        {/* Section 5: Status Badges */}
        <section id="badges" style={{ marginBottom: 64 }}>
          <div className="eyebrow">{isAr ? 'المكوّنات' : 'Components'}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
            {isAr ? 'شارات الحالة' : 'Status Badges'}
          </h2>
          <Card pad>
            <div className="row" style={{ gap: 12 }}>
              <Badge variant="confirmed">{isAr ? 'مؤكد' : 'Confirmed'}</Badge>
              <Badge variant="pending">{isAr ? 'قيد الانتظار' : 'Pending'}</Badge>
              <Badge variant="cancelled">{isAr ? 'ملغى' : 'Cancelled'}</Badge>
              <Badge variant="completed">{isAr ? 'مكتمل' : 'Completed'}</Badge>
              <Badge variant="info">{isAr ? 'معلومات' : 'Information'}</Badge>
              <Badge variant="brand">{isAr ? 'العلامة' : 'Brand'}</Badge>
            </div>
          </Card>
        </section>

        {/* Section 6: Form Controls */}
        <section id="forms" style={{ marginBottom: 64 }}>
          <div className="eyebrow">{isAr ? 'المكوّنات' : 'Components'}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
            {isAr ? 'عناصر النماذج' : 'Form Controls'}
          </h2>
          <Card pad>
            <div className="grid-2">
              <FormField label={isAr ? 'اسم المريض الكامل' : 'Patient Full Name'} required>
                <Input placeholder={isAr ? 'مثال: ليلى حسن' : 'e.g. Layla Hassan'} defaultValue="Layla Hassan" />
              </FormField>

              <FormField label={isAr ? 'القسم الطبي' : 'Department'}>
                <Input as="select" defaultValue="cardiology">
                  <option value="cardiology">{isAr ? 'أمراض القلب' : 'Cardiology'}</option>
                  <option value="dermatology">{isAr ? 'الأمراض الجلدية' : 'Dermatology'}</option>
                  <option value="pediatrics">{isAr ? 'طب الأطفال' : 'Pediatrics'}</option>
                </Input>
              </FormField>

              <FormField
                label={isAr ? 'الرقم الوطني' : 'National ID'}
                error={isAr ? 'يجب أن يتكون من 12 رقماً' : 'Must be 12 digits'}
              >
                <Input defaultValue="98230" hasError />
              </FormField>

              <FormField
                label={isAr ? 'رقم الهاتف' : 'Phone Number'}
                success={isAr ? 'رقم صحيح وموثق' : 'Valid and verified phone'}
              >
                <Input defaultValue="+964 770 123 4567" hasSuccess />
              </FormField>
            </div>

            <div style={{ marginTop: 'var(--sp-4)' }}>
              <FormField label={isAr ? 'ملاحظات الزيارة' : 'Visit Notes'}>
                <Input as="textarea" placeholder={isAr ? 'سبب الزيارة أو تفاصيل إضافية...' : 'Reason for visit...'} />
              </FormField>
            </div>

            <div className="row" style={{ marginTop: 'var(--sp-4)', gap: 24 }}>
              <label className="checkbox-row">
                <input type="checkbox" defaultChecked />
                <span>{isAr ? 'إرسال تأكيد بالبريد الإلكتروني' : 'Send email confirmation'}</span>
              </label>

              <label className="checkbox-row">
                <input type="checkbox" defaultChecked />
                <span>{isAr ? 'تذكير عبر الرسائل القصيرة SMS' : 'SMS reminders'}</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  {isAr ? 'التفعيل التلقائي:' : 'Auto-confirm:'}
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={switchChecked}
                    onChange={(e) => setSwitchChecked(e.target.checked)}
                  />
                  <span className="switch-track" />
                </label>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 7: Cards & StatCards */}
        <section id="cards" style={{ marginBottom: 64 }}>
          <div className="eyebrow">{isAr ? 'المكوّنات' : 'Components'}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
            {isAr ? 'البطاقات وإحصاءات الأداء' : 'Cards & Clinical Entities'}
          </h2>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <StatCard
              icon={<span>📅</span>}
              value="28"
              label={isAr ? 'المواعيد اليوم' : 'Appointments today'}
              delta={isAr ? '▲ 12٪ مقارنة بالأسبوع الماضي' : '▲ 12% vs last week'}
              trend="up"
              sparkline
            />
            <StatCard
              icon={<span>💳</span>}
              value="1,420,000"
              label={isAr ? 'الإيرادات اليوم (د.ع)' : 'Revenue today (IQD)'}
              delta={isAr ? '▲ 4٪ مقارنة بالأمس' : '▲ 4% vs yesterday'}
              trend="up"
              featured
              featuredTag={isAr ? 'اليوم' : 'TODAY'}
              sparkline
            />
            <StatCard
              icon={<span>👨‍⚕️</span>}
              value="9"
              label={isAr ? 'الأطباء المناوبون' : 'Doctors on duty'}
              delta={isAr ? 'نفس العدد كالأمس' : 'Same as yesterday'}
              trend="neutral"
            />
          </div>

          <div className="grid-3">
            <AccentCard
              status="confirmed"
              avatar="LH"
              title="Layla Hassan → Dr. Ahmed Karim"
              subtitle={isAr ? 'أمراض القلب · فحص متابعة' : 'Cardiology · Follow-up consultation'}
              meta="2026-08-09 · 10:30 AM"
            />
            <AccentCard
              status="pending"
              avatar="OM"
              title="Omar Mansour → Dr. Sara Nabil"
              subtitle={isAr ? 'الأمراض الجلدية · مريض جديد' : 'Dermatology · New patient'}
              meta="2026-08-09 · 01:00 PM"
            />
            <AccentCard
              status="cancelled"
              avatar="RJ"
              title="Rana Jabbar → Dr. Ahmed Karim"
              subtitle={isAr ? 'أمراض القلب · فحص دوري' : 'Cardiology · Routine check-up'}
              meta="2026-08-10 · 09:15 AM"
            />
          </div>
        </section>

        {/* Section 8: Data Table */}
        <section id="table" style={{ marginBottom: 64 }}>
          <div className="eyebrow">{isAr ? 'المكوّنات' : 'Components'}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
            {isAr ? 'جدول البيانات' : 'Data Table'}
          </h2>
          <Card>
            <div className="table-toolbar">
              <div className="table-search">
                <span>🔍</span>
                <span>{isAr ? 'بحث عن المواعيد...' : 'Search appointments...'}</span>
              </div>
              <div className="table-filters">
                <button
                  className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('all')}
                >
                  {isAr ? 'الكل' : 'All'}
                </button>
                <button
                  className={`filter-chip ${activeFilter === 'today' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('today')}
                >
                  {isAr ? 'اليوم' : 'Today'}
                </button>
                <button
                  className={`filter-chip ${activeFilter === 'week' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('week')}
                >
                  {isAr ? 'هذا الأسبوع' : 'This week'}
                </button>
              </div>
              <Button variant="outline" size="sm">
                {isAr ? 'تصدير' : 'Export'}
              </Button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>{isAr ? 'المريض' : 'Patient'}</th>
                    <th>{isAr ? 'الطبيب' : 'Doctor'}</th>
                    <th>{isAr ? 'القسم' : 'Department'}</th>
                    <th>{isAr ? 'التاريخ' : 'Date'}</th>
                    <th>{isAr ? 'الحالة' : 'Status'}</th>
                    <th>{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th style={{ textAlign: 'end' }}>{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="cell-name">
                          <div className="cell-avatar">{row.initials}</div>
                          <div>
                            <div className="cell-name-meta">{row.name}</div>
                            <div className="cell-sub">ID: #{1000 + row.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>{row.doctor}</td>
                      <td>{row.dept}</td>
                      <td className="mono">{row.date}</td>
                      <td>
                        <Badge variant={row.status}>{row.statusLabel}</Badge>
                      </td>
                      <td className="mono">{row.amount}</td>
                      <td>
                        <div className="row-actions">
                          <button className="icon-btn" title="Edit">✏️</button>
                          <button className="icon-btn" title="View">👁️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-pagination">
              <div>{isAr ? 'عرض 1–3 من 128' : 'Showing 1–3 of 128'}</div>
              <div className="pagination-controls">
                <button className="page-btn disabled">‹</button>
                <button className="page-btn active">1</button>
                <button className="page-btn">2</button>
                <button className="page-btn">3</button>
                <button className="page-btn">›</button>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 9: Alerts & Feedback */}
        <section id="alerts" style={{ marginBottom: 64 }}>
          <div className="eyebrow">{isAr ? 'المكوّنات' : 'Components'}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
            {isAr ? 'التنبيهات' : 'Alerts & Notifications'}
          </h2>
          <div className="stack">
            <Alert variant="success" title={isAr ? 'تم تأكيد الموعد بنجاح' : 'Appointment confirmed'}>
              {isAr
                ? 'تم حجز موعد ليلى حسن مع د. أحمد كريم يوم 9 أغسطس الساعة 10:30 صباحاً.'
                : 'Layla Hassan is booked with Dr. Ahmed Karim for Aug 9, 10:30 AM.'}
            </Alert>
            <Alert variant="warning" title={isAr ? 'الأوقات المتاحة توشك على النفاد' : 'Slot filling up fast'}>
              {isAr
                ? 'تبقّى موعدان فقط لدى د. سارة نبيل لهذا الأسبوع.'
                : 'Only 2 slots remain for Dr. Sara Nabil this week.'}
            </Alert>
            <Alert variant="error" title={isAr ? 'انتهت مهلة الإلغاء الإلكتروني' : 'Cancellation window passed'}>
              {isAr
                ? 'لم يعد بالإمكان إلغاء هذا الموعد عبر المنصة — يرجى التواصل مع مكتب الاستقبال.'
                : 'This appointment can no longer be cancelled online — contact the front desk.'}
            </Alert>
            <Alert variant="info" title={isAr ? 'ميزة جديدة متوفرة' : 'New feature available'}>
              {isAr
                ? 'يمكن للأطباء الآن إرفاق نتائج التحاليل مباشرة بملف المريض.'
                : 'Doctors can now attach lab results directly to patient records.'}
            </Alert>
          </div>
        </section>

        {/* Section 10: Modal Preview */}
        <section id="modal" style={{ marginBottom: 64 }}>
          <div className="eyebrow">{isAr ? 'المكوّنات' : 'Components'}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
            {isAr ? 'النافذة المنبثقة' : 'Modal / Dialog Preview'}
          </h2>
          <div className="modal-frame">
            <div className="modal-box">
              <div className="modal-icon">⚠️</div>
              <h3>{isAr ? 'هل تريد بالتأكيد إلغاء هذا الموعد؟' : 'Cancel this appointment?'}</h3>
              <p>
                {isAr
                  ? 'سيؤدي هذا إلى إتاحة الموعد لمرضى آخرين. لا يمكن التراجع عن هذا الإجراء بعد انتهاء مهلة 24 ساعة.'
                  : 'This will free up the slot for other patients. This action cannot be undone after the 24-hour cutoff.'}
              </p>
              <div className="modal-actions">
                <Button variant="ghost">{isAr ? 'الاحتفاظ بالموعد' : 'Keep appointment'}</Button>
                <Button variant="danger">{isAr ? 'نعم، إلغاء الموعد' : 'Yes, cancel'}</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 11: Loading States & Skeletons */}
        <section id="loading" style={{ marginBottom: 64 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              <div className="eyebrow">{isAr ? 'المكوّنات' : 'Components'}</div>
              <h2 style={{ fontSize: '22px', fontWeight: 800 }}>
                {isAr ? 'حالات التحميل (Skeletons)' : 'Loading States'}
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReplayKey((k) => k + 1)}
            >
              ↻ {isAr ? 'إعادة تشغيل الحركة' : 'Replay Animation'}
            </Button>
          </div>

          <div key={replayKey} className="grid-3" style={{ marginBottom: 24 }}>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </div>

          <div key={`acc-${replayKey}`} className="grid-3">
            <SkeletonAccentCard />
            <SkeletonAccentCard />
            <SkeletonAccentCard />
          </div>
        </section>

        {/* Section 12: Empty States */}
        <section id="empty" style={{ marginBottom: 64 }}>
          <div className="eyebrow">{isAr ? 'المكوّنات' : 'Components'}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
            {isAr ? 'الحالات الفارغة' : 'Empty States'}
          </h2>
          <div className="grid-2">
            <Card>
              <EmptyState
                icon={<span>📅</span>}
                title={isAr ? 'لا توجد مواعيد اليوم' : 'No appointments today'}
                description={
                  isAr
                    ? 'جدول هذا الطبيب فارغ حالياً. ستظهر الحجوزات الجديدة هنا تلقائياً.'
                    : "This doctor's schedule is clear. New bookings will appear here automatically."
                }
                action={<Button variant="primary" size="sm">{isAr ? 'حجز موعد جديد' : 'Book an appointment'}</Button>}
              />
            </Card>

            <Card>
              <EmptyState
                icon={<span>🔍</span>}
                title={isAr ? 'لم يتم العثور على نتائج' : 'No results found'}
                description={
                  isAr
                    ? 'جرّب تعديل عوامل التصفية أو ابحث باسم مريض آخر.'
                    : 'Try adjusting the filters or search for a different patient name.'
                }
                action={<Button variant="outline" size="sm">{isAr ? 'مسح عوامل التصفية' : 'Clear filters'}</Button>}
              />
            </Card>
          </div>
        </section>

        {/* Section 13: Bilingual Side-by-Side Comparison */}
        <section id="bilingual" style={{ marginBottom: 64 }}>
          <div className="eyebrow">{isAr ? 'التعريب' : 'Localization'}</div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: 8 }}>
            {isAr ? 'عرض ثنائي اللغة ومقارنة الاتجاهين' : 'Bilingual / RTL Side-by-Side Comparison'}
          </h2>
          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
              marginBottom: 20,
            }}
          >
            {isAr
              ? 'تُستخدم خصائص CSS المنطقية (border-inline-start, margin-inline) لضمان انعكاس مثالي بين LTR و RTL دون تكرار قواعد التنسيق.'
              : 'CSS logical properties ensure seamless mirroring between LTR and RTL without stylesheet duplication.'}
          </p>

          <div className="grid-2">
            <div dir="ltr">
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', marginBottom: 8 }}>
                ENGLISH (LTR)
              </div>
              <AccentCard
                status="confirmed"
                avatar="LH"
                title="Layla Hassan → Dr. Ahmed Karim"
                subtitle="Cardiology · Follow-up consultation"
                meta="Aug 9 · 10:30 AM · Room 204"
              />
            </div>

            <div dir="rtl">
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', marginBottom: 8 }}>
                العربية (RTL)
              </div>
              <AccentCard
                status="confirmed"
                avatar="LH"
                title="ليلى حسن ← د. أحمد كريم"
                subtitle="أمراض القلب · استشارة متابعة"
                meta="٩ أغسطس · ١٠:٣٠ صباحاً · غرفة ٢٠٤"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
