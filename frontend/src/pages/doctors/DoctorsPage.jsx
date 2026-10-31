import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import doctorService from '../../services/doctorService';
import specialtyService from '../../services/specialtyService';

import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Alert from '../../components/common/Alert';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/Button';

import DoctorModal from './DoctorModal';

import {
  StethoscopeIcon,
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
} from '../../components/icons';

export default function DoctorsPage() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const [doctors, setDoctors] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, specRes, pendRes] = await Promise.allSettled([
        doctorService.getAll({
          search: searchQuery.trim() || undefined,
          specialty_id: specialtyFilter || undefined,
          limit: 100,
        }),
        specialtyService.getAll(),
        doctorService.getPending(),
      ]);

      if (docRes.status === 'fulfilled') setDoctors(docRes.value.data || []);
      if (specRes.status === 'fulfilled') setSpecialties(specRes.value.data || []);
      if (pendRes.status === 'fulfilled') setPendingDoctors(pendRes.value.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch doctor directory');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, specialtyFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveDoctor = async (payload) => {
    if (editTarget?.id) {
      await doctorService.update(editTarget.id, payload);
      showToast(t.doctors?.successUpdated || 'Doctor profile updated successfully.');
    } else {
      await doctorService.create(payload);
      showToast(t.doctors?.successCreated || 'Doctor profile created successfully.');
    }
    loadData();
  };

  const handleDeleteDoctor = async () => {
    if (!deleteTarget) return;
    try {
      await doctorService.delete(deleteTarget.id);
      showToast(t.doctors?.successDeleted || 'Doctor profile deactivated.');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to deactivate doctor');
    }
  };

  const handleApproveDoctor = async (doctorId) => {
    try {
      await doctorService.approve(doctorId);
      showToast(isAr ? 'تم اعتماد ترخيص الطبيب وتفعيل الحساب بنجاح' : 'Doctor credentials approved and account activated.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to approve doctor registration');
    }
  };

  const handleRejectDoctor = async (doctorId) => {
    const reason = window.prompt(isAr ? 'يرجى إدخال سبب الرفض (اختياري):' : 'Rejection reason (optional):');
    if (reason === null) return;
    try {
      await doctorService.reject(doctorId, reason);
      showToast(isAr ? 'تم رفض طلب تسجيل الطبيب' : 'Doctor registration rejected.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to reject doctor registration');
    }
  };

  const activeCount = useMemo(() => {
    return doctors.filter((d) => d.is_active === 1 || d.is_active === true).length;
  }, [doctors]);

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
            {t.doctors?.title || 'Medical Staff & Doctors'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 4 }}>
            {t.doctors?.subtitle || 'Doctor directory, medical specialties, consultation fees, and schedule availability'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
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
            <span>{t.doctors?.addDoctor || 'Add Doctor'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Notice">
          {error}
        </Alert>
      )}

      {/* Summary KPI Cards */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard
          icon={<StethoscopeIcon width={20} height={20} />}
          value={doctors.length}
          label={t.doctors?.totalDoctors || 'Total Doctors Registered'}
          delta={isAr ? 'كادر العيادة الطبي' : 'Accredited medical team'}
          trend="up"
        />
        <StatCard
          icon={<CheckCircleIcon width={20} height={20} />}
          value={activeCount}
          label={t.doctors?.activeDoctors || 'Active On Duty'}
          delta={isAr ? 'جاهزون لاستقبال المرضى' : 'Available for scheduling'}
          trend="up"
        />
        <div onClick={() => setActiveTab('pending')} style={{ cursor: 'pointer' }}>
          <StatCard
            icon={<span>📋</span>}
            value={pendingDoctors.length}
            label={isAr ? 'طلبات التسجيل المعلقة' : 'Pending Approvals'}
            delta={pendingDoctors.length > 0 ? (isAr ? 'بانتظار تدقيق الإدارة' : 'Awaiting admin review') : (isAr ? 'لا توجد طلبات معلقة' : 'All clear')}
            trend={pendingDoctors.length > 0 ? 'down' : 'up'}
          />
        </div>
      </div>

      {/* Tab Switcher */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 2,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'active' ? '2.5px solid var(--brand)' : '2.5px solid transparent',
            color: activeTab === 'active' ? 'var(--brand)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'active' ? 700 : 500,
            fontSize: 14,
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {isAr ? 'الكادر الطبي المعتمد' : 'Accredited Doctors'} ({doctors.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '2.5px solid var(--brand)' : '2.5px solid transparent',
            color: activeTab === 'pending' ? 'var(--brand)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'pending' ? 700 : 500,
            fontSize: 14,
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>{isAr ? 'طلبات التسجيل والاعتماد' : 'Registration Requests'}</span>
          {pendingDoctors.length > 0 && (
            <span
              style={{
                backgroundColor: '#f59e0b',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 'var(--r-full)',
                padding: '1px 7px',
              }}
            >
              {pendingDoctors.length}
            </span>
          )}
        </button>
      </div>

      {/* PENDING DOCTOR REGISTRATIONS TAB */}
      {activeTab === 'pending' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              {isAr ? 'طلبات تسجيل الأطباء قيد المراجعة والاعتماد' : 'Pending Doctor Registration Requests'}
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              {isAr
                ? 'تحقق من ترخيص مزاولة المهنة والمؤهلات السريرية قبل تفعيل حساب الطبيب في المنصة.'
                : 'Review professional license credentials and clinical qualifications before activating workspace access.'}
            </p>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="skeleton" style={{ height: 40, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 40 }} />
            </div>
          ) : pendingDoctors.length === 0 ? (
            <EmptyState
              icon={<CheckCircleIcon width={36} height={36} />}
              title={isAr ? 'لا توجد طلبات تسجيل معلقة' : 'No pending doctor applications'}
              description={isAr ? 'تمت مراجعة واعتماد جميع طلبات تسجيل الأطباء المقدمة.' : 'All doctor registration applications have been reviewed.'}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 18px', textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'الطبيب المتقدم' : 'Applicant Doctor'}
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'التخصص الطبي' : 'Specialty'}
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'رقم الترخيص' : 'License Number'}
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'وثائق التحقق والمؤهلات' : 'Verification Credentials'}
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? 'تاريخ التقديم' : 'Submission Date'}
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'center' }}>
                      {isAr ? 'قرار الاعتماد' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDoctors.map((p) => (
                    <tr key={p.doctor_id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {p.email} {p.phone ? `· ${p.phone}` : ''}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <Badge variant="brand">
                          {isAr ? p.specialty_name_ar || p.specialty_name_en : p.specialty_name_en}
                        </Badge>
                      </td>

                      <td style={{ padding: '14px 18px', fontWeight: 600, fontFamily: 'monospace' }}>
                        {p.license_number}
                      </td>

                      <td style={{ padding: '14px 18px', fontSize: 12.5, color: 'var(--ink)', maxWidth: 260 }}>
                        {p.verification_documents || (isAr ? 'بيانات مقدمة عبر الاستمارة' : 'Submitted with registration')}
                      </td>

                      <td style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(p.created_at).toLocaleDateString(isAr ? 'ar-IQ' : 'en-US')}
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveDoctor(p.doctor_id)}
                            style={{ backgroundColor: '#10b981', borderColor: '#10b981', fontSize: 12 }}
                          >
                            ✓ {isAr ? 'اعتماد' : 'Approve'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectDoctor(p.doctor_id)}
                            style={{ color: '#ef4444', borderColor: '#ef4444', fontSize: 12 }}
                          >
                            ✕ {isAr ? 'رفض' : 'Reject'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE DOCTORS DIRECTORY TAB */}
      {activeTab === 'active' && (
        <>
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
                  placeholder={t.doctors?.searchPlaceholder || 'Search doctors by name, license...'}
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

            <div>
              <select
                className="input"
                style={{ width: 'auto', minWidth: 200 }}
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
              >
                <option value="">{t.doctors?.allSpecialties || 'All Specialties'}</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {isAr ? s.name_ar || s.name : s.name}
                  </option>
                ))}
              </select>
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
            ) : doctors.length === 0 ? (
              <EmptyState
                icon={<StethoscopeIcon width={36} height={36} />}
                title={t.doctors?.noDoctorsFound || 'No doctors found'}
                description={t.doctors?.noDoctorsDesc || 'Try selecting another specialty or add a new doctor profile.'}
                actionLabel={t.doctors?.addDoctor || 'Add Doctor'}
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
                        {t.doctors?.colName || 'Doctor'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.doctors?.colSpecialty || 'Specialty'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.doctors?.colFee || 'Fee'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.doctors?.colHours || 'Working Hours'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.doctors?.colDuration || 'Slot'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: isAr ? 'right' : 'left' }}>
                        {t.doctors?.colStatus || 'Status'}
                      </th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>
                        {t.doctors?.colActions || 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((d) => (
                      <tr
                        key={d.id}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                      >
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
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
                              {(d.name?.[0] || 'D').toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{d.name || 'Doctor'}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {d.license_number} {d.phone ? `· ${d.phone}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <Badge variant="brand">
                            {isAr ? d.specialty_name_ar || d.specialty_name : d.specialty_name || 'General'}
                          </Badge>
                        </td>

                        <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--ink)' }}>
                          {Number(d.consultation_fee).toLocaleString()} {t.dashboard?.iqd || 'IQD'}
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ClockIcon width={13} height={13} />
                            <span>
                              {d.work_start?.substring(0, 5)} - {d.work_end?.substring(0, 5)}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--text-secondary)' }}>
                          {d.appointment_duration} min
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <Badge variant={d.is_active ? 'confirmed' : 'neutral'}>
                            {d.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطل / قيد الاعتماد' : 'Inactive / Pending')}
                          </Badge>
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            {!d.is_active && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApproveDoctor(d.id)}
                                style={{ color: '#10b981', borderColor: '#10b981', padding: '3px 8px', fontSize: 11.5 }}
                              >
                                {isAr ? 'اعتماد' : 'Approve'}
                              </Button>
                            )}
                            <button
                              type="button"
                              className="icon-btn"
                              title={t.doctors?.editDoctor || 'Edit'}
                              onClick={() => {
                                setEditTarget(d);
                                setIsModalOpen(true);
                              }}
                            >
                              <EditIcon width={15} height={15} />
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              title={t.doctors?.deleteDoctor || 'Deactivate'}
                              onClick={() => setDeleteTarget(d)}
                              style={{ color: 'var(--accent-red)' }}
                            >
                              <TrashIcon width={15} height={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Doctor Modal */}
      <DoctorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        doctor={editTarget}
        onSave={handleSaveDoctor}
      />

      {/* Delete Confirmation */}
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
              {t.doctors?.deleteDoctor || 'Deactivate Doctor'}
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
              {t.doctors?.confirmDelete || 'Are you sure you want to deactivate this doctor profile?'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
                {t.appointments?.close || 'Cancel'}
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteDoctor}>
                {t.doctors?.deleteDoctor || 'Confirm Deactivation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
