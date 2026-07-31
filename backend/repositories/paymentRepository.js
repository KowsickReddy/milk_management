// ── Payment Repository (PostgreSQL) ───────────────────────────────────────
// All payment-related database queries

const { getPool } = require('../config/database');

const PaymentRepository = {
  async findAll({ customerId } = {}) {
    let query = 'SELECT * FROM payments';
    const params = [];
    if (customerId) {
      params.push(customerId);
      query += ' WHERE customer_id = $1';
    }
    query += ' ORDER BY payment_date DESC';
    const result = await getPool().query(query, params);
    return result.rows;
  },

  async findByBillId(billId) {
    const result = await getPool().query(
      'SELECT * FROM payments WHERE bill_id = $1 ORDER BY payment_date ASC',
      [billId]
    );
    return result.rows;
  },

  async create(data, connection) {
    const conn = connection || getPool();
    const { bill_id, customer_id, amount_paid, change_given, payment_method, is_partial, is_full_with_change, change_amount } = data;
    const result = await conn.query(
      'INSERT INTO payments (bill_id, customer_id, amount_paid, change_given, payment_method, is_partial, is_full_with_change, change_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [bill_id, customer_id, amount_paid, change_given || 0, payment_method || 'cash', is_partial || false, is_full_with_change || false, change_amount || 0]
    );
    return result.rows[0] || { id: result.rows[0]?.id, ...data };
  },

  async getMonthlyTotal(year, month) {
    const result = await getPool().query(
      'SELECT SUM(amount_paid) as total FROM payments WHERE EXTRACT(MONTH FROM payment_date)=$1 AND EXTRACT(YEAR FROM payment_date)=$2',
      [month, year]
    );
    return Number(result.rows[0].total || 0);
  },
};

module.exports = PaymentRepository;
