// ── Migration 006: Bill Periods (PostgreSQL) ─────────────────────────────
// Adds periods JSON column to bills

const { getPool } = require('../config/database');

async function up(repo) {
  const hasPeriods = await repo.columnExists('bills', 'periods');
  if (!hasPeriods) {
    await getPool().query('ALTER TABLE bills ADD COLUMN periods TEXT DEFAULT NULL');
    console.log('✓ Migration 006: periods column added to bills');
  }
}

module.exports = { up };
