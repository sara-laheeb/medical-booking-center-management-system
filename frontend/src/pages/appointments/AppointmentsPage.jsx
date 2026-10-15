/**
 * Appointments Management Page
 * Main dashboard interface for viewing, filtering, searching, booking, rescheduling,
 * cancelling, and updating patient appointments.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import doctorService from '../../services/doctorService';

import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Alert from '../../components/common/Alert';
import StatCard from '../../components/common/StatCard';
import Skeleton from '../../components/common/Skeleton';

import BookAppointmentModal from './BookAppointmentModal';
import RescheduleModal from './RescheduleModal';
import CancelModal from './CancelModal';
import AppointmentDetailsModal from './AppointmentDetailsModal';

import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  PlusIcon,
  FilterIcon,
  SearchIcon,
  RefreshCwIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
} from '../../components/icons';

/**
 * Appointments Management main page component.
 */
export default function AppointmentsPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === 'ar';

  // Server state
  const [appointments, setAppointments] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Doctors lookup for filter dropdown
  const [doctorsList, setDoctorsList] = useState([]);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState('all'); // 'all', 'today', 'tomorrow', 'custom'
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Success message toast
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Helper date strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Fetch doctors list for filter
  const loadDoctors = useCallback(async () => {
    try {
      const res = await doctorService.getAll({ is_active: 1, limit: 100 });
      setDoctorsList(res.data || []);
    } catch {
      // Soft fallback
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  // Compute active date_from and date_to parameters for backend
  const dateParams = useMemo(() => {
    if (dateFilterMode === 'today') {
      return { date_from: todayStr, date_to: todayStr };
    }
    if (dateFilterMode === 'tomorrow') {
      return { date_from: tomorrowStr, date_to: tomorrowStr };
    }
    if (dateFilterMode === 'custom') {
      return {
        date_from: customDateFrom || undefined,
        date_to: customDateTo || undefined,
      };
    }
    return { date_from: undefined, date_to: undefined };
  }, [dateFilterMode, todayStr, tomorrowStr, customDateFrom, customDateTo]);

  // Load appointments from backend
  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.getAll({
        page: currentPage,
        limit: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        doctor_id: doctorFilter ? Number(doctorFilter) : undefined,
        date_from: dateParams.date_from,
        date_to: dateParams.date_to,
      });

      setAppointments(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      setError(err.message || (isAr ? 'فشل تحميل بيانات المواعيد' : 'Failed to retrieve appointments'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, doctorFilter, dateParams, isAr]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Comprehensive refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        loadAppointments(),
        loadDoctors(),
      ]);
      setToastMessage(isAr ? 'تم تحديث البيانات من الخادم بنجاح.' : 'Data successfully reloaded from server.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setToastMessage(err.message || (isAr ? 'فشل تحديث البيانات' : 'Failed to refresh data'));
      setTimeout(() => setToastMessage(null), 3500);
    }
  }, [loadAppointments, loadDoctors, isAr]);

  // Client-side quick filter for fast text search on loaded appointments
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    const q = searchQuery.toLowerCase().trim();
    return appointments.filter((apt) => {
      const codeMatch = apt.appointment_code?.toLowerCase().includes(q);
      const patNameMatch = apt.patient_name?.toLowerCase().includes(q);
      const patPhoneMatch = apt.patient_phone?.toLowerCase().includes(q);
      const docNameMatch = apt.doctor_name?.toLowerCase().includes(q);
      const reasonMatch = apt.chief_complaint?.toLowerCase().includes(q);
      return codeMatch || patNameMatch || patPhoneMatch || docNameMatch || reasonMatch;
    });
  }, [appointments, searchQuery]);

  // Dynamic summary stats
  const stats = useMemo(() => {
    const total = meta.total || appointments.length;
    const pending = appointments.filter((a) => a.status === 'pending').length;
    const confirmed = appointments.filter((a) => a.status === 'confirmed').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    return { total, pending, confirmed, completed };
  }, [meta.total, appointments]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Status update handler
  const handleUpdateStatus = async (id, newStatus) => {
    setActionLoadingId(id);
    try {
      await appointmentService.updateStatus(id, newStatus);
      showToast(`${t.appointments?.successStatusUpdated || 'Appointment status updated to'} "${newStatus}".`);
      loadAppointments();
    } catch (err) {
      showToast(err.message || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Soft delete handler
  const handleDelete = async (id, code) => {
    const confirmPrompt = `${t.appointments?.confirmDelete || 'Are you sure you want to delete this appointment?'} (${code})`;
    if (!window.confirm(confirmPrompt)) return;

    setActionLoadingId(id);
    try {
      await appointmentService.delete(id);
      showToast(t.appointments?.successDeleted || 'Appointment deleted successfully.');
      loadAppointments();
    } catch (err) {
      showToast(err.message || 'Failed to delete appointment');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setStatusFilter('all');
    setDoctorFilter('');
    setDateFilterMode('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const statusVariantMap = {
    pending: 'pending',
    confirmed: 'confirmed',
    in_progress: 'info',
    completed: 'completed',
    cancelled: 'cancelled',
    no_show: 'no_show',
  };

  const statusLabelMap = {
    pending: t.appointments?.statusPending || 'Pending',
    confirmed: t.appointments?.statusConfirmed || 'Confirmed',
    in_progress: t.appointments?.statusInProgress || 'In Progress',
    completed: t.appointments?.statusCompleted || 'Completed',
    cancelled: t.appointments?.statusCancelled || 'Cancelled',
    no_show: t.appointments?.statusNoShow || 'No-Show',
  };

  const visitTypeLabelMap = {
    new: t.appointments?.typeNew || 'New',
    follow_up: t.appointments?.typeFollowUp || 'Follow-up',
    emergency: t.appointments?.typeEmergency || 'Emergency',
  };

  const canDelete = ['admin', 'receptionist'].includes(user?.role);

  return (
    <div className="stack" style={{ gap: 'var(--sp-6)', paddingBottom: 'var(--sp-10)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'sticky', top: 12, zIndex: 100 }}>
          <Alert variant="success" icon={<CheckIcon width={18} height={18} />}>
            {toastMessage}
          </Alert>
        </div>
      )}

      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarIcon width={14} height={14} />
            {isAr ? 'العمليات السريرية' : 'Clinical Operations'}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', margin: '4px 0 0' }}>
            {t.appointments?.title || 'Appointments Management'}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13.5 }}>
            {t.appointments?.subtitle || 'Clinical booking schedules, patient queues, and consult status workflow'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            title={t.dashboard?.refresh || 'Refresh'}
          >
            <RefreshCwIcon width={15} height={15} className={loading ? 'icon-spin' : ''} />
            <span className="hidden-mobile">{t.dashboard?.refresh || 'Refresh'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsBookModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
          >
            <PlusIcon width={17} height={17} />
            {t.appointments?.bookAppointment || 'Book Appointment'}
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 'var(--sp-4)',
        }}
      >
        <StatCard
          icon={<CalendarIcon width={20} height={20} />}
          value={stats.total}
          label={t.appointments?.totalCount || 'Total Bookings'}
          featured
          featuredTag={isAr ? 'سجلات حية' : 'Live Records'}
        />
        <StatCard
          icon={<ClockIcon width={20} height={20} />}
          value={stats.pending}
          label={t.appointments?.pendingCount || 'Pending Confirmation'}
          trend="up"
          delta={stats.pending > 0 ? (isAr ? 'بحاجة تأكيد' : 'Requires action') : null}
        />
        <StatCard
          icon={<CheckCircleIcon width={20} height={20} />}
          value={stats.confirmed}
          label={t.appointments?.confirmedCount || 'Confirmed Visits'}
        />
        <StatCard
          icon={<UsersIcon width={20} height={20} />}
          value={stats.completed}
          label={t.appointments?.completedCount || 'Completed Consults'}
        />
      </div>

      {/* Main Table Card */}
      <Card>
        {/* Toolbar & Filters */}
        <div className="table-toolbar">
          {/* Search bar */}
          <div className="table-search" style={{ position: 'relative' }}>
            <SearchIcon width={15} height={15} />
            <input
              type="text"
              placeholder={t.appointments?.searchPlaceholder || 'Search by patient, phone, code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                color: 'inherit',
                fontSize: 12.5,
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 14,
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Status Chips */}
          <div className="table-filters" style={{ overflowX: 'auto', paddingBottom: 2 }}>
            {[
              { id: 'all', label: t.appointments?.filterAll || 'All' },
              { id: 'pending', label: t.appointments?.filterPending || 'Pending' },
              { id: 'confirmed', label: t.appointments?.filterConfirmed || 'Confirmed' },
              { id: 'in_progress', label: t.appointments?.filterInProgress || 'In Progress' },
              { id: 'completed', label: t.appointments?.filterCompleted || 'Completed' },
              { id: 'cancelled', label: t.appointments?.filterCancelled || 'Cancelled' },
              { id: 'no_show', label: t.appointments?.filterNoShow || 'No-Show' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`filter-chip ${statusFilter === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Doctor filter dropdown */}
          <div style={{ minWidth: 160 }}>
            <select
              className="input select"
              value={doctorFilter}
              onChange={(e) => {
                setDoctorFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ padding: '6px 12px', fontSize: 12, height: 36, width: '100%' }}
            >
              <option value="">{t.appointments?.allDoctors || 'All Clinicians'}</option>
              {doctorsList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date range presets */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              className={`filter-chip ${dateFilterMode === 'all' ? 'active' : ''}`}
              onClick={() => {
                setDateFilterMode('all');
                setCurrentPage(1);
              }}
            >
              {t.appointments?.allDates || 'All Dates'}
            </button>
            <button
              type="button"
              className={`filter-chip ${dateFilterMode === 'today' ? 'active' : ''}`}
              onClick={() => {
                setDateFilterMode('today');
                setCurrentPage(1);
              }}
            >
              {t.appointments?.today || 'Today'}
            </button>
            <button
              type="button"
              className={`filter-chip ${dateFilterMode === 'tomorrow' ? 'active' : ''}`}
              onClick={() => {
                setDateFilterMode('tomorrow');
                setCurrentPage(1);
              }}
            >
              {t.appointments?.tomorrow || 'Tomorrow'}
            </button>
            <button
              type="button"
              className={`filter-chip ${dateFilterMode === 'custom' ? 'active' : ''}`}
              onClick={() => setDateFilterMode('custom')}
            >
              {t.appointments?.customRange || 'Custom'}
            </button>
          </div>

          {/* Reset button if any filter is active */}
          {(statusFilter !== 'all' || doctorFilter || dateFilterMode !== 'all' || searchQuery) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearFilters}
              style={{ fontSize: 12, padding: '6px 12px', height: 36 }}
            >
              {t.appointments?.clearFilters || 'Clear'}
            </button>
          )}
        </div>

        {/* Custom date range inputs when active */}
        {dateFilterMode === 'custom' && (
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--bg-surface-alt)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {isAr ? 'من تاريخ:' : 'From:'}
            </span>
            <input
              type="date"
              className="input"
              value={customDateFrom}
              onChange={(e) => {
                setCustomDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              style={{ height: 34, fontSize: 12 }}
            />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {isAr ? 'إلى تاريخ:' : 'To:'}
            </span>
            <input
              type="date"
              className="input"
              value={customDateTo}
              onChange={(e) => {
                setCustomDateTo(e.target.value);
                setCurrentPage(1);
              }}
              style={{ height: 34, fontSize: 12 }}
            />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{ padding: 'var(--sp-4)' }}>
            <Alert
              variant="error"
              title={t.appointments?.errorLoading || 'Failed to retrieve appointments'}
              action={
                <button type="button" className="btn btn-primary" onClick={loadAppointments}>
                  {t.appointments?.retry || 'Retry'}
                </button>
              }
            >
              {error}
            </Alert>
          </div>
        )}

        {/* Table Content or Loading/Empty States */}
        {loading ? (
          <div style={{ padding: 'var(--sp-6)' }} className="stack">
            <Skeleton variant="text" height={24} width="30%" />
            <Skeleton variant="table-row" height={44} />
            <Skeleton variant="table-row" height={44} />
            <Skeleton variant="table-row" height={44} />
            <Skeleton variant="table-row" height={44} />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon width={32} height={32} />}
            title={t.appointments?.noAppointmentsFound || 'No appointments match the selected filters.'}
            description={t.appointments?.noAppointmentsDesc || 'Try adjusting your search criteria or book a new clinical appointment.'}
            action={
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsBookModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <PlusIcon width={16} height={16} />
                {t.appointments?.bookAppointment || 'Book Appointment'}
              </button>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>{t.appointments?.colCode || 'Code'}</th>
                  <th>{t.appointments?.colPatient || 'Patient'}</th>
                  <th>{t.appointments?.colDoctor || 'Doctor'}</th>
                  <th>{t.appointments?.colDateTime || 'Date & Time'}</th>
                  <th>{t.appointments?.colType || 'Type'}</th>
                  <th>{t.appointments?.colStatus || 'Status'}</th>
                  <th style={{ textAlign: isAr ? 'left' : 'right' }}>
                    {t.appointments?.colActions || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((apt) => {
                  const initials = apt.patient_name
                    ? apt.patient_name
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'P';

                  const dateFormatted = apt.appointment_date
                    ? apt.appointment_date.split('T')[0]
                    : '—';
                  const startTimeClean = apt.start_time ? apt.start_time.slice(0, 5) : '--:--';
                  const endTimeClean = apt.end_time ? apt.end_time.slice(0, 5) : '';

                  const isFinal = ['completed', 'cancelled'].includes(apt.status);
                  const isBusy = actionLoadingId === apt.id;

                  return (
                    <tr key={apt.id} style={{ opacity: isBusy ? 0.5 : 1 }}>
                      {/* Code */}
                      <td>
                        <span
                          className="mono"
                          style={{
                            fontWeight: 700,
                            fontSize: 12.5,
                            color: 'var(--brand)',
                            cursor: 'pointer',
                          }}
                          onClick={() => setDetailsTarget(apt)}
                          title={t.appointments?.viewDetails || 'View Details'}
                        >
                          {apt.appointment_code}
                        </span>
                      </td>

                      {/* Patient */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--brand-soft), var(--info-100))',
                              color: 'var(--brand)',
                              fontWeight: 700,
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                              {apt.patient_name}
                            </div>
                            {apt.patient_phone && (
                              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                                {apt.patient_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                          {apt.doctor_name}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td>
                        <div className="mono" style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--ink)' }}>
                          {dateFormatted}
                        </div>
                        <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                          {startTimeClean} {endTimeClean ? `– ${endTimeClean}` : ''}
                        </div>
                      </td>

                      {/* Visit Type */}
                      <td>
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 'var(--r-sm)',
                            background:
                              apt.visit_type === 'emergency'
                                ? 'var(--error-100)'
                                : apt.visit_type === 'follow_up'
                                ? 'var(--info-100)'
                                : 'var(--bg-surface-alt)',
                            color:
                              apt.visit_type === 'emergency'
                                ? 'var(--error-700)'
                                : apt.visit_type === 'follow_up'
                                ? 'var(--info-700)'
                                : 'var(--text-secondary)',
                          }}
                        >
                          {visitTypeLabelMap[apt.visit_type] || apt.visit_type}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <Badge variant={statusVariantMap[apt.status] || 'pending'}>
                          {statusLabelMap[apt.status] || apt.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: isAr ? 'left' : 'right' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            justifyContent: isAr ? 'flex-start' : 'flex-end',
                          }}
                        >
                          {/* Details View Button */}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setDetailsTarget(apt)}
                            style={{ padding: '5px 8px', height: 30 }}
                            title={t.appointments?.viewDetails || 'Details'}
                          >
                            <EyeIcon width={14} height={14} />
                          </button>

                          {/* Fast Action: Confirm (for pending) */}
                          {apt.status === 'pending' && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                              disabled={isBusy}
                              style={{ padding: '5px 8px', height: 30 }}
                              title={t.appointments?.actionConfirm || 'Confirm'}
                            >
                              <CheckCircleIcon width={14} height={14} />
                            </button>
                          )}

                          {/* Fast Action: Start / Complete (for confirmed) */}
                          {apt.status === 'confirmed' && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleUpdateStatus(apt.id, 'in_progress')}
                              disabled={isBusy}
                              style={{ padding: '5px 8px', height: 30 }}
                              title={t.appointments?.actionStart || 'Start'}
                            >
                              <CheckCircleIcon width={14} height={14} />
                            </button>
                          )}

                          {/* Reschedule Button */}
                          {!isFinal && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setRescheduleTarget(apt)}
                              disabled={isBusy}
                              style={{ padding: '5px 8px', height: 30 }}
                              title={t.appointments?.actionReschedule || 'Reschedule'}
                            >
                              <EditIcon width={14} height={14} />
                            </button>
                          )}

                          {/* Cancel Button */}
                          {!isFinal && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setCancelTarget(apt)}
                              disabled={isBusy}
                              style={{ padding: '5px 8px', height: 30, color: 'var(--error-600)' }}
                              title={t.appointments?.actionCancel || 'Cancel'}
                            >
                              <XCircleIcon width={14} height={14} />
                            </button>
                          )}

                          {/* Delete Button (admin/receptionist) */}
                          {canDelete && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleDelete(apt.id, apt.appointment_code)}
                              disabled={isBusy}
                              style={{ padding: '5px 8px', height: 30, color: 'var(--error-600)' }}
                              title={t.appointments?.deleteAppointment || 'Delete'}
                            >
                              <TrashIcon width={14} height={14} />
                            </button>
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

        {/* Pagination Bar */}
        <div className="table-pagination">
          <div>
            {isAr
              ? `عرض ${filteredAppointments.length} من أصل ${meta.total} موعد مسجل`
              : `Showing ${filteredAppointments.length} of ${meta.total} recorded appointments`}
          </div>

          <div className="pagination-controls">
            {/* Page size selector */}
            <select
              className="input select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                height: 28,
                padding: '0 8px',
                fontSize: 12,
                marginInlineEnd: 10,
              }}
            >
              <option value="10">10 / {isAr ? 'صفحة' : 'page'}</option>
              <option value="25">25 / {isAr ? 'صفحة' : 'page'}</option>
              <option value="50">50 / {isAr ? 'صفحة' : 'page'}</option>
            </select>

            {/* Prev Page Button */}
            <button
              type="button"
              className={`page-btn ${currentPage <= 1 ? 'disabled' : ''}`}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              aria-label={t.appointments?.prev || 'Previous'}
            >
              {isAr ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </button>

            {/* Current Page Indicator */}
            <span style={{ padding: '0 8px', fontWeight: 600, fontSize: 12.5 }}>
              {currentPage} / {meta.totalPages || 1}
            </span>

            {/* Next Page Button */}
            <button
              type="button"
              className={`page-btn ${currentPage >= (meta.totalPages || 1) ? 'disabled' : ''}`}
              onClick={() => setCurrentPage((p) => Math.min(meta.totalPages || 1, p + 1))}
              disabled={currentPage >= (meta.totalPages || 1) || loading}
              aria-label={t.appointments?.next || 'Next'}
            >
              {isAr ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </button>
          </div>
        </div>
      </Card>

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSuccess={() => {
          showToast(t.appointments?.successBooked || 'Appointment booked successfully.');
          loadAppointments();
        }}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={Boolean(rescheduleTarget)}
        appointment={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onSuccess={() => {
          showToast(t.appointments?.successRescheduled || 'Appointment rescheduled successfully.');
          loadAppointments();
        }}
      />

      {/* Cancel Modal */}
      <CancelModal
        isOpen={Boolean(cancelTarget)}
        appointment={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onSuccess={() => {
          showToast(t.appointments?.successCancelled || 'Appointment cancelled.');
          loadAppointments();
        }}
      />

      {/* View Details Modal */}
      <AppointmentDetailsModal
        isOpen={Boolean(detailsTarget)}
        appointment={detailsTarget}
        onClose={() => setDetailsTarget(null)}
        onOpenReschedule={(apt) => setRescheduleTarget(apt)}
        onOpenCancel={(apt) => setCancelTarget(apt)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
