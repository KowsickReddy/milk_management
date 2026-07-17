// ── Credit Routes ────────────────────────────────────────────────────────

const { Router } = require('express');
const creditController = require('../controllers/creditController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/:customerId', requireRole('admin', 'worker'), creditController.getCredit);
router.post('/apply',      requireRole('admin', 'worker'), creditController.applyCredit);

module.exports = router;
