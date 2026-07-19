// ── Migration 010: Add title column to customers ─────────────────────────
// Adds a 'title' field (Mr./Mrs./Ms./Dr.) for professional name formatting

const { getPool } = require('../config/database');

async function up() {
  const hasTitle = await columnExists('customers', 'title');
  if (!hasTitle) {
    await getPool().query('ALTER TABLE customers ADD COLUMN title VARCHAR(20) DEFAULT NULL');
    console.log('✓ 010: Added title column to customers');
  } else {
    console.log('→ 010: title column already exists');
  }
}

async function columnExists(table, column) {
  const result = await getPool().query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return result.rows.length > 0;
}

module.exports = { up };
