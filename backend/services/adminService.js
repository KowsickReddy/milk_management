// ── Admin Service ─────────────────────────────────────────────────────────
// Business logic for admin operations (logs, complaints, alerts)

const LogRepository = require('../repositories/logRepository');
const ComplaintRepository = require('../repositories/complaintRepository');

const AdminService = {
  async getLoginLogs() {
    return await LogRepository.getLoginLogs();
  },

  async getComplaints() {
    return await ComplaintRepository.findAll();
  },

  async getAlerts() {
    return await ComplaintRepository.getAlerts();
  },
};

module.exports = AdminService;
