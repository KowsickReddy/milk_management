const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Database configuration
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

// Create pool
let pool;

// Initialize database connection
async function initDB() {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    
    // Create tables if not exist
    await createTables();
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.log('Note: Make sure MySQL is running and database exists');
  }
}

// Create tables
async function createTables() {
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
      credit_balance DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
      end_date DATE NOT NULL,
      reason VARCHAR(255),
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
    )`
  ];

  for (const query of tables) {
    await pool.execute(query);
  }

  await migrateDeliverySchema();
  await migrateBillingWalletSchema();
  
  // Create default admin if not exists
  const [admins] = await pool.query('SELECT * FROM users WHERE username = ?', ['admin']);
  if (admins.length === 0) {
    await pool.query(
      'INSERT INTO users (username, pin, role, full_name) VALUES (?, ?, ?, ?)',
      ['admin', '1234', 'admin', 'System Administrator']
    );
  }

  console.log('Database tables verified/created successfully');
}

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].count > 0;
}

async function migrateDeliverySchema() {
  const hasStatus = await columnExists('deliveries', 'status');
  const hasIsDeleted = await columnExists('deliveries', 'is_deleted');
  const hasDelivered = await columnExists('deliveries', 'delivered');
  const hasLeave = await columnExists('deliveries', 'leave');

  if (!hasStatus) {
    await pool.query(
      "ALTER TABLE deliveries ADD COLUMN status ENUM('delivered','leave','extra') DEFAULT 'delivered' AFTER delivered_quantity"
    );
  }

  if (!hasIsDeleted) {
    await pool.query(
      'ALTER TABLE deliveries ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE AFTER delivery_shift'
    );
  }

  if (hasDelivered || hasLeave) {
    await pool.query(
      `UPDATE deliveries
       SET status = CASE
         WHEN ${hasLeave ? '`leave` = TRUE' : 'FALSE'} THEN 'leave'
         WHEN COALESCE(extra_milk, 0) > 0 THEN 'extra'
         ELSE 'delivered'
       END
       WHERE status IS NULL OR status = 'delivered'`
    );

    if (hasDelivered) {
      await pool.query('ALTER TABLE deliveries DROP COLUMN delivered');
    }

    if (hasLeave) {
      await pool.query('ALTER TABLE deliveries DROP COLUMN `leave`');
    }
  }
}

async function migrateBillingWalletSchema() {
  const hasCreditBalance = await columnExists('customers', 'credit_balance');
  if (!hasCreditBalance) {
    await pool.query('ALTER TABLE customers ADD COLUMN credit_balance DECIMAL(10,2) DEFAULT 0 AFTER customer_type');
  }

  const billColumns = [
    ['gross_amount', 'ALTER TABLE bills ADD COLUMN gross_amount DECIMAL(10,2) DEFAULT 0 AFTER total_quantity'],
    ['final_amount', 'ALTER TABLE bills ADD COLUMN final_amount DECIMAL(10,2) DEFAULT 0 AFTER gross_amount'],
    ['leave_days', 'ALTER TABLE bills ADD COLUMN leave_days INT DEFAULT 0 AFTER final_amount'],
    ['extra_days', 'ALTER TABLE bills ADD COLUMN extra_days INT DEFAULT 0 AFTER leave_days'],
    ['total_extra_milk', 'ALTER TABLE bills ADD COLUMN total_extra_milk DECIMAL(10,2) DEFAULT 0 AFTER extra_days'],
  ];

  for (const [column, query] of billColumns) {
    const exists = await columnExists('bills', column);
    if (!exists) await pool.query(query);
  }

  await pool.query(`
    ALTER TABLE bills
      MODIFY total_amount DECIMAL(10,2) DEFAULT 0,
      MODIFY final_amount DECIMAL(10,2) DEFAULT 0,
      MODIFY total_quantity DECIMAL(10,2) DEFAULT 0,
      MODIFY amount_paid DECIMAL(10,2) DEFAULT 0,
      MODIFY balance DECIMAL(10,2) DEFAULT 0
  `);
}

async function getDeliveriesWithLeaveOverlay({ date, customerId }) {
  const params = [];
  let query = `
    SELECT d.*,
      (d.status IN ('delivered', 'extra')) AS delivered,
      (d.status = 'leave') AS \`leave\`,
      NULL AS leave_request_id,
      'delivery' AS source
    FROM deliveries d
    WHERE d.is_deleted = FALSE
      AND NOT EXISTS (
        SELECT 1 FROM leave_requests lr
        WHERE lr.customer_id = d.customer_id
          AND d.date BETWEEN lr.start_date AND lr.end_date
      )`;

  if (date) {
    query += ' AND d.date = ?';
    params.push(date);
  }

  if (customerId) {
    query += ' AND d.customer_id = ?';
    params.push(customerId);
  }

  if (date) {
    query += `
      UNION ALL
      SELECT
        CONCAT('leave-', lr.id, '-', c.id) AS id,
        c.id AS customer_id,
        c.name AS customer_name,
        ? AS date,
        c.shift AS session,
        COALESCE(c.default_milk_quantity, c.daily_milk_quantity, 0) AS scheduled_quantity,
        0 AS delivered_quantity,
        'leave' AS status,
        0 AS extra_milk,
        FALSE AS quantity_overridden,
        c.shift AS delivery_shift,
        FALSE AS is_deleted,
        lr.created_at AS created_at,
        lr.created_at AS updated_at,
        FALSE AS delivered,
        TRUE AS \`leave\`,
        lr.id AS leave_request_id,
        'leave_request' AS source
      FROM leave_requests lr
      JOIN customers c ON c.id = lr.customer_id
      WHERE ? BETWEEN lr.start_date AND lr.end_date
        AND c.status = 'active'`;
    params.push(date, date);

    if (customerId) {
      query += ' AND c.id = ?';
      params.push(customerId);
    }
  }

  query += ' ORDER BY date DESC, created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth
