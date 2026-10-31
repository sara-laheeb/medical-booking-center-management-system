import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import patientService from '../../services/patientService';
import doctorService from '../../services/doctorService';
import Button from '../../components/Button';
import Alert from '../../components/common/Alert';
import { CloseIcon } from '../../components/icons';

export default function RecordModal({ isOpen, onClose, record, onSave }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const isEdit = Boolean(record?.id);

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [formData, setFormData] = useState({
    appointment_id: '',
    patient_id: '',
    doctor_id: '',
    visit_date: new Date().toISOString().substring(0, 10),
    diagnosis: '',
    treatment_plan: '',
    bp: '120/80',
    pulse: '72',
    temp: '37.0',
    weight: '70',
    height: '175',
    follow_up_date: '',
    follow_up_notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      patientService.getAll({ limit: 100 }),
      doctorService.getAll({ limit: 100 }),
    ]).then(([pRes, dRes]) => {
      setPatients(pRes.data || []);
      setDoctors(dRes.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (record) {
      const vitals = typeof record.vital_signs === 'object' && record.vital_signs !== null
        ? record.vital_signs
        : {};

      setFormData({
        appointment_id: record.appointment_id || '',
        patient_id: record.patient_id || '',
        doctor_id: record.doctor_id || '',
        visit_date: record.visit_date ? record.visit_date.substring(0, 10) : new Date().toISOString().substring(0, 10),
        diagnosis: record.diagnosis || '',
        treatment_plan: record.treatment_plan || '',
        bp: vitals.bp || '120/80',
        pulse: vitals.pulse || '72',
        temp: vitals.temp || '37.0',
        weight: vitals.weight || '70',
        height: vitals.height || '175',
        follow_up_date: record.follow_up_date ? record.follow_up_date.substring(0, 10) : '',
        follow_up_notes: record.follow_up_notes || '',
      });
    } else {
      setFormData({
        appointment_id: '',
        patient_id: '',
        doctor_id: '',
        visit_date: new Date().toISOString().substring(0, 10),
        diagnosis: '',
        treatment_plan: '',
        bp: '120/80',
        pulse: '72',
        temp: '37.0',
        weight: '70',
        height: '175',
        follow_up_date: '',
        follow_up_notes: '',
      });
    }
    setError(null);
  }, [record, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isEdit && (!formData.patient_id || !formData.doctor_id)) {
      setError(isAr ? 'يرجى اختيار المريض والطبيب المعالج' : 'Please select patient and consulting doctor');
      return;
    }
    if (!formData.diagnosis.trim()) {
      setError(isAr ? 'يرجى إدخال التشخيص الطبي' : 'Clinical diagnosis is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        appointment_id: Number(formData.appointment_id) || 1,
        patient_id: Number(formData.patient_id),
        doctor_id: Number(formData.doctor_id),
        visit_date: formData.visit_date,
        diagnosis: formData.diagnosis,
        treatment_plan: formData.treatment_plan,
        vital_signs: {
          bp: formData.bp,
          pulse: Number(formData.pulse) || 72,
          temp: String(formData.temp),
          weight: Number(formData.weight) || 70,
          height: Number(formData.height) || 175,
        },
        follow_up_date: formData.follow_up_date || null,
        follow_up_notes: formData.follow_up_notes || null,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || (isAr ? 'فشل حفظ السجل الطبي' : 'Failed to save medical record'));
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
          maxWidth: '680px',
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
              {isEdit ? t.records?.editRecord || 'Edit Medical Record' : t.records?.newRecord || 'New Medical Record'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isAr ? 'توثيق نتائج الاستشارة، العلامات الحيوية، وخطة العلاج' : 'Document clinical diagnosis, vital signs, and treatment plan'}
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

            {/* Encounter Identifiers */}
            {!isEdit && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label required">{t.records?.selectPatient || 'Patient'}</label>
                  <select
                    className="input"
                    value={formData.patient_id}
                    onChange={(e) => setFormData((p) => ({ ...p, patient_id: e.target.value }))}
                    required
                  >
                    <option value="">{isAr ? '-- اختر المريض --' : '-- Select Patient --'}</option>
                    {patients.map((pt) => {
                      const name = `${pt.first_name || ''} ${pt.last_name || ''}`.trim() || pt.full_name || pt.patient_code;
                      return (
                        <option key={pt.id} value={pt.id}>
                          {name} ({pt.patient_code})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="form-label required">{t.records?.selectDoctor || 'Consulting Doctor'}</label>
                  <select
                    className="input"
                    value={formData.doctor_id}
                    onChange={(e) => setFormData((p) => ({ ...p, doctor_id: e.target.value }))}
                    required
                  >
                    <option value="">{isAr ? '-- اختر الطبيب --' : '-- Select Doctor --'}</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({isAr ? doc.specialty_name_ar || doc.specialty_name : doc.specialty_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="form-label required">{t.records?.visitDate || 'Visit Date'}</label>
                <input
                  type="date"
                  className="input"
                  value={formData.visit_date}
                  onChange={(e) => setFormData((p) => ({ ...p, visit_date: e.target.value }))}
                  required
                />
              </div>

              {!isEdit && (
                <div>
                  <label className="form-label">{t.records?.selectAppointment || 'Appointment ID (Optional)'}</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.appointment_id}
                    onChange={(e) => setFormData((p) => ({ ...p, appointment_id: e.target.value }))}
                    placeholder="e.g. 1"
                  />
                </div>
              )}
            </div>

            {/* Vital Signs Row */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--brand)', marginBottom: 10 }}>
                {t.records?.vitalSigns || 'Vital Signs'}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>BP (mmHg)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.bp}
                    onChange={(e) => setFormData((p) => ({ ...p, bp: e.target.value }))}
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Pulse (BPM)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.pulse}
                    onChange={(e) => setFormData((p) => ({ ...p, pulse: e.target.value }))}
                    placeholder="72"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Temp (°C)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.temp}
                    onChange={(e) => setFormData((p) => ({ ...p, temp: e.target.value }))}
                    placeholder="37.0"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Weight (kg)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.weight}
                    onChange={(e) => setFormData((p) => ({ ...p, weight: e.target.value }))}
                    placeholder="70"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Height (cm)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.height}
                    onChange={(e) => setFormData((p) => ({ ...p, height: e.target.value }))}
                    placeholder="175"
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis & Treatment Plan */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label required">{t.records?.diagnosis || 'Clinical Diagnosis'}</label>
                <textarea
                  className="input"
                  rows={2}
                  value={formData.diagnosis}
                  onChange={(e) => setFormData((p) => ({ ...p, diagnosis: e.target.value }))}
                  placeholder={isAr ? 'صف الحالة المرضية والتشخيص السريري...' : 'Primary diagnosis and examination findings...'}
                  required
                />
              </div>

              <div>
                <label className="form-label">{t.records?.treatmentPlan || 'Treatment Plan & Recommendations'}</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.treatment_plan}
                  onChange={(e) => setFormData((p) => ({ ...p, treatment_plan: e.target.value }))}
                  placeholder={isAr ? 'الخطة العلاجية، الأدوية، الإرشادات للمريض...' : 'Therapeutic plan, prescribed medications, follow-up advice...'}
                />
              </div>
            </div>

            {/* Follow-up */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">{t.records?.followUpDate || 'Follow-up Date'}</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData((p) => ({ ...p, follow_up_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">{t.records?.followUpNotes || 'Follow-up Instructions'}</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.follow_up_notes}
                    onChange={(e) => setFormData((p) => ({ ...p, follow_up_notes: e.target.value }))}
                    placeholder={isAr ? 'إجراء تحاليل، مراجعة دورية...' : 'e.g. Repeat lab blood test'}
                  />
                </div>
              </div>
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
              {submitting ? '...' : t.records?.saveRecord || 'Save Medical Record'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
