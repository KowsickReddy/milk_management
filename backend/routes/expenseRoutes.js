// ── Expense Routes ───────────────────────────────────────────────────────

const { Router } = require('express');
const expenseController = require('../controllers/expenseController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);
router.use(requireRole('admin', 'worker'));

router.get('/',    expenseController.getAll);
router.post('/',   expenseController.create);
router.put('/:id', expenseController.update);
router.delete('/:id', expenseController.delete);

module.exports = router;
