// ── WebAuthn Repository (PostgreSQL) ──────────────────────────────────────
// WebAuthn credential database queries

const { getPool } = require('../config/database');

const WebAuthnRepository = {
  async findByUserId(userId, userType = 'admin') {
    const result = await getPool().query(
      'SELECT credential_id, public_key, counter, transports FROM webauthn_credentials WHERE user_id = $1 AND user_type = $2',
      [userId, userType]
    );
    return result.rows;
  },

  async getCredentials(userId, userType = 'admin') {
    const result = await getPool().query(
      `SELECT id, device_name, created_at, last_used_at FROM webauthn_credentials
       WHERE user_id = $1 AND user_type = $2 ORDER BY created_at DESC`,
      [userId, userType]
    );
    return result.rows;
  },

  async create(data) {
    const { userId, userType, credentialId, publicKey, counter, transports, deviceName } = data;
    await getPool().query(
      'INSERT INTO webauthn_credentials (user_id, user_type, credential_id, public_key, counter, transports, device_name) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, userType || 'admin', credentialId, publicKey, counter, transports, deviceName || 'Unknown Device']
    );
  },

  async updateCounterAndLastUsed(id, counter) {
    await getPool().query(
      'UPDATE webauthn_credentials SET counter = $1, last_used_at = CURRENT_TIMESTAMP WHERE id = $2',
      [counter, id]
    );
  },

  async delete(id) {
    await getPool().query('DELETE FROM webauthn_credentials WHERE id = $1', [id]);
  },
};

module.exports = WebAuthnRepository;
