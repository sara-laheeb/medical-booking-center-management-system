import api from './api';

export const specialtyService = {
  /**
   * Get all medical specialties
   * @param {Object} params - { search, is_active }
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.is_active !== undefined) query.set('is_active', String(params.is_active));

    const qs = query.toString();
    const endpoint = `/specialties${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  /**
   * Get specialty by ID
   * @param {number|string} id
   */
  async getById(id) {
    const res = await api.get(`/specialties/${id}`);
    return res.data;
  },

  /**
   * Create a new specialty
   * @param {Object} data
   */
  async create(data) {
    const res = await api.post('/specialties', data);
    return res;
  },

  /**
   * Update an existing specialty
   * @param {number|string} id
   * @param {Object} data
   */
  async update(id, data) {
    const res = await api.put(`/specialties/${id}`, data);
    return res;
  },

  /**
   * Delete a specialty
   * @param {number|string} id
   */
  async delete(id) {
    const res = await api.delete(`/specialties/${id}`);
    return res;
  },
};

export default specialtyService;
