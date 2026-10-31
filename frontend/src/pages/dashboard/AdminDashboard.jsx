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
  RefreshCwIcon,
} from '../../components/icons';

export default function AdminDashboard() {
  const { user } = useAuth();
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
      const [ovRes, schedRes, patRes, revRes, docRes, stockRes] = await Promise.allSettled([
        dashboardService.getOverview(),
        dashboardService.getTodaySchedule(10),
        dashboardService.getRecentPatients(6),
        dashboardService.getRevenueTrend(),
        dashboardService.getTopDoctors({ limit: 5 }),
        dashboardService.getLowStockAlerts(5),
      ]);

      if (ovRes.status === 'fulfilled') setOverview(ovRes.value);
      if (schedRes.status === 'fulfilled') setTodaySchedule(schedRes.value);
      if (patRes.status === 'fulfilled') setRecentPatients(patRes.value);
      if (revRes.status === 'fulfilled') setRevenueTrend(revRes.value);
      if (docRes.status === 'fulfilled') setTopDoctors(docRes.value);
      if (stockRes.status === 'fulfilled') setLowStock(stockRes.value);
    } catch (err) {
      setError(err.message || 'Failed to load executive dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
      {/* Top Executive Header */}
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
            {timeGreeting}, {user?.name || 'Administrator'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {todayDateFormatted} · {t.dashboard?.subtitle || 'Executive clinic performance & cross-module oversight'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button variant="outline" size="sm" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCwIcon width={14} height={14} className={loading ? 'icon-spin' : ''} />
            <span>
              {loading
                ? t.dashboard?.refreshing || (isAr ? 'جاري التحديث...' : 'Refreshing...')
                : t.dashboard?.refresh || (isAr ? 'تحديث البيانات' : 'Refresh Data')}
            </span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title={isAr ? 'تنبيه' : 'Dashboard Notice'} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Executive KPI Stats */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
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
          value={overview?.activeDoctors ?? '—'}
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

        {overview?.revenue && (
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

      {/* Revenue Charts & Status Breakdown */}
      <div className="grid-2">
        <RevenueChart data={revenueTrend} loading={loading} />
        <StatusBreakdown data={overview?.appointmentsByStatus || {}} loading={loading} />
      </div>

      {/* Operations Grid: Today's Schedule & Side Widgets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.8fr 1.2fr',
          gap: 'var(--sp-6)',
          alignItems: 'start',
        }}
      >
        <div>
          <TodayScheduleWidget schedule={todaySchedule} loading={loading} />
        </div>

        <div className="stack" style={{ gap: 'var(--sp-6)' }}>
          <RecentPatientsWidget patients={recentPatients} loading={loading} />
          <TopDoctorsWidget doctors={topDoctors} loading={loading} />
          <LowStockWidget medications={lowStock} loading={loading} />
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
