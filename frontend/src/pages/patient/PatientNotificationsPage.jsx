/**
 * Patient Notifications Center
 * ----------------------------------------------------
 * Real-time notification hub for patient appointment status updates,
 * front-desk confirmations, 48-hour automated reminders, and lab alerts.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import notificationService from '../../services/notificationService';

import Card from '../../components/common/Card';
import Button from '../../components/Button';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';

import {
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  ShieldIcon,
  CheckIcon,
} from '../../components/icons';

export default function PatientNotificationsPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'unread'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getAll({
        unread: filterMode === 'unread' ? true : undefined,
        limit: 50,
      });
      setNotifications(res.data || []);
      if (res.meta?.unread_count !== undefined) {
        setUnreadCount(res.meta.unread_count);
      }
    } catch (err) {
      setError(err.message || (isAr ? 'فشل تحميل الإشعارات' : 'Failed to retrieve notifications'));
    } finally {
      setLoading(false);
    }
  }, [filterMode, isAr]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id) => {
    setActionLoadingId(id);
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Soft ignore
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      setToastMessage(isAr ? 'تم تعليم جميع الإشعارات كمقروءة.' : 'All notifications marked as read.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return isAr ? 'الآن' : 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) {
      return isAr ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return isAr ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return isAr ? 'أمس' : 'Yesterday';
    if (diffDays < 7) return isAr ? `منذ ${diffDays} أيام` : `${diffDays}d ago`;

    return isoString.split('T')[0];
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return <CheckCircleIcon width={20} height={20} style={{ color: 'var(--brand)' }} />;
      case 'booking_cancelled':
        return <XCircleIcon width={20} height={20} style={{ color: 'var(--error-600)' }} />;
      case '48h_reminder':
        return <ClockIcon width={20} height={20} style={{ color: '#f59e0b' }} />;
      case 'booking_submitted':
      default:
        return <CalendarIcon width={20} height={20} style={{ color: 'var(--brand)' }} />;
    }
  };

  return (
    <div className="stack" style={{ gap: 'var(--sp-6)', maxWidth: 780, margin: '0 auto', paddingBottom: 'var(--sp-10)' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <Alert variant="success" onClose={() => setToastMessage(null)}>
          {toastMessage}
        </Alert>
      )}

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
            <BellIcon width={14} height={14} />
            {isAr ? 'مركز التنبيهات والإشعارات' : 'Notification Center'}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', margin: '4px 0 0' }}>
            {isAr ? 'تنبيهات المواعيد والخدمات الطبية' : 'Patient Notifications & Reminders'}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13.5 }}>
            {isAr
              ? `لديك (${unreadCount}) تنبيه غير مقروء متعلق بمواعيدك واستشاراتك`
              : `You have ${unreadCount} unread notification(s)`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAllAsRead} disabled={loading}>
              <CheckIcon width={14} height={14} />
              <span>{isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}</span>
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={loadNotifications} disabled={loading}>
            <RefreshCwIcon width={14} height={14} className={loading ? 'icon-spin' : ''} />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title={isAr ? 'تنبيه' : 'Notice'} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
        {[
          { id: 'all', label: isAr ? 'جميع الإشعارات' : 'All Notifications' },
          { id: 'unread', label: `${isAr ? 'غير المقروءة' : 'Unread'} (${unreadCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterMode(tab.id)}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--r-sm)',
              border: 'none',
              background: filterMode === tab.id ? 'var(--brand)' : 'transparent',
              color: filterMode === tab.id ? '#fff' : 'var(--text-secondary)',
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

      {/* Notification Items List */}
      <Card>
        {loading ? (
          <div className="stack" style={{ gap: 12, padding: 16 }}>
            <Skeleton variant="card" height={70} />
            <Skeleton variant="card" height={70} />
            <Skeleton variant="card" height={70} />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<BellIcon width={40} height={40} />}
            title={isAr ? 'صندوق الإشعارات فارغ' : 'No notifications yet'}
            description={
              isAr
                ? 'ستصلك هنا إشعارات فورية عند تأكيد موعدك، تذكيرات ما قبل الموعد، وأي تحديثات طبية.'
                : 'You will receive notifications here for booking confirmations, 48h reminders, and clinical updates.'
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((notif, idx) => {
              const isUnread = !notif.is_read;
              const titleText = isAr ? notif.title_ar || notif.title : notif.title;
              const msgText = isAr ? notif.message_ar || notif.message : notif.message;

              return (
                <div
                  key={notif.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: idx < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                    background: isUnread ? 'var(--brand-soft)' : 'transparent',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
                          {titleText}
                        </span>
                        {isUnread && (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: 'var(--brand)',
                              display: 'inline-block',
                            }}
                          />
                        )}
                      </div>

                      <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, marginTop: 4 }}>
                        {msgText}
                      </div>

                      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6 }}>
                        🕒 {formatRelativeTime(notif.created_at)}
                      </div>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleMarkAsRead(notif.id)}
                      disabled={actionLoadingId === notif.id}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11.5,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      ✓ {isAr ? 'مقروء' : 'Mark read'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
