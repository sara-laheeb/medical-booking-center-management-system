import { useState } from 'react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/Button';
import { useLanguage } from '../../../i18n/LanguageContext';

// Standard FDI two-digit notation for adult teeth:
// Upper: 18 to 11 (Right to Midline), 21 to 28 (Midline to Left)
// Lower: 48 to 41 (Right to Midline), 31 to 38 (Midline to Left)
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const STATUS_COLORS = {
  healthy: { bg: 'var(--brand-soft)', border: 'var(--brand)', text: 'var(--brand-dark)' },
  caries: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#b91c1c' },
  filling: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#1d4ed8' },
  missing: { bg: 'var(--bg-subtle)', border: 'var(--border)', text: 'var(--text-muted)' },
  crown: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#b45309' },
};

export default function DentalSuite({ patientName, onSaveSpecialtyExam, savingExam }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [selectedTooth, setSelectedTooth] = useState(16);
  const [teethState, setTeethState] = useState({
    16: { status: 'caries', note: 'Mesial caries noted' },
    21: { status: 'filling', note: 'Composite restoration (2025)' },
    36: { status: 'crown', note: 'Porcelain fused to metal' },
    48: { status: 'missing', note: 'Extracted third molar' },
  });

  const [procedures, setProcedures] = useState([
    { id: 1, name: isAr ? 'تنظيف وتلميع الأسنان' : 'Scaling & Polishing', done: true },
    { id: 2, name: isAr ? 'حشوة كمبوزيت تجميلية للسن 16' : 'Composite Filling (Tooth 16)', done: false },
    { id: 3, name: isAr ? 'فحص أشعة سينية ذروية (Periapical X-Ray)' : 'Periapical X-Ray Evaluation', done: true },
    { id: 4, name: isAr ? 'علاج جذور وعصب للسن 36' : 'Root Canal Therapy (Tooth 36)', done: false },
  ]);

  const [hygieneScore, setHygieneScore] = useState('Good');

  const updateToothStatus = (status) => {
    setTeethState((prev) => ({
      ...prev,
      [selectedTooth]: { ...(prev[selectedTooth] || {}), status },
    }));
  };

  const toggleProcedure = (id) => {
    setProcedures((prev) =>
      prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p))
    );
  };

  const currentToothData = teethState[selectedTooth] || { status: 'healthy', note: '' };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🦷</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {t.dashboard?.dentalTitle || 'Interactive Odontogram & Dental Procedures'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>
              {t.dashboard?.dentalSubtitle || 'Select teeth to chart pathology, treatments, and procedures'}
              {patientName ? ` · ${isAr ? 'المريض' : 'Patient'}: ${patientName}` : ''}
            </div>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Arch Visual Odontogram */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--r-lg)',
            padding: 16,
            border: '1px solid var(--border)',
            overflowX: 'auto',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
            ▲ {t.dashboard?.upperArch || 'Upper Arch (Maxillary)'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16, flexWrap: 'nowrap' }}>
            {UPPER_TEETH.map((tooth) => {
              const info = teethState[tooth] || { status: 'healthy' };
              const colors = STATUS_COLORS[info.status] || STATUS_COLORS.healthy;
              const isSelected = selectedTooth === tooth;

              return (
                <button
                  key={tooth}
                  type="button"
                  onClick={() => setSelectedTooth(tooth)}
                  style={{
                    width: 36,
                    height: 48,
                    borderRadius: 6,
                    border: `2px solid ${isSelected ? 'var(--brand)' : colors.border}`,
                    background: colors.bg,
                    color: colors.text,
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: 11,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 2px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 2px var(--brand-soft)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title={`Tooth #${tooth} (${info.status})`}
                >
                  <span>{tooth}</span>
                  <span style={{ fontSize: 9 }}>
                    {info.status === 'healthy' ? '✓' : info.status === 'caries' ? '✕' : info.status === 'filling' ? '●' : info.status === 'crown' ? '▲' : '–'}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
            ▼ {t.dashboard?.lowerArch || 'Lower Arch (Mandibular)'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'nowrap' }}>
            {LOWER_TEETH.map((tooth) => {
              const info = teethState[tooth] || { status: 'healthy' };
              const colors = STATUS_COLORS[info.status] || STATUS_COLORS.healthy;
              const isSelected = selectedTooth === tooth;

              return (
                <button
                  key={tooth}
                  type="button"
                  onClick={() => setSelectedTooth(tooth)}
                  style={{
                    width: 36,
                    height: 48,
                    borderRadius: 6,
                    border: `2px solid ${isSelected ? 'var(--brand)' : colors.border}`,
                    background: colors.bg,
                    color: colors.text,
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: 11,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 2px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 2px var(--brand-soft)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title={`Tooth #${tooth} (${info.status})`}
                >
                  <span style={{ fontSize: 9 }}>
                    {info.status === 'healthy' ? '✓' : info.status === 'caries' ? '✕' : info.status === 'filling' ? '●' : info.status === 'crown' ? '▲' : '–'}
                  </span>
                  <span>{tooth}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Tooth Control Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {isAr ? `السن المحدد: #${selectedTooth}` : `Selected Tooth #${selectedTooth}`}
            </span>
            <Badge variant={currentToothData.status === 'healthy' ? 'confirmed' : currentToothData.status === 'caries' ? 'cancelled' : 'pending'}>
              {currentToothData.status.toUpperCase()}
            </Badge>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Button
              size="sm"
              variant={currentToothData.status === 'healthy' ? 'primary' : 'outline'}
              onClick={() => updateToothStatus('healthy')}
            >
              ✓ {t.dashboard?.healthy || 'Healthy'}
            </Button>
            <Button
              size="sm"
              variant={currentToothData.status === 'caries' ? 'primary' : 'outline'}
              onClick={() => updateToothStatus('caries')}
            >
              ✕ {t.dashboard?.caries || 'Caries'}
            </Button>
            <Button
              size="sm"
              variant={currentToothData.status === 'filling' ? 'primary' : 'outline'}
              onClick={() => updateToothStatus('filling')}
            >
              ● {t.dashboard?.restoration || 'Filling'}
            </Button>
            <Button
              size="sm"
              variant={currentToothData.status === 'crown' ? 'primary' : 'outline'}
              onClick={() => updateToothStatus('crown')}
            >
              ▲ {t.dashboard?.crown || 'Crown'}
            </Button>
            <Button
              size="sm"
              variant={currentToothData.status === 'missing' ? 'primary' : 'outline'}
              onClick={() => updateToothStatus('missing')}
            >
              – {t.dashboard?.missing || 'Missing'}
            </Button>
          </div>
        </div>

        {/* Two-Column Clinical Sub-Panels: Procedures & Hygiene */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Quick Procedure Checklist */}
          <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span>{t.dashboard?.quickProcedures || 'Rapid Procedure Log'}</span>
              <span style={{ fontSize: 11, color: 'var(--brand)' }}>
                {procedures.filter((p) => p.done).length} / {procedures.length} {isAr ? 'مكتمل' : 'done'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {procedures.map((p) => (
                <label
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: p.done ? 'var(--brand-soft)' : 'transparent',
                    textDecoration: p.done ? 'line-through' : 'none',
                    color: p.done ? 'var(--text-secondary)' : 'var(--ink)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={p.done}
                    onChange={() => toggleProcedure(p.id)}
                    style={{ accentColor: 'var(--brand)' }}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Periodontal & Hygiene Assessment */}
          <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              {t.dashboard?.periodontal || 'Periodontal Screening & Hygiene'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.dashboard?.plaque || 'Plaque Index'}:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>12% (Acceptable)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{t.dashboard?.bleeding || 'Gingival Bleeding'}:</span>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>Localized (Lower Molars)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'الحالة العامة لنظافة الفم' : 'Oral Hygiene Status'}:</span>
                <select
                  value={hygieneScore}
                  onChange={(e) => setHygieneScore(e.target.value)}
                  className="input"
                  style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
                >
                  <option value="Excellent">{isAr ? 'ممتاز' : 'Excellent'}</option>
                  <option value="Good">{isAr ? 'جيد' : 'Good'}</option>
                  <option value="Fair">{isAr ? 'متوسط' : 'Fair'}</option>
                  <option value="Poor">{isAr ? 'يحتاج عناية' : 'Needs Care'}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {onSaveSpecialtyExam && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 14,
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {isAr
                ? 'توثيق نتائج المخطط السني والإجراءات مباشرة في السجل الطبي للمريض'
                : 'Persist odontogram findings and procedure checklist to patient medical record in database'}
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={savingExam}
              onClick={() =>
                onSaveSpecialtyExam({
                  diagnosis: isAr ? 'فحص مخطط الأسنان وتقييم صحة الفم' : 'Dental Odontogram & Periodontal Evaluation',
                  treatment_plan: isAr ? 'متابعة الإجراءات العلاجية والحشوات المحددة' : 'Scheduled restorations and root canal therapy',
                  specialty_data: {
                    specialty: 'dental',
                    teethState,
                    procedures,
                    hygieneScore,
                    savedAt: new Date().toISOString(),
                  },
                })
              }
            >
              <span>💾 {savingExam ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ وتوثيق الفحص السريري' : 'Save Clinical Examination')}</span>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
