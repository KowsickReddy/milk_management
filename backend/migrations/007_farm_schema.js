// ── Migration 007: Farm Schema (PostgreSQL) ──────────────────────────────
// Adds entry_date to cattle table if missing

const { getPool } = require('../config/database');

async function up(repo) {
  const hasCattle = await repo.hasTable('cattle');
  if (!hasCattle) {
    // Table will be created by createTables(), skip
    return;
  }

  const hasEntryDate = await repo.columnExists('cattle', 'entry_date');
  if (!hasEntryDate) {
    await getPool().query('ALTER TABLE cattle ADD COLUMN entry_date DATE NULL');
    console.log('✓ Migration 007: entry_date added to cattle');
  }
}

module.exports = { up };
