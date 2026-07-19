const { Router } = require('express');
const auditController = require('../controllers/auditController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

const router = Router();

router.get('/logs', authenticateToken, requireRole(['admin']), auditController.getLogs);
router.get('/logs/user/:userId', authenticateToken, requireRole(['admin']), auditController.getLogsByUser);
router.get('/logs/entity/:entityType/:entityId', authenticateToken, requireRole(['admin']), auditController.getLogsByEntity);

module.exports = router;
