// ── Leave Routes ─────────────────────────────────────────────────────────

const { Router } = require('express');
const leaveController = require('../controllers/leaveController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/',    requireRole('admin', 'worker'), leaveController.getAll);
router.post('/',   requireRole('admin', 'worker'), leaveController.create);
router.delete('/:id', requireRole('admin', 'worker'), leaveController.delete);

module.exports = router;
