// ── Expense Repository (PostgreSQL) ───────────────────────────────────────
// All expense-related database queries

const { getPool } = require('../config/database');

const ExpenseRepository = {
  async findAll({ startDate, endDate } = {}) {
    let query = 'SELECT * FROM expenses';
    const params = [];
    const where = [];

    if (startDate && endDate) {
      params.push(startDate, endDate);
      where.push(`expense_date BETWEEN $1 AND $2`);
    } else if (startDate) {
      params.push(startDate);
      where.push(`expense_date >= $1`);
    } else if (endDate) {
      params.push(endDate);
      where.push(`expense_date <= $1`);
    }

    if (where.length > 0) query += ' WHERE ' + where.join(' AND ');

    query += ' ORDER BY expense_date DESC, created_at DESC';
    const result = await getPool().query(query, params);
    return result.rows;
  },

  async create(data) {
    const { category, amount, description, expense_date } = data;
    const result = await getPool().query(
      'INSERT INTO expenses (category, amount, description, expense_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [category, parseFloat(amount) || 0, description || '', expense_date]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const { category, amount, description, expense_date } = data;
    const result = await getPool().query(
      'UPDATE expenses SET category=$1, amount=$2, description=$3, expense_date=$4 WHERE id=$5 RETURNING *',
      [category, parseFloat(amount) || 0, description || '', expense_date, id]
    );
    if (result.rowCount === 0) return null;
    return result.rows[0];
  },

  async delete(id) {
    const result = await getPool().query('DELETE FROM expenses WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async getMonthlyTotal(year, month) {
    const result = await getPool().query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE EXTRACT(YEAR FROM expense_date) = $1 AND EXTRACT(MONTH FROM expense_date) = $2',
      [year, month]
    );
    return Number(result.rows[0].total || 0);
  },
};

module.exports = ExpenseRepository;
