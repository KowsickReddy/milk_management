// ── Migration 012: Add Audit Logs Table ────────────────────────────────────

const { getPool } = require('../config/database');

module.exports = {
  name: '012_audit_logs',
  up: async () => {
    const pool = getPool();
    const exists = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = CURRENT_SCHEMA() AND table_name = 'audit_logs'
    `);
    if (exists.rows.length === 0) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INT,
          user_name VARCHAR(255),
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(100),
          entity_id INT,
          details TEXT,
          ip_address VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
      console.log('✓ Migration 012: audit_logs table created');
    }
  }
};
