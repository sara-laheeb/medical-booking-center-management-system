/**
 * Frontend Appointment Service
 * Provides typed API methods for querying, creating, rescheduling, updating status,
 * and deleting appointments via the backend API.
 */

import api from './api';

export const appointmentService = {
  /**
   * Get paginated appointments list with optional filters
   * @param {Object} params - { page, limit, status, doctor_id, patient_id, date_from, date_to }
   */
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.doctor_id) query.set('doctor_id', String(params.doctor_id));
    if (params.patient_id) query.set('patient_id', String(params.patient_id));
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);

    const qs = query.toString();
    const endpoint = `/appointments${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  /**
   * Get single appointment by ID
   * @param {number|string} id
   */
  async getById(id) {
    const res = await api.get(`/appointments/${id}`);
    return res.data;
  },

  /**
   * Book a new appointment
   * @param {Object} data - { patient_id, doctor_id, appointment_date, start_time, visit_type, chief_complaint, notes }
   */
  async create(data) {
    const payload = {
      patient_id: Number(data.patient_id),
      doctor_id: Number(data.doctor_id),
      appointment_date: data.appointment_date,
      start_time: data.start_time,
      visit_type: data.visit_type || 'new',
      chief_complaint: data.chief_complaint?.trim() || null,
      notes: data.notes?.trim() || null,
    };
    const res = await api.post('/appointments', payload);
    return res.data;
  },

  /**
   * Reschedule appointment to a new date and time
   * @param {number|string} id
   * @param {Object} data - { appointment_date, start_time }
   */
  async reschedule(id, data) {
    const payload = {
      appointment_date: data.appointment_date,
      start_time: data.start_time,
    };
    const res = await api.patch(`/appointments/${id}/reschedule`, payload);
    return res.data;
  },

  /**
   * Update appointment status
   * @param {number|string} id
   * @param {string} status - 'pending'|'confirmed'|'in_progress'|'completed'|'cancelled'|'no_show'
   */
  async updateStatus(id, status) {
    const res = await api.patch(`/appointments/${id}/status`, { status });
    return res.data;
  },

  /**
   * Cancel appointment with optional reason
   * @param {number|string} id
   * @param {string} cancelReason
   */
  async cancel(id, cancelReason) {
    const payload = {
      cancel_reason: cancelReason?.trim() || null,
    };
    const res = await api.patch(`/appointments/${id}/cancel`, payload);
    return res.data;
  },

  /**
   * Soft delete appointment (admin or receptionist only)
   * @param {number|string} id
   */
  async delete(id) {
    const res = await api.delete(`/appointments/${id}`);
    return res.data;
  },
};

export default appointmentService;
