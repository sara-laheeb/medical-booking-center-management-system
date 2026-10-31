/**
 * Cancel Appointment Modal
 * Prompts the user for an optional cancellation reason before confirming
 * the appointment cancellation via the backend API.
 */

import { useState, useEffect, useRef } from 'react';
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
          maxHeight: 'min(90vh, 560px)',
          height: 'auto',
          padding: 0,
          overflow: 'hidden',
          width: '480px',
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
                background: 'var(--error-100)',
                color: 'var(--error-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertCircleIcon width={22} height={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>
                {t.appointments?.cancelTitle || 'Cancel Appointment'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                {t.appointments?.cancelDesc || 'Are you sure you want to cancel this appointment?'}
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
            {/* Appointment summary */}
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
              <Alert variant="error" title={isAr ? 'تعذر الإلغاء' : 'Cancellation Error'}>
                {errorMsg}
              </Alert>
            )}

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
                style={{ resize: 'vertical', fontSize: 12.5 }}
              />
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
              {t.appointments?.close || 'Keep Appointment'}
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={submitting}
              style={{ minWidth: 150 }}
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
