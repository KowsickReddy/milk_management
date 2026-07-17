// ── Migration Repository (PostgreSQL) ─────────────────────────────────────
// Database migration helpers using PostgreSQL information_schema

const { getPool } = require('../config/database');

const MigrationRepository = {
  async columnExists(table, column) {
    try {
      const { rows } = await getPool().query(
        `SELECT COUNT(*)::int AS count FROM information_schema.columns
         WHERE table_catalog = current_database()
           AND table_schema = 'public'
           AND table_name = $1
           AND column_name = $2`,
        [table, column]
      );
      return rows && rows.length > 0 && rows[0].count > 0;
    } catch {
      return false;
    }
  },

  async getColumnLength(table, column) {
    try {
      const { rows } = await getPool().query(
        `SELECT character_maximum_length
         FROM information_schema.columns
         WHERE table_catalog = current_database()
           AND table_schema = 'public'
           AND table_name = $1
           AND column_name = $2`,
        [table, column]
      );
      return (rows && rows.length > 0) ? (rows[0]?.character_maximum_length || 0) : 0;
    } catch {
      return 0;
    }
  },

  async hasTable(table) {
    try {
      const { rows } = await getPool().query(
        `SELECT COUNT(*)::int AS count
         FROM information_schema.tables
         WHERE table_catalog = current_database()
           AND table_schema = 'public'
           AND table_name = $1`,
        [table]
      );
      return rows && rows.length > 0 && rows[0].count > 0;
    } catch {
      return false;
    }
  },
};

module.exports = MigrationRepository;
