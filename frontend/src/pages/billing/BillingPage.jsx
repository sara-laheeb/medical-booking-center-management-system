import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import billingService from '../../services/billingService';
import patientService from '../../services/patientService';
import doctorService from '../../services/doctorService';
import userService from '../../services/userService';

import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Alert from '../../components/common/Alert';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/Button';

import {
  InvoiceIcon,
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  ChartIcon,
  UsersIcon,
  EyeIcon,
  StethoscopeIcon,
  ShieldIcon,
} from '../../components/icons';

export default function BillingPage() {
  const { role, user } = useAuth();
  const isManager = role === 'admin';
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'debts' | 'expenses' | 'pricing'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Invoices state
  const [invoices, setInvoices] = useState([]);
  const [invSearch, setInvSearch] = useState('');
  const [invStatusFilter, setInvStatusFilter] = useState('all');

  // Financial summary & expenses state
  const [expenses, setExpenses] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);

  // Management: Pricing & Users
  const [usersList, setUsersList] = useState([]);
  const [doctorFees, setDoctorFees] = useState({});
  const [savingFeeId, setSavingFeeId] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    category: 'other',
    amount: '',
    expense_date: new Date().toISOString().substring(0, 10),
    notes: '',
  });

  const [patientsList, setPatientsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [newInvoiceData, setNewInvoiceData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_id: 1,
    discount: 0,
    tax: 0,
    notes: '',
    items: [{ description: 'General Consultation', item_type: 'consultation', quantity: 1, unit_price: 25000 }],
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'invoices' || activeTab === 'debts') {
        const res = await billingService.getInvoices({
          status: activeTab === 'debts' ? undefined : (invStatusFilter !== 'all' ? invStatusFilter : undefined),
          limit: 100,
        });
        setInvoices(res.data || []);
      } else if (activeTab === 'expenses') {
        const [expRes, sumRes] = await Promise.all([
          billingService.getExpenses({ limit: 100 }),
          billingService.getFinancialSummary(),
        ]);
        setExpenses(expRes.data || []);
        setFinancialSummary(sumRes || null);
      } else if (activeTab === 'pricing') {
        const [dRes, uRes] = await Promise.all([
          doctorService.getAll({ limit: 100 }),
          userService.getAll({ limit: 100 }),
        ]);
        setDoctorsList(dRes.data || []);
        setUsersList(uRes.data || []);
        const fees = {};
        (dRes.data || []).forEach((d) => {
          fees[d.id] = d.consultation_fee;
        });
        setDoctorFees(fees);
      }
    } catch (err) {
      setError(err.message || 'Failed to load billing records');
    } finally {
      setLoading(false);
    }
  }, [activeTab, invStatusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load lookup lists for invoice modal
  useEffect(() => {
    if (isInvoiceModalOpen) {
      Promise.all([
        patientService.getAll({ limit: 100 }),
        doctorService.getAll({ limit: 100 }),
      ]).then(([pRes, dRes]) => {
        setPatientsList(pRes.data || []);
        setDoctorsList(dRes.data || []);
      }).catch(() => {});
    }
  }, [isInvoiceModalOpen]);

  // Record Payment
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!paymentTarget) return;
    try {
      await billingService.recordPayment(paymentTarget.id, {
        amount: Number(paymentAmount),
        payment_method: paymentMethod,
      });
      showToast(t.billing?.successPayment || 'Payment recorded successfully.');
      setIsPaymentModalOpen(false);
      setPaymentTarget(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Payment processing failed');
    }
  };

  // Record Expense
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    try {
      await billingService.recordExpense({
        ...expenseFormData,
        amount: Number(expenseFormData.amount),
      });
      showToast(t.billing?.successExpense || 'Expense recorded successfully.');
      setIsExpenseModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to record expense');
    }
  };

  // Create Invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patient_id: Number(newInvoiceData.patient_id),
        doctor_id: Number(newInvoiceData.doctor_id) || null,
        appointment_id: Number(newInvoiceData.appointment_id) || null,
        discount: Number(newInvoiceData.discount) || 0,
        tax: Number(newInvoiceData.tax) || 0,
        notes: newInvoiceData.notes || '',
        items: newInvoiceData.items.map((i) => ({
          description: i.description,
          item_type: i.item_type,
          quantity: Number(i.quantity) || 1,
          unit_price: Number(i.unit_price) || 0,
        })),
      };

      await billingService.createInvoice(payload);
      showToast(t.billing?.successInvoice || 'Invoice generated successfully.');
      setIsInvoiceModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create invoice');
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (!invSearch.trim()) return true;
    const q = invSearch.toLowerCase();
    const code = (inv.invoice_code || '').toLowerCase();
    const pt = `${inv.patient_first_name || ''} ${inv.patient_last_name || ''} ${inv.patient_name || ''}`.toLowerCase();
    return code.includes(q) || pt.includes(q);
  });

  // Debts and receivables calculation
  const debtInvoices = invoices.filter((inv) => {
    const remaining = Math.max(0, Number(inv.total) - Number(inv.paid_amount));
    const isUnsettled = remaining > 0 && inv.status !== 'refunded';
    if (!isUnsettled) return false;
    if (!invSearch.trim()) return true;
    const q = invSearch.toLowerCase();
    const code = (inv.invoice_code || '').toLowerCase();
    const pt = `${inv.patient_first_name || ''} ${inv.patient_last_name || ''} ${inv.patient_name || ''}`.toLowerCase();
    return code.includes(q) || pt.includes(q);
  });

  const totalOutstandingDebts = debtInvoices.reduce((sum, inv) => {
    return sum + Math.max(0, Number(inv.total) - Number(inv.paid_amount));
  }, 0);

  const uniqueDebtorsCount = new Set(debtInvoices.map((inv) => inv.patient_id)).size;

  // Management: Save doctor consultation fee
  const handleSaveDoctorFee = async (doctorId) => {
    const feeVal = Number(doctorFees[doctorId]);
    if (isNaN(feeVal) || feeVal < 0) {
      setError(isAr ? 'يرجى إدخال مبلغ كشف صالح' : 'Please enter a valid consultation fee amount');
      return;
    }
    setSavingFeeId(doctorId);
    try {
      await doctorService.update(doctorId, { consultation_fee: feeVal });
      showToast(t.billing?.feeSaved || 'Consultation fee updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update consultation fee');
    } finally {
      setSavingFeeId(null);
    }
  };

  // Management: Toggle user status
  const handleToggleUserStatus = async (userItem) => {
    setUpdatingUserId(userItem.id);
    try {
      const nextStatus = !userItem.is_active;
      await userService.updateStatus(userItem.id, nextStatus);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, is_active: nextStatus ? 1 : 0 } : u))
      );
      showToast(t.billing?.userUpdated || 'User account status updated.');
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Management: Change user role
  const handleChangeUserRole = async (userItem, newRole) => {
    if (userItem.role === newRole) return;
    setUpdatingUserId(userItem.id);
    try {
      await userService.updateRole(userItem.id, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, role: newRole } : u))
      );
      showToast(t.billing?.userUpdated || 'User role permission updated.');
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
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
          <div className="eyebrow">{t.appNav?.branchTag || 'Baghdad · Main Branch'}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
            {t.billing?.title || 'Invoices & Financial Management'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {t.billing?.subtitle || 'Patient billing invoices, payments processing, operational expenses, and financial summaries'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCwIcon width={15} height={15} />
            <span>{t.dashboard?.refresh || 'Refresh'}</span>
          </Button>

          {(activeTab === 'invoices' || activeTab === 'debts') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setNewInvoiceData({
                  patient_id: '',
                  doctor_id: '',
                  appointment_id: 1,
                  discount: 0,
                  tax: 0,
                  notes: '',
                  items: [{ description: 'General Consultation', item_type: 'consultation', quantity: 1, unit_price: 25000 }],
                });
                setIsInvoiceModalOpen(true);
              }}
            >
              <PlusIcon width={16} height={16} />
              <span>{t.billing?.newInvoice || 'Generate Invoice'}</span>
            </Button>
          )}

          {activeTab === 'expenses' && isManager && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setExpenseFormData({
                  title: '',
                  category: 'other',
                  amount: '',
                  expense_date: new Date().toISOString().substring(0, 10),
                  notes: '',
                });
                setIsExpenseModalOpen(true);
              }}
            >
              <PlusIcon width={16} height={16} />
              <span>{t.billing?.recordExpense || 'Record Expense'}</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Notice">
          {error}
        </Alert>
      )}

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'invoices' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('invoices')}
        >
          <span>🧾 {t.billing?.tabInvoices || 'Invoices & Receipts'}</span>
        </button>

        <button
          type="button"
          className={`btn ${activeTab === 'debts' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('debts')}
        >
          <span>⏳ {t.billing?.tabDebts || 'Debts & Receivables'}</span>
        </button>

        {isManager && (
          <button
            type="button"
            className={`btn ${activeTab === 'expenses' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('expenses')}
          >
            <span>📊 {t.billing?.tabExpenses || 'Financial & Operating Expenses'}</span>
          </button>
        )}

        {isManager && (
          <button
            type="button"
            className={`btn ${activeTab === 'pricing' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('pricing')}
          >
            <span>⚙️ {t.billing?.tabPricing || 'Pricing & Permissions'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === 'invoices' && (
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
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                placeholder={t.billing?.searchInvoices || 'Search invoices by code, patient...'}
              />
              {invSearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setInvSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'paid', 'unpaid', 'partial', 'refunded'].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`btn btn-sm ${invStatusFilter === st ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setInvStatusFilter(st)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {st === 'all' ? t.appointments?.filterAll || 'All' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 40 }} />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <EmptyState
                icon={<InvoiceIcon width={36} height={36} />}
                title={t.billing?.noInvoicesFound || 'No invoices found'}
                description={isAr ? 'لا توجد فواتير مطابقة لخيارات الفلترة.' : 'No invoices match the selected filter.'}
                actionLabel={t.billing?.newInvoice || 'Generate Invoice'}
                onAction={() => setIsInvoiceModalOpen(true)}
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colInvoiceCode || 'Invoice #'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colPatient || 'Patient'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colTotal || 'Total (IQD)'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colPaid || 'Paid'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colStatus || 'Status'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {t.billing?.colActions || 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => {
                      const patientName = `${inv.patient_first_name || ''} ${inv.patient_last_name || ''}`.trim() || inv.patient_name || `Patient #${inv.patient_id}`;
                      const remaining = Math.max(0, Number(inv.total) - Number(inv.paid_amount));
                      return (
                        <tr
                          key={inv.id}
                          style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                        >
                          <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand)' }}>
                            {inv.invoice_code}
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--ink)' }}>
                            {patientName}
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--ink)' }}>
                            {Number(inv.total).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
                            {Number(inv.paid_amount).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <Badge
                              variant={
                                inv.status === 'paid'
                                  ? 'confirmed'
                                  : inv.status === 'partial'
                                  ? 'pending'
                                  : 'neutral'
                              }
                            >
                              {inv.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            {inv.status !== 'paid' && remaining > 0 && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  setPaymentTarget(inv);
                                  setPaymentAmount(String(remaining));
                                  setPaymentMethod('cash');
                                  setIsPaymentModalOpen(true);
                                }}
                                style={{ fontSize: 11, padding: '3px 8px' }}
                              >
                                💳 {t.billing?.recordPayment || 'Pay'}
                              </Button>
                            )}
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

      {/* TAB 2: DEBTS & RECEIVABLES */}
      {activeTab === 'debts' && (
        <div className="stack" style={{ gap: 'var(--sp-4)' }}>
          {/* Debt KPI Summary Cards */}
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            <StatCard
              icon={<InvoiceIcon width={20} height={20} />}
              value={`${totalOutstandingDebts.toLocaleString()} IQD`}
              label={t.billing?.outstandingDebts || 'Total Outstanding Debts'}
              delta={isAr ? 'مستحقات معلقة في ذمة المرضى' : 'Unsettled receivables'}
              trend="down"
              featured
              featuredTag="DEBTS"
            />
            <StatCard
              icon={<UsersIcon width={20} height={20} />}
              value={uniqueDebtorsCount}
              label={t.billing?.activeDebtors || 'Active Debtors'}
              delta={isAr ? 'مرضى لديهم مبالغ غير مسددة' : 'Patients with unpaid balance'}
              trend="neutral"
            />
            <StatCard
              icon={<ChartIcon width={20} height={20} />}
              value={debtInvoices.length}
              label={t.billing?.unpaidInvoices || 'Invoices with Pending Balance'}
              delta={isAr ? 'فواتير غير مسددة بالكامل' : 'Invoices requiring follow-up'}
              trend="neutral"
            />
          </div>

          {/* Search bar */}
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
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                placeholder={t.billing?.searchInvoices || 'Search invoices by code, patient...'}
              />
              {invSearch && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setInvSearch('')}
                >
                  ✕
                </button>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {isAr
                ? `إجمالي الفواتير المستحقة: ${debtInvoices.length}`
                : `Total pending invoices: ${debtInvoices.length}`}
            </div>
          </div>

          {/* Debts Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 40 }} />
              </div>
            ) : debtInvoices.length === 0 ? (
              <EmptyState
                icon={<CheckCircleIcon width={36} height={36} />}
                title={t.billing?.noDebtsFound || 'No outstanding debts found'}
                description={t.billing?.allDebtsCleared || 'All patient invoices have been fully settled and cleared.'}
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colInvoiceCode || 'Invoice #'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colPatient || 'Patient'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colTotal || 'Total (IQD)'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colPaid || 'Paid'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colRemaining || 'Remaining Debt'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colStatus || 'Status'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {t.billing?.colActions || 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {debtInvoices.map((inv) => {
                      const patientName = `${inv.patient_first_name || ''} ${inv.patient_last_name || ''}`.trim() || inv.patient_name || `Patient #${inv.patient_id}`;
                      const remaining = Math.max(0, Number(inv.total) - Number(inv.paid_amount));
                      return (
                        <tr
                          key={inv.id}
                          style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                        >
                          <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand)' }}>
                            {inv.invoice_code}
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--ink)' }}>
                            {patientName}
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--ink)' }}>
                            {Number(inv.total).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
                            {Number(inv.paid_amount).toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--accent-red)' }}>
                            {remaining.toLocaleString()} IQD
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <Badge variant={inv.status === 'partial' ? 'pending' : 'neutral'}>
                              {inv.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setPaymentTarget(inv);
                                setPaymentAmount(String(remaining));
                                setPaymentMethod('cash');
                                setIsPaymentModalOpen(true);
                              }}
                              style={{ fontSize: 12, padding: '4px 10px' }}
                            >
                              💳 {t.billing?.collectPayment || 'Collect Payment'}
                            </Button>
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

      {/* TAB 3: FINANCIAL SUMMARY & EXPENSES */}
      {activeTab === 'expenses' && isManager && (
        <div className="stack" style={{ gap: 'var(--sp-6)' }}>
          {/* Cross-Module KPI Cards */}
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            <StatCard
              icon={<InvoiceIcon width={20} height={20} />}
              value={`${Number(financialSummary?.totalInvoiced || 0).toLocaleString()} IQD`}
              label={t.billing?.totalInvoiced || 'Total Invoiced'}
              delta={isAr ? 'إجمالي الخدمات والوصفات' : 'Gross billings'}
              trend="up"
            />
            <StatCard
              icon={<CheckCircleIcon width={20} height={20} />}
              value={`${Number(financialSummary?.totalCollected || 0).toLocaleString()} IQD`}
              label={t.billing?.totalCollected || 'Total Collected'}
              delta={isAr ? 'السيولة النقدية المحصلة' : 'Realized cash inflows'}
              trend="up"
              featured
              featuredTag="CASH"
            />
            <StatCard
              icon={<ChartIcon width={20} height={20} />}
              value={`${Number(financialSummary?.totalExpenses || 0).toLocaleString()} IQD`}
              label={t.billing?.totalExpenses || 'Operating Expenses'}
              delta={isAr ? 'مصاريف المركز' : 'Facility & staff costs'}
              trend="down"
            />
            <StatCard
              icon={<ChartIcon width={20} height={20} />}
              value={`${Number(financialSummary?.netIncome || 0).toLocaleString()} IQD`}
              label={t.billing?.netIncome || 'Net Operating Income'}
              delta={isAr ? 'صافي الربح التشغيلي' : 'Net profitability'}
              trend="up"
            />
          </div>

          {/* Expenses Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                {t.billing?.tabExpenses || 'Operational Expenses'}
              </h3>
            </div>

            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div className="skeleton" style={{ height: 40 }} />
              </div>
            ) : expenses.length === 0 ? (
              <EmptyState
                icon={<ChartIcon width={36} height={36} />}
                title={t.billing?.noExpensesFound || 'No expenses recorded'}
                description={isAr ? 'لم يتم تسجيل أي مصاريف تشغيلية حتى الآن.' : 'No operating expenses logged yet.'}
                actionLabel={t.billing?.recordExpense || 'Record Expense'}
                onAction={() => setIsExpenseModalOpen(true)}
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colExpenseTitle || 'Title'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colCategory || 'Category'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colAmount || 'Amount (IQD)'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.billing?.colDate || 'Date'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '14px 18px', fontWeight: 600 }}>{exp.title}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <Badge variant="neutral">{exp.category}</Badge>
                        </td>
                        <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--accent-red)' }}>
                          {Number(exp.amount).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
                          {exp.expense_date ? exp.expense_date.substring(0, 10) : '—'}
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

      {/* TAB 4: PRICING & USER PERMISSIONS */}
      {activeTab === 'pricing' && isManager && (
        <div className="stack" style={{ gap: 'var(--sp-6)' }}>
          {/* Section 1: Doctor Consultation Fee Pricing */}
          <Card pad>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--r-md)',
                  background: 'var(--brand-soft)',
                  color: 'var(--brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <StethoscopeIcon width={20} height={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                  {t.billing?.pricingSection || 'Doctor Consultation Fee Management'}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  {t.billing?.pricingSubtitle || 'Control general service prices and doctor consultation rates across specialties'}
                </p>
              </div>
            </div>

            {doctorsList.length === 0 ? (
              <EmptyState
                icon={<StethoscopeIcon width={36} height={36} />}
                title={t.doctors?.noDoctorsFound || 'No doctors found'}
              />
            ) : (
              <div style={{ overflowX: 'auto', marginTop: 14 }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.doctors?.colName || 'Doctor'}
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.doctors?.colSpecialty || 'Specialty'}
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.doctors?.licenseNumber || 'License #'}
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', width: 220 }}>
                        {t.doctors?.consultationFee || 'Consultation Fee (IQD)'}
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', width: 120 }}>
                        {t.billing?.colActions || 'Action'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorsList.map((doc) => {
                      const spec = isAr && doc.specialty_name_ar ? doc.specialty_name_ar : doc.specialty_name;
                      const isSaving = savingFeeId === doc.id;
                      return (
                        <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--ink)' }}>
                            {doc.name}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <Badge variant="brand">{spec}</Badge>
                          </td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)' }}>
                            {doc.license_number || '—'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input
                                type="number"
                                className="input"
                                min="0"
                                step="1000"
                                value={doctorFees[doc.id] !== undefined ? doctorFees[doc.id] : doc.consultation_fee}
                                onChange={(e) =>
                                  setDoctorFees((prev) => ({ ...prev, [doc.id]: e.target.value }))
                                }
                                style={{ maxWidth: 140, padding: '6px 10px', fontSize: 13 }}
                              />
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>IQD</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveDoctorFee(doc.id)}
                              disabled={isSaving}
                              style={{ fontSize: 12, padding: '4px 12px' }}
                            >
                              {isSaving ? t.billing?.savingFee || 'Saving...' : t.billing?.saveFee || 'Save Fee'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Section 2: Staff Accounts & Access Permissions */}
          <Card pad>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--r-md)',
                  background: 'var(--brand-soft)',
                  color: 'var(--brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldIcon width={20} height={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                  {t.billing?.usersSection || 'Staff Accounts & Access Permissions'}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  {t.billing?.usersSubtitle || 'Manage role authorizations (Admin, Doctor, Receptionist, Patient) and account statuses'}
                </p>
              </div>
            </div>

            {usersList.length === 0 ? (
              <EmptyState
                icon={<UsersIcon width={36} height={36} />}
                title={isAr ? 'لم يتم العثور على مستخدمين' : 'No users found'}
              />
            ) : (
              <div style={{ overflowX: 'auto', marginTop: 14 }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.auth?.fullName || 'Full Name'}
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.auth?.email || 'Email'}
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', width: 170 }}>
                        {t.billing?.colRole || 'Role Permission'}
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', width: 140 }}>
                        {t.billing?.colStatusUser || 'Account Status'}
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', width: 140 }}>
                        {t.billing?.colActions || 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => {
                      const isSelf = user?.id === u.id;
                      const isUpdating = updatingUserId === u.id;
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--ink)' }}>
                            {u.name}
                            {isSelf && (
                              <span style={{ fontSize: 11, marginLeft: 6, marginRight: 6, color: 'var(--brand)', fontWeight: 700 }}>
                                ({isAr ? 'أنت' : 'You'})
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
                            {u.email}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <select
                              className="input"
                              value={u.role}
                              onChange={(e) => handleChangeUserRole(u, e.target.value)}
                              disabled={isSelf || isUpdating}
                              style={{ padding: '4px 8px', fontSize: 12.5 }}
                            >
                              <option value="admin">{t.auth?.roleAdmin || 'Administrator'}</option>
                              <option value="doctor">{t.auth?.roleDoctor || 'Doctor'}</option>
                              <option value="receptionist">{t.auth?.roleReceptionist || 'Receptionist'}</option>
                              <option value="patient">{t.auth?.rolePatient || 'Patient'}</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <Badge variant={u.is_active ? 'confirmed' : 'cancelled'}>
                              {u.is_active ? (t.billing?.statusActive || 'Active') : (t.billing?.statusInactive || 'Inactive')}
                            </Badge>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <Button
                              variant={u.is_active ? 'outline' : 'primary'}
                              size="sm"
                              onClick={() => handleToggleUserStatus(u)}
                              disabled={isSelf || isUpdating}
                              style={{ fontSize: 11, padding: '3px 8px' }}
                            >
                              {u.is_active ? (isAr ? 'تعطيل الحساب' : 'Deactivate') : (isAr ? 'تفعيل الحساب' : 'Activate')}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && paymentTarget && (
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
            if (e.target === e.currentTarget) setIsPaymentModalOpen(false);
          }}
        >
          <div
            className="card pad"
            style={{
              maxWidth: 440,
              width: '100%',
              borderRadius: 'var(--r-xl)',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: 'var(--ink)' }}>
              {t.billing?.recordPayment || 'Record Invoice Payment'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Invoice: <strong style={{ color: 'var(--brand)' }}>{paymentTarget.invoice_code}</strong>
            </p>

            <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label required">{t.billing?.paymentAmount || 'Payment Amount (IQD)'}</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">{t.billing?.paymentMethod || 'Payment Method'}</label>
                <select
                  className="input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">{t.billing?.methodCash || 'Cash'}</option>
                  <option value="card">{t.billing?.methodCard || 'Card'}</option>
                  <option value="insurance">{t.billing?.methodInsurance || 'Insurance'}</option>
                  <option value="other">{t.billing?.methodOther || 'Other'}</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsPaymentModalOpen(false)}>
                  {t.appointments?.close || 'Cancel'}
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {t.billing?.confirmPayment || 'Confirm Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
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
            if (e.target === e.currentTarget) setIsExpenseModalOpen(false);
          }}
        >
          <div
            className="card pad"
            style={{
              maxWidth: 480,
              width: '100%',
              borderRadius: 'var(--r-xl)',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 14px', color: 'var(--ink)' }}>
              {t.billing?.recordExpense || 'Record Operational Expense'}
            </h3>

            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label required">{t.billing?.expenseTitle || 'Title / Description'}</label>
                <input
                  type="text"
                  className="input"
                  value={expenseFormData.title}
                  onChange={(e) => setExpenseFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder={isAr ? 'مثال: صيانة جهاز السونار' : 'e.g. Ultrasound repair'}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">{t.billing?.expenseCategory || 'Category'}</label>
                  <select
                    className="input"
                    value={expenseFormData.category}
                    onChange={(e) => setExpenseFormData((p) => ({ ...p, category: e.target.value }))}
                  >
                    <option value="rent">{t.billing?.catRent || 'Rent'}</option>
                    <option value="salary">{t.billing?.catSalary || 'Salary'}</option>
                    <option value="medical_supply">{t.billing?.catMedicalSupply || 'Medical Supply'}</option>
                    <option value="equipment">{t.billing?.catEquipment || 'Equipment'}</option>
                    <option value="utility">{t.billing?.catUtility || 'Utility'}</option>
                    <option value="other">{t.billing?.catOther || 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label className="form-label required">{t.billing?.expenseAmount || 'Amount (IQD)'}</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={expenseFormData.amount}
                    onChange={(e) => setExpenseFormData((p) => ({ ...p, amount: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label required">{t.billing?.expenseDate || 'Date'}</label>
                <input
                  type="date"
                  className="input"
                  value={expenseFormData.expense_date}
                  onChange={(e) => setExpenseFormData((p) => ({ ...p, expense_date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="form-label">{t.appointments?.notes || 'Notes'}</label>
                <input
                  type="text"
                  className="input"
                  value={expenseFormData.notes}
                  onChange={(e) => setExpenseFormData((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Memo..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsExpenseModalOpen(false)}>
                  {t.appointments?.close || 'Cancel'}
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {t.billing?.saveExpense || 'Save Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {isInvoiceModalOpen && (
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
            if (e.target === e.currentTarget) setIsInvoiceModalOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: 620,
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
                {t.billing?.newInvoice || 'Generate New Invoice'}
              </h3>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="nav-scroll" style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label required">{t.records?.selectPatient || 'Patient'}</label>
                    <select
                      className="input"
                      value={newInvoiceData.patient_id}
                      onChange={(e) => setNewInvoiceData((p) => ({ ...p, patient_id: e.target.value }))}
                      required
                    >
                      <option value="">{isAr ? '-- اختر المريض --' : '-- Select Patient --'}</option>
                      {patientsList.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                          {pt.first_name} {pt.last_name} ({pt.patient_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">{t.records?.selectDoctor || 'Doctor (Optional)'}</label>
                    <select
                      className="input"
                      value={newInvoiceData.doctor_id}
                      onChange={(e) => setNewInvoiceData((p) => ({ ...p, doctor_id: e.target.value }))}
                    >
                      <option value="">{isAr ? '-- بدون طبيب محدد --' : '-- No specific doctor --'}</option>
                      {doctorsList.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name} ({doc.specialty_name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <label className="form-label" style={{ fontWeight: 700, color: 'var(--brand)' }}>
                    {t.billing?.invoiceItems || 'Line Items'}
                  </label>

                  {newInvoiceData.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px', gap: 8, marginBottom: 8 }}>
                      <input
                        type="text"
                        className="input"
                        value={item.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewInvoiceData((p) => {
                            const itms = [...p.items];
                            itms[idx].description = val;
                            return { ...p, items: itms };
                          });
                        }}
                        placeholder="Description"
                        required
                      />
                      <input
                        type="number"
                        className="input"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewInvoiceData((p) => {
                            const itms = [...p.items];
                            itms[idx].quantity = val;
                            return { ...p, items: itms };
                          });
                        }}
                        placeholder="Qty"
                        required
                      />
                      <input
                        type="number"
                        className="input"
                        step="500"
                        value={item.unit_price}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewInvoiceData((p) => {
                            const itms = [...p.items];
                            itms[idx].unit_price = val;
                            return { ...p, items: itms };
                          });
                        }}
                        placeholder="Price"
                        required
                      />
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setNewInvoiceData((p) => ({
                        ...p,
                        items: [...p.items, { description: 'Procedure / Test', item_type: 'procedure', quantity: 1, unit_price: 15000 }],
                      }));
                    }}
                  >
                    {t.billing?.addItem || '+ Add Line Item'}
                  </Button>
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'var(--bg-subtle)' }}>
                <Button variant="outline" size="sm" type="button" onClick={() => setIsInvoiceModalOpen(false)}>
                  {t.appointments?.close || 'Cancel'}
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  {t.billing?.saveInvoice || 'Generate Invoice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
