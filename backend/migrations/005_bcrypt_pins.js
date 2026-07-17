// ── Migration 005: Bcrypt Pins (PostgreSQL) ──────────────────────────────
// Expand pin columns to VARCHAR(255) and hash existing plaintext PINs

const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');

async function up(repo) {
  // Expand customer pin column
  const custLen = await repo.getColumnLength('customers', 'pin');
  if (custLen > 0 && custLen < 255) {
    await getPool().query('ALTER TABLE customers ALTER COLUMN pin TYPE VARCHAR(255)');
  }

  // Expand user pin column
  const userLen = await repo.getColumnLength('users', 'pin');
  if (userLen < 255) {
    await getPool().query('ALTER TABLE users ALTER COLUMN pin TYPE VARCHAR(255), ALTER COLUMN pin SET NOT NULL');
  }

  // Hash existing plaintext PINs (length < 60 = not bcrypt)
  const { rows: plainUsers } = await getPool().query(
    'SELECT id, pin FROM users WHERE LENGTH(pin) < 60 AND pin IS NOT NULL'
  );
  for (const u of plainUsers) {
    const hashed = await bcrypt.hash(u.pin, 10);
    await getPool().query('UPDATE users SET pin = $1 WHERE id = $2', [hashed, u.id]);
  }

  const { rows: plainCustomers } = await getPool().query(
    'SELECT id, pin FROM customers WHERE LENGTH(pin) < 60 AND pin IS NOT NULL'
  );
  for (const c of plainCustomers) {
    const hashed = await bcrypt.hash(c.pin, 10);
    await getPool().query('UPDATE customers SET pin = $1 WHERE id = $2', [hashed, c.id]);
  }

  console.log('✓ Migration 005: Plaintext PINs hashed with bcrypt');
}

module.exports = { up };
