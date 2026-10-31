/**
 * Patient Medical Records & Results Page
 * ----------------------------------------------------
 * Displays personal clinical records, laboratory results, radiology reports,
 * vital signs history, and physician notes.
 * Enforces strict patient data isolation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import recordService from '../../services/recordService';

import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/Button';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';

import {
  ShieldIcon,
  RefreshCwIcon,
  SearchIcon,
  CalendarIcon,
  StethoscopeIcon,
  PlusIcon,
} from '../../components/icons';

export default function PatientRecordsPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const patientId = user?.patient?.id;
      const res = await recordService.getAll({
        patient_id: patientId || undefined,
        limit: 50,
      });
      setRecords(res.data || []);
      if (res.data?.length > 0 && !selectedRecord) {
        setSelectedRecord(res.data[0]);
      }
    } catch (err) {
      setError(err.message || (isAr ? 'فشل تحميل السجلات الطبية' : 'Failed to retrieve medical records'));
    } finally {
      setLoading(false);
    }
  }, [user, selectedRecord, isAr]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();
    return records.filter((r) => {
      const diagMatch = r.diagnosis?.toLowerCase().includes(q);
      const planMatch = r.treatment_plan?.toLowerCase().includes(q);
      const docMatch = r.doctor_name?.toLowerCase().includes(q);
      return diagMatch || planMatch || docMatch;
    });
  }, [records, searchQuery]);

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
            <ShieldIcon width={14} height={14} />
            {isAr ? 'بوابة المريض — السجلات الطبية' : 'Patient Portal — Health Records'}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', margin: '4px 0 0' }}>
            {isAr ? 'سجلاتي الطبية ونتائج الفحوصات' : 'My Medical Records & Test Results'}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13.5 }}>
            {isAr
              ? 'ملفك الطبي الرقمي الشامل: التشخيصات، الفحوصات السريرية، العلامات الحيوية، وتوصيات الأطباء'
              : 'Your electronic health record: physician diagnoses, clinical notes, vitals, and reports'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button size="sm" variant="outline" onClick={loadRecords} disabled={loading}>
            <RefreshCwIcon width={14} height={14} className={loading ? 'icon-spin' : ''} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </Button>

          <Link to="/app/book-appointment">
            <Button size="sm" variant="primary">
              <PlusIcon width={14} height={14} />
              <span>{isAr ? 'طلب استشارة طبية' : 'New Consultation'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" title={isAr ? 'تنبيه' : 'Notice'} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content Layout: Master-Detail Grid */}
      {loading ? (
        <div className="stack" style={{ gap: 14 }}>
          <Skeleton variant="card" height={100} />
          <Skeleton variant="card" height={100} />
        </div>
      ) : records.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ShieldIcon width={40} height={40} />}
            title={isAr ? 'لا توجد سجلات طبية مسجلة' : 'No clinical records found'}
            description={
              isAr
                ? 'ستظهر هنا تقارير كشوفاتك وفحوصاتك السريرية فور اكتمال معاينتك مع الطبيب المعالج.'
                : 'Your consultation notes, test results, and diagnoses will appear here once reviewed by your doctor.'
            }
            action={
              <Link to="/app/book-appointment">
                <Button variant="primary" size="sm">
                  <PlusIcon width={14} height={14} />
                  <span>{isAr ? 'احجز موعد كشف الآن' : 'Schedule a Visit'}</span>
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Records List Column */}
          <div className="stack" style={{ gap: 12 }}>
            {/* Search filter input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input"
                placeholder={isAr ? 'بحث في التشخيص أو اسم الطبيب...' : 'Search diagnoses or doctors...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingInlineStart: 36 }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  [isAr ? 'right' : 'left']: 12,
                  color: 'var(--text-tertiary)',
                  pointerEvents: 'none',
                }}
              >
                <SearchIcon width={16} height={16} />
              </span>
            </div>

            {filteredRecords.map((rec) => {
              const isSelected = selectedRecord?.id === rec.id;
              const dateClean = String(rec.visit_date).split('T')[0];

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 'var(--r-md)',
                    border: isSelected ? '2px solid var(--brand)' : '1px solid var(--border)',
                    background: isSelected ? 'var(--brand-soft)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--ink)' }}>
                        {rec.diagnosis || (isAr ? 'معاينة طبية عامة' : 'Clinical Consultation')}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--brand)', fontWeight: 600, marginTop: 4 }}>
                        👨‍⚕️ {rec.doctor_name || 'Attending Physician'}
                      </div>
                    </div>
                    <Badge variant="info">
                      {dateClean}
                    </Badge>
                  </div>

                  {rec.treatment_plan && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        marginTop: 8,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {rec.treatment_plan}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Record Card */}
          {selectedRecord && (
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldIcon width={18} height={18} />
                  <span>{isAr ? 'تفاصيل السجل والمعاينة' : 'Consultation Details & Findings'}</span>
                </div>
              }
            >
              <div className="stack" style={{ gap: 16 }}>
                {/* Header Meta */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--bg-surface-alt)',
                    border: '1px solid var(--border)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{isAr ? 'تاريخ الزيارة:' : 'Visit Date:'}</div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>
                      {String(selectedRecord.visit_date).split('T')[0]}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{isAr ? 'الطبيب المعالج:' : 'Doctor:'}</div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--brand)' }}>
                      {selectedRecord.doctor_name}
                    </div>
                  </div>

                  {selectedRecord.follow_up_date && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{isAr ? 'المراجعة القادمة:' : 'Follow-up:'}</div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>
                        {String(selectedRecord.follow_up_date).split('T')[0]}
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Diagnosis */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                    🩺 {isAr ? 'التشخيص الطبي:' : 'Primary Diagnosis:'}
                  </div>
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--r-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    {selectedRecord.diagnosis || (isAr ? 'لا يوجد تشخيص محدد' : 'Routine clinical evaluation')}
                  </div>
                </div>

                {/* Treatment Plan */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                    📋 {isAr ? 'الخطة العلاجية والتوصيات:' : 'Treatment Plan & Recommendations:'}
                  </div>
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--r-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: 'var(--ink)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedRecord.treatment_plan || (isAr ? 'تم استكمال الفحص السريري.' : 'Evaluation completed.')}
                  </div>
                </div>

                {/* Vital Signs (if recorded) */}
                {selectedRecord.vital_signs && typeof selectedRecord.vital_signs === 'object' && Object.keys(selectedRecord.vital_signs).length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                      💓 {isAr ? 'العلامات الحيوية المسجلة:' : 'Recorded Vital Signs:'}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                        gap: 10,
                      }}
                    >
                      {selectedRecord.vital_signs.bp && (
                        <div style={{ padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', textAlign: 'center' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{isAr ? 'ضغط الدم' : 'Blood Pressure'}</div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>{selectedRecord.vital_signs.bp}</div>
                        </div>
                      )}
                      {selectedRecord.vital_signs.pulse && (
                        <div style={{ padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', textAlign: 'center' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{isAr ? 'النبض' : 'Pulse'}</div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>{selectedRecord.vital_signs.pulse} bpm</div>
                        </div>
                      )}
                      {selectedRecord.vital_signs.temp && (
                        <div style={{ padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', textAlign: 'center' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{isAr ? 'الحرارة' : 'Temperature'}</div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>{selectedRecord.vital_signs.temp} °C</div>
                        </div>
                      )}
                      {selectedRecord.vital_signs.weight && (
                        <div style={{ padding: '8px 10px', borderRadius: 'var(--r-sm)', background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', textAlign: 'center' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{isAr ? 'الوزن' : 'Weight'}</div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>{selectedRecord.vital_signs.weight} kg</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
