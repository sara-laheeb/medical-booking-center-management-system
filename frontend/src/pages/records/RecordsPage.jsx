import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import recordService from '../../services/recordService';

import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Alert from '../../components/common/Alert';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/Button';

import RecordModal from './RecordModal';

import {
  ShieldIcon,
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  EditIcon,
  EyeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../components/icons';

export default function RecordsPage() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await recordService.getAll({
        page: currentPage,
        limit: pageSize,
      });

      setRecords(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch medical records');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveRecord = async (payload) => {
    if (editTarget?.id) {
      await recordService.update(editTarget.id, payload);
      showToast(t.records?.successUpdated || 'Medical record updated successfully.');
    } else {
      await recordService.create(payload);
      showToast(t.records?.successCreated || 'Medical record documented successfully.');
    }
    loadRecords();
  };

  const filteredRecords = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const patientName = `${r.patient_first_name || ''} ${r.patient_last_name || ''} ${r.patient_name || ''}`.toLowerCase();
    const doctorName = (r.doctor_name || '').toLowerCase();
    const diagnosis = (r.diagnosis || '').toLowerCase();
    return patientName.includes(q) || doctorName.includes(q) || diagnosis.includes(q);
  });

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
            {t.records?.title || 'Clinical Medical Records'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {t.records?.subtitle || 'Patient consultation notes, physical diagnoses, vital signs, and encounter documentation'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={loadRecords} disabled={loading}>
            <RefreshCwIcon width={15} height={15} />
            <span>{t.dashboard?.refresh || 'Refresh'}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditTarget(null);
              setIsModalOpen(true);
            }}
          >
            <PlusIcon width={16} height={16} />
            <span>{t.records?.newRecord || 'New Medical Record'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Notice">
          {error}
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard
          icon={<ShieldIcon width={20} height={20} />}
          value={records.length}
          label={isAr ? 'إجمالي السجلات السريرية' : 'Documented Consultations'}
          delta={isAr ? 'تقارير وفحوصات معتمدة' : 'Verified encounters'}
          trend="up"
        />
        <StatCard
          icon={<CalendarIcon width={20} height={20} />}
          value={records.filter((r) => r.follow_up_date).length}
          label={isAr ? 'مراجعات دورية محددة' : 'Scheduled Follow-ups'}
          delta={isAr ? 'تتطلب متابعة سريرية' : 'Requiring clinical check'}
          trend="neutral"
        />
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card pad"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 260 }}>
          <div className="search-bar" style={{ width: '100%', maxWidth: 420 }}>
            <SearchIcon width={16} height={16} />
            <input
              type="text"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.records?.searchPlaceholder || 'Search records by patient, diagnosis...'}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 40 }} />
          </div>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            icon={<ShieldIcon width={36} height={36} />}
            title={t.records?.noRecordsFound || 'No clinical records found'}
            description={t.records?.noRecordsDesc || 'Try adjusting your search criteria or document a new consultation.'}
            actionLabel={t.records?.newRecord || 'New Medical Record'}
            onAction={() => {
              setEditTarget(null);
              setIsModalOpen(true);
            }}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                    {t.records?.colDate || 'Date'}
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                    {t.records?.colPatient || 'Patient'}
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                    {t.records?.colDoctor || 'Doctor'}
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                    {t.records?.colDiagnosis || 'Diagnosis'}
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                    {t.records?.colFollowUp || 'Follow-up'}
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>
                    {t.records?.colActions || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => {
                  const patientName = `${r.patient_first_name || ''} ${r.patient_last_name || ''}`.trim() || r.patient_name || `Patient #${r.patient_id}`;
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '14px 18px', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>
                        {r.visit_date ? r.visit_date.substring(0, 10) : '—'}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{patientName}</div>
                        {r.patient_code && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.patient_code}</div>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px', fontSize: 13.5, color: 'var(--ink)' }}>
                        {r.doctor_name || `Doctor #${r.doctor_id}`}
                      </td>

                      <td style={{ padding: '14px 18px', fontSize: 13.5, color: 'var(--ink)', maxWidth: 260 }}>
                        <span style={{ fontWeight: 600 }}>{r.diagnosis}</span>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {r.follow_up_date ? (
                          <Badge variant="brand">{r.follow_up_date.substring(0, 10)}</Badge>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="icon-btn"
                            title={t.records?.recordDetails || 'View Encounter'}
                            onClick={() => setDetailsTarget(r)}
                          >
                            <EyeIcon width={15} height={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            title={t.records?.editRecord || 'Edit'}
                            onClick={() => {
                              setEditTarget(r);
                              setIsModalOpen(true);
                            }}
                          >
                            <EditIcon width={15} height={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {isAr
                ? `صفحة ${meta.page} من ${meta.totalPages} (إجمالي ${meta.total} سجل)`
                : `Page ${meta.page} of ${meta.totalPages} (${meta.total} records)`}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeftIcon width={14} height={14} className="icon-mirror" />
                <span>{t.appointments?.prev || 'Previous'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= meta.totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
              >
                <span>{t.appointments?.next || 'Next'}</span>
                <ChevronRightIcon width={14} height={14} className="icon-mirror" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Record Create / Edit Modal */}
      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={editTarget}
        onSave={handleSaveRecord}
      />

      {/* Record Details View Modal */}
      {detailsTarget && (
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
            if (e.target === e.currentTarget) setDetailsTarget(null);
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
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-subtle)',
              }}
            >
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                  {t.records?.recordDetails || 'Clinical Encounter Documentation'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  {detailsTarget.visit_date ? detailsTarget.visit_date.substring(0, 10) : ''} · {detailsTarget.doctor_name || 'Doctor'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setDetailsTarget(null)}>
                ✕
              </Button>
            </div>

            <div
              className="nav-scroll"
              style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div className="card pad" style={{ padding: 16, background: 'var(--brand-soft)', borderColor: 'transparent' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase' }}>
                  {t.records?.diagnosis || 'Primary Diagnosis'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>
                  {detailsTarget.diagnosis}
                </div>
              </div>

              {detailsTarget.vital_signs && typeof detailsTarget.vital_signs === 'object' && (
                <div className="card pad" style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {t.records?.vitalSigns || 'Vital Signs'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
                    {detailsTarget.vital_signs.bp && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>BP</div>
                        <div style={{ fontWeight: 700 }}>{detailsTarget.vital_signs.bp}</div>
                      </div>
                    )}
                    {detailsTarget.vital_signs.pulse && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Pulse</div>
                        <div style={{ fontWeight: 700 }}>{detailsTarget.vital_signs.pulse} BPM</div>
                      </div>
                    )}
                    {detailsTarget.vital_signs.temp && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Temp</div>
                        <div style={{ fontWeight: 700 }}>{detailsTarget.vital_signs.temp} °C</div>
                      </div>
                    )}
                    {detailsTarget.vital_signs.weight && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Weight</div>
                        <div style={{ fontWeight: 700 }}>{detailsTarget.vital_signs.weight} kg</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detailsTarget.treatment_plan && (
                <div className="card pad" style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {t.records?.treatmentPlan || 'Treatment Plan'}
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.6 }}>
                    {detailsTarget.treatment_plan}
                  </p>
                </div>
              )}

              {detailsTarget.specialty_data && typeof detailsTarget.specialty_data === 'object' && (
                <div className="card pad" style={{ padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', marginBottom: 8, textTransform: 'uppercase' }}>
                    🩺 {isAr ? 'بيانات الفحص التخصصي' : 'Specialty Examination Findings'}
                    {detailsTarget.specialty_data.specialty && (
                      <span style={{ marginInlineStart: 8, fontWeight: 500, textTransform: 'capitalize', fontSize: 11, color: 'var(--text-secondary)' }}>
                        ({detailsTarget.specialty_data.specialty})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    {Object.entries(detailsTarget.specialty_data)
                      .filter(([key]) => !['specialty', 'savedAt'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} style={{ padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}
                          </div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', wordBreak: 'break-word' }}>
                            {typeof value === 'object' && value !== null
                              ? JSON.stringify(value, null, 1).substring(0, 200)
                              : String(value)}
                          </div>
                        </div>
                      ))}
                  </div>
                  {detailsTarget.specialty_data.savedAt && (
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                      {isAr ? 'تاريخ التوثيق:' : 'Documented:'} {new Date(detailsTarget.specialty_data.savedAt).toLocaleString(isAr ? 'ar-IQ' : 'en-US')}
                    </div>
                  )}
                </div>
              )}

              {detailsTarget.follow_up_date && (
                <div className="card pad" style={{ padding: 16, background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', marginBottom: 4 }}>
                    {t.records?.followUpDate || 'Follow-up Recommendation'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                    📅 {detailsTarget.follow_up_date.substring(0, 10)}
                  </div>
                  {detailsTarget.follow_up_notes && (
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {detailsTarget.follow_up_notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-subtle)' }}>
              <Button variant="primary" size="sm" onClick={() => setDetailsTarget(null)}>
                {t.appointments?.close || 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
