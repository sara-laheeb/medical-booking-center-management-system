/**
 * In-App Notification Store
 * ----------------------------------------------------
 * High-performance, JSON-backed persistent notification store for patients,
 * clinicians, and administrative staff.
 *
 * Supports in-app notification dispatch, unread badges, read state management,
 * and strict deduplication for automated appointment reminders.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'notifications_store.json');

class NotificationStore {
  constructor() {
    this._ensureStoreFile();
  }

  _ensureStoreFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(STORE_FILE)) {
        fs.writeFileSync(
          STORE_FILE,
          JSON.stringify({ notifications: [] }, null, 2),
          'utf8'
        );
      }
    } catch {
      // Non-blocking initialization
    }
  }

  _read() {
    try {
      this._ensureStoreFile();
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      return JSON.parse(raw);
    } catch {
      return { notifications: [] };
    }
  }

  _write(data) {
    try {
      this._ensureStoreFile();
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Dispatch and persist an in-app notification.
   */
  createNotification({
    user_id,
    patient_id = null,
    appointment_id = null,
    type = 'general',
    title,
    title_ar = null,
    message,
    message_ar = null,
    metadata = null,
  }) {
    const store = this._read();
    const nextId =
      store.notifications.reduce((max, n) => Math.max(max, n.id || 0), 0) + 1;

    const notification = {
      id: nextId,
      user_id: Number(user_id),
      patient_id: patient_id ? Number(patient_id) : null,
      appointment_id: appointment_id ? Number(appointment_id) : null,
      type,
      title: title || 'Notification',
      title_ar: title_ar || title || 'إشعار جديد',
      message: message || '',
      message_ar: message_ar || message || '',
      metadata: metadata || {},
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    store.notifications.unshift(notification);
    this._write(store);
    return notification;
  }

  /**
   * Get notifications scoped to a specific user with pagination and unread counts.
   */
  getNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
    const store = this._read();
    const targetUserId = Number(userId);

    const userNotifs = store.notifications.filter(
      (n) => Number(n.user_id) === targetUserId
    );

    const unreadCount = userNotifs.filter((n) => !n.is_read).length;

    let filtered = userNotifs;
    if (unreadOnly) {
      filtered = filtered.filter((n) => !n.is_read);
    }

    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
    const data = filtered.slice(0, safeLimit);

    return {
      data,
      unread_count: unreadCount,
      total: userNotifs.length,
    };
  }

  /**
   * Mark a single notification as read.
   */
  markAsRead(notificationId, userId) {
    const store = this._read();
    const targetId = Number(notificationId);
    const targetUserId = Number(userId);

    const notif = store.notifications.find(
      (n) => n.id === targetId && Number(n.user_id) === targetUserId
    );

    if (!notif) return null;

    notif.is_read = true;
    notif.read_at = new Date().toISOString();
    this._write(store);
    return notif;
  }

  /**
   * Mark all notifications for a user as read.
   */
  markAllAsRead(userId) {
    const store = this._read();
    const targetUserId = Number(userId);
    let affected = 0;
    const nowIso = new Date().toISOString();

    for (const notif of store.notifications) {
      if (Number(notif.user_id) === targetUserId && !notif.is_read) {
        notif.is_read = true;
        notif.read_at = nowIso;
        affected += 1;
      }
    }

    if (affected > 0) {
      this._write(store);
    }

    return { affected };
  }

  /**
   * Check if a notification matching specific criteria already exists (e.g. 48h reminder deduplication).
   */
  exists({ type, appointment_id, user_id }) {
    const store = this._read();
    return store.notifications.some((n) => {
      let matches = true;
      if (type && n.type !== type) matches = false;
      if (appointment_id && Number(n.appointment_id) !== Number(appointment_id))
        matches = false;
      if (user_id && Number(n.user_id) !== Number(user_id)) matches = false;
      return matches;
    });
  }
}

module.exports = new NotificationStore();
