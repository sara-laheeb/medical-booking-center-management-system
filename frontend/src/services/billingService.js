import api from './api';

export const billingService = {
  // ── Invoices ───────────────────────────────────────────────────────────────

  async getInvoices(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.patient_id) query.set('patient_id', String(params.patient_id));
    if (params.doctor_id) query.set('doctor_id', String(params.doctor_id));

    const qs = query.toString();
    const endpoint = `/invoices${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  async getInvoiceById(id) {
    const res = await api.get(`/invoices/${id}`);
    return res.data;
  },

  async createInvoice(data) {
    const res = await api.post('/invoices', data);
    return res;
  },

  async recordPayment(id, { amount, payment_method = 'cash' }) {
    const res = await api.patch(`/invoices/${id}/pay`, { amount: Number(amount), payment_method });
    return res;
  },

  async refundInvoice(id, { amount, reason }) {
    const res = await api.patch(`/invoices/${id}/refund`, { amount: Number(amount), reason });
    return res;
  },

  // ── Expenses & Financial Summary ───────────────────────────────────────────

  async getExpenses(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.category) query.set('category', params.category);
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);

    const qs = query.toString();
    const endpoint = `/financial/expenses${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  async recordExpense(data) {
    const res = await api.post('/financial/expenses', data);
    return res;
  },

  async getFinancialSummary(params = {}) {
    const query = new URLSearchParams();
    if (params.date_from) query.set('date_from', params.date_from);
    if (params.date_to) query.set('date_to', params.date_to);

    const qs = query.toString();
    const endpoint = `/financial/summary${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res.data;
  },

  // ── Billing Records ────────────────────────────────────────────────────────

  async getBillingRecords(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);

    const qs = query.toString();
    const endpoint = `/billing${qs ? `?${qs}` : ''}`;
    const res = await api.get(endpoint);
    return res;
  },

  async updateBillingStatus(id, status) {
    const res = await api.patch(`/billing/${id}/status`, { status });
    return res;
  },
};

export default billingService;
