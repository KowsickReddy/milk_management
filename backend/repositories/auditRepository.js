const { getPool } = require('../config/database');

const auditRepository = {
  async create({ userId, userName, action, entityType, entityId, details, ipAddress }) {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, userName, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress]
    );
    return result.rows[0];
  },

  async getAll({ limit = 100, offset = 0 } = {}) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  },

  async getByEntity(entityType, entityId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
      [entityType, entityId]
    );
    return result.rows;
  },

  async getByUser(userId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return result.rows;
  },

  async count() {
    const pool = getPool();
    const result = await pool.query('SELECT COUNT(*) FROM audit_logs');
    return parseInt(result.rows[0].count, 10);
  },
};

module.exports = auditRepository;
