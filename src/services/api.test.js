import api, {
  apiCall,
  customersAPI,
  usersAPI,
  adminAPI,
  deliveriesAPI,
  leaveAPI,
  billsAPI,
  paymentsAPI,
  creditsAPI,
  expensesAPI,
  analyticsAPI,
  cattleAPI,
  feedAPI,
  reportsAPI,
  portalAPI,
  webauthnAPI,
  healthCheck,
} from './api';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('react-hot-toast', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] ?? null),
    setItem: jest.fn((key, val) => { store[key] = val; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location
delete window.location;
window.location = { href: '' };

// ── Helpers ────────────────────────────────────────────────────────────────
function mockResponse(status, body, contentType = 'application/json') {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Map([['content-type', contentType]]),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});

// ── apiCall ────────────────────────────────────────────────────────────────
describe('apiCall', () => {
  it('sends GET request by default', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { data: 'ok' }));
    const result = await apiCall('/test');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual({ data: 'ok' });
  });

  it('includes auth token from localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('test-token');
    mockFetch.mockResolvedValueOnce(mockResponse(200, {}));
    await apiCall('/test');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('sends POST with JSON body', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, {}));
    await apiCall('/test', { method: 'POST', body: { name: 'test' } });
    const call = mockFetch.mock.calls[0][1];
    expect(call.method).toBe('POST');
    expect(JSON.parse(call.body)).toEqual({ name: 'test' });
  });

  it('includes credentials', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, {}));
    await apiCall('/test');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('handles 401 by clearing session and redirecting', async () => {
    jest.useFakeTimers();
    localStorageMock.getItem.mockReturnValue('valid-token');
    // 401 with no error body → apiCall falls back to the 'Session expired' message
    mockFetch.mockResolvedValueOnce(mockResponse(401, {}));
    await expect(apiCall('/test')).rejects.toThrow('Session expired');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    // Redirect happens on a 100ms timeout (anti-toast-flood guard)
    jest.advanceTimersByTime(200);
    expect(window.location.href).toBe('/');
    jest.useRealTimers();
  });

  it('throws on non-ok response without token', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    mockFetch.mockResolvedValueOnce(mockResponse(400, { error: 'Bad request' }));
    await expect(apiCall('/test')).rejects.toThrow('Bad request');
  });

  it('handles non-JSON responses', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(500, 'Server error', 'text/plain'));
    await expect(apiCall('/test')).rejects.toThrow('Server error');
  });

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
    await expect(apiCall('/test')).rejects.toThrow('Network error — server unreachable');
  });
});

