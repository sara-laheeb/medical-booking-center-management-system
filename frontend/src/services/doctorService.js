import api from './api';

export const doctorService = {
  /**
   * Get active doctors list for appointment booking and filters
   * @param {Object} params - { search, specialty_id, is_active, page, limit }
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.specialty_id) query.set('specialty_id', String(params.specialty_id));
    if (params.is_active !== undefined) query.set('is_active', String(params.is_active));

    const qs = query.toString();
    const endpoint = `/doctors${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  /**
   * Get doctor by ID
   * @param {number|string} id
   */
  async getById(id) {
    const res = await api.get(`/doctors/${id}`);
    return res.data;
  },

  /**
   * Get doctor availability and slots for a specific date
   * @param {number|string} id
   * @param {string} date - YYYY-MM-DD
   */
  async getAvailability(id, date) {
    const endpoint = `/doctors/${id}/availability${date ? `?date=${date}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  /**
   * Create a new doctor profile
   * @param {Object} data
   */
  async create(data) {
    const res = await api.post('/doctors', data);
    return res;
  },

  /**
   * Update an existing doctor profile
   * @param {number|string} id
   * @param {Object} data
   */
  async update(id, data) {
    const res = await api.put(`/doctors/${id}`, data);
    return res;
  },

  /**
   * Delete a doctor profile
   * @param {number|string} id
   */
  async delete(id) {
    const res = await api.delete(`/doctors/${id}`);
    return res;
  },

  /**
   * Get pending doctor registration requests for admin review
   */
  async getPending() {
    const res = await api.get('/users/pending-doctors');
    return res;
  },

  /**
   * Approve doctor registration request
   * @param {number|string} id
   */
  async approve(id) {
    const res = await api.patch(`/users/doctors/${id}/approve`);
    return res;
  },

  /**
   * Reject doctor registration request
   * @param {number|string} id
   * @param {string} reason
   */
  async reject(id, reason) {
    const res = await api.patch(`/users/doctors/${id}/reject`, { reason });
    return res;
  },
};

export default doctorService;
