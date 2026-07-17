// ── Migration 002: Billing & Wallet Schema (PostgreSQL) ──────────────────
// Adds credit_balance to customers, extra billing columns to bills

const { getPool } = require('../config/database');

async function up(repo) {
  const hasCreditBalance = await repo.columnExists('customers', 'credit_balance');
  if (!hasCreditBalance) {
    await getPool().query(
      'ALTER TABLE customers ADD COLUMN credit_balance NUMERIC(10,2) DEFAULT 0'
    );
  }

  const billColumns = [
    ['gross_amount', 'ALTER TABLE bills ADD COLUMN gross_amount NUMERIC(10,2) DEFAULT 0'],
    ['final_amount', 'ALTER TABLE bills ADD COLUMN final_amount NUMERIC(10,2) DEFAULT 0'],
    ['leave_days', 'ALTER TABLE bills ADD COLUMN leave_days INTEGER DEFAULT 0'],
    ['extra_days', 'ALTER TABLE bills ADD COLUMN extra_days INTEGER DEFAULT 0'],
    ['total_extra_milk', 'ALTER TABLE bills ADD COLUMN total_extra_milk NUMERIC(10,2) DEFAULT 0'],
  ];

  for (const [column, query] of billColumns) {
    const exists = await repo.columnExists('bills', column);
    if (!exists) await getPool().query(query);
  }

  // In PostgreSQL, we alter column types directly (no MODIFY COLUMN equivalent)
  // These are already correct from the schema, but we ensure types for migration
  console.log('✓ Migration 002: Billing & wallet schema updated');
}

module.exports = { up };
