// API Service Layer — Connects Frontend to Backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ── Core fetch helper ──────────────────────────────────────────────────────
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  const contentType = response.headers.get('content-type');

  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new Error(`Server returned non-JSON response (${response.status}): ${text.slice(0, 100)}`);
  }

  if (!response.ok) {
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
};

// ── Deliveries ─────────────────────────────────────────────────────────────
export const deliveriesAPI = {
  getAll:     (params = {}) => apiCall(`/api/deliveries${toQuery(params)}`),
  create:     (data)        => apiCall('/api/deliveries', { method: 'POST', body: data }),
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
  update:    (id, data)    => apiCall(`/api/bills/${id}`, { method: 'PUT', body: data }),
  delete:    (id)          => apiCall(`/api/bills/${id}`, { method: 'DELETE' }),
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

// ── Analytics ──────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: ()             => apiCall('/api/analytics/dashboard'),
  getEarnings:  (year, month)  => apiCall(`/api/analytics/earnings?year=${year}&month=${month}`),
  getStats:     ()             => apiCall('/api/stats'),
};

// ── Reports ────────────────────────────────────────────────────────────────
export const reportsAPI = {
  getDaily:    (date)               => apiCall(`/api/reports/daily?date=${date}`),
  getMonthly:  (year, month)        => apiCall(`/api/reports/monthly?year=${year}&month=${month}`),
  getCustomer: (id, startDate, endDate) =>
    apiCall(`/api/reports/customer/${id}?${new URLSearchParams({ startDate, endDate })}`),
};

// ── Health ─────────────────────────────────────────────────────────────────
export const healthCheck = async () => {
  try {
    const res = await apiCall('/health');
    return res.status === 'ok';
  } catch {
    return false;
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────
function toQuery(params) {
  const qs = new URLSearchParams(params).toString();
  return qs ? `?${qs}` : '';
}

const api = {
  customers:  customersAPI,
  deliveries: deliveriesAPI,
  leave:      leaveAPI,
  bills:      billsAPI,
  payments:   paymentsAPI,
  credits:    creditsAPI,
  analytics:  analyticsAPI,
  reports:    reportsAPI,
  healthCheck,
};

export default api;
