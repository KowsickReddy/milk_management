-- Seed Data for Milk Management System
-- Run this after creating the database: source seed_data.sql

USE milk_management_db;

-- Clear existing data (in reverse order of dependencies)
DELETE FROM payments;
DELETE FROM bills;
DELETE FROM deliveries;
DELETE FROM long_leaves;
DELETE FROM extra_milk;
DELETE FROM expenses;
DELETE FROM milk_price_history;
DELETE FROM alerts;
DELETE FROM customers;

-- ==================== CUSTOMERS ====================
INSERT INTO customers (name, phone, address, daily_milk_quantity, milk_rate_per_liter, shift, status, default_milk_quantity, customer_type, credit_balance) VALUES
('Rajesh Kumar', '9876543210', '123 Main Street, Andhra Pradesh', 2.0, 60.00, 'morning', 'active', 2.0, 'regular', 0.00),
('Srinivas Rao', '9876543211', '456 Market Road, Vijayawada', 1.5, 58.00, 'morning', 'active', 1.5, 'regular', 0.00),
('Venkat Reddy', '9876543212', '789 Temple Street, Guntur', 3.0, 62.00, 'evening', 'active', 3.0, 'regular', 0.00),
('Lakshmi Devi', '9876543213', '321 School Lane, Nellore', 1.0, 55.00, 'morning', 'active', 1.0, 'regular', 0.00),
('Krishna Murthy', '9876543214', '654 Park Avenue, Tirupati', 2.5, 60.00, 'evening', 'active', 2.5, 'regular', 0.00),
('Ravi Shankar', '9876543215', '987 Lake Road, Kakinada', 1.0, 56.00, 'morning', 'active', 1.0, 'occasional', 0.00),
('Suresh Babu', '9876543216', '147 Station Road, Rajahmundry', 2.0, 59.00, 'morning', 'active', 2.0, 'regular', 0.00),
('Anjali Sharma', '9876543217', '258 Garden Street, Visakhapatnam', 1.5, 58.00, 'evening', 'active', 1.5, 'regular', 0.00),
('Prakash Reddy', '9876543218', '369 Hill Road, Kadapa', 3.5, 64.00, 'morning', 'active', 3.5, 'regular', 0.00),
('Meena Kumari', '9876543219', '741 River Side, Ongole', 2.0, 60.00, 'morning', 'active', 2.0, 'regular', 0.00),
('Ramesh Gupta', '9876543220', '852 Lake View, Eluru', 1.0, 55.00, 'evening', 'inactive', 1.0, 'regular', 0.00),
('Sanjay Patel', '9876543221', '963 Cross Road, Machilipatnam', 2.5, 61.00, 'morning', 'active', 2.5, 'regular', 0.00);

