import { useLanguage } from '../../i18n/LanguageContext';
import Card from '../common/Card';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { CalendarIcon } from '../icons';

export default function TodayScheduleWidget({ schedule = [], loading = false }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  if (loading) {
    return (
      <Card pad className="stack">
        <div className="skel" style={{ width: '40%', height: 20 }} />
        <div className="skel" style={{ width: '100%', height: 48, marginTop: 16 }} />
        <div className="skel" style={{ width: '100%', height: 48 }} />
        <div className="skel" style={{ width: '100%', height: 48 }} />
      </Card>
    );
  }

  const hasItems = Array.isArray(schedule) && schedule.length > 0;

  return (
    <Card>
      <div
        style={{
          padding: 'var(--sp-5) var(--sp-6)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div className="eyebrow">{t.dashboard?.todayScheduleTitle || "Today's Clinical Schedule"}</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
            {t.dashboard?.todayScheduleSubtitle || 'Real-time queue and appointment slots'}
          </h3>
        </div>

        <Badge variant="confirmed">
          {schedule.length} {t.dashboard?.todayAppointments || 'Appointments'}
        </Badge>
      </div>

      {!hasItems ? (
        <EmptyState
          icon={<CalendarIcon width={28} height={28} />}
          title={t.dashboard?.noScheduleToday || 'No appointments scheduled for today yet.'}
          description={
            isAr
              ? 'جدول مواعيد العيادة لهذا اليوم فارغ. ستظهر الحجوزات والمراجعات هنا تلقائياً.'
              : "No clinic visits are booked for today. New bookings will automatically populate here."
          }
        />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>{t.dashboard?.timeSlot || 'Time'}</th>
                <th>{t.dashboard?.patient || 'Patient'}</th>
                <th>{t.dashboard?.doctor || 'Doctor'}</th>
                <th>{isAr ? 'نوع الزيارة' : 'Visit Type'}</th>
                <th>{t.dashboard?.status || 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => {
                const initials = item.patient_name
                  ? item.patient_name
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'P';

                const timeDisplay = item.start_time
                  ? item.start_time.slice(0, 5)
                  : '--:--';

                return (
                  <tr key={item.id}>
                    <td>
                      <div
                        className="mono"
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: 'var(--brand)',
                          background: 'var(--brand-soft)',
                          padding: '3px 8px',
                          borderRadius: 'var(--r-sm)',
                          display: 'inline-block',
                        }}
                      >
                        {timeDisplay}
                      </div>
                    </td>
                    <td>
                      <div className="cell-name">
                        <div className="cell-avatar">{initials}</div>
                        <div>
                          <div className="cell-name-meta">{item.patient_name}</div>
                          <div className="cell-sub mono">{item.appointment_code}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{item.doctor_name}</span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {item.visit_type || 'consultation'}
                      </span>
                    </td>
                    <td>
                      <Badge variant={item.status || 'confirmed'}>
                        {item.status || 'Confirmed'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
