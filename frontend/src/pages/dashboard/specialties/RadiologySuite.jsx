import { useState } from 'react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/Button';
import { useLanguage } from '../../../i18n/LanguageContext';

/**
 * Radiology & Ultrasound Clinical Suite (الأشعة والسونار)
 * Specialized workspace for ultrasound sonography, digital radiography (X-Ray),
 * Doppler studies, and diagnostic radiological reporting.
 */
export default function RadiologySuite({ patientName, onSaveSpecialtyExam, savingExam }) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  // Imaging Modality & Technique
  const [modality, setModality] = useState('ultrasound');
  const [region, setRegion] = useState('abdomen_pelvis');
  const [urgency, setUrgency] = useState('routine');

  // Examination Observations
  const [findings, setFindings] = useState(
    isAr
      ? 'الكبد والمرارة والبنكرياس والطحال ذات أبعاد وصدى طبيعي. لا توجد حصى أو توسع في القنوات الصفراوية. الكليتان بحجم طبيعي دون استسقاء أو كتل.'
      : 'Liver, gallbladder, pancreas, and spleen demonstrate normal size and echotexture. No focal lesions or biliary dilatation. Both kidneys are normal with preserved corticomedullary differentiation.'
  );

  // Diagnostic Impression / Conclusion
  const [impression, setImpression] = useState(
    isAr
      ? 'فحص سونار طبيعي للبطن والحوض دون علامات مرضية حادة'
      : 'Normal abdominal and pelvic ultrasound examination with no acute pathological findings'
  );

  // Recommendations & Follow-up
  const [recommendation, setRecommendation] = useState(
    isAr
      ? 'متابعة سريرية روتينية، وتكرار الفحص عند استمرار الأعراض'
      : 'Routine clinical correlation; repeat ultrasound in 3-6 months if symptoms persist'
  );

  // Clinical Protocol Checklist
  const [protocols, setProtocols] = useState([
    { id: 'prep', name: isAr ? 'صيام المريض (Fasting 6-8 hrs)' : 'Patient Fasting Verification (6-8h)', done: true },
    { id: 'calib', name: isAr ? 'معايرة مسبار السونار المحدب والسطحي' : 'Probe Calibration (Convex & Linear)', done: true },
    { id: 'doppler', name: isAr ? 'تقييم التروية بالدوبلر الملون' : 'Color Doppler Vascular Assessment', done: true },
    { id: 'archive', name: isAr ? 'أرشفة الصور في نظام PACS الطبي' : 'Digital DICOM / PACS Image Archiving', done: true },
  ]);

  const toggleProtocol = (id) => {
    setProtocols((prev) =>
      prev.map((p) => (p.id === id ? { ...p, done: !p.done } : p))
    );
  };

  const handleSave = () => {
    if (!onSaveSpecialtyExam) return;

    const payload = {
      diagnosis: isAr
        ? `تقرير الأشعة والسونار (${modalityLabel(modality)} - ${regionLabel(region)}): ${impression}`
        : `Radiological Report (${modalityLabel(modality)} - ${regionLabel(region)}): ${impression}`,
      treatment_plan: isAr
        ? `التوصية الشعاعية: ${recommendation}`
        : `Radiological Recommendation: ${recommendation}`,
      vital_signs: {
        modality,
        region,
        urgency,
      },
      specialty_data: {
        specialty: 'radiology_ultrasound',
        modality,
        region,
        urgency,
        findings,
        impression,
        recommendation,
        completed_protocols: protocols.filter((p) => p.done).map((p) => p.id),
        saved_at: new Date().toISOString(),
      },
    };

    onSaveSpecialtyExam(payload);
  };

  function modalityLabel(mod) {
    switch (mod) {
      case 'ultrasound':
        return isAr ? 'سونار موجات فوق صوتية' : 'Ultrasound (US)';
      case 'xray':
        return isAr ? 'أشعة سينية رقمية' : 'Digital X-Ray';
      case 'doppler':
        return isAr ? 'دوبلر ملون للأوعية' : 'Color Doppler';
      case 'ct':
        return isAr ? 'مفراس حلزوني (CT)' : 'Computed Tomography (CT)';
      case 'mri':
        return isAr ? 'رنين مغناطيسي (MRI)' : 'Magnetic Resonance (MRI)';
      default:
        return mod;
    }
  }

  function regionLabel(reg) {
    switch (reg) {
      case 'abdomen_pelvis':
        return isAr ? 'البطن والحوض' : 'Abdomen & Pelvis';
      case 'chest':
        return isAr ? 'الصدر والرئتين' : 'Chest & Lungs';
      case 'msk':
        return isAr ? 'العظام والمفاصل' : 'Musculoskeletal (MSK)';
      case 'thyroid':
        return isAr ? 'الغدة الدرقية والرقبة' : 'Thyroid & Neck';
      case 'urinary':
        return isAr ? 'الجهاز البولي والكلى' : 'Kidneys & Urinary Tract';
      case 'obstetric':
        return isAr ? 'التوليد والجنين' : 'Obstetric & Fetal';
      default:
        return reg;
    }
  }

  return (
    <Card className="pad stack" style={{ gap: 'var(--sp-6)', borderColor: 'var(--brand-soft)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--r-md)',
              background: 'rgba(2, 132, 199, 0.12)',
              color: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            🩻
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              {isAr ? 'جناح الأشعة والسونار التشخيصي' : 'Radiology & Ultrasound Clinical Suite'}
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {isAr
                ? `توثيق الفحوصات الشعاعية والسونار للمريض: ${patientName || 'مراجع العيادة'}`
                : `Diagnostic Imaging & Sonography Workspace for: ${patientName || 'Selected Patient'}`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge variant="confirmed">
            {isAr ? 'نظام PACS متصل' : 'PACS Online'}
          </Badge>
          <Badge variant={urgency === 'stat' ? 'danger' : 'neutral'}>
            {urgency === 'stat' ? (isAr ? 'طارئ جداً' : 'STAT Urgent') : (isAr ? 'روتيني' : 'Routine')}
          </Badge>
        </div>
      </div>

      {/* Modality & Anatomical Region Selectors */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--sp-4)',
          background: 'var(--bg-subtle)',
          padding: 'var(--sp-4)',
          borderRadius: 'var(--r-md)',
        }}
      >
        <div>
          <label className="label" style={{ fontSize: 12, fontWeight: 600 }}>
            {isAr ? 'نوع الفحص الشعاعي' : 'Imaging Modality'}
          </label>
          <select
            className="input"
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            style={{ fontSize: 13 }}
          >
            <option value="ultrasound">{isAr ? 'سونار موجات فوق صوتية (US)' : 'Ultrasound (Sonogram)'}</option>
            <option value="xray">{isAr ? 'أشعة سينية رقمية (Digital X-Ray)' : 'Digital Radiography (X-Ray)'}</option>
            <option value="doppler">{isAr ? 'دوبلر ملون للأوعية (Doppler)' : 'Color Doppler Vascular'}</option>
            <option value="ct">{isAr ? 'مفراس حلزوني (CT Scan)' : 'CT Scan'}</option>
            <option value="mri">{isAr ? 'رنين مغناطيسي (MRI)' : 'MRI Scan'}</option>
          </select>
        </div>

        <div>
          <label className="label" style={{ fontSize: 12, fontWeight: 600 }}>
            {isAr ? 'المنطقة التشريحية المفحوصة' : 'Anatomical Region'}
          </label>
          <select
            className="input"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            style={{ fontSize: 13 }}
          >
            <option value="abdomen_pelvis">{isAr ? 'البطن والحوض (Abdomen & Pelvis)' : 'Abdomen & Pelvis'}</option>
            <option value="urinary">{isAr ? 'الكلى والمسالك البولية (KUB)' : 'Kidneys & Urinary (KUB)'}</option>
            <option value="thyroid">{isAr ? 'الغدة الدرقية والرقبة (Thyroid)' : 'Thyroid & Neck'}</option>
            <option value="chest">{isAr ? 'الصدر والرئتين (Chest)' : 'Chest & Lungs'}</option>
            <option value="msk">{isAr ? 'العظام والمفاصل (MSK)' : 'Musculoskeletal Joints'}</option>
            <option value="obstetric">{isAr ? 'التوليد والجنين (Obstetric)' : 'Obstetric & Fetal'}</option>
          </select>
        </div>

        <div>
          <label className="label" style={{ fontSize: 12, fontWeight: 600 }}>
            {isAr ? 'مستوى أولوية الفحص' : 'Priority Level'}
          </label>
          <select
            className="input"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            style={{ fontSize: 13 }}
          >
            <option value="routine">{isAr ? 'فحص روتيني اعتيادي' : 'Routine Study'}</option>
            <option value="priority">{isAr ? 'أولوية سريرية عاجلة' : 'Priority Urgent'}</option>
            <option value="stat">{isAr ? 'حالة إسعافية فورية (STAT)' : 'STAT Emergency'}</option>
          </select>
        </div>
      </div>

      {/* Protocols Verification Checklist */}
      <div className="stack" style={{ gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
          {isAr ? 'إجراءات الجودة والجاهزية الفنية:' : 'Technical Quality & Readiness Protocols:'}
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
          {protocols.map((p) => (
            <label
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12.5,
                background: p.done ? 'var(--brand-soft)' : 'var(--bg-subtle)',
                padding: '6px 10px',
                borderRadius: 'var(--r-sm)',
                border: p.done ? '1px solid var(--brand)' : '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={p.done}
                onChange={() => toggleProtocol(p.id)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: p.done ? 600 : 400 }}>{p.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Detailed Radiological Findings */}
      <div className="stack" style={{ gap: 6 }}>
        <label className="label" style={{ fontSize: 13, fontWeight: 700 }}>
          {isAr ? 'الموجودات والملاحظات الشعاعية المفصلة:' : 'Detailed Radiological Findings:'}
        </label>
        <textarea
          className="input"
          rows={3}
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          placeholder={isAr ? 'اكتب ملاحظات الفحص والأبعاد والصدى...' : 'Enter observations, measurements, echogenicity...'}
          style={{ width: '100%', fontSize: 13, lineHeight: 1.5 }}
        />
      </div>

      {/* Diagnostic Impression & Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--sp-4)' }}>
        <div className="stack" style={{ gap: 6 }}>
          <label className="label" style={{ fontSize: 13, fontWeight: 700 }}>
            {isAr ? 'الخلاصة والتشخيص الشعاعي (Impression):' : 'Impression / Conclusion:'}
          </label>
          <input
            type="text"
            className="input"
            value={impression}
            onChange={(e) => setImpression(e.target.value)}
            placeholder={isAr ? 'الخلاصة التشخيصية...' : 'Diagnostic impression...'}
            style={{ fontSize: 13 }}
          />
        </div>

        <div className="stack" style={{ gap: 6 }}>
          <label className="label" style={{ fontSize: 13, fontWeight: 700 }}>
            {isAr ? 'التوصية السريرية والمتابعة:' : 'Clinical Recommendation & Follow-up:'}
          </label>
          <input
            type="text"
            className="input"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            placeholder={isAr ? 'التوصيات والمتابعة...' : 'Recommendations...'}
            style={{ fontSize: 13 }}
          />
        </div>
      </div>

      {/* Save Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={savingExam}
          style={{ minWidth: 200, fontWeight: 600 }}
        >
          {savingExam
            ? isAr ? 'جاري حفظ التقرير...' : 'Saving Report...'
            : isAr ? 'حفظ وتوثيق تقرير الأشعة والسونار' : 'Save & Archive Radiology Report'}
        </Button>
      </div>
    </Card>
  );
}
