import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import Button from '../../components/Button';
import Alert from '../../components/common/Alert';
import { CloseIcon } from '../../components/icons';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientModal({ isOpen, onClose, patient, onSave }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const isEdit = Boolean(patient?.id);

  const overlayMouseDownRef = useRef(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: 'male',
    national_id: '',
    blood_type: '',
    address: '',
    chronic_conditions: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
    status: 'active',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patient) {
      setFormData({
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        phone: patient.phone || '',
        email: patient.email || '',
        date_of_birth: patient.date_of_birth ? patient.date_of_birth.substring(0, 10) : '',
        gender: patient.gender || 'male',
        national_id: patient.national_id || '',
        blood_type: patient.blood_type || '',
        address: patient.address || '',
        chronic_conditions: patient.chronic_conditions || '',
        allergies: patient.allergies || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
        notes: patient.notes || '',
        status: patient.status || 'active',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        date_of_birth: '',
        gender: 'male',
        national_id: '',
        blood_type: '',
        address: '',
        chronic_conditions: '',
        allergies: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        notes: '',
        status: 'active',
      });
    }
    setError(null);
  }, [patient, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError(isAr ? 'يرجى إدخال الاسم الأول واسم العائلة' : 'First and last name are required');
      return;
    }
    if (!formData.phone.trim()) {
      setError(isAr ? 'يرجى إدخال رقم الهاتف' : 'Phone number is required');
      return;
    }

    setSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || (isAr ? 'حدث خطأ أثناء حفظ بيانات المريض' : 'Failed to save patient profile'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverlayMouseDown = (e) => {
    overlayMouseDownRef.current = (e.target === e.currentTarget);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && overlayMouseDownRef.current && !submitting) {
      onClose();
    }
    overlayMouseDownRef.current = false;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: 'min(90vh, 720px)',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-subtle)',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              {isEdit ? t.patients?.editPatient || 'Edit Patient Profile' : t.patients?.addPatient || 'Register New Patient'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              {isAr ? 'أدخل البيانات الأساسية والمعلومات الطبية للمريض' : 'Enter personal, medical, and emergency contact details'}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            style={{ width: 32, height: 32 }}
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        {/* Form Body with custom scrollbar */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div
            className="modal-body-scroll"
            tabIndex={0}
            style={{
              padding: '18px 22px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              outline: 'none',
            }}
          >
            {error && <Alert variant="error">{error}</Alert>}

            {/* Section 1: Personal Info */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand)', marginBottom: 12 }}>
                {isAr ? '١. المعلومات الشخصية' : '1. Personal Information'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label required">{t.patients?.firstName || 'First Name'}</label>
                  <input
                    type="text"
                    name="first_name"
                    className="input"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder={isAr ? 'مثال: محمد' : 'e.g. John'}
                    required
                  />
                </div>
                <div>
                  <label className="form-label required">{t.patients?.lastName || 'Last Name'}</label>
                  <input
                    type="text"
                    name="last_name"
                    className="input"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder={isAr ? 'مثال: علي' : 'e.g. Doe'}
                    required
                  />
                </div>

                <div>
                  <label className="form-label required">{t.patients?.phone || 'Phone Number'}</label>
                  <input
                    type="tel"
                    name="phone"
                    className="input"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+964 770 123 4567"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">{t.patients?.email || 'Email Address'}</label>
                  <input
                    type="email"
                    name="email"
                    className="input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="patient@example.com"
                  />
                </div>

                <div>
                  <label className="form-label">{t.patients?.nationalId || 'National ID / Passport'}</label>
                  <input
                    type="text"
                    name="national_id"
                    className="input"
                    value={formData.national_id}
                    onChange={handleChange}
                    placeholder="1990123456"
                  />
                </div>
                <div>
                  <label className="form-label">{t.patients?.dob || 'Date of Birth'}</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    className="input"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="form-label">{t.patients?.gender || 'Gender'}</label>
                  <select
                    name="gender"
                    className="input"
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="male">{t.patients?.male || 'Male'}</option>
                    <option value="female">{t.patients?.female || 'Female'}</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{t.patients?.bloodType || 'Blood Type'}</label>
                  <select
                    name="blood_type"
                    className="input"
                    value={formData.blood_type}
                    onChange={handleChange}
                  >
                    <option value="">{isAr ? 'غير محدد' : 'Unknown / Not tested'}</option>
                    {BLOOD_TYPES.map((bt) => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label className="form-label">{t.patients?.address || 'Home Address'}</label>
                <input
                  type="text"
                  name="address"
                  className="input"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={isAr ? 'المدينة، الحي، رقم الشارع' : 'City, District, Street address'}
                />
              </div>
            </div>

            {/* Section 2: Clinical Profile */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand)', marginBottom: 12 }}>
                {isAr ? '٢. السجل السريري والأمراض' : '2. Medical & Clinical Background'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">{t.patients?.chronicConditions || 'Chronic Conditions'}</label>
                  <textarea
                    name="chronic_conditions"
                    className="input"
                    rows={2}
                    value={formData.chronic_conditions}
                    onChange={handleChange}
                    placeholder={isAr ? 'مثال: السكري، ضغط الدم، الربو...' : 'e.g. Hypertension, Diabetes Type 2...'}
                  />
                </div>
                <div>
                  <label className="form-label">{t.patients?.allergies || 'Known Allergies'}</label>
                  <textarea
                    name="allergies"
                    className="input"
                    rows={2}
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder={isAr ? 'مثال: حساسية البنسلين، الأسبرين...' : 'e.g. Penicillin, Sulfa drugs, Peanuts...'}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Emergency Contacts */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--brand)', marginBottom: 12 }}>
                {isAr ? '٣. جهة اتصال الطوارئ' : '3. Emergency Contact'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">{t.patients?.emergencyName || 'Emergency Contact Name'}</label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    className="input"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    placeholder={isAr ? 'اسم القريب أو المرافق' : 'Contact person name'}
                  />
                </div>
                <div>
                  <label className="form-label">{t.patients?.emergencyPhone || 'Emergency Contact Phone'}</label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    className="input"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="+964 770 000 0000"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Notes & Status */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '14px' }}>
                <div>
                  <label className="form-label">{t.patients?.notes || 'Clinical / Administrative Notes'}</label>
                  <input
                    type="text"
                    name="notes"
                    className="input"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder={isAr ? 'ملاحظات إضافية عن المريض...' : 'Optional internal clinical notes...'}
                  />
                </div>
                <div>
                  <label className="form-label">{t.patients?.colStatus || 'Status'}</label>
                  <select
                    name="status"
                    className="input"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">{t.patients?.filterActive || 'Active'}</option>
                    <option value="inactive">{t.patients?.filterInactive || 'Inactive'}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              background: 'var(--bg-subtle)',
              flexShrink: 0,
            }}
          >
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
              {t.appointments?.close || 'Cancel'}
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? '...' : t.patients?.savePatient || 'Save Patient'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
