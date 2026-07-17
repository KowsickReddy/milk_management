// ── Admin Seed (PostgreSQL) ───────────────────────────────────────────────
// Creates the default admin user if it doesn't exist

const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');

async function seedAdmin() {
  const admins = await getPool().query('SELECT * FROM users WHERE username = $1', ['admin']);
  if (admins.rows.length === 0) {
    const hashedPin = await bcrypt.hash('1234', 10);
    await getPool().query(
      'INSERT INTO users (username, pin, role, full_name) VALUES ($1, $2, $3, $4)',
      ['admin', hashedPin, 'admin', 'System Administrator']
    );
    console.log('✓ Default admin user created (username: admin, PIN: 1234)');
  } else {
    console.log('✓ Default admin user already exists');
  }
}

module.exports = { seedAdmin };
