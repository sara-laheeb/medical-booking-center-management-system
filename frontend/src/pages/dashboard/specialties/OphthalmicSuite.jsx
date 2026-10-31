import { useState } from 'react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/Button';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function OphthalmicSuite({ patientName, onSaveSpecialtyExam, savingExam }) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [vaRight, setVaRight] = useState('20/20');
  const [vaLeft, setVaLeft] = useState('20/30');

  const [iopRight, setIopRight] = useState(15);
  const [iopLeft, setIopLeft] = useState(16);

  const [sphRight, setSphRight] = useState('-1.25');
  const [cylRight, setCylRight] = useState('-0.50');
  const [axisRight, setAxisRight] = useState('90');

  const [sphLeft, setSphLeft] = useState('-1.50');
  const [cylLeft, setCylLeft] = useState('-0.75');
  const [axisLeft, setAxisLeft] = useState('85');

  const [exams, setExams] = useState([
    { id: 'slitLamp', label: isAr ? 'فحص المصباح الشقي (القرنية والعدسة)' : 'Slit Lamp (Cornea & Lens)', status: 'normal' },
    { id: 'fundus', label: isAr ? 'فحص قاع العين والقرص البصري' : 'Fundus & Optic Nerve Head', status: 'normal' },
    { id: 'macula', label: isAr ? 'فحص لطخة الشبكية (Macula)' : 'Macular Evaluation', status: 'normal' },
    { id: 'dryEye', label: isAr ? 'اختبار جفاف العين وزمن تفكك الدمع' : 'Tear Break-up Time (TBUT)', status: 'abnormal' },
  ]);

  const toggleExamStatus = (id) => {
    setExams((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: e.status === 'normal' ? 'abnormal' : 'normal' } : e
      )
    );
  };

  const isIopHigh = iopRight > 21 || iopLeft > 21;

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>👁</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {t.dashboard?.eyeTitle || 'Visual Acuity & Refraction Station'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>
              {t.dashboard?.eyeSubtitle || 'Record visual acuity, intraocular pressure (IOP), and slit lamp exam'}
              {patientName ? ` · ${isAr ? 'المريض' : 'Patient'}: ${patientName}` : ''}
            </div>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* OD vs OS Comparison Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* Right Eye (OD - Oculus Dexter) */}
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--r-lg)',
              border: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand)' }}>
                {t.dashboard?.rightEye || 'Right Eye (OD)'}
              </div>
              <Badge variant="confirmed">OD</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  {t.dashboard?.visualAcuity || 'Visual Acuity (Snellen)'}
                </label>
                <select
                  value={vaRight}
                  onChange={(e) => setVaRight(e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                >
                  <option value="20/20">20/20 (6/6 - Normal)</option>
                  <option value="20/25">20/25 (6/7.5)</option>
                  <option value="20/30">20/30 (6/9)</option>
                  <option value="20/40">20/40 (6/12)</option>
                  <option value="20/60">20/60 (6/18)</option>
                  <option value="20/100">20/100 (6/30)</option>
                  <option value="20/200">20/200 (Legal Blindness)</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {t.dashboard?.iop || 'IOP (Intraocular Pressure)'}
                  </label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: iopRight > 21 ? 'var(--accent-red)' : 'var(--brand)' }}>
                    {iopRight} mmHg
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="35"
                  value={iopRight}
                  onChange={(e) => setIopRight(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand)' }}
                />
              </div>

              {/* Refraction Box */}
              <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {isAr ? 'الانكسار الكروي والأسطواني' : 'Refraction Matrix'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11 }}>
                  <div>
                    <label style={{ color: 'var(--text-muted)' }}>SPH</label>
                    <input
                      type="text"
                      className="input"
                      value={sphRight}
                      onChange={(e) => setSphRight(e.target.value)}
                      style={{ padding: '4px 6px', fontSize: 12, textAlign: 'center' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-muted)' }}>CYL</label>
                    <input
                      type="text"
                      className="input"
                      value={cylRight}
                      onChange={(e) => setCylRight(e.target.value)}
                      style={{ padding: '4px 6px', fontSize: 12, textAlign: 'center' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-muted)' }}>AXIS</label>
                    <input
                      type="text"
                      className="input"
                      value={axisRight}
                      onChange={(e) => setAxisRight(e.target.value)}
                      style={{ padding: '4px 6px', fontSize: 12, textAlign: 'center' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Left Eye (OS - Oculus Sinister) */}
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--r-lg)',
              border: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--brand)' }}>
                {t.dashboard?.leftEye || 'Left Eye (OS)'}
              </div>
              <Badge variant="confirmed">OS</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  {t.dashboard?.visualAcuity || 'Visual Acuity (Snellen)'}
                </label>
                <select
                  value={vaLeft}
                  onChange={(e) => setVaLeft(e.target.value)}
                  className="input"
                  style={{ width: '100%', padding: '6px 10px', fontSize: 13 }}
                >
                  <option value="20/20">20/20 (6/6 - Normal)</option>
                  <option value="20/25">20/25 (6/7.5)</option>
                  <option value="20/30">20/30 (6/9)</option>
                  <option value="20/40">20/40 (6/12)</option>
                  <option value="20/60">20/60 (6/18)</option>
                  <option value="20/100">20/100 (6/30)</option>
                  <option value="20/200">20/200 (Legal Blindness)</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {t.dashboard?.iop || 'IOP (Intraocular Pressure)'}
                  </label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: iopLeft > 21 ? 'var(--accent-red)' : 'var(--brand)' }}>
                    {iopLeft} mmHg
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="35"
                  value={iopLeft}
                  onChange={(e) => setIopLeft(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand)' }}
                />
              </div>

              {/* Refraction Box */}
              <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {isAr ? 'الانكسار الكروي والأسطواني' : 'Refraction Matrix'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11 }}>
                  <div>
                    <label style={{ color: 'var(--text-muted)' }}>SPH</label>
                    <input
                      type="text"
                      className="input"
                      value={sphLeft}
                      onChange={(e) => setSphLeft(e.target.value)}
                      style={{ padding: '4px 6px', fontSize: 12, textAlign: 'center' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-muted)' }}>CYL</label>
                    <input
                      type="text"
                      className="input"
                      value={cylLeft}
                      onChange={(e) => setCylLeft(e.target.value)}
                      style={{ padding: '4px 6px', fontSize: 12, textAlign: 'center' }}
                    />
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-muted)' }}>AXIS</label>
                    <input
                      type="text"
                      className="input"
                      value={axisLeft}
                      onChange={(e) => setAxisLeft(e.target.value)}
                      style={{ padding: '4px 6px', fontSize: 12, textAlign: 'center' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Glaucoma Warning if IOP high */}
        {isIopHigh && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--r-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: 'var(--accent-red)',
            }}
          >
            <span style={{ fontSize: 16 }}>⚠</span>
            <span>
              {isAr
                ? 'تنبيه: ضغط العين أعلى من النطاق الطبيعي (10-21 ملم زئبق). يوصى بفحص العصب البصري والمجال البصري.'
                : 'Alert: Intraocular pressure exceeds normal threshold (10-21 mmHg). Recommend visual field and optic disc OCT.'}
            </span>
          </div>
        )}

        {/* Examination Checklist */}
        <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-surface)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
            {t.dashboard?.slitLamp || 'Biomicroscopy & Clinical Examination Findings'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            {exams.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'var(--bg-subtle)',
                  fontSize: 12.5,
                }}
              >
                <span>{item.label}</span>
                <Button
                  size="sm"
                  variant={item.status === 'normal' ? 'primary' : 'outline'}
                  onClick={() => toggleExamStatus(item.id)}
                  style={{
                    padding: '2px 8px',
                    fontSize: 11,
                    background: item.status === 'abnormal' ? 'rgba(239, 68, 68, 0.15)' : undefined,
                    color: item.status === 'abnormal' ? '#dc2626' : undefined,
                    borderColor: item.status === 'abnormal' ? '#dc2626' : undefined,
                  }}
                >
                  {item.status === 'normal'
                    ? isAr ? 'طبيعي ✓' : 'Normal ✓'
                    : isAr ? 'غير طبيعي ✕' : 'Abnormal ✕'}
                </Button>
              </div>
            ))}
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
                ? 'توثيق نتائج فحص حدة الإبصار، ضغط العين، وفحص المصباح الشقي في السجل الطبي'
                : 'Persist visual acuity, IOP, and biomicroscopy examination findings to patient record'}
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={savingExam}
              onClick={() =>
                onSaveSpecialtyExam({
                  diagnosis: isAr ? 'فحص عيون وانكسار بصري وقياس ضغط العين' : 'Ophthalmic Refraction & IOP Biomicroscopy Evaluation',
                  treatment_plan: isAr ? 'متابعة قياس ضغط العين ووصف النظارات الطبية' : 'Prescribe corrective lenses and monitor intraocular pressure',
                  specialty_data: {
                    specialty: 'ophthalmology',
                    vaRight,
                    vaLeft,
                    iopRight,
                    iopLeft,
                    refraction: {
                      od: { sph: sphRight, cyl: cylRight, axis: axisRight },
                      os: { sph: sphLeft, cyl: cylLeft, axis: axisLeft },
                    },
                    exams,
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
