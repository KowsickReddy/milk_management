// ── Customer Repository (PostgreSQL) ──────────────────────────────────────
// All customer-related database queries

const { getPool } = require('../config/database');

const SELECT_FIELDS = 'id, name, title, phone, address, daily_milk_quantity, milk_rate_per_liter, default_milk_quantity, evening_milk_quantity, shift, status, customer_type, credit_balance, created_at, route_area, profile_photo';

const CustomerRepository = {
  async findAll() {
    const result = await getPool().query(
      `SELECT ${SELECT_FIELDS} FROM customers ORDER BY id ASC`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await getPool().query(
      `SELECT ${SELECT_FIELDS} FROM customers WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByPhone(phone) {
    const result = await getPool().query(
      'SELECT id, name, phone, pin, status, daily_milk_quantity, evening_milk_quantity, shift, customer_type, credit_balance, profile_photo FROM customers WHERE phone = $1',
      [phone]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const { name, title, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, status, customer_type, credit_balance, route_area, profile_photo, evening_milk_quantity } = data;
    const result = await getPool().query(
      'INSERT INTO customers (name, title, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, status, default_milk_quantity, customer_type, credit_balance, route_area, profile_photo, evening_milk_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *',
      [name, title || null, phone || null, address, daily_milk_quantity || 0, milk_rate_per_liter || 0, shift || 'morning', status || 'active', daily_milk_quantity || 0, customer_type || 'regular', credit_balance || 0, route_area || null, profile_photo || null, evening_milk_quantity || null]
    );
    return { id: result.rows[0].id, ...data };
  },

  async update(id, data) {
    const { name, title, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, status, customer_type, credit_balance, route_area, default_milk_quantity, profile_photo, evening_milk_quantity } = data;
    const result = await getPool().query(
      'UPDATE customers SET name=$1, title=$2, phone=$3, address=$4, daily_milk_quantity=$5, milk_rate_per_liter=$6, shift=$7, status=$8, customer_type=$9, credit_balance=$10, route_area=$11, default_milk_quantity=$12, profile_photo=$13, evening_milk_quantity=$14 WHERE id=$15',
      [name, title || null, phone || null, address, daily_milk_quantity || 0, milk_rate_per_liter || 0, shift || 'morning', status || 'active', customer_type || 'regular', credit_balance || 0, route_area || null, default_milk_quantity || daily_milk_quantity || 0, profile_photo || null, evening_milk_quantity || null, id]
    );
    return result.rowCount > 0;
  },

  async delete(id) {
    const result = await getPool().query('DELETE FROM customers WHERE id = $1', [id]);
    return result.rowCount > 0;
  },

  async updatePin(id, hashedPin) {
    await getPool().query('UPDATE customers SET pin = $1 WHERE id = $2', [hashedPin, id]);
    return true;
  },

  async updateCreditBalance(id, amount, connection) {
    const conn = connection || getPool();
    await conn.query('UPDATE customers SET credit_balance = GREATEST(0, credit_balance + $1) WHERE id = $2', [amount, id]);
    return true;
  },

  async findActiveCustomers() {
    const result = await getPool().query('SELECT id FROM customers WHERE status = $1', ['active']);
    return result.rows;
  },

  async getActiveCount() {
    const result = await getPool().query("SELECT COUNT(*)::int as count FROM customers WHERE status = 'active'");
    return result.rows[0].count;
  },

  async getCustomerWithCredit(id) {
    const result = await getPool().query('SELECT id, name, milk_rate_per_liter, credit_balance, daily_milk_quantity, default_milk_quantity FROM customers WHERE id = $1', [id]);
    return result.rows[0] || null;
  },
};

module.exports = CustomerRepository;
