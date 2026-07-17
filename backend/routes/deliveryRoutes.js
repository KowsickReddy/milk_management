// ── Delivery Routes ──────────────────────────────────────────────────────

const { Router } = require('express');
const deliveryController = require('../controllers/deliveryController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);
router.use(requireRole('admin', 'worker'));

router.get('/',         deliveryController.getAll);
router.post('/',        deliveryController.create);
router.post('/batch',   deliveryController.createBatch);
router.patch('/:id/soft-delete', deliveryController.softDelete);

module.exports = router;
