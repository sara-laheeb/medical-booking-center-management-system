import api from './api';

export const dashboardService = {
  /**
   * Get high-level headline counts and revenue snapshot (admin only)
   * Returns: { totalPatients, activeDoctors, appointmentsToday, pendingAppointments, appointmentsByStatus, revenue }
   */
  async getOverview() {
    const res = await api.get('/dashboard/overview');
    return res.data;
  },

  /**
   * Get today's scheduled appointments (admin, doctor, receptionist)
   * Query: { limit: number }
   * Returns: Array of { id, appointment_code, start_time, end_time, status, visit_type, patient_name, doctor_name }
   */
  async getTodaySchedule(limit = 10) {
    const res = await api.get(`/dashboard/today-schedule?limit=${limit}`);
    return res.data || [];
  },

  /**
   * Get recently registered patients (admin, receptionist)
   * Query: { limit: number }
   * Returns: Array of { id, patient_code, full_name, phone, created_at }
   */
  async getRecentPatients(limit = 6) {
    const res = await api.get(`/dashboard/recent-patients?limit=${limit}`);
    return res.data || [];
  },

  /**
   * Get low stock medication alerts (admin)
   * Query: { limit: number }
   * Returns: Array of { id, name, name_ar, unit, stock_quantity, minimum_stock }
   */
  async getLowStockAlerts(limit = 6) {
    const res = await api.get(`/dashboard/low-stock?limit=${limit}`);
    return res.data || [];
  },

  /**
   * Get daily revenue trend (admin)
   * Query: { date_from?: string, date_to?: string }
   * Returns: Array of { date, collected }
   */
  async getRevenueTrend(params = {}) {
    const query = new URLSearchParams();
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);
    const qs = query.toString();
    const res = await api.get(`/dashboard/revenue-trend${qs ? `?${qs}` : ''}`);
    return res.data || [];
  },

  /**
   * Get busiest doctors ranked by appointments count (admin)
   * Query: { date_from?: string, date_to?: string, limit?: number }
   * Returns: Array of { doctor_id, doctor_name, appointment_count }
   */
  async getTopDoctors(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);
    const qs = query.toString();
    const res = await api.get(`/dashboard/top-doctors${qs ? `?${qs}` : ''}`);
    return res.data || [];
  },

  /**
   * Get doctor's personalized dashboard summary (doctor only)
   * Returns: { doctor, appointmentsToday, totalPatients, appointmentsThisWeek, appointmentsByStatus, recentAppointments }
   */
  async getDoctorSummary() {
    const res = await api.get('/dashboard/my-summary');
    return res.data;
  },
};

export default dashboardService;
