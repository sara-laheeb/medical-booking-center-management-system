import { useLanguage } from '../../i18n/LanguageContext';
import Card from '../common/Card';
import Badge from '../common/Badge';

export default function LowStockWidget({ medications = [], loading = false }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  if (loading) {
    return (
      <Card pad className="stack">
        <div className="skel" style={{ width: '45%', height: 20 }} />
        <div className="skel" style={{ width: '100%', height: 44, marginTop: 12 }} />
        <div className="skel" style={{ width: '100%', height: 44 }} />
      </Card>
    );
  }

  const hasItems = Array.isArray(medications) && medications.length > 0;

  return (
    <Card pad>
      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="eyebrow">{t.dashboard?.lowStockTitle || 'Low Stock Pharmacy Alerts'}</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
            {t.dashboard?.lowStockSubtitle || 'Medications requiring replenishment'}
          </h3>
        </div>
        {hasItems && <Badge variant="cancelled">{medications.length}</Badge>}
      </div>

      {!hasItems ? (
        <div
          style={{
            padding: 20,
            textAlign: 'center',
            color: 'var(--success-700)',
            background: 'var(--success-100)',
            borderRadius: 'var(--r-md)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span>✓</span>
          <span>
            {t.dashboard?.allStockSafe || 'All pharmacy stocks are currently within healthy thresholds.'}
          </span>
        </div>
      ) : (
        <div className="stack" style={{ gap: 10 }}>
          {medications.map((med) => {
            const medName = isAr && med.name_ar ? med.name_ar : med.name;
            const isCritical = (Number(med.stock_quantity) || 0) <= Math.floor((Number(med.minimum_stock) || 1) / 2);

            return (
              <div
                key={med.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--r-md)',
                  background: isCritical ? 'color-mix(in srgb, var(--error-100) 60%, transparent)' : 'var(--bg-surface-alt)',
                  border: isCritical ? '1px solid var(--error-500)' : '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                    {medName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {t.dashboard?.minimum || 'Minimum'}: {med.minimum_stock} {med.unit || t.dashboard?.unit || 'unit'}
                  </div>
                </div>

                <div style={{ textAlign: 'end' }}>
                  <Badge variant={isCritical ? 'cancelled' : 'pending'}>
                    {med.stock_quantity} {med.unit || ''}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
