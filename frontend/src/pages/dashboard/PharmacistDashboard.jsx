import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import pharmacyService from '../../services/pharmacyService';

import StatCard from '../../components/common/StatCard';
import Button from '../../components/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';

import {
  MedicalCrossIcon,
  ClockIcon,
  CheckCircleIcon,
  ShieldIcon,
  RefreshCwIcon,
  InvoiceIcon,
  ArrowIcon,
} from '../../components/icons';

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [pendingRx, setPendingRx] = useState([]);
  const [lowStockMeds, setLowStockMeds] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dispensingId, setDispensingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, pendingRes, lowStockRes] = await Promise.all([
        pharmacyService.getStats().catch(() => null),
        pharmacyService.getPrescriptions({ status: 'pending', limit: 20 }),
        pharmacyService.getMedications({ low_stock: true, limit: 10 }),
      ]);

      if (statsRes?.data || statsRes) {
        const s = statsRes.data || statsRes;
        setStats(s);
        if (s.recentTransactions) {
          setRecentTransactions(s.recentTransactions);
        }
      }

      setPendingRx(pendingRes?.data || []);
      setLowStockMeds(lowStockRes?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load pharmacy dispensary dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDispense = async (id) => {
    setDispensingId(id);
    try {
      await pharmacyService.dispensePrescription(id);
      setToastMessage(isAr ? 'تم صرف الوصفة وتحديث المخزون بنجاح.' : 'Prescription dispensed and inventory updated.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to dispense prescription');
    } finally {
      setDispensingId(null);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat(isAr ? 'ar-IQ' : 'en-US', {
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="stack" style={{ gap: 'var(--sp-8)' }}>
      {/* Pharmacy Header Banner */}
      <div
        className="card pad"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 60%, rgba(16, 185, 129, 0.12))',
          borderColor: 'rgba(16, 185, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div className="eyebrow" style={{ color: 'var(--accent-green)' }}>
            💊 {t.dashboard?.pharmacyTitle || (isAr ? 'صيدلية مجمع فيتا الطبي والمستودع الدوائي' : 'Vita Medical Complex Pharmacy & Stock Control')}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
            {isAr ? 'مرحباً بك' : 'Welcome'}, {user?.name || (isAr ? 'الصيدلي المسؤول' : 'Pharmacist')}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {t.dashboard?.pharmacySubtitle || (isAr ? 'متابعة طابور صرف الوصفات، حركة الوارد والصادر، وجرد المستودع الدوائي' : 'Review prescription queue, manage stock replenishment batches, and inspect audit logs')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/app/pharmacy">
            <Button size="sm" variant="primary">
              <MedicalCrossIcon width={15} height={15} />
              <span>{isAr ? 'إدارة الصيدلية الشاملة' : 'Pharmacy Module'}</span>
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCwIcon width={14} height={14} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {toastMessage && (
        <Alert variant="success" title={isAr ? 'نجاح' : 'Success'} onClose={() => setToastMessage(null)}>
          {toastMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="error" title={isAr ? 'تنبيه' : 'Notice'} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Pharmacist Live KPIs */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        <StatCard
          icon={<ClockIcon width={20} height={20} />}
          value={stats?.pendingPrescriptionsCount ?? pendingRx.length}
          label={t.dashboard?.pendingQueue || (isAr ? 'وصفات بانتظار الصرف' : 'Prescriptions Awaiting Dispensing')}
          delta={isAr ? 'تحتاج لتحضير وصرف' : 'Pending pick-up queue'}
          trend={(stats?.pendingPrescriptionsCount ?? pendingRx.length) > 0 ? 'down' : 'up'}
          sparkline
        />

        <StatCard
          icon={<ShieldIcon width={20} height={20} />}
          value={stats?.totalMedicines ?? 0}
          label={isAr ? 'إجمالي الأدوية المسجلة' : 'Active Catalog Formulations'}
          delta={isAr ? 'صنف مسجل في الكتالوج' : 'Active medications'}
          trend="neutral"
        />

        <StatCard
          icon={<MedicalCrossIcon width={20} height={20} />}
          value={stats?.lowStockCount ?? lowStockMeds.length}
          label={isAr ? 'أدوية منخفضة المخزون' : 'Low Stock Drug Alerts'}
          delta={isAr ? 'تحت الحد الأدنى للأمان' : 'Below safety threshold'}
          trend={(stats?.lowStockCount ?? lowStockMeds.length) > 0 ? 'down' : 'up'}
        />

        <StatCard
          icon={<CheckCircleIcon width={20} height={20} />}
          value={stats?.outOfStockCount ?? 0}
          label={isAr ? 'أدوية نفد رصيدها' : 'Out-of-Stock Items'}
          delta={isAr ? 'الكمية الحالية 0' : 'Immediate replenishment'}
          trend={(stats?.outOfStockCount ?? 0) > 0 ? 'down' : 'up'}
        />

        <StatCard
          icon={<ClockIcon width={20} height={20} />}
          value={stats?.expiringCount ?? 0}
          label={isAr ? 'أدوية تقترب من الانتهاء' : 'Expiring Within 90 Days'}
          delta={isAr ? 'تحتاج لمتابعة الصلاحية' : 'Expiry monitoring'}
          trend={(stats?.expiringCount ?? 0) > 0 ? 'down' : 'up'}
        />

        <StatCard
          icon={<InvoiceIcon width={20} height={20} />}
          value={`${formatCurrency(stats?.totalInventoryValue)} IQD`}
          label={isAr ? 'القيمة التقديرية للمخزون' : 'Total Inventory Valuation'}
          delta={isAr ? 'تكلفة الشراء الإجمالية' : 'Based on cost price'}
          trend="up"
        />
      </div>

      {/* Quick Action Pills */}
      <div
        className="card pad"
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          background: 'var(--bg-subtle)',
          padding: '12px 16px',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
          ⚡ {isAr ? 'الوصول السريع إلى الأقسام:' : 'Quick Navigation:'}
        </span>
        <Link to="/app/pharmacy?tab=prescriptions">
          <Button size="sm" variant="outline">
            💊 {isAr ? 'طابور الوصفات' : 'Prescription Queue'}
          </Button>
        </Link>
        <Link to="/app/pharmacy?tab=medications">
          <Button size="sm" variant="outline">
            📦 {isAr ? 'كتالوج الأدوية' : 'Medication Catalog'}
          </Button>
        </Link>
        <Link to="/app/pharmacy?tab=stock">
          <Button size="sm" variant="outline">
            🔄 {isAr ? 'عمليات التوريد والضبط' : 'Stock Operations & Intake'}
          </Button>
        </Link>
        <Link to="/app/pharmacy?tab=suppliers">
          <Button size="sm" variant="outline">
            🏢 {isAr ? 'دليل الموردين' : 'Suppliers Directory'}
          </Button>
        </Link>
        <Link to="/app/pharmacy?tab=reports">
          <Button size="sm" variant="outline">
            📊 {isAr ? 'تقارير الجرد والصلاحية' : 'Inventory Reports'}
          </Button>
        </Link>
      </div>

      {/* Main Operations: Prescription Queue & Critical Low Stock */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Prescription Queue */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockIcon width={18} height={18} />
                <span>{t.dashboard?.pendingQueue || (isAr ? 'وصفات بانتظار الصرف الفوري' : 'Prescriptions Awaiting Dispensing')}</span>
              </div>
              <Badge variant="pending">
                {pendingRx.length} {isAr ? 'وصفة' : 'Pending'}
              </Badge>
            </div>
          }
        >
          {pendingRx.length === 0 ? (
            <EmptyState
              icon={<CheckCircleIcon width={36} height={36} />}
              title={isAr ? 'طابور الصرف فارغ حالياً' : 'All prescriptions dispensed'}
              description={isAr ? 'تم صرف جميع الوصفات الطبية المطلوبة.' : 'No pending prescriptions waiting in queue.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingRx.slice(0, 6).map((rx) => (
                <div
                  key={rx.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--brand)' }}>
                        {rx.prescription_code || `RX-${rx.id}`}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>
                        {rx.patient_name || 'Patient'}
                      </span>
                    </div>

                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                      👨‍⚕️ {rx.doctor_name || 'Doctor'} · 📅 {rx.created_at?.substring(0, 10)}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleDispense(rx.id)}
                    disabled={dispensingId === rx.id}
                    style={{ padding: '6px 12px', fontSize: 12 }}
                  >
                    ✓ {dispensingId === rx.id ? '...' : (t.dashboard?.dispenseNow || (isAr ? 'صرف الدواء الآن' : 'Dispense Now'))}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Critical Low Stock Alerts */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MedicalCrossIcon width={18} height={18} />
                <span>{t.dashboard?.lowStockNotice || (isAr ? 'تنبيهات المخزون الحرج' : 'Critical Low Stock Replenishment')}</span>
              </div>
              <Badge variant="cancelled">{lowStockMeds.length}</Badge>
            </div>
          }
        >
          {lowStockMeds.length === 0 ? (
            <EmptyState
              icon={<CheckCircleIcon width={36} height={36} />}
              title={isAr ? 'المخزون الدوائي مكتمل' : 'All medications sufficiently stocked'}
              description={isAr ? 'لا توجد أدوية وصلت للحد الأدنى.' : 'No medications below minimum safety threshold.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lowStockMeds.slice(0, 6).map((med) => (
                <div
                  key={med.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: 'rgba(239, 68, 68, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
                      💊 {isAr ? med.name_ar || med.name : med.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {isAr ? 'الحد الأدنى' : 'Min'}: {med.minimum_stock} {med.unit} · {med.supplier || 'Primary Supplier'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <Badge variant="cancelled">
                      {med.stock_quantity} {med.unit} {isAr ? 'متبقي' : 'left'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Stock Transactions Audit Feed */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowIcon width={18} height={18} />
              <span>{isAr ? 'سجل العمليات الدوائية وحركة المستودع الأخيرة' : 'Recent Stock Audit Transactions'}</span>
            </div>
            <Link to="/app/pharmacy?tab=stock">
              <Button size="sm" variant="ghost">
                {isAr ? 'عرض الكل' : 'View All'} →
              </Button>
            </Link>
          </div>
        }
      >
        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={<MedicalCrossIcon width={36} height={36} />}
            title={isAr ? 'لا توجد حركات مسجلة' : 'No transactions recorded'}
            description={isAr ? 'سيظهر سجل عمليات الوارد والمصروف هنا.' : 'Inventory movements will be logged here.'}
          />
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th>{isAr ? 'رقم الحركة' : 'Code'}</th>
                  <th>{isAr ? 'الدواء' : 'Medication'}</th>
                  <th>{isAr ? 'نوع الحركة' : 'Type'}</th>
                  <th>{isAr ? 'الكمية' : 'Quantity'}</th>
                  <th>{isAr ? 'المخزون السابق / الجديد' : 'Stock (Old → New)'}</th>
                  <th>{isAr ? 'المنفذ' : 'Performed By'}</th>
                  <th>{isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id || tx.transaction_code}>
                    <td style={{ fontWeight: 600, color: 'var(--brand)' }}>{tx.transaction_code}</td>
                    <td style={{ fontWeight: 600 }}>{tx.medication_name}</td>
                    <td>
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
                    <td style={{ fontWeight: 700 }}>
                      {tx.transaction_type === 'received' || (tx.transaction_type === 'returned' && tx.new_stock > tx.previous_stock)
                        ? `+${tx.quantity}`
                        : `-${tx.quantity}`}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {tx.previous_stock} → <strong>{tx.new_stock}</strong>
                    </td>
                    <td>{tx.performer_name || 'Pharmacist'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'Today'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
