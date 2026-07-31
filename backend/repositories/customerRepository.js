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
    
    // Build query dynamically to ensure exact column count match
    const colNames = [];
    const vals = [];
    const placeholders = [];
    let idx = 1;
    
    const add = (col, val) => { colNames.push(col); vals.push(val); placeholders.push(`$${idx++}`); };
    
    add('name', name);
    if (title) add('title', title);
    add('phone', phone || null);
    add('address', address || '');
    add('daily_milk_quantity', Number(daily_milk_quantity || 0));
    add('milk_rate_per_liter', Number(milk_rate_per_liter || 0));
    add('shift', shift || 'morning');
    add('status', status || 'active');
    add('default_milk_quantity', Number(daily_milk_quantity || 0));
    add('customer_type', customer_type || 'regular');
    add('credit_balance', Number(credit_balance || 0));
    add('route_area', route_area || 'Default');
    if (profile_photo) add('profile_photo', profile_photo);
    add('evening_milk_quantity', evening_milk_quantity || null);
    
    const pool = getPool();
    const text = `INSERT INTO customers (${colNames.join(', ')})
       VALUES (${placeholders.join(', ')})
       RETURNING *`;
    
    const result = await pool.query({ text, values: vals });
    return result.rows[0] || { id: result.rows[0]?.id, ...data };
  },

  async update(id, data) {
    const { name, title, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, status, customer_type, credit_balance, route_area, default_milk_quantity, profile_photo, evening_milk_quantity } = data;
    const result = await getPool().query(
      'UPDATE customers SET name=$1, title=$2, phone=$3, address=$4, daily_milk_quantity=$5, milk_rate_per_liter=$6, shift=$7, status=$8, customer_type=$9, credit_balance=$10, route_area=$11, default_milk_quantity=$12, profile_photo=$13, evening_milk_quantity=$14 WHERE id=$15 RETURNING *',
      [name, title || null, phone || null, address, daily_milk_quantity || 0, milk_rate_per_liter || 0, shift || 'morning', status || 'active', customer_type || 'regular', credit_balance || 0, route_area || null, default_milk_quantity || daily_milk_quantity || 0, profile_photo || null, evening_milk_quantity || null, id]
    );
    return result.rows[0] || null;
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
