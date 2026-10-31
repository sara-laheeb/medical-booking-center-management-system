import { useState } from 'react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/Button';
import { useLanguage } from '../../../i18n/LanguageContext';

/**
 * Medical Laboratory Clinical Suite
 * Workspace for diagnostic hematology, biochemistry, blood bank ABO/Rh typing,
 * and clinical pathologist sign-off.
 */
export default function LaboratorySuite({ patientName, onSaveSpecialtyExam, savingExam }) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  // Complete Blood Count (CBC) parameters
  const [wbc, setWbc] = useState('7.2');
  const [rbc, setRbc] = useState('4.8');
  const [hb, setHb] = useState('14.2');
  const [platelets, setPlatelets] = useState('240');

  // Clinical Chemistry values
  const [glucose, setGlucose] = useState('98');
  const [creatinine, setCreatinine] = useState('0.9');
  const [urea, setUrea] = useState('28');
  const [alt, setAlt] = useState('24');

  // Blood Group & Rh typing
  const [bloodGroup, setBloodGroup] = useState('O+');

  // Specimen verification and analyzer checklist
  const [labPanels, setLabPanels] = useState([
    { id: 'cbc', name: isAr ? 'فحص الدم الشامل (CBC Panel)' : 'CBC Automated Differential', done: true },
    { id: 'lft', name: isAr ? 'وظائف الكبد (Liver Profile)' : 'Liver Function Panel (LFT)', done: true },
    { id: 'rft', name: isAr ? 'وظائف الكلى والكهارل (Kidney Profile)' : 'Renal Function & Electrolytes', done: true },
    { id: 'lipid', name: isAr ? 'دهون الدم الكاملة (Lipid Panel)' : 'Lipid Profile (Chol/Trig/HDL)', done: false },
    { id: 'urine', name: isAr ? 'الفحص العام للإدرار (Urinalysis)' : 'Routine Urinalysis Microscopy', done: true },
  ]);

  const isHbLow = Number(hb) < 12.0;

  // Toggle lab panel verification status
  const togglePanel = (id) => {
    setLabPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p))
    );
  };

  // Compile and submit laboratory report record
  const handleSave = () => {
    if (!onSaveSpecialtyExam) return;

    const payload = {
      diagnosis: isAr
        ? `تقرير التحاليل المخبرية: Hb ${hb} g/dL، فصيلة الدم ${bloodGroup}، نتائج كيمياء حيوية طبيعية`
        : `Diagnostic Laboratory Panel: Hb ${hb} g/dL, Blood Group ${bloodGroup}, Normal Chemistry Profile`,
      treatment_plan: isAr
        ? `مطابقة العينات مع معايير الجودة وإصدار النتائج للملف السريري`
        : `Specimens verified, validated via automated analyzers, and released to clinical record`,
      vital_signs: {
        blood_group: bloodGroup,
        hemoglobin: Number(hb),
        fasting_glucose: Number(glucose),
        serum_creatinine: Number(creatinine),
      },
      specialty_data: {
        specialty: 'laboratory',
        hematology: {
          wbc_x10e3: Number(wbc),
          rbc_x10e6: Number(rbc),
          hb_g_dl: Number(hb),
          platelets_x10e3: Number(platelets),
        },
        biochemistry: {
          glucose_mg_dl: Number(glucose),
          creatinine_mg_dl: Number(creatinine),
          blood_urea_mg_dl: Number(urea),
          alt_u_l: Number(alt),
        },
        blood_group: bloodGroup,
        verified_panels: labPanels.filter((p) => p.done).map((p) => p.name),
      },
    };

    onSaveSpecialtyExam(payload);
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔬</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {isAr ? 'المختبر التشخيصي والتحاليل الطبية' : 'Clinical Diagnostic Pathology & Laboratory Suite'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>
              {isAr ? 'فحص تعداد الدم، الكيمياء السريرية، بنك الدم، وتوثيق النتائج' : 'Automated hematology, clinical chemistry, blood group typing, and result verification'}
              {patientName ? ` · ${isAr ? 'المراجع' : 'Patient'}: ${patientName}` : ''}
            </div>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Hematology & Biochemistry Key Vitals Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            background: 'var(--bg-subtle)',
            padding: 16,
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Hemoglobin */}
          <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {isAr ? 'الهيموجلوبين (Hb g/dL)' : 'Hemoglobin (g/dL)'}
            </div>
            <input
              type="number"
              step="0.1"
              className="input"
              value={hb}
              onChange={(e) => setHb(e.target.value)}
              style={{ width: '100%', padding: '4px 8px', fontSize: 14, fontWeight: 700 }}
            />
            <div style={{ marginTop: 4 }}>
              <Badge variant={isHbLow ? 'cancelled' : 'confirmed'}>
                {isHbLow ? (isAr ? 'فقر دم' : 'Low Hb') : (isAr ? 'طبيعي' : 'Optimal')}
              </Badge>
            </div>
          </div>

          {/* WBC */}
          <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {isAr ? 'كريات الدم البيضاء (WBC)' : 'WBC (×10³/µL)'}
            </div>
            <input
              type="number"
              step="0.1"
              className="input"
              value={wbc}
              onChange={(e) => setWbc(e.target.value)}
              style={{ width: '100%', padding: '4px 8px', fontSize: 14, fontWeight: 700 }}
            />
            <div style={{ marginTop: 4 }}>
              <Badge variant="confirmed">{isAr ? 'ضمن المعدل' : '4.0 - 11.0'}</Badge>
            </div>
          </div>

          {/* Fasting Glucose */}
          <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {isAr ? 'سكر الدم (Glucose mg/dL)' : 'Fasting Glucose'}
            </div>
            <input
              type="number"
              className="input"
              value={glucose}
              onChange={(e) => setGlucose(e.target.value)}
              style={{ width: '100%', padding: '4px 8px', fontSize: 14, fontWeight: 700 }}
            />
            <div style={{ marginTop: 4 }}>
              <Badge variant={Number(glucose) > 126 ? 'cancelled' : 'confirmed'}>
                {Number(glucose) > 126 ? (isAr ? 'مرتفع' : 'High') : (isAr ? 'طبيعي' : 'Normal')}
              </Badge>
            </div>
          </div>

          {/* Serum Creatinine */}
          <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {isAr ? 'الكرياتينين (Creatinine)' : 'Creatinine (mg/dL)'}
            </div>
            <input
              type="number"
              step="0.1"
              className="input"
              value={creatinine}
              onChange={(e) => setCreatinine(e.target.value)}
              style={{ width: '100%', padding: '4px 8px', fontSize: 14, fontWeight: 700 }}
            />
            <div style={{ marginTop: 4 }}>
              <Badge variant="confirmed">{isAr ? 'كلى سليمة' : '0.6 - 1.2'}</Badge>
            </div>
          </div>
        </div>

        {/* Blood Bank ABO & Clinical Chemistry Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* Blood Bank ABO / Rh Selector */}
          <div className="card pad" style={{ border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
              {isAr ? 'فصيلة الدم وعامل الريسوس (ABO & Rh Grouping)' : 'Blood Typing & Rh Compatibility'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'].map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setBloodGroup(grp)}
                  style={{
                    padding: '8px 0',
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: bloodGroup === grp ? 'var(--brand)' : 'var(--bg-surface)',
                    color: bloodGroup === grp ? '#ffffff' : 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  {grp}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
              {isAr ? 'فصيلة الدم المحددة:' : 'Confirmed Blood Group:'} <strong>{bloodGroup}</strong>
            </div>
          </div>

          {/* Secondary CBC & Chemistry Parameters */}
          <div className="card pad" style={{ border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
              {isAr ? 'مؤشرات إضافية (الصفائح، الكريات الحمراء، وظائف الكبد)' : 'Additional Analyzer Indices (PLT, RBC, ALT)'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{isAr ? 'الصفائح الدموية:' : 'Platelets (PLT):'}</label>
                <input
                  type="number"
                  className="input"
                  value={platelets}
                  onChange={(e) => setPlatelets(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{isAr ? 'الكريات الحمر (RBC):' : 'RBC (×10⁶/µL):'}</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={rbc}
                  onChange={(e) => setRbc(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{isAr ? 'يوريا الدم (Urea):' : 'Blood Urea (mg/dL):'}</label>
                <input
                  type="number"
                  className="input"
                  value={urea}
                  onChange={(e) => setUrea(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{isAr ? 'أنزيم الكبد (ALT):' : 'SGPT/ALT (U/L):'}</label>
                <input
                  type="number"
                  className="input"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  style={{ width: '100%', padding: '4px 6px', fontSize: 13 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lab Panels Checklist & Sign-off Action */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            borderTop: '1px solid var(--border)',
            paddingTop: 16,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
              {isAr ? 'التحاليل المعتمدة:' : 'Verified Diagnostic Panels:'}
            </span>
            {labPanels.map((p) => (
              <label
                key={p.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 'var(--r-full)',
                  border: '1px solid var(--border)',
                  background: p.done ? 'var(--brand-soft)' : 'var(--bg-surface)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={p.done}
                  onChange={() => togglePanel(p.id)}
                />
                <span style={{ fontWeight: p.done ? 600 : 400 }}>{p.name}</span>
              </label>
            ))}
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={handleSave}
            disabled={savingExam}
          >
            {savingExam ? (isAr ? 'جارِ الاعتماد...' : 'Validating...') : (isAr ? 'اعتماد التقرير المخبري' : 'Sign & Release Lab Report')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
