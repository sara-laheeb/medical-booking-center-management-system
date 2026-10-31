/**
 * Patient Profile & Settings Page
 * ----------------------------------------------------
 * Allows patient users to view their medical registration file, verify emergency
 * contacts, view recorded blood type & allergies, and update contact information.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import patientService from '../../services/patientService';

import Card from '../../components/common/Card';
import Button from '../../components/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import Skeleton from '../../components/common/Skeleton';

import {
  UsersIcon,
  ShieldIcon,
  CheckCircleIcon,
  RefreshCwIcon,
} from '../../components/icons';

export default function PatientProfilePage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [patientData, setPatientData] = useState(null);

  // Editable form fields
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    allergies: '',
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const patientId = user?.patient?.id;
      if (!patientId) {
        // Fallback: search by user ID or current user
        const res = await patientService.getAll();
        if (res.data?.length > 0) {
          const p = res.data[0];
          setPatientData(p);
          setFormData({
            phone: p.phone || '',
            address: p.address || '',
            emergency_contact_name: p.emergency_contact_name || '',
            emergency_contact_phone: p.emergency_contact_phone || '',
            allergies: p.allergies || '',
          });
        }
      } else {
        const p = await patientService.getById(patientId);
        setPatientData(p);
        setFormData({
          phone: p.phone || '',
          address: p.address || '',
          emergency_contact_name: p.emergency_contact_name || '',
          emergency_contact_phone: p.emergency_contact_phone || '',
          allergies: p.allergies || '',
        });
      }
    } catch (err) {
      setError(err.message || (isAr ? 'فشل تحميل الملف الشخصي' : 'Failed to load profile'));
    } finally {
      setLoading(false);
    }
  }, [user, isAr]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientData?.id) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await patientService.update(patientData.id, {
        phone: formData.phone.trim(),
        address: formData.address.trim() || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
        allergies: formData.allergies.trim() || null,
      });

      setSuccessMsg(isAr ? 'تم تحديث بياناتك بنجاح.' : 'Profile updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || (isAr ? 'فشل حفظ التعديلات' : 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack" style={{ gap: 'var(--sp-6)', maxWidth: 800, margin: '0 auto', paddingBottom: 'var(--sp-10)' }}>
      {/* Header Banner */}
      <div
        className="card pad"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 60%, rgba(13, 148, 136, 0.12))',
          borderColor: 'rgba(13, 148, 136, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div className="eyebrow" style={{ color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <UsersIcon width={14} height={14} />
            {isAr ? 'بوابة المريض — الملف الشخصي' : 'Patient Portal — Profile & Settings'}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', margin: '4px 0 0' }}>
            {isAr ? 'الملف الشخصي والبيانات الطبية' : 'Patient Medical Profile'}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13.5 }}>
            {isAr
              ? 'مراجعة بيانات تسجيلك، فصيلة الدم، الحساسيات المسجلة، ومعلومات الطوارئ'
              : 'Review your clinical registration, blood type, allergy alerts, and emergency contacts'}
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={loadProfile} disabled={loading}>
          <RefreshCwIcon width={14} height={14} className={loading ? 'icon-spin' : ''} />
          <span>{isAr ? 'تحديث' : 'Refresh'}</span>
        </Button>
      </div>

      {successMsg && (
        <Alert variant="success" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert variant="error" title={isAr ? 'تنبيه' : 'Notice'} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="stack" style={{ gap: 14 }}>
          <Skeleton variant="card" height={140} />
          <Skeleton variant="card" height={220} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="stack" style={{ gap: 20 }}>
          {/* Read-Only Medical Identity Card */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldIcon width={18} height={18} />
                <span>{isAr ? 'بيانات القيد الطبي (رسمية وثابتة)' : 'Official Medical Registration'}</span>
              </div>
            }
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                padding: '4px 0',
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{isAr ? 'الاسم الكامل:' : 'Full Name:'}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', marginTop: 2 }}>
                  {patientData?.full_name || `${patientData?.first_name || ''} ${patientData?.last_name || ''}`}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{isAr ? 'رقم الملف الطبي:' : 'Patient File Code:'}</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand)', marginTop: 2 }}>
                  {patientData?.patient_code || 'PT-REGISTERED'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{isAr ? 'البريد الإلكتروني:' : 'Email Address:'}</div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)', marginTop: 2 }}>
                  {patientData?.email || user?.email}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{isAr ? 'تاريخ الميلاد / الجنس:' : 'DOB / Gender:'}</div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)', marginTop: 2 }}>
                  {String(patientData?.date_of_birth || '').split('T')[0]} ·{' '}
                  {patientData?.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{isAr ? 'فصيلة الدم:' : 'Blood Type:'}</div>
                <div style={{ marginTop: 2 }}>
                  <Badge variant="confirmed">
                    🩸 {patientData?.blood_type || (isAr ? 'غير مسجلة' : 'Not recorded')}
                  </Badge>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{isAr ? 'الرقم الوطني / الهوية:' : 'National ID:'}</div>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)', marginTop: 2 }}>
                  {patientData?.national_id || '-'}
                </div>
              </div>
            </div>
          </Card>

          {/* Editable Contact & Health Card */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UsersIcon width={18} height={18} />
                <span>{isAr ? 'معلومات الاتصال والطوارئ (قابلة للتعديل)' : 'Contact & Emergency Details'}</span>
              </div>
            }
          >
            <div className="stack" style={{ gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                    {isAr ? 'رقم الهاتف:' : 'Phone Number:'}
                  </label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                    {isAr ? 'عنوان السكن:' : 'Residential Address:'}
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={isAr ? 'مثال: بغداد، الكرادة' : 'e.g. Baghdad, Karrada'}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                    {isAr ? 'جهة الاتصال في حالات الطوارئ:' : 'Emergency Contact Name:'}
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    placeholder={isAr ? 'اسم قريب أو وصي' : 'Relative or guardian name'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                    {isAr ? 'هاتف الطوارئ:' : 'Emergency Contact Phone:'}
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    placeholder="+964 7..."
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                  {isAr ? 'الحساسية من الأدوية أو الأغذية المعروفة:' : 'Known Drug or Food Allergies:'}
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder={isAr ? 'مثال: البنسلين، الأسبرين...' : 'e.g. Penicillin, Aspirin...'}
                />
                <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                  {isAr
                    ? 'يتم عرض تنبيه الحساسية فوراً لجميع الأطباء في العيادات لمنع صرف أدوية قد تسبب تفاعلات سلبية.'
                    : 'Allergy warnings are immediately displayed to clinicians to prevent adverse drug reactions.'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving
                    ? isAr
                      ? 'جاري الحفظ...'
                      : 'Saving...'
                    : isAr
                    ? '✓ حفظ التعديلات'
                    : '✓ Save Changes'}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
}
