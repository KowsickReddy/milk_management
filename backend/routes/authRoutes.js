// ── Auth Routes ──────────────────────────────────────────────────────────

const { Router } = require('express');
const authController = require('../controllers/authController');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = Router();

// Login endpoints with rate limiting
router.post('/users/login', rateLimiter(), authController.loginUser);
router.post('/customers/login', rateLimiter(), authController.loginCustomer);

module.exports = router;
