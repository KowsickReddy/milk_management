// ── Migration 009: Add Multi-Shift Support ───────────────────────────────
// Adds evening_milk_quantity column and allows 'both' shift value

const { getPool } = require('../config/database');

async function up() {
  const pool = getPool();

  // Add evening_milk_quantity column
  const hasEveningQty = await columnExists(pool, 'customers', 'evening_milk_quantity');
  if (!hasEveningQty) {
    await pool.query('ALTER TABLE customers ADD COLUMN evening_milk_quantity NUMERIC(10,2) DEFAULT NULL');
    console.log('✓ Migration 009: Added evening_milk_quantity to customers');
  }

  console.log('✓ Migration 009: Multi-shift support ready');
}

async function columnExists(pool, table, column) {
  const result = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = $1 AND column_name = $2
  `, [table, column]);
  return result.rows.length > 0;
}

module.exports = { up };
