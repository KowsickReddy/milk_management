// ── Portal Routes ────────────────────────────────────────────────────────

const { Router } = require('express');
const portalController = require('../controllers/portalController');
const authenticate = require('../middleware/authenticate');
const { requireSelfOrStaff } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/dashboard/:customerId',     requireSelfOrStaff('customerId'), portalController.getDashboard);
router.get('/deliveries/:customerId',    requireSelfOrStaff('customerId'), portalController.getDeliveries);
router.get('/bills/:customerId',         requireSelfOrStaff('customerId'), portalController.getBills);
router.get('/calendar/:customerId',      requireSelfOrStaff('customerId'), portalController.getCalendar);
router.post('/update-quantity',          requireSelfOrStaff('customer_id'), portalController.updateQuantity);
router.post('/complaints',               requireSelfOrStaff('customer_id'), portalController.createComplaint);

module.exports = router;
