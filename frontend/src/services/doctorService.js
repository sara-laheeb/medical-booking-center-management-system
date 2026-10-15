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
};

export default doctorService;
