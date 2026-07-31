// ── Cattle Controller ─────────────────────────────────────────────────────

const CattleService = require('../services/cattleService');
const asyncHandler = require('../middleware/asyncHandler');

const cattleController = {
  getAll: asyncHandler(async (req, res) => {
    const cattle = await CattleService.getAll();
    res.json(cattle);
  }),

  create: asyncHandler(async (req, res) => {
    const result = await CattleService.create(req.body);
    res.status(201).json(result);
  }),

  update: asyncHandler(async (req, res) => {
    const cattle = await CattleService.update(req.params.id, req.body);
    res.json(cattle);
  }),

  delete: asyncHandler(async (req, res) => {
    await CattleService.delete(req.params.id);
    res.json({ success: true });
  }),
};

module.exports = cattleController;
