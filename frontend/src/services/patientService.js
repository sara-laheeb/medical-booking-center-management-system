import api from './api';

export const patientService = {
  /**
   * Get patients list for selection and filtering
   * @param {Object} params - { search, status, page, limit }
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);

    const qs = query.toString();
    const endpoint = `/patients${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  /**
   * Get patient by ID
   * @param {number|string} id
   */
  async getById(id) {
    const res = await api.get(`/patients/${id}`);
    return res.data;
  },
};

export default patientService;
