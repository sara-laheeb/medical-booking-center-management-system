/**
 * App Overview / Home Page (Authenticated Shell)
 * Shows a quick-access welcome screen with module navigation cards
 * (Appointments, Patients, Doctors) for authenticated users after login.
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import Card, { AccentCard } from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  CalendarIcon,
  UsersIcon,
  StethoscopeIcon,
  InvoiceIcon,
  ShieldIcon,
  MedicalCrossIcon,
} from '../../components/icons';

export default function AppOverviewPage() {
  const { user, role } = useAuth();
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const roleName =
    role && t.auth?.[`role${role.charAt(0).toUpperCase() + role.slice(1)}`]
      ? t.auth[`role${role.charAt(0).toUpperCase() + role.slice(1)}`]
      : role || 'Staff';

  const modules = [
    {
      title: t.appNav?.appointments || 'Appointments',
      desc: isAr
        ? 'إدارة جدول المواعيد، الحجوزات اليومية، وتأكيد الحضور.'
        : 'Manage schedules, daily bookings, and patient check-ins.',
      to: '/app/appointments',
      icon: <CalendarIcon width={20} height={20} />,
      status: 'confirmed',
      statusLabel: isAr ? 'نشط' : 'Active',
      roles: ['admin', 'doctor', 'receptionist', 'patient'],
    },
    {
      title: t.appNav?.patients || 'Patients',
      desc: isAr
        ? 'سجلات المرضى، بيانات الاتصال، وتاريخ المراجعات.'
        : 'Patient directory, contact information, and consultation history.',
      to: '/app/patients',
      icon: <UsersIcon width={20} height={20} />,
      status: 'confirmed',
      statusLabel: isAr ? 'نشط' : 'Active',
      roles: ['admin', 'doctor', 'receptionist'],
    },
    {
      title: t.appNav?.doctors || 'Doctors',
      desc: isAr
        ? 'قائمة الأطباء، التخصصات الطبية، وجداول المناوبة.'
        : 'Medical staff directory, specialties, and on-duty schedules.',
      to: '/app/doctors',
      icon: <StethoscopeIcon width={20} height={20} />,
      status: 'confirmed',
      statusLabel: isAr ? 'نشط' : 'Active',
      roles: ['admin', 'doctor', 'receptionist', 'patient'],
    },
    {
      title: t.appNav?.records || 'Medical Records',
      desc: isAr
        ? 'الملفات الطبية، التشخيص، الفحوصات والتقارير المخبرية.'
        : 'Clinical documentation, diagnoses, lab tests, and clinical notes.',
      to: '/app/records',
      icon: <ShieldIcon width={20} height={20} />,
      status: 'confirmed',
      statusLabel: isAr ? 'نشط' : 'Active',
      roles: ['admin', 'doctor', 'receptionist', 'patient'],
    },
    {
      title: t.appNav?.pharmacy || 'Pharmacy & Prescriptions',
      desc: isAr
        ? 'كتالوج الأدوية، الوصفات الطبية، ومتابعة الصرف.'
        : 'Medication catalog, electronic prescriptions, and dispensing.',
      to: '/app/pharmacy',
      icon: <MedicalCrossIcon width={20} height={20} />,
      status: 'confirmed',
      statusLabel: isAr ? 'نشط' : 'Active',
      roles: ['admin', 'doctor', 'pharmacist'],
    },
    {
      title: t.appNav?.invoices || 'Invoices & Billing',
      desc: isAr
        ? 'فواتير الخدمات، الدفعات النقدية، وإيصالات القبض.'
        : 'Service invoices, payment records, and receipts.',
      to: '/app/billing',
      icon: <InvoiceIcon width={20} height={20} />,
      status: 'confirmed',
      statusLabel: isAr ? 'نشط' : 'Active',
      roles: ['admin', 'receptionist', 'patient'],
    },
  ];

  const visibleModules = modules.filter(
    (m) => !m.roles || m.roles.includes(role || 'patient')
  );

  return (
    <div className="stack" style={{ gap: 'var(--sp-8)' }}>
      {/* Welcome Banner */}
      <div
        className="card pad"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 60%, var(--brand-soft))',
          borderColor: 'rgba(15, 110, 100, 0.18)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="eyebrow">{t.appNav?.branchTag || 'Baghdad · Main Branch'}</div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--ink)' }}>
              {t.appNav?.welcome || 'Welcome back'}, {user?.name || 'Doctor / Staff'}
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: 6, maxWidth: 640 }}>
              {t.appNav?.phaseIntro ||
                'Phase 1 Active: App Shell & Authentication verified with live backend session.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge variant="brand">{roleName}</Badge>
            <Badge variant="confirmed">
              {isAr ? 'الجلسة متصلة' : 'Live Session'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid-3">
        <StatCard
          icon={<span>👤</span>}
          value={user?.name?.split(' ')[0] || 'User'}
          label={user?.email}
          delta={`${t.auth?.role || 'Role'}: ${roleName}`}
          trend="up"
        />
        <StatCard
          icon={<span>🔒</span>}
          value="JWT Bearer"
          label={isAr ? 'حالة المصادقة والتفويض' : 'Authentication Status'}
          delta={isAr ? 'مشفر ومتحقق منه' : 'Verified by backend /auth/me'}
          trend="up"
        />
        <StatCard
          icon={<span>🏥</span>}
          value="Baghdad Central"
          label={isAr ? 'المركز الطبي والفرع' : 'Medical Center & Branch'}
          delta="MediCare SaaS v2.0"
          trend="up"
          featured
          featuredTag="ONLINE"
        />
      </div>

      {/* Operations Quick Launch Grid */}
      <div>
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <div className="eyebrow">{isAr ? 'الوصول السريع' : 'Navigation'}</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>
            {isAr ? 'وحدات المنظومة الطبية' : 'Clinical Workspace Modules'}
          </h2>
        </div>

        <div className="grid-3">
          {visibleModules.map((m) => (
            <Link key={m.title} to={m.to} style={{ textDecoration: 'none' }}>
              <AccentCard
                status={m.status}
                avatar={m.icon}
                title={m.title}
                subtitle={m.desc}
                meta={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--brand)', fontWeight: 600 }}>
                    {isAr ? 'فتح الوحدة' : 'Open Module'} →
                  </span>
                }
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
