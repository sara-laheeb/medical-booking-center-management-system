/**
 * Patient Prescriptions Page
 * ----------------------------------------------------
 * Displays electronic prescriptions issued to the logged-in patient,
 * detailed medication regimens, dosages, frequencies, and dispensary status.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import pharmacyService from '../../services/pharmacyService';

import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/Button';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';

import {
  PillIcon,
  RefreshCwIcon,
  CalendarIcon,
  CheckCircleIcon,
  PlusIcon,
  ClockIcon,
} from '../../components/icons';

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const patientId = user?.patient?.id;
      const res = await pharmacyService.getPrescriptions({
        patient_id: patientId || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        limit: 50,
      });
      setPrescriptions(res.data || []);
    } catch (err) {
      setError(err.message || (isAr ? 'فشل تحميل الوصفات الطبية' : 'Failed to retrieve prescriptions'));
    } finally {
      setLoading(false);
    }
  }, [user, filterStatus, isAr]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  const filteredPrescriptions = useMemo(() => {
    if (filterStatus === 'all') return prescriptions;
    return prescriptions.filter((p) => p.status === filterStatus);
  }, [prescriptions, filterStatus]);

  const statusVariantMap = {
    pending: 'pending',
    dispensed: 'completed',
    cancelled: 'cancelled',
  };

  const statusLabelMap = {
    pending: isAr ? 'قيد الصرف في الصيدلية' : 'Pending Pharmacy Dispense',
    dispensed: isAr ? 'تم الصرف بنجاح' : 'Dispensed',
    cancelled: isAr ? 'ملغاة' : 'Cancelled',
  };

  return (
    <div className="stack" style={{ gap: 'var(--sp-6)', paddingBottom: 'var(--sp-10)' }}>
      {/* Header Banner */}
      <div
        className="card pad"
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface) 60%, rgba(13, 148, 136, 0.12))',
          borderColor: 'rgba(13, 148, 136, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div className="eyebrow" style={{ color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <PillIcon width={14} height={14} />
            {isAr ? 'بوابة المريض — الوصفات الطبية' : 'Patient Portal — Electronic Prescriptions'}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', margin: '4px 0 0' }}>
            {isAr ? 'وصفاتي الطبية المعتمدة' : 'My Electronic Prescriptions'}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13.5 }}>
            {isAr
              ? 'متابعة الأدوية الموصوفة من قبل طبيبك المعالج، الجرعات، ومواعيد الاستخدام'
              : 'Review medications prescribed by your physician, dosages, and dispensary status'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button size="sm" variant="outline" onClick={loadPrescriptions} disabled={loading}>
            <RefreshCwIcon width={14} height={14} className={loading ? 'icon-spin' : ''} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </Button>

          <Link to="/app/book-appointment">
            <Button size="sm" variant="primary">
              <PlusIcon width={14} height={14} />
              <span>{isAr ? 'حجز موعد جديد' : 'New Appointment'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" title={isAr ? 'تنبيه' : 'Notice'} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
        {[
          { id: 'all', label: isAr ? 'جميع الوصفات' : 'All Prescriptions' },
          { id: 'pending', label: isAr ? 'بانتظار الصرف' : 'Pending Dispense' },
          { id: 'dispensed', label: isAr ? 'مصروفة' : 'Dispensed' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterStatus(tab.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--r-sm)',
              border: 'none',
              background: filterStatus === tab.id ? 'var(--brand)' : 'transparent',
              color: filterStatus === tab.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Prescriptions Cards */}
      {loading ? (
        <div className="stack" style={{ gap: 14 }}>
          <Skeleton variant="card" height={120} />
          <Skeleton variant="card" height={120} />
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PillIcon width={40} height={40} />}
            title={isAr ? 'لا توجد وصفات طبية مسجلة' : 'No electronic prescriptions found'}
            description={
              isAr
                ? 'ستظهر هنا أدويتك ووصفاتك الطبية فور تحريرها من قبل الطبيب المعالج.'
                : 'Your prescriptions and medication schedules will appear here once issued by your doctor.'
            }
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredPrescriptions.map((rx) => {
            const dateStr = String(rx.created_at || rx.date || '').split('T')[0];
            const items = Array.isArray(rx.items) ? rx.items : [];

            return (
              <Card key={rx.id}>
                <div className="stack" style={{ gap: 14 }}>
                  {/* Prescription Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                      paddingBottom: 12,
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>
                          💊 {rx.prescription_code || `RX-${String(rx.id).padStart(6, '0')}`}
                        </span>
                        <Badge variant={statusVariantMap[rx.status] || 'pending'}>
                          {statusLabelMap[rx.status] || rx.status}
                        </Badge>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                        👨‍⚕️ {rx.doctor_name || 'Attending Physician'} · 🗓 {dateStr}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {items.length} {isAr ? 'عناصر علاجية' : 'Medication items'}
                    </div>
                  </div>

                  {/* Notes if present */}
                  {rx.notes && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-surface-alt)',
                        fontSize: 12.5,
                        color: 'var(--ink)',
                      }}
                    >
                      <strong>{isAr ? 'ملاحظات الطبيب:' : 'Doctor notes:'}</strong> {rx.notes}
                    </div>
                  )}

                  {/* Items Table */}
                  {items.length > 0 ? (
                    <div className="table-wrapper" style={{ margin: 0 }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>{isAr ? 'اسم الدواء' : 'Medication'}</th>
                            <th>{isAr ? 'الجرعة' : 'Dosage'}</th>
                            <th>{isAr ? 'التكرار' : 'Frequency'}</th>
                            <th>{isAr ? 'المدة' : 'Duration'}</th>
                            <th>{isAr ? 'تعليمات الاستخدام' : 'Instructions'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((it, idx) => (
                            <tr key={it.id || idx}>
                              <td style={{ fontWeight: 700, color: 'var(--ink)' }}>
                                {it.medication_name || it.name}
                              </td>
                              <td>{it.dosage || '-'}</td>
                              <td>{it.frequency || '-'}</td>
                              <td>{it.duration || '-'}</td>
                              <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                                {it.instructions || (isAr ? 'حسب الإرشادات الطبية' : 'As directed')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '8px 0' }}>
                      {isAr ? 'تم استلام تفاصيل الوصفة في صيدلية المجمع.' : 'Prescription fulfilled via central pharmacy.'}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
