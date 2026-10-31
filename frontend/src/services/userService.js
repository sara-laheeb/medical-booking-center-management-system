import api from './api';

export const userService = {
  /**
   * Get paginated list of users (Manager / Admin Only)
   * @param {Object} params - { search, role, is_active, page, limit }
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (params.is_active !== undefined) query.set('is_active', String(params.is_active));

    const qs = query.toString();
    const endpoint = `/users${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  /**
   * Toggle user account active status
   * @param {number|string} id
   * @param {boolean} isActive
   */
  async updateStatus(id, isActive) {
    const res = await api.patch(`/users/${id}/status`, { is_active: isActive });
    return res;
  },

  /**
   * Update user role permission
   * @param {number|string} id
   * @param {string} role
   */
  async updateRole(id, role) {
    const res = await api.patch(`/users/${id}/role`, { role });
    return res;
  },
};

export default userService;
