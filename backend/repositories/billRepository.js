// ── Bill Repository (PostgreSQL) ──────────────────────────────────────────
// All bill-related database queries

const { getPool } = require('../config/database');

const BillRepository = {
  async findAll({ customerId, paid } = {}) {
    let query = `
      SELECT b.*,
        b.final_amount AS final_amount,
        GREATEST(0, COALESCE(b.gross_amount, b.total_amount) - COALESCE(b.final_amount, b.total_amount)) AS credit_used,
        COALESCE(b.gross_amount, b.total_amount) AS bill_amount,
        c.phone AS customer_phone
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE 1=1`;
    const params = [];

    if (customerId) {
      params.push(customerId);
      query += ` AND b.customer_id = $${params.length}`;
    }
    if (paid !== undefined) {
      params.push(paid);
      query += ` AND b.paid = $${params.length}`;
    }

    query += ' ORDER BY b.bill_year DESC, b.bill_month DESC';
    const result = await getPool().query(query, params);
    return result.rows;
  },

  async findById(id) {
    const result = await getPool().query(
      `SELECT b.*,
        GREATEST(0, COALESCE(b.gross_amount, b.total_amount) - COALESCE(b.final_amount, b.total_amount)) AS credit_used,
        COALESCE(b.gross_amount, b.total_amount) AS bill_amount,
        c.phone AS customer_phone
       FROM bills b
       LEFT JOIN customers c ON b.customer_id = c.id
       WHERE b.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByCustomerMonth(customerId, month, year) {
    const result = await getPool().query(
      'SELECT * FROM bills WHERE customer_id = $1 AND bill_month = $2 AND bill_year = $3 ORDER BY id DESC LIMIT 1',
      [customerId, month, year]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const { customer_id, customer_name, bill_month, bill_year, total_quantity, total_amount, balance, bill_start_date, bill_end_date } = data;
    const result = await getPool().query(
      'INSERT INTO bills (customer_id, customer_name, bill_month, bill_year, total_quantity, total_amount, balance, bill_start_date, bill_end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [customer_id, customer_name, bill_month, bill_year, total_quantity || 0, total_amount || 0, balance || total_amount || 0, bill_start_date, bill_end_date]
    );
    return result.rows[0] || { id: result.rows[0]?.id, ...data };
  },

  async upsert(
    customer_id, customer_name, billMonth, billYear, startDate, endDate,
    totalQuantity, billAmount, finalAmount, leaveDays, extraDays,
    totalExtra, periods, connection, existing = null
  ) {
    const conn = connection || getPool();
    // existing may be passed in from the service to avoid a duplicate query.
    // NOTE: only re-query when the param is literally `undefined` (not passed).
    // The service explicitly passes `null` for verified-new bills, which must
    // NOT trigger another SELECT here.
    if (existing === undefined) existing = await this.findByCustomerMonth(customer_id, billMonth, billYear);

    if (existing) {
      const prevAmountPaid = Number(existing.amount_paid || 0);
      let newAmountPaid = prevAmountPaid;
      let creditRefunded = 0;

      // If the corrected bill is smaller than what was already paid in cash,
      // refund the difference to the customer's wallet instead of silently
      // losing it (or worse, flipping the bill to paid).
      if (prevAmountPaid > finalAmount) {
        creditRefunded = Number((prevAmountPaid - finalAmount).toFixed(2));
        newAmountPaid = finalAmount;
      }

      const newBalance = Number(Math.max(0, finalAmount - newAmountPaid).toFixed(2));
      // Preserve settlement: a bill is only 'paid' when the remaining balance
      // is actually zero. Regenerating must never auto-pay an unpaid bill.
      const newPaid = newBalance <= 0 ? true : false;

      await conn.query(
        `UPDATE bills SET
          total_quantity = $1, gross_amount = $2, final_amount = $3, leave_days = $4, extra_days = $5,
          total_extra_milk = $6, total_amount = $7, amount_paid = $8, balance = $9, paid = $10, periods = $11
         WHERE id = $12`,
        [totalQuantity, billAmount, finalAmount, leaveDays, extraDays, totalExtra, billAmount, newAmountPaid, newBalance, newPaid, periods, existing.id]
      );
      return { id: existing.id, already_exists: true, credit_refunded: creditRefunded };
    }

    const result = await conn.query(
      `INSERT INTO bills
       (customer_id, customer_name, bill_month, bill_year, bill_start_date, bill_end_date,
         total_quantity, gross_amount, final_amount, leave_days, extra_days,
         total_extra_milk, total_amount, amount_paid, balance, paid, periods)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, $14, $15, $16)
       RETURNING id`,
      [customer_id, customer_name, billMonth, billYear, startDate, endDate,
        totalQuantity, billAmount, finalAmount, leaveDays, extraDays,
        totalExtra, billAmount, finalAmount, (finalAmount <= 0 && billAmount > 0), periods]
    );
    return { id: result.rows[0].id, already_exists: false, credit_refunded: 0 };
  },

  async update(id, data) {
    const fields = [];
    const params = [];
    let idx = 1;
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${idx}`);
      params.push(value);
      idx++;
    }
    if (fields.length === 0) return false;
    params.push(id);
    const result = await getPool().query(
      `UPDATE bills SET ${fields.join(', ')} WHERE id = $${idx}`,
      params
    );
    return result.rowCount > 0;
  },

  async delete(id) {
    const result = await getPool().query('DELETE FROM bills WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async getUnpaidWithCredit() {
    const result = await getPool().query(
      'SELECT b.*, c.credit_balance FROM bills b JOIN customers c ON b.customer_id = c.id WHERE b.paid = FALSE ORDER BY b.bill_year DESC, b.bill_month DESC'
    );
    return result.rows;
  },

  // Analytics queries
  async getMonthlyBilling(year, month) {
    const result = await getPool().query(
      'SELECT COALESCE(SUM(total_amount),0) as billed, COALESCE(SUM(amount_paid),0) as collected, COALESCE(SUM(balance),0) as pending FROM bills WHERE bill_year = $1 AND bill_month = $2',
      [year, month]
    );
    const row = result.rows[0];
    return {
      billed: Number(row.billed || 0),
      collected: Number(row.collected || 0),
      pending: Number(row.pending || 0),
    };
  },

  async getUnpaidSummary() {
    const result = await getPool().query(
      "SELECT COUNT(*)::int as count, COALESCE(SUM(balance),0) as total FROM bills WHERE paid = FALSE"
    );
    const row = result.rows[0];
    return { count: Number(row.count), total: Number(row.total || 0) };
  },
};

module.exports = BillRepository;
