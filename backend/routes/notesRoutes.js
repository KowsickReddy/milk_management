// ── Notes Routes ──────────────────────────────────────────────────────────

const { Router } = require('express');
const notesController = require('../controllers/notesController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

router.get('/',          requireRole('admin', 'worker'), notesController.getAll);
router.get('/:id',       requireRole('admin', 'worker'), notesController.getById);
router.post('/',         requireRole('admin', 'worker'), notesController.create);
router.put('/:id',       requireRole('admin', 'worker'), notesController.update);
router.delete('/:id',    requireRole('admin', 'worker'), notesController.delete);

module.exports = router;
