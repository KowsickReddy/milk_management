// API Service Layer — Connects Frontend to Backend
import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ── Toast flood guard ─────────────────────────────────────────────────────
// Render's free tier sleeps after inactivity — when it cold-starts, several
// parallel page queries can fail at once and each would fire a toast, making
// the app feel like it "crashed". Dedupe identical messages within a window.
let lastToastMsg = '';
let lastToastAt = 0;
const TOAST_DEDUPE_MS = 4000;

function notifyError(message) {
  const now = Date.now();
  if (message === lastToastMsg && now - lastToastAt < TOAST_DEDUPE_MS) return;
  lastToastMsg = message;
  lastToastAt = now;
  toast.error(message);
}

// ── Token Expiry Guard ─────────────────────────────────────────────────────
// Prevents a flood of toasts when multiple API calls fail due to same expired token
let tokenExpiredHandled = false;

function handleTokenExpired() {
  if (tokenExpiredHandled) return;
  tokenExpiredHandled = true;

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Use setTimeout to avoid interrupting the current render cycle
  setTimeout(() => {
    window.location.href = '/';
  }, 100);
}

// Reset the guard on successful login (called externally)
export function resetTokenExpiredGuard() {
  tokenExpiredHandled = false;
}

// ── Core fetch helper ──────────────────────────────────────────────────────
export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');

  // Extract suppressToast from options and remove before passing to fetch
  const { suppressToast, ...fetchOptions } = options;

  const config = {
    method: fetchOptions.method || 'GET',
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  // AbortController timeout — prevents requests hanging forever when the
  // backend is cold-starting or unreachable. 45s tolerates Render's free-tier
  // wake-up (which can take ~30-60s) while still failing fast for real outages.
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutMs = 45000;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  if (controller) config.signal = controller.signal;

  let response;
  try {
    response = await fetch(url, config);
  } catch (e) {
    // Network error (CORS, DNS, connection refused, timeout, etc.)
    if (controller) clearTimeout(timeoutId);
    if (!suppressToast) {
      notifyError('Network error — can\'t reach the server. Check your connection.');
    }
    throw new Error('Network error — server unreachable');
  }
  if (controller) clearTimeout(timeoutId);

  let data;
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { error: await response.text() };
    }
  } catch (e) {
    data = { error: 'Failed to parse response' };
  }

  // Handle authentication errors (401 + 403 with TOKEN_INVALID code)
  // Backend returns 403 with code: 'TOKEN_INVALID' for expired/invalid JWT tokens
  if (!response.ok && token) {
    const isAuthError = 
      response.status === 401 || 
      (response.status === 403 && data?.code === 'TOKEN_INVALID');

    if (isAuthError) {
      handleTokenExpired();
      throw new Error(data?.error || 'Session expired');
    }
  }

  if (!response.ok) {
    // Only show toast if the caller hasn't opted out — deduped to avoid a
    // flood of identical errors when several queries fail together.
    if (!suppressToast) {
      notifyError(data?.error || `Server Error: ${response.status}`);
    }
    throw new Error(data?.error || `API Error: ${response.status}`);
  }

  return data;
}

// ── Customers ──────────────────────────────────────────────────────────────
export const customersAPI = {
  getAll:   ()         => apiCall('/api/customers'),
  getById:  (id)       => apiCall(`/api/customers/${id}`),
  create:   (data)     => apiCall('/api/customers', { method: 'POST', body: data }),
  update:   (id, data) => apiCall(`/api/customers/${id}`, { method: 'PUT', body: data }),
  delete:   (id)       => apiCall(`/api/customers/${id}`, { method: 'DELETE' }),
  updatePin:(id, pin)  => apiCall(`/api/customers/${id}/pin`, { method: 'PATCH', body: { pin } }),
};

// ── Users (Staff Management) ──────────────────────────────────────────────
export const usersAPI = {
  getAll: ()       => apiCall('/api/users'),
  create: (data)   => apiCall('/api/users', { method: 'POST', body: data }),
  update: (id, data) => apiCall(`/api/users/${id}`, { method: 'PUT', body: data }),
  delete: (id)     => apiCall(`/api/users/${id}`, { method: 'DELETE' }),
};

