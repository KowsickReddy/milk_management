// ── Migration 004: Customer PIN (PostgreSQL) ─────────────────────────────
// Adds pin column to customers for portal login

const { getPool } = require('../config/database');

async function up(repo) {
  const hasPin = await repo.columnExists('customers', 'pin');
  if (!hasPin) {
    await getPool().query('ALTER TABLE customers ADD COLUMN pin VARCHAR(255) NULL');
    console.log('✓ Migration 004: pin column added to customers');
  }
}

module.exports = { up };
