import api from './api';

export const recordService = {
  /**
   * Get all medical records with optional filters
   * @param {Object} params - { page, limit, patient_id, doctor_id }
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.patient_id) query.set('patient_id', String(params.patient_id));
    if (params.doctor_id) query.set('doctor_id', String(params.doctor_id));

    const qs = query.toString();
    const endpoint = `/records${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  /**
   * Get single medical record by ID
   * @param {number|string} id
   */
  async getById(id) {
    const res = await api.get(`/records/${id}`);
    return res.data;
  },

  /**
   * Get complete clinical history for a specific patient
   * @param {number|string} patientId
   */
  async getByPatientId(patientId) {
    const res = await api.get(`/records/patient/${patientId}`);
    return res.data;
  },

  /**
   * Create a new medical encounter record
   * @param {Object} data - { appointment_id, patient_id, doctor_id, visit_date, diagnosis, treatment_plan, vital_signs, specialty_data, follow_up_date, follow_up_notes }
   */
  async create(data) {
    const res = await api.post('/records', data);
    return res;
  },

  /**
   * Update an existing medical record
   * @param {number|string} id
   * @param {Object} data
   */
  async update(id, data) {
    const res = await api.patch(`/records/${id}`, data);
    return res;
  },
};

export default recordService;
