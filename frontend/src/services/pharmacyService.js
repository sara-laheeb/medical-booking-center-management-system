import api from './api';

export const pharmacyService = {
  // ── Prescriptions ──────────────────────────────────────────────────────────

  async getPrescriptions(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.doctor_id) query.set('doctor_id', String(params.doctor_id));
    if (params.patient_id) query.set('patient_id', String(params.patient_id));

    const qs = query.toString();
    const endpoint = `/prescriptions${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  async getPrescriptionById(id) {
    const res = await api.get(`/prescriptions/${id}`);
    return res.data;
  },

  async createPrescription(data) {
    const res = await api.post('/prescriptions', data);
    return res;
  },

  async updatePrescription(id, data) {
    const res = await api.patch(`/prescriptions/${id}`, data);
    return res;
  },

  async dispensePrescription(id) {
    const res = await api.patch(`/pharmacy/prescriptions/${id}/dispense`);
    return res;
  },

  async cancelPrescription(id) {
    const res = await api.patch(`/prescriptions/${id}/cancel`);
    return res;
  },

  async updatePrescriptionStatus(id, status) {
    const res = await api.patch(`/prescriptions/${id}/status`, { status });
    return res;
  },

  // ── Medications Catalog & Inventory ────────────────────────────────────────

  async getMedications(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.low_stock) query.set('low_stock', 'true');

    const qs = query.toString();
    const endpoint = `/medications${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  async getMedicationById(id) {
    const res = await api.get(`/medications/${id}`);
    return res.data;
  },

  async createMedication(data) {
    const res = await api.post('/medications', data);
    return res;
  },

  async updateMedication(id, data) {
    const res = await api.put(`/medications/${id}`, data);
    return res;
  },

  async deleteMedication(id) {
    const res = await api.delete(`/medications/${id}`);
    return res;
  },

  async adjustStock(id, { quantity, type = 'add', reason = '', unit_cost = 0 }) {
    const res = await api.patch(`/medications/${id}/stock`, {
      quantity: Number(quantity),
      type,
      reason,
      unit_cost: Number(unit_cost) || 0
    });
    return res;
  },

  // ── Pharmacy Analytics, Suppliers & Stock Operations ───────────────────────

  async getStats() {
    const res = await api.get('/pharmacy/stats');
    return res.data;
  },

  async getTransactions(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.type && params.type !== 'all') query.set('type', params.type);
    if (params.medication_id) query.set('medication_id', String(params.medication_id));

    const qs = query.toString();
    const endpoint = `/pharmacy/transactions${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  async stockOperation(payload) {
    const res = await api.post('/pharmacy/stock-operations', payload);
    return res.data;
  },

  async getSuppliers() {
    const res = await api.get('/pharmacy/suppliers');
    return res.data;
  },

  async saveSupplier(payload) {
    const res = await api.post('/pharmacy/suppliers', payload);
    return res.data;
  },
};

export default pharmacyService;
