import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import patientService from '../../services/patientService';

import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Alert from '../../components/common/Alert';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/Button';

import PatientModal from './PatientModal';
import PatientDetailsModal from './PatientDetailsModal';

import {
  UsersIcon,
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '../../components/icons';

export default function PatientsPage() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [patients, setPatients] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await patientService.getAll({
        page: currentPage,
        limit: pageSize,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      setPatients(res.data || []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setError(err.message || 'Failed to fetch patients list');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, statusFilter]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSavePatient = async (formData) => {
    if (editTarget?.id) {
      await patientService.update(editTarget.id, formData);
      showToast(t.patients?.successUpdated || 'Patient profile updated successfully.');
    } else {
      await patientService.create(formData);
      showToast(t.patients?.successCreated || 'Patient registered successfully.');
    }
    fetchPatients();
  };

  const handleDeletePatient = async () => {
    if (!deleteTarget) return;
    try {
      await patientService.delete(deleteTarget.id);
      showToast(t.patients?.successDeleted || 'Patient file removed successfully.');
      setDeleteTarget(null);
      fetchPatients();
    } catch (err) {
      setError(err.message || 'Failed to delete patient');
    }
  };

  const activeCount = useMemo(() => {
    return patients.filter((p) => p.status === 'active').length;
  }, [patients]);

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
            {t.patients?.title || 'Patients Directory'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {t.patients?.subtitle || 'Complete clinical patient directory, medical histories, and contact information'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPatients}
            disabled={loading}
          >
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
            <span>{t.patients?.addPatient || 'Register Patient'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Notice">
          {error}
        </Alert>
      )}

      {/* Summary Stat Cards */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard
          icon={<UsersIcon width={20} height={20} />}
          value={meta.total || patients.length}
          label={t.patients?.totalPatients || 'Total Registered Patients'}
          delta={isAr ? 'إجمالي الملفات في المنظومة' : 'Total clinic profiles'}
          trend="up"
        />
        <StatCard
          icon={<CheckCircleIcon width={20} height={20} />}
          value={activeCount}
          label={t.patients?.activePatients || 'Active Patient Files'}
          delta={isAr ? 'ملفات جاهزة للمراجعة' : 'Eligible for booking'}
          trend="up"
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t.patients?.searchPlaceholder || 'Search by name, phone, code...'}
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

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {['all', 'active', 'inactive'].map((st) => (
            <button
              key={st}
              type="button"
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              style={{ textTransform: 'capitalize' }}
            >
              {st === 'all'
                ? t.patients?.filterAll || 'All'
                : st === 'active'
                ? t.patients?.filterActive || 'Active'
                : t.patients?.filterInactive || 'Inactive'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 40 }} />
          </div>
        ) : patients.length === 0 ? (
          <EmptyState
            icon={<UsersIcon width={36} height={36} />}
            title={t.patients?.noPatientsFound || 'No patients found'}
            description={t.patients?.noPatientsDesc || 'Try adjusting your search criteria or register a new patient.'}
            actionLabel={t.patients?.addPatient || 'Register New Patient'}
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
                    {t.patients?.colCode || 'Code'}
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                    {t.patients?.colName || 'Patient Name'}
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                    {t.patients?.colPhone || 'Phone'}
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                    {t.patients?.colGender || 'Gender'}
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                    {t.patients?.colBlood || 'Blood'}
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                    {t.patients?.colStatus || 'Status'}
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: 'center' }}>
                    {t.patients?.colActions || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => {
                  const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.full_name || 'Patient';
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand)' }}>
                          {p.patient_code}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 'var(--r-full)',
                              backgroundColor: 'var(--brand-soft)',
                              color: 'var(--brand)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {(p.first_name?.[0] || 'P').toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{fullName}</div>
                            {p.email && (
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px', fontSize: 13.5, color: 'var(--ink)' }}>
                        {p.phone}
                      </td>

                      <td style={{ padding: '14px 18px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
                        {p.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {p.blood_type ? (
                          <Badge variant="brand">{p.blood_type}</Badge>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <Badge variant={p.status === 'active' ? 'confirmed' : 'neutral'}>
                          {p.status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}
                        </Badge>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="icon-btn"
                            title={t.appointments?.viewDetails || 'View Details'}
                            onClick={() => setDetailsTarget(p)}
                          >
                            <EyeIcon width={15} height={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            title={t.patients?.editPatient || 'Edit'}
                            onClick={() => {
                              setEditTarget(p);
                              setIsModalOpen(true);
                            }}
                          >
                            <EditIcon width={15} height={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            title={t.patients?.deletePatient || 'Delete'}
                            onClick={() => setDeleteTarget(p)}
                            style={{ color: 'var(--accent-red)' }}
                          >
                            <TrashIcon width={15} height={15} />
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
                ? `صفحة ${meta.page} من ${meta.totalPages} (إجمالي ${meta.total} مريض)`
                : `Page ${meta.page} of ${meta.totalPages} (${meta.total} patients)`}
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

      {/* Patient Create / Edit Modal */}
      <PatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patient={editTarget}
        onSave={handleSavePatient}
      />

      {/* Patient Details Modal */}
      <PatientDetailsModal
        isOpen={Boolean(detailsTarget)}
        onClose={() => setDetailsTarget(null)}
        patient={detailsTarget}
      />

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
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
            if (e.target === e.currentTarget) setDeleteTarget(null);
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
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: 'var(--ink)' }}>
              {t.patients?.deletePatient || 'Delete Patient Record'}
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
              {t.patients?.confirmDelete || 'Are you sure you want to deactivate and remove this patient record?'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
                {t.appointments?.close || 'Cancel'}
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeletePatient}>
                {t.patients?.deletePatient || 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
