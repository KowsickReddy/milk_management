// ── Feed Routes ──────────────────────────────────────────────────────────

const { Router } = require('express');
const feedController = require('../controllers/feedController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);
router.use(requireRole('admin', 'worker'));

router.get('/',    feedController.getAll);
router.post('/',   feedController.create);
router.delete('/:id', feedController.delete);

module.exports = router;