// ── Endpoint Modules ──────────────────────────────────────────────────────
describe('API endpoint modules', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue(mockResponse(200, []));
  });

  it('customersAPI.getAll', async () => {
    await customersAPI.getAll();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/customers'), expect.any(Object));
  });

  it('customersAPI.getById', async () => {
    await customersAPI.getById(5);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/customers/5'), expect.any(Object));
  });

  it('customersAPI.create', async () => {
    await customersAPI.create({ name: 'Test' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/customers'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('customersAPI.update', async () => {
    await customersAPI.update(1, { name: 'Updated' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/customers/1'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('customersAPI.delete', async () => {
    await customersAPI.delete(3);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/customers/3'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('customersAPI.updatePin', async () => {
    await customersAPI.updatePin(1, '1234');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/customers/1/pin'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('usersAPI.getAll', async () => {
    await usersAPI.getAll();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/users'), expect.any(Object));
  });

  it('usersAPI.create', async () => {
    await usersAPI.create({ username: 'new' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('usersAPI.update', async () => {
    await usersAPI.update(1, { role: 'admin' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/1'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('usersAPI.delete', async () => {
    await usersAPI.delete(2);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/2'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('adminAPI.getLoginLogs', async () => {
    await adminAPI.getLoginLogs();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/login-logs'), expect.any(Object));
  });

  it('adminAPI.getComplaints', async () => {
    await adminAPI.getComplaints();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/admin/complaints'), expect.any(Object));
  });

  it('deliveriesAPI.getAll with params', async () => {
    await deliveriesAPI.getAll({ date: '2024-01-01' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('date=2024-01-01'),
      expect.any(Object)
    );
  });

  it('deliveriesAPI.create', async () => {
    await deliveriesAPI.create({ customer_id: 1, quantity: 5 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/deliveries'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('deliveriesAPI.softDelete', async () => {
    await deliveriesAPI.softDelete(10);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/deliveries/10/soft-delete'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('billsAPI.getAll', async () => {
    await billsAPI.getAll({ year: 2024 });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/bills'), expect.any(Object));
  });

  it('billsAPI.generate', async () => {
    await billsAPI.generate({ customer_id: 1 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/bills/generate'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('billsAPI.generateBatch', async () => {
    await billsAPI.generateBatch({ month: 1, year: 2024 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/bills/generate-batch'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('paymentsAPI.create', async () => {
    await paymentsAPI.create({ bill_id: 1, amount: 100 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/payments'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('creditsAPI.apply', async () => {
    await creditsAPI.apply({ customer_id: 1, bill_id: 1, amount: 50 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/credits/apply'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('expensesAPI.getAll', async () => {
    await expensesAPI.getAll({ startDate: '2024-01-01', endDate: '2024-01-31' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('startDate=2024-01-01'),
      expect.any(Object)
    );
  });

  it('expensesAPI.create', async () => {
    await expensesAPI.create({ category: 'Feed', amount: 500 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/expenses'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('expensesAPI.update', async () => {
    await expensesAPI.update(1, { amount: 600 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/expenses/1'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('expensesAPI.delete', async () => {
    await expensesAPI.delete(2);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/expenses/2'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('cattleAPI.getAll', async () => {
    await cattleAPI.getAll();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/cattle'), expect.any(Object));
  });

  it('cattleAPI.create', async () => {
    await cattleAPI.create({ tag_number: 'C001' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cattle'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('cattleAPI.update', async () => {
    await cattleAPI.update(1, { breed: 'Holstein' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cattle/1'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('cattleAPI.delete', async () => {
    await cattleAPI.delete(3);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cattle/3'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('feedAPI.create', async () => {
    await feedAPI.create({ feed_type: 'Silage', bags_bought: 10 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/feed'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('reportsAPI.getMonthly', async () => {
    await reportsAPI.getMonthly(2024, 3);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('year=2024'),
      expect.any(Object)
    );
  });

  it('portalAPI.getDashboard', async () => {
    await portalAPI.getDashboard(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/portal/dashboard/1'),
      expect.any(Object)
    );
  });

  it('portalAPI.createComplaint', async () => {
    await portalAPI.createComplaint({ customer_id: 1, subject: 'Issue', message: 'Help' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/portal/complaints'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('webauthnAPI.registerBegin', async () => {
    await webauthnAPI.registerBegin({ username: 'admin' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/webauthn/register/begin'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('webauthnAPI.deleteCredential', async () => {
    await webauthnAPI.deleteCredential(5);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/webauthn/credentials/5'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('leaveAPI.getAll', async () => {
    await leaveAPI.getAll({ date: '2024-01-01' });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/leave'), expect.any(Object));
  });

  it('leaveAPI.create', async () => {
    await leaveAPI.create({ customer_id: 1, start_date: '2024-01-01', end_date: '2024-01-05' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/leave'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('leaveAPI.delete', async () => {
    await leaveAPI.delete(3);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/leave/3'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});

// ── healthCheck ────────────────────────────────────────────────────────────
describe('healthCheck', () => {
  it('returns true when API responds ok', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { status: 'ok' }));
    const result = await healthCheck();
    expect(result).toBe(true);
  });

  it('returns true when status is OK (uppercase)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { status: 'OK' }));
    const result = await healthCheck();
    expect(result).toBe(true);
  });

  it('returns false when health endpoint fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection refused'));
    const result = await healthCheck();
    expect(result).toBe(false);
  });

  it('returns false when status is not ok', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { status: 'error' }));
    const result = await healthCheck();
    expect(result).toBe(false);
  });
});

// ── Default export (combined api object) ───────────────────────────────────
describe('default api export', () => {
  it('has all module references', () => {
    expect(api.customers).toBe(customersAPI);
    expect(api.users).toBe(usersAPI);
    expect(api.admin).toBe(adminAPI);
    expect(api.portal.getDashboard).toBe(portalAPI.getDashboard);
    expect(typeof api.portal.getCalendar).toBe('function');
    expect(api.cattle).toBe(cattleAPI);
    expect(api.feed).toBe(feedAPI);
    expect(api.deliveries).toBe(deliveriesAPI);
    expect(api.leave).toBe(leaveAPI);
    expect(api.bills).toBe(billsAPI);
    expect(api.payments).toBe(paymentsAPI);
    expect(api.credits).toBe(creditsAPI);
    expect(api.expenses).toBe(expensesAPI);
    expect(api.analytics).toBe(analyticsAPI);
    expect(api.reports).toBe(reportsAPI);
    expect(api.webauthn).toBe(webauthnAPI);
    expect(api.healthCheck).toBe(healthCheck);
  });
});
