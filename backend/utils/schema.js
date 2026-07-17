// ── Schema Creation Utility (PostgreSQL) ─────────────────────────────────
// Creates all database tables if they don't exist
// PostgreSQL equivalent of MySQL schema

const { getPool, createUpdateTriggerFunction, applyUpdatedAtTrigger } = require('../config/database');

async function createTables() {
  // First, create the trigger function for ON UPDATE CURRENT_TIMESTAMP
  await createUpdateTriggerFunction();

  const tables = [
    `CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) UNIQUE,
      pin VARCHAR(255) NULL,
      address TEXT,
      daily_milk_quantity NUMERIC(10,2) DEFAULT 0,
      milk_rate_per_liter NUMERIC(10,2) DEFAULT 0,
      default_milk_quantity NUMERIC(10,2) DEFAULT 0,
      shift VARCHAR(20) DEFAULT 'morning',
      status VARCHAR(20) DEFAULT 'active',
      customer_type VARCHAR(20) DEFAULT 'regular',
      route_area VARCHAR(100) DEFAULT 'Default',
      credit_balance NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      periods TEXT,
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
      user_id INTEGER,
      username VARCHAR(255),
      ip_address VARCHAR(45),
      login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS complaints (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      subject VARCHAR(255),
      message TEXT,
      status VARCHAR(20) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS cattle (
      id SERIAL PRIMARY KEY,
      tag_number VARCHAR(50) NOT NULL UNIQUE,
      breed VARCHAR(100) DEFAULT 'Unknown',
      entry_date DATE,
      acquisition_cost NUMERIC(10,2) DEFAULT 0,
      transport_cost NUMERIC(10,2) DEFAULT 0,
      status VARCHAR(30) DEFAULT 'milking',
      is_in_calf BOOLEAN DEFAULT FALSE,
      gestation_start_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS feed_purchases (
      id SERIAL PRIMARY KEY,
      purchase_date DATE NOT NULL,
      feed_type VARCHAR(100) DEFAULT 'General',
      bags_bought NUMERIC(10,2) DEFAULT 0,
      cost_per_bag NUMERIC(10,2) DEFAULT 0,
      total_cost NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS webauthn_credentials (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      user_type VARCHAR(20) NOT NULL DEFAULT 'admin',
      credential_id TEXT NOT NULL,
      public_key TEXT NOT NULL,
      counter BIGINT DEFAULT 0,
      transports TEXT,
      device_name VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_used_at TIMESTAMP NULL
    )`,
  ];

  for (const query of tables) {
    await getPool().query(query);
  }

  // Apply ON UPDATE CURRENT_TIMESTAMP triggers for tables with updated_at
  const tablesWithUpdatedAt = ['customers', 'deliveries', 'bills', 'long_leaves', 'expenses'];
  for (const table of tablesWithUpdatedAt) {
    await applyUpdatedAtTrigger(table);
  }

  console.log('✓ Database tables verified/created successfully (PostgreSQL)');
}

module.exports = { createTables };