// ── Admin ──────────────────────────────────────────────────────────────────
export const adminAPI = {
  getLoginLogs: () => apiCall('/api/admin/login-logs'),
  getComplaints: () => apiCall('/api/admin/complaints'),
  updateComplaintStatus: (id, status) => apiCall(`/api/admin/complaints/${id}/status`, { method: 'PATCH', body: { status } }),
  getAlerts: () => apiCall('/api/admin/alerts'),
  getAuditLogs: (params = {}) => apiCall(`/api/logs${toQuery(params)}`),
};

// ── Deliveries ─────────────────────────────────────────────────────────────
export const deliveriesAPI = {
  getAll:     (params = {}) => apiCall(`/api/deliveries${toQuery(params)}`),
  create:     (data)        => apiCall('/api/deliveries', { method: 'POST', body: data }),
  createBatch:(data)        => apiCall('/api/deliveries/batch', { method: 'POST', body: data }),
  softDelete: (id)          => apiCall(`/api/deliveries/${id}/soft-delete`, { method: 'PATCH' }),
};

// ── Leave ──────────────────────────────────────────────────────────────────
export const leaveAPI = {
  getAll: (params = {}) => apiCall(`/api/leave${toQuery(params)}`),
  create: (data)         => apiCall('/api/leave', { method: 'POST', body: data }),
  delete: (id)           => apiCall(`/api/leave/${id}`, { method: 'DELETE' }),
};

// ── Bills ──────────────────────────────────────────────────────────────────
export const billsAPI = {
  getAll:    (params = {}) => apiCall(`/api/bills${toQuery(params)}`),
  getById:   (id)          => apiCall(`/api/bills/${id}`),
  create:    (data)        => apiCall('/api/bills', { method: 'POST', body: data }),
  generate:  (data)        => apiCall('/api/bills/generate', { method: 'POST', body: data }),
  generateBatch: (data)    => apiCall('/api/bills/generate-batch', { method: 'POST', body: data }),
  update:    (id, data)    => apiCall(`/api/bills/${id}`, { method: 'PUT', body: data }),
  delete:    (id)          => apiCall(`/api/bills/${id}`, { method: 'DELETE' }),
  deleteBulk: (ids)        => apiCall('/api/bills/delete-bulk', { method: 'POST', body: { ids } }),
  deleteAll:  ()           => apiCall('/api/bills/delete-all', { method: 'POST' }),
  deleteFiltered: (filters = {}) => apiCall('/api/bills/delete-filtered', { method: 'POST', body: filters }),
};

// ── Payments ───────────────────────────────────────────────────────────────
export const paymentsAPI = {
  getAll:         (params = {}) => apiCall(`/api/payments${toQuery(params)}`),
  getByBill:      (billId)      => apiCall(`/api/payments/bill/${billId}`),
  create:         (data)        => apiCall('/api/payments', { method: 'POST', body: data }),
};

// ── Credits ────────────────────────────────────────────────────────────────
export const creditsAPI = {
  get:                    (customerId) => apiCall(`/api/credits/${customerId}`),
  apply:                  (data)       => apiCall('/api/credits/apply', { method: 'POST', body: data }),
  getUnpaidBillsWithCredit:            () => apiCall('/api/bills/unpaid-with-credit'),
};

// ── Expenses ──────────────────────────────────────────────────────────────
export const expensesAPI = {
  getAll:    (params = {}) => apiCall(`/api/expenses${toQuery(params)}`),
  create:    (data)        => apiCall('/api/expenses', { method: 'POST', body: data }),
  update:    (id, data)    => apiCall(`/api/expenses/${id}`, { method: 'PUT', body: data }),
  delete:    (id)          => apiCall(`/api/expenses/${id}`, { method: 'DELETE' }),
};

// ── Analytics ──────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: ()             => apiCall('/api/analytics/dashboard'),
  getEarnings:  (year, month)  => apiCall(`/api/analytics/earnings${toQuery({ year, month })}`),
  getStats:     ()             => apiCall('/api/stats'),
  getFarmStats: ()             => apiCall('/api/analytics/farm'),
};

