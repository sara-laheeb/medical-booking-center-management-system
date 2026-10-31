import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import specialtyService from '../../services/specialtyService';
import Button from '../../components/Button';
import Alert from '../../components/common/Alert';
import { CloseIcon } from '../../components/icons';

const ALL_DAYS = [
  { id: 'sat', en: 'Saturday', ar: 'السبت' },
  { id: 'sun', en: 'Sunday', ar: 'الأحد' },
  { id: 'mon', en: 'Monday', ar: 'الاثنين' },
  { id: 'tue', en: 'Tuesday', ar: 'الثلاثاء' },
  { id: 'wed', en: 'Wednesday', ar: 'الأربعاء' },
  { id: 'thu', en: 'Thursday', ar: 'الخميس' },
  { id: 'fri', en: 'Friday', ar: 'الجمعة' },
];

export default function DoctorModal({ isOpen, onClose, doctor, onSave }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const isEdit = Boolean(doctor?.id);

  const [specialties, setSpecialties] = useState([]);
  const [formData, setFormData] = useState({
    user_id: '',
    specialty_id: '',
    license_number: '',
    consultation_fee: '25000',
    work_days: ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'],
    work_start: '09:00:00',
    work_end: '17:00:00',
    appointment_duration: 30,
    bio: '',
    is_active: 1,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    specialtyService.getAll().then((res) => {
      setSpecialties(res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (doctor) {
      const days = Array.isArray(doctor.work_days)
        ? doctor.work_days
        : typeof doctor.work_days === 'string'
        ? doctor.work_days.split(',')
        : ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'];

      setFormData({
        user_id: doctor.user_id || '',
        specialty_id: doctor.specialty_id || '',
        license_number: doctor.license_number || '',
        consultation_fee: doctor.consultation_fee || '25000',
        work_days: days,
        work_start: doctor.work_start || '09:00:00',
        work_end: doctor.work_end || '17:00:00',
        appointment_duration: doctor.appointment_duration || 30,
        bio: doctor.bio || '',
        is_active: doctor.is_active !== undefined ? doctor.is_active : 1,
      });
    } else {
      setFormData({
        user_id: '',
        specialty_id: '',
        license_number: '',
        consultation_fee: '25000',
        work_days: ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'],
        work_start: '09:00:00',
        work_end: '17:00:00',
        appointment_duration: 30,
        bio: '',
        is_active: 1,
      });
    }
    setError(null);
  }, [doctor, isOpen]);

  if (!isOpen) return null;

  const handleDayToggle = (dayId) => {
    setFormData((prev) => {
      const exists = prev.work_days.includes(dayId);
      const updated = exists ? prev.work_days.filter((d) => d !== dayId) : [...prev.work_days, dayId];
      return { ...prev, work_days: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.specialty_id) {
      setError(isAr ? 'يرجى اختيار التخصص الطبي' : 'Please select a medical specialty');
      return;
    }
    if (!formData.license_number.trim()) {
      setError(isAr ? 'يرجى إدخال رقم الترخيص الطبي' : 'License number is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        consultation_fee: Number(formData.consultation_fee),
        appointment_duration: Number(formData.appointment_duration),
        work_days: Array.isArray(formData.work_days) ? formData.work_days.join(',') : formData.work_days,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || (isAr ? 'فشل حفظ بيانات الطبيب' : 'Failed to save doctor details'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              {isEdit ? t.doctors?.editDoctor || 'Edit Doctor Profile' : t.doctors?.addDoctor || 'Add Doctor Profile'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isAr ? 'تحديد التخصص، أجر الكشف، ومواعيد المناوبة الأسبوعية' : 'Configure specialty, consultation fee, and on-duty schedule'}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={submitting}>
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div
            className="nav-scroll"
            style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {error && <Alert variant="error">{error}</Alert>}

            {!isEdit && (
              <div>
                <label className="form-label required">{t.doctors?.selectUser || 'User Account ID'}</label>
                <input
                  type="number"
                  className="input"
                  value={formData.user_id}
                  onChange={(e) => setFormData((p) => ({ ...p, user_id: e.target.value }))}
                  placeholder={isAr ? 'أدخل معرف المستخدم (User ID)' : 'Enter staff user ID'}
                  required
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="form-label required">{t.doctors?.selectSpecialty || 'Medical Specialty'}</label>
                <select
                  className="input"
                  value={formData.specialty_id}
                  onChange={(e) => setFormData((p) => ({ ...p, specialty_id: e.target.value }))}
                  required
                >
                  <option value="">{isAr ? '-- اختر التخصص --' : '-- Select Specialty --'}</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {isAr ? s.name_ar || s.name : s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label required">{t.doctors?.licenseNumber || 'License Number'}</label>
                <input
                  type="text"
                  className="input"
                  value={formData.license_number}
                  onChange={(e) => setFormData((p) => ({ ...p, license_number: e.target.value }))}
                  placeholder="DOC-12345"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="form-label required">{t.doctors?.consultationFee || 'Consultation Fee (IQD)'}</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  step="500"
                  value={formData.consultation_fee}
                  onChange={(e) => setFormData((p) => ({ ...p, consultation_fee: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="form-label required">{t.doctors?.appointmentDuration || 'Duration (Minutes)'}</label>
                <input
                  type="number"
                  className="input"
                  min="10"
                  max="120"
                  step="5"
                  value={formData.appointment_duration}
                  onChange={(e) => setFormData((p) => ({ ...p, appointment_duration: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Working Days Checkboxes */}
            <div>
              <label className="form-label">{t.doctors?.workDays || 'Working Days'}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {ALL_DAYS.map((day) => {
                  const isChecked = formData.work_days.includes(day.id);
                  return (
                    <button
                      type="button"
                      key={day.id}
                      onClick={() => handleDayToggle(day.id)}
                      className={`btn btn-sm ${isChecked ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: 12, padding: '4px 10px' }}
                    >
                      {isAr ? day.ar : day.en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shift Hours */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="form-label">{t.doctors?.workStart || 'Shift Start'}</label>
                <input
                  type="time"
                  className="input"
                  value={formData.work_start}
                  onChange={(e) => setFormData((p) => ({ ...p, work_start: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="form-label">{t.doctors?.workEnd || 'Shift End'}</label>
                <input
                  type="time"
                  className="input"
                  value={formData.work_end}
                  onChange={(e) => setFormData((p) => ({ ...p, work_end: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">{t.doctors?.bio || 'Professional Biography'}</label>
              <textarea
                className="input"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))}
                placeholder={isAr ? 'خبرات الطبيب والمؤهلات الأكاديمية...' : 'Physician qualifications, certifications, credentials...'}
              />
            </div>
          </div>

          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              background: 'var(--bg-subtle)',
            }}
          >
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
              {t.appointments?.close || 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? '...' : t.doctors?.saveDoctor || 'Save Doctor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