app.post('/api/users/login', async (req, res) => {
  try {
    const { username, pin } = req.body;
    const [rows] = await pool.query(
      'SELECT id, username, role, full_name, phone, is_active FROM users WHERE username = ? AND pin = ? AND is_active = TRUE',
      [username, pin]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customers
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, status, customer_type, credit_balance } = req.body;
    const [result] = await pool.query(
      'INSERT INTO customers (name, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, status, default_milk_quantity, customer_type, credit_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, status || 'active', daily_milk_quantity, customer_type || 'regular', credit_balance || 0]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, status, customer_type, credit_balance } = req.body;
    await pool.query(
      'UPDATE customers SET name=?, phone=?, address=?, daily_milk_quantity=?, milk_rate_per_liter=?, shift=?, status=?, customer_type=?, credit_balance=? WHERE id=?',
      [name, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, status, customer_type, credit_balance, req.params.id]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deliveries
app.get('/api/deliveries', async (req, res) => {
  try {
    const { date, customerId } = req.query;
    const rows = await getDeliveriesWithLeaveOverlay({ date, customerId });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leave', async (req, res) => {
  try {
    const { customerId } = req.query;
    const params = [];
    let query = `
      SELECT lr.*, c.name AS customer_name
      FROM leave_requests lr
      JOIN customers c ON c.id = lr.customer_id
      WHERE 1=1`;

    if (customerId) {
      query += ' AND lr.customer_id = ?';
      params.push(customerId);
    }

    query += ' ORDER BY lr.start_date DESC, lr.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/leave', async (req, res) => {
  try {
    const { customer_id, start_date, end_date, reason } = req.body;
    if (!customer_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'customer_id, start_date, and end_date are required' });
    }
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'start_date cannot be after end_date' });
    }

    const [customers] = await pool.query('SELECT id, name FROM customers WHERE id = ?', [customer_id]);
    if (customers.length === 0) return res.status(404).json({ error: 'Customer not found' });

    const [result] = await pool.query(
      'INSERT INTO leave_requests (customer_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)',
      [customer_id, start_date, end_date, reason || null]
    );

    res.status(201).json({
      id: result.insertId,
      customer_id,
      customer_name: customers[0].name,
      start_date,
      end_date,
      reason: reason || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/leave/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM leave_requests WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Leave request not found' });
    res.json({ success: true, message: 'Leave request deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/deliveries', async (req, res) => {
  try {
    const {
      customer_id,
      customer_name,
      date,
      scheduled_quantity,
      delivered_quantity,
      delivered,
      leave,
      extra_milk,
      delivery_shift,
    } = req.body;

    if (!customer_id || !date) {
      return res.status(400).json({ error: 'customer_id and date are required' });
    }

    if (delivered && leave) {
      return res.status(400).json({ error: 'Delivery cannot be both delivered and leave' });
    }

    const baseQuantity = Number(delivered_quantity || 0);
    const extraQuantity = Number(extra_milk || 0);
    if (baseQuantity < 0 || extraQuantity < 0) {
      return res.status(400).json({ error: 'Quantities cannot be negative' });
    }

    const status = leave ? 'leave' : extraQuantity > 0 ? 'extra' : 'delivered';

    const [leaveRows] = await pool.query(
      'SELECT id FROM leave_requests WHERE customer_id = ? AND ? BETWEEN start_date AND end_date LIMIT 1',
      [customer_id, date]
    );
    if (leaveRows.length > 0 && status !== 'leave') {
      return res.status(400).json({ error: 'Customer is on long leave for this date' });
    }

    const [result] = await pool.query(
      `INSERT INTO deliveries
       (customer_id, customer_name, date, scheduled_quantity, delivered_quantity, status, extra_milk, delivery_shift, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)
       ON DUPLICATE KEY UPDATE 
       customer_name = VALUES(customer_name),
       scheduled_quantity = VALUES(scheduled_quantity),
       delivered_quantity = VALUES(delivered_quantity),
       status = VALUES(status),
       extra_milk = VALUES(extra_milk),
       is_deleted = FALSE`,
      [
        customer_id,
        customer_name,
        date,
        scheduled_quantity || 0,
        leave ? 0 : baseQuantity,
        status,
        leave ? 0 : extraQuantity,
        delivery_shift || 'morning',
      ]
    );

    const [rows] = await pool.query(
      `SELECT d.*,
        (d.status IN ('delivered', 'extra')) AS delivered,
        (d.status = 'leave') AS \`leave\`
       FROM deliveries d
       WHERE d.customer_id = ? AND d.date = ? AND d.delivery_shift = ?`,
      [customer_id, date, delivery_shift || 'morning']
    );

    res.status(201).json(rows[0] || { id: result.insertId || null, ...req.body, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/deliveries/:id/soft-delete', async (req, res) => {
  try {
    const [result] = await pool.query('UPDATE deliveries SET is_deleted = TRUE WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Delivery not found' });
    res.json({ success: true, message: 'Delivery moved to trash' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bills
app.get('/api/bills', async (req, res) => {
  try {
    const { customerId, paid } = req.query;
    let query = `
      SELECT b.*,
        b.final_amount AS final_amount,
        GREATEST(0, COALESCE(b.gross_amount, b.total_amount) - b.final_amount) AS credit_used,
        COALESCE(b.gross_amount, b.total_amount) AS bill_amount
      FROM bills b
      WHERE 1=1`;
    let params = [];
    if (customerId) {
      query += ' AND b.customer_id = ?';
      params.push(customerId);
    }
    if (paid !== undefined) {
      query += ' AND b.paid = ?';
      params.push(paid === 'true' ? 1 : 0);
    }
    query += ' ORDER BY b.bill_year DESC, b.bill_month DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bills', async (req, res) => {
  try {
    const { customer_id, customer_name, bill_month, bill_year, total_quantity, total_amount, bill_start_date, bill_end_date } = req.body;
    const [result] = await pool.query(
      'INSERT INTO bills (customer_id, customer_name, bill_month, bill_year, total_quantity, total_amount, balance, bill_start_date, bill_end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_id, customer_name, bill_month, bill_year, total_quantity, total_amount, total_amount, bill_start_date, bill_end_date]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bills/generate', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { customer_id, month, year } = req.body;
    const billMonth = Number(month);
    const billYear = Number(year);

    if (!customer_id || !billMonth || !billYear || billMonth < 1 || billMonth > 12) {
      await connection.rollback();
      return res.status(400).json({ error: 'customer_id, valid month, and year are required' });
    }

    const startDate = `${billYear}-${String(billMonth).padStart(2, '0')}-01`;
    const endDate = new Date(billYear, billMonth, 0).toISOString().split('T')[0];

    const [customers] = await connection.query(
      'SELECT id, name, milk_rate_per_liter, credit_balance FROM customers WHERE id = ?',
      [customer_id]
    );
    if (customers.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customer = customers[0];
    const [totals] = await connection.query(
      `SELECT
        COALESCE(SUM(d.delivered_quantity), 0) AS total_delivered,
        COALESCE(SUM(d.extra_milk), 0) AS total_extra,
        COUNT(DISTINCT CASE WHEN d.extra_milk > 0 THEN d.date END) AS extra_days,
        COUNT(DISTINCT d.date) AS delivery_days
       FROM deliveries d
       WHERE d.customer_id = ?
         AND d.is_deleted = FALSE
         AND d.status IN ('delivered', 'extra')
         AND d.date BETWEEN ? AND ?
         AND NOT EXISTS (
           SELECT 1 FROM leave_requests lr
           WHERE lr.customer_id = d.customer_id
             AND d.date BETWEEN lr.start_date AND lr.end_date
         )`,
      [customer_id, startDate, endDate]
    );

    const [deliveryLeaveRows] = await connection.query(
      `SELECT COUNT(DISTINCT d.date) AS leave_days
       FROM deliveries d
       WHERE d.customer_id = ?
         AND d.is_deleted = FALSE
         AND d.status = 'leave'
         AND d.date BETWEEN ? AND ?`,
      [customer_id, startDate, endDate]
    );

    const [longLeaveRows] = await connection.query(
      `SELECT COALESCE(SUM(
        DATEDIFF(
          LEAST(end_date, ?),
          GREATEST(start_date, ?)
        ) + 1
      ), 0) AS leave_days
      FROM leave_requests
      WHERE customer_id = ?
        AND start_date <= ?
        AND end_date >= ?`,
      [endDate, startDate, customer_id, endDate, startDate]
    );

    const [existing] = await connection.query(
      'SELECT * FROM bills WHERE customer_id = ? AND bill_month = ? AND bill_year = ? ORDER BY id DESC LIMIT 1',
      [customer_id, billMonth, billYear]
    );

    const totalDelivered = Number(totals[0].total_delivered || 0);
    const totalExtra = Number(totals[0].total_extra || 0);
    const totalQuantity = totalDelivered + totalExtra;
    const billAmount = Number((totalQuantity * Number(customer.milk_rate_per_liter || 0)).toFixed(2));
    const credit = Number(customer.credit_balance || 0);
    const creditUsed = Number(Math.min(credit, billAmount).toFixed(2));
    const finalAmount = Number(Math.max(0, billAmount - creditUsed).toFixed(2));
    const remainingCredit = Number(Math.max(0, credit - creditUsed).toFixed(2));
    const leaveDays = Number(deliveryLeaveRows[0].leave_days || 0) + Number(longLeaveRows[0].leave_days || 0);
    const extraDays = Number(totals[0].extra_days || 0);
    const totalDays = Number(totals[0].delivery_days || 0) + leaveDays;

    await connection.query(
      'UPDATE customers SET credit_balance = ? WHERE id = ?',
      [remainingCredit, customer_id]
    );

    let finalBill;

    if (existing.length > 0) {
      const bill = existing[0];
      const prevAmountPaid = Number(bill.amount_paid || 0);

      // Re-calculate balance on updated total
      const newPaid = finalAmount <= prevAmountPaid ? 1 : 0;
      const newBalance = Number(Math.max(0, finalAmount - prevAmountPaid).toFixed(2));

      await connection.query(
        `UPDATE bills SET
          total_quantity = ?, gross_amount = ?, final_amount = ?, leave_days = ?, extra_days = ?,
          total_extra_milk = ?, total_amount = ?, balance = ?, paid = ?
         WHERE id = ?`,
        [
          totalQuantity, billAmount, finalAmount, leaveDays, extraDays,
          totalExtra, billAmount, newBalance, newPaid, bill.id
        ]
      );
      
      const [updatedRows] = await connection.query('SELECT * FROM bills WHERE id = ?', [bill.id]);
      finalBill = updatedRows[0];
      finalBill.already_exists = true;
    } else {
      const [result] = await connection.query(
        `INSERT INTO bills
         (customer_id, customer_name, bill_month, bill_year, bill_start_date, bill_end_date,
          total_quantity, gross_amount, final_amount, leave_days, extra_days,
          total_extra_milk, total_amount, amount_paid, balance, paid)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [
          customer_id, customer.name, billMonth, billYear, startDate, endDate,
          totalQuantity, billAmount, finalAmount, leaveDays, extraDays,
          totalExtra, billAmount, finalAmount, finalAmount <= 0 ? 1 : 0
        ]
      );
      const [newRows] = await connection.query('SELECT * FROM bills WHERE id = ?', [result.insertId]);
      finalBill = newRows[0];
    }

    await connection.commit();

    res.status(existing.length > 0 ? 200 : 201).json({
      ...finalBill,
      total_quantity: Number(finalBill.total_quantity || 0),
      total_days: totalDays,
      leave_days: Number(finalBill.leave_days || 0),
      extra_days: Number(finalBill.extra_days || 0),
      total_milk: Number(totalDelivered),
      extra_milk: Number(totalExtra),
      bill_amount: Number(finalBill.gross_amount || 0),
      gross_amount: Number(finalBill.gross_amount || 0),
      credit_used: creditUsed,
      remaining_credit: remainingCredit,
      total_amount: Number(finalBill.final_amount || 0),
      final_amount: Number(finalBill.final_amount || 0),
      amount_paid: Number(finalBill.amount_paid || 0),
      balance: Number(finalBill.balance || 0),
      total_delivered: Number(totalDelivered),
      total_extra: Number(totalExtra)
    });


  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.get('/api/bills/unpaid-with-credit', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT b.*, c.credit_balance FROM bills b JOIN customers c ON b.customer_id = c.id WHERE b.paid = 0 ORDER BY b.bill_year DESC, b.bill_month DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payments
app.get('/api/payments', async (req, res) => {
  try {
    const { customerId } = req.query;
    let query = 'SELECT * FROM payments';
    const params = [];
    if (customerId) {
      query += ' WHERE customer_id = ?';
      params.push(customerId);
    }
    query += ' ORDER BY payment_date DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments for a specific bill (ledger view)
app.get('/api/payments/bill/:billId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM payments WHERE bill_id = ? ORDER BY payment_date ASC',
      [req.params.billId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const billId = Number(req.body.bill_id);
    const paymentAmount = Number(req.body.amount_paid);
    const paymentMethod = req.body.payment_method || 'cash';

    if (!billId || !paymentAmount || paymentAmount <= 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'bill_id and positive amount_paid are required' });
    }

    const [bills] = await connection.query(
      'SELECT id, customer_id, total_amount, amount_paid, balance FROM bills WHERE id = ? FOR UPDATE',
      [billId]
    );

    if (bills.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Bill not found' });
    }

    const bill = bills[0];
    const customerId = Number(bill.customer_id);
    const currentBalance = Number(bill.balance || 0);
    const appliedToBill = Number(Math.min(paymentAmount, currentBalance).toFixed(2));
    const creditAdded = Number(Math.max(0, paymentAmount - currentBalance).toFixed(2));
    const newAmountPaid = Number((Number(bill.amount_paid || 0) + appliedToBill).toFixed(2));
    const newBalance = Number(Math.max(0, currentBalance - appliedToBill).toFixed(2));
    const isPaid = newBalance <= 0;

    const [payResult] = await connection.query(
      'INSERT INTO payments (bill_id, customer_id, amount_paid, change_given, payment_method, is_partial, is_full_with_change, change_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        billId,
        customerId,
        paymentAmount,
        creditAdded,
        paymentMethod,
        paymentAmount < currentBalance,
        creditAdded > 0,
        creditAdded,
      ]
    );

    await connection.query(
      'UPDATE bills SET paid = ?, amount_paid = ?, balance = ?, payment_date = CURDATE() WHERE id = ?',
      [isPaid, newAmountPaid, newBalance, billId]
    );

    if (creditAdded > 0) {
      await connection.query(
        'UPDATE customers SET credit_balance = credit_balance + ? WHERE id = ?',
        [creditAdded, customerId]
      );
    }

    const [customers] = await connection.query(
      'SELECT credit_balance FROM customers WHERE id = ?',
      [customerId]
    );

    await connection.commit();

    res.status(201).json({
      id: payResult.insertId,
      success: true,
      bill_id: billId,
      customer_id: customerId,
      amount_paid: paymentAmount,
      applied_to_bill: appliedToBill,
      credit_added: creditAdded,
      wallet_added: creditAdded,
      new_balance: newBalance,
      customer_credit_balance: Number(customers[0]?.credit_balance || 0),
      credit_balance: Number(customers[0]?.credit_balance || 0),
      paid: isPaid,
      payment_method: paymentMethod,
      message: creditAdded > 0 ? `₹${creditAdded.toFixed(2)} added to wallet` : 'Payment recorded',
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Credits
app.get('/api/credits/:customerId', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT credit_balance FROM customers WHERE id = ?', [req.params.customerId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ customer_id: req.params.customerId, credit_balance: rows[0].credit_balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/credits/apply', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { customer_id, bill_id, amount } = req.body;

    const [customers] = await connection.query('SELECT credit_balance FROM customers WHERE id = ?', [customer_id]);
    if (customers.length === 0) throw new Error('Customer not found');
    const availableCredit = parseFloat(customers[0].credit_balance);
    const applyAmount = Math.min(parseFloat(amount), availableCredit);

    if (applyAmount <= 0) throw new Error('No credit available');

    const [bills] = await connection.query('SELECT balance, amount_paid FROM bills WHERE id = ?', [bill_id]);
    if (bills.length === 0) throw new Error('Bill not found');
    const billBalance = parseFloat(bills[0].balance);
    const creditToApply = Math.min(applyAmount, billBalance);

    if (creditToApply <= 0) throw new Error('Bill has no balance');

    await connection.query(
      'UPDATE bills SET amount_paid = amount_paid + ?, balance = GREATEST(0, balance - ?), paid = (balance <= 0) WHERE id = ?',
      [creditToApply, creditToApply, bill_id]
    );
    await connection.query(
      'UPDATE customers SET credit_balance = credit_balance - ? WHERE id = ?',
      [creditToApply, customer_id]
    );

    await connection.commit();
    res.json({ message: `Credit of ₹${creditToApply} applied`, applied: creditToApply });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// Analytics
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [[totalDeliveries]] = await pool.query(
      'SELECT COUNT(*) as count FROM deliveries WHERE date = ? AND is_deleted = FALSE', [today]);
    const [[delivered]] = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(delivered_quantity + extra_milk),0) as total_milk FROM deliveries WHERE date = ? AND is_deleted = FALSE AND status IN ('delivered','extra')",
      [today]);
    const [[onLeave]] = await pool.query(
      "SELECT COUNT(*) as count FROM deliveries WHERE date = ? AND is_deleted = FALSE AND status = 'leave'", [today]);
    const [[totalCustomers]] = await pool.query(
      "SELECT COUNT(*) as count FROM customers WHERE status = 'active'");
    const [[monthlyBilling]] = await pool.query(
      'SELECT COALESCE(SUM(total_amount),0) as billed, COALESCE(SUM(amount_paid),0) as collected, COALESCE(SUM(balance),0) as pending FROM bills WHERE bill_year = YEAR(CURDATE()) AND bill_month = MONTH(CURDATE())');
    const [[unpaidBills]] = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(balance),0) as total FROM bills WHERE paid = 0");
    const [[monthMilk]] = await pool.query(
      "SELECT COALESCE(SUM(delivered_quantity + extra_milk),0) as total FROM deliveries WHERE YEAR(date)=YEAR(CURDATE()) AND MONTH(date)=MONTH(CURDATE()) AND is_deleted=FALSE AND status IN ('delivered','extra')");

    res.json({
      date: today,
      total_deliveries: Number(totalDeliveries.count),
      delivered: Number(delivered.count),
      on_leave: Number(onLeave.count),
      total_customers: Number(totalCustomers.count),
      total_milk_today: Number(delivered.total_milk || 0),
      monthly_income: Number(monthlyBilling.billed || 0),
      monthly_collected: Number(monthlyBilling.collected || 0),
      monthly_pending: Number(monthlyBilling.pending || 0),
      unpaid_bills: Number(unpaidBills.count),
      pending_amount: Number(unpaidBills.total || 0),
      month_milk_total: Number(monthMilk.total || 0),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/earnings', async (req, res) => {
  try {
    const { year, month } = req.query;
    const filterYear = year || new Date().getFullYear();
    const filterMonth = month || (new Date().getMonth() + 1);

    const [billStats] = await pool.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total_billed, COALESCE(SUM(amount_paid), 0) as total_paid, COALESCE(SUM(balance), 0) as total_pending FROM bills WHERE bill_year = ? AND bill_month = ?',
      [filterYear, filterMonth]
    );

    const [expenseStats] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE YEAR(expense_date) = ? AND MONTH(expense_date) = ?',
      [filterYear, filterMonth]
    );

    const billed = parseFloat(billStats[0].total_billed);
    const paid = parseFloat(billStats[0].total_paid);
    const expenses = parseFloat(expenseStats[0].total_expenses);

    res.json({
      year: parseInt(filterYear),
      month: parseInt(filterMonth),
      total_billed: billed,
      total_paid: paid,
      total_pending: parseFloat(billStats[0].total_pending),
      total_expenses: expenses,
      profit: paid - expenses
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  // Reuse analytics for stats
  try {
    const today = new Date().toISOString().split('T')[0];
    const [customerCount] = await pool.query("SELECT COUNT(*) as count FROM customers WHERE status='active'");
    const [todayDelivery] = await pool.query("SELECT COUNT(*) as count FROM deliveries WHERE date=? AND is_deleted = FALSE AND status IN ('delivered', 'extra')", [today]);
    const [unpaidBills] = await pool.query("SELECT COUNT(*) as count, SUM(balance) as total FROM bills WHERE paid=0");
    const [monthRevenue] = await pool.query("SELECT SUM(amount_paid) as total FROM payments WHERE MONTH(payment_date)=MONTH(CURDATE()) AND YEAR(payment_date)=YEAR(CURDATE())");
    
    res.json({
      activeCustomers: customerCount[0].count,
      todayDeliveries: todayDelivery[0].count,
      unpaidBills: unpaidBills[0].count,
      pendingAmount: unpaidBills[0].total || 0,
      monthlyRevenue: monthRevenue[0].total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reports
app.get('/api/reports/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const filterDate = date || new Date().toISOString().split('T')[0];
    
    const [deliveries] = await pool.query(
      `SELECT d.*,
        (d.status IN ('delivered', 'extra')) AS delivered,
        (d.status = 'leave') AS \`leave\`
       FROM deliveries d
       WHERE d.date = ? AND d.is_deleted = FALSE
       ORDER BY d.delivery_shift, d.customer_name`,
      [filterDate]
    );
    
    const [stats] = await pool.query(
      `SELECT COUNT(*) as total_deliveries, 
       SUM(CASE WHEN status IN ('delivered', 'extra') THEN 1 ELSE 0 END) as delivered_count,
       SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_count,
       SUM(CASE WHEN status IN ('delivered', 'extra') THEN delivered_quantity ELSE 0 END) as total_milk,
       SUM(CASE WHEN status IN ('delivered', 'extra') THEN extra_milk ELSE 0 END) as total_extra_milk
       FROM deliveries WHERE date = ? AND is_deleted = FALSE`,
      [filterDate]
    );
    
    res.json({
      date: filterDate,
      deliveries,
      summary: stats[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    const filterYear = year || new Date().getFullYear();
    const filterMonth = month || (new Date().getMonth() + 1);
    
    const [rows] = await pool.query(
       `SELECT c.id as customer_id, c.name as customer_name, 
       COUNT(d.id) as total_days,
       SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN 1 ELSE 0 END) as delivered_days,
       SUM(CASE WHEN d.status = 'leave' THEN 1 ELSE 0 END) as leave_days,
       SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN d.delivered_quantity ELSE 0 END) as total_milk,
       SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN d.extra_milk ELSE 0 END) as total_extra_milk,
       c.milk_rate_per_liter,
       (SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN d.delivered_quantity ELSE 0 END) + 
        SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN d.extra_milk ELSE 0 END)) * c.milk_rate_per_liter as raw_total,
       c.credit_balance as wallet_deduction,
       ((SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN d.delivered_quantity ELSE 0 END) + 
        SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN d.extra_milk ELSE 0 END)) * c.milk_rate_per_liter) - c.credit_balance as final_payable
       FROM customers c
       LEFT JOIN deliveries d ON c.id = d.customer_id AND YEAR(d.date) = ? AND MONTH(d.date) = ? AND d.is_deleted = FALSE
       GROUP BY c.id
       ORDER BY c.name`,
      [filterYear, filterMonth]
    );
    
    res.json({
      year: filterYear,
      month: filterMonth,
      customers: rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/customer/:id', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const customerId = req.params.id;
    
    const [customers] = await pool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (customers.length === 0) return res.status(404).json({ error: 'Customer not found' });
    
    let deliveryQuery = `SELECT d.*,
      (d.status IN ('delivered', 'extra')) AS delivered,
      (d.status = 'leave') AS \`leave\`
      FROM deliveries d
      WHERE d.customer_id = ? AND d.is_deleted = FALSE`;
    let params = [customerId];
    if (startDate) {
      deliveryQuery += ' AND d.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      deliveryQuery += ' AND d.date <= ?';
      params.push(endDate);
    }
    deliveryQuery += ' ORDER BY d.date DESC';
    
    const [deliveries] = await pool.query(deliveryQuery, params);
    const [bills] = await pool.query('SELECT * FROM bills WHERE customer_id = ? ORDER BY bill_year DESC, bill_month DESC LIMIT 12', [customerId]);
    
    res.json({
      customer: customers[0],
      deliveries,
      bills
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ═══════════════════════════════════════
// GET /api/reports/daily?date=YYYY-MM-DD
// ═══════════════════════════════════════
app.get('/api/reports/daily', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const [deliveries] = await pool.query(`
      SELECT d.*, c.name AS customer_name, c.milk_rate_per_liter, c.shift AS customer_shift
      FROM deliveries d
      JOIN customers c ON c.id = d.customer_id
      WHERE d.date = ? AND d.is_deleted = FALSE
      ORDER BY c.name ASC
    `, [date]);

    const delivered      = deliveries.filter(d => d.status === 'delivered' || d.status === 'extra');
    const onLeave        = deliveries.filter(d => d.status === 'leave');
    const totalMilk      = delivered.reduce((s, d) => s + Number(d.delivered_quantity || 0) + Number(d.extra_milk || 0), 0);

    res.json({
      date,
      summary: {
        total_deliveries: deliveries.length,
        delivered_count:  delivered.length,
        leave_count:      onLeave.length,
        total_milk:       totalMilk,
      },
      deliveries,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDB();
});
