import { useLanguage } from '../../i18n/LanguageContext';
import Card from '../common/Card';
import { UsersIcon } from '../icons';

export default function RecentPatientsWidget({ patients = [], loading = false }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  if (loading) {
    return (
      <Card pad className="stack">
        <div className="skel" style={{ width: '50%', height: 20 }} />
        <div className="skel" style={{ width: '100%', height: 48, marginTop: 12 }} />
        <div className="skel" style={{ width: '100%', height: 48 }} />
        <div className="skel" style={{ width: '100%', height: 48 }} />
      </Card>
    );
  }

  const hasItems = Array.isArray(patients) && patients.length > 0;

  return (
    <Card pad>
      <div style={{ marginBottom: 18 }}>
        <div className="eyebrow">{t.dashboard?.recentPatientsTitle || 'Recent Patients'}</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
          {t.dashboard?.recentPatientsSubtitle || 'Newly registered clinic files'}
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
          {t.dashboard?.noRecentPatients || 'No recent patient records found.'}
        </div>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {patients.map((pat) => {
            const initials = pat.full_name
              ? pat.full_name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'P';

            const createdDate = pat.created_at
              ? new Date(pat.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : '';

            return (
              <div
                key={pat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--bg-surface-alt)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'transform var(--dur) var(--ease)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: 'var(--brand-soft)',
                      color: 'var(--brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 12,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {pat.full_name}
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {pat.patient_code || pat.phone || '--'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'end', flexShrink: 0, marginInlineStart: 12 }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {createdDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
