/**
 * Patient Appointments Page
 * ----------------------------------------------------
 * Allows logged-in patients to view only their own appointments, filter by status,
 * inspect details, and cancel pending/confirmed appointments with a reason.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import appointmentService from '../../services/appointmentService';

import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/Button';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';
import CancelModal from '../appointments/CancelModal';
import AppointmentDetailsModal from '../appointments/AppointmentDetailsModal';

import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  RefreshCwIcon,
  XCircleIcon,
  EyeIcon,
  CheckCircleIcon,
} from '../../components/icons';

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const patientId = user?.patient?.id;
      const res = await appointmentService.getAll({
        patient_id: patientId || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 50,
      });
      setAppointments(res.data || []);
    } catch (err) {
      setError(err.message || (isAr ? 'فشل تحميل المواعيد' : 'Failed to load appointments'));
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter, isAr]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCancelSuccess = () => {
    setCancelTarget(null);
    showToast(isAr ? 'تم إلغاء الموعد بنجاح.' : 'Appointment cancelled successfully.');
    loadAppointments();
  };

  const statusVariantMap = {
    pending: 'pending',
    confirmed: 'confirmed',
    in_progress: 'info',
    completed: 'completed',
    cancelled: 'cancelled',
    no_show: 'no_show',
  };

  const statusLabelMap = {
    pending: isAr ? 'قيد مراجعة الاستقبال' : 'Pending Reception Review',
    confirmed: isAr ? 'مؤكد' : 'Confirmed',
    in_progress: isAr ? 'جارية المعاينة' : 'In Progress',
    completed: isAr ? 'مكتمل' : 'Completed',
    cancelled: isAr ? 'ملغي' : 'Cancelled',
    no_show: isAr ? 'لم يحضر' : 'No-Show',
  };

  const filteredList = useMemo(() => {
    if (statusFilter === 'all') return appointments;
    return appointments.filter((a) => a.status === statusFilter);
  }, [appointments, statusFilter]);

  return (
    <div className="stack" style={{ gap: 'var(--sp-6)', paddingBottom: 'var(--sp-10)' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <Alert variant="success" onClose={() => setToastMessage(null)}>
          {toastMessage}
        </Alert>
      )}

      {/* Header Banner */}
      <div
        className="card pad"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 60%, rgba(13, 148, 136, 0.12))',
          borderColor: 'rgba(13, 148, 136, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div className="eyebrow" style={{ color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarIcon width={14} height={14} />
            {isAr ? 'بوابة المريض — المواعيد' : 'Patient Portal — Appointments'}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', margin: '4px 0 0' }}>
            {isAr ? 'سجل المواعيد الطبية' : 'My Medical Appointments'}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13.5 }}>
            {isAr
              ? 'متابعة مواعيدك القادمة، حالة طلبات الحجز، وتفاصيل الكشوفات الطبية'
              : 'Track your upcoming appointments, approval status, and consultation history'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button size="sm" variant="outline" onClick={loadAppointments} disabled={loading}>
            <RefreshCwIcon width={14} height={14} className={loading ? 'icon-spin' : ''} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </Button>

          <Link to="/app/book-appointment">
            <Button size="sm" variant="primary">
              <PlusIcon width={14} height={14} />
              <span>{isAr ? 'حجز موعد جديد' : 'Book Appointment'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" title={isAr ? 'خطأ' : 'Error'} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Status Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {[
          { id: 'all', label: isAr ? 'جميع المواعيد' : 'All Appointments' },
          { id: 'pending', label: isAr ? 'قيد المراجعة' : 'Pending' },
          { id: 'confirmed', label: isAr ? 'مؤكدة' : 'Confirmed' },
          { id: 'completed', label: isAr ? 'مكتملة' : 'Completed' },
          { id: 'cancelled', label: isAr ? 'ملغاة' : 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--r-sm)',
              border: 'none',
              background: statusFilter === tab.id ? 'var(--brand)' : 'transparent',
              color: statusFilter === tab.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <Card>
        {loading ? (
          <div className="stack" style={{ gap: 12, padding: 16 }}>
            <Skeleton variant="card" height={80} />
            <Skeleton variant="card" height={80} />
            <Skeleton variant="card" height={80} />
          </div>
        ) : filteredList.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon width={36} height={36} />}
            title={isAr ? 'لا توجد مواعيد مطابقة' : 'No appointments found'}
            description={
              isAr
                ? 'ليس لديك أي مواعيد في هذا التصنيف حالياً.'
                : 'You have no appointments matching this status filter.'
            }
            action={
              <Link to="/app/book-appointment">
                <Button variant="primary" size="sm">
                  <PlusIcon width={14} height={14} />
                  <span>{isAr ? 'احجز موعداً الآن' : 'Book an Appointment'}</span>
                </Button>
              </Link>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 14px' }}>
            {filteredList.map((apt) => {
              const canCancel = ['pending', 'confirmed'].includes(apt.status);
              const cleanStart = apt.start_time?.substring(0, 5);
              const cleanEnd = apt.end_time?.substring(0, 5);

              return (
                <div
                  key={apt.id}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--r-md)',
                        background: 'var(--brand-soft)',
                        color: 'var(--brand)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      <CalendarIcon width={18} height={18} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
                          {apt.appointment_code}
                        </span>
                        <Badge variant={statusVariantMap[apt.status] || 'pending'}>
                          {statusLabelMap[apt.status] || apt.status}
                        </Badge>
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600, marginTop: 4 }}>
                        👨‍⚕️ {apt.doctor_name}
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        🗓 {String(apt.appointment_date).split('T')[0]} · ⏰ {cleanStart} {cleanEnd ? `– ${cleanEnd}` : ''}
                      </div>

                      {apt.chief_complaint && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                          💬 {apt.chief_complaint}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setDetailsTarget(apt)}
                      style={{ padding: '6px 10px', height: 32, fontSize: 12 }}
                    >
                      <EyeIcon width={14} height={14} />
                      <span>{isAr ? 'التفاصيل' : 'Details'}</span>
                    </button>

                    {canCancel && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setCancelTarget(apt)}
                        style={{
                          padding: '6px 10px',
                          height: 32,
                          fontSize: 12,
                          color: 'var(--error-600)',
                          borderColor: 'var(--error-200)',
                        }}
                      >
                        <XCircleIcon width={14} height={14} />
                        <span>{isAr ? 'إلغاء الموعد' : 'Cancel'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {detailsTarget && (
        <AppointmentDetailsModal
          appointment={detailsTarget}
          onClose={() => setDetailsTarget(null)}
        />
      )}

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          appointment={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}
