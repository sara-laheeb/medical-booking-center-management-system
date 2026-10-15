/**
 * Cancel Appointment Modal
 * Prompts the user for an optional cancellation reason before confirming
 * the appointment cancellation via the backend API.
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import appointmentService from '../../services/appointmentService';
import { CloseIcon, AlertCircleIcon } from '../../components/icons';
import Alert from '../../components/common/Alert';

export default function CancelModal({ isOpen, appointment, onClose, onSuccess }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!isOpen || !appointment) {
      setReason('');
      setErrorMsg(null);
      setSubmitting(false);
      return;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, appointment, onClose]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    setSubmitting(true);
    try {
      await appointmentService.cancel(appointment.id, reason);
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-box"
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
              width: 44,
              height: 44,
              borderRadius: 'var(--r-md)',
              background: 'var(--error-100)',
              color: 'var(--error-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertCircleIcon width={24} height={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
              {t.appointments?.cancelTitle || 'Cancel Appointment'}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {t.appointments?.cancelDesc || 'Are you sure you want to cancel this appointment?'}
            </p>
          </div>
        </div>

        {/* Appointment summary */}
        <div
          style={{
            background: 'var(--bg-surface-alt)',
            padding: '12px 14px',
            borderRadius: 'var(--r-md)',
            marginBottom: 16,
            fontSize: 12.5,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{t.appointments?.colCode || 'Code'}:</span>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--error-600)' }}>
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
          <div style={{ marginBottom: 16 }}>
            <Alert variant="error" title={isAr ? 'تعذر الإلغاء' : 'Cancellation Error'}>
              {errorMsg}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack" style={{ gap: 14 }}>
          <div className="field">
            <label className="field-label">
              {t.appointments?.cancelReasonLabel || 'Cancellation Reason (Optional)'}
            </label>
            <textarea
              className="input"
              rows={3}
              maxLength={500}
              placeholder={t.appointments?.cancelReasonPlaceholder || 'e.g., Patient requested cancellation...'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              {t.appointments?.close || 'Keep Appointment'}
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={submitting}
            >
              {submitting
                ? (isAr ? 'جارٍ الإلغاء...' : 'Cancelling...')
                : (t.appointments?.confirmCancel || 'Confirm Cancellation')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
