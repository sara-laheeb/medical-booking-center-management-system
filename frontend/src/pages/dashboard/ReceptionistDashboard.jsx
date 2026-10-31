import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import appointmentService from '../../services/appointmentService';
import doctorService from '../../services/doctorService';
import patientService from '../../services/patientService';

import StatCard from '../../components/common/StatCard';
import Button from '../../components/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import CancelModal from '../appointments/CancelModal';

import {
  CalendarIcon,
  UsersIcon,
  StethoscopeIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  RefreshCwIcon,
  CheckIcon,
  XCircleIcon,
} from '../../components/icons';

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [pendingOnlineBookings, setPendingOnlineBookings] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      const [apptsRes, docsRes, patsRes, pendingRes] = await Promise.all([
        appointmentService.getAll({ date_from: todayStr, date_to: todayStr, limit: 50 }),
        doctorService.getAll({ is_active: 1, limit: 20 }),
        patientService.getAll({ limit: 6 }),
        appointmentService.getAll({ status: 'pending', limit: 30 }),
      ]);

      setTodayAppointments(apptsRes.data || []);
      setDoctorsList(docsRes.data || []);
      setRecentPatients(patsRes.data || []);
      setPendingOnlineBookings(pendingRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load front-desk dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fast approve booking
  const handleApproveBooking = async (id) => {
    setUpdatingId(id);
    try {
      await appointmentService.updateStatus(id, 'confirmed');
      setToastMessage(isAr ? 'تم اعتماد وتأكيد حجز المريض بنجاح.' : 'Online booking approved and confirmed successfully.');
      setPendingOnlineBookings((prev) => prev.filter((b) => b.id !== id));
      // Refresh list to update counts
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to approve booking');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      await appointmentService.updateStatus(id, status);
      setTodayAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch (err) {
      alert(err.message || 'Failed to update appointment status');
    } finally {
      setUpdatingId(null);
    }
  };

  const checkedInCount = todayAppointments.filter((a) => a.status === 'confirmed' || a.status === 'completed').length;

  return (
    <div className="stack" style={{ gap: 'var(--sp-8)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'sticky', top: 12, zIndex: 100 }}>
          <Alert variant="success" icon={<CheckIcon width={18} height={18} />}>
            {toastMessage}
          </Alert>
        </div>
      )}

      {/* Front Desk Header Banner */}
      <div
        className="card pad"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 60%, rgba(59, 130, 246, 0.12))',
          borderColor: 'rgba(59, 130, 246, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div className="eyebrow" style={{ color: '#2563eb' }}>
            🏢 {t.dashboard?.receptionTitle || 'Front Desk Operations & Patient Check-in'}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
            {isAr ? 'مرحباً بك' : 'Welcome'}, {user?.name || 'Reception Staff'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {t.dashboard?.receptionSubtitle || "Manage today's patient queue, walk-ins, online booking approvals, and on-duty doctors"}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/app/appointments">
            <Button size="sm" variant="primary">
              <PlusIcon width={14} height={14} />
              <span>{t.dashboard?.quickWalkIn || 'Book Walk-in'}</span>
            </Button>
          </Link>
          <Link to="/app/patients">
            <Button size="sm" variant="outline">
              <UsersIcon width={14} height={14} />
              <span>{t.dashboard?.quickRegister || 'Register Patient'}</span>
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCwIcon width={14} height={14} className={loading ? 'icon-spin' : ''} />
            <span>
              {loading
                ? t.dashboard?.refreshing || (isAr ? 'جاري التحديث...' : 'Refreshing...')
                : t.dashboard?.refresh || (isAr ? 'تحديث' : 'Refresh')}
            </span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title={isAr ? 'تنبيه' : 'Notice'} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Front-Desk KPIs */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard
          icon={<ClockIcon width={20} height={20} />}
          value={pendingOnlineBookings.length}
          label={isAr ? 'طلبات حجز بانتظار الاعتماد' : 'Pending Online Bookings'}
          delta={isAr ? 'حجوزات واردة من المرضى' : 'Awaiting front desk approval'}
          trend={pendingOnlineBookings.length > 0 ? 'down' : 'neutral'}
        />

        <StatCard
          icon={<CalendarIcon width={20} height={20} />}
          value={todayAppointments.length}
          label={t.dashboard?.todayAppointments || "Today's Bookings"}
          delta={isAr ? 'إجمالي المواعيد المحجوزة اليوم' : 'Total scheduled today'}
          trend="up"
          sparkline
        />

        <StatCard
          icon={<CheckCircleIcon width={20} height={20} />}
          value={checkedInCount}
          label={isAr ? 'تم تسجيل حضورهم' : 'Checked In / In Clinic'}
          delta={isAr ? 'مرضى في صالة الانتظار' : 'Patients arrived'}
          trend="up"
        />

        <StatCard
          icon={<StethoscopeIcon width={20} height={20} />}
          value={doctorsList.length}
          label={t.dashboard?.onDutyDoctors || 'Doctors On Duty'}
          delta={isAr ? 'عيادات مفتوحة حالياً' : 'Active practicing clinics'}
          trend="up"
        />
      </div>

      {/* Dedicated Section: Pending Online Bookings Review Queue */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClockIcon width={18} height={18} style={{ color: '#2563eb' }} />
              <span style={{ fontWeight: 800 }}>
                {isAr ? 'قائمة مراجعة واعتماد الحجوزات الإلكترونية الجديدة' : 'Pending Online Bookings Review Queue'}
              </span>
            </div>
            <Badge variant={pendingOnlineBookings.length > 0 ? 'pending' : 'confirmed'}>
              {pendingOnlineBookings.length} {isAr ? 'طلب معلق' : 'Pending Requests'}
            </Badge>
          </div>
        }
        subtitle={
          isAr
            ? 'مراجعة طلبات الحجز المقدمة من المرضى عبر البوابة الإلكترونية واعتمادها أو رفضها مع بيان السبب'
            : 'Review patient online booking requests and either approve (confirm) or reject with an explanation'
        }
      >
        {pendingOnlineBookings.length === 0 ? (
          <EmptyState
            icon={<CheckCircleIcon width={36} height={36} />}
            title={isAr ? 'لا توجد طلبات حجز معلقة حالياً' : 'No Pending Bookings'}
            description={
              isAr
                ? 'تمت مراجعة واعتماد كافة طلبات الحجز الواردة عبر البوابة الإلكترونية بنجاح.'
                : 'All incoming online patient booking requests have been reviewed and processed.'
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th>{isAr ? 'المريض' : 'Patient'}</th>
                  <th>{isAr ? 'العيادة / الطبيب' : 'Doctor & Specialty'}</th>
                  <th>{isAr ? 'الموعد المطلوب' : 'Requested Schedule'}</th>
                  <th>{isAr ? 'نوع الزيارة والشكوى' : 'Visit Type & Complaint'}</th>
                  <th style={{ textAlign: isAr ? 'left' : 'right' }}>{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {pendingOnlineBookings.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                        {req.patient_name || req.patient?.full_name || 'Patient'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        {req.patient_code ? `#${req.patient_code}` : ''} {req.patient_phone || req.patient?.phone || ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                        👨‍⚕️ {req.doctor_name || req.doctor?.user?.name || 'Doctor'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        {req.specialty_name || req.doctor?.specialty_name || ''}
                      </div>
                    </td>
                    <td>
                      <div className="mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                        📅 {String(req.appointment_date).substring(0, 10)}
                      </div>
                      <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        ⏰ {req.start_time?.substring(0, 5)} - {req.end_time?.substring(0, 5)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>
                        {req.visit_type === 'follow_up'
                          ? (isAr ? 'مراجعة' : 'Follow-up')
                          : req.visit_type === 'emergency'
                          ? (isAr ? 'حالة طارئة' : 'Emergency')
                          : (isAr ? 'كشف جديد' : 'New')}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={req.chief_complaint}>
                        {req.chief_complaint || (isAr ? 'لا توجد ملاحظات' : 'No notes')}
                      </div>
                    </td>
                    <td style={{ textAlign: isAr ? 'left' : 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, justifyContent: isAr ? 'flex-start' : 'flex-end' }}>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleApproveBooking(req.id)}
                          disabled={updatingId === req.id}
                          style={{ padding: '5px 12px', fontSize: 12 }}
                        >
                          ✓ {isAr ? 'اعتماد وتأكيد' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectTarget(req)}
                          disabled={updatingId === req.id}
                          style={{ padding: '5px 10px', fontSize: 12, color: 'var(--error-600)', borderColor: 'var(--error-300)' }}
                        >
                          ✕ {isAr ? 'رفض' : 'Reject'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Main Front Desk Operations Layout: Waiting Room Queue & On-Duty Doctors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Waiting Room & Check-In Queue */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockIcon width={18} height={18} />
                <span>{t.dashboard?.waitingQueue || 'Waiting Room Queue'}</span>
              </div>
              <Badge variant="confirmed">{todayAppointments.length} {isAr ? 'مريض' : 'Patients'}</Badge>
            </div>
          }
        >
          {todayAppointments.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon width={36} height={36} />}
              title={isAr ? 'لا توجد مواعيد اليوم' : 'No bookings for today'}
              description={isAr ? 'يمكنك حجز موعد فوري لمريض جديد من الزر أعلاه.' : 'You can schedule a walk-in patient using the button above.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: appt.status === 'confirmed' ? 'var(--brand-soft)' : 'var(--bg-surface)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>
                        {appt.patient_name || appt.patient?.full_name || 'Patient'}
                      </span>
                      <Badge variant={appt.status === 'confirmed' ? 'confirmed' : 'pending'}>
                        {appt.status}
                      </Badge>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      ⏰ {appt.start_time?.substring(0, 5)} · 👨‍⚕️ {appt.doctor_name || appt.doctor?.user?.name || 'Doctor'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {appt.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStatusUpdate(appt.id, 'confirmed')}
                        disabled={updatingId === appt.id}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        ✓ {t.dashboard?.markArrived || 'Check-In'}
                      </Button>
                    )}
                    {appt.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(appt.id, 'completed')}
                        disabled={updatingId === appt.id}
                        style={{ padding: '4px 10px', fontSize: 11 }}
                      >
                        ✓ {isAr ? 'إنهاء الزيارة' : 'Complete'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* On-Duty Doctors Card */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StethoscopeIcon width={18} height={18} />
              <span>{t.dashboard?.onDutyDoctors || 'On-Duty Doctors & Clinic Rooms'}</span>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {doctorsList.map((doc) => {
              const docName = doc.user?.name || doc.doctor_name || 'Doctor';
              const specialty = isAr ? doc.specialty?.name_ar || doc.specialty_name : doc.specialty?.name || doc.specialty_name;

              return (
                <div
                  key={doc.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
                      👨‍⚕️ {docName}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {specialty} · ⏰ {doc.work_start?.substring(0, 5)} - {doc.work_end?.substring(0, 5)}
                    </div>
                  </div>

                  <Badge variant="confirmed">
                    {Number(doc.consultation_fee).toLocaleString()} IQD
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Registered Patients Card */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UsersIcon width={18} height={18} />
                <span>{t.dashboard?.recentPatientsTitle || 'Recently Registered Patients'}</span>
              </div>
              <Link to="/app/patients" style={{ fontSize: 12.5, color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
                {isAr ? 'عرض الكل ←' : 'View all →'}
              </Link>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentPatients.map((p) => {
              const pName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.full_name || 'Patient';
              return (
                <div
                  key={p.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12.5,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{pName}</span>
                    <span style={{ color: 'var(--text-secondary)', marginInlineStart: 8, fontSize: 11 }}>
                      ({p.patient_code})
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                    {p.phone || p.created_at?.substring(0, 10)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Reject/Cancellation Modal */}
      <CancelModal
        isOpen={Boolean(rejectTarget)}
        appointment={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onSuccess={() => {
          setToastMessage(isAr ? 'تم رفض الحجز وإخطار المريض بالسبب.' : 'Booking rejected and patient notified.');
          setPendingOnlineBookings((prev) => prev.filter((b) => b.id !== rejectTarget?.id));
          setRejectTarget(null);
          loadData();
        }}
      />
    </div>
  );
}
