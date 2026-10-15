/**
 * User Registration Page
 * Allows new users to create an account with name, email, and password.
 * Supports RTL/LTR internationalization and theme toggling.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import Button from '../../components/Button';
import FormField from '../../components/common/FormField';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import ThemeToggle from '../../components/ThemeToggle';
import LanguageToggle from '../../components/LanguageToggle';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError(isAr ? 'يرجى إكمال جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError(t.auth?.passwordLength || 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth?.passwordMismatch || 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await register({ name, email, password, role: 'patient' });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message || (isAr ? 'حدث خطأ أثناء التسجيل' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
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

      <div
        className="card pad page-enter"
        style={{
          width: '100%',
          maxWidth: 460,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)',
          margin: '40px auto 20px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
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
            {t.auth?.registerTitle || 'Create your MediCare account'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
            {t.auth?.registerSubtitle || 'Register to manage appointments and records'}
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: 18 }}>
            <Alert variant="error" title={isAr ? 'خطأ في التسجيل' : 'Registration Error'}>
              {error}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack">
          <FormField label={t.auth?.fullName || 'Full Name'} required>
            <Input
              type="text"
              autoComplete="name"
              placeholder={t.auth?.fullNamePlaceholder || 'e.g. Layla Hassan'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              hasError={Boolean(error && !name)}
            />
          </FormField>

          <FormField label={t.auth?.email || 'Email address'} required>
            <Input
              type="email"
              autoComplete="email"
              placeholder={t.auth?.emailPlaceholder || 'name@clinic.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              hasError={Boolean(error && !email)}
            />
          </FormField>

          <FormField
            label={t.auth?.password || 'Password'}
            hint={isAr ? 'يجب أن لا تقل عن 6 أحرف' : 'Minimum 6 characters'}
            required
          >
            <Input
              type="password"
              autoComplete="new-password"
              placeholder={t.auth?.passwordPlaceholder || 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              hasError={Boolean(error && password.length < 6)}
            />
          </FormField>

          <FormField label={t.auth?.confirmPassword || 'Confirm Password'} required>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder={t.auth?.confirmPassword || 'Confirm Password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              hasError={Boolean(error && password !== confirmPassword)}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (t.auth?.registering || 'Creating account...') : (t.auth?.registerButton || 'Create account')}
          </Button>
        </form>

        <div
          style={{
            textAlign: 'center',
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            marginTop: 22,
          }}
        >
          {t.auth?.alreadyHaveAccount || 'Already have an account?'}{' '}
          <Link
            to="/login"
            style={{ color: 'var(--brand)', fontWeight: 700, marginInlineStart: 4 }}
          >
            {t.auth?.signInLink || 'Sign in'}
          </Link>
        </div>
      </div>
    </div>
  );
}
