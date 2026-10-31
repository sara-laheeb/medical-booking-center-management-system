/**
 * Book New Appointment Modal
 * Multi-step form for creating a new appointment: select patient, select doctor,
 * pick date and time, set visit type, and enter chief complaint and notes.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import doctorService from '../../services/doctorService';
import patientService from '../../services/patientService';
import appointmentService from '../../services/appointmentService';
import { CloseIcon, CalendarIcon, ClockIcon, StethoscopeIcon, UsersIcon, PlusIcon } from '../../components/icons';
import Alert from '../../components/common/Alert';
import PatientModal from '../patients/PatientModal';

export default function BookAppointmentModal({ isOpen, onClose, onSuccess, initialDoctorId = null }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === 'ar';
  const isDoctor = user?.role === 'doctor';
  const currentDoctorId = isDoctor
    ? (user?.doctor?.doctor_id || user?.doctor_id || initialDoctorId)
    : initialDoctorId;

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Minimum date = today formatted YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Form states
  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState(currentDoctorId ? String(currentDoctorId) : '');
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const now = new Date();
    return now.getHours() >= 17 ? new Date(now.getTime() + 86400000).toISOString().split('T')[0] : now.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('09:00');
  const [visitType, setVisitType] = useState('new');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Quick time slot suggestions
  const timePresets = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
    '11:30', '12:00', '13:00', '14:00', '14:30', '15:00', '15:30', '16:00'
  ];

  useEffect(() => {
    if (!isOpen) {
      setErrorMsg(null);
      setSubmitting(false);
      setPatientSearch('');
      return;
    }

    const now = new Date();
    const isLate = now.getHours() >= 17;
    setAppointmentDate(isLate ? tomorrowStr : todayStr);

    let isMounted = true;
    async function fetchLookups() {
      setLoadingLookups(true);
      try {
        const [docsRes, ptsRes] = await Promise.all([
          doctorService.getAll({ is_active: 1, limit: 100 }),
          patientService.getAll({ limit: 100, status: 'active' }),
        ]);

        if (isMounted) {
          const docList = docsRes.data || [];
          const patList = ptsRes.data || [];
          setDoctors(docList);
          setPatients(patList);

          if (isDoctor && currentDoctorId) {
            setDoctorId(String(currentDoctorId));
          } else {
            setDoctorId((prev) => prev || (docList.length > 0 ? String(docList[0].id) : ''));
          }
          setPatientId((prev) => prev || (patList.length > 0 ? String(patList[0].id) : ''));
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err.message || 'Failed to load doctors or patients');
        }
      } finally {
        if (isMounted) setLoadingLookups(false);
      }
    }

    fetchLookups();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, todayStr, tomorrowStr, isDoctor, currentDoctorId]);

  // Filtered patients for dropdown search (preserves selected patient)
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase().trim();
    return patients.filter((p) => {
      const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
      const code = (p.patient_code || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return name.includes(q) || code.includes(q) || phone.includes(q) || String(p.id) === String(patientId);
    });
  }, [patients, patientSearch, patientId]);

  const overlayMouseDownRef = useRef(false);

  const handleOverlayMouseDown = (e) => {
    overlayMouseDownRef.current = (e.target === e.currentTarget);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && overlayMouseDownRef.current && !submitting) {
      onClose();
    }
    overlayMouseDownRef.current = false;
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!patientId || !doctorId || !appointmentDate || !startTime) {
      setErrorMsg(t.appointments?.validationRequired || 'Please complete all required fields.');
      return;
    }

    // Ensure format HH:MM:SS or HH:MM
    const formattedTime = startTime.length === 5 ? `${startTime}:00` : startTime;

    // Client-side past-time validation check
    const now = new Date();
    const requestedDateTime = new Date(`${appointmentDate}T${formattedTime}`);
    if (requestedDateTime <= now) {
      setErrorMsg(
        isAr
          ? 'لا يمكن حجز موعد في وقت ماضٍ. يرجى اختيار تاريخ أو توقيت قادم.'
          : 'Cannot book an appointment in the past. Please select an upcoming date and time slot.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await appointmentService.create({
        patient_id: Number(patientId),
        doctor_id: Number(doctorId),
        appointment_date: appointmentDate,
        start_time: formattedTime,
        visit_type: visitType,
        chief_complaint: chiefComplaint,
        notes: notes,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNewPatient = async (patientData) => {
    const res = await patientService.create(patientData);
    const newPat = res.data;
    if (newPat) {
      setPatients((prev) => [newPat, ...prev]);
      setPatientId(String(newPat.id));
      setPatientSearch('');
    }
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-box modal-box-lg"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(90vh, 720px)',
          height: 'auto',
          padding: 0,
          overflow: 'hidden',
          width: '640px',
        }}
      >
        {/* Header - Fixed */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--r-md)',
                background: 'var(--brand-soft)',
                color: 'var(--brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CalendarIcon width={20} height={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>
                {t.appointments?.bookAppointment || 'Book Appointment'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                {isAr
                  ? 'إنشاء تذكرة حجز جديدة وربطها بملف المريض والجدول السريري للطبيب'
                  : 'Schedule a new clinical consultation slot for a registered patient'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={t.appointments?.close || 'Close'}
            style={{ width: 32, height: 32, color: 'var(--text-secondary)' }}
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div
            className="modal-body-scroll"
            tabIndex={0}
            style={{
              padding: '18px 20px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              outline: 'none',
            }}
          >
            {errorMsg && (
              <Alert variant="error" title={isAr ? 'خطأ في الحجز' : 'Booking Error'}>
                {errorMsg}
              </Alert>
            )}

            {/* Patient Selector */}
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  <UsersIcon width={14} height={14} />
                  {t.appointments?.selectPatient || 'Select Patient'} <span style={{ color: 'var(--error-500)' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {patients.length > 5 && (
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      {filteredPatients.length} / {patients.length} {isAr ? 'مريض' : 'patients'}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsPatientModalOpen(true)}
                    style={{
                      fontSize: 11.5,
                      padding: '2px 8px',
                      height: 26,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: 'var(--brand)',
                      borderColor: 'var(--brand-soft)',
                    }}
                    title={isAr ? 'تسجيل مريض جديد' : 'Register new patient'}
                  >
                    <PlusIcon width={12} height={12} />
                    {isAr ? 'مريض جديد' : 'New Patient'}
                  </button>
                </div>
              </div>

              {patients.length > 5 && (
                <input
                  type="text"
                  className="input"
                  placeholder={isAr ? 'ابحث بالاسم، الهاتف، أو رمز المريض...' : 'Search patient by name, phone, or code...'}
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  style={{ height: 34, fontSize: 12, marginBottom: 8 }}
                />
              )}

              <select
                className="input select"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={loadingLookups || submitting}
                required
                style={{ width: '100%', height: 40 }}
              >
                <option value="">{isAr ? '-- اختر مريضاً من السجل السريري --' : '-- Choose a patient file --'}</option>
                {filteredPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} {p.patient_code ? `(${p.patient_code})` : ''} {p.phone ? `· ${p.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Selector */}
            <div className="field">
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StethoscopeIcon width={14} height={14} />
                {t.appointments?.selectDoctor || 'Select Doctor'} <span style={{ color: 'var(--error-500)' }}>*</span>
              </label>
              <select
                className="input select"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                disabled={loadingLookups || submitting || isDoctor}
                required
                style={{ width: '100%', height: 40 }}
              >
                {isDoctor ? (
                  <option value={String(currentDoctorId)}>
                    {user?.full_name || user?.name || (isAr ? 'طبيب الجلسة الحالي' : 'Current Clinician')} {user?.doctor?.specialty_name_ar ? `(${user.doctor.specialty_name_ar})` : ''}
                  </option>
                ) : (
                  <>
                    <option value="">{isAr ? '-- اختر الطبيب المعالج --' : '-- Choose attending clinician --'}</option>
                    {doctors.map((d) => {
                      const spec = isAr
                        ? (d.specialty_name_ar || d.specialty_name_en || '')
                        : (d.specialty_name_en || d.specialty_name_ar || '');
                      const fee = d.consultation_fee && Number(d.consultation_fee) > 0
                        ? ` · ${Number(d.consultation_fee).toLocaleString()} ${isAr ? 'د.ع' : 'IQD'}`
                        : '';
                      return (
                        <option key={d.id} value={d.id}>
                          {d.full_name} {spec ? `(${spec})` : ''}{fee}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
            </div>

            {/* Date & Time Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label className="field-label">
                  {t.appointments?.appointmentDate || 'Appointment Date'} <span style={{ color: 'var(--error-500)' }}>*</span>
                </label>
                <input
                  type="date"
                  className="input"
                  min={todayStr}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                  disabled={submitting}
                  style={{ width: '100%', height: 40 }}
                />
              </div>

              <div className="field">
                <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ClockIcon width={14} height={14} />
                  {t.appointments?.startTime || 'Start Time'} <span style={{ color: 'var(--error-500)' }}>*</span>
                </label>
                <input
                  type="time"
                  className="input mono"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  disabled={submitting}
                  style={{ width: '100%', height: 40 }}
                />
              </div>
            </div>

            {/* Quick slot chips */}
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {isAr ? 'فترات الحجز الشائعة' : 'Common slot presets'}:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {timePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStartTime(preset)}
                    className={`filter-chip ${startTime === preset ? 'active' : ''}`}
                    style={{ padding: '3px 8px', fontSize: 11.5 }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Visit Type */}
            <div className="field">
              <label className="field-label">{t.appointments?.visitType || 'Visit Type'}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'new', label: t.appointments?.typeNew || 'New' },
                  { id: 'follow_up', label: t.appointments?.typeFollowUp || 'Follow-up' },
                  { id: 'emergency', label: t.appointments?.typeEmergency || 'Emergency' },
                ].map((item) => (
                  <label
                    key={item.id}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 'var(--r-md)',
                      border: `1.5px solid ${visitType === item.id ? 'var(--brand)' : 'var(--border-subtle)'}`,
                      background: visitType === item.id ? 'var(--brand-soft)' : 'var(--bg-surface-alt)',
                      color: visitType === item.id ? 'var(--brand)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="visitType"
                      value={item.id}
                      checked={visitType === item.id}
                      onChange={() => setVisitType(item.id)}
                      style={{ display: 'none' }}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Chief Complaint & Notes in compact 2-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label className="field-label">
                  {t.appointments?.chiefComplaint || 'Chief Complaint'}
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  className="input"
                  placeholder={t.appointments?.chiefComplaintPlaceholder || 'Primary medical concern...'}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  disabled={submitting}
                  style={{ resize: 'vertical', fontSize: 12.5 }}
                />
              </div>

              <div className="field">
                <label className="field-label">{t.appointments?.notes || 'Internal Clinical Notes'}</label>
                <textarea
                  className="input"
                  rows={2}
                  maxLength={1000}
                  placeholder={t.appointments?.notesPlaceholder || 'Optional notes...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={submitting}
                  style={{ resize: 'vertical', fontSize: 12.5 }}
                />
              </div>
            </div>
          </div>

          {/* Fixed Footer Actions - ALWAYS VISIBLE */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface-alt)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              {t.appointments?.close || 'Cancel'}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || loadingLookups}
              style={{ minWidth: 150 }}
            >
              {submitting
                ? (isAr ? 'جارٍ الحجز...' : 'Booking...')
                : (t.appointments?.saveAppointment || 'Confirm & Book')}
            </button>
          </div>
        </form>
      </div>

      {/* Inline New Patient Registration Modal */}
      {isPatientModalOpen && (
        <PatientModal
          isOpen={isPatientModalOpen}
          onClose={() => setIsPatientModalOpen(false)}
          onSave={handleSaveNewPatient}
        />
      )}
    </div>
  );
}
