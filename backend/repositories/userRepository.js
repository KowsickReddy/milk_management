// ── User Repository (PostgreSQL) ──────────────────────────────────────────
// All staff user-related database queries

const { getPool } = require('../config/database');

const UserRepository = {
  async findAll() {
    const result = await getPool().query(
      'SELECT id, username, role, full_name, phone, is_active, last_login, created_at FROM users ORDER BY username ASC'
    );
    return result.rows;
  },

  async findByUsername(username) {
    const result = await getPool().query(
      'SELECT id, username, pin, role, full_name, phone, is_active FROM users WHERE username = $1 AND is_active = TRUE',
      [username]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await getPool().query('SELECT id, username, role, full_name, phone, is_active FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { username, hashedPin, role, full_name, phone, is_active } = data;
    const result = await getPool().query(
      'INSERT INTO users (username, pin, role, full_name, phone, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, role, full_name, phone, is_active',
      [username, hashedPin, role || 'worker', full_name, phone || null, is_active !== undefined ? is_active : true]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const updates = [];
    const params = [];
    let idx = 1;

    if (data.username !== undefined) { updates.push(`username = $${idx}`); params.push(data.username); idx++; }
    if (data.hashedPin !== undefined) { updates.push(`pin = $${idx}`); params.push(data.hashedPin); idx++; }
    if (data.role !== undefined) { updates.push(`role = $${idx}`); params.push(data.role); idx++; }
    if (data.full_name !== undefined) { updates.push(`full_name = $${idx}`); params.push(data.full_name); idx++; }
    if (data.phone !== undefined) { updates.push(`phone = $${idx}`); params.push(data.phone || null); idx++; }
    if (data.is_active !== undefined) { updates.push(`is_active = $${idx}`); params.push(data.is_active); idx++; }

    if (updates.length === 0) return null;

    params.push(id);
    const result = await getPool().query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
      params
    );
    if (result.rowCount === 0) return null;
    return this.findById(id);
  },

  async delete(id) {
    const result = await getPool().query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async updateLastLogin(id) {
    await getPool().query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  },

  async findAdmin(username) {
    const result = await getPool().query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  },
};

module.exports = UserRepository;
