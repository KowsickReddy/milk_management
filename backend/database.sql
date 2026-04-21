-- Database Setup Script for Milk Management System
-- Run this script in MySQL to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS milk_management_db;
USE milk_management_db;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    daily_milk_quantity DECIMAL(10,2) DEFAULT 0,
    milk_rate_per_liter DECIMAL(10,2) DEFAULT 0,
    default_milk_quantity DECIMAL(10,2) DEFAULT 0,
    shift VARCHAR(20) DEFAULT 'morning',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    customer_name VARCHAR(255),
    date DATE NOT NULL,
    session VARCHAR(20) DEFAULT 'morning',
    scheduled_quantity DECIMAL(10,2) DEFAULT 0,
    delivered_quantity DECIMAL(10,2) DEFAULT 0,
    delivered BOOLEAN DEFAULT FALSE,
    leave BOOLEAN DEFAULT FALSE,
    extra_milk DECIMAL(10,2) DEFAULT 0,
    quantity_overridden BOOLEAN DEFAULT FALSE,
    delivery_shift VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    customer_name VARCHAR(255),
    bill_month INT NOT NULL,
    bill_year INT NOT NULL,
    total_quantity DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    paid BOOLEAN DEFAULT FALSE,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0,
    bill_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_date DATE,
    last_payment_change DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT,
    customer_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    change_given DECIMAL(10,2) DEFAULT 0,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(20) DEFAULT 'cash',
    is_partial BOOLEAN DEFAULT FALSE,
    is_full_with_change BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    credit_amount DECIMAL(10,2) NOT NULL,
    applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP NULL,
    applied_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_deliveries_date ON deliveries(date);
CREATE INDEX idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX idx_bills_customer ON bills(customer_id);
CREATE INDEX idx_bills_paid ON bills(paid);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Insert sample data (optional)
INSERT INTO customers (name, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, status)
VALUES 
('Rajesh Kumar', '9876543210', 'Village Rampur, District Mahipalpur', 2.0, 28, 'morning', 'active'),
('Priya Sharma', '9876543211', 'Village Bhilai, District Durg', 1.5, 28, 'evening', 'active'),
('Amul Patel', '9876543212', 'Village Kanpur, District Unnao', 3.0, 28, 'morning', 'active'),
('Sunita Devi', '9876543213', 'Village Gwalior, District Madhya', 2.5, 28, 'morning', 'active'),
('Mohan Singh', '9876543214', 'Village Hisar, District Haryana', 1.0, 28, 'evening', 'active'),
('Lakshmi Narayan', '9876543215', 'Village Coimbatore, District Tamil', 2.0, 28, 'morning', 'inactive'),
('Anita Rao', '9876543216', 'Village Vizag, District Andhra', 1.5, 28, 'evening', 'active'),
('Suresh Babu', '9876543217', 'Village Chennai, District Tamil', 2.5, 28, 'morning', 'active'),
('Meera Kumari', '9876543218', 'Village Patna, District Bihar', 1.0, 28, 'evening', 'active'),
('Vijay Kumar', '9876543219', 'Village Lucknow, District Uttar', 3.0, 28, 'morning', 'active'),
('Sarita Devi', '9876543220', 'Village Delhi, District NCR', 2.0, 28, 'morning', 'inactive'),
('Raj Mohan', '9876543221', 'Village Mumbai, District Maharashtra', 1.5, 28, 'evening', 'active');

-- Insert deliveries for last 7 days (2026-04-07 to 2026-04-13)
-- Day 1: 2026-04-07
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, leave) VALUES
(1, 'Rajesh Kumar', '2026-04-07', 'morning', 2.0, 2.0, TRUE, FALSE),
(2, 'Priya Sharma', '2026-04-07', 'evening', 1.5, 1.5, TRUE, FALSE),
(3, 'Amul Patel', '2026-04-07', 'morning', 3.0, 3.0, TRUE, FALSE),
(4, 'Sunita Devi', '2026-04-07', 'morning', 2.5, 2.5, TRUE, FALSE),
(5, 'Mohan Singh', '2026-04-07', 'evening', 1.0, 1.0, TRUE, FALSE),
(6, 'Lakshmi Narayan', '2026-04-07', 'morning', 2.0, 0, FALSE, TRUE),
(7, 'Anita Rao', '2026-04-07', 'evening', 1.5, 1.5, TRUE, FALSE),
(8, 'Suresh Babu', '2026-04-07', 'morning', 2.5, 2.5, TRUE, FALSE),
(9, 'Meera Kumari', '2026-04-07', 'evening', 1.0, 1.0, TRUE, FALSE),
(10, 'Vijay Kumar', '2026-04-07', 'morning', 3.0, 3.0, TRUE, FALSE),
(11, 'Sarita Devi', '2026-04-07', 'morning', 2.0, 0, FALSE, TRUE),
(12, 'Raj Mohan', '2026-04-07', 'evening', 1.5, 1.5, TRUE, FALSE);

