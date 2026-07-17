// ── Cattle Routes ────────────────────────────────────────────────────────

const { Router } = require('express');
const cattleController = require('../controllers/cattleController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);
router.use(requireRole('admin', 'worker'));

router.get('/',    cattleController.getAll);
router.post('/',   cattleController.create);
router.put('/:id', cattleController.update);
router.delete('/:id', requireRole('admin'), cattleController.delete);

module.exports = router;
