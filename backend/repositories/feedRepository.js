// ── Feed Repository (PostgreSQL) ──────────────────────────────────────────
// All feed purchase DB queries

const { getPool } = require('../config/database');

const FeedRepository = {
  async findAll() {
    const result = await getPool().query('SELECT * FROM feed_purchases ORDER BY purchase_date DESC');
    return result.rows;
  },

  async create(data) {
    const { purchase_date, feed_type, bags_bought, cost_per_bag } = data;
    const qty = Number(bags_bought) || 0;
    const rate = Number(cost_per_bag) || 0;
    const total_cost = qty * rate;
    const result = await getPool().query(
      'INSERT INTO feed_purchases (purchase_date, feed_type, bags_bought, cost_per_bag, total_cost) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [purchase_date || new Date().toISOString().split('T')[0], feed_type || 'General', qty, rate, total_cost]
    );
    return { id: result.rows[0].id, ...data, total_cost };
  },

  async delete(id) {
    const result = await getPool().query('DELETE FROM feed_purchases WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async getStats() {
    const result = await getPool().query('SELECT SUM(bags_bought) as total_bags, SUM(total_cost) as total_feed_cost FROM feed_purchases');
    return {
      total_bags: Number(result.rows[0].total_bags || 0),
      total_feed_cost: Number(result.rows[0].total_feed_cost || 0),
    };
  },
};

module.exports = FeedRepository;
