-- Milk Management Database Schema
-- Run this script to create the database and all required tables

CREATE DATABASE IF NOT EXISTS milk_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE milk_management_db;

-- ==================== CUSTOMERS TABLE ====================
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    daily_milk_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    milk_rate_per_liter DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    shift ENUM('morning', 'evening', 'occasional') DEFAULT 'morning',
    status ENUM('active', 'inactive') DEFAULT 'active',
    default_milk_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    customer_type ENUM('regular', 'premium') DEFAULT 'regular',
    credit_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== DELIVERIES TABLE ====================
CREATE TABLE IF NOT EXISTS deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100),
    date DATE NOT NULL,
    session ENUM('morning', 'evening') DEFAULT 'morning',
    scheduled_quantity DECIMAL(10, 2) DEFAULT 0.00,
    delivered_quantity DECIMAL(10, 2) DEFAULT 0.00,
    delivered BOOLEAN DEFAULT FALSE,
    `leave` BOOLEAN DEFAULT FALSE,
    delivery_shift ENUM('morning', 'evening', 'occasional') DEFAULT 'morning',
    extra_milk DECIMAL(10, 2) DEFAULT 0.00,
    quantity_overridden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_customer_date_session (customer_id, date, delivery_shift)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== BILLS TABLE ====================
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100),
    bill_month INT NOT NULL,
    bill_year INT NOT NULL,
    bill_start_date DATE,
    bill_end_date DATE,
    total_quantity DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    sent_to_customer BOOLEAN DEFAULT FALSE,
    paid BOOLEAN DEFAULT FALSE,
    payment_date TIMESTAMP NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0.00,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    outstanding_balance DECIMAL(10, 2) DEFAULT 0.00,
    last_payment_change DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_paid (paid),
    INDEX idx_month_year (bill_month, bill_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== PAYMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    customer_id INT NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    change_given DECIMAL(10, 2) DEFAULT 0.00,
    payment_method ENUM('cash', 'card', 'upi', 'partial') DEFAULT 'cash',
    is_partial BOOLEAN DEFAULT FALSE,
    is_full_with_change BOOLEAN DEFAULT FALSE,
    change_amount DECIMAL(10, 2) DEFAULT 0.00,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_bill (bill_id),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== LONG LEAVES TABLE ====================
CREATE TABLE IF NOT EXISTS long_leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== LONG EXTRA MILK TABLE ====================
CREATE TABLE IF NOT EXISTS long_extra_milk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    daily_extra_quantity DECIMAL(10, 2) DEFAULT 0.00,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== EXTRA MILK TABLE ====================
CREATE TABLE IF NOT EXISTS extra_milk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100),
    date DATE NOT NULL,
    extra_quantity DECIMAL(10, 2) DEFAULT 0.00,
    type ENUM('single_day', 'range') DEFAULT 'single_day',
    start_date DATE,
    end_date DATE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== EXPENSES TABLE ====================
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (expense_date),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== MILK PRICE HISTORY TABLE ====================
CREATE TABLE IF NOT EXISTS milk_price_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rate_per_liter DECIMAL(10, 2) NOT NULL,
    effective_date DATE NOT NULL,
    reason TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== ALERTS TABLE ====================
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    pin VARCHAR(10) NOT NULL,
    role ENUM('admin', 'manager', 'worker') DEFAULT 'worker',
    full_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== INSERT DEFAULT ADMIN USER ====================
-- Default PIN: 1234 (CHANGE THIS IMMEDIATELY!)
INSERT INTO users (username, pin, role, full_name) 
VALUES ('admin', '1234', 'admin', 'System Administrator')
ON DUPLICATE KEY UPDATE username = username;

-- ==================== SAMPLE DATA (OPTIONAL) ====================
-- Uncomment below to insert sample customers
/*
INSERT INTO customers (name, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, default_milk_quantity) VALUES
('John Doe', '9876543210', '123 Main Street', 5.00, 60.00, 'morning', 5.00),
('Jane Smith', '9876543211', '456 Oak Avenue', 3.50, 60.00, 'evening', 3.50),
('Bob Johnson', '9876543212', '789 Pine Road', 4.00, 60.00, 'morning', 4.00);
*/