-- Day 2: 2026-04-08
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, leave) VALUES
(1, 'Rajesh Kumar', '2026-04-08', 'morning', 2.0, 2.0, TRUE, FALSE),
(2, 'Priya Sharma', '2026-04-08', 'evening', 1.5, 1.5, TRUE, FALSE),
(3, 'Amul Patel', '2026-04-08', 'morning', 3.0, 2.5, TRUE, FALSE),
(4, 'Sunita Devi', '2026-04-08', 'morning', 2.5, 2.5, TRUE, FALSE),
(5, 'Mohan Singh', '2026-04-08', 'evening', 1.0, 0, FALSE, TRUE),
(6, 'Lakshmi Narayan', '2026-04-08', 'morning', 2.0, 2.0, TRUE, FALSE),
(7, 'Anita Rao', '2026-04-08', 'evening', 1.5, 1.5, TRUE, FALSE),
(8, 'Suresh Babu', '2026-04-08', 'morning', 2.5, 2.5, TRUE, FALSE),
(9, 'Meera Kumari', '2026-04-08', 'evening', 1.0, 1.0, TRUE, FALSE),
(10, 'Vijay Kumar', '2026-04-08', 'morning', 3.0, 3.0, TRUE, FALSE),
(11, 'Sarita Devi', '2026-04-08', 'morning', 2.0, 2.0, TRUE, FALSE),
(12, 'Raj Mohan', '2026-04-08', 'evening', 1.5, 1.5, TRUE, FALSE);

-- Day 3: 2026-04-09
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, leave) VALUES
(1, 'Rajesh Kumar', '2026-04-09', 'morning', 2.0, 2.0, TRUE, FALSE),
(2, 'Priya Sharma', '2026-04-09', 'evening', 1.5, 1.5, TRUE, FALSE),
(3, 'Amul Patel', '2026-04-09', 'morning', 3.0, 3.0, TRUE, FALSE),
(4, 'Sunita Devi', '2026-04-09', 'morning', 2.5, 2.5, TRUE, FALSE),
(5, 'Mohan Singh', '2026-04-09', 'evening', 1.0, 1.0, TRUE, FALSE),
(6, 'Lakshmi Narayan', '2026-04-09', 'morning', 2.0, 2.0, TRUE, FALSE),
(7, 'Anita Rao', '2026-04-09', 'evening', 1.5, 0, FALSE, TRUE),
(8, 'Suresh Babu', '2026-04-09', 'morning', 2.5, 2.5, TRUE, FALSE),
(9, 'Meera Kumari', '2026-04-09', 'evening', 1.0, 1.0, TRUE, FALSE),
(10, 'Vijay Kumar', '2026-04-09', 'morning', 3.0, 3.0, TRUE, FALSE),
(11, 'Sarita Devi', '2026-04-09', 'morning', 2.0, 2.0, TRUE, FALSE),
(12, 'Raj Mohan', '2026-04-09', 'evening', 1.5, 1.5, TRUE, FALSE);

-- Day 4: 2026-04-10
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, leave) VALUES
(1, 'Rajesh Kumar', '2026-04-10', 'morning', 2.0, 2.0, TRUE, FALSE),
(2, 'Priya Sharma', '2026-04-10', 'evening', 1.5, 1.5, TRUE, FALSE),
(3, 'Amul Patel', '2026-04-10', 'morning', 3.0, 3.0, TRUE, FALSE),
(4, 'Sunita Devi', '2026-04-10', 'morning', 2.5, 2.5, TRUE, FALSE),
(5, 'Mohan Singh', '2026-04-10', 'evening', 1.0, 1.0, TRUE, FALSE),
(6, 'Lakshmi Narayan', '2026-04-10', 'morning', 2.0, 2.0, TRUE, FALSE),
(7, 'Anita Rao', '2026-04-10', 'evening', 1.5, 1.5, TRUE, FALSE),
(8, 'Suresh Babu', '2026-04-10', 'morning', 2.5, 2.5, TRUE, FALSE),
(9, 'Meera Kumari', '2026-04-10', 'evening', 1.0, 0, FALSE, TRUE),
(10, 'Vijay Kumar', '2026-04-10', 'morning', 3.0, 3.0, TRUE, FALSE),
(11, 'Sarita Devi', '2026-04-10', 'morning', 2.0, 2.0, TRUE, FALSE),
(12, 'Raj Mohan', '2026-04-10', 'evening', 1.5, 1.5, TRUE, FALSE);

