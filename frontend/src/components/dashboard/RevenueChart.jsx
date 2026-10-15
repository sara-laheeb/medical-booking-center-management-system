import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import Card from '../common/Card';

export default function RevenueChart({ data = [], loading = false }) {
  const { t } = useLanguage();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (loading) {
    return (
      <Card pad className="stack">
        <div className="skel" style={{ width: '40%', height: 20 }} />
        <div className="skel" style={{ width: '25%', height: 14 }} />
        <div className="skel" style={{ width: '100%', height: 180, marginTop: 16 }} />
      </Card>
    );
  }

  const hasData = Array.isArray(data) && data.length > 0;
  const maxVal = hasData ? Math.max(...data.map((d) => Number(d.collected) || 0), 1) : 1;
  const totalPeriod = hasData
    ? data.reduce((acc, d) => acc + (Number(d.collected) || 0), 0)
    : 0;

  return (
    <Card pad style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div className="eyebrow">{t.dashboard?.revenueTrendTitle || 'Daily Revenue Trend'}</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
            {t.dashboard?.revenueTrendSubtitle || 'Collections over recent days'}
          </h3>
        </div>

        <div style={{ textAlign: 'end' }}>
          <div className="mono" style={{ fontSize: 17, fontWeight: 800, color: 'var(--brand)' }}>
            {totalPeriod.toLocaleString()} {t.dashboard?.iqd || 'IQD'}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {t.dashboard?.verifiedLive || 'Verified Live API'}
          </span>
        </div>
      </div>

      {!hasData ? (
        <div
          style={{
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            fontSize: 13,
            background: 'var(--bg-surface-alt)',
            borderRadius: 'var(--r-md)',
          }}
        >
          {t.dashboard?.noRecentPatients || 'No collection transactions recorded yet.'}
        </div>
      ) : (
        <div style={{ width: '100%', marginTop: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              height: 180,
              gap: 8,
              paddingBottom: 24,
              borderBottom: '1px solid var(--border-subtle)',
              position: 'relative',
            }}
          >
            {data.map((item, idx) => {
              const amount = Number(item.collected) || 0;
              const heightPct = Math.max(10, Math.round((amount / maxVal) * 100));
              const isHovered = hoveredIdx === idx;
              const isPeak = amount === maxVal && amount > 0;

              // Format date cleanly
              const dateStr = item.date ? item.date.slice(5) : `#${idx + 1}`;

              return (
                <div
                  key={item.date || idx}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: `${heightPct + 12}%`,
                        background: 'var(--n-900)',
                        color: '#fff',
                        padding: '5px 9px',
                        borderRadius: 6,
                        fontSize: 11,
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        boxShadow: 'var(--shadow-md)',
                        pointerEvents: 'none',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{item.date}</div>
                      <div className="mono" style={{ color: 'var(--p-300)' }}>
                        {amount.toLocaleString()} {t.dashboard?.iqd || 'IQD'}
                      </div>
                    </div>
                  )}

                  {/* Bar */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 36,
                      height: `${heightPct}%`,
                      borderRadius: '6px 6px 2px 2px',
                      background: isPeak
                        ? 'linear-gradient(180deg, var(--a-400), var(--a-600))'
                        : isHovered
                        ? 'linear-gradient(180deg, var(--p-300), var(--brand))'
                        : 'linear-gradient(180deg, var(--p-400), var(--brand))',
                      boxShadow: isHovered ? '0 0 12px rgba(15,110,100,0.35)' : 'none',
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                    }}
                  />

                  {/* Date label underneath */}
                  <span
                    className="mono"
                    style={{
                      position: 'absolute',
                      bottom: -20,
                      fontSize: 10.5,
                      color: isHovered ? 'var(--brand)' : 'var(--text-secondary)',
                      fontWeight: isHovered ? 700 : 500,
                    }}
                  >
                    {dateStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
