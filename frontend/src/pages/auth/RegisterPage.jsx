/**
 * Role-Specific Registration Page
 * Allows new users to register as either:
 *  1) Patient: with instant account activation, simple demographic info, auto-sign-in, and redirect to dashboard.
 *  2) Doctor: requiring specialty selection (one of the 5 active specialties), medical license number,
 *     and verification credentials, placing account in pending administrator review.
 * Full RTL/LTR and dark/light theme support.
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
import BrandLogo from '../../components/BrandLogo';

// Only the 5 approved active specialties allowed for doctor registration
const APPROVED_SPECIALTIES = [
  { id: 2, name_en: 'Dentistry', name_ar: 'طب الأسنان' },
  { id: 8, name_en: 'Radiology & Ultrasound', name_ar: 'الأشعة والسونار' },
  { id: 6, name_en: 'Medical Laboratory', name_ar: 'المختبر الطبي' },
  { id: 4, name_en: 'Ophthalmology', name_ar: 'طب وجراحة العيون' },
  { id: 9, name_en: 'Orthopedics & Fractures', name_ar: 'جراحة العظام والكسور' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  // Role tab state: 'patient' or 'doctor'
  const [selectedRole, setSelectedRole] = useState('patient');

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Doctor-specific fields
  const [specialtyId, setSpecialtyId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [verificationDocs, setVerificationDocs] = useState('');

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doctorSubmitted, setDoctorSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Common validations
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError(isAr ? 'يرجى إكمال جميع الحقول الإلزامية' : 'Please fill in all required fields');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 6) {
      setError(t.auth?.passwordLength || (isAr ? 'يجب ألا تقل كلمة المرور عن 6 أحرف' : 'Password must be at least 6 characters'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth?.passwordMismatch || (isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'));
      return;
    }

    // Doctor specific validations
    if (selectedRole === 'doctor') {
      if (!specialtyId) {
        setError(isAr ? 'يرجى اختيار التخصص الطبي' : 'Please select your medical specialty');
        return;
      }
      if (!licenseNumber.trim()) {
        setError(isAr ? 'يرجى إدخال رقم ترخيص مزاولة المهنة' : 'Please enter your professional medical license number');
        return;
      }
    }

    try {
      setLoading(true);

      if (selectedRole === 'patient') {
        // Patient registration: auto signs in and redirects
        await register({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role: 'patient',
        });
        navigate('/app', { replace: true });
      } else {
        // Doctor registration: creates pending application
        await register({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role: 'doctor',
          specialty_id: Number(specialtyId),
          license_number: licenseNumber.trim(),
          verification_documents: verificationDocs.trim() || 'Submitted via doctor registration form',
        });
        setDoctorSubmitted(true);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already registered') || msg.includes('مسجل بالفعل')) {
        setError(
          isAr
            ? 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد آخر.'
            : 'This email is already registered. Please sign in or use another email.'
        );
      } else if (msg.includes('license number already exists') || msg.includes('رقم الترخيص')) {
        setError(
          isAr
            ? 'رقم ترخيص مزاولة المهنة هذا مسجل مسبقاً لطبيب آخر.'
            : 'A doctor with this license number already exists in the system.'
        );
      } else {
        setError(msg || (isAr ? 'حدث خطأ أثناء إرسال البيانات' : 'Registration failed. Please check your data.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedSpecialtyObj = APPROVED_SPECIALTIES.find((s) => s.id === Number(specialtyId));

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
          zIndex: 10,
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
          zIndex: 10,
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

      {/* Main Container Card */}
      <div
        className="card pad page-enter"
        style={{
          width: '100%',
          maxWidth: selectedRole === 'doctor' && !doctorSubmitted ? 560 : 480,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)',
          margin: '50px auto 30px',
          transition: 'max-width 0.25s ease',
        }}
      >
        {/* Doctor Registration Success State */}
        {doctorSubmitted ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--r-full)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginBottom: 10 }}>
              {isAr ? 'تم استلام طلب تسجيل الطبيب بنجاح' : 'Registration Request Submitted'}
            </h2>

            <div
              className="card pad"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                textAlign: isAr ? 'right' : 'left',
                margin: '18px 0',
                fontSize: 13.5,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
              }}
            >
              <p style={{ margin: '0 0 10px', color: 'var(--ink)', fontWeight: 600 }}>
                {isAr
                  ? 'طلب تسجيلك قيد المراجعة والتدقيق حالياً من قبل إدارة مجمع فيتا الطبي.'
                  : 'Your doctor registration request is pending administrator review and credential verification.'}
              </p>
              <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                <div>
                  <strong style={{ color: 'var(--ink)' }}>{isAr ? 'الاسم:' : 'Name:'}</strong> {name}
                </div>
                <div>
                  <strong style={{ color: 'var(--ink)' }}>{isAr ? 'البريد المهني:' : 'Email:'}</strong> {email}
                </div>
                <div>
                  <strong style={{ color: 'var(--ink)' }}>{isAr ? 'التخصص:' : 'Specialty:'}</strong>{' '}
                  {isAr ? selectedSpecialtyObj?.name_ar : selectedSpecialtyObj?.name_en}
                </div>
                <div>
                  <strong style={{ color: 'var(--ink)' }}>{isAr ? 'رقم الترخيص:' : 'License No:'}</strong> {licenseNumber}
                </div>
                <div>
                  <strong style={{ color: 'var(--ink)' }}>{isAr ? 'حالة الحساب:' : 'Status:'}</strong>{' '}
                  <span style={{ color: '#d97706', fontWeight: 700 }}>
                    {isAr ? 'قيد المراجعة والاعتماد' : 'Pending Administrative Approval'}
                  </span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20 }}>
              {isAr
                ? 'ستتلقى إشعاراً فور اعتماد ترخيصك لتتمكن من تسجيل الدخول إلى العيادة الإلكترونية.'
                : 'You will be able to access your clinical dashboard once your professional credentials are approved.'}
            </p>

            <Button
              variant="primary"
              style={{ width: '100%' }}
              onClick={() => navigate('/login')}
            >
              {t.auth?.goToLogin || (isAr ? 'الانتقال إلى تسجيل الدخول' : 'Proceed to Sign In')}
            </Button>
          </div>
        ) : (
          <>
            {/* Header branding */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: 12 }}>
                <BrandLogo variant="icon" size={46} />
              </div>
              <h1 style={{ fontSize: 21, fontWeight: 800, color: 'var(--ink)' }}>
                {selectedRole === 'patient'
                  ? (t.auth?.registerTitle || (isAr ? 'إنشاء حساب مريض' : 'Patient Registration'))
                  : (t.auth?.doctorTitle || (isAr ? 'طلب تسجيل طبيب معتمد' : 'Doctor Registration'))}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                {selectedRole === 'patient'
                  ? (t.auth?.registerSubtitle || (isAr ? 'سجل لإدارة مواعيدك وسجلاتك الطبية' : 'Register to manage appointments and records'))
                  : (t.auth?.doctorSubtitle || (isAr ? 'قدّم بيانات ترخيص مزاولة المهنة لاعتماد حسابك من الإدارة' : 'Submit your medical license for credential verification'))}
              </p>
            </div>

            {/* Role Segmented Switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 6,
                backgroundColor: 'var(--bg-subtle)',
                padding: 4,
                borderRadius: 'var(--r-md)',
                marginBottom: 20,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('patient');
                  setError('');
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: selectedRole === 'patient' ? 700 : 500,
                  backgroundColor: selectedRole === 'patient' ? 'var(--bg-card)' : 'transparent',
                  color: selectedRole === 'patient' ? 'var(--brand)' : 'var(--text-secondary)',
                  boxShadow: selectedRole === 'patient' ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>👤</span>
                <span>{t.auth?.tabPatient || (isAr ? 'تسجيل مريض' : 'Patient Registration')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('doctor');
                  setError('');
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: selectedRole === 'doctor' ? 700 : 500,
                  backgroundColor: selectedRole === 'doctor' ? 'var(--bg-card)' : 'transparent',
                  color: selectedRole === 'doctor' ? 'var(--brand)' : 'var(--text-secondary)',
                  boxShadow: selectedRole === 'doctor' ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>🩺</span>
                <span>{t.auth?.tabDoctor || (isAr ? 'تسجيل طبيب' : 'Doctor Registration')}</span>
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div style={{ marginBottom: 16 }}>
                <Alert variant="error" title={isAr ? 'خطأ في البيانات' : 'Registration Notice'}>
                  {error}
                </Alert>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="stack" style={{ gap: 'var(--sp-4)' }}>
              {/* Full Name */}
              <FormField
                label={selectedRole === 'doctor' ? (isAr ? 'الاسم واللقب العلمي' : 'Doctor Full Name & Title') : (t.auth?.fullName || (isAr ? 'الاسم الكامل' : 'Full Name'))}
                required
              >
                <Input
                  type="text"
                  autoComplete="name"
                  placeholder={selectedRole === 'doctor' ? (isAr ? 'مثال: د. مصطفى كمال' : 'e.g. Dr. Mustafa Kamal') : (t.auth?.fullNamePlaceholder || 'e.g. Layla Hassan')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </FormField>

              {/* Email & Phone side-by-side on desktop */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <FormField label={t.auth?.email || (isAr ? 'البريد الإلكتروني' : 'Email Address')} required>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder={selectedRole === 'doctor' ? 'doctor@medicare.local' : 'patient@example.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </FormField>

                <FormField label={t.auth?.phone || (isAr ? 'رقم الهاتف' : 'Phone Number')} required>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    placeholder="07801234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </FormField>
              </div>

              {/* Doctor Specific Fields: Specialty & License */}
              {selectedRole === 'doctor' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <FormField label={t.auth?.specialty || (isAr ? 'التخصص الطبي' : 'Medical Specialty')} required>
                      <select
                        className="input"
                        value={specialtyId}
                        onChange={(e) => setSpecialtyId(e.target.value)}
                        disabled={loading}
                        style={{ width: '100%' }}
                      >
                        <option value="">{t.auth?.selectSpecialty || (isAr ? 'اختر التخصص الطبي' : 'Select specialty')}</option>
                        {APPROVED_SPECIALTIES.map((spec) => (
                          <option key={spec.id} value={spec.id}>
                            {isAr ? spec.name_ar : spec.name_en}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField
                      label={t.auth?.licenseNumber || (isAr ? 'رقم ترخيص مزاولة المهنة' : 'License Number')}
                      hint={isAr ? 'رقم القيد في نقابة الأطباء' : 'Official medical registration'}
                      required
                    >
                      <Input
                        type="text"
                        placeholder={t.auth?.licensePlaceholder || 'e.g. LIC-DEN-102'}
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        disabled={loading}
                      />
                    </FormField>
                  </div>

                  <FormField
                    label={t.auth?.verificationDocs || (isAr ? 'وثائق التحقق والمؤهلات الأكاديمية' : 'Verification Credentials & Notes')}
                    hint={isAr ? 'تاريخ التخرج، البورد، أو تفاصيل جهة الاعتماد' : 'Board certification, university, or clinic credentials'}
                  >
                    <textarea
                      className="input"
                      rows={2}
                      placeholder={t.auth?.verificationDocsPlaceholder || (isAr ? 'مثال: بورد جراحة الأسنان، جامعة بغداد 2018...' : 'e.g. Iraqi Medical Syndicate ID, qualifications...')}
                      value={verificationDocs}
                      onChange={(e) => setVerificationDocs(e.target.value)}
                      disabled={loading}
                      style={{ resize: 'vertical', width: '100%', fontFamily: 'inherit', fontSize: 13 }}
                    />
                  </FormField>
                </>
              )}

              {/* Password & Confirm Password */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <FormField
                  label={t.auth?.password || (isAr ? 'كلمة المرور' : 'Password')}
                  hint={isAr ? '6 أحرف كحد أدنى' : 'Min 6 characters'}
                  required
                >
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </FormField>

                <FormField label={t.auth?.confirmPassword || (isAr ? 'تأكيد كلمة المرور' : 'Confirm Password')} required>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </FormField>
              </div>

              {/* Notice for doctor registration */}
              {selectedRole === 'doctor' && (
                <div
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    padding: '10px 14px',
                    borderRadius: 'var(--r-md)',
                    fontSize: 12.5,
                    color: 'var(--ink)',
                    lineHeight: 1.5,
                  }}
                >
                  ℹ️{' '}
                  {isAr
                    ? 'ملاحظة: طلبات تسجيل الأطباء تخضع لمراجعة إدارة المجمع والتحقق من ترخيص مزاولة المهنة قبل تفعيل الحساب السريري.'
                    : 'Note: Doctor applications are subject to administrator verification before clinical workspace access is granted.'}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                style={{ width: '100%', marginTop: 6 }}
                disabled={loading}
              >
                {loading
                  ? (t.auth?.registering || (isAr ? 'جاري إرسال البيانات...' : 'Submitting...'))
                  : selectedRole === 'doctor'
                  ? (isAr ? 'تقديم طلب تسجيل طبيب' : 'Submit Doctor Application')
                  : (t.auth?.registerButton || (isAr ? 'إنشاء حساب مريض' : 'Create Patient Account'))}
              </Button>
            </form>

            {/* Footer link to sign in */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 12.5,
                color: 'var(--text-secondary)',
                marginTop: 20,
              }}
            >
              {t.auth?.alreadyHaveAccount || (isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?')}{' '}
              <Link
                to="/login"
                style={{ color: 'var(--brand)', fontWeight: 700, marginInlineStart: 4 }}
              >
                {t.auth?.signInLink || (isAr ? 'تسجيل الدخول' : 'Sign in')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
