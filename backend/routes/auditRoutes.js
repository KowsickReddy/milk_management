const { Router } = require('express');
const auditController = require('../controllers/auditController');
const authenticate = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

const router = Router();

router.get('/logs', authenticate, requireRole('admin'), auditController.getLogs);
router.get('/logs/user/:userId', authenticate, requireRole('admin'), auditController.getLogsByUser);
router.get('/logs/entity/:entityType/:entityId', authenticate, requireRole('admin'), auditController.getLogsByEntity);

module.exports = router;
