// ── Complaint Repository (PostgreSQL) ─────────────────────────────────────
// Complaints and alerts database queries

const { getPool } = require('../config/database');

const ComplaintRepository = {
  async findAll() {
    const result = await getPool().query(
      'SELECT c.*, cust.name as customer_name FROM complaints c JOIN customers cust ON c.customer_id = cust.id ORDER BY c.created_at DESC'
    );
    return result.rows;
  },

  async getAlerts() {
    const result = await getPool().query(
      "SELECT * FROM alerts WHERE is_read = FALSE ORDER BY created_at DESC"
    );
    return result.rows;
  },

  async createAlert(alertType, message, connection) {
    const conn = connection || getPool();
    await conn.query(
      'INSERT INTO alerts (alert_type, message) VALUES ($1, $2)',
      [alertType, message]
    );
  },
};

module.exports = ComplaintRepository;
