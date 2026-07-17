// ── Admin Routes ─────────────────────────────────────────────────────────

const { Router } = require('express');
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/login-logs',  requireRole('admin'), adminController.getLoginLogs);
router.get('/complaints',  requireRole('admin', 'worker'), adminController.getComplaints);
router.get('/alerts',      requireRole('admin', 'worker'), adminController.getAlerts);

module.exports = router;
