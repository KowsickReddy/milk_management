const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'milk_management_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
};

async function createTables() {
  const pool = mysql.createPool(dbConfig);
  console.log('Connecting to database...');

  const tables = [
    `CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) UNIQUE,
      address TEXT,
      daily_milk_quantity DECIMAL(10,2) DEFAULT 0,
      milk_rate_per_liter DECIMAL(10,2) DEFAULT 0,
      default_milk_quantity DECIMAL(10,2) DEFAULT 0,
      shift VARCHAR(20) DEFAULT 'morning',
      status VARCHAR(20) DEFAULT 'active',
      customer_type VARCHAR(20) DEFAULT 'regular',
      route_area VARCHAR(100) DEFAULT 'Default',
      credit_balance DECIMAL(10,2) DEFAULT 0,
      pin VARCHAR(10) DEFAULT '1234',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS complaints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      subject VARCHAR(255),
      message TEXT,
      status VARCHAR(20) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS deliveries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      customer_name VARCHAR(255),
      date DATE NOT NULL,
      session VARCHAR(20) DEFAULT 'morning',
      scheduled_quantity DECIMAL(10,2) DEFAULT 0,
      delivered_quantity DECIMAL(10,2) DEFAULT 0,
      status ENUM('delivered','leave','extra') DEFAULT 'delivered',
      extra_milk DECIMAL(10,2) DEFAULT 0,
      quantity_overridden BOOLEAN DEFAULT FALSE,
      delivery_shift VARCHAR(20),
      is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      UNIQUE KEY unique_delivery (customer_id, date, delivery_shift)
    )`,
    `CREATE TABLE IF NOT EXISTS bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      customer_name VARCHAR(255),
      bill_month INT NOT NULL,
      bill_year INT NOT NULL,
      bill_start_date DATE,
      bill_end_date DATE,
      total_quantity DECIMAL(10,2) DEFAULT 0,
      gross_amount DECIMAL(10,2) DEFAULT 0,
      final_amount DECIMAL(10,2) DEFAULT 0,
      leave_days INT DEFAULT 0,
      extra_days INT DEFAULT 0,
      total_extra_milk DECIMAL(10,2) DEFAULT 0,
      total_amount DECIMAL(10,2) DEFAULT 0,
      sent_to_customer BOOLEAN DEFAULT FALSE,
      paid BOOLEAN DEFAULT FALSE,
      amount_paid DECIMAL(10,2) DEFAULT 0,
      balance DECIMAL(10,2) DEFAULT 0,
      outstanding_balance DECIMAL(10,2) DEFAULT 0,
      bill_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      payment_date DATE,
      last_payment_change DECIMAL(10,2) DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id INT,
      customer_id INT NOT NULL,
      amount_paid DECIMAL(10,2) NOT NULL,
      change_given DECIMAL(10,2) DEFAULT 0,
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      payment_method VARCHAR(20) DEFAULT 'cash',
      is_partial BOOLEAN DEFAULT FALSE,
      is_full_with_change BOOLEAN DEFAULT FALSE,
      change_amount DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS credits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      credit_amount DECIMAL(10,2) NOT NULL,
      applied BOOLEAN DEFAULT FALSE,
      applied_at TIMESTAMP NULL,
      applied_amount DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS long_leaves (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      customer_name VARCHAR(255),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS leave_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS extra_milk (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      customer_name VARCHAR(255),
      date DATE NOT NULL,
      extra_quantity DECIMAL(10,2) DEFAULT 0,
      type VARCHAR(20) DEFAULT 'single_day',
      start_date DATE,
      end_date DATE,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      description TEXT,
      expense_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      pin VARCHAR(10) NOT NULL,
      role VARCHAR(20) DEFAULT 'worker',
      full_name VARCHAR(255),
      phone VARCHAR(20),
      is_active BOOLEAN DEFAULT TRUE,
      last_login TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS milk_price_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      rate_per_liter DECIMAL(10,2) NOT NULL,
      effective_date DATE NOT NULL,
      reason TEXT,
      created_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      alert_type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS login_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_type VARCHAR(20) NOT NULL,
      user_id INT NOT NULL,
      username VARCHAR(255) NOT NULL,
      login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45)
    )`,
    `CREATE TABLE IF NOT EXISTS cattle (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tag_number VARCHAR(50) NOT NULL UNIQUE,
      breed VARCHAR(100),
      entry_date DATE NULL,
      acquisition_cost DECIMAL(12,2) DEFAULT 0,
      transport_cost DECIMAL(10,2) DEFAULT 0,
      status ENUM('milking', 'dry', 'heifer', 'calf') DEFAULT 'milking',
      is_in_calf BOOLEAN DEFAULT FALSE,
      gestation_start_date DATE NULL,
      last_calving_date DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS feed_purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      purchase_date DATE NOT NULL,
      feed_type VARCHAR(100) NOT NULL,
      bags_bought INT NOT NULL,
      cost_per_bag DECIMAL(10,2) NOT NULL,
      total_cost DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  try {
    for (const query of tables) {
      await pool.execute(query);
    }
    console.log('Tables created successfully');
    
    // Create default admin
    const [admins] = await pool.query('SELECT * FROM users WHERE username = ?', ['admin']);
    if (admins.length === 0) {
      await pool.query(
        'INSERT INTO users (username, pin, role, full_name) VALUES (?, ?, ?, ?)',
        ['admin', '1234', 'admin', 'System Administrator']
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
