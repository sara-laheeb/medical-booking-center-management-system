import { useLanguage } from '../../i18n/LanguageContext';
import Button from '../../components/Button';
import Badge from '../../components/common/Badge';
import { CloseIcon, UsersIcon, CalendarIcon } from '../../components/icons';
import { useNavigate } from 'react-router-dom';

export default function PatientDetailsModal({ isOpen, onClose, patient }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  if (!isOpen || !patient) return null;

  const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.full_name || 'Patient';
  const initials = (patient.first_name?.[0] || 'P') + (patient.last_name?.[0] || '');

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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '640px',
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
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, var(--bg-surface) 60%, var(--brand-soft))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--r-full)',
                backgroundColor: 'var(--brand)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {initials.toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  {fullName}
                </h2>
                <Badge variant={patient.status === 'active' ? 'confirmed' : 'neutral'}>
                  {patient.status === 'active' ? (isAr ? 'ملف نشط' : 'Active File') : (isAr ? 'غير نشط' : 'Inactive')}
                </Badge>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {t.patients?.colCode || 'Code'}: <strong style={{ color: 'var(--ink)' }}>{patient.patient_code}</strong>
                {patient.national_id ? ` · ${t.patients?.nationalId || 'ID'}: ${patient.national_id}` : ''}
              </p>
            </div>
          </div>

          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        {/* Content Details */}
        <div
          className="nav-scroll"
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            <div className="card pad" style={{ padding: '12px 16px', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                {t.patients?.gender || 'Gender'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {patient.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}
              </div>
            </div>

            <div className="card pad" style={{ padding: '12px 16px', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                {t.patients?.bloodType || 'Blood Type'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--brand)', marginTop: 4 }}>
                {patient.blood_type || (isAr ? 'غير محدد' : 'Unknown')}
              </div>
            </div>

            <div className="card pad" style={{ padding: '12px 16px', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                {t.patients?.dob || 'Date of Birth'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                {patient.date_of_birth ? patient.date_of_birth.substring(0, 10) : '—'}
              </div>
            </div>

            <div className="card pad" style={{ padding: '12px 16px', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                {t.patients?.phone || 'Phone'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginTop: 4 }}>
                {patient.phone || '—'}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="card pad" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--brand)', marginBottom: 8 }}>
              {isAr ? 'معلومات الاتصال والسكن' : 'Contact & Address'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13.5px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{t.patients?.email || 'Email'}: </span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{patient.email || '—'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{t.patients?.address || 'Address'}: </span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{patient.address || '—'}</span>
              </div>
            </div>
          </div>

          {/* Medical Alerts & Chronic Conditions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div
              className="card pad"
              style={{
                padding: '16px',
                borderLeft: isAr ? 'none' : '3px solid var(--accent-amber)',
                borderRight: isAr ? '3px solid var(--accent-amber)' : 'none',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 6 }}>
                {t.patients?.chronicConditions || 'Chronic Conditions'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink)', lineHeight: 1.5 }}>
                {patient.chronic_conditions || (isAr ? 'لا توجد أمراض مزمنة مسجلة' : 'No chronic conditions recorded.')}
              </p>
            </div>

            <div
              className="card pad"
              style={{
                padding: '16px',
                borderLeft: isAr ? 'none' : '3px solid var(--accent-red)',
                borderRight: isAr ? '3px solid var(--accent-red)' : 'none',
              }}
            >
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-red)', marginBottom: 6 }}>
                {t.patients?.allergies || 'Known Allergies'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink)', lineHeight: 1.5 }}>
                {patient.allergies || (isAr ? 'لا توجد تحسسات دوائية مسجلة' : 'No known drug allergies.')}
              </p>
            </div>
          </div>

          {/* Emergency Contact */}
          {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
            <div className="card pad" style={{ padding: '16px', background: 'var(--bg-subtle)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                {t.patients?.emergencyName || 'Emergency Contact'}
              </h4>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--ink)' }}>{patient.emergency_contact_name || 'Relative'}</strong>
                {patient.emergency_contact_phone ? ` · 📞 ${patient.emergency_contact_phone}` : ''}
              </p>
            </div>
          )}

          {/* Notes */}
          {patient.notes && (
            <div className="card pad" style={{ padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {t.patients?.notes || 'Clinical Notes'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink)', fontStyle: 'italic' }}>
                "{patient.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-subtle)',
          }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              navigate('/app/appointments');
            }}
          >
            <CalendarIcon width={16} height={16} />
            <span>{t.patients?.bookForPatient || 'Book Appointment'}</span>
          </Button>

          <Button variant="primary" size="sm" onClick={onClose}>
            {t.appointments?.close || 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
}
