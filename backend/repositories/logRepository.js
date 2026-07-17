// ── Log Repository (PostgreSQL) ───────────────────────────────────────────
// Login logs and audit trail queries

const { getPool } = require('../config/database');

const LogRepository = {
  async createLoginLog(data) {
    const { user_type, user_id, username, ip_address } = data;
    await getPool().query(
      'INSERT INTO login_logs (user_type, user_id, username, ip_address) VALUES ($1, $2, $3, $4)',
      [user_type, user_id, username, ip_address]
    );
  },

  async getLoginLogs(limit = 100) {
    const result = await getPool().query(
      'SELECT * FROM login_logs ORDER BY login_time DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  },
};

module.exports = LogRepository;
