/**
 * Reschedule Appointment Modal
 * Allows selecting a new date and time for an existing appointment.
 * Validates against available doctor slots before submitting.
 */

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import appointmentService from '../../services/appointmentService';
import { CloseIcon, ClockIcon, CalendarIcon } from '../../components/icons';
import Alert from '../../components/common/Alert';

export default function RescheduleModal({ isOpen, appointment, onClose, onSuccess }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

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

  const timePresets = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
    '11:30', '12:00', '13:00', '14:00', '14:30', '15:00', '15:30', '16:00'
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!isOpen || !appointment) {
      setErrorMsg(null);
      setSubmitting(false);
      return;
    }

    const initialDate = appointment.appointment_date
      ? appointment.appointment_date.split('T')[0]
      : todayStr;
    const initialTime = appointment.start_time
      ? appointment.start_time.slice(0, 5)
      : '09:00';

    setNewDate(initialDate);
    setNewTime(initialTime);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, appointment, onClose, todayStr]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newDate || !newTime) {
      setErrorMsg(t.appointments?.validationRequired || 'Please specify both date and time.');
      return;
    }

    const formattedTime = newTime.length === 5 ? `${newTime}:00` : newTime;

    setSubmitting(true);
    try {
      await appointmentService.reschedule(appointment.id, {
        appointment_date: newDate,
        start_time: formattedTime,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
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
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(90vh, 600px)',
          height: 'auto',
          padding: 0,
          overflow: 'hidden',
          width: '500px',
        }}
      >
        {/* Fixed Header */}
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
                background: 'var(--warning-100)',
                color: 'var(--warning-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ClockIcon width={22} height={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>
                {t.appointments?.rescheduleTitle || 'Reschedule Appointment'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                {t.appointments?.rescheduleDesc || 'Select a new available date and time slot.'}
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

        {/* Scrollable Form Body */}
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
            {/* Current appointment info summary */}
            <div
              style={{
                background: 'var(--bg-surface-alt)',
                padding: '12px 14px',
                borderRadius: 'var(--r-md)',
                fontSize: 12.5,
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.appointments?.colCode || 'Code'}:</span>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--brand)' }}>
                  {appointment.appointment_code}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.appointments?.colPatient || 'Patient'}:</span>
                <span style={{ fontWeight: 600 }}>{appointment.patient_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.appointments?.colDoctor || 'Doctor'}:</span>
                <span style={{ fontWeight: 600 }}>{appointment.doctor_name}</span>
              </div>
            </div>

            {errorMsg && (
              <Alert variant="error" title={isAr ? 'تعذر إعادة الجدولة' : 'Reschedule Error'}>
                {errorMsg}
              </Alert>
            )}

            <div className="field">
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarIcon width={14} height={14} />
                {t.appointments?.appointmentDate || 'New Date'} <span style={{ color: 'var(--error-500)' }}>*</span>
              </label>
              <input
                type="date"
                className="input"
                min={todayStr}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                disabled={submitting}
                style={{ width: '100%', height: 40 }}
              />
            </div>

            <div className="field">
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ClockIcon width={14} height={14} />
                {t.appointments?.startTime || 'New Start Time'} <span style={{ color: 'var(--error-500)' }}>*</span>
              </label>
              <input
                type="time"
                className="input mono"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
                disabled={submitting}
                style={{ width: '100%', height: 40 }}
              />
            </div>

            {/* Quick presets */}
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {isAr ? 'فترات سريعة' : 'Preset slots'}:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {timePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewTime(preset)}
                    className={`filter-chip ${newTime === preset ? 'active' : ''}`}
                    style={{ padding: '3px 8px', fontSize: 11.5 }}
                  >
                    {preset}
                  </button>
                ))}
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
              disabled={submitting}
              style={{ minWidth: 150 }}
            >
              {submitting
                ? (isAr ? 'جارٍ الحفظ...' : 'Saving...')
                : (t.appointments?.confirmReschedule || 'Save Schedule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
