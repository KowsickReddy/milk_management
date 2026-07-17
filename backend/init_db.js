// ── Database Initialization Script (PostgreSQL) ──────────────────────────
// Run directly: node init_db.js
// Creates all tables and seeds the default admin

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = (() => {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl: false };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'milk_management_db',
  };
})();

const pool = new Pool(dbConfig);

async function createTables() {
  console.log('Connecting to database...');

  const tables = [
    `CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) UNIQUE,
      address TEXT,
      daily_milk_quantity NUMERIC(10,2) DEFAULT 0,
      milk_rate_per_liter NUMERIC(10,2) DEFAULT 0,
      default_milk_quantity NUMERIC(10,2) DEFAULT 0,
      shift VARCHAR(20) DEFAULT 'morning',
      status VARCHAR(20) DEFAULT 'active',
      customer_type VARCHAR(20) DEFAULT 'regular',
      route_area VARCHAR(100) DEFAULT 'Default',
      credit_balance NUMERIC(10,2) DEFAULT 0,
      pin VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS complaints (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      subject VARCHAR(255),
      message TEXT,
      status VARCHAR(20) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS deliveries (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      customer_name VARCHAR(255),
      date DATE NOT NULL,
      session VARCHAR(20) DEFAULT 'morning',
      scheduled_quantity NUMERIC(10,2) DEFAULT 0,
      delivered_quantity NUMERIC(10,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'delivered' CHECK (status IN ('delivered','leave','extra')),
      extra_milk NUMERIC(10,2) DEFAULT 0,
      quantity_overridden BOOLEAN DEFAULT FALSE,
      delivery_shift VARCHAR(20),
      is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (customer_id, date, delivery_shift)
    )`,
    `CREATE TABLE IF NOT EXISTS bills (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      customer_name VARCHAR(255),
      bill_month INTEGER NOT NULL,
      bill_year INTEGER NOT NULL,
      bill_start_date DATE,
      bill_end_date DATE,
      total_quantity NUMERIC(10,2) DEFAULT 0,
      gross_amount NUMERIC(10,2) DEFAULT 0,
      final_amount NUMERIC(10,2) DEFAULT 0,
      leave_days INTEGER DEFAULT 0,
      extra_days INTEGER DEFAULT 0,
      total_extra_milk NUMERIC(10,2) DEFAULT 0,
      total_amount NUMERIC(10,2) DEFAULT 0,
      sent_to_customer BOOLEAN DEFAULT FALSE,
      paid BOOLEAN DEFAULT FALSE,
      amount_paid NUMERIC(10,2) DEFAULT 0,
      balance NUMERIC(10,2) DEFAULT 0,
      outstanding_balance NUMERIC(10,2) DEFAULT 0,
      bill_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      payment_date DATE,
      last_payment_change NUMERIC(10,2) DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      bill_id INTEGER REFERENCES bills(id) ON DELETE SET NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      amount_paid NUMERIC(10,2) NOT NULL,
      change_given NUMERIC(10,2) DEFAULT 0,
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      payment_method VARCHAR(20) DEFAULT 'cash',
      is_partial BOOLEAN DEFAULT FALSE,
      is_full_with_change BOOLEAN DEFAULT FALSE,
      change_amount NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS credits (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      credit_amount NUMERIC(10,2) NOT NULL,
      applied BOOLEAN DEFAULT FALSE,
      applied_at TIMESTAMP NULL,
      applied_amount NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS long_leaves (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      customer_name VARCHAR(255),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS leave_requests (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS extra_milk (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      customer_name VARCHAR(255),
      date DATE NOT NULL,
      extra_quantity NUMERIC(10,2) DEFAULT 0,
      type VARCHAR(20) DEFAULT 'single_day',
      start_date DATE,
      end_date DATE,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      category VARCHAR(255) NOT NULL,
      amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      description TEXT,
      expense_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      pin VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'worker',
      full_name VARCHAR(255),
      phone VARCHAR(20),
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS milk_price_history (
      id SERIAL PRIMARY KEY,
      rate_per_liter NUMERIC(10,2) NOT NULL,
      effective_date DATE NOT NULL,
      reason TEXT,
      created_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      alert_type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS login_logs (
      id SERIAL PRIMARY KEY,
      user_type VARCHAR(20) NOT NULL,
      user_id INTEGER NOT NULL,
      username VARCHAR(255) NOT NULL,
      login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45)
    )`,
    `CREATE TABLE IF NOT EXISTS cattle (
      id SERIAL PRIMARY KEY,
      tag_number VARCHAR(50) NOT NULL UNIQUE,
      breed VARCHAR(100),
      entry_date DATE NULL,
      acquisition_cost NUMERIC(12,2) DEFAULT 0,
      transport_cost NUMERIC(10,2) DEFAULT 0,
      status VARCHAR(30) DEFAULT 'milking',
      is_in_calf BOOLEAN DEFAULT FALSE,
      gestation_start_date DATE NULL,
      last_calving_date DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS feed_purchases (
      id SERIAL PRIMARY KEY,
      purchase_date DATE NOT NULL,
      feed_type VARCHAR(100) NOT NULL,
      bags_bought INTEGER NOT NULL,
      cost_per_bag NUMERIC(10,2) NOT NULL,
      total_cost NUMERIC(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  try {
    for (const query of tables) {
      await pool.query(query);
    }
    console.log('Tables created successfully');

    // Create default admin (pg returns { rows }, not array)
    const admins = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (admins.rows.length === 0) {
      const hashedPin = await bcrypt.hash('1234', 10);
      await pool.query(
        'INSERT INTO users (username, pin, role, full_name) VALUES ($1, $2, $3, $4)',
        ['admin', hashedPin, 'admin', 'System Administrator']
      );
      console.log('Default admin created');
    }
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

createTables();