-- ==================== DELIVERIES (Last 7 days) ====================
-- Day 1 (7 days ago)
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, `leave`, delivery_shift, extra_milk) VALUES
(1, 'Rajesh Kumar', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(2, 'Srinivas Rao', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'morning', 1.5, 1.5, 1, 0, 'morning', 0.0),
(3, 'Venkat Reddy', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'evening', 3.0, 3.0, 1, 0, 'evening', 0.0),
(4, 'Lakshmi Devi', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'morning', 1.0, 1.0, 1, 0, 'morning', 0.0),
(5, 'Krishna Murthy', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'evening', 2.5, 2.5, 1, 0, 'evening', 0.0),
(7, 'Suresh Babu', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(8, 'Anjali Sharma', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'evening', 1.5, 1.5, 1, 0, 'evening', 0.0),
(9, 'Prakash Reddy', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'morning', 3.5, 3.5, 1, 0, 'morning', 0.0),
(10, 'Meena Kumari', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(12, 'Sanjay Patel', DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'morning', 2.5, 2.5, 1, 0, 'morning', 0.0);

-- Day 2 (6 days ago)
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, `leave`, delivery_shift, extra_milk) VALUES
(1, 'Rajesh Kumar', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.5),
(2, 'Srinivas Rao', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'morning', 1.5, 1.5, 1, 0, 'morning', 0.0),
(3, 'Venkat Reddy', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'evening', 3.0, 3.0, 1, 0, 'evening', 0.0),
(4, 'Lakshmi Devi', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'morning', 1.0, 0.0, 0, 1, 'morning', 0.0),
(5, 'Krishna Murthy', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'evening', 2.5, 2.5, 1, 0, 'evening', 0.0),
(7, 'Suresh Babu', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(8, 'Anjali Sharma', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'evening', 1.5, 1.5, 1, 0, 'evening', 0.0),
(9, 'Prakash Reddy', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'morning', 3.5, 3.5, 1, 0, 'morning', 0.0),
(10, 'Meena Kumari', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(12, 'Sanjay Patel', DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'morning', 2.5, 2.5, 1, 0, 'morning', 0.0);

-- Day 3 (5 days ago)
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, `leave`, delivery_shift, extra_milk) VALUES
(1, 'Rajesh Kumar', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(2, 'Srinivas Rao', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'morning', 1.5, 1.5, 1, 0, 'morning', 0.0),
(3, 'Venkat Reddy', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'evening', 3.0, 3.0, 1, 0, 'evening', 1.0),
(4, 'Lakshmi Devi', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'morning', 1.0, 1.0, 1, 0, 'morning', 0.0),
(5, 'Krishna Murthy', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'evening', 2.5, 2.5, 1, 0, 'evening', 0.0),
(7, 'Suresh Babu', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'morning', 2.0, 0.0, 0, 1, 'morning', 0.0),
(8, 'Anjali Sharma', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'evening', 1.5, 1.5, 1, 0, 'evening', 0.0),
(9, 'Prakash Reddy', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'morning', 3.5, 3.5, 1, 0, 'morning', 0.0),
(10, 'Meena Kumari', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(12, 'Sanjay Patel', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'morning', 2.5, 2.5, 1, 0, 'morning', 0.0);

-- Day 4 (4 days ago)
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, `leave`, delivery_shift, extra_milk) VALUES
(1, 'Rajesh Kumar', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(2, 'Srinivas Rao', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'morning', 1.5, 1.5, 1, 0, 'morning', 0.0),
(3, 'Venkat Reddy', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'evening', 3.0, 3.0, 1, 0, 'evening', 0.0),
(4, 'Lakshmi Devi', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'morning', 1.0, 1.0, 1, 0, 'morning', 0.0),
(5, 'Krishna Murthy', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'evening', 2.5, 0.0, 0, 1, 'evening', 0.0),
(7, 'Suresh Babu', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(8, 'Anjali Sharma', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'evening', 1.5, 1.5, 1, 0, 'evening', 0.0),
(9, 'Prakash Reddy', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'morning', 3.5, 3.5, 1, 0, 'morning', 0.0),
(10, 'Meena Kumari', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(12, 'Sanjay Patel', DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'morning', 2.5, 2.5, 1, 0, 'morning', 0.0);

-- Day 5 (3 days ago)
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, `leave`, delivery_shift, extra_milk) VALUES
(1, 'Rajesh Kumar', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(2, 'Srinivas Rao', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'morning', 1.5, 0.0, 0, 1, 'morning', 0.0),
(3, 'Venkat Reddy', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'evening', 3.0, 3.0, 1, 0, 'evening', 0.0),
(4, 'Lakshmi Devi', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'morning', 1.0, 1.0, 1, 0, 'morning', 0.0),
(5, 'Krishna Murthy', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'evening', 2.5, 2.5, 1, 0, 'evening', 0.0),
(7, 'Suresh Babu', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(8, 'Anjali Sharma', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'evening', 1.5, 1.5, 1, 0, 'evening', 0.5),
(9, 'Prakash Reddy', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'morning', 3.5, 3.5, 1, 0, 'morning', 0.0),
(10, 'Meena Kumari', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(12, 'Sanjay Patel', DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'morning', 2.5, 2.5, 1, 0, 'morning', 0.0);

-- Day 6 (2 days ago)
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, `leave`, delivery_shift, extra_milk) VALUES
(1, 'Rajesh Kumar', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(2, 'Srinivas Rao', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'morning', 1.5, 1.5, 1, 0, 'morning', 0.0),
(3, 'Venkat Reddy', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'evening', 3.0, 3.0, 1, 0, 'evening', 0.0),
(4, 'Lakshmi Devi', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'morning', 1.0, 1.0, 1, 0, 'morning', 0.0),
(5, 'Krishna Murthy', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'evening', 2.5, 2.5, 1, 0, 'evening', 0.0),
(7, 'Suresh Babu', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(8, 'Anjali Sharma', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'evening', 1.5, 1.5, 1, 0, 'evening', 0.0),
(9, 'Prakash Reddy', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'morning', 3.5, 3.5, 1, 0, 'morning', 0.0),
(10, 'Meena Kumari', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'morning', 2.0, 0.0, 0, 1, 'morning', 0.0),
(12, 'Sanjay Patel', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'morning', 2.5, 2.5, 1, 0, 'morning', 0.0);

-- Day 7 (Yesterday)
INSERT INTO deliveries (customer_id, customer_name, date, session, scheduled_quantity, delivered_quantity, delivered, `leave`, delivery_shift, extra_milk) VALUES
(1, 'Rajesh Kumar', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(2, 'Srinivas Rao', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'morning', 1.5, 1.5, 1, 0, 'morning', 0.0),
(3, 'Venkat Reddy', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'evening', 3.0, 3.0, 1, 0, 'evening', 0.0),
(4, 'Lakshmi Devi', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'morning', 1.0, 1.0, 1, 0, 'morning', 0.0),
(5, 'Krishna Murthy', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'evening', 2.5, 2.5, 1, 0, 'evening', 0.0),
(7, 'Suresh Babu', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(8, 'Anjali Sharma', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'evening', 1.5, 1.5, 1, 0, 'evening', 0.0),
(9, 'Prakash Reddy', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'morning', 3.5, 3.5, 1, 0, 'morning', 0.0),
(10, 'Meena Kumari', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'morning', 2.0, 2.0, 1, 0, 'morning', 0.0),
(12, 'Sanjay Patel', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'morning', 2.5, 2.5, 1, 0, 'morning', 0.0);

-- ==================== BILLS (Current Month) ====================
INSERT INTO bills (customer_id, customer_name, bill_month, bill_year, bill_start_date, bill_end_date, total_quantity, total_amount, sent_to_customer, paid, payment_date, amount_paid, balance, outstanding_balance) VALUES
(1, 'Rajesh Kumar', MONTH(CURDATE()), YEAR(CURDATE()), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-01'), DATE_SUB(LAST_DAY(CURDATE()), INTERVAL 1 DAY), 14.0, 840.00, 1, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 840.00, 0.00, 0.00),
(2, 'Srinivas Rao', MONTH(CURDATE()), YEAR(CURDATE()), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-01'), DATE_SUB(LAST_DAY(CURDATE()), INTERVAL 1 DAY), 10.0, 580.00, 1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 580.00, 0.00, 0.00),
(3, 'Venkat Reddy', MONTH(CURDATE()), YEAR(CURDATE()), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-01'), DATE_SUB(LAST_DAY(CURDATE()), INTERVAL 1 DAY), 20.0, 1240.00, 1, 0, NULL, 0.00, 1240.00, 0.00),
(4, 'Lakshmi Devi', MONTH(CURDATE()), YEAR(CURDATE()), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-01'), DATE_SUB(LAST_DAY(CURDATE()), INTERVAL 1 DAY), 6.0, 330.00, 1, 1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 330.00, 0.00, 0.00),
(5, 'Krishna Murthy', MONTH(CURDATE()), YEAR(CURDATE()), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-01'), DATE_SUB(LAST_DAY(CURDATE()), INTERVAL 1 DAY), 15.0, 900.00, 1, 0, NULL, 0.00, 900.00, 0.00),
(7, 'Suresh Babu', MONTH(CURDATE()), YEAR(CURDATE()), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-01'), DATE_SUB(LAST_DAY(CURDATE()), INTERVAL 1 DAY), 12.0, 708.00, 1, 0, NULL, 0.00, 708.00, 0.00),
(8, 'Anjali Sharma', MONTH(CURDATE()), YEAR(CURDATE()), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-01'), DATE_SUB(LAST_DAY(CURDATE()), INTERVAL 1 DAY), 10.0, 580.00, 1, 0, NULL, 0.00, 580.00, 0.00),
(9, 'Prakash Reddy', MONTH(CURDATE()), YEAR(CURDATE()), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-01'), DATE_SUB(LAST_DAY(CURDATE()), INTERVAL 1 DAY), 24.5, 1568.00, 1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1600.00, 0.00, 32.00),
(10, 'Meena Kumari', MONTH(CURDATE()), YEAR(CURDATE()), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-01'), DATE_SUB(LAST_DAY(CURDATE()), INTERVAL 1 DAY), 12.0, 720.00, 1, 0, NULL, 0.00, 720.00, 0.00),
(12, 'Sanjay Patel', MONTH(CURDATE()), YEAR(CURDATE()), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '%Y-%m-01'), DATE_SUB(LAST_DAY(CURDATE()), INTERVAL 1 DAY), 17.5, 1067.50, 1, 0, NULL, 0.00, 1067.50, 0.00);

-- ==================== PAYMENTS ====================
INSERT INTO payments (bill_id, customer_id, amount_paid, change_given, payment_method, is_partial, is_full_with_change, change_amount, payment_date) VALUES
(1, 1, 840.00, 0.00, 'cash', 0, 0, 0.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(2, 2, 580.00, 0.00, 'cash', 0, 0, 0.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(4, 4, 330.00, 0.00, 'cash', 0, 0, 0.00, DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
(6, 9, 1600.00, 32.00, 'cash', 0, 1, 32.00, DATE_SUB(CURDATE(), INTERVAL 1 DAY));

-- ==================== EXPENSES ====================
INSERT INTO expenses (category, amount, description, expense_date) VALUES
('Transport', 500.00, 'Fuel for delivery vehicle', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
('Maintenance', 1200.00, 'Milk container cleaning supplies', DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
('Transport', 300.00, 'Vehicle servicing', DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
('Miscellaneous', 200.00, 'Packaging materials', DATE_SUB(CURDATE(), INTERVAL 2 DAY));

-- ==================== MILK PRICE HISTORY ====================
INSERT INTO milk_price_history (rate_per_liter, effective_date, reason) VALUES
(55.00, DATE_SUB(CURDATE(), INTERVAL 180 DAY), 'Initial rate'),
(58.00, DATE_SUB(CURDATE(), INTERVAL 90 DAY), 'Seasonal adjustment'),
(60.00, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'Market rate increase');

-- Verify data
SELECT 'Customers created:' as Info, COUNT(*) as Count FROM customers;
SELECT 'Deliveries created:' as Info, COUNT(*) as Count FROM deliveries;
SELECT 'Bills created:' as Info, COUNT(*) as Count FROM bills;
SELECT 'Payments created:' as Info, COUNT(*) as Count FROM payments;
SELECT 'Expenses created:' as Info, COUNT(*) as Count FROM expenses;
