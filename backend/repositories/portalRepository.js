// ── Portal Repository (PostgreSQL) ────────────────────────────────────────
// Customer portal database queries
// NOTE: pg returns { rows, fields, rowCount } — never use array destructuring!

const { getPool } = require('../config/database');

const PortalRepository = {
  async getDashboard(customerId) {
    const today = new Date().toISOString().split('T')[0];

    const customerRows = await getPool().query('SELECT * FROM customers WHERE id = $1', [customerId]);
    if (customerRows.rows.length === 0) return null;

    const customer = customerRows.rows[0];
    delete customer.pin;

    const deliveryRows = await getPool().query(
      'SELECT * FROM deliveries WHERE customer_id = $1 AND date = $2::date AND is_deleted = FALSE',
      [customerId, today]
    );

    const billRows = await getPool().query(
      'SELECT SUM(balance) as total_due FROM bills WHERE customer_id = $1 AND paid = FALSE',
      [customerId]
    );

    return {
      customer,
      todayDelivery: deliveryRows.rows[0] || null,
      totalDue: billRows.rows[0].total_due || 0,
    };
  },

  async getDeliveries(customerId) {
    const result = await getPool().query(
      'SELECT * FROM deliveries WHERE customer_id = $1 AND is_deleted = FALSE ORDER BY date DESC LIMIT 31',
      [customerId]
    );
    return result.rows;
  },

  async getBills(customerId) {
    const result = await getPool().query(
      'SELECT * FROM bills WHERE customer_id = $1 ORDER BY bill_year DESC, bill_month DESC',
      [customerId]
    );
    return result.rows;
  },

  async updateQuantity(customerId, date, quantity, session, connection) {
    const conn = connection || getPool();
    const customers = await conn.query(
      'SELECT name, phone, default_milk_quantity FROM customers WHERE id = $1', [customerId]
    );
    if (customers.rows.length === 0) throw new Error('Customer not found');

    const customer = customers.rows[0];
    const defaultQty = parseFloat(customer.default_milk_quantity) || 0;
    const deliveredQty = parseFloat(quantity) || 0;

    const existing = await conn.query(
      'SELECT * FROM deliveries WHERE customer_id = $1 AND date = $2::date AND delivery_shift = $3 AND is_deleted = FALSE',
      [customerId, date, session || 'morning']
    );

    const status = deliveredQty > 0 ? 'delivered' : 'leave';

    if (existing.rows.length > 0) {
      await conn.query(
        'UPDATE deliveries SET delivered_quantity = $1, status = $2, quantity_overridden = TRUE WHERE id = $3',
        [deliveredQty, status, existing.rows[0].id]
      );
    } else {
      await conn.query(
        'INSERT INTO deliveries (customer_id, customer_name, date, scheduled_quantity, delivered_quantity, status, delivery_shift) VALUES ($1, $2, $3::date, $4, $5, $6, $7)',
        [customerId, customer.name, date, defaultQty, deliveredQty, status, session || 'morning']
      );
    }

    return { customer };
  },

  async createComplaint(customerId, subject, message, connection) {
    const conn = connection || getPool();
    const customers = await conn.query('SELECT name, phone FROM customers WHERE id = $1', [customerId]);
    if (customers.rows.length === 0) throw new Error('Customer not found');

    await conn.query(
      'INSERT INTO complaints (customer_id, subject, message) VALUES ($1, $2, $3)',
      [customerId, subject, message]
    );

    return customers.rows[0];
  },
};

module.exports = PortalRepository;
