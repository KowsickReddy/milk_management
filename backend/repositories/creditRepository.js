// ── Credit Repository (PostgreSQL) ────────────────────────────────────────
// All credit/wallet-related database queries
// NOTE: pg returns { rows, fields, rowCount } — never use array destructuring!

const { getPool } = require('../config/database');

const CreditRepository = {
  async getBalance(customerId) {
    const result = await getPool().query('SELECT credit_balance FROM customers WHERE id = $1', [customerId]);
    return result.rows[0] || null;
  },

  async applyCredit(customerId, billId, amount, connection) {
    const conn = connection || getPool();

    // Get customer credit
    const customers = await conn.query('SELECT credit_balance FROM customers WHERE id = $1', [customerId]);
    const availableCredit = parseFloat(customers.rows[0].credit_balance);
    const applyAmount = Math.min(parseFloat(amount), availableCredit);

    if (applyAmount <= 0) throw new Error('No credit available');

    // Get bill balance
    const bills = await conn.query('SELECT balance FROM bills WHERE id = $1', [billId]);
    const billBalance = parseFloat(bills.rows[0].balance);
    const creditToApply = Math.min(applyAmount, billBalance);

    if (creditToApply <= 0) throw new Error('Bill has no balance');

    await conn.query(
      'UPDATE bills SET amount_paid = amount_paid + $1, balance = GREATEST(0, balance - $2), paid = (GREATEST(0, balance - $3) <= 0) WHERE id = $4',
      [creditToApply, creditToApply, creditToApply, billId]
    );
    await conn.query(
      'UPDATE customers SET credit_balance = credit_balance - $1 WHERE id = $2',
      [creditToApply, customerId]
    );

    return { applied: creditToApply };
  },
};

module.exports = CreditRepository;
