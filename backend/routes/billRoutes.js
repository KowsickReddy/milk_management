// ── Bill Routes ──────────────────────────────────────────────────────────
// IMPORTANT: Specific routes must be registered BEFORE parameterized /:id routes

const { Router } = require('express');
const billController = require('../controllers/billController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

// Admin/Worker routes
router.get('/unpaid-with-credit', requireRole('admin', 'worker'), billController.getUnpaidWithCredit);
router.post('/generate',          requireRole('admin', 'worker'), billController.generate);
router.post('/generate-batch',    requireRole('admin', 'worker'), billController.generateBatch);

// Admin-only maintenance (bulk delete). MUST be before /:id routes.
router.post('/delete-bulk',     requireRole('admin'), billController.deleteMany);
router.post('/delete-all',      requireRole('admin'), billController.deleteAll);
router.post('/delete-filtered', requireRole('admin'), billController.deleteFiltered);

// CRUD
router.get('/',    requireRole('admin', 'worker'), billController.getAll);
router.post('/',   requireRole('admin', 'worker'), billController.create);
router.get('/:id', requireRole('admin', 'worker'), billController.getById);
router.put('/:id', requireRole('admin', 'worker'), billController.update);
router.delete('/:id', requireRole('admin'), billController.delete);

module.exports = router;
