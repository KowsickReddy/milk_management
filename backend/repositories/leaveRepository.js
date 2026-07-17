// ── Leave Repository (PostgreSQL) ────────────────────────────────────────
// All leave request database queries

const { getPool } = require('../config/database');

const LeaveRepository = {
  async findAll({ customerId } = {}) {
    const params = [];
    let query = `
      SELECT lr.*, c.name AS customer_name
      FROM leave_requests lr
      JOIN customers c ON c.id = lr.customer_id
      WHERE 1=1`;

    if (customerId) {
      params.push(customerId);
      query += ` AND lr.customer_id = $${params.length}`;
    }
    query += ' ORDER BY lr.start_date DESC, lr.created_at DESC';
    const result = await getPool().query(query, params);
    return result.rows;
  },

  async create(data) {
    const { customer_id, start_date, end_date, reason } = data;
    const result = await getPool().query(
      'INSERT INTO leave_requests (customer_id, start_date, end_date, reason) VALUES ($1, $2, $3, $4) RETURNING *',
      [customer_id, start_date, end_date || null, reason || null]
    );
    return { id: result.rows[0].id, ...data };
  },

  async delete(id) {
    const result = await getPool().query('DELETE FROM leave_requests WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async findOverlapping(customerId, date) {
    const result = await getPool().query(
      'SELECT id FROM leave_requests WHERE customer_id = $1 AND $2::date BETWEEN start_date AND end_date LIMIT 1',
      [customerId, date]
    );
    return result.rows[0] || null;
  },

  async getLeaveDaysInRange(customerId, startDate, endDate, connection) {
    const conn = connection || getPool();
    const result = await conn.query(
      `SELECT COALESCE(SUM(
        (LEAST(COALESCE(end_date, $1::date), $1::date) - GREATEST(start_date, $2::date)) + 1
      ), 0) AS leave_days
      FROM leave_requests
      WHERE customer_id = $3
        AND start_date <= $1::date
        AND (end_date IS NULL OR end_date >= $2::date)`,
      [endDate, startDate, customerId]
    );
    return Number(result.rows[0].leave_days || 0);
  },
};

module.exports = LeaveRepository;
