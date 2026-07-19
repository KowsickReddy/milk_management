const auditService = require('../services/auditService');
const asyncHandler = require('../middlewares/asyncHandler');

const auditController = {
  getLogs: asyncHandler(async (req, res) => {
    const { limit, offset } = req.query;
    const logs = await auditService.getLogs({
      limit: parseInt(limit, 10) || 100,
      offset: parseInt(offset, 10) || 0,
    });
    const total = await auditService.getCount();
    res.json({ logs, total });
  }),

  getLogsByUser: asyncHandler(async (req, res) => {
    const logs = await auditService.getLogsByUser(parseInt(req.params.userId, 10));
    res.json(logs);
  }),

  getLogsByEntity: asyncHandler(async (req, res) => {
    const { entityType, entityId } = req.params;
    const logs = await auditService.getLogsByEntity(entityType, parseInt(entityId, 10));
    res.json(logs);
  }),
};

module.exports = auditController;
