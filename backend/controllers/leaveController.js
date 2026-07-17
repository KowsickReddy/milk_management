// ── Leave Controller ──────────────────────────────────────────────────────

const LeaveService = require('../services/leaveService');
const asyncHandler = require('../middleware/asyncHandler');

const leaveController = {
  getAll: asyncHandler(async (req, res) => {
    const { customerId } = req.query;
    const leaves = await LeaveService.getAll({ customerId });
    res.json(leaves);
  }),

  create: asyncHandler(async (req, res) => {
    const leave = await LeaveService.create(req.body);
    res.status(201).json(leave);
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await LeaveService.delete(req.params.id);
    res.json(result);
  }),
};

module.exports = leaveController;
