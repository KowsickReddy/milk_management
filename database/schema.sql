-- ═══════════════════════════════════════════════════════════════════════════
-- Dairy Management ERP — PostgreSQL Schema
-- ═══════════════════════════════════════════════════════════════════════════
-- Run: psql -U postgres -d milk_management_db -f schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Trigger function for ON UPDATE CURRENT_TIMESTAMP ─────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Customers ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
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
);

DROP TRIGGER IF EXISTS set_updated_at_customers ON customers;
CREATE TRIGGER set_updated_at_customers
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Complaints ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subject VARCHAR(255),
  message TEXT,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Deliveries ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS deliveries (
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
);

DROP TRIGGER IF EXISTS set_updated_at_deliveries ON deliveries;
CREATE TRIGGER set_updated_at_deliveries
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Bills ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
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
);

DROP TRIGGER IF EXISTS set_updated_at_bills ON bills;
CREATE TRIGGER set_updated_at_bills
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Payments ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
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
);

-- ── Credits ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credits (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  credit_amount NUMERIC(10,2) NOT NULL,
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMP NULL,
  applied_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Long Leaves ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS long_leaves (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS set_updated_at_long_leaves ON long_leaves;
CREATE TRIGGER set_updated_at_long_leaves
  BEFORE UPDATE ON long_leaves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Leave Requests ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Extra Milk ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS extra_milk (
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
);

-- ── Expenses ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  category VARCHAR(255) NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS set_updated_at_expenses ON expenses;
CREATE TRIGGER set_updated_at_expenses
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ── Users ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  pin VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'worker',
  full_name VARCHAR(255),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Milk Price History ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milk_price_history (
  id SERIAL PRIMARY KEY,
  rate_per_liter NUMERIC(10,2) NOT NULL,
  effective_date DATE NOT NULL,
  reason TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Alerts ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  alert_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Login Logs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  user_type VARCHAR(20) NOT NULL,
  user_id INTEGER,
  username VARCHAR(255),
  ip_address VARCHAR(45),
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Cattle ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cattle (
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
);

-- ── Feed Purchases ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_purchases (
  id SERIAL PRIMARY KEY,
  purchase_date DATE NOT NULL,
  feed_type VARCHAR(100) DEFAULT 'General',
  bags_bought NUMERIC(10,2) DEFAULT 0,
  cost_per_bag NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── WebAuthn Credentials ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webauthn_credentials (
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
);

-- ── Seed: Default Admin ──────────────────────────────────────────────────
-- Password: 1234 (bcrypt hashed)
-- Run separately: INSERT INTO users (username, pin, role, full_name)
--   VALUES ('admin', '$2a$10$...', 'admin', 'System Administrator');
