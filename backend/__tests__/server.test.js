/* eslint-env jest */
'use strict';

// ── Environment setup (BEFORE any imports) ─────────────────────────────────
process.env.JWT_SECRET = 'test-jwt-secret-12345';
process.env.DB_PASSWORD = 'test-db-password';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

// ── Mock config/database (PostgreSQL) ──────────────────────────────────────
// The backend uses the pg driver via ../config/database (getPool, withTransaction).
// We mock that module so no real database is touched.
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockBeginTransaction = jest.fn();
const mockCommit = jest.fn();
const mockRollback = jest.fn().mockResolvedValue();

const mockConnection = {
  query: mockQuery,
  beginTransaction: mockBeginTransaction,
  commit: mockCommit,
  rollback: mockRollback,
  release: mockRelease,
};

const mockPool = {
  query: mockQuery,
  connect: jest.fn().mockResolvedValue(mockConnection),
  end: jest.fn(),
};

jest.mock('../config/database', () => ({
  getPool: jest.fn(() => mockPool),
  initializeDatabase: jest.fn(() => Promise.resolve(mockPool)),
  checkHealth: jest.fn(() => Promise.resolve({ ok: true, latency: 0 })),
  getConnection: jest.fn(() => Promise.resolve(mockConnection)),
  withTransaction: jest.fn((cb) => cb(mockConnection)),
  createUpdateTriggerFunction: jest.fn(() => Promise.resolve()),
  applyUpdatedAtTrigger: jest.fn(() => Promise.resolve()),
}));

// ── Import server + supertest ──────────────────────────────────────────────
const request = require('supertest');
const app = require('../server');
const bcrypt = require('bcryptjs');

// ── Test Data ──────────────────────────────────────────────────────────────
const customer = { id: 1, name: 'Test', phone: '9876543210', shift: 'morning',
  status: 'active', daily_milk_quantity: 2, milk_rate_per_liter: 50,
  default_milk_quantity: 2, credit_balance: 100, customer_type: 'regular',
  route_area: 'Zone A', pin: '$2a$10$m' };

const userRow = { id: 1, username: 'admin', role: 'admin', full_name: 'Admin',
  phone: '9999999999', is_active: true, pin: '$2a$10$h' };

const delivery = { id: 1, customer_id: 1, customer_name: 'Test',
  date: '2024-01-15', delivered_quantity: 2, status: 'delivered',
  extra_milk: 0, delivery_shift: 'morning', is_deleted: false };

const bill = { id: 1, customer_id: 1, customer_name: 'Test',
  bill_month: 1, bill_year: 2024, total_quantity: 30, total_amount: 1500,
  gross_amount: 1500, final_amount: 1400, amount_paid: 0, balance: 1400,
  paid: false, bill_start_date: '2024-01-01', bill_end_date: '2024-01-31',
  customer_phone: '9876543210', credit_used: 100, bill_amount: 1500 };

function token(ov = {}) {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: 1, username: 'admin', role: 'admin', ...ov },
    process.env.JWT_SECRET, { expiresIn: '1h' });
}
const auth = (t) => ({ Authorization: `Bearer ${t}` });

// pg helper: rows → { rows, rowCount }
const pgRows = (rows) => ({ rows, rowCount: rows.length });
const pgOne = (row) => ({ rows: [row], rowCount: 1 });
const pgNone = () => ({ rows: [], rowCount: 0 });
const pgAffected = (n = 1) => ({ rows: [], rowCount: n });

// Default: SELECT → empty rows, everything else → rowCount 1
beforeEach(() => {
  jest.resetAllMocks();

  // Re-setup ALL critical mocks that were wiped by resetAllMocks()
  mockQuery.mockImplementation((sql) => {
    const s = String(sql).trim().toUpperCase();
    if (s.startsWith('SELECT') || s.startsWith('WITH') || s.startsWith('BEGIN'))
      return Promise.resolve(pgNone());
    return Promise.resolve(pgAffected(1));
  });
  mockRelease.mockImplementation(() => {});
  mockBeginTransaction.mockImplementation(() => Promise.resolve());
  mockCommit.mockImplementation(() => Promise.resolve());
  mockRollback.mockImplementation(() => Promise.resolve());

  // Re-setup module mocks (resetAllMocks wipes implementations)
  const db = require('../config/database');
  db.getPool.mockReturnValue(mockPool);
  db.initializeDatabase.mockResolvedValue(mockPool);
  db.checkHealth.mockResolvedValue({ ok: true, latency: 0 });
  db.getConnection.mockResolvedValue(mockConnection);
  db.withTransaction.mockImplementation((cb) => cb(mockConnection));
  db.createUpdateTriggerFunction.mockResolvedValue();
  db.applyUpdatedAtTrigger.mockResolvedValue();

  mockPool.connect = jest.fn().mockResolvedValue(mockConnection);
});

