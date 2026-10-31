/**
 * Patient Health Portal Dashboard
 * ----------------------------------------------------
 * Warm, modern, polished patient homepage providing:
 * - Personalized greeting, medical file code, blood type, allergy warning
 * - Primary "Book an Appointment" CTA card
 * - Featured "Next Upcoming Appointment" card with front-desk confirmation status
 * - Quick action shortcuts to all 6 patient portal sections
 * - Summary statistics of visits, prescriptions, and medical records
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import appointmentService from '../../services/appointmentService';
import pharmacyService from '../../services/pharmacyService';
import recordService from '../../services/recordService';

import StatCard from '../../components/common/StatCard';
import Button from '../../components/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';

import {
  CalendarIcon,
  PillIcon,
  ShieldIcon,
  BellIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  RefreshCwIcon,
} from '../../components/icons';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [records, setRecords] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const patientId = user?.patient?.id;
      const [apptsRes, rxRes, recsRes] = await Promise.all([
        appointmentService.getAll({ patient_id: patientId || undefined, limit: 10 }),
        pharmacyService.getPrescriptions({ patient_id: patientId || undefined, limit: 10 }),
        recordService.getAll({ patient_id: patientId || undefined, limit: 10 }),
      ]);

      setAppointments(apptsRes.data || []);
      setPrescriptions(rxRes.data || []);
      setRecords(recsRes.data || []);
    } catch (err) {
      setError(err.message || (isAr ? 'فشل تحميل بيانات بوابة المريض' : 'Failed to load patient health portal'));
    } finally {
      setLoading(false);
    }
  }, [user, isAr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const nextAppt = appointments.find((a) => a.status === 'confirmed' || a.status === 'pending');
  const patient = user?.patient || {};

  const statusLabelMap = {
    pending: isAr ? 'قيد مراجعة الاستقبال' : 'Pending Reception Review',
    confirmed: isAr ? 'مؤكد' : 'Confirmed',
    in_progress: isAr ? 'جارية المعاينة' : 'In Progress',
    completed: isAr ? 'مكتمل' : 'Completed',
    cancelled: isAr ? 'ملغي' : 'Cancelled',
  };

  const statusVariantMap = {
    pending: 'pending',
    confirmed: 'confirmed',
    in_progress: 'info',
    completed: 'completed',
    cancelled: 'cancelled',
  };

  return (
    <div className="stack" style={{ gap: 'var(--sp-8)', paddingBottom: 'var(--sp-10)' }}>
      {/* Patient Health Banner */}
      <div
        className="card pad"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 60%, rgba(13, 148, 136, 0.12))',
          borderColor: 'rgba(13, 148, 136, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div className="eyebrow" style={{ color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🏥</span>
            <span>{isAr ? 'مجمع فيتا الطبي — بوابة صحة المريض' : 'Vita Medical Complex — Patient Health Portal'}</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', margin: '4px 0 0' }}>
            {isAr ? 'أهلاً بك' : 'Welcome back'}, {user?.name || 'Patient'}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            {patient.patient_code && (
              <span>
                🆔 {isAr ? 'رقم الملف:' : 'File Code:'} <strong>{patient.patient_code}</strong>
              </span>
            )}
            {patient.blood_type && (
              <span>
                🩸 {isAr ? 'فصيلة الدم:' : 'Blood Type:'} <strong>{patient.blood_type}</strong>
              </span>
            )}
            {patient.allergies && (
              <span style={{ color: 'var(--error-600)', fontWeight: 600 }}>
                ⚠ {isAr ? 'الحساسية:' : 'Allergies:'} {patient.allergies}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/app/book-appointment">
            <Button size="sm" variant="primary">
              <PlusIcon width={14} height={14} />
              <span>{isAr ? 'حجز موعد جديد' : 'Book Appointment'}</span>
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCwIcon width={14} height={14} className={loading ? 'icon-spin' : ''} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title={isAr ? 'تنبيه' : 'Notice'} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Patient Portal Quick Navigation Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
        }}
      >
        <Link
          to="/app/book-appointment"
          style={{ textDecoration: 'none' }}
        >
          <div
            className="card pad"
            style={{
              padding: '16px',
              borderRadius: 'var(--r-md)',
              border: '1.5px solid var(--border)',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--brand)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
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
              }}
            >
              <PlusIcon width={18} height={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink)' }}>
                {isAr ? 'حجز موعد' : 'Book Visit'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                {isAr ? 'عيادات متخصصة' : 'Choose doctor & slot'}
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/app/my-appointments"
          style={{ textDecoration: 'none' }}
        >
          <div
            className="card pad"
            style={{
              padding: '16px',
              borderRadius: 'var(--r-md)',
              border: '1.5px solid var(--border)',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--brand)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--r-md)',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarIcon width={18} height={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink)' }}>
                {isAr ? 'مواعيدي' : 'My Bookings'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                {appointments.length} {isAr ? 'مواعيد مسجلة' : 'Recorded visits'}
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/app/my-records"
          style={{ textDecoration: 'none' }}
        >
          <div
            className="card pad"
            style={{
              padding: '16px',
              borderRadius: 'var(--r-md)',
              border: '1.5px solid var(--border)',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--brand)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--r-md)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldIcon width={18} height={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink)' }}>
                {isAr ? 'السجلات الطبية' : 'Medical Records'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                {records.length} {isAr ? 'تقارير وفحوصات' : 'Encounter reports'}
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/app/my-prescriptions"
          style={{ textDecoration: 'none' }}
        >
          <div
            className="card pad"
            style={{
              padding: '16px',
              borderRadius: 'var(--r-md)',
              border: '1.5px solid var(--border)',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--brand)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--r-md)',
                background: 'rgba(168, 85, 247, 0.12)',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PillIcon width={18} height={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink)' }}>
                {isAr ? 'الوصفات الطبية' : 'Prescriptions'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                {prescriptions.length} {isAr ? 'وصفات إلكترونية' : 'Rx orders'}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Patient KPIs */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard
          icon={<CalendarIcon width={20} height={20} />}
          value={appointments.length}
          label={isAr ? 'إجمالي المواعيد المحجوزة' : 'My Scheduled Visits'}
          delta={nextAppt ? `${isAr ? 'الموعد القادم' : 'Next'}: ${String(nextAppt.appointment_date).split('T')[0]}` : (isAr ? 'لا توجد مواعيد قادمة' : 'No upcoming visits')}
          trend="up"
          sparkline
        />

        <StatCard
          icon={<PillIcon width={20} height={20} />}
          value={prescriptions.length}
          label={isAr ? 'الوصفات الطبية الإلكترونية' : 'My Prescriptions'}
          delta={isAr ? 'أدوية موصوفة مسجلة' : 'Electronic prescriptions on file'}
          trend="neutral"
        />

        <StatCard
          icon={<ShieldIcon width={20} height={20} />}
          value={records.length}
          label={isAr ? 'المعاينات والتقارير الطبية' : 'Clinical Consultations'}
          delta={isAr ? 'تقارير وفحوصات سريرية' : 'Past encounter notes'}
          trend="up"
        />
      </div>

      {/* Main Patient Portal Layout: Next Appointment & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Next Appointment Card */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarIcon width={18} height={18} />
              <span>{isAr ? 'موعدك الطبي القادم' : 'Your Next Medical Appointment'}</span>
            </div>
          }
        >
          {!nextAppt ? (
            <EmptyState
              icon={<CalendarIcon width={36} height={36} />}
              title={isAr ? 'ليس لديك موعد محجوز حالياً' : 'No upcoming appointments'}
              description={isAr ? 'احجز استشارة طبية الآن مع أحد أطبائنا المتخصصين.' : 'Schedule an in-person consultation with our certified doctors.'}
              action={
                <Link to="/app/book-appointment">
                  <Button variant="primary" size="sm">
                    <PlusIcon width={14} height={14} />
                    <span>{isAr ? 'حجز موعد الآن' : 'Book Appointment'}</span>
                  </Button>
                </Link>
              }
            />
          ) : (
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--r-md)',
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand)' }}>
                    👨‍⚕️ {nextAppt.doctor_name || 'Dr. Specialist'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {nextAppt.appointment_code}
                  </div>
                </div>
                <Badge variant={statusVariantMap[nextAppt.status] || 'pending'}>
                  {statusLabelMap[nextAppt.status] || nextAppt.status}
                </Badge>
              </div>

              <div style={{ fontSize: 13, color: 'var(--ink)' }}>
                📅 <strong>{String(nextAppt.appointment_date).split('T')[0]}</strong> · ⏰ <strong>{nextAppt.start_time?.substring(0, 5)}</strong>
              </div>

              {nextAppt.chief_complaint && (
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  {isAr ? 'سبب الزيارة' : 'Reason'}: {nextAppt.chief_complaint}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <Link to="/app/my-appointments">
                  <Button size="sm" variant="outline" style={{ fontSize: 12 }}>
                    {isAr ? 'عرض تفاصيل الموعد' : 'View Appointment Details'}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Recent Prescriptions Card */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PillIcon width={18} height={18} />
              <span>{isAr ? 'أحدث الوصفات الطبية' : 'Recent Prescriptions'}</span>
            </div>
          }
        >
          {prescriptions.length === 0 ? (
            <EmptyState
              icon={<PillIcon width={36} height={36} />}
              title={isAr ? 'لا توجد وصفات طبية' : 'No active prescriptions'}
              description={isAr ? 'سيتم إدراج الوصفات الطبية هنا فور تحريرها من الطبيب.' : 'Prescriptions will appear here once issued by your doctor.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prescriptions.slice(0, 4).map((rx) => (
                <div
                  key={rx.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--brand)' }}>
                      {rx.prescription_code || `RX-${rx.id}`}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      👨‍⚕️ {rx.doctor_name || 'Doctor'} · 📅 {String(rx.created_at || '').substring(0, 10)}
                    </div>
                  </div>

                  <Badge variant={rx.status === 'dispensed' ? 'completed' : 'pending'}>
                    {rx.status === 'dispensed' ? (isAr ? 'مصروفة' : 'Dispensed') : (isAr ? 'قيد الصرف' : 'Pending')}
                  </Badge>
                </div>
              ))}
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <Link to="/app/my-prescriptions" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--brand)' }}>
                  {isAr ? 'عرض جميع الوصفات ←' : 'View all prescriptions →'}
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
