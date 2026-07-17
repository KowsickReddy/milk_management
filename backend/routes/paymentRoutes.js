// ── Payment Routes ───────────────────────────────────────────────────────

const { Router } = require('express');
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/',             requireRole('admin', 'worker'), paymentController.getAll);
router.get('/bill/:billId', requireRole('admin', 'worker'), paymentController.getByBill);
router.post('/',            requireRole('admin', 'worker'), paymentController.create);

module.exports = router;