// ══════════════════════════════════════════════════════════════════════════
describe('Health', () => {
  it('GET /health', async () => {
    const r = await request(app).get('/health');
    expect(r.status).toBe(200);
    expect(r.body.status).toBe('ok');
  });
  it('GET /api/health', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('POST /api/users/login', () => {
  it('valid credentials', async () => {
    const hp = await bcrypt.hash('1234', 10);
    mockQuery.mockResolvedValueOnce(pgOne({ ...userRow, pin: hp }));
    const r = await request(app).post('/api/users/login')
      .send({ username: 'admin', pin: '1234' });
    expect(r.status).toBe(200);
    expect(r.body.token).toBeDefined();
    expect(r.body.username).toBe('admin');
  });

  it('invalid credentials → 401', async () => {
    const hp = await bcrypt.hash('wrong', 10);
    mockQuery.mockResolvedValueOnce(pgOne({ ...userRow, pin: hp }));
    const r = await request(app).post('/api/users/login')
      .send({ username: 'admin', pin: '0000' });
    expect(r.status).toBe(401);
  });

  it('nonexistent user → 401', async () => {
    const r = await request(app).post('/api/users/login')
      .send({ username: 'ghost', pin: '1234' });
    expect(r.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('POST /api/customers/login', () => {
  it('valid credentials', async () => {
    const hp = await bcrypt.hash('4321', 10);
    mockQuery.mockResolvedValueOnce(pgOne({ ...customer, pin: hp }));
    const r = await request(app).post('/api/customers/login')
      .send({ phone: '9876543210', pin: '4321' });
    expect(r.status).toBe(200);
    expect(r.body.role).toBe('customer');
  });

  it('inactive customer → 401', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ ...customer, pin: await bcrypt.hash('4321', 10), status: 'inactive' }));
    const r = await request(app).post('/api/customers/login')
      .send({ phone: '9876543210', pin: '4321' });
    expect(r.status).toBe(401);
  });

  it('missing fields → 400', async () => {
    const r = await request(app).post('/api/customers/login').send({ phone: '' });
    expect(r.status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Auth middleware', () => {
  it('401 without token', async () => {
    expect((await request(app).get('/api/customers')).status).toBe(401);
  });
  it('403 with bad token', async () => {
    expect((await request(app).get('/api/customers').set(auth('bad'))).status).toBe(403);
  });
  it('403 wrong role', async () => {
    expect((await request(app).get('/api/users').set(auth(token({ role: 'customer' })))).status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Customers CRUD', () => {
  const t = token();
  it('GET /api/customers', async () => {
    mockQuery.mockResolvedValueOnce(pgOne(customer));
    const r = await request(app).get('/api/customers').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body[0].name).toBe('Test');
  });
  it('GET /api/customers/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgOne(customer));
    const r = await request(app).get('/api/customers/1').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.id).toBe(1);
  });
  it('GET /api/customers/:id — 404', async () => {
    const r = await request(app).get('/api/customers/999').set(auth(t));
    expect(r.status).toBe(404);
  });
  it('POST /api/customers', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ id: 2, name: 'New' }));
    const r = await request(app).post('/api/customers').set(auth(t))
      .send({ name: 'New', phone: '9876543211', daily_milk_quantity: 3, milk_rate_per_liter: 55 });
    expect(r.status).toBe(201);
    expect(r.body.id).toBe(2);
  });
  it('POST — missing name → 400', async () => {
    const r = await request(app).post('/api/customers').set(auth(t))
      .send({ phone: '9876543211' });
    expect(r.status).toBe(400);
  });
  it('PUT /api/customers/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, name: 'Updated', daily_milk_quantity: 5 }));
    const r = await request(app).put('/api/customers/1').set(auth(t))
      .send({ name: 'Updated', daily_milk_quantity: 5 });
    expect(r.status).toBe(200);
  });
  it('DELETE /api/customers/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgAffected(1));
    const r = await request(app).delete('/api/customers/1').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('DELETE — 404', async () => {
    mockQuery.mockResolvedValueOnce(pgAffected(0));
    const r = await request(app).delete('/api/customers/999').set(auth(t));
    expect(r.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('User Management', () => {
  const t = token();
  it('GET /api/users', async () => {
    mockQuery.mockResolvedValueOnce(pgOne(userRow));
    const r = await request(app).get('/api/users').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body[0].username).toBe('admin');
  });
  it('POST /api/users', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ id: 2, username: 'worker1' }));
    const r = await request(app).post('/api/users').set(auth(t))
      .send({ username: 'worker1', pin: '1234', role: 'worker' });
    expect(r.status).toBe(201);
  });
  it('POST — missing fields → 400', async () => {
    const r = await request(app).post('/api/users').set(auth(t))
      .send({ role: 'worker' });
    expect(r.status).toBe(400);
  });
  it('PUT /api/users/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ ...userRow, username: 'worker1' })); // SELECT (findById)
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE
    mockQuery.mockResolvedValueOnce(pgOne({ ...userRow, username: 'worker1' })); // SELECT back (findById)
    const r = await request(app).put('/api/users/2').set(auth(t))
      .send({ full_name: 'Updated' });
    expect(r.status).toBe(200);
  });
  it('DELETE /api/users/:id — non-admin', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ ...userRow, username: 'worker1' })); // SELECT (findById)
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // DELETE
    const r = await request(app).delete('/api/users/2').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('DELETE — protect admin account', async () => {
    mockQuery.mockResolvedValueOnce(pgOne(userRow)); // SELECT finds admin
    const r = await request(app).delete('/api/users/1').set(auth(t));
    expect(r.status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Deliveries', () => {
  const t = token();
  it('GET /api/deliveries?date=...', async () => {
    mockQuery.mockResolvedValueOnce(pgOne(delivery));
    const r = await request(app).get('/api/deliveries?date=2024-01-15').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('GET /api/deliveries?startDate=...', async () => {
    mockQuery.mockResolvedValueOnce(pgOne(delivery));
    const r = await request(app).get('/api/deliveries?startDate=2024-01-01&endDate=2024-01-31').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('POST /api/deliveries', async () => {
    // 1=leaveCheck(SELECT), 2=INSERT (upsert RETURNING *)
    mockQuery.mockResolvedValueOnce(pgNone());     // leave check → empty
    mockQuery.mockResolvedValueOnce(pgOne({ ...delivery, id: 2 })); // INSERT
    const r = await request(app).post('/api/deliveries').set(auth(t))
      .send({ customer_id: 1, customer_name: 'Test', date: '2024-01-15',
        delivered_quantity: 2, delivery_shift: 'morning' });
    expect(r.status).toBe(201);
  });
  it('POST — missing customer_id → 400', async () => {
    const r = await request(app).post('/api/deliveries').set(auth(t))
      .send({ date: '2024-01-15' });
    expect(r.status).toBe(400);
  });
  it('POST /api/deliveries — occasional shift accepted', async () => {
    // Regression test: occasional customers (shift='occasional') must be confirmable.
    mockQuery.mockResolvedValueOnce(pgNone()); // leave check → empty
    mockQuery.mockResolvedValueOnce(pgOne({ ...delivery, id: 3, delivery_shift: 'occasional' }));
    const r = await request(app).post('/api/deliveries').set(auth(t))
      .send({ customer_id: 1, customer_name: 'Test', date: '2024-01-15',
        delivered_quantity: 2, delivery_shift: 'occasional' });
    expect(r.status).toBe(201);
  });
  it('POST /api/deliveries — invalid shift → 400', async () => {
    const r = await request(app).post('/api/deliveries').set(auth(t))
      .send({ customer_id: 1, date: '2024-01-15', delivered_quantity: 2, delivery_shift: 'night' });
    expect(r.status).toBe(400);
  });
  it('POST /api/deliveries/batch', async () => {
    const r = await request(app).post('/api/deliveries/batch').set(auth(t))
      .send({ deliveries: [{ customer_id: 1, name: 'A', date: '2024-01-15', delivered_quantity: 2 },
        { customer_id: 2, name: 'B', date: '2024-01-15', delivered_quantity: 1 }] });
    expect(r.status).toBe(200);
    expect(r.body.count).toBe(2);
  });
  it('POST /api/deliveries/batch — non-array → 400', async () => {
    const r = await request(app).post('/api/deliveries/batch').set(auth(t))
      .send({ deliveries: 'bad' });
    expect(r.status).toBe(400);
  });
  it('PATCH /api/deliveries/:id/soft-delete', async () => {
    mockQuery.mockResolvedValueOnce(pgAffected(1));
    const r = await request(app).patch('/api/deliveries/1/soft-delete').set(auth(t));
    expect(r.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Leaves', () => {
  const t = token();
  it('GET /api/leave', async () => {
    const r = await request(app).get('/api/leave').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('POST /api/leave — future date', async () => {
    const fd = new Date(Date.now() + 864e5 * 7).toISOString().split('T')[0];
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1 })); // INSERT
    const r = await request(app).post('/api/leave').set(auth(t))
      .send({ customer_id: 1, start_date: fd, end_date: fd, reason: 'Holiday' });
    expect(r.status).toBe(201);
  });
  it('POST — past date → 400', async () => {
    const r = await request(app).post('/api/leave').set(auth(t))
      .send({ customer_id: 1, start_date: '2020-01-01' });
    expect(r.status).toBe(400);
  });
  it('DELETE /api/leave/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgAffected(1));
    const r = await request(app).delete('/api/leave/1').set(auth(t));
    expect(r.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Bills', () => {
  const t = token();
  it('GET /api/bills', async () => {
    mockQuery.mockResolvedValueOnce(pgOne(bill));
    const r = await request(app).get('/api/bills').set(auth(t));
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body)).toBe(true);
  });
  it('POST /api/bills', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ ...bill, id: 2, bill_month: 2 }));
    const r = await request(app).post('/api/bills').set(auth(t))
      .send({ customer_id: 1, customer_name: 'Test', bill_month: 2, bill_year: 2024, total_quantity: 28, total_amount: 1400 });
    expect(r.status).toBe(201);
    expect(r.body.id).toBe(2);
  });
  it('POST — invalid month → 400', async () => {
    const r = await request(app).post('/api/bills').set(auth(t))
      .send({ customer_id: 1, bill_month: 13, bill_year: 2024 });
    expect(r.status).toBe(400);
  });
  it('PUT /api/bills/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE
    mockQuery.mockResolvedValueOnce(pgOne(bill));   // SELECT back
    const r = await request(app).put('/api/bills/1').set(auth(t))
      .send({ paid: true, amount_paid: 1400, balance: 0 });
    expect(r.status).toBe(200);
  });
  it('DELETE /api/bills/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgAffected(1));
    const r = await request(app).delete('/api/bills/1').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('GET /api/bills/unpaid-with-credit', async () => {
    const r = await request(app).get('/api/bills/unpaid-with-credit').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('GET /api/bills/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgOne(bill));
    const r = await request(app).get('/api/bills/1').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.id).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Payments', () => {
  const t = token();
  it('GET /api/payments', async () => {
    const r = await request(app).get('/api/payments').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('POST /api/payments — partial', async () => {
    // 1=SELECTbill FOR UPDATE, 2=INSERTpayment, 3=UPDATEbill, 4=SELECTcustomercredit
    mockQuery.mockResolvedValueOnce(pgOne({ ...bill, balance: 1400 }));
    mockQuery.mockResolvedValueOnce(pgOne({ id: 2 }));
    const r = await request(app).post('/api/payments').set(auth(t))
      .send({ bill_id: 1, amount_paid: 700 });
    expect(r.status).toBe(201);
  });
  it('POST /api/payments — overpayment', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ ...bill, balance: 1400 }));
    mockQuery.mockResolvedValueOnce(pgOne({ id: 3 }));
    const r = await request(app).post('/api/payments').set(auth(t))
      .send({ bill_id: 1, amount_paid: 1500 });
    expect(r.status).toBe(201);
    expect(r.body.credit_added).toBeGreaterThan(0);
  });
  it('POST — missing bill_id → 400', async () => {
    const r = await request(app).post('/api/payments').set(auth(t))
      .send({ amount_paid: 100 });
    expect(r.status).toBe(400);
  });
  it('GET /api/payments/bill/:billId', async () => {
    mockQuery.mockResolvedValueOnce(pgOne(bill)); // SELECT bill for auth
    const r = await request(app).get('/api/payments/bill/1').set(auth(t));
    expect(r.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Credits', () => {
  const t = token();
  it('GET /api/credits/:customerId', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ credit_balance: 200 }));
    const r = await request(app).get('/api/credits/1').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.credit_balance).toBe(200);
  });
  it('POST /api/credits/apply', async () => {
    // 1=SELECTcustomer credit, 2=SELECTbill, 3=UPDATEbill, 4=UPDATEcustomer
    mockQuery.mockResolvedValueOnce(pgOne({ credit_balance: 200 }));
    mockQuery.mockResolvedValueOnce(pgOne({ balance: 500, amount_paid: 0 }));
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE bill
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE customer
    const r = await request(app).post('/api/credits/apply').set(auth(t))
      .send({ customer_id: 1, bill_id: 1, amount: 200 });
    expect(r.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Expenses', () => {
  const t = token();
  it('GET /api/expenses', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, category: 'Feed', amount: 500, expense_date: '2024-01-15' }));
    const r = await request(app).get('/api/expenses').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('POST /api/expenses', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ id: 2, category: 'Feed', amount: 500, expense_date: '2024-01-15' }));
    const r = await request(app).post('/api/expenses').set(auth(t))
      .send({ category: 'Feed', amount: 500, expense_date: '2024-01-15' });
    expect(r.status).toBe(201);
  });
  it('POST — missing fields → 400', async () => {
    const r = await request(app).post('/api/expenses').set(auth(t))
      .send({ category: 'Feed' });
    expect(r.status).toBe(400);
  });
  it('PUT /api/expenses/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, category: 'Feed', amount: 600, expense_date: '2024-01-15' }));
    const r = await request(app).put('/api/expenses/1').set(auth(t))
      .send({ category: 'Feed', amount: 600, expense_date: '2024-01-15' });
    expect(r.status).toBe(200);
  });
  it('DELETE /api/expenses/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgAffected(1));
    const r = await request(app).delete('/api/expenses/1').set(auth(t));
    expect(r.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Cattle', () => {
  const t = token();
  it('GET /api/cattle', async () => {
    const r = await request(app).get('/api/cattle').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('POST /api/cattle', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ id: 2, tag_number: 'C002' }));
    const r = await request(app).post('/api/cattle').set(auth(t))
      .send({ tag_number: 'C002', breed: 'Jersey' });
    expect(r.status).toBe(201);
  });
  it('POST — missing tag → 400', async () => {
    const r = await request(app).post('/api/cattle').set(auth(t)).send({ breed: 'Jersey' });
    expect(r.status).toBe(400);
  });
  it('PUT /api/cattle/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, tag_number: 'C001', breed: 'Updated' }));
    const r = await request(app).put('/api/cattle/1').set(auth(t))
      .send({ tag_number: 'C001', breed: 'Updated' });
    expect(r.status).toBe(200);
  });
  it('DELETE /api/cattle/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgAffected(1));
    const r = await request(app).delete('/api/cattle/1').set(auth(t));
    expect(r.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Feed', () => {
  const t = token();
  it('GET /api/feed', async () => {
    const r = await request(app).get('/api/feed').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('POST /api/feed', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ id: 2 }));
    const r = await request(app).post('/api/feed').set(auth(t))
      .send({ feed_type: 'Silage', bags_bought: 10, cost_per_bag: 200, purchase_date: '2024-01-15' });
    expect(r.status).toBe(201);
    expect(r.body.total_cost).toBe(2000);
  });
  it('DELETE /api/feed/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgAffected(1));
    const r = await request(app).delete('/api/feed/1').set(auth(t));
    expect(r.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Analytics', () => {
  const t = token();
  it('GET /api/analytics/dashboard', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ count: 10 }));
    mockQuery.mockResolvedValueOnce(pgOne({ count: 8, total_milk: 20 }));
    mockQuery.mockResolvedValueOnce(pgOne({ count: 2 }));
    mockQuery.mockResolvedValueOnce(pgOne({ count: 15 }));
    mockQuery.mockResolvedValueOnce(pgOne({ billed: 5000, collected: 3000, pending: 2000 }));
    mockQuery.mockResolvedValueOnce(pgOne({ count: 3, total: 2000 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total: 500 }));
    const r = await request(app).get('/api/analytics/dashboard').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.total_customers).toBe(15);
  });
  it('GET /api/analytics/earnings', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ total_billed: 5000, total_paid: 3000, total_pending: 2000 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total_expenses: 1000 }));
    const r = await request(app).get('/api/analytics/earnings?year=2024&month=1').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.profit).toBe(2000);
  });
  it('GET /api/stats', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ count: 15 }));
    mockQuery.mockResolvedValueOnce(pgOne({ count: 8 }));
    mockQuery.mockResolvedValueOnce(pgOne({ count: 3, total: 2000 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total: 3000 }));
    const r = await request(app).get('/api/stats').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.activeCustomers).toBe(15);
  });
  it('GET /api/analytics/farm', async () => {
    mockQuery.mockResolvedValueOnce(pgOne({ total_cattle: 5, total_investment: 50000 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total_bags: 50, total_feed_cost: 10000 }));
    const r = await request(app).get('/api/analytics/farm').set(auth(t));
    expect(r.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Reports', () => {
  const t = token();
  it('GET /api/reports/monthly', async () => {
    const r = await request(app).get('/api/reports/monthly?year=2024&month=1').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.year).toBe('2024');
    expect(r.body.month).toBe('1');
  });
  it('GET /api/reports/daily', async () => {
    mockQuery.mockResolvedValueOnce(pgOne(delivery));
    const r = await request(app).get('/api/reports/daily?date=2024-01-15').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.date).toBe('2024-01-15');
  });
  it('GET /api/reports/customer/:id', async () => {
    mockQuery.mockResolvedValueOnce(pgOne(customer));
    const r = await request(app).get('/api/reports/customer/1?year=2024&month=1').set(auth(t));
    expect(r.status).toBe(200);
    expect(r.body.customer.id).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Portal', () => {
  const ct = token({ id: 1, role: 'customer', username: '9876543210' });

  it('GET /api/portal/dashboard/:customerId', async () => {
    mockQuery.mockResolvedValueOnce(pgOne(customer));          // customer
    mockQuery.mockResolvedValueOnce(pgNone());                   // deliveries (empty)
    mockQuery.mockResolvedValueOnce(pgOne({ total_due: 500 })); // bills
    const r = await request(app).get('/api/portal/dashboard/1').set(auth(ct));
    expect(r.status).toBe(200);
    expect(r.body.customer).toBeDefined();
    expect(r.body.totalDue).toBe(500);
  });
  it('GET /api/portal/deliveries/:customerId', async () => {
    const r = await request(app).get('/api/portal/deliveries/1').set(auth(ct));
    expect(r.status).toBe(200);
  });
  it('GET /api/portal/bills/:customerId', async () => {
    const r = await request(app).get('/api/portal/bills/1').set(auth(ct));
    expect(r.status).toBe(200);
  });
  it('POST /api/portal/update-quantity', async () => {
    // 1=SELECTcustomer, 2=SELECTexisting, 3=INSERTdelivery, 4=INSERTalert
    mockQuery.mockResolvedValueOnce(pgOne({ name: 'Test', phone: '9876543210', default_milk_quantity: 2 }));
    mockQuery.mockResolvedValueOnce(pgNone()); // no existing delivery
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1 })); // INSERT delivery
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // INSERT alert
    const r = await request(app).post('/api/portal/update-quantity').set(auth(ct))
      .send({ customer_id: 1, date: '2024-01-15', quantity: 3, session: 'morning' });
    expect(r.status).toBe(200);
  });
  it('POST /api/portal/update-quantity — bad qty', async () => {
    const r = await request(app).post('/api/portal/update-quantity').set(auth(ct))
      .send({ customer_id: 1, date: '2024-01-15', quantity: -1 });
    expect(r.status).toBe(400);
  });
  it('POST /api/portal/complaints', async () => {
    // 1=SELECTcustomer, 2=INSERTcomplaint, 3=INSERTalert
    mockQuery.mockResolvedValueOnce(pgOne({ name: 'Test', phone: '9876543210' }));
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1 }));
    mockQuery.mockResolvedValueOnce(pgAffected(1));
    const r = await request(app).post('/api/portal/complaints').set(auth(ct))
      .send({ customer_id: 1, subject: 'Issue', message: 'Help' });
    expect(r.status).toBe(201);
  });
  it('POST /api/portal/complaints — missing fields', async () => {
    const r = await request(app).post('/api/portal/complaints').set(auth(ct))
      .send({ customer_id: 1 });
    expect(r.status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Admin', () => {
  const t = token();
  it('GET /api/admin/login-logs', async () => {
    const r = await request(app).get('/api/admin/login-logs').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('GET /api/admin/complaints', async () => {
    const r = await request(app).get('/api/admin/complaints').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('GET /api/admin/alerts', async () => {
    const r = await request(app).get('/api/admin/alerts').set(auth(t));
    expect(r.status).toBe(200);
  });
  it('PATCH /api/customers/:id/pin', async () => {
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE pin
    const r = await request(app).patch('/api/customers/1/pin').set(auth(t))
      .send({ pin: '5678' });
    expect(r.status).toBe(200);
  });
  it('PATCH /api/customers/:id/pin — short PIN', async () => {
    const r = await request(app).patch('/api/customers/1/pin').set(auth(t))
      .send({ pin: '12' });
    expect(r.status).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe('Bill Generation', () => {
  const t = token();

  it('POST /api/bills/generate', async () => {
    // generateBill query order (pg uses client.query('BEGIN')/'COMMIT'):
    // 1=BEGIN, 2=SELECTcustomer, 3=SELECTdeliverytotals, 4=SELECTdeliveryleave,
    // 5=SELECTlongleave, 6=findByCustomerMonth(SELECT), 7=UPDATEcredit (new bill),
    // 8=INSERTbill, 9=COMMIT, 10=SELECTbillback
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // BEGIN
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, name: 'Test', milk_rate_per_liter: 50,
      credit_balance: 100, daily_milk_quantity: 2, default_milk_quantity: 2 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total_delivered: 30, total_extra: 5, extra_days: 3, delivery_days: 15 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 2 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgNone()); // no existing bill (findByCustomerMonth)
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE credit
    mockQuery.mockResolvedValueOnce(pgOne({ id: 5 })); // INSERT bill
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // COMMIT
    mockQuery.mockResolvedValueOnce(pgOne({ id: 5, customer_id: 1 })); // SELECT bill back
    const r = await request(app).post('/api/bills/generate').set(auth(t))
      .send({ customer_id: 1, month: 1, year: 2024 });
    expect(r.status).toBe(201);
    expect(r.body.already_exists).toBe(false);
  });

  it('POST /api/bills/generate — zero deliveries → skipped, no dummy bill', async () => {
    // Regression: a customer with no deliveries must NOT get a ₹0 bill that
    // was previously auto-marked as PAID without any user interaction.
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // BEGIN
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, name: 'Test', milk_rate_per_liter: 50,
      credit_balance: 0, daily_milk_quantity: 2, default_milk_quantity: 2 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total_delivered: 0, total_extra: 0, extra_days: 0, delivery_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // ROLLBACK
    const r = await request(app).post('/api/bills/generate').set(auth(t))
      .send({ customer_id: 1, month: 1, year: 2024 });
    expect(r.status).toBe(200);
    expect(r.body.skipped).toBe(true);
    // No INSERT into bills was issued
    const inserts = mockQuery.mock.calls.filter(c => String(c[0]).toUpperCase().includes('INSERT INTO BILLS'));
    expect(inserts.length).toBe(0);
  });

  it('POST /api/bills/generate — no milk rate → skipped, no dummy bill', async () => {
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // BEGIN
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, name: 'Test', milk_rate_per_liter: 0,
      credit_balance: 0, daily_milk_quantity: 2, default_milk_quantity: 2 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total_delivered: 30, total_extra: 0, extra_days: 0, delivery_days: 15 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // ROLLBACK
    const r = await request(app).post('/api/bills/generate').set(auth(t))
      .send({ customer_id: 1, month: 1, year: 2024 });
    expect(r.status).toBe(200);
    expect(r.body.skipped).toBe(true);
    const inserts = mockQuery.mock.calls.filter(c => String(c[0]).toUpperCase().includes('INSERT INTO BILLS'));
    expect(inserts.length).toBe(0);
  });

  it('POST /api/bills/generate — regeneration does NOT double-deduct credit', async () => {
    // Regression: re-generating a bill for a month that already has a bill must
    // reuse the applied credit — no second UPDATE customers credit_balance.
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // BEGIN
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, name: 'Test', milk_rate_per_liter: 50,
      credit_balance: 100, daily_milk_quantity: 2, default_milk_quantity: 2 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total_delivered: 30, total_extra: 0, extra_days: 0, delivery_days: 15 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    // Existing bill with ₹500 already applied via credit (gross 1500, final 1000)
    mockQuery.mockResolvedValueOnce(pgOne({ id: 7, amount_paid: 0, gross_amount: 1500,
      final_amount: 1000, balance: 1000, paid: false }));
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE bill (upsert)
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // COMMIT
    mockQuery.mockResolvedValueOnce(pgOne({ id: 7, customer_id: 1 })); // SELECT bill back
    const r = await request(app).post('/api/bills/generate').set(auth(t))
      .send({ customer_id: 1, month: 1, year: 2024 });
    expect(r.status).toBe(200);
    expect(r.body.already_exists).toBe(true);
    // No UPDATE customers credit_balance should have run (no double deduction)
    const creditUpdates = mockQuery.mock.calls.filter(c =>
      String(c[0]).toUpperCase().includes('UPDATE CUSTOMERS SET CREDIT_BALANCE'));
    expect(creditUpdates.length).toBe(0);
  });

  it('POST /api/bills/generate — regeneration refunds cash overpayment to wallet', async () => {
    // Regression: if a customer already paid ₹1200 cash but the regenerated
    // bill is only ₹1000, the ₹200 overpayment must go back to their wallet
    // (credit_balance) — not be silently lost.
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // BEGIN
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, name: 'Test', milk_rate_per_liter: 50,
      credit_balance: 0, daily_milk_quantity: 2, default_milk_quantity: 2 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total_delivered: 30, total_extra: 0, extra_days: 0, delivery_days: 15 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    // Existing bill: ₹1200 already paid, ₹500 credit applied (gross 1000, final 500)
    mockQuery.mockResolvedValueOnce(pgOne({ id: 9, amount_paid: 1200, gross_amount: 1000,
      final_amount: 500, balance: 0, paid: true }));
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE bill (upsert)
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE customers credit_balance +200
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // COMMIT
    mockQuery.mockResolvedValueOnce(pgOne({ id: 9, customer_id: 1 })); // SELECT bill back
    const r = await request(app).post('/api/bills/generate').set(auth(t))
      .send({ customer_id: 1, month: 1, year: 2024 });
    expect(r.status).toBe(200);
    expect(r.body.credit_refunded).toBe(200);
    // The wallet credit-add must have run
    const creditAdds = mockQuery.mock.calls.filter(c =>
      String(c[0]).toUpperCase().includes('CREDIT_BALANCE = CREDIT_BALANCE +'));
    expect(creditAdds.length).toBe(1);
  });

  it('POST /api/bills/generate — regeneration refunds credit overage to wallet', async () => {
    // Regression: if ₹1000 credit was applied to the original bill (gross 1500,
    // final 500) but the regenerated bill is only ₹500 (10L × 50), the ₹500
    // surplus credit must go back to the customer's wallet.
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // BEGIN
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, name: 'Test', milk_rate_per_liter: 50,
      credit_balance: 0, daily_milk_quantity: 2, default_milk_quantity: 2 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total_delivered: 10, total_extra: 0, extra_days: 0, delivery_days: 10 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    // Existing bill: ₹1000 credit applied (gross 1500, final 500), no cash paid
    mockQuery.mockResolvedValueOnce(pgOne({ id: 8, amount_paid: 0, gross_amount: 1500,
      final_amount: 500, balance: 0, paid: true }));
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE customers credit_balance +500 (surplus)
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE bill (upsert)
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // COMMIT
    mockQuery.mockResolvedValueOnce(pgOne({ id: 8, customer_id: 1 })); // SELECT bill back
    const r = await request(app).post('/api/bills/generate').set(auth(t))
      .send({ customer_id: 1, month: 1, year: 2024 });
    expect(r.status).toBe(200);
    expect(r.body.already_exists).toBe(true);
    // The wallet credit-add (surplus refund) must have run exactly once
    const creditAdds = mockQuery.mock.calls.filter(c =>
      String(c[0]).toUpperCase().includes('CREDIT_BALANCE = CREDIT_BALANCE +'));
    expect(creditAdds.length).toBe(1);
  });

  it('POST /api/bills/generate — missing fields', async () => {
    const r = await request(app).post('/api/bills/generate').set(auth(t))
      .send({ customer_id: 1 });
    expect(r.status).toBe(400);
  });

  it('POST /api/bills/generate-batch', async () => {
    mockQuery.mockResolvedValueOnce(pgRows([{ id: 1 }, { id: 2 }])); // customers

    // Customer 1: BEGIN, customer, totals, dleave, lleave, existing, updatecredit, insert, COMMIT, selectback
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // BEGIN
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, name: 'A', milk_rate_per_liter: 50,
      credit_balance: 0, daily_milk_quantity: 2, default_milk_quantity: 2 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total_delivered: 30, total_extra: 0, extra_days: 0, delivery_days: 15 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgNone()); // no existing bill
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE credit
    mockQuery.mockResolvedValueOnce(pgOne({ id: 10 }));
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // COMMIT
    mockQuery.mockResolvedValueOnce(pgOne({ id: 10, customer_id: 1 }));

    // Customer 2: same pattern
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // BEGIN
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, name: 'B', milk_rate_per_liter: 45,
      credit_balance: 0, daily_milk_quantity: 1, default_milk_quantity: 1 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total_delivered: 15, total_extra: 0, extra_days: 0, delivery_days: 15 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgNone()); // no existing bill
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE credit
    mockQuery.mockResolvedValueOnce(pgOne({ id: 11 }));
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // COMMIT
    mockQuery.mockResolvedValueOnce(pgOne({ id: 11, customer_id: 2 }));

    const r = await request(app).post('/api/bills/generate-batch').set(auth(t))
      .send({ month: 1, year: 2024 });
    expect(r.status).toBe(200);
    expect(r.body.processed).toBe(2);
  });

  it('POST /api/bills/generate-batch — zero-delivery customers are skipped', async () => {
    mockQuery.mockResolvedValueOnce(pgRows([{ id: 1 }, { id: 2 }])); // customers

    // Customer 1: has deliveries → bill generated
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // BEGIN
    mockQuery.mockResolvedValueOnce(pgOne({ id: 1, name: 'A', milk_rate_per_liter: 50,
      credit_balance: 0, daily_milk_quantity: 2, default_milk_quantity: 2 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total_delivered: 30, total_extra: 0, extra_days: 0, delivery_days: 15 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgNone()); // no existing bill
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // UPDATE credit
    mockQuery.mockResolvedValueOnce(pgOne({ id: 10 }));
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // COMMIT
    mockQuery.mockResolvedValueOnce(pgOne({ id: 10, customer_id: 1 }));

    // Customer 2: zero deliveries → skipped, no INSERT
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // BEGIN
    mockQuery.mockResolvedValueOnce(pgOne({ id: 2, name: 'B', milk_rate_per_liter: 45,
      credit_balance: 0, daily_milk_quantity: 1, default_milk_quantity: 1 }));
    mockQuery.mockResolvedValueOnce(pgOne({ total_delivered: 0, total_extra: 0, extra_days: 0, delivery_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgOne({ leave_days: 0 }));
    mockQuery.mockResolvedValueOnce(pgAffected(1)); // ROLLBACK

    const r = await request(app).post('/api/bills/generate-batch').set(auth(t))
      .send({ month: 1, year: 2024 });
    expect(r.status).toBe(200);
    expect(r.body.processed).toBe(1);
    expect(r.body.skipped).toBe(1);
    const failed = r.body.details.filter(d => !d.success);
    expect(failed.length).toBe(1);
    expect(failed[0].skipped).toBe(true);
  });
});
