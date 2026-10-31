/**
 * Appointment Details Modal
 * Displays full read-only information for a single appointment including patient,
 * doctor, timing, visit type, chief complaint, status, and available actions.
 */

import { useEffect, useRef } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import Badge from '../../components/common/Badge';
import {
  CloseIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  StethoscopeIcon,
  CheckCircleIcon,
  EditIcon,
  XCircleIcon,
} from '../../components/icons';

export default function AppointmentDetailsModal({
  isOpen,
  appointment,
  onClose,
  onOpenReschedule,
  onOpenCancel,
  onUpdateStatus,
  canConfirm = true,
}) {
  const { t } = useLanguage();

  const overlayMouseDownRef = useRef(false);

  const handleOverlayMouseDown = (e) => {
    overlayMouseDownRef.current = (e.target === e.currentTarget);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && overlayMouseDownRef.current) {
      onClose();
    }
    overlayMouseDownRef.current = false;
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !appointment) return null;

  const statusVariantMap = {
    pending: 'pending',
    confirmed: 'confirmed',
    in_progress: 'info',
    completed: 'completed',
    cancelled: 'cancelled',
    no_show: 'no_show',
  };

  const statusLabelMap = {
    pending: t.appointments?.statusPending || 'Pending',
    confirmed: t.appointments?.statusConfirmed || 'Confirmed',
    in_progress: t.appointments?.statusInProgress || 'In Progress',
    completed: t.appointments?.statusCompleted || 'Completed',
    cancelled: t.appointments?.statusCancelled || 'Cancelled',
    no_show: t.appointments?.statusNoShow || 'No-Show',
  };

  const visitTypeLabelMap = {
    new: t.appointments?.typeNew || 'New Consultation',
    follow_up: t.appointments?.typeFollowUp || 'Follow-up',
    emergency: t.appointments?.typeEmergency || 'Emergency',
  };

  const isFinalStatus = ['completed', 'cancelled'].includes(appointment.status);

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
          maxHeight: 'min(90vh, 680px)',
          height: 'auto',
          padding: 0,
          overflow: 'hidden',
          width: '620px',
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="mono" style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>
                {appointment.appointment_code}
              </span>
              <Badge variant={statusVariantMap[appointment.status] || 'pending'}>
                {statusLabelMap[appointment.status] || appointment.status}
              </Badge>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              {t.appointments?.detailsTitle || 'Appointment Details'}
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

        {/* Scrollable Content Body */}
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
          {/* Patient & Doctor Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div
              style={{
                background: 'var(--bg-surface-alt)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-md)',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand)', marginBottom: 6 }}>
                <UsersIcon width={16} height={16} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                  {t.appointments?.colPatient || 'Patient'}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                {appointment.patient_name}
              </div>
              {appointment.patient_phone && (
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {appointment.patient_phone}
                </div>
              )}
            </div>

            <div
              style={{
                background: 'var(--bg-surface-alt)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-md)',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand)', marginBottom: 6 }}>
                <StethoscopeIcon width={16} height={16} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                  {t.appointments?.colDoctor || 'Doctor'}
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                {appointment.doctor_name}
              </div>
            </div>
          </div>

          {/* Schedule & Timing Info */}
          <div
            style={{
              background: 'var(--bg-surface-alt)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--r-md)',
              padding: '14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                <CalendarIcon width={13} height={13} />
                {t.appointments?.appointmentDate || 'Date'}
              </div>
              <div className="mono" style={{ fontWeight: 700, fontSize: 13.5 }}>
                {appointment.appointment_date ? appointment.appointment_date.split('T')[0] : '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                <ClockIcon width={13} height={13} />
                {t.appointments?.colDateTime || 'Time Window'}
              </div>
              <div className="mono" style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--brand)' }}>
                {appointment.start_time?.slice(0, 5)} - {appointment.end_time?.slice(0, 5) || '—'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {t.appointments?.colType || 'Visit Type'}
              </div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {visitTypeLabelMap[appointment.visit_type] || appointment.visit_type}
              </div>
            </div>
          </div>

          {/* Chief Complaint */}
          {appointment.chief_complaint && (
            <div
              style={{
                background: 'var(--bg-surface-alt)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-md)',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {t.appointments?.chiefComplaint || 'Chief Complaint'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
                {appointment.chief_complaint}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          {appointment.notes && (
            <div
              style={{
                background: 'var(--bg-surface-alt)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--r-md)',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {t.appointments?.notes || 'Internal Clinical Notes'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
                {appointment.notes}
              </div>
            </div>
          )}

          {/* Cancel Reason */}
          {appointment.cancel_reason && (
            <div
              style={{
                background: 'var(--error-100)',
                border: '1px solid rgba(220, 78, 78, 0.2)',
                borderRadius: 'var(--r-md)',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--error-700)', marginBottom: 4 }}>
                {t.appointments?.cancelReason || 'Cancellation Reason'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--error-700)', lineHeight: 1.5 }}>
                {appointment.cancel_reason}
              </div>
            </div>
          )}

          {/* Meta timestamps */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-secondary)', paddingTop: 4 }}>
            <span>
              {t.appointments?.createdAt || 'Created'}: {appointment.created_at ? new Date(appointment.created_at).toLocaleString() : '—'}
            </span>
            {appointment.booked_by && (
              <span>
                {t.appointments?.bookedBy || 'Booked By Staff'}: #{appointment.booked_by}
              </span>
            )}
          </div>
        </div>

        {/* Fixed Modal Actions Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface-alt)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {/* Status buttons if not in final state */}
          {!isFinalStatus && (
            <>
              {appointment.status === 'pending' && canConfirm && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onUpdateStatus(appointment.id, 'confirmed');
                    onClose();
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <CheckCircleIcon width={15} height={15} />
                  {t.appointments?.actionConfirm || 'Confirm'}
                </button>
              )}

              {appointment.status === 'confirmed' && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      onUpdateStatus(appointment.id, 'in_progress');
                      onClose();
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <CheckCircleIcon width={15} height={15} />
                    {t.appointments?.actionStart || 'Start'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      onUpdateStatus(appointment.id, 'completed');
                      onClose();
                    }}
                  >
                    {t.appointments?.actionComplete || 'Complete'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      onUpdateStatus(appointment.id, 'no_show');
                      onClose();
                    }}
                  >
                    {t.appointments?.actionNoShow || 'No-Show'}
                  </button>
                </>
              )}

              {appointment.status === 'in_progress' && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      onUpdateStatus(appointment.id, 'completed');
                      onClose();
                    }}
                  >
                    {t.appointments?.actionComplete || 'Complete'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      onUpdateStatus(appointment.id, 'no_show');
                      onClose();
                    }}
                  >
                    {t.appointments?.actionNoShow || 'No-Show'}
                  </button>
                </>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  onClose();
                  onOpenReschedule(appointment);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <EditIcon width={14} height={14} />
                {t.appointments?.actionReschedule || 'Reschedule'}
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  onClose();
                  onOpenCancel(appointment);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <XCircleIcon width={14} height={14} />
                {t.appointments?.actionCancel || 'Cancel'}
              </button>
            </>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ marginInlineStart: 'auto' }}
          >
            {t.appointments?.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
