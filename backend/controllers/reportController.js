// ── Report Controller ─────────────────────────────────────────────────────

const ReportService = require('../services/reportService');
const asyncHandler = require('../middleware/asyncHandler');

const reportController = {
  getDaily: asyncHandler(async (req, res) => {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const report = await ReportService.getDaily(date);
    res.json(report);
  }),

  getMonthly: asyncHandler(async (req, res) => {
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || (new Date().getMonth() + 1);
    const report = await ReportService.getMonthly(year, month);
    res.json(report);
  }),

  getCustomerReport: asyncHandler(async (req, res) => {
    const report = await ReportService.getCustomerReport(req.params.id, req.query);
    res.json(report);
  }),
};

module.exports = reportController;
