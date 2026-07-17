// ── Cattle Repository (PostgreSQL) ────────────────────────────────────────
// All cattle management DB queries

const { getPool } = require('../config/database');

const CattleRepository = {
  async findAll() {
    const result = await getPool().query(
      'SELECT *, (gestation_start_date + INTERVAL \'10 MONTH\') as expected_calving_date FROM cattle ORDER BY entry_date DESC, created_at DESC'
    );
    return result.rows;
  },

  async create(data) {
    const { tag_number, breed, entry_date, acquisition_cost, transport_cost, status, is_in_calf, gestation_start_date } = data;
    const result = await getPool().query(
      `INSERT INTO cattle (tag_number, breed, entry_date, acquisition_cost, transport_cost, status, is_in_calf, gestation_start_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        tag_number, breed || 'Unknown',
        entry_date || new Date().toISOString().split('T')[0],
        Number(acquisition_cost) || 0, Number(transport_cost) || 0,
        status || 'milking', !!is_in_calf,
        (is_in_calf && gestation_start_date) ? gestation_start_date : null,
      ]
    );
    return { id: result.rows[0].id, ...data };
  },

  async update(id, data) {
    const { tag_number, breed, entry_date, acquisition_cost, transport_cost, status, is_in_calf, gestation_start_date } = data;
    await getPool().query(
      'UPDATE cattle SET tag_number=$1, breed=$2, entry_date=$3, acquisition_cost=$4, transport_cost=$5, status=$6, is_in_calf=$7, gestation_start_date=$8 WHERE id=$9',
      [tag_number, breed, entry_date, Number(acquisition_cost) || 0, Number(transport_cost) || 0, status, !!is_in_calf, (is_in_calf && gestation_start_date) ? gestation_start_date : null, id]
    );
    return true;
  },

  async delete(id) {
    await getPool().query('DELETE FROM cattle WHERE id = $1', [id]);
    return true;
  },

  async getStats() {
    const result = await getPool().query('SELECT COUNT(*)::int as total_cattle, SUM(acquisition_cost + transport_cost) as total_investment FROM cattle');
    return {
      total_cattle: result.rows[0].total_cattle || 0,
      total_investment: result.rows[0].total_investment || 0,
    };
  },

  async getUpcomingCalving() {
    const result = await getPool().query(
      `SELECT *, (gestation_start_date + INTERVAL '10 MONTH') as expected_calving_date
       FROM cattle
       WHERE is_in_calf = TRUE
         AND (gestation_start_date + INTERVAL '10 MONTH') BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 DAY')`
    );
    return result.rows;
  },
};

module.exports = CattleRepository;