-- Day 5: 2026-04-11
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, leave) VALUES
(1, 'Rajesh Kumar', '2026-04-11', 'morning', 2.0, 2.0, TRUE, FALSE),
(2, 'Priya Sharma', '2026-04-11', 'evening', 1.5, 1.5, TRUE, FALSE),
(3, 'Amul Patel', '2026-04-11', 'morning', 3.0, 3.0, TRUE, FALSE),
(4, 'Sunita Devi', '2026-04-11', 'morning', 2.5, 2.5, TRUE, FALSE),
(5, 'Mohan Singh', '2026-04-11', 'evening', 1.0, 1.0, TRUE, FALSE),
(6, 'Lakshmi Narayan', '2026-04-11', 'morning', 2.0, 2.0, TRUE, FALSE),
(7, 'Anita Rao', '2026-04-11', 'evening', 1.5, 1.5, TRUE, FALSE),
(8, 'Suresh Babu', '2026-04-11', 'morning', 2.5, 2.5, TRUE, FALSE),
(9, 'Meera Kumari', '2026-04-11', 'evening', 1.0, 1.0, TRUE, FALSE),
(10, 'Vijay Kumar', '2026-04-11', 'morning', 3.0, 0, FALSE, TRUE),
(11, 'Sarita Devi', '2026-04-11', 'morning', 2.0, 2.0, TRUE, FALSE),
(12, 'Raj Mohan', '2026-04-11', 'evening', 1.5, 1.5, TRUE, FALSE);

-- Day 6: 2026-04-12
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, leave) VALUES
(1, 'Rajesh Kumar', '2026-04-12', 'morning', 2.0, 2.0, TRUE, FALSE),
(2, 'Priya Sharma', '2026-04-12', 'evening', 1.5, 1.5, TRUE, FALSE),
(3, 'Amul Patel', '2026-04-12', 'morning', 3.0, 3.0, TRUE, FALSE),
(4, 'Sunita Devi', '2026-04-12', 'morning', 2.5, 2.5, TRUE, FALSE),
(5, 'Mohan Singh', '2026-04-12', 'evening', 1.0, 1.0, TRUE, FALSE),
(6, 'Lakshmi Narayan', '2026-04-12', 'morning', 2.0, 2.0, TRUE, FALSE),
(7, 'Anita Rao', '2026-04-12', 'evening', 1.5, 1.5, TRUE, FALSE),
(8, 'Suresh Babu', '2026-04-12', 'morning', 2.5, 2.5, TRUE, FALSE),
(9, 'Meera Kumari', '2026-04-12', 'evening', 1.0, 1.0, TRUE, FALSE),
(10, 'Vijay Kumar', '2026-04-12', 'morning', 3.0, 3.0, TRUE, FALSE),
(11, 'Sarita Devi', '2026-04-12', 'morning', 2.0, 2.0, TRUE, FALSE),
(12, 'Raj Mohan', '2026-04-12', 'evening', 1.5, 1.5, TRUE, FALSE);

-- Day 7: 2026-04-13 (today - some pending, some delivered)
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, leave) VALUES
(1, 'Rajesh Kumar', '2026-04-13', 'morning', 2.0, 2.0, TRUE, FALSE),
(2, 'Priya Sharma', '2026-04-13', 'evening', 1.5, 1.5, TRUE, FALSE),
(3, 'Amul Patel', '2026-04-13', 'morning', 3.0, 3.0, TRUE, FALSE),
(4, 'Sunita Devi', '2026-04-13', 'morning', 2.5, 0, FALSE, FALSE),
(5, 'Mohan Singh', '2026-04-13', 'evening', 1.0, 1.0, TRUE, FALSE),
(6, 'Lakshmi Narayan', '2026-04-13', 'morning', 2.0, 2.0, TRUE, FALSE),
(7, 'Anita Rao', '2026-04-13', 'evening', 1.5, 0, FALSE, FALSE),
(8, 'Suresh Babu', '2026-04-13', 'morning', 2.5, 2.5, TRUE, FALSE),
(9, 'Meera Kumari', '2026-04-13', 'evening', 1.0, 1.0, TRUE, FALSE),
(10, 'Vijay Kumar', '2026-04-13', 'morning', 3.0, 3.0, TRUE, FALSE),
(11, 'Sarita Devi', '2026-04-13', 'morning', 2.0, 0, FALSE, FALSE),
(12, 'Raj Mohan', '2026-04-13', 'evening', 1.5, 1.5, TRUE, FALSE);

