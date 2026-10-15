/**
 * Base HTTP Client Utility
 * Handles REST requests to `/api/v1`, attaches authorization Bearer tokens from localStorage,
 * and normalizes API error responses.
 */

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const { data, headers = {}, ...customOptions } = options;
  const token = localStorage.getItem('medicare_token');

  const config = {
    method: customOptions.method || 'GET',
    headers: {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(data ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...customOptions,
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    throw new ApiError(
      networkError.message || 'Network connection error — please check your connection',
      0
    );
  }

  let result = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      result = await response.json();
    } catch {
      result = null;
    }
  } else {
    try {
      result = { message: await response.text() };
    } catch {
      result = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      (result && (result.message || result.error)) ||
      `Request failed with status ${response.status}`;

    // If session is expired on authenticated request, trigger token cleanup
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('medicare_token');
      localStorage.removeItem('medicare_user');
      window.dispatchEvent(new CustomEvent('medicare_auth_expired'));
    }

    throw new ApiError(errorMessage, response.status, result);
  }

  return result;
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data, options = {}) => request(endpoint, { ...options, method: 'POST', data }),
  put: (endpoint, data, options = {}) => request(endpoint, { ...options, method: 'PUT', data }),
  patch: (endpoint, data, options = {}) => request(endpoint, { ...options, method: 'PATCH', data }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
