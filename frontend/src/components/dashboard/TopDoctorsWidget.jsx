import { useLanguage } from '../../i18n/LanguageContext';
import Card from '../common/Card';
import { StethoscopeIcon } from '../icons';

export default function TopDoctorsWidget({ doctors = [], loading = false }) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card pad className="stack">
        <div className="skel" style={{ width: '45%', height: 20 }} />
        <div className="skel" style={{ width: '100%', height: 44, marginTop: 12 }} />
        <div className="skel" style={{ width: '100%', height: 44 }} />
      </Card>
    );
  }

  const hasItems = Array.isArray(doctors) && doctors.length > 0;
  const maxCount = hasItems ? Math.max(...doctors.map((d) => Number(d.appointment_count) || 0), 1) : 1;

  return (
    <Card pad>
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow">{t.dashboard?.topDoctorsTitle || 'Top Active Clinicians'}</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
          {t.dashboard?.topDoctorsSubtitle || 'Ranked by consultations'}
        </h3>
      </div>

      {!hasItems ? (
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
          {t.dashboard?.noScheduleToday || 'No consultation history recorded yet.'}
        </div>
      ) : (
        <div className="stack" style={{ gap: 12 }}>
          {doctors.map((doc, idx) => {
            const count = Number(doc.appointment_count) || 0;
            const barWidth = Math.max(12, Math.round((count / maxCount) * 100));

            return (
              <div key={doc.doctor_id || idx} className="stack" style={{ gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: idx === 0 ? 'var(--a-500)' : 'var(--brand-soft)',
                        color: idx === 0 ? '#fff' : 'var(--brand)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                      {doc.doctor_name}
                    </span>
                  </div>

                  <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>
                    {count} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>{t.dashboard?.consultations || 'consults'}</span>
                  </div>
                </div>

                <div
                  style={{
                    height: 6,
                    borderRadius: 'var(--r-full)',
                    background: 'var(--bg-surface-alt)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      borderRadius: 'var(--r-full)',
                      background: idx === 0
                        ? 'linear-gradient(90deg, var(--p-500), var(--a-500))'
                        : 'linear-gradient(90deg, var(--p-400), var(--brand))',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
