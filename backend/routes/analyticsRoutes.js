// ── Analytics Routes ─────────────────────────────────────────────────────

const { Router } = require('express');
const analyticsController = require('../controllers/analyticsController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.use(authenticate);
router.use(requireRole('admin', 'worker'));

router.get('/dashboard', analyticsController.getDashboard);
router.get('/earnings',  analyticsController.getEarnings);
router.get('/farm',      analyticsController.getFarmStats);

module.exports = router;
