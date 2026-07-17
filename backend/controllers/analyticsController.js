// ── Analytics Controller ──────────────────────────────────────────────────

const AnalyticsService = require('../services/analyticsService');
const asyncHandler = require('../middleware/asyncHandler');

const analyticsController = {
  getDashboard: asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getDashboard();
    res.json(data);
  }),

  getEarnings: asyncHandler(async (req, res) => {
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || (new Date().getMonth() + 1);
    const data = await AnalyticsService.getEarnings(year, month);
    res.json(data);
  }),

  getStats: asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getStats();
    res.json(data);
  }),

  getFarmStats: asyncHandler(async (req, res) => {
    const data = await AnalyticsService.getFarmStats();
    res.json(data);
  }),
};

module.exports = analyticsController;
