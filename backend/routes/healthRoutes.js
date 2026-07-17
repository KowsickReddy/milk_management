// ── Health Routes ────────────────────────────────────────────────────────

const { Router } = require('express');
const healthController = require('../controllers/healthController');

const router = Router();

router.get('/health', healthController.health);
router.get('/api/health', healthController.health);

module.exports = router;
