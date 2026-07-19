// ── Migration 011: Create admin_notes table ───────────────────────────────
// Stores admin notes/notepad entries with @customer mention support

const { getPool } = require('../config/database');

async function up() {
  const hasTable = await tableExists('admin_notes');
  if (!hasTable) {
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS admin_notes (
        id SERIAL PRIMARY KEY,
        note_text TEXT NOT NULL,
        mentioned_customer_ids INTEGER[] DEFAULT '{}',
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ 011: Created admin_notes table');
  } else {
    console.log('→ 011: admin_notes table already exists');
  }
}

async function tableExists(table) {
  const result = await getPool().query(
    `SELECT table_name FROM information_schema.tables WHERE table_name = $1`,
    [table]
  );
  return result.rows.length > 0;
}

module.exports = { up };
