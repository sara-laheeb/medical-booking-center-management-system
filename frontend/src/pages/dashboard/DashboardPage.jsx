/**
 * Dashboard Page
 * Main overview screen showing key clinic statistics, appointment trends,
 * revenue charts, today's schedule, recent patients, top doctors, and low-stock alerts.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import dashboardService from '../../services/dashboardService';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/Button';
import Alert from '../../components/common/Alert';
import RevenueChart from '../../components/dashboard/RevenueChart';
import StatusBreakdown from '../../components/dashboard/StatusBreakdown';
import TodayScheduleWidget from '../../components/dashboard/TodayScheduleWidget';
import RecentPatientsWidget from '../../components/dashboard/RecentPatientsWidget';
import LowStockWidget from '../../components/dashboard/LowStockWidget';
import TopDoctorsWidget from '../../components/dashboard/TopDoctorsWidget';
import {
  CalendarIcon,
  UsersIcon,
  StethoscopeIcon,
  ChartIcon,
  InvoiceIcon,
  ShieldIcon,
} from '../../components/icons';

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live state from backend
  const [overview, setOverview] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Determine requests based on user role to respect permissions
      const requests = [];

      // 1. Overview (admin only)
      if (role === 'admin') {
        requests.push(
          dashboardService.getOverview().then((data) => ({ type: 'overview', data }))
        );
        requests.push(
          dashboardService.getRevenueTrend().then((data) => ({ type: 'revenueTrend', data }))
        );
        requests.push(
          dashboardService.getTopDoctors({ limit: 5 }).then((data) => ({ type: 'topDoctors', data }))
        );
        requests.push(
          dashboardService.getLowStockAlerts(5).then((data) => ({ type: 'lowStock', data }))
        );
      }

      // 2. Today's schedule (admin, doctor, receptionist)
      if (['admin', 'doctor', 'receptionist', 'patient'].includes(role)) {
        requests.push(
          dashboardService.getTodaySchedule(10).then((data) => ({ type: 'todaySchedule', data }))
        );
      }

      // 3. Recent patients (admin, receptionist)
      if (['admin', 'receptionist'].includes(role)) {
        requests.push(
          dashboardService.getRecentPatients(6).then((data) => ({ type: 'recentPatients', data }))
        );
      }

      const results = await Promise.allSettled(requests);

      results.forEach((res) => {
        if (res.status === 'fulfilled') {
          const { type, data } = res.value;
          if (type === 'overview') setOverview(data);
          if (type === 'todaySchedule') setTodaySchedule(data);
          if (type === 'recentPatients') setRecentPatients(data);
          if (type === 'revenueTrend') setRevenueTrend(data);
          if (type === 'topDoctors') setTopDoctors(data);
          if (type === 'lowStock') setLowStock(data);
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derive time-of-day greeting
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12
      ? isAr ? 'صباح الخير' : 'Good morning'
      : hour < 17
      ? isAr ? 'مساء الخير' : 'Good afternoon'
      : isAr ? 'مساء النور' : 'Good evening';

  const todayDateFormatted = new Date().toLocaleDateString(
    isAr ? 'ar-IQ' : 'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  return (
    <div className="stack" style={{ gap: 'var(--sp-8)' }}>
      {/* Dashboard Top Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div className="eyebrow">{t.appNav?.branchTag || 'Baghdad · Main Branch'}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
            {timeGreeting}, {user?.name || 'Doctor'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {todayDateFormatted} · {t.dashboard?.subtitle || 'Real-time performance metrics and schedule monitoring'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            {loading ? '...' : `↻ ${t.dashboard?.refresh || 'Refresh data'}`}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Dashboard Notice">
          {error}
        </Alert>
      )}

      {/* KPI Stat Cards Row */}
      <div className="grid-3" style={{ gridTemplateColumns: role === 'admin' ? 'repeat(auto-fit, minmax(220px, 1fr))' : 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <StatCard
          icon={<CalendarIcon width={20} height={20} />}
          value={overview?.appointmentsToday ?? todaySchedule.length}
          label={t.dashboard?.todayAppointments || 'Appointments Today'}
          delta={isAr ? 'مواعيد مسجلة اليوم' : 'Bookings scheduled today'}
          trend="up"
          sparkline
        />

        <StatCard
          icon={<UsersIcon width={20} height={20} />}
          value={overview?.totalPatients ?? recentPatients.length}
          label={t.dashboard?.totalPatients || 'Registered Patients'}
          delta={isAr ? 'إجمالي الملفات النشطة' : 'Active clinical patient files'}
          trend="up"
        />

        <StatCard
          icon={<StethoscopeIcon width={20} height={20} />}
          value={overview?.activeDoctors ?? (role === 'doctor' ? 1 : '—')}
          label={t.dashboard?.activeDoctors || 'Doctors on Duty'}
          delta={isAr ? 'طاقم طبي متاح' : 'On-duty medical staff'}
          trend="neutral"
        />

        <StatCard
          icon={<ChartIcon width={20} height={20} />}
          value={overview?.pendingAppointments ?? 0}
          label={t.dashboard?.pendingAppointments || 'Pending Requests'}
          delta={isAr ? 'بانتظار التأكيد' : 'Awaiting confirmation'}
          trend={overview?.pendingAppointments > 0 ? 'down' : 'up'}
        />

        {role === 'admin' && overview?.revenue && (
          <>
            <StatCard
              icon={<InvoiceIcon width={20} height={20} />}
              value={`${overview.revenue.collectedToday.toLocaleString()} ${t.dashboard?.iqd || 'IQD'}`}
              label={t.dashboard?.revenueToday || 'Collected Today'}
              delta={isAr ? 'تحصيلات نقدية لليوم' : 'Daily cash inflows'}
              trend="up"
              featured
              featuredTag="TODAY"
            />
            <StatCard
              icon={<ShieldIcon width={20} height={20} />}
              value={`${overview.revenue.collectedThisMonth.toLocaleString()} ${t.dashboard?.iqd || 'IQD'}`}
              label={t.dashboard?.revenueMonth || 'Collected This Month'}
              delta={`${t.dashboard?.outstandingBalance || 'Outstanding'}: ${overview.revenue.totalOutstanding.toLocaleString()} ${t.dashboard?.iqd || 'IQD'}`}
              trend="up"
            />
          </>
        )}
      </div>

      {/* Visual Analytics Row (for Admin) */}
      {role === 'admin' && (
        <div className="grid-2">
          <RevenueChart data={revenueTrend} loading={loading} />
          <StatusBreakdown
            data={overview?.appointmentsByStatus || {}}
            loading={loading}
          />
        </div>
      )}

      {/* Operations Grid: Today's Schedule & Side Widgets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: role === 'admin' || role === 'receptionist' ? '1.8fr 1.2fr' : '1fr',
          gap: 'var(--sp-6)',
          alignItems: 'start',
        }}
      >
        {/* Today's Schedule (Primary Widget) */}
        <div>
          <TodayScheduleWidget schedule={todaySchedule} loading={loading} />
        </div>

        {/* Side Panels */}
        <div className="stack" style={{ gap: 'var(--sp-6)' }}>
          {['admin', 'receptionist'].includes(role) && (
            <RecentPatientsWidget patients={recentPatients} loading={loading} />
          )}

          {role === 'admin' && (
            <>
              <TopDoctorsWidget doctors={topDoctors} loading={loading} />
              <LowStockWidget medications={lowStock} loading={loading} />
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          div[style*="gridTemplateColumns: 1.8fr 1.2fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
