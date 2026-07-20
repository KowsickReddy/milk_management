const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

// Customer forgot PIN request - sends request to admin
router.post('/forgot-pin', asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  const pool = getPool();
  const [customer] = (await pool.query('SELECT id, name FROM customers WHERE phone = $1 AND status = $2', [phone, 'active'])).rows;

  if (!customer) {
    // Don't reveal if the phone exists or not - just confirm
    return res.json({ message: 'If the phone is registered, a reset request has been forwarded to the admin.' });
  }

  // Create a notification/complaint-like record for the admin to handle
  await pool.query(
    `INSERT INTO complaints (customer_id, subject, message, status) 
     VALUES ($1, $2, $3, $4)`,
    [customer.id, '🔐 PIN Reset Request', 
     `Customer #${customer.id} ${customer.name} has requested a PIN reset for phone ${phone}. Please update their portal access PIN.`,
     'pending']
  );

  res.json({ message: 'If the phone is registered, a reset request has been forwarded to the admin.' });
}));

// Admin: Reset customer PIN
router.post('/reset-customer-pin', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  const { customerId, newPin } = req.body;
  if (!customerId || !newPin || newPin.length < 4) {
    return res.status(400).json({ error: 'Customer ID and PIN (min 4 chars) required' });
  }

  const hashedPin = await bcrypt.hash(newPin, 10);
  const pool = getPool();
  await pool.query('UPDATE customers SET pin = $1 WHERE id = $2', [hashedPin, customerId]);

  res.json({ message: 'PIN reset successfully' });
}));

module.exports = router;
