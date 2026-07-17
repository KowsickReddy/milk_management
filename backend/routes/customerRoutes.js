// ── Customer Routes ──────────────────────────────────────────────────────

const { Router } = require('express');
const customerController = require('../controllers/customerController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/',      requireRole('admin', 'worker'), customerController.getAll);
router.get('/:id',   requireRole('admin', 'worker'), customerController.getById);
router.post('/',     requireRole('admin', 'worker'), customerController.create);
router.put('/:id',   requireRole('admin', 'worker'), customerController.update);
router.delete('/:id', requireRole('admin'), customerController.delete);

// PIN management (admin only)
router.patch('/:id/pin', requireRole('admin'), customerController.updatePin);

module.exports = router;
