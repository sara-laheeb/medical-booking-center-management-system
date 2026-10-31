import api from './api';

export const notificationService = {
  /**
   * Retrieve in-app notifications for authenticated user
   * @param {Object} params - { unread, limit }
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.unread !== undefined) query.set('unread', String(params.unread));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    const endpoint = `/notifications${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  /**
   * Mark a single notification as read
   * @param {number|string} id
   */
  async markAsRead(id) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res;
  },

  /**
   * Mark all notifications for the authenticated user as read
   */
  async markAllAsRead() {
    const res = await api.patch('/notifications/read-all');
    return res;
  },
};

export default notificationService;
