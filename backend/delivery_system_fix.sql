USE milk_management_db;

ALTER TABLE deliveries
  ADD COLUMN IF NOT EXISTS status ENUM('delivered','leave','extra') DEFAULT 'delivered' AFTER delivered_quantity,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE AFTER delivery_shift;

UPDATE deliveries
SET status = CASE
  WHEN `leave` = TRUE THEN 'leave'
  WHEN COALESCE(extra_milk, 0) > 0 THEN 'extra'
  ELSE 'delivered'
END
WHERE status IS NULL OR status = 'delivered';

ALTER TABLE deliveries
  DROP COLUMN IF EXISTS delivered,
  DROP COLUMN IF EXISTS `leave`;

CREATE INDEX idx_deliveries_active_date ON deliveries (is_deleted, date);
CREATE INDEX idx_deliveries_customer_date ON deliveries (customer_id, date);
