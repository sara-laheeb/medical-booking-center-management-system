/**
 * User Login Page
 * Supports credentials authentication, demo account quick-fill,
 * password visibility toggling, error alerts, and RTL/LTR internationalization.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import Button from '../../components/Button';
import FormField from '../../components/common/FormField';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageToggle from '../../components/LanguageToggle';

const DEMO_ACCOUNTS = [
  { role: 'admin', label: 'Admin', email: 'admin@test.com', password: 'password123' },
  { role: 'doctor', label: 'Doctor', email: 'doctor@test.com', password: 'password123' },
  { role: 'receptionist', label: 'Receptionist', email: 'reception@test.com', password: 'password123' },
  { role: 'pharmacist', label: 'Pharmacist', email: 'pharmacy@test.com', password: 'password123' },
  { role: 'patient', label: 'Patient', email: 'patient@test.com', password: 'password123' },
];

/**
 * Authentication login page component.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isAr = lang === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/app';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || (isAr ? 'فشل تسجيل الدخول. تحقق من البيانات.' : 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--sp-6) var(--sp-4)',
        position: 'relative',
        background: 'var(--bg-canvas)',
      }}
    >
      {/* Top action bar */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          insetInlineEnd: 24,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <ThemeToggle className="btn-outline" />
        <LanguageToggle className="btn-outline" />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 24,
          insetInlineStart: 24,
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--brand)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span className="icon-mirror">←</span>
          <span>{t.auth?.backToHome || 'Back to website'}</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div
        className="card pad page-enter"
        style={{
          width: '100%',
          maxWidth: 440,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)',
          margin: '40px auto 20px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(150deg, var(--p-400), var(--p-700))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 20,
              boxShadow: '0 8px 20px rgba(15,110,100,0.32)',
              marginBottom: 14,
            }}
          >
            ✚
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>
            {t.auth?.signInTitle || 'Sign in to MediCare'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
            {t.auth?.signInSubtitle || 'Access clinical scheduling and records'}
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 18 }}>
            <Alert variant="error" title={isAr ? 'خطأ في المصادقة' : 'Authentication Error'}>
              {error}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack">
          <FormField label={t.auth?.email || 'Email Address'} required>
            <Input
              type="email"
              autoComplete="email"
              placeholder={t.auth?.emailPlaceholder || 'name@clinic.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              hasError={Boolean(error)}
            />
          </FormField>

          <FormField label={t.auth?.password || 'Password'} required>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t.auth?.passwordPlaceholder || 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                hasError={Boolean(error)}
                style={{ paddingInlineEnd: 40, width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                aria-label={showPassword ? (isAr ? 'إخفاء كلمة المرور' : 'Hide password') : (isAr ? 'عرض كلمة المرور' : 'Show password')}
                title={showPassword ? (isAr ? 'إخفاء كلمة المرور' : 'Hide password') : (isAr ? 'عرض كلمة المرور' : 'Show password')}
                aria-pressed={showPassword}
                style={{
                  position: 'absolute',
                  insetInlineEnd: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--r-sm)',
                  transition: 'color var(--dur-fast) var(--ease)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--ink)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {showPassword ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
              </button>
            </div>
          </FormField>

          <Button
            type="submit"
            variant="primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (t.auth?.signingIn || 'Signing in...') : (t.auth?.signInButton || 'Sign in to workspace')}
          </Button>
        </form>

        {/* Quick Demo Pre-fill Pills */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {t.auth?.demoLoginTitle || 'Quick Demo Access'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                className="filter-chip"
                style={{ fontSize: 11, padding: '5px 10px' }}
                onClick={() => handleQuickFill(acc)}
                title={`Prefill ${acc.label} credentials`}
              >
                {t.auth?.[`role${acc.label}`] || acc.label}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            marginTop: 22,
          }}
        >
          {t.auth?.dontHaveAccount || "Don't have an account?"}{' '}
          <Link
            to="/register"
            style={{ color: 'var(--brand)', fontWeight: 700, marginInlineStart: 4 }}
          >
            {t.auth?.signUpLink || 'Create account'}
          </Link>
        </div>
      </div>
    </div>
  );
}

function EyeIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
