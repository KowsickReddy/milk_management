// ── Migration 008: Add Profile Photo Columns ─────────────────────────────
// Adds profile_photo TEXT column to users and customers tables

const { getPool } = require('../config/database');

async function up() {
  const pool = getPool();
  
  // Add profile_photo to users table
  const hasUserPhoto = await columnExists('users', 'profile_photo');
  if (!hasUserPhoto) {
    await pool.query('ALTER TABLE users ADD COLUMN profile_photo TEXT DEFAULT NULL');
    console.log('✓ Migration 008: Added profile_photo to users');
  }

  // Add profile_photo to customers table
  const hasCustomerPhoto = await columnExists('customers', 'profile_photo');
  if (!hasCustomerPhoto) {
    await pool.query('ALTER TABLE customers ADD COLUMN profile_photo TEXT DEFAULT NULL');
    console.log('✓ Migration 008: Added profile_photo to customers');
  }
}

async function columnExists(table, column) {
  const pool = getPool();
  const result = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = $1 AND column_name = $2
  `, [table, column]);
  return result.rows.length > 0;
}

module.exports = { up };
