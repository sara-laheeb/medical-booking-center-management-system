import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import pharmacyService from '../../services/pharmacyService';
import patientService from '../../services/patientService';
import doctorService from '../../services/doctorService';

import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Alert from '../../components/common/Alert';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/Button';

import {
  MedicalCrossIcon,
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldIcon,
  InvoiceIcon,
  ArrowIcon,
} from '../../components/icons';

export default function PharmacyPage() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab synchronized with URL query parameter
  const activeTab = searchParams.get('tab') || 'prescriptions';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Data states
  const [prescriptions, setPrescriptions] = useState([]);
  const [medications, setMedications] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stats, setStats] = useState(null);

  // Filter states
  const [rxSearch, setRxSearch] = useState('');
  const [rxStatusFilter, setRxStatusFilter] = useState('all');
  const [medSearch, setMedSearch] = useState('');
  const [medCategoryFilter, setMedCategoryFilter] = useState('all');
  const [medStockFilter, setMedStockFilter] = useState('all'); // 'all' | 'low' | 'out' | 'expiring'
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [txSearch, setTxSearch] = useState('');

  // Modals state
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockOpData, setStockOpData] = useState({
    medication_id: '',
    operation_type: 'receive', // 'receive' | 'adjust' | 'return'
    quantity: 50,
    unit_cost: 500,
    reason: '',
    reference_id: '',
    batch_number: '',
    expiry_date: '',
    supplier: '',
    adjustment_type: 'correction', // 'correction' | 'damage' | 'deduct'
    return_direction: 'supplier', // 'supplier' | 'patient'
  });

  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [medTarget, setMedTarget] = useState(null);
  const [medFormData, setMedFormData] = useState({
    name: '',
    name_ar: '',
    generic_name: '',
    category: '',
    strength: '500mg',
    dosage_form: 'Tablet',
    manufacturer: '',
    barcode: '',
    batch_number: '',
    unit: 'tablet',
    stock_quantity: 50,
    minimum_stock: 10,
    cost_price: 500,
    selling_price: 1000,
    expiry_date: '2027-12-31',
    supplier: '',
  });

  const [viewMedDetails, setViewMedDetails] = useState(null);

  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    id: null,
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    is_active: true,
  });

  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [patientsList, setPatientsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [rxFormData, setRxFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_id: 1,
    notes: '',
    items: [
      {
        medication_id: '',
        quantity: 1,
        dosage: '1 tablet 3x daily',
        duration: '5 days',
        instructions: 'After meals',
      },
    ],
  });

  const [detailsRxTarget, setDetailsRxTarget] = useState(null);
  const [dispensingId, setDispensingId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Main data loader based on active tab
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'prescriptions') {
        const res = await pharmacyService.getPrescriptions({
          status: rxStatusFilter !== 'all' ? rxStatusFilter : undefined,
          limit: 100,
        });
        setPrescriptions(res?.data || []);
      } else if (activeTab === 'medications') {
        const [medsRes, suppRes] = await Promise.all([
          pharmacyService.getMedications({ limit: 100 }),
          pharmacyService.getSuppliers().catch(() => []),
        ]);
        setMedications(medsRes?.data || []);
        setSuppliers(suppRes?.data || suppRes || []);
      } else if (activeTab === 'stock') {
        const [txRes, medsRes, suppRes] = await Promise.all([
          pharmacyService.getTransactions({ limit: 100 }),
          pharmacyService.getMedications({ limit: 100 }),
          pharmacyService.getSuppliers().catch(() => []),
        ]);
        setTransactions(txRes?.data || []);
        setMedications(medsRes?.data || []);
        setSuppliers(suppRes?.data || suppRes || []);
      } else if (activeTab === 'suppliers') {
        const suppRes = await pharmacyService.getSuppliers();
        setSuppliers(suppRes?.data || suppRes || []);
      } else if (activeTab === 'reports') {
        const [statsRes, medsRes] = await Promise.all([
          pharmacyService.getStats(),
          pharmacyService.getMedications({ limit: 100 }),
        ]);
        setStats(statsRes?.data || statsRes);
        setMedications(medsRes?.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch pharmacy data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, rxStatusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load patient & doctor lists when opening New Prescription Modal
  useEffect(() => {
    if (isRxModalOpen) {
      Promise.all([
        patientService.getAll({ limit: 100 }),
        doctorService.getAll({ limit: 100 }),
        pharmacyService.getMedications({ limit: 100 }),
      ])
        .then(([pRes, dRes, mRes]) => {
          setPatientsList(pRes.data || []);
          setDoctorsList(dRes.data || []);
          setMedications(mRes.data || []);
        })
        .catch(() => {});
    }
  }, [isRxModalOpen]);

  // Handler: Save Medication (Create or Update)
  const handleSaveMedication = async (e) => {
    e.preventDefault();
    try {
      if (medTarget?.id) {
        await pharmacyService.updateMedication(medTarget.id, medFormData);
        showToast(isAr ? 'تم تحديث بيانات الدواء بنجاح.' : 'Medication updated successfully.');
      } else {
        await pharmacyService.createMedication(medFormData);
        showToast(isAr ? 'تمت إضافة الدواء إلى الكتالوج بنجاح.' : 'Medication added successfully.');
      }
      setIsMedModalOpen(false);
      setMedTarget(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save medication');
    }
  };

  // Handler: Execute Stock Operation (Receive / Adjust / Return)
  const handleExecuteStockOp = async (e) => {
    e.preventDefault();
    try {
      await pharmacyService.stockOperation(stockOpData);
      showToast(isAr ? 'تم تنفيذ حركة المخزون وتوثيق العملية في سجل التدقيق بنجاح.' : 'Stock operation executed and audit log recorded.');
      setIsStockModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to execute stock operation');
    }
  };

  // Handler: Save Supplier
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      await pharmacyService.saveSupplier(supplierFormData);
      showToast(isAr ? 'تم حفظ بيانات المورد بنجاح.' : 'Supplier saved successfully.');
      setIsSupplierModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save supplier');
    }
  };

  // Handler: Dispense Prescription
  const handleDispense = async (rxId) => {
    setDispensingId(rxId);
    try {
      await pharmacyService.dispensePrescription(rxId);
      showToast(isAr ? 'تم صرف الوصفة وتحديث أرصدة الأدوية بنجاح.' : 'Prescription dispensed successfully.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to dispense prescription');
    } finally {
      setDispensingId(null);
    }
  };

  // Handler: Cancel Prescription
  const handleCancelRx = async (rxId) => {
    try {
      await pharmacyService.cancelPrescription(rxId);
      showToast(isAr ? 'تم إلغاء الوصفة الطبية.' : 'Prescription cancelled.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel prescription');
    }
  };

  // Handler: Create Electronic Prescription
  const handleSaveRx = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patient_id: Number(rxFormData.patient_id),
        doctor_id: Number(rxFormData.doctor_id),
        appointment_id: Number(rxFormData.appointment_id) || 1,
        notes: rxFormData.notes || '',
        items: rxFormData.items
          .filter((item) => item.medication_id)
          .map((item) => ({
            medication_id: Number(item.medication_id),
            quantity: Number(item.quantity) || 1,
            dosage: item.dosage,
            duration: item.duration,
            instructions: item.instructions,
          })),
      };

      await pharmacyService.createPrescription(payload);
      showToast(isAr ? 'تم إصدار الوصفة الطبية الإلكترونية بنجاح.' : 'Electronic prescription issued successfully.');
      setIsRxModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create prescription');
    }
  };

  // Filtered lists
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      if (!rxSearch.trim()) return true;
      const q = rxSearch.toLowerCase();
      const code = (rx.prescription_code || '').toLowerCase();
      const pt = `${rx.patient_first_name || ''} ${rx.patient_last_name || ''} ${rx.patient_name || ''}`.toLowerCase();
      const doc = (rx.doctor_name || '').toLowerCase();
      return code.includes(q) || pt.includes(q) || doc.includes(q);
    });
  }, [prescriptions, rxSearch]);

  const categories = useMemo(() => {
    const set = new Set();
    medications.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set);
  }, [medications]);

  const filteredMedications = useMemo(() => {
    return medications.filter((m) => {
      // Stock filter
      if (medStockFilter === 'low' && !m.is_low_stock) return false;
      if (medStockFilter === 'out' && !m.is_out_of_stock) return false;
      if (medStockFilter === 'expiring' && !m.is_expiring_soon && !m.is_expired) return false;

      // Category filter
      if (medCategoryFilter !== 'all' && m.category !== medCategoryFilter) return false;

      // Search
      if (!medSearch.trim()) return true;
      const q = medSearch.toLowerCase();
      const name = (m.name || '').toLowerCase();
      const nameAr = (m.name_ar || '').toLowerCase();
      const gen = (m.generic_name || '').toLowerCase();
      const cat = (m.category || '').toLowerCase();
      const bar = (m.barcode || '').toLowerCase();
      const mfg = (m.manufacturer || '').toLowerCase();
      return name.includes(q) || nameAr.includes(q) || gen.includes(q) || cat.includes(q) || bar.includes(q) || mfg.includes(q);
    });
  }, [medications, medSearch, medCategoryFilter, medStockFilter]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (txTypeFilter !== 'all' && tx.transaction_type !== txTypeFilter) return false;
      if (!txSearch.trim()) return true;
      const q = txSearch.toLowerCase();
      const code = (tx.transaction_code || '').toLowerCase();
      const med = (tx.medication_name || '').toLowerCase();
      const ref = (tx.reference_id || '').toLowerCase();
      const perf = (tx.performer_name || '').toLowerCase();
      return code.includes(q) || med.includes(q) || ref.includes(q) || perf.includes(q);
    });
  }, [transactions, txTypeFilter, txSearch]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat(isAr ? 'ar-IQ' : 'en-US', {
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="stack" style={{ gap: 'var(--sp-6)' }}>
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
          <div className="eyebrow">{isAr ? 'مجمع فيتا الطبي · الصيدلية والمستودع الدوائي' : 'Vita Medical Complex · Pharmacy Dispensary'}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
            {t.pharmacy?.title || (isAr ? 'إدارة الصيدلية والمخزون الدوائي' : 'Pharmacy Management & Medications')}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {t.pharmacy?.subtitle || (isAr ? 'صرف الوصفات الإلكترونية، إدارة المخزون والموردين، وتوثيق حركات الصرف والتوريد' : 'Prescription fulfillment, pharmaceutical catalog, stock intake batches, supplier registry, and inventory audit logs')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCwIcon width={15} height={15} />
            <span>{t.dashboard?.refresh || (isAr ? 'تحديث' : 'Refresh')}</span>
          </Button>

          {activeTab === 'prescriptions' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setRxFormData({
                  patient_id: '',
                  doctor_id: '',
                  appointment_id: 1,
                  notes: '',
                  items: [
                    {
                      medication_id: '',
                      quantity: 1,
                      dosage: '1 tablet 3x daily',
                      duration: '5 days',
                      instructions: 'After meals',
                    },
                  ],
                });
                setIsRxModalOpen(true);
              }}
            >
              <PlusIcon width={16} height={16} />
              <span>{t.pharmacy?.newPrescription || (isAr ? 'وصفة طبية جديدة' : 'New Prescription')}</span>
            </Button>
          )}

          {activeTab === 'medications' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setMedTarget(null);
                setMedFormData({
                  name: '',
                  name_ar: '',
                  generic_name: '',
                  category: '',
                  strength: '500mg',
                  dosage_form: 'Tablet',
                  manufacturer: '',
                  barcode: '',
                  batch_number: '',
                  unit: 'tablet',
                  stock_quantity: 50,
                  minimum_stock: 10,
                  cost_price: 500,
                  selling_price: 1000,
                  expiry_date: '2027-12-31',
                  supplier: '',
                });
                setIsMedModalOpen(true);
              }}
            >
              <PlusIcon width={16} height={16} />
              <span>{t.pharmacy?.addMedication || (isAr ? 'إضافة دواء جديد' : 'Add Medication')}</span>
            </Button>
          )}

          {activeTab === 'stock' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setStockOpData({
                  medication_id: medications[0]?.id || '',
                  operation_type: 'receive',
                  quantity: 50,
                  unit_cost: 500,
                  reason: isAr ? 'استلام شحنة توريد جديدة' : 'Wholesale replenishment delivery',
                  reference_id: `PO-${Date.now().toString().slice(-6)}`,
                  batch_number: `BAT-${new Date().getFullYear()}-01`,
                  expiry_date: '2027-12-31',
                  supplier: suppliers[0]?.name || '',
                  adjustment_type: 'correction',
                  return_direction: 'supplier',
                });
                setIsStockModalOpen(true);
              }}
            >
              <PlusIcon width={16} height={16} />
              <span>{isAr ? 'تسجيل حركة مخزون' : 'Stock Operation'}</span>
            </Button>
          )}

          {activeTab === 'suppliers' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSupplierFormData({
                  id: null,
                  name: '',
                  contact_person: '',
                  phone: '',
                  email: '',
                  address: '',
                  tax_number: '',
                  is_active: true,
                });
                setIsSupplierModalOpen(true);
              }}
            >
              <PlusIcon width={16} height={16} />
              <span>{isAr ? 'إضافة مورد معتمد' : 'Add Supplier'}</span>
            </Button>
          )}

          {activeTab === 'reports' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
            >
              🖨️ <span>{isAr ? 'طباعة تقرير الجرد' : 'Print Report'}</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="error" title={isAr ? 'تنبيه' : 'Notice'} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 12,
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          className={`btn ${activeTab === 'prescriptions' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('prescriptions')}
        >
          <span>💊 {t.pharmacy?.tabPrescriptions || (isAr ? 'الوصفات والصرف' : 'Prescriptions & Dispensing')}</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'medications' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('medications')}
        >
          <span>📦 {t.pharmacy?.tabMedications || (isAr ? 'كتالوج الأدوية والأصناف' : 'Medication Catalog')}</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'stock' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('stock')}
        >
          <span>🔄 {isAr ? 'حركة المستودع والتوريد' : 'Stock Operations & Audit'}</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'suppliers' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <span>🏢 {isAr ? 'دليل الموردين' : 'Suppliers Directory'}</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('reports')}
        >
          <span>📊 {isAr ? 'تقارير الجرد والصلاحية' : 'Valuation & Expiry Reports'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRESCRIPTIONS & DISPENSING QUEUE                                   */}
      {/* ========================================================================= */}
      {activeTab === 'prescriptions' && (
        <div className="stack" style={{ gap: 'var(--sp-4)' }}>
          {/* Filter Bar */}
          <div
            className="card pad"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
              padding: '14px 20px',
            }}
          >
            <div className="search-bar" style={{ width: '100%', maxWidth: 380 }}>
              <SearchIcon width={16} height={16} />
              <input
                type="text"
                className="search-input"
                value={rxSearch}
                onChange={(e) => setRxSearch(e.target.value)}
                placeholder={t.pharmacy?.searchPrescriptions || (isAr ? 'بحث برقم الوصفة، اسم المريض، الطبيب...' : 'Search by code, patient, doctor...')}
              />
              {rxSearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setRxSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['all', 'pending', 'dispensed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`btn btn-sm ${rxStatusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setRxStatusFilter(st)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {st === 'all'
                    ? (isAr ? 'الكل' : 'All')
                    : st === 'pending'
                    ? (isAr ? 'قيد الانتظار' : 'Pending')
                    : st === 'dispensed'
                    ? (isAr ? 'تم الصرف' : 'Dispensed')
                    : (isAr ? 'ملغاة' : 'Cancelled')}
                </button>
              ))}
            </div>
          </div>

          {/* Prescriptions Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 40 }} />
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <EmptyState
                icon={<MedicalCrossIcon width={36} height={36} />}
                title={t.pharmacy?.noPrescriptionsFound || (isAr ? 'لا توجد وصفات طبية' : 'No prescriptions found')}
                description={isAr ? 'لا توجد وصفات مطابقة لخيارات الفلترة الحالية.' : 'No electronic prescriptions match the selected filter.'}
                actionLabel={t.pharmacy?.newPrescription || (isAr ? 'وصفة جديدة' : 'New Prescription')}
                onAction={() => setIsRxModalOpen(true)}
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'رقم الوصفة' : 'Code'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'المريض' : 'Patient'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'الطبيب المعالج' : 'Prescribing Doctor'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'تاريخ الإنشاء' : 'Date'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'الحالة' : 'Status'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {isAr ? 'الإجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrescriptions.map((rx) => {
                      const isPending = rx.status === 'pending';
                      return (
                        <tr
                          key={rx.id}
                          style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                        >
                          <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand)' }}>
                            {rx.prescription_code}
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--ink)' }}>
                            {rx.patient_name || `Patient #${rx.patient_id}`}
                            {rx.patient_phone && (
                              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{rx.patient_phone}</div>
                            )}
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: 13.5, color: 'var(--ink)' }}>
                            {rx.doctor_name || `Doctor #${rx.doctor_id}`}
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
                            {rx.created_at ? rx.created_at.substring(0, 10) : '—'}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <Badge
                              variant={
                                rx.status === 'dispensed'
                                  ? 'confirmed'
                                  : rx.status === 'pending'
                                  ? 'pending'
                                  : 'neutral'
                              }
                            >
                              {rx.status === 'dispensed'
                                ? (isAr ? 'تم الصرف' : 'Dispensed')
                                : rx.status === 'pending'
                                ? (isAr ? 'بانتظار الصرف' : 'Pending')
                                : (isAr ? 'ملغاة' : 'Cancelled')}
                            </Badge>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                              <button
                                type="button"
                                className="icon-btn"
                                title={isAr ? 'عرض تفاصيل الوصفة والأدوية' : 'View Prescription Details'}
                                onClick={async () => {
                                  try {
                                    const full = await pharmacyService.getPrescriptionById(rx.id);
                                    setDetailsRxTarget(full);
                                  } catch {
                                    setDetailsRxTarget(rx);
                                  }
                                }}
                              >
                                <EyeIcon width={15} height={15} />
                              </button>

                              {isPending && (
                                <>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleDispense(rx.id)}
                                    disabled={dispensingId === rx.id}
                                    style={{ fontSize: 11, padding: '3px 8px' }}
                                  >
                                    ✓ {dispensingId === rx.id ? '...' : (isAr ? 'صرف الدواء' : 'Dispense')}
                                  </Button>
                                  <button
                                    type="button"
                                    className="icon-btn"
                                    title={isAr ? 'إلغاء الوصفة' : 'Cancel'}
                                    onClick={() => handleCancelRx(rx.id)}
                                    style={{ color: 'var(--accent-red)' }}
                                  >
                                    ✕
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MEDICATIONS CATALOG & PHARMACEUTICAL ATTRIBUTES                     */}
      {/* ========================================================================= */}
      {activeTab === 'medications' && (
        <div className="stack" style={{ gap: 'var(--sp-4)' }}>
          {/* Search & Multi-Filters */}
          <div
            className="card pad"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
              padding: '14px 20px',
            }}
          >
            <div className="search-bar" style={{ width: '100%', maxWidth: 360 }}>
              <SearchIcon width={16} height={16} />
              <input
                type="text"
                className="search-input"
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم، الاسم العلمي، الباركود، الشركة...' : 'Search by name, generic, barcode, manufacturer...'}
              />
              {medSearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setMedSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Category selector */}
              <select
                className="input"
                style={{ padding: '6px 12px', fontSize: 12, height: 34, width: 'auto' }}
                value={medCategoryFilter}
                onChange={(e) => setMedCategoryFilter(e.target.value)}
              >
                <option value="all">{isAr ? 'جميع التصنيفات' : 'All Categories'}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Stock status filter */}
              {[
                { id: 'all', label: isAr ? 'الكل' : 'All' },
                { id: 'low', label: isAr ? 'منخفض' : 'Low Stock' },
                { id: 'out', label: isAr ? 'نفد' : 'Out of Stock' },
                { id: 'expiring', label: isAr ? 'قريب الانتهاء' : 'Expiring' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`btn btn-sm ${medStockFilter === f.id ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setMedStockFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Medications Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 40 }} />
              </div>
            ) : filteredMedications.length === 0 ? (
              <EmptyState
                icon={<MedicalCrossIcon width={36} height={36} />}
                title={isAr ? 'لا توجد أدوية مطابقة' : 'No medications found'}
                description={isAr ? 'جرّب تغيير كلمات البحث أو خيارات التصفية.' : 'No medication records match your search criteria.'}
                actionLabel={isAr ? 'إضافة دواء جديد' : 'Add Medication'}
                onAction={() => {
                  setMedTarget(null);
                  setIsMedModalOpen(true);
                }}
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'اسم الدواء والتركيز' : 'Medication & Strength'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'الاسم العلمي والشكل' : 'Generic & Form'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'التشغيلة والصلاحية' : 'Batch & Expiry'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'المخزون المتوفر' : 'Stock Level'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'التكلفة / البيع (د.ع)' : 'Cost / Retail (IQD)'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {isAr ? 'الإجراءات' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedications.map((m) => {
                      return (
                        <tr
                          key={m.id}
                          style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                        >
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{m.name}</div>
                            {m.name_ar && (
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.name_ar}</div>
                            )}
                            <div style={{ fontSize: 11.5, color: 'var(--brand)', marginTop: 2 }}>
                              {m.strength || 'Standard'} · {m.category || 'General'}
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontSize: 13, color: 'var(--ink)' }}>{m.generic_name || m.name}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                              {m.dosage_form || 'Tablet'} · {m.manufacturer || 'Standard'}
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>
                              {m.batch_number || `BAT-${m.id}`}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {m.expiry_date || '2027-12-31'}
                              </span>
                              {m.is_expired ? (
                                <Badge variant="cancelled">{isAr ? 'منتهي الصلاحية' : 'Expired'}</Badge>
                              ) : m.is_expiring_soon ? (
                                <Badge variant="warning">{isAr ? 'ينتهي قريباً' : 'Expiring'}</Badge>
                              ) : null}
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong
                                style={{
                                  fontSize: 14,
                                  color: m.is_out_of_stock
                                    ? 'var(--accent-red)'
                                    : m.is_low_stock
                                    ? 'var(--accent-orange, #d97706)'
                                    : 'var(--ink)',
                                }}
                              >
                                {m.stock_quantity} {m.unit}
                              </strong>
                              {m.is_out_of_stock ? (
                                <Badge variant="cancelled">{isAr ? 'نفد' : 'Out'}</Badge>
                              ) : m.is_low_stock ? (
                                <Badge variant="warning">{isAr ? 'منخفض' : 'Low'}</Badge>
                              ) : null}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {isAr ? 'الحد الأدنى' : 'Min'}: {m.minimum_stock}
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--brand)', fontSize: 13.5 }}>
                              {formatCurrency(m.selling_price)}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                              {isAr ? 'التكلفة' : 'Cost'}: {formatCurrency(m.cost_price)}
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                              <button
                                type="button"
                                className="icon-btn"
                                title={isAr ? 'عرض بطاقة الدواء الكاملة' : 'View Full Details'}
                                onClick={() => setViewMedDetails(m)}
                              >
                                <EyeIcon width={15} height={15} />
                              </button>

                              <button
                                type="button"
                                className="icon-btn"
                                title={isAr ? 'تعديل بيانات الصنف' : 'Edit Medication'}
                                onClick={() => {
                                  setMedTarget(m);
                                  setMedFormData({
                                    name: m.name || '',
                                    name_ar: m.name_ar || '',
                                    generic_name: m.generic_name || '',
                                    category: m.category || '',
                                    strength: m.strength || '500mg',
                                    dosage_form: m.dosage_form || 'Tablet',
                                    manufacturer: m.manufacturer || '',
                                    barcode: m.barcode || '',
                                    batch_number: m.batch_number || '',
                                    unit: m.unit || 'tablet',
                                    stock_quantity: m.stock_quantity || 0,
                                    minimum_stock: m.minimum_stock || 10,
                                    cost_price: m.cost_price || 0,
                                    selling_price: m.selling_price || 0,
                                    expiry_date: m.expiry_date || '2027-12-31',
                                    supplier: m.supplier || '',
                                  });
                                  setIsMedModalOpen(true);
                                }}
                              >
                                <EditIcon width={14} height={14} />
                              </button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setStockOpData({
                                    medication_id: m.id,
                                    operation_type: 'receive',
                                    quantity: 50,
                                    unit_cost: m.cost_price || 500,
                                    reason: isAr ? 'استلام شحنة توريد جديدة' : 'Wholesale batch delivery',
                                    reference_id: `PO-${Date.now().toString().slice(-6)}`,
                                    batch_number: m.batch_number || `BAT-${new Date().getFullYear()}-01`,
                                    expiry_date: m.expiry_date || '2027-12-31',
                                    supplier: m.supplier || '',
                                    adjustment_type: 'correction',
                                    return_direction: 'supplier',
                                  });
                                  setIsStockModalOpen(true);
                                }}
                                style={{ fontSize: 11, padding: '3px 8px' }}
                              >
                                📦 {isAr ? 'توريد / ضبط' : 'Stock'}
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STOCK OPERATIONS & IMMUTABLE AUDIT LOG                              */}
      {/* ========================================================================= */}
      {activeTab === 'stock' && (
        <div className="stack" style={{ gap: 'var(--sp-4)' }}>
          {/* Action Header & Filter */}
          <div
            className="card pad"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
              padding: '14px 20px',
            }}
          >
            <div className="search-bar" style={{ width: '100%', maxWidth: 360 }}>
              <SearchIcon width={16} height={16} />
              <input
                type="text"
                className="search-input"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder={isAr ? 'بحث برقم الحركة، اسم الدواء، المرجع...' : 'Search by code, medication, reference, user...'}
              />
              {txSearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setTxSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: isAr ? 'جميع العمليات' : 'All Operations' },
                { id: 'received', label: isAr ? 'توريد وارد' : 'Received' },
                { id: 'dispensed', label: isAr ? 'صرف مريض' : 'Dispensed' },
                { id: 'adjusted', label: isAr ? 'تسوية وتعديل' : 'Adjusted' },
                { id: 'returned', label: isAr ? 'مرتجع' : 'Returned' },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`btn btn-sm ${txTypeFilter === b.id ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTxTypeFilter(b.id)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Transactions Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 40 }} />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <EmptyState
                icon={<ArrowIcon width={36} height={36} />}
                title={isAr ? 'لا توجد حركات مسجلة' : 'No stock transactions found'}
                description={isAr ? 'سجل التدقيق يحفظ جميع عمليات التوريد والصرف والتسوية آلياً.' : 'All stock operations are immutably logged for inspection.'}
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'رقم الحركة' : 'Code'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'الدواء والصنف' : 'Medication'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'نوع العملية' : 'Operation Type'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'الكمية' : 'Quantity'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'الرصيد السابق ← الجديد' : 'Stock Level'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'السبب والمرجع' : 'Reason / Reference'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {isAr ? 'المنفذ والتاريخ' : 'User & Date'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id || tx.transaction_code}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                      >
                        <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand)' }}>
                          {tx.transaction_code}
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--ink)' }}>
                          {tx.medication_name}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <Badge
                            variant={
                              tx.transaction_type === 'received'
                                ? 'confirmed'
                                : tx.transaction_type === 'dispensed'
                                ? 'primary'
                                : tx.transaction_type === 'returned'
                                ? 'warning'
                                : 'neutral'
                            }
                          >
                            {tx.transaction_type === 'received' && (isAr ? 'توريد وارد' : 'Received')}
                            {tx.transaction_type === 'dispensed' && (isAr ? 'صرف مريض' : 'Dispensed')}
                            {tx.transaction_type === 'adjusted' && (isAr ? 'تسوية مخزون' : 'Adjusted')}
                            {tx.transaction_type === 'returned' && (isAr ? 'مرتجع' : 'Returned')}
                          </Badge>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                          <span
                            style={{
                              color:
                                tx.transaction_type === 'received' || (tx.transaction_type === 'returned' && tx.new_stock > tx.previous_stock)
                                  ? 'var(--accent-green, #10b981)'
                                  : 'var(--accent-red, #ef4444)',
                            }}
                          >
                            {tx.transaction_type === 'received' || (tx.transaction_type === 'returned' && tx.new_stock > tx.previous_stock)
                              ? `+${tx.quantity}`
                              : `-${tx.quantity}`}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: 13 }}>
                          {tx.previous_stock} → <strong style={{ color: 'var(--ink)' }}>{tx.new_stock}</strong>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 12.5 }}>
                          <div style={{ color: 'var(--ink)' }}>{tx.reason || '—'}</div>
                          {tx.reference_id && (
                            <div style={{ color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'monospace' }}>
                              Ref: {tx.reference_id}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                          <div>👤 {tx.performer_name || 'Staff'}</div>
                          <div>📅 {tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SUPPLIERS DIRECTORY                                                */}
      {/* ========================================================================= */}
      {activeTab === 'suppliers' && (
        <div className="stack" style={{ gap: 'var(--sp-4)' }}>
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {suppliers.map((s) => (
              <Card
                key={s.id}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{s.name}</div>
                    <Badge variant={s.is_active ? 'confirmed' : 'neutral'}>
                      {s.is_active ? (isAr ? 'معتمد نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}
                    </Badge>
                  </div>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'مسؤول الاتصال:' : 'Contact:'}</span>
                    <strong style={{ color: 'var(--ink)' }}>{s.contact_person || '—'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'رقم الهاتف:' : 'Phone:'}</span>
                    <span style={{ direction: 'ltr', fontWeight: 600 }}>{s.phone || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'البريد الإلكتروني:' : 'Email:'}</span>
                    <span>{s.email || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'العنوان:' : 'Address:'}</span>
                    <span>{s.address || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'الرقم الضريبي:' : 'Tax No:'}</span>
                    <span style={{ fontFamily: 'monospace' }}>{s.tax_number || '—'}</span>
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSupplierFormData({
                          id: s.id,
                          name: s.name,
                          contact_person: s.contact_person || '',
                          phone: s.phone || '',
                          email: s.email || '',
                          address: s.address || '',
                          tax_number: s.tax_number || '',
                          is_active: s.is_active !== false,
                        });
                        setIsSupplierModalOpen(true);
                      }}
                    >
                      <EditIcon width={13} height={13} />
                      <span>{isAr ? 'تعديل البيانات' : 'Edit'}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: VALUATION, LOW STOCK & EXPIRY REPORTS                               */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="stack" style={{ gap: 'var(--sp-6)' }}>
          {/* Summary KPI Cards */}
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <StatCard
              icon={<ShieldIcon width={20} height={20} />}
              value={stats?.totalMedicines ?? medications.length}
              label={isAr ? 'إجمالي الأصناف المسجلة' : 'Catalog Formulations'}
              delta={isAr ? 'أصناف فعالة في المستودع' : 'Active drug formulations'}
              trend="neutral"
            />

            <StatCard
              icon={<InvoiceIcon width={20} height={20} />}
              value={`${formatCurrency(stats?.totalInventoryValue)} IQD`}
              label={isAr ? 'القيمة الإجمالية للمخزون (سعر التكلفة)' : 'Wholesale Inventory Valuation'}
              delta={isAr ? 'إجمالي رأسمال الأدوية' : 'Based on supplier cost'}
              trend="up"
            />

            <StatCard
              icon={<MedicalCrossIcon width={20} height={20} />}
              value={stats?.lowStockCount ?? 0}
              label={isAr ? 'أصناف وصلت للحد الأدنى' : 'Low Stock Reorder Alerts'}
              delta={isAr ? 'تحتاج طلبية توريد' : 'Reorder recommended'}
              trend={(stats?.lowStockCount ?? 0) > 0 ? 'down' : 'up'}
            />

            <StatCard
              icon={<ClockIcon width={20} height={20} />}
              value={stats?.expiringCount ?? 0}
              label={isAr ? 'أصناف تقترب من نهاية الصلاحية' : 'Expiring Within 90 Days'}
              delta={isAr ? 'متابعة التاريخ والتشغيلة' : 'Safety monitoring'}
              trend={(stats?.expiringCount ?? 0) > 0 ? 'down' : 'up'}
            />
          </div>

          {/* Critical Low Stock Alert Table */}
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>⚠️ {isAr ? 'تقرير الأدوية المنخفضة والجاهزة للطلب' : 'Low Stock Replenishment Report'}</span>
                <Badge variant="warning">
                  {medications.filter((m) => m.is_low_stock).length} {isAr ? 'صنف' : 'Items'}
                </Badge>
              </div>
            }
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>{isAr ? 'الدواء' : 'Medication'}</th>
                    <th>{isAr ? 'الرصيد الحالي' : 'Current Stock'}</th>
                    <th>{isAr ? 'الحد الأدنى للأمان' : 'Safety Threshold'}</th>
                    <th>{isAr ? 'المورد المعتمد' : 'Supplier'}</th>
                    <th>{isAr ? 'الكمية المقترحة للطلب' : 'Suggested Reorder'}</th>
                  </tr>
                </thead>
                <tbody>
                  {medications
                    .filter((m) => m.is_low_stock || m.is_out_of_stock)
                    .map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>{m.name} ({m.strength})</td>
                        <td>
                          <Badge variant={m.is_out_of_stock ? 'cancelled' : 'warning'}>
                            {m.stock_quantity} {m.unit}
                          </Badge>
                        </td>
                        <td>{m.minimum_stock} {m.unit}</td>
                        <td>{m.supplier || 'Primary Supplier'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--brand)' }}>
                          +{Math.max(50, m.minimum_stock * 3 - m.stock_quantity)} {m.unit}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Expiry Risk Table */}
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>⏳ {isAr ? 'تقرير متابعة صلاحية الأدوية والتشغيلات' : 'Batch Expiry Risk Monitoring'}</span>
                <Badge variant="cancelled">
                  {medications.filter((m) => m.is_expired || m.is_expiring_soon).length} {isAr ? 'صنف' : 'Items'}
                </Badge>
              </div>
            }
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>{isAr ? 'الدواء' : 'Medication'}</th>
                    <th>{isAr ? 'رقم التشغيلة' : 'Batch #'}</th>
                    <th>{isAr ? 'تاريخ الانتهاء' : 'Expiry Date'}</th>
                    <th>{isAr ? 'الأيام المتبقية' : 'Days Remaining'}</th>
                    <th>{isAr ? 'حالة الصلاحية' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {medications
                    .filter((m) => m.is_expired || m.is_expiring_soon)
                    .map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>{m.name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{m.batch_number}</td>
                        <td>{m.expiry_date}</td>
                        <td style={{ fontWeight: 600 }}>
                          {m.days_until_expiry <= 0 ? 0 : m.days_until_expiry} {isAr ? 'يوم' : 'days'}
                        </td>
                        <td>
                          <Badge variant={m.is_expired ? 'cancelled' : 'warning'}>
                            {m.is_expired ? (isAr ? 'منتهي الصلاحية' : 'Expired') : (isAr ? 'ينتهي قريباً' : 'Expiring Soon')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: MEDICATION CREATE / EDIT (FULL 15 PHARMACEUTICAL ATTRIBUTES)      */}
      {/* ========================================================================= */}
      {isMedModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMedModalOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 720,
              width: '100%',
              borderRadius: 'var(--r-xl)',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-xl)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                {medTarget ? (isAr ? 'تعديل بيانات الصنف الدوائي' : 'Edit Medication Formulation') : (isAr ? 'تسجيل صنف دوائي جديد' : 'Register New Medication')}
              </h3>
            </div>

            <form onSubmit={handleSaveMedication} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="nav-scroll" style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Names */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="form-label required">{isAr ? 'الاسم التجاري (EN)' : 'Trade Name (EN)'}</label>
                    <input
                      type="text"
                      className="input"
                      value={medFormData.name}
                      onChange={(e) => setMedFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Amoxicillin 500mg"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">{isAr ? 'الاسم بالعربية (AR)' : 'Arabic Name (AR)'}</label>
                    <input
                      type="text"
                      className="input"
                      value={medFormData.name_ar}
                      onChange={(e) => setMedFormData((p) => ({ ...p, name_ar: e.target.value }))}
                      placeholder="أموكسيسيلين 500 ملغ"
                    />
                  </div>
                  <div>
                    <label className="form-label">{isAr ? 'الاسم العلمي (Generic)' : 'Generic Name'}</label>
                    <input
                      type="text"
                      className="input"
                      value={medFormData.generic_name}
                      onChange={(e) => setMedFormData((p) => ({ ...p, generic_name: e.target.value }))}
                      placeholder="Amoxicillin Trihydrate"
                    />
                  </div>
                </div>

                {/* Classification & Formulation */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="form-label">{isAr ? 'التصنيف الدوائي' : 'Category'}</label>
                    <input
                      type="text"
                      className="input"
                      value={medFormData.category}
                      onChange={(e) => setMedFormData((p) => ({ ...p, category: e.target.value }))}
                      placeholder="Antibiotics / Analgesics..."
                    />
                  </div>
                  <div>
                    <label className="form-label">{isAr ? 'التركيز (Strength)' : 'Strength'}</label>
                    <input
                      type="text"
                      className="input"
                      value={medFormData.strength}
                      onChange={(e) => setMedFormData((p) => ({ ...p, strength: e.target.value }))}
                      placeholder="500mg / 10ml"
                    />
                  </div>
                  <div>
                    <label className="form-label">{isAr ? 'الشكل الدوائي (Dosage Form)' : 'Dosage Form'}</label>
                    <select
                      className="input"
                      value={medFormData.dosage_form}
                      onChange={(e) => setMedFormData((p) => ({ ...p, dosage_form: e.target.value }))}
                    >
                      <option value="Tablet">Tablet (أقراص)</option>
                      <option value="Capsule">Capsule (كبسولات)</option>
                      <option value="Syrup">Syrup (شراب)</option>
                      <option value="Injection">Injection (حقن)</option>
                      <option value="Inhaler">Inhaler (بخاخ)</option>
                      <option value="Ointment">Ointment (مرهم)</option>
                      <option value="Drops">Drops (قطرات)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">{isAr ? 'الوحدة' : 'Unit'}</label>
                    <input
                      type="text"
                      className="input"
                      value={medFormData.unit}
                      onChange={(e) => setMedFormData((p) => ({ ...p, unit: e.target.value }))}
                      placeholder="tablet / bottle"
                    />
                  </div>
                </div>

                {/* Manufacturer, Barcode, Batch, Expiry */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="form-label">{isAr ? 'الشركة المصنعة' : 'Manufacturer'}</label>
                    <input
                      type="text"
                      className="input"
                      value={medFormData.manufacturer}
                      onChange={(e) => setMedFormData((p) => ({ ...p, manufacturer: e.target.value }))}
                      placeholder="e.g. SDI / GSK / Pfizer"
                    />
                  </div>
                  <div>
                    <label className="form-label">{isAr ? 'الباركود' : 'Barcode'}</label>
                    <input
                      type="text"
                      className="input"
                      value={medFormData.barcode}
                      onChange={(e) => setMedFormData((p) => ({ ...p, barcode: e.target.value }))}
                      placeholder="628100100101"
                    />
                  </div>
                  <div>
                    <label className="form-label">{isAr ? 'رقم التشغيلة' : 'Batch Number'}</label>
                    <input
                      type="text"
                      className="input"
                      value={medFormData.batch_number}
                      onChange={(e) => setMedFormData((p) => ({ ...p, batch_number: e.target.value }))}
                      placeholder="BAT-2026-A1"
                    />
                  </div>
                  <div>
                    <label className="form-label">{isAr ? 'تاريخ انتهاء الصلاحية' : 'Expiry Date'}</label>
                    <input
                      type="date"
                      className="input"
                      value={medFormData.expiry_date}
                      onChange={(e) => setMedFormData((p) => ({ ...p, expiry_date: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Inventory Stock & Pricing */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <div>
                    <label className="form-label">{isAr ? 'الرصيد الافتتاحي' : 'Initial Stock'}</label>
                    <input
                      type="number"
                      className="input"
                      value={medFormData.stock_quantity}
                      onChange={(e) => setMedFormData((p) => ({ ...p, stock_quantity: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">{isAr ? 'حد التنبيه الأدنى' : 'Min Alert'}</label>
                    <input
                      type="number"
                      className="input"
                      value={medFormData.minimum_stock}
                      onChange={(e) => setMedFormData((p) => ({ ...p, minimum_stock: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">{isAr ? 'سعر الشراء (د.ع)' : 'Purchase Cost'}</label>
                    <input
                      type="number"
                      className="input"
                      value={medFormData.cost_price}
                      onChange={(e) => setMedFormData((p) => ({ ...p, cost_price: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">{isAr ? 'سعر البيع (د.ع)' : 'Selling Price'}</label>
                    <input
                      type="number"
                      className="input"
                      value={medFormData.selling_price}
                      onChange={(e) => setMedFormData((p) => ({ ...p, selling_price: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                {/* Supplier */}
                <div>
                  <label className="form-label">{isAr ? 'المورد المعتمد' : 'Primary Supplier'}</label>
                  <input
                    type="text"
                    className="input"
                    list="suppliers-datalist"
                    value={medFormData.supplier}
                    onChange={(e) => setMedFormData((p) => ({ ...p, supplier: e.target.value }))}
                    placeholder="e.g. Al-Amal Pharmaceuticals Ltd."
                  />
                  <datalist id="suppliers-datalist">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'var(--bg-subtle)' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsMedModalOpen(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {isAr ? 'حفظ الصنف الدوائي' : 'Save Medication'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MEDICATION DETAILS CARD MODAL                                     */}
      {/* ========================================================================= */}
      {viewMedDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewMedDetails(null);
          }}
        >
          <div
            className="card pad"
            style={{
              maxWidth: 580,
              width: '100%',
              borderRadius: 'var(--r-xl)',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  {viewMedDetails.name}
                </h3>
                {viewMedDetails.name_ar && (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {viewMedDetails.name_ar}
                  </div>
                )}
              </div>
              <Badge variant={viewMedDetails.is_out_of_stock ? 'cancelled' : viewMedDetails.is_low_stock ? 'warning' : 'confirmed'}>
                {viewMedDetails.is_out_of_stock ? (isAr ? 'نفد الرصيد' : 'Out of Stock') : viewMedDetails.is_low_stock ? (isAr ? 'منخفض' : 'Low Stock') : (isAr ? 'متوفر' : 'In Stock')}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '16px 0', fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'الاسم العلمي:' : 'Generic Name:'}</span>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{viewMedDetails.generic_name || viewMedDetails.name}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'التركيز والشكل:' : 'Strength & Form:'}</span>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{viewMedDetails.strength} · {viewMedDetails.dosage_form}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'الشركة المصنعة:' : 'Manufacturer:'}</span>
                <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{viewMedDetails.manufacturer}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'الباركود الدولي:' : 'Barcode:'}</span>
                <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{viewMedDetails.barcode}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'رقم التشغيلة:' : 'Batch #:'}</span>
                <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{viewMedDetails.batch_number}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'تاريخ الصلاحية:' : 'Expiry Date:'}</span>
                <div style={{ fontWeight: 600, color: viewMedDetails.is_expired ? 'var(--accent-red)' : 'var(--ink)' }}>
                  {viewMedDetails.expiry_date} ({viewMedDetails.days_until_expiry} {isAr ? 'يوم متبقي' : 'days left'})
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'الرصيد الحالي بالمستودع:' : 'Current Stock:'}</span>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--brand)' }}>
                  {viewMedDetails.stock_quantity} {viewMedDetails.unit}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'حد التنبيه الأدنى:' : 'Minimum Stock:'}</span>
                <div style={{ fontWeight: 600 }}>{viewMedDetails.minimum_stock} {viewMedDetails.unit}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'سعر الشراء / التكلفة:' : 'Cost Price:'}</span>
                <div style={{ fontWeight: 600 }}>{formatCurrency(viewMedDetails.cost_price)} IQD</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'سعر البيع للجمهور:' : 'Retail Price:'}</span>
                <div style={{ fontWeight: 700, color: 'var(--brand)' }}>{formatCurrency(viewMedDetails.selling_price)} IQD</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'المورد المعتمد:' : 'Supplier:'}</span>
                <div style={{ fontWeight: 600 }}>{viewMedDetails.supplier}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <Button variant="outline" size="sm" onClick={() => setViewMedDetails(null)}>
                {isAr ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: STOCK OPERATION (RECEIVE / ADJUST / RETURN)                       */}
      {/* ========================================================================= */}
      {isStockModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsStockModalOpen(false);
          }}
        >
          <div
            className="card pad"
            style={{
              maxWidth: 580,
              width: '100%',
              borderRadius: 'var(--r-xl)',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: 'var(--ink)' }}>
              📦 {isAr ? 'تنفيذ حركة مستودع وضبط مخزون' : 'Stock Operation & Inventory Intake'}
            </h3>

            <form onSubmit={handleExecuteStockOp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label required">{isAr ? 'الصنف الدوائي' : 'Select Medication'}</label>
                <select
                  className="input"
                  value={stockOpData.medication_id}
                  onChange={(e) => setStockOpData((p) => ({ ...p, medication_id: e.target.value }))}
                  required
                >
                  <option value="">{isAr ? '-- اختر الدواء --' : '-- Choose medication --'}</option>
                  {medications.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.stock_quantity} {m.unit} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label required">{isAr ? 'نوع الحركة' : 'Operation Type'}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { id: 'receive', label: isAr ? '📥 توريد واستلام' : '📥 Receive Stock' },
                    { id: 'adjust', label: isAr ? '⚖️ تسوية وتعديل' : '⚖️ Adjustment' },
                    { id: 'return', label: isAr ? '↩️ مرتجع' : '↩️ Return' },
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      className={`btn btn-sm ${stockOpData.operation_type === op.id ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setStockOpData((p) => ({ ...p, operation_type: op.id }))}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label required">{isAr ? 'الكمية' : 'Quantity'}</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={stockOpData.quantity}
                    onChange={(e) => setStockOpData((p) => ({ ...p, quantity: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">{isAr ? 'سعر التكلفة للوحدة (د.ع)' : 'Unit Cost (IQD)'}</label>
                  <input
                    type="number"
                    className="input"
                    value={stockOpData.unit_cost}
                    onChange={(e) => setStockOpData((p) => ({ ...p, unit_cost: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Receive specific inputs */}
              {stockOpData.operation_type === 'receive' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">{isAr ? 'رقم التشغيلة (Batch #)' : 'Batch Number'}</label>
                    <input
                      type="text"
                      className="input"
                      value={stockOpData.batch_number}
                      onChange={(e) => setStockOpData((p) => ({ ...p, batch_number: e.target.value }))}
                      placeholder="BAT-2026-X"
                    />
                  </div>
                  <div>
                    <label className="form-label">{isAr ? 'تاريخ الصلاحية' : 'Expiry Date'}</label>
                    <input
                      type="date"
                      className="input"
                      value={stockOpData.expiry_date}
                      onChange={(e) => setStockOpData((p) => ({ ...p, expiry_date: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Reference ID & Reason */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">{isAr ? 'رقم الفاتورة / أمر الشراء' : 'Reference / PO #'}</label>
                  <input
                    type="text"
                    className="input"
                    value={stockOpData.reference_id}
                    onChange={(e) => setStockOpData((p) => ({ ...p, reference_id: e.target.value }))}
                    placeholder="PO-2026-0881"
                  />
                </div>
                <div>
                  <label className="form-label">{isAr ? 'المورد' : 'Supplier'}</label>
                  <input
                    type="text"
                    className="input"
                    list="stock-suppliers"
                    value={stockOpData.supplier}
                    onChange={(e) => setStockOpData((p) => ({ ...p, supplier: e.target.value }))}
                    placeholder="Al-Amal Pharma"
                  />
                  <datalist id="stock-suppliers">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="form-label required">{isAr ? 'السبب وملاحظات التدقيق' : 'Reason / Audit Note'}</label>
                <input
                  type="text"
                  className="input"
                  value={stockOpData.reason}
                  onChange={(e) => setStockOpData((p) => ({ ...p, reason: e.target.value }))}
                  placeholder={isAr ? 'سبب الحركة لتوثيق سجل التدقيق' : 'Reason for stock change'}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsStockModalOpen(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {isAr ? 'تنفيذ الحركة وتحديث الأرصدة' : 'Execute & Log Transaction'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD / EDIT SUPPLIER                                              */}
      {/* ========================================================================= */}
      {isSupplierModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSupplierModalOpen(false);
          }}
        >
          <div
            className="card pad"
            style={{
              maxWidth: 520,
              width: '100%',
              borderRadius: 'var(--r-xl)',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: 'var(--ink)' }}>
              🏢 {supplierFormData.id ? (isAr ? 'تعديل بيانات المورد' : 'Edit Supplier') : (isAr ? 'إضافة مورد معتمد جديد' : 'Add New Supplier')}
            </h3>

            <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label required">{isAr ? 'اسم شركة التوريد' : 'Supplier / Company Name'}</label>
                <input
                  type="text"
                  className="input"
                  value={supplierFormData.name}
                  onChange={(e) => setSupplierFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">{isAr ? 'الشخص المسؤول' : 'Contact Person'}</label>
                  <input
                    type="text"
                    className="input"
                    value={supplierFormData.contact_person}
                    onChange={(e) => setSupplierFormData((p) => ({ ...p, contact_person: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">{isAr ? 'رقم الهاتف' : 'Phone'}</label>
                  <input
                    type="text"
                    className="input"
                    value={supplierFormData.phone}
                    onChange={(e) => setSupplierFormData((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input
                    type="email"
                    className="input"
                    value={supplierFormData.email}
                    onChange={(e) => setSupplierFormData((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">{isAr ? 'الرقم الضريبي' : 'Tax / Registry #'}</label>
                  <input
                    type="text"
                    className="input"
                    value={supplierFormData.tax_number}
                    onChange={(e) => setSupplierFormData((p) => ({ ...p, tax_number: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">{isAr ? 'العنوان والمقر' : 'Office Address'}</label>
                <input
                  type="text"
                  className="input"
                  value={supplierFormData.address}
                  onChange={(e) => setSupplierFormData((p) => ({ ...p, address: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsSupplierModalOpen(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {isAr ? 'حفظ المورد' : 'Save Supplier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: NEW ELECTRONIC PRESCRIPTION MODAL                                */}
      {/* ========================================================================= */}
      {isRxModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRxModalOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 680,
              width: '100%',
              borderRadius: 'var(--r-xl)',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-xl)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {t.pharmacy?.newPrescription || (isAr ? 'إصدار وصفة طبية إلكترونية' : 'New Electronic Prescription')}
              </h3>
            </div>

            <form onSubmit={handleSaveRx} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="nav-scroll" style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label required">{isAr ? 'المريض' : 'Patient'}</label>
                    <select
                      className="input"
                      value={rxFormData.patient_id}
                      onChange={(e) => setRxFormData((p) => ({ ...p, patient_id: e.target.value }))}
                      required
                    >
                      <option value="">{isAr ? '-- اختر المريض --' : '-- Choose patient --'}</option>
                      {patientsList.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                          {pt.first_name} {pt.last_name} ({pt.mrn})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label required">{isAr ? 'الطبيب المعالج' : 'Doctor'}</label>
                    <select
                      className="input"
                      value={rxFormData.doctor_id}
                      onChange={(e) => setRxFormData((p) => ({ ...p, doctor_id: e.target.value }))}
                      required
                    >
                      <option value="">{isAr ? '-- اختر الطبيب --' : '-- Choose doctor --'}</option>
                      {doctorsList.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.user?.name || d.name || `Dr. #${d.id}`} ({d.specialty?.name || 'Specialist'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">{isAr ? 'تعليمات وإرشادات الطبيب' : 'Clinical Notes'}</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={rxFormData.notes}
                    onChange={(e) => setRxFormData((p) => ({ ...p, notes: e.target.value }))}
                    placeholder={isAr ? 'ملاحظات عن طريقة الاستخدام...' : 'Clinical guidance notes...'}
                  />
                </div>

                {/* Items */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{isAr ? 'الأدوية الموصوفة:' : 'Prescribed Medications:'}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() =>
                        setRxFormData((p) => ({
                          ...p,
                          items: [
                            ...p.items,
                            { medication_id: '', quantity: 1, dosage: '1 tablet 3x daily', duration: '5 days', instructions: 'After meals' },
                          ],
                        }))
                      }
                    >
                      + {isAr ? 'إضافة دواء آخر' : 'Add Medication Item'}
                    </Button>
                  </div>

                  {rxFormData.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: 12,
                        borderRadius: 'var(--r-md)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-subtle)',
                        marginBottom: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                        <div>
                          <label className="form-label required">{isAr ? 'الدواء' : 'Medication'}</label>
                          <select
                            className="input"
                            value={item.medication_id}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRxFormData((p) => {
                                const next = [...p.items];
                                next[idx].medication_id = val;
                                return { ...p, items: next };
                              });
                            }}
                            required
                          >
                            <option value="">{isAr ? '-- اختر الدواء --' : '-- Choose medication --'}</option>
                            {medications.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.stock_quantity} in stock)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label required">{isAr ? 'الكمية' : 'Quantity'}</label>
                          <input
                            type="number"
                            min="1"
                            className="input"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRxFormData((p) => {
                                const next = [...p.items];
                                next[idx].quantity = val;
                                return { ...p, items: next };
                              });
                            }}
                            required
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                        <div>
                          <label className="form-label">{isAr ? 'الجرعة' : 'Dosage'}</label>
                          <input
                            type="text"
                            className="input"
                            value={item.dosage}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRxFormData((p) => {
                                const next = [...p.items];
                                next[idx].dosage = val;
                                return { ...p, items: next };
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label className="form-label">{isAr ? 'المدة' : 'Duration'}</label>
                          <input
                            type="text"
                            className="input"
                            value={item.duration}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRxFormData((p) => {
                                const next = [...p.items];
                                next[idx].duration = val;
                                return { ...p, items: next };
                              });
                            }}
                          />
                        </div>
                        <div>
                          <label className="form-label">{isAr ? 'التعليمات' : 'Instructions'}</label>
                          <input
                            type="text"
                            className="input"
                            value={item.instructions}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRxFormData((p) => {
                                const next = [...p.items];
                                next[idx].instructions = val;
                                return { ...p, items: next };
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'var(--bg-subtle)' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsRxModalOpen(false)}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {isAr ? 'إصدار الوصفة' : 'Issue Prescription'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: PRESCRIPTION DETAILS & DISPENSE MODAL                            */}
      {/* ========================================================================= */}
      {detailsRxTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailsRxTarget(null);
          }}
        >
          <div
            className="card pad"
            style={{
              maxWidth: 620,
              width: '100%',
              borderRadius: 'var(--r-xl)',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--brand)' }}>
                  {detailsRxTarget.prescription_code}
                </h3>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {detailsRxTarget.patient_name} · {detailsRxTarget.doctor_name}
                </div>
              </div>
              <Badge variant={detailsRxTarget.status === 'dispensed' ? 'confirmed' : detailsRxTarget.status === 'pending' ? 'pending' : 'neutral'}>
                {detailsRxTarget.status}
              </Badge>
            </div>

            <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{isAr ? 'الأدوية المقررة في الوصفة:' : 'Prescription Items:'}</div>
              {detailsRxTarget.items && detailsRxTarget.items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {detailsRxTarget.items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--r-md)',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>💊 {it.medication_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {it.dosage} · {it.duration} · {it.instructions}
                        </div>
                      </div>
                      <Badge variant="primary">{it.quantity} {isAr ? 'وحدة' : 'units'}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {isAr ? 'تم تسجيل عناصر الوصفة في السجل الدوائي.' : 'Standard prescription items registered.'}
                </div>
              )}

              {detailsRxTarget.notes && (
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 6 }}>
                  <strong>{isAr ? 'إرشادات الطبيب:' : 'Doctor Guidance:'}</strong> {detailsRxTarget.notes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <Button variant="outline" size="sm" onClick={() => setDetailsRxTarget(null)}>
                {isAr ? 'إغلاق' : 'Close'}
              </Button>
              {detailsRxTarget.status === 'pending' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleDispense(detailsRxTarget.id);
                    setDetailsRxTarget(null);
                  }}
                >
                  ✓ {isAr ? 'صرف هذه الوصفة الآن' : 'Dispense Now'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
