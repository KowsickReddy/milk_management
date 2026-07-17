// ── Report Routes ────────────────────────────────────────────────────────

const { Router } = require('express');
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);
router.use(requireRole('admin', 'worker'));

router.get('/daily',      reportController.getDaily);
router.get('/monthly',    reportController.getMonthly);
router.get('/customer/:id', reportController.getCustomerReport);

module.exports = router;
