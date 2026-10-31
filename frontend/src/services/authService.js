import api from './api';

export const authService = {
  /**
   * Log in user with email and password
   * Returns: { user: { id, name, email, role, is_active }, token }
   */
  async login({ email, password }) {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  /**
   * Register a new user (patient or doctor)
   * Returns: { user: { id, name, email, role, is_active }, token } or { pending: true, user }
   */
  async register(payload) {
    const res = await api.post('/auth/register', payload);
    return res.data;
  },

  /**
   * Fetch authenticated user's current profile from backend
   * Returns: { id, name, email, role, is_active, created_at }
   */
  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export default authService;