-- Insert bills for last 3 months (February, March, April 2026)
-- February 2026 bills
INSERT INTO bills (customer_id, customer_name, bill_month, bill_year, total_quantity, total_amount, paid, amount_paid, balance) VALUES
(1, 'Rajesh Kumar', 2, 2026, 56.0, 1568.00, TRUE, 1568.00, 0.00),
(2, 'Priya Sharma', 2, 2026, 42.0, 1176.00, TRUE, 1200.00, 0.00),
(3, 'Amul Patel', 2, 2026, 84.0, 2352.00, TRUE, 2352.00, 0.00),
(4, 'Sunita Devi', 2, 2026, 70.0, 1960.00, TRUE, 1960.00, 0.00),
(5, 'Mohan Singh', 2, 2026, 28.0, 784.00, FALSE, 0.00, 784.00),
(6, 'Lakshmi Narayan', 2, 2026, 56.0, 1568.00, TRUE, 1500.00, 0.00),
(7, 'Anita Rao', 2, 2026, 42.0, 1176.00, TRUE, 1176.00, 0.00),
(8, 'Suresh Babu', 2, 2026, 70.0, 1960.00, FALSE, 500.00, 1460.00),
(9, 'Meera Kumari', 2, 2026, 28.0, 784.00, TRUE, 784.00, 0.00),
(10, 'Vijay Kumar', 2, 2026, 84.0, 2352.00, TRUE, 2352.00, 0.00),
(11, 'Sarita Devi', 2, 2026, 56.0, 1568.00, FALSE, 0.00, 1568.00),
(12, 'Raj Mohan', 2, 2026, 42.0, 1176.00, TRUE, 1176.00, 0.00);

-- March 2026 bills
INSERT INTO bills (customer_id, customer_name, bill_month, bill_year, total_quantity, total_amount, paid, amount_paid, balance) VALUES
(1, 'Rajesh Kumar', 3, 2026, 62.0, 1736.00, TRUE, 1736.00, 0.00),
(2, 'Priya Sharma', 3, 2026, 46.5, 1302.00, TRUE, 1302.00, 0.00),
(3, 'Amul Patel', 3, 2026, 93.0, 2604.00, TRUE, 2604.00, 0.00),
(4, 'Sunita Devi', 3, 2026, 77.5, 2170.00, FALSE, 1000.00, 1170.00),
(5, 'Mohan Singh', 3, 2026, 31.0, 868.00, FALSE, 0.00, 868.00),
(6, 'Lakshmi Narayan', 3, 2026, 62.0, 1736.00, TRUE, 1736.00, 0.00),
(7, 'Anita Rao', 3, 2026, 46.5, 1302.00, TRUE, 1302.00, 0.00),
(8, 'Suresh Babu', 3, 2026, 77.5, 2170.00, TRUE, 2170.00, 0.00),
(9, 'Meera Kumari', 3, 2026, 31.0, 868.00, TRUE, 868.00, 0.00),
(10, 'Vijay Kumar', 3, 2026, 93.0, 2604.00, FALSE, 1500.00, 1104.00),
(11, 'Sarita Devi', 3, 2026, 62.0, 1736.00, TRUE, 1736.00, 0.00),
(12, 'Raj Mohan', 3, 2026, 46.5, 1302.00, TRUE, 1302.00, 0.00);

-- April 2026 bills (current month - partial or unpaid)
INSERT INTO bills (customer_id, customer_name, bill_month, bill_year, total_quantity, total_amount, paid, amount_paid, balance) VALUES
(1, 'Rajesh Kumar', 4, 2026, 14.0, 392.00, FALSE, 0.00, 392.00),
(2, 'Priya Sharma', 4, 2026, 10.5, 294.00, FALSE, 0.00, 294.00),
(3, 'Amul Patel', 4, 2026, 21.0, 588.00, FALSE, 0.00, 588.00),
(4, 'Sunita Devi', 4, 2026, 17.5, 490.00, FALSE, 0.00, 490.00),
(5, 'Mohan Singh', 4, 2026, 7.0, 196.00, FALSE, 0.00, 196.00),
(6, 'Lakshmi Narayan', 4, 2026, 14.0, 392.00, FALSE, 0.00, 392.00),
(7, 'Anita Rao', 4, 2026, 10.5, 294.00, FALSE, 0.00, 294.00),
(8, 'Suresh Babu', 4, 2026, 17.5, 490.00, FALSE, 0.00, 490.00),
(9, 'Meera Kumari', 4, 2026, 7.0, 196.00, FALSE, 0.00, 196.00),
(10, 'Vijay Kumar', 4, 2026, 21.0, 588.00, FALSE, 0.00, 588.00),
(11, 'Sarita Devi', 4, 2026, 14.0, 392.00, FALSE, 0.00, 392.00),
(12, 'Raj Mohan', 4, 2026, 10.5, 294.00, FALSE, 0.00, 294.00);

