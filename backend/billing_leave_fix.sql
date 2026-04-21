USE milk_management_db;

CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10,2) DEFAULT 0;

ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS status ENUM('delivered','leave','extra') DEFAULT 'delivered' AFTER delivered_quantity,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE AFTER delivery_shift;

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(10,2) DEFAULT 0 AFTER total_quantity,
  ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10,2) DEFAULT 0 AFTER gross_amount,
  ADD COLUMN IF NOT EXISTS leave_days INT DEFAULT 0 AFTER final_amount,
  ADD COLUMN IF NOT EXISTS extra_days INT DEFAULT 0 AFTER leave_days,
  ADD COLUMN IF NOT EXISTS total_extra_milk DECIMAL(10,2) DEFAULT 0 AFTER extra_days;

ALTER TABLE bills
  MODIFY total_amount DECIMAL(10,2) DEFAULT 0,
  MODIFY final_amount DECIMAL(10,2) DEFAULT 0,
  MODIFY total_quantity DECIMAL(10,2) DEFAULT 0,
  MODIFY amount_paid DECIMAL(10,2) DEFAULT 0,
  MODIFY balance DECIMAL(10,2) DEFAULT 0;

CREATE INDEX idx_leave_requests_customer_dates ON leave_requests (customer_id, start_date, end_date);
CREATE INDEX idx_deliveries_bill_generation ON deliveries (customer_id, date, is_deleted, status);
