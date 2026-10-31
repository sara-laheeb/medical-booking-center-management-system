import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import pharmacyService from '../../services/pharmacyService';
import patientService from '../../services/patientService';

import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Alert from '../../components/common/Alert';
import Button from '../../components/Button';
import BrandLogo from '../../components/BrandLogo';

import {
  PillIcon,
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
} from '../../components/icons';

/**
 * DoctorPrescriptionsPage
 * Focused clinical workspace for prescribing doctors (Dentistry, Ophthalmology, Orthopedics)
 * to issue and track patient electronic prescriptions without exposure to pharmacy inventory.
 */
export default function DoctorPrescriptionsPage() {
  const { user, role } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  // Doctor specialty check
  const userSpecialty = (user?.doctor?.specialty_name || '').toLowerCase();
  const isRadiologyDoctor = role === 'doctor' && (userSpecialty.includes('radiology') || userSpecialty.includes('ultrasound') || userSpecialty.includes('أشعة') || userSpecialty.includes('سونار'));
  const isLabDoctor = role === 'doctor' && (userSpecialty.includes('laboratory') || userSpecialty.includes('مختبر') || userSpecialty.includes('lab'));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Prescriptions & Meds
  const [prescriptions, setPrescriptions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [patients, setPatients] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isNewRxModalOpen, setIsNewRxModalOpen] = useState(false);
  const [selectedRx, setSelectedRx] = useState(null);
  const [submittingRx, setSubmittingRx] = useState(false);

  // Form state
  const [rxForm, setRxForm] = useState({
    patient_id: '',
    notes: '',
    items: [
      {
        medication_id: '',
        quantity: 1,
        dosage: '1 tablet 3x daily',
        duration: '5 days',
        instructions: isAr ? 'بعد الطعام' : 'After meals',
      },
    ],
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    if (isRadiologyDoctor || isLabDoctor) return;
    setLoading(true);
    setError(null);
    try {
      const [rxRes, medRes, ptRes] = await Promise.all([
        pharmacyService.getPrescriptions().catch(() => ({ data: [] })),
        pharmacyService.getMedications({ limit: 100 }).catch(() => ({ data: [] })),
        patientService.getAll({ limit: 100 }).catch(() => ({ data: [] })),
      ]);

      const allRx = rxRes?.data || [];
      // Scope to this doctor's prescriptions if role is doctor
      const myDoctorId = user?.doctor?.doctor_id || user?.doctor?.id;
      const filtered = (role === 'doctor' && myDoctorId)
        ? allRx.filter((r) => Number(r.doctor_id) === Number(myDoctorId))
        : allRx;

      setPrescriptions(filtered);
      setMedications(medRes?.data || []);
      setPatients(ptRes?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch prescriptions data');
    } finally {
      setLoading(false);
    }
  }, [isRadiologyDoctor, isLabDoctor, role, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Prescriptions
  const filteredRx = useMemo(() => {
    return prescriptions.filter((rx) => {
      if (statusFilter !== 'all' && rx.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const code = (rx.prescription_code || '').toLowerCase();
      const ptName = `${rx.patient_first_name || ''} ${rx.patient_last_name || ''} ${rx.patient_name || ''}`.toLowerCase();
      const docName = (rx.doctor_name || '').toLowerCase();
      return code.includes(q) || ptName.includes(q) || docName.includes(q);
    });
  }, [prescriptions, searchQuery, statusFilter]);

  // Add Item to Rx
  const handleAddItem = () => {
    setRxForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          medication_id: medications[0]?.id || '',
          quantity: 1,
          dosage: '1 tablet 2x daily',
          duration: '5 days',
          instructions: isAr ? 'بعد الطعام' : 'After meals',
        },
      ],
    }));
  };

  // Remove Item from Rx
  const handleRemoveItem = (index) => {
    setRxForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Update Item in Rx
  const handleUpdateItem = (index, field, value) => {
    setRxForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  // Submit Rx
  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!rxForm.patient_id) {
      showToast(isAr ? 'يرجى اختيار المريض' : 'Please select a patient');
      return;
    }

    const validItems = rxForm.items.filter((i) => i.medication_id);
    if (validItems.length === 0) {
      showToast(isAr ? 'يرجى اختيار دواء واحد على الأقل' : 'Please select at least one medication');
      return;
    }

    const doctorId = user?.doctor?.doctor_id || user?.doctor?.id || 1;

    setSubmittingRx(true);
    try {
      const payload = {
        patient_id: Number(rxForm.patient_id),
        doctor_id: Number(doctorId),
        appointment_id: 1,
        notes: rxForm.notes || '',
        items: validItems.map((item) => ({
          medication_id: Number(item.medication_id),
          quantity: Number(item.quantity) || 1,
          dosage: item.dosage || '1 tablet daily',
          duration: item.duration || '5 days',
          instructions: item.instructions || '',
        })),
      };

      await pharmacyService.createPrescription(payload);
      showToast(isAr ? 'تم إصدار الوصفة الطبية الإلكترونية بنجاح!' : 'Prescription issued successfully!');
      setIsNewRxModalOpen(false);
      setRxForm({
        patient_id: '',
        notes: '',
        items: [
          {
            medication_id: '',
            quantity: 1,
            dosage: '1 tablet 3x daily',
            duration: '5 days',
            instructions: isAr ? 'بعد الطعام' : 'After meals',
          },
        ],
      });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to issue prescription');
    } finally {
      setSubmittingRx(false);
    }
  };

  // Diagnostic specialists guard
  if (isRadiologyDoctor || isLabDoctor) {
    return (
      <div className="stack" style={{ gap: 'var(--sp-6)', padding: 'var(--sp-6)' }}>
        <Card className="pad" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🩻</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
            {isAr ? 'التخصصات التشخيصية لا تصدر وصفات دوائية خارجية' : 'Diagnostic Specialties Notice'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '12px auto 24px' }}>
            {isAr
              ? 'تختص عيادات الأشعة والسونار والمختبر الطبي بإجراء الفحوصات التشخيصية وإصدار التقارير والنتائج، ولا تتطلب كتابة وصفات أدوية خارجية.'
              : 'Radiology & Ultrasound and Medical Laboratory services focus on diagnostic imaging and clinical laboratory analysis, and do not manage outpatient medication prescriptions.'}
          </p>
          <Button as={Link} to="/app" variant="primary">
            {isAr ? 'العودة للوحة التحكم التخصصية' : 'Return to My Workspace'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 'var(--sp-8)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: isAr ? 'auto' : '24px',
            left: isAr ? '24px' : 'auto',
            zIndex: 1100,
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <div
            className="card pad"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--brand)',
              color: '#fff',
              boxShadow: 'var(--shadow-lg)',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 'var(--r-lg)',
            }}
          >
            <CheckCircleIcon width={18} height={18} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div className="eyebrow">{isAr ? 'مجمع فيتا الطبي · الوصفات الطبية الإلكترونية' : 'Vita Medical Complex · Electronic Prescriptions'}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
            {isAr ? 'الوصفات الطبية الإلكترونية' : 'Electronic Prescriptions'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {isAr
              ? 'إصدار الوصفات الدوائية لمرضى العيادة، متابعة حالة الصرف في الصيدلية، وطباعة الراشيتة المعتمدة'
              : 'Issue outpatient medication prescriptions, track pharmacy fulfillment status, and generate printable prescription slips'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCwIcon width={16} height={16} className={loading ? 'icon-spin' : ''} />
            <span>{loading ? (isAr ? 'جاري التحديث...' : 'Refreshing...') : (isAr ? 'تحديث' : 'Refresh')}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setRxForm({
                patient_id: patients[0]?.id || '',
                notes: '',
                items: [
                  {
                    medication_id: medications[0]?.id || '',
                    quantity: 1,
                    dosage: '1 tablet 3x daily',
                    duration: '5 days',
                    instructions: isAr ? 'بعد الطعام' : 'After meals',
                  },
                ],
              });
              setIsNewRxModalOpen(true);
            }}
          >
            <PlusIcon width={16} height={16} />
            <span>{isAr ? 'إصدار وصفة جديدة' : 'New Prescription'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title={isAr ? 'تنبيه' : 'Notice'} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search & Filter Bar */}
      <div
        className="card pad"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <SearchIcon
              width={16}
              height={16}
              style={{
                position: 'absolute',
                top: '50%',
                insetInlineStart: 12,
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
              }}
            />
            <input
              type="text"
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث برقم الوصفة، اسم المريض...' : 'Search by code, patient name...'}
              style={{ paddingInlineStart: 36, width: '100%', fontSize: 13 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
            {isAr ? 'الحالة:' : 'Status:'}
          </span>
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', fontSize: 12.5, padding: '4px 10px' }}
          >
            <option value="all">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
            <option value="pending">{isAr ? 'بانتظار الصرف' : 'Pending Dispensing'}</option>
            <option value="dispensed">{isAr ? 'تم الصرف' : 'Dispensed'}</option>
            <option value="cancelled">{isAr ? 'ملغاة' : 'Cancelled'}</option>
          </select>
        </div>
      </div>

      {/* Prescriptions List Table */}
      <Card className="pad stack" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCwIcon width={24} height={24} className="icon-spin" style={{ margin: '0 auto 12px' }} />
            <div>{isAr ? 'جاري تحميل سجل الوصفات...' : 'Loading prescriptions...'}</div>
          </div>
        ) : filteredRx.length === 0 ? (
          <EmptyState
            icon="💊"
            title={isAr ? 'لا توجد وصفات طبية' : 'No Prescriptions Found'}
            desc={isAr ? 'لم يتم العثور على وصفات مطابقة لخيارات البحث الحالية.' : 'No prescriptions matching the selected criteria.'}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700 }}>
                    {isAr ? 'رمز الوصفة' : 'Code'}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700 }}>
                    {isAr ? 'المريض' : 'Patient'}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700 }}>
                    {isAr ? 'الطبيب' : 'Doctor'}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700 }}>
                    {isAr ? 'التاريخ' : 'Date'}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', fontWeight: 700 }}>
                    {isAr ? 'الأدوية الموصوفة' : 'Medications'}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700 }}>
                    {isAr ? 'حالة الصرف' : 'Status'}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: isAr ? 'left' : 'right', fontWeight: 700 }}>
                    {isAr ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRx.map((rx) => {
                  const ptName = `${rx.patient_first_name || ''} ${rx.patient_last_name || ''} ${rx.patient_name || ''}`.trim() || 'Patient';
                  const dateStr = rx.created_at ? new Date(rx.created_at).toLocaleDateString(isAr ? 'ar-IQ' : 'en-US') : '-';
                  return (
                    <tr key={rx.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--brand)' }}>
                        {rx.prescription_code}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ptName}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        {rx.doctor_name || user?.name}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{dateStr}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {rx.items && rx.items.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {rx.items.slice(0, 2).map((item, idx) => (
                              <span
                                key={idx}
                                style={{
                                  background: 'var(--bg-subtle)',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--r-sm)',
                                  fontSize: 11.5,
                                }}
                              >
                                {item.medication_name || item.name || `Med #${item.medication_id}`}
                              </span>
                            ))}
                            {rx.items.length > 2 && (
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                +{rx.items.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                            {rx.notes ? rx.notes.slice(0, 30) : (isAr ? 'أدوية علاجية' : 'Prescribed items')}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {rx.status === 'dispensed' ? (
                          <Badge variant="confirmed">{isAr ? 'تم الصرف' : 'Dispensed'}</Badge>
                        ) : rx.status === 'cancelled' ? (
                          <Badge variant="danger">{isAr ? 'ملغاة' : 'Cancelled'}</Badge>
                        ) : (
                          <Badge variant="pending">{isAr ? 'بانتظار الصرف' : 'Pending'}</Badge>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: isAr ? 'left' : 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRx(rx)}
                            title={isAr ? 'معاينة وطباعة الوصفة' : 'View & Print Prescription'}
                            style={{ padding: '4px 8px' }}
                          >
                            <EyeIcon width={15} height={15} />
                            <span style={{ fontSize: 12 }}>{isAr ? 'عرض' : 'View'}</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: New Prescription */}
      {isNewRxModalOpen && (
        <div className="modal-backdrop">
          <div className="modal card" style={{ maxWidth: 640, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                {isAr ? 'إصدار وصفة طبية إلكترونية جديدة' : 'Issue Electronic Prescription'}
              </h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setIsNewRxModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="modal-body stack" style={{ gap: 16 }}>
              <div>
                <label className="label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                  {isAr ? 'المراجع / المريض *' : 'Patient *'}
                </label>
                <select
                  className="input"
                  value={rxForm.patient_id}
                  onChange={(e) => setRxForm({ ...rxForm, patient_id: e.target.value })}
                  required
                  style={{ fontSize: 13 }}
                >
                  <option value="">{isAr ? 'اختر المريض...' : 'Select patient...'}</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.phone || p.patient_code || `ID ${p.id}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Medication Items */}
              <div className="stack" style={{ gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                    {isAr ? 'الأدوية الموصوفة والجرعات:' : 'Prescribed Medications & Dosages:'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: 11.5, padding: '3px 8px' }}
                    onClick={handleAddItem}
                  >
                    + {isAr ? 'إضافة دواء آخر' : 'Add Medication'}
                  </button>
                </div>

                {rxForm.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: 12,
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select
                        className="input"
                        value={item.medication_id}
                        onChange={(e) => handleUpdateItem(idx, 'medication_id', e.target.value)}
                        required
                        style={{ flex: 1, fontSize: 12.5 }}
                      >
                        <option value="">{isAr ? 'اختر الدواء من الدليل...' : 'Select medicine from catalog...'}</option>
                        {medications.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.strength ? `(${m.strength})` : ''} - {m.category || 'Medication'}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        className="input"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                        style={{ width: 80, fontSize: 12.5 }}
                        placeholder={isAr ? 'العدد' : 'Qty'}
                        title={isAr ? 'الكمية المصروفة' : 'Quantity'}
                      />

                      {rxForm.items.length > 1 && (
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => handleRemoveItem(idx)}
                          style={{ color: 'var(--accent-red)' }}
                          title={isAr ? 'حذف' : 'Remove'}
                        >
                          <TrashIcon width={16} height={16} />
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input
                        type="text"
                        className="input"
                        value={item.dosage}
                        onChange={(e) => handleUpdateItem(idx, 'dosage', e.target.value)}
                        placeholder={isAr ? 'الجرعة (مثال: حبة 3 مرات يومياً)' : 'Dosage (e.g. 1 tab 3x daily)'}
                        style={{ fontSize: 12 }}
                      />
                      <input
                        type="text"
                        className="input"
                        value={item.instructions}
                        onChange={(e) => handleUpdateItem(idx, 'instructions', e.target.value)}
                        placeholder={isAr ? 'التعليمات (مثال: بعد الطعام)' : 'Instructions (e.g. After meals)'}
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="label" style={{ fontSize: 12.5, fontWeight: 600 }}>
                  {isAr ? 'ملاحظات وتوجيهات الطبيب للصيدلاني والمريض:' : 'Clinical Notes & Patient Advice:'}
                </label>
                <textarea
                  className="input"
                  rows={2}
                  value={rxForm.notes}
                  onChange={(e) => setRxForm({ ...rxForm, notes: e.target.value })}
                  placeholder={isAr ? 'تعليمات إضافية...' : 'Additional prescription advice...'}
                  style={{ width: '100%', fontSize: 12.5 }}
                />
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewRxModalOpen(false)}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submittingRx}
                >
                  {submittingRx
                    ? isAr ? 'جاري الإصدار...' : 'Issuing...'
                    : isAr ? 'إصدار الوصفة الطبية' : 'Issue Prescription'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Print Prescription */}
      {selectedRx && (
        <div className="modal-backdrop">
          <div className="modal card" style={{ maxWidth: 580, width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                {isAr ? 'معاينة وطباعة الوصفة الطبية' : 'Prescription Slip'}
              </h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setSelectedRx(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body stack" style={{ gap: 18, padding: 20 }}>
              {/* Slip Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '2px solid var(--brand)',
                  paddingBottom: 12,
                }}
              >
                <BrandLogo />
                <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--brand)' }}>
                    {selectedRx.prescription_code}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    {selectedRx.created_at ? new Date(selectedRx.created_at).toLocaleDateString(isAr ? 'ar-IQ' : 'en-US') : ''}
                  </div>
                </div>
              </div>

              {/* Patient & Doctor Details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  background: 'var(--bg-subtle)',
                  padding: 12,
                  borderRadius: 'var(--r-md)',
                  fontSize: 12.5,
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'المريض: ' : 'Patient: '}</span>
                  <strong>{selectedRx.patient_name || `${selectedRx.patient_first_name || ''} ${selectedRx.patient_last_name || ''}`}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'الطبيب المعالج: ' : 'Physician: '}</span>
                  <strong>{selectedRx.doctor_name || user?.name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'رقم الهاتف: ' : 'Phone: '}</span>
                  <span>{selectedRx.patient_phone || '-'}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'الحالة: ' : 'Status: '}</span>
                  <span>{selectedRx.status === 'dispensed' ? (isAr ? 'تم الصرف' : 'Dispensed') : (isAr ? 'قيد الصرف' : 'Pending')}</span>
                </div>
              </div>

              {/* Medicines Table */}
              <div className="stack" style={{ gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                  Rx: {isAr ? 'الأدوية الموصوفة والتعليمات' : 'Prescribed Medications'}
                </span>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                      <th style={{ padding: '6px 10px', textAlign: isAr ? 'right' : 'left' }}>#</th>
                      <th style={{ padding: '6px 10px', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'الدواء' : 'Medication'}</th>
                      <th style={{ padding: '6px 10px', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'الجرعة والتكرار' : 'Dosage'}</th>
                      <th style={{ padding: '6px 10px', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'التعليمات' : 'Instructions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedRx.items || []).map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '8px 10px' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600 }}>{m.medication_name || m.name || `Med #${m.medication_id}`}</td>
                        <td style={{ padding: '8px 10px' }}>{m.dosage} ({m.duration || '5d'})</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>{m.instructions || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedRx.notes && (
                <div style={{ fontSize: 12, background: 'rgba(15, 110, 100, 0.05)', padding: 10, borderRadius: 'var(--r-sm)' }}>
                  <strong>{isAr ? 'ملاحظات الطبيب: ' : 'Physician Notes: '}</strong>
                  {selectedRx.notes}
                </div>
              )}

              {/* Signature Block */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: '1px dashed var(--border)',
                }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {isAr ? 'وصفة إلكترونية معتمدة · مجمع فيتا الطبي' : 'Certified E-Prescription · Vita Medical Complex'}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderBottom: '1px solid #000', width: 140, marginBottom: 4 }} />
                  <div style={{ fontSize: 11.5, fontWeight: 700 }}>
                    {selectedRx.doctor_name || user?.name}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button
                variant="outline"
                onClick={() => setSelectedRx(null)}
              >
                {isAr ? 'إغلاق' : 'Close'}
              </Button>
              <Button
                variant="primary"
                onClick={() => window.print()}
              >
                🖨️ {isAr ? 'طباعة الراشيتة' : 'Print Slip'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
