// ── User Routes ──────────────────────────────────────────────────────────

const { Router } = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/',    requireRole('admin'), userController.getAll);
router.post('/',   requireRole('admin'), userController.create);
router.put('/:id', requireRole('admin'), userController.update);
router.delete('/:id', requireRole('admin'), userController.delete);

module.exports = router;
