import { useLanguage } from '../../i18n/LanguageContext';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function StatusBreakdown({ data = {}, loading = false }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  if (loading) {
    return (
      <Card pad className="stack">
        <div className="skel" style={{ width: '50%', height: 20 }} />
        <div className="skel" style={{ width: '30%', height: 14 }} />
        <div className="skel" style={{ width: '100%', height: 24, marginTop: 16 }} />
        <div className="skel" style={{ width: '100%', height: 60, marginTop: 12 }} />
      </Card>
    );
  }

  const statuses = [
    { key: 'confirmed', label: isAr ? 'مؤكد' : 'Confirmed', variant: 'confirmed', color: 'var(--success-500)' },
    { key: 'pending', label: isAr ? 'قيد الانتظار' : 'Pending', variant: 'pending', color: 'var(--warning-500)' },
    { key: 'completed', label: isAr ? 'مكتمل' : 'Completed', variant: 'completed', color: 'var(--n-500)' },
    { key: 'cancelled', label: isAr ? 'ملغى' : 'Cancelled', variant: 'cancelled', color: 'var(--error-500)' },
  ];

  const total = Object.values(data).reduce((acc, count) => acc + (Number(count) || 0), 0);

  return (
    <Card pad>
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow">{t.dashboard?.statusBreakdownTitle || 'Appointment Status'}</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
          {t.dashboard?.statusBreakdownSubtitle || 'Distribution across recorded bookings'}
        </h3>
      </div>

      {total === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 13,
            background: 'var(--bg-surface-alt)',
            borderRadius: 'var(--r-md)',
          }}
        >
          {t.dashboard?.noScheduleToday || 'No appointment records available yet.'}
        </div>
      ) : (
        <div className="stack" style={{ gap: 16 }}>
          {/* Segmented multi-color progress bar */}
          <div
            style={{
              display: 'flex',
              height: 12,
              borderRadius: 'var(--r-full)',
              overflow: 'hidden',
              background: 'var(--bg-surface-alt)',
              gap: 2,
            }}
          >
            {statuses.map((s) => {
              const count = Number(data[s.key]) || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={s.key}
                  style={{
                    width: `${pct}%`,
                    background: s.color,
                    borderRadius: 2,
                    transition: 'width 0.5s ease',
                  }}
                  title={`${s.label}: ${count} (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>

          {/* Metric Badges Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            {statuses.map((s) => {
              const count = Number(data[s.key]) || 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div
                  key={s.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--bg-surface-alt)',
                  }}
                >
                  <Badge variant={s.variant}>{s.label}</Badge>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                      {count}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