-- Insert sample payments
INSERT INTO payments (bill_id, customer_id, amount_paid, change_given, payment_date, payment_method, is_partial, is_full_with_change) VALUES
(1, 1, 1568.00, 0, '2026-03-05 10:30:00', 'cash', FALSE, FALSE),
(2, 2, 1200.00, 24, '2026-03-05 11:00:00', 'cash', FALSE, TRUE),
(3, 3, 2352.00, 0, '2026-03-05 11:30:00', 'gpay', FALSE, FALSE),
(4, 4, 1960.00, 0, '2026-03-05 12:00:00', 'cash', FALSE, FALSE),
(6, 6, 1500.00, 0, '2026-03-06 09:00:00', 'cash', TRUE, FALSE),
(7, 7, 1176.00, 0, '2026-03-06 10:00:00', 'cash', FALSE, FALSE),
(8, 8, 500.00, 0, '2026-03-06 11:00:00', 'cash', TRUE, FALSE),
(9, 9, 784.00, 0, '2026-03-06 12:00:00', 'cash', FALSE, FALSE),
(10, 10, 2352.00, 0, '2026-03-07 09:00:00', 'gpay', FALSE, FALSE),
(12, 12, 1176.00, 0, '2026-03-07 10:00:00', 'cash', FALSE, FALSE),
(13, 1, 1736.00, 0, '2026-04-05 10:30:00', 'cash', FALSE, FALSE),
(14, 2, 1302.00, 0, '2026-04-05 11:00:00', 'gpay', FALSE, FALSE),
(15, 3, 2604.00, 0, '2026-04-05 11:30:00', 'cash', FALSE, FALSE),
(16, 4, 1000.00, 0, '2026-04-05 12:00:00', 'cash', TRUE, FALSE),
(17, 5, 0.00, 0, '2026-04-06 09:00:00', 'cash', FALSE, FALSE),
(18, 6, 1736.00, 0, '2026-04-06 10:00:00', 'cash', FALSE, FALSE),
(19, 7, 1302.00, 0, '2026-04-06 11:00:00', 'gpay', FALSE, FALSE),
(20, 8, 2170.00, 0, '2026-04-06 12:00:00', 'cash', FALSE, FALSE),
(21, 9, 868.00, 0, '2026-04-07 09:00:00', 'cash', FALSE, FALSE),
(22, 10, 1500.00, 0, '2026-04-07 10:00:00', 'cash', TRUE, FALSE),
(23, 11, 1736.00, 0, '2026-04-07 11:00:00', 'cash', FALSE, FALSE),
(24, 12, 1302.00, 0, '2026-04-07 12:00:00', 'gpay', FALSE, FALSE);

-- Insert sample credits (overpayments from customers)
INSERT INTO credits (customer_id, credit_amount, applied, applied_at, applied_amount, created_at) VALUES
(2, 24.00, TRUE, '2026-03-05 11:00:00', 24.00, '2026-03-05 11:00:00'),
(2, 50.00, TRUE, '2026-04-08 10:00:00', 50.00, '2026-04-08 10:00:00'),
(6, 68.00, TRUE, '2026-03-06 09:00:00', 68.00, '2026-03-06 09:00:00'),
(6, 30.00, TRUE, '2026-04-09 09:00:00', 30.00, '2026-04-09 09:00:00'),
(8, 32.00, TRUE, '2026-03-06 11:00:00', 32.00, '2026-03-06 11:00:00'),
(10, 25.00, FALSE, NULL, 0.00, '2026-04-10 09:00:00'),
(11, 45.00, FALSE, NULL, 0.00, '2026-04-12 10:00:00'),
(1, 15.00, FALSE, NULL, 0.00, '2026-04-13 11:00:00');

-- Show tables
SHOW TABLES;

SELECT 'Database setup completed successfully!' as message;