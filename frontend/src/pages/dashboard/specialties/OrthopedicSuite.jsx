import { useState } from 'react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/Button';
import { useLanguage } from '../../../i18n/LanguageContext';

/**
 * Orthopedics & Fractures Clinical Suite (جراحة العظام والكسور)
 * Dedicated clinical workspace for musculoskeletal trauma, fracture immobilization,
 * joint assessments, arthritic management, and orthopedic rehabilitation.
 */
export default function OrthopedicSuite({ patientName, onSaveSpecialtyExam, savingExam }) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  // Affected Area & Condition Type
  const [affectedArea, setAffectedArea] = useState('knee');
  const [conditionType, setConditionType] = useState('osteoarthritis');
  const [weightBearing, setWeightBearing] = useState('partial');

  // Clinical Examination & Range of Motion
  const [romAssessment, setRomAssessment] = useState(
    isAr
      ? 'مدى حركي محدود مع ألم عند الثني الأقصى، وجود طقطقة مفصلية (crepitus)، مع تورم خفيف دون احمرار موضعي. الفحص العصبي والوعائي سليم تماماً.'
      : 'Limited range of motion with terminal flexion discomfort; moderate crepitus present; mild joint effusion without erythema. Distal neurovascular status completely intact.'
  );

  // Diagnosis
  const [diagnosisText, setDiagnosisText] = useState(
    isAr
      ? 'احتكاك وخشونة مفصل الركبة من الدرجة الثانية (Grade II Osteoarthritis)'
      : 'Bilateral knee osteoarthritis, predominantly right medial compartment (Grade II)'
  );

  // Treatment & Immobilization Plan
  const [treatmentPlan, setTreatmentPlan] = useState(
    isAr
      ? 'إراحة المفصل، كمادات باردة موضعي، علاج دوائي مضاد للالتهاب، جلسات علاج طبيعي لتقوية العضلة الرباعية، وإعادة التقييم بعد أسبوعين'
      : 'Joint rest, anti-inflammatory pharmacotherapy, targeted quadriceps strengthening physical therapy, and follow-up in 2 weeks'
  );

  // Orthopedic Interventions Checklist
  const [interventions, setInterventions] = useState([
    { id: 'xray_eval', name: isAr ? 'معاينة صور الأشعة السينية للمفصل' : 'Plain Radiograph (X-Ray) Review', done: true },
    { id: 'neuro_check', name: isAr ? 'فحص سلامة الأعصاب والتروية الطرفية' : 'Distal Neurovascular Integrity Check', done: true },
    { id: 'brace_cast', name: isAr ? 'تثبيت بدعامة أو جبيرة طبية' : 'Orthopedic Splint / Functional Brace', done: false },
    { id: 'pt_referral', name: isAr ? 'برنامج علاج طبيعي وتمارين تأهيلية' : 'Physical Therapy Rehabilitation Plan', done: true },
  ]);

  const toggleIntervention = (id) => {
    setInterventions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleSave = () => {
    if (!onSaveSpecialtyExam) return;

    const payload = {
      diagnosis: isAr
        ? `تشخيص جراحة العظام والكسور (${areaLabel(affectedArea)}): ${diagnosisText}`
        : `Orthopedic Diagnosis (${areaLabel(affectedArea)}): ${diagnosisText}`,
      treatment_plan: isAr
        ? `الخطة العلاجية والتأهيلية: ${treatmentPlan} (تحمل الوزن: ${weightBearingLabel(weightBearing)})`
        : `Treatment & Rehab Plan: ${treatmentPlan} (Weight Bearing: ${weightBearingLabel(weightBearing)})`,
      vital_signs: {
        affected_area: affectedArea,
        condition_type: conditionType,
        weight_bearing: weightBearing,
      },
      specialty_data: {
        specialty: 'orthopedics_fractures',
        affected_area: affectedArea,
        condition_type: conditionType,
        weight_bearing: weightBearing,
        range_of_motion: romAssessment,
        diagnosis: diagnosisText,
        treatment_plan: treatmentPlan,
        interventions: interventions.filter((i) => i.done).map((i) => i.id),
        saved_at: new Date().toISOString(),
      },
    };

    onSaveSpecialtyExam(payload);
  };

  function areaLabel(area) {
    switch (area) {
      case 'knee':
        return isAr ? 'مفصل الركبة' : 'Knee Joint';
      case 'shoulder':
        return isAr ? 'مفصل الكتف' : 'Shoulder Joint';
      case 'spine':
        return isAr ? 'العمود الفقري والفقرات' : 'Spine & Lumbar';
      case 'hip':
        return isAr ? 'مفصل الورك والحوض' : 'Hip Joint';
      case 'ankle_foot':
        return isAr ? 'الكاحل والقدم' : 'Ankle & Foot';
      case 'wrist_hand':
        return isAr ? 'الرسغ واليد' : 'Wrist & Hand';
      case 'elbow':
        return isAr ? 'المرفق والساعد' : 'Elbow & Forearm';
      default:
        return area;
    }
  }

  function weightBearingLabel(wb) {
    switch (wb) {
      case 'full':
        return isAr ? 'تحمل وزن كامل' : 'Full Weight Bearing';
      case 'partial':
        return isAr ? 'تحمل وزن جزئي (مع عكاز)' : 'Partial Weight Bearing';
      case 'non':
        return isAr ? 'منع تحميل الوزن تماماً' : 'Non-Weight Bearing';
      default:
        return wb;
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
              background: 'rgba(234, 88, 12, 0.12)',
              color: '#c2410c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            🦴
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              {isAr ? 'جناح جراحة العظام والكسور' : 'Orthopedics & Fractures Clinical Suite'}
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {isAr
                ? `توثيق الفحص السريري وإصابات العظام للمريض: ${patientName || 'مراجع العيادة'}`
                : `Orthopedic Assessment & Trauma Workspace for: ${patientName || 'Selected Patient'}`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge variant="confirmed">
            {isAr ? 'عيادة العظام والمفاصل' : 'Orthopedic Clinic'}
          </Badge>
          <Badge variant={conditionType === 'fracture' ? 'danger' : 'neutral'}>
            {weightBearingLabel(weightBearing)}
          </Badge>
        </div>
      </div>

      {/* Specialty Configuration Grid */}
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
            {isAr ? 'العضو / المفصل المصاب' : 'Affected Joint / Bone'}
          </label>
          <select
            className="input"
            value={affectedArea}
            onChange={(e) => setAffectedArea(e.target.value)}
            style={{ fontSize: 13 }}
          >
            <option value="knee">{isAr ? 'مفصل الركبة (Knee)' : 'Knee Joint'}</option>
            <option value="shoulder">{isAr ? 'مفصل الكتف (Shoulder)' : 'Shoulder Joint'}</option>
            <option value="spine">{isAr ? 'العمود الفقري (Spine/Lumbar)' : 'Spine & Lumbar'}</option>
            <option value="hip">{isAr ? 'مفصل الورك (Hip)' : 'Hip Joint'}</option>
            <option value="ankle_foot">{isAr ? 'الكاحل والقدم (Ankle/Foot)' : 'Ankle & Foot'}</option>
            <option value="wrist_hand">{isAr ? 'الرسغ واليد (Wrist/Hand)' : 'Wrist & Hand'}</option>
            <option value="elbow">{isAr ? 'المرفق والساعد (Elbow)' : 'Elbow & Forearm'}</option>
          </select>
        </div>

        <div>
          <label className="label" style={{ fontSize: 12, fontWeight: 600 }}>
            {isAr ? 'تصنيف الحالة السريرية' : 'Clinical Condition Category'}
          </label>
          <select
            className="input"
            value={conditionType}
            onChange={(e) => setConditionType(e.target.value)}
            style={{ fontSize: 13 }}
          >
            <option value="osteoarthritis">{isAr ? 'خشونة مفاصل واحتكاك (Osteoarthritis)' : 'Osteoarthritis'}</option>
            <option value="fracture">{isAr ? 'كسر عظمي حاد (Acute Fracture)' : 'Acute Fracture'}</option>
            <option value="ligament_sprain">{isAr ? 'تمزق أربطة أو التواء (Sprain/Tear)' : 'Ligament Sprain / Tear'}</option>
            <option value="tendinitis">{isAr ? 'التهاب أوتار (Tendinitis)' : 'Tendinitis / Bursitis'}</option>
            <option value="disc_herniation">{isAr ? 'انزلاق غضروفي (Disc Herniation)' : 'Disc Herniation'}</option>
          </select>
        </div>

        <div>
          <label className="label" style={{ fontSize: 12, fontWeight: 600 }}>
            {isAr ? 'تعليمات تحميل الوزن' : 'Weight-Bearing Status'}
          </label>
          <select
            className="input"
            value={weightBearing}
            onChange={(e) => setWeightBearing(e.target.value)}
            style={{ fontSize: 13 }}
          >
            <option value="full">{isAr ? 'تحمل وزن كامل (Full)' : 'Full Weight Bearing'}</option>
            <option value="partial">{isAr ? 'تحمل وزن جزئي مع مساندة (Partial)' : 'Partial Weight Bearing'}</option>
            <option value="non">{isAr ? 'منع تحميل الوزن تماماً (Non-weight)' : 'Non-Weight Bearing'}</option>
          </select>
        </div>
      </div>

      {/* Interventions Checklist */}
      <div className="stack" style={{ gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
          {isAr ? 'إجراءات الفحص والتدخل العظمي:' : 'Clinical Exam & Orthopedic Interventions:'}
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
          {interventions.map((item) => (
            <label
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12.5,
                background: item.done ? 'var(--brand-soft)' : 'var(--bg-subtle)',
                padding: '6px 10px',
                borderRadius: 'var(--r-sm)',
                border: item.done ? '1px solid var(--brand)' : '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleIntervention(item.id)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: item.done ? 600 : 400 }}>{item.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Examination & Range of Motion */}
      <div className="stack" style={{ gap: 6 }}>
        <label className="label" style={{ fontSize: 13, fontWeight: 700 }}>
          {isAr ? 'تقييم المدى الحركي والأعصاب والتروية (ROM & Neurovascular):' : 'ROM & Physical Examination:'}
        </label>
        <textarea
          className="input"
          rows={3}
          value={romAssessment}
          onChange={(e) => setRomAssessment(e.target.value)}
          placeholder={isAr ? 'اكتب ملاحظات الفحص السريري ومدى الحركة...' : 'Enter clinical observations, ROM, stability...'}
          style={{ width: '100%', fontSize: 13, lineHeight: 1.5 }}
        />
      </div>

      {/* Diagnosis & Treatment Plan */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--sp-4)' }}>
        <div className="stack" style={{ gap: 6 }}>
          <label className="label" style={{ fontSize: 13, fontWeight: 700 }}>
            {isAr ? 'التشخيص الطبي للعظام:' : 'Orthopedic Diagnosis:'}
          </label>
          <input
            type="text"
            className="input"
            value={diagnosisText}
            onChange={(e) => setDiagnosisText(e.target.value)}
            placeholder={isAr ? 'التشخيص الطبي...' : 'Clinical diagnosis...'}
            style={{ fontSize: 13 }}
          />
        </div>

        <div className="stack" style={{ gap: 6 }}>
          <label className="label" style={{ fontSize: 13, fontWeight: 700 }}>
            {isAr ? 'الخطة العلاجية والتأهيلية:' : 'Treatment & Rehabilitation Plan:'}
          </label>
          <input
            type="text"
            className="input"
            value={treatmentPlan}
            onChange={(e) => setTreatmentPlan(e.target.value)}
            placeholder={isAr ? 'الخطة العلاجية...' : 'Treatment plan...'}
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
            : isAr ? 'حفظ وتوثيق فحص العظام والكسور' : 'Save & Record Orthopedic Exam'}
        </Button>
      </div>
    </Card>
  );
}
