import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import dashboardService from '../../services/dashboardService';
import recordService from '../../services/recordService';

import StatCard from '../../components/common/StatCard';
import Button from '../../components/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';

import DentalSuite from './specialties/DentalSuite';
import OphthalmicSuite from './specialties/OphthalmicSuite';
import LaboratorySuite from './specialties/LaboratorySuite';
import RadiologySuite from './specialties/RadiologySuite';
import OrthopedicSuite from './specialties/OrthopedicSuite';

import {
  CalendarIcon,
  UsersIcon,
  StethoscopeIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  ShieldIcon,
  MedicalCrossIcon,
  InvoiceIcon,
  RefreshCwIcon,
} from '../../components/icons';

// Clinical specialty configurations covering the 5 approved medical disciplines in Vita Complex
const SPECIALTY_OPTIONS = [
  { id: 'dental', name: 'Dentistry', nameAr: 'طب الأسنان', icon: '🦷' },
  { id: 'radiology', name: 'Radiology & Ultrasound', nameAr: 'الأشعة والسونار', icon: '🩻' },
  { id: 'laboratory', name: 'Medical Laboratory', nameAr: 'المختبر الطبي', icon: '🔬' },
  { id: 'ophthalmology', name: 'Ophthalmology', nameAr: 'طب وجراحة العيون', icon: '👁' },
  { id: 'orthopedics', name: 'Orthopedics & Fractures', nameAr: 'جراحة العظام والكسور', icon: '🦴' },
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorData, setDoctorData] = useState(null);

  // Active specialty template: defaults to doctor's assigned specialty, but allows live preview switching
  const [activeSpecialty, setActiveSpecialty] = useState('dental');

  const [selectedApptId, setSelectedApptId] = useState(null);
  const [savingExam, setSavingExam] = useState(false);
  const [examToast, setExamToast] = useState(null);

  const loadDoctorSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await dashboardService.getDoctorSummary();
      setDoctorData(summary);
      // Set tailored clinical workspace suite based on doctor specialty discipline
      const specName = (summary?.doctor?.specialty_name || '').toLowerCase();
      const tmpl = (summary?.doctor?.template_type || '').toLowerCase();
      if (tmpl === 'dental' || specName.includes('dent') || specName.includes('أسنان')) {
        setActiveSpecialty('dental');
      } else if (tmpl === 'radiology' || specName.includes('radio') || specName.includes('ultrasound') || specName.includes('أشعة') || specName.includes('سونار')) {
        setActiveSpecialty('radiology');
      } else if (tmpl === 'laboratory' || specName.includes('lab') || specName.includes('مختبر')) {
        setActiveSpecialty('laboratory');
      } else if (tmpl === 'ophthalmology' || specName.includes('ophthal') || specName.includes('عيون')) {
        setActiveSpecialty('ophthalmology');
      } else if (tmpl === 'orthopedic' || specName.includes('ortho') || specName.includes('fracture') || specName.includes('عظام') || specName.includes('كسور')) {
        setActiveSpecialty('orthopedics');
      } else {
        setActiveSpecialty('dental');
      }
      if (summary?.recentAppointments?.length > 0) {
        setSelectedApptId((prev) => prev || summary.recentAppointments[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load doctor dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctorSummary();
  }, [loadDoctorSummary]);

  const selectedAppt =
    doctorData?.recentAppointments?.find((a) => a.id === Number(selectedApptId)) ||
    doctorData?.recentAppointments?.[0];

  const handleSaveSpecialtyExam = async (examPayload) => {
    if (!selectedAppt) {
      setExamToast({
        type: 'error',
        text: isAr ? 'لا يوجد موعد محدد لتوثيق الفحص له' : 'No patient appointment selected to record examination for.',
      });
      setTimeout(() => setExamToast(null), 5000);
      return;
    }

    const doctorId = doctorData?.doctor?.doctor_id || user?.doctor?.id;
    if (!doctorId) {
      setExamToast({
        type: 'error',
        text: isAr ? 'تعذر التعرف على ملف الطبيب' : 'Unable to identify doctor profile.',
      });
      setTimeout(() => setExamToast(null), 5000);
      return;
    }

    setSavingExam(true);
    try {
      const recordPayload = {
        appointment_id: selectedAppt.id,
        patient_id: selectedAppt.patient_id,
        doctor_id: doctorId,
        visit_date: selectedAppt.appointment_date
          ? selectedAppt.appointment_date.substring(0, 10)
          : new Date().toISOString().substring(0, 10),
        diagnosis: examPayload.diagnosis || (isAr ? 'فحص سريري تخصصي' : 'Specialized Clinical Examination'),
        treatment_plan: examPayload.treatment_plan || '',
        vital_signs: examPayload.vital_signs || null,
        specialty_data: examPayload.specialty_data || null,
      };

      try {
        await recordService.create(recordPayload);
        setExamToast({
          type: 'success',
          text: isAr
            ? `تم حفظ وتوثيق الفحص السريري للمريض (${selectedAppt.patient_name}) بنجاح في قاعدة البيانات!`
            : `Clinical examination for (${selectedAppt.patient_name}) saved to database successfully!`,
        });
      } catch (createErr) {
        if (createErr.status === 409 || createErr.message?.includes('already exists')) {
          const existingList = await recordService.getAll({
            patient_id: selectedAppt.patient_id,
            doctor_id: doctorId,
          });
          const match = existingList?.data?.find((r) => r.appointment_id === selectedAppt.id);
          if (match) {
            await recordService.update(match.id, {
              diagnosis: recordPayload.diagnosis,
              treatment_plan: recordPayload.treatment_plan,
              vital_signs: recordPayload.vital_signs,
              specialty_data: recordPayload.specialty_data,
            });
            setExamToast({
              type: 'success',
              text: isAr
                ? `تم تحديث الفحص السريري للمريض (${selectedAppt.patient_name}) بنجاح في قاعدة البيانات!`
                : `Clinical examination for (${selectedAppt.patient_name}) updated successfully in database!`,
            });
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }
      loadDoctorSummary();
    } catch (err) {
      setExamToast({
        type: 'error',
        text: err.message || (isAr ? 'فشل حفظ الفحص السريري' : 'Failed to save clinical examination'),
      });
    } finally {
      setSavingExam(false);
      setTimeout(() => setExamToast(null), 5000);
    }
  };

  const doc = doctorData?.doctor || user?.doctor || {};
  const specialtyName = isAr
    ? doc.specialty_name_ar || 'طبيب استشاري'
    : doc.specialty_name || 'Specialist Clinician';

  // Greeting
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12
      ? isAr ? 'صباح الخير' : 'Good morning'
      : hour < 17
      ? isAr ? 'مساء الخير' : 'Good afternoon'
      : isAr ? 'مساء النور' : 'Good evening';

  const todayDateFormatted = new Date().toLocaleDateString(
    isAr ? 'ar-IQ' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <div className="stack" style={{ gap: 'var(--sp-8)' }}>
      {/* Toast Notification */}
      {examToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: isAr ? 'auto' : '24px',
            left: isAr ? '24px' : 'auto',
            zIndex: 1100,
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <div
            className="card pad"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: examToast.type === 'error' ? 'var(--accent-red)' : 'var(--brand)',
              color: '#fff',
              boxShadow: 'var(--shadow-lg)',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 'var(--r-lg)',
            }}
          >
            <CheckCircleIcon width={18} height={18} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{examToast.text}</span>
          </div>
        </div>
      )}

      {/* Clinician Profile Banner */}
      <div
        className="card pad"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 60%, var(--brand-soft))',
          borderColor: 'rgba(15, 110, 100, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>{doc.specialty_icon || '🩺'}</span>
            <span className="eyebrow" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>
              {specialtyName}
            </span>
            <Badge variant="confirmed">
              {isAr ? 'طبيب معتمد' : 'Verified Practitioner'}
            </Badge>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
            {timeGreeting}, {user?.name || 'Doctor'}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>📅 {todayDateFormatted}</span>
            {doc.license_number && (
              <span>📜 {t.dashboard?.license || 'License'}: <strong>{doc.license_number}</strong></span>
            )}
            {doc.work_start && (
              <span>⏰ {t.dashboard?.shift || 'Shift'}: {doc.work_start.substring(0, 5)} - {doc.work_end.substring(0, 5)}</span>
            )}
            {doc.consultation_fee && (
              <span>💳 {t.dashboard?.fee || 'Fee'}: {Number(doc.consultation_fee).toLocaleString()} IQD</span>
            )}
          </div>
        </div>

        {/* Quick Clinical Shortcuts */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/app/appointments">
            <Button size="sm" variant="outline">
              <CalendarIcon width={14} height={14} />
              <span>{t.appNav?.appointments || 'Appointments'}</span>
            </Button>
          </Link>
          <Link to="/app/records">
            <Button size="sm" variant="primary">
              <ShieldIcon width={14} height={14} />
              <span>{isAr ? 'توثيق معاينة' : 'New Encounter'}</span>
            </Button>
          </Link>
          <Link to="/app/pharmacy">
            <Button size="sm" variant="outline">
              <MedicalCrossIcon width={14} height={14} />
              <span>{isAr ? 'وصفة إلكترونية' : 'New Rx'}</span>
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={loadDoctorSummary} disabled={loading}>
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

      {/* KPI Stats Row (Doctor Scoped) */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard
          icon={<CalendarIcon width={20} height={20} />}
          value={doctorData?.appointmentsToday ?? 0}
          label={t.dashboard?.myAppointments || "Today's Appointments"}
          delta={isAr ? 'مواعيد مخصصة لعيادتك اليوم' : 'Patients booked with you today'}
          trend="up"
          sparkline
        />

        <StatCard
          icon={<UsersIcon width={20} height={20} />}
          value={doctorData?.totalPatients ?? 0}
          label={t.dashboard?.myPatients || 'My Patient Files'}
          delta={isAr ? 'إجمالي المراجعين المسجلين' : 'Assigned active patients'}
          trend="up"
        />

        <StatCard
          icon={<ClockIcon width={20} height={20} />}
          value={doctorData?.appointmentsThisWeek ?? 0}
          label={t.dashboard?.thisWeek || "This Week's Consultations"}
          delta={isAr ? 'مواعيد الأسبوع الحالي' : 'Scheduled this week'}
          trend="neutral"
        />

        <StatCard
          icon={<CheckCircleIcon width={20} height={20} />}
          value={doctorData?.appointmentsByStatus?.completed ?? 0}
          label={t.dashboard?.completedConsultations || 'Completed Consultations'}
          delta={isAr ? 'معاينات وفحوصات منجزة' : 'Finished appointments'}
          trend="up"
        />
      </div>

      {/* Specialty Suite Header & Container (Strictly specialty-locked for doctors) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
              {isAr ? 'العيادة التخصصية والأدوات السريرية' : 'Personalized Clinical Suite'}:
            </span>
            <Badge variant="confirmed">
              {SPECIALTY_OPTIONS.find((s) => s.id === activeSpecialty)?.icon}{' '}
              {isAr
                ? SPECIALTY_OPTIONS.find((s) => s.id === activeSpecialty)?.nameAr
                : SPECIALTY_OPTIONS.find((s) => s.id === activeSpecialty)?.name}
            </Badge>
          </div>

          {/* Appointment / Patient Selector for Clinical Exam */}
          {doctorData?.recentAppointments?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginInlineStart: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                {isAr ? 'المراجع الحالي:' : 'Patient:'}
              </span>
              <select
                className="input"
                value={selectedAppt?.id || ''}
                onChange={(e) => setSelectedApptId(Number(e.target.value))}
                style={{ width: 'auto', padding: '3px 8px', fontSize: 12, fontWeight: 600 }}
              >
                {doctorData.recentAppointments.map((appt) => (
                  <option key={appt.id} value={appt.id}>
                    {appt.patient_name} ({appt.appointment_code}) {appt.start_time ? `· ${appt.start_time.substring(0, 5)}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Preview switcher is only rendered for Admin managers previewing different views */}
        {user?.role === 'admin' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {t.dashboard?.switchSpecialtyView || 'Preview specialty view'}:
            </span>
            {SPECIALTY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveSpecialty(opt.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 'var(--r-full)',
                  fontSize: 12,
                  fontWeight: activeSpecialty === opt.id ? 700 : 500,
                  background: activeSpecialty === opt.id ? 'var(--brand)' : 'var(--bg-subtle)',
                  color: activeSpecialty === opt.id ? '#ffffff' : 'var(--ink)',
                  border: activeSpecialty === opt.id ? '1px solid var(--brand)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{opt.icon}</span>
                <span>{isAr ? opt.nameAr : opt.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Render Active Specialty Suite (Tailored to doctor's discipline) */}
      <div>
        {activeSpecialty === 'dental' && (
          <DentalSuite
            patientName={selectedAppt?.patient_name}
            onSaveSpecialtyExam={handleSaveSpecialtyExam}
            savingExam={savingExam}
          />
        )}
        {activeSpecialty === 'radiology' && (
          <RadiologySuite
            patientName={selectedAppt?.patient_name}
            onSaveSpecialtyExam={handleSaveSpecialtyExam}
            savingExam={savingExam}
          />
        )}
        {activeSpecialty === 'laboratory' && (
          <LaboratorySuite
            patientName={selectedAppt?.patient_name}
            onSaveSpecialtyExam={handleSaveSpecialtyExam}
            savingExam={savingExam}
          />
        )}
        {activeSpecialty === 'ophthalmology' && (
          <OphthalmicSuite
            patientName={selectedAppt?.patient_name}
            onSaveSpecialtyExam={handleSaveSpecialtyExam}
            savingExam={savingExam}
          />
        )}
        {activeSpecialty === 'orthopedics' && (
          <OrthopedicSuite
            patientName={selectedAppt?.patient_name}
            onSaveSpecialtyExam={handleSaveSpecialtyExam}
            savingExam={savingExam}
          />
        )}
      </div>

      {/* Doctor's Financial Entitlements & Earnings Section */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <InvoiceIcon width={18} height={18} />
              <span>{isAr ? 'مستحقاتي المالية وإيرادات كشفية العيادة' : 'My Financial Entitlements & Clinic Invoices'}</span>
            </div>
            <Link to="/app/billing" style={{ fontSize: 12.5, color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
              {isAr ? 'سجل الفواتير ←' : 'All My Invoices →'}
            </Link>
          </div>
        }
      >
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
          <div style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {isAr ? 'أجر الكشفية المعتمد' : 'Consultation Fee Rate'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand)', marginTop: 4 }}>
              {Number(doc.consultation_fee || 0).toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500 }}>IQD</span>
            </div>
          </div>
          <div style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {isAr ? 'إجمالي المبالغ المفوترة' : 'Total Invoiced Volume'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
              {Number(doctorData?.financialEntitlements?.totalInvoiced || 0).toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500 }}>IQD</span>
            </div>
          </div>
          <div style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {isAr ? 'المبالغ المحصلة' : 'Collected Revenue'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
              {Number(doctorData?.financialEntitlements?.totalCollected || 0).toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500 }}>IQD</span>
            </div>
          </div>
          <div style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
              {isAr ? 'المستحقات المعلقة' : 'Pending Receivables'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
              {Number(doctorData?.financialEntitlements?.totalPending || 0).toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500 }}>IQD</span>
            </div>
          </div>
        </div>

        {/* Doctor's Scoped Patient Invoices Table */}
        {doctorData?.financialEntitlements?.recentInvoices?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--ink)' }}>
              {isAr ? 'آخر فواتير كشفيات وإجراءات عيادتي' : 'Recent Invoices for My Patients'}
            </div>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 14px', textAlign: isAr ? 'right' : 'left', fontSize: 11.5 }}>
                    {isAr ? 'رقم الفاتورة' : 'Invoice #'}
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: isAr ? 'right' : 'left', fontSize: 11.5 }}>
                    {isAr ? 'المريض' : 'Patient'}
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11.5 }}>
                    {isAr ? 'المبلغ' : 'Amount'}
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11.5 }}>
                    {isAr ? 'المدفوع' : 'Paid'}
                  </th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11.5 }}>
                    {isAr ? 'الحالة' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {doctorData.financialEntitlements.recentInvoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 12, color: 'var(--brand)' }}>
                      {inv.invoice_code}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{inv.patient_name}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>
                      {Number(inv.total).toLocaleString()} IQD
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 12, color: '#10b981' }}>
                      {Number(inv.paid_amount).toLocaleString()} IQD
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <Badge variant={inv.status === 'paid' ? 'confirmed' : 'pending'}>
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', padding: '12px 0' }}>
            {isAr
              ? 'لا توجد فواتير مسجلة لمرضاك حتى الآن. يتم تسجيل الفواتير تلقائيًا عند إتمام الحجوزات أو الإجراءات.'
              : 'No patient invoices recorded for your clinic yet. Invoices appear automatically upon consultation completion.'}
          </div>
        )}
      </Card>

      {/* Doctor's Today Schedule Table */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarIcon width={18} height={18} />
              <span>{isAr ? 'جدول مواعيدي اليومية' : 'My Clinical Appointments'}</span>
            </div>
            <Link to="/app/appointments" style={{ fontSize: 12.5, color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}>
              {isAr ? 'عرض الكل ←' : 'View all →'}
            </Link>
          </div>
        }
      >
        {doctorData?.recentAppointments?.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon width={36} height={36} />}
            title={isAr ? 'لا توجد مواعيد مخصصة لك اليوم' : 'No appointments scheduled for today'}
            description={isAr ? 'جدولك خالي من الحجوزات لهذا اليوم.' : 'Your appointment schedule is clear for today.'}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12 }}>{isAr ? 'الكود' : 'Code'}</th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12 }}>{isAr ? 'المريض' : 'Patient'}</th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12 }}>{isAr ? 'الوقت' : 'Time'}</th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12 }}>{isAr ? 'نوع الزيارة' : 'Visit Type'}</th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontSize: 12 }}>{isAr ? 'الشكوى الرئيسية' : 'Chief Complaint'}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12 }}>{isAr ? 'الحالة' : 'Status'}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12 }}>{isAr ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {doctorData?.recentAppointments?.map((appt) => (
                  <tr key={appt.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 12, color: 'var(--brand)' }}>
                      {appt.appointment_code}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      <div>{appt.patient_name}</div>
                      {appt.patient_phone && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{appt.patient_phone}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {appt.start_time?.substring(0, 5)} - {appt.end_time?.substring(0, 5)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12 }}>
                      <Badge variant="neutral">{appt.visit_type}</Badge>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200 }}>
                      {appt.chief_complaint || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <Badge variant={appt.status === 'confirmed' ? 'confirmed' : appt.status === 'completed' ? 'confirmed' : 'pending'}>
                        {appt.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <Link to="/app/records">
                        <Button size="sm" variant="outline" style={{ padding: '4px 10px', fontSize: 11 }}>
                          {isAr ? 'معاينة' : 'Examine'}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