// ── Cattle Management ──────────────────────────────────────────────────────
export const cattleAPI = {
  getAll: ()     => apiCall('/api/cattle'),
  create: (data) => apiCall('/api/cattle', { method: 'POST', body: data }),
  update: (id, data) => apiCall(`/api/cattle/${id}`, { method: 'PUT', body: data }),
  delete: (id)   => apiCall(`/api/cattle/${id}`, { method: 'DELETE' }),
};

// ── Feed Management ───────────────────────────────────────────────────────
export const feedAPI = {
  getAll: ()     => apiCall('/api/feed'),
  create: (data) => apiCall('/api/feed', { method: 'POST', body: data }),
  delete: (id)   => apiCall(`/api/feed/${id}`, { method: 'DELETE' }),
};

// ── Reports ────────────────────────────────────────────────────────────────
export const reportsAPI = {
  getDaily:    (date)               => apiCall(`/api/reports/daily${toQuery({ date })}`),
  getMonthly:  (year, month)        => apiCall(`/api/reports/monthly${toQuery({ year, month })}`),
  getCustomer: (id, startDate, endDate) =>
    apiCall(`/api/reports/customer/${id}${toQuery({ startDate, endDate })}`),
};

// ── Portal (Customer Self-Service) ────────────────────────────────────────
export const portalAPI = {
  getDashboard:   (customerId) => apiCall(`/api/portal/dashboard/${customerId}`),
  getDeliveries:  (customerId) => apiCall(`/api/portal/deliveries/${customerId}`),
  getBills:       (customerId) => apiCall(`/api/portal/bills/${customerId}`),
  updateQuantity: (data)        => apiCall('/api/portal/update-quantity', { method: 'POST', body: data }),
  createComplaint:(data)        => apiCall('/api/portal/complaints', { method: 'POST', body: data }),
};

// ── Health ─────────────────────────────────────────────────────────────────
export const healthCheck = async () => {
  try {
    const res = await apiCall('/health');
    return String(res.status).toLowerCase() === 'ok';
  } catch {
    return false;
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────
function toQuery(params) {
  const qs = new URLSearchParams(params).toString();
  return qs ? `?${qs}` : '';
}

// ── WebAuthn ─────────────────────────────────────────────────────────────
export const webauthnAPI = {
  registerBegin: (data)      => apiCall('/api/auth/webauthn/register/begin', { method: 'POST', body: data }),
  registerComplete: (data)   => apiCall('/api/auth/webauthn/register/complete', { method: 'POST', body: data }),
  loginBegin: (data)         => apiCall('/api/auth/webauthn/login/begin', { method: 'POST', body: data }),
  loginComplete: (data)      => apiCall('/api/auth/webauthn/login/complete', { method: 'POST', body: data }),
  getCredentials: (userId)   => apiCall(`/api/auth/webauthn/credentials/${userId}`),
  deleteCredential: (id)     => apiCall(`/api/auth/webauthn/credentials/${id}`, { method: 'DELETE' }),
};

// ── Notes ─────────────────────────────────────────────────────────────────
const notesAPI = {
  getAll: ()         => apiCall('/api/notes'),
  getById: (id)      => apiCall(`/api/notes/${id}`),
  create: (data)     => apiCall('/api/notes', { method: 'POST', body: data }),
  update: (id, data) => apiCall(`/api/notes/${id}`, { method: 'PUT', body: data }),
  delete: (id)       => apiCall(`/api/notes/${id}`, { method: 'DELETE' }),
};

// ── Portal Calendar ──────────────────────────────────────────────────────
const portalCalendarAPI = {
  get: (customerId, year, month) => apiCall(`/api/portal/calendar/${customerId}?year=${year}&month=${month}`),
};

const api = {
  customers:  customersAPI,
  users:      usersAPI,
  admin:      adminAPI,
  portal:     { ...portalAPI, getCalendar: portalCalendarAPI.get },
  notes:      notesAPI,
  cattle:     cattleAPI,
  feed:       feedAPI,
  deliveries: deliveriesAPI,
  leave:      leaveAPI,
  bills:      billsAPI,
  payments:   paymentsAPI,
  credits:    creditsAPI,
  expenses:   expensesAPI,
  analytics:  analyticsAPI,
  reports:    reportsAPI,
  webauthn:   webauthnAPI,
  healthCheck,
};

export default api;
