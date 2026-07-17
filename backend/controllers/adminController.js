// ── Admin Controller ──────────────────────────────────────────────────────

const AdminService = require('../services/adminService');
const asyncHandler = require('../middleware/asyncHandler');

const adminController = {
  getLoginLogs: asyncHandler(async (req, res) => {
    const logs = await AdminService.getLoginLogs();
    res.json(logs);
  }),

  getComplaints: asyncHandler(async (req, res) => {
    const complaints = await AdminService.getComplaints();
    res.json(complaints);
  }),

  getAlerts: asyncHandler(async (req, res) => {
    const alerts = await AdminService.getAlerts();
    res.json(alerts);
  }),
};

module.exports = adminController;
