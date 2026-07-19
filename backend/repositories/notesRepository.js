// ── Notes Repository (PostgreSQL) ─────────────────────────────────────────
// Admin notes / notepad database queries

const { getPool } = require('../config/database');

const NotesRepository = {
  async findAll() {
    const result = await getPool().query(`
      SELECT n.*, u.full_name AS created_by_name
      FROM admin_notes n
      LEFT JOIN users u ON n.created_by = u.id
      ORDER BY n.updated_at DESC
    `);
    return result.rows;
  },

  async findById(id) {
    const result = await getPool().query(
      'SELECT * FROM admin_notes WHERE id = $1', [id]
    );
    return result.rows[0] || null;
  },

  async create(data, userId) {
    const { note_text, mentioned_customer_ids } = data;
    const result = await getPool().query(
      `INSERT INTO admin_notes (note_text, mentioned_customer_ids, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [note_text, mentioned_customer_ids || [], userId]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const { note_text, mentioned_customer_ids } = data;
    const result = await getPool().query(
      `UPDATE admin_notes SET note_text = $1, mentioned_customer_ids = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [note_text, mentioned_customer_ids || [], id]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await getPool().query('DELETE FROM admin_notes WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
};

module.exports = NotesRepository;
