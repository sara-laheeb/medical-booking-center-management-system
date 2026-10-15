/**
 * Book New Appointment Modal
 * Multi-step form for creating a new appointment: select patient, select doctor,
 * pick date and time, set visit type, and enter chief complaint and notes.
 */

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import doctorService from '../../services/doctorService';
import patientService from '../../services/patientService';
import appointmentService from '../../services/appointmentService';
import { CloseIcon, CalendarIcon, ClockIcon, StethoscopeIcon, UsersIcon } from '../../components/icons';
import Alert from '../../components/common/Alert';

export default function BookAppointmentModal({ isOpen, onClose, onSuccess, initialDoctorId = null }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

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
  const [doctorId, setDoctorId] = useState(initialDoctorId ? String(initialDoctorId) : '');
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

          setDoctorId((prev) => prev || (docList.length > 0 ? String(docList[0].id) : ''));
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
  }, [isOpen, onClose, todayStr, tomorrowStr]);

  // Filtered patients for dropdown search
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase().trim();
    return patients.filter((p) => {
      const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
      const code = (p.patient_code || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return name.includes(q) || code.includes(q) || phone.includes(q);
    });
  }, [patients, patientSearch]);

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

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-box modal-box-lg"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 'var(--sp-6)' }}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label={t.appointments?.close || 'Close'}
        >
          <CloseIcon />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--r-md)',
              background: 'var(--brand-soft)',
              color: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CalendarIcon width={22} height={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
              {t.appointments?.bookAppointment || 'Book Appointment'}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {isAr
                ? 'إنشاء تذكرة حجز جديدة وربطها بملف المريض والجدول السريري للطبيب'
                : 'Schedule a new clinical consultation slot for a registered patient'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div style={{ marginBottom: 16 }}>
            <Alert variant="error" title={isAr ? 'خطأ في الحجز' : 'Booking Error'}>
              {errorMsg}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack" style={{ gap: 16 }}>
          {/* Patient Selector */}
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <UsersIcon width={14} height={14} />
                {t.appointments?.selectPatient || 'Select Patient'} <span style={{ color: 'var(--error-500)' }}>*</span>
              </label>
              {patients.length > 5 && (
                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  {filteredPatients.length} / {patients.length} {isAr ? 'مريض' : 'patients'}
                </span>
              )}
            </div>

            {patients.length > 5 && (
              <input
                type="text"
                className="input"
                placeholder={isAr ? 'ابحث بالاسم، الهاتف، أو رمز المريض...' : 'Search patient by name, phone, or code...'}
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                style={{ height: 34, fontSize: 12, marginBottom: 8 }}
              />
            )}

            <select
              className="input select"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              disabled={loadingLookups || submitting}
              required
              style={{ width: '100%', height: 42 }}
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
              disabled={loadingLookups || submitting}
              required
              style={{ width: '100%', height: 42 }}
            >
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
            </select>
          </div>

          {/* Date & Time Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                style={{ width: '100%', height: 42 }}
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
                style={{ width: '100%', height: 42 }}
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
                  style={{ padding: '4px 10px', fontSize: 11.5 }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Visit Type */}
          <div className="field">
            <label className="field-label">{t.appointments?.visitType || 'Visit Type'}</label>
            <div style={{ display: 'flex', gap: 10 }}>
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
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--r-md)',
                    border: `1.5px solid ${visitType === item.id ? 'var(--brand)' : 'var(--border-subtle)'}`,
                    background: visitType === item.id ? 'var(--brand-soft)' : 'var(--bg-surface-alt)',
                    color: visitType === item.id ? 'var(--brand)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: 12.5,
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

          {/* Chief Complaint */}
          <div className="field">
            <label className="field-label">
              {t.appointments?.chiefComplaint || 'Chief Complaint'}
            </label>
            <input
              type="text"
              maxLength={500}
              className="input"
              placeholder={t.appointments?.chiefComplaintPlaceholder || 'Primary medical concern...'}
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              disabled={submitting}
            />
          </div>

          {/* Internal Notes */}
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
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div className="modal-actions" style={{ marginTop: 8 }}>
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
    </div>
  );
}
