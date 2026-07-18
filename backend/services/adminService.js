// ── Admin Service ─────────────────────────────────────────────────────────
// Business logic for admin operations (logs, complaints, alerts)

const { AppError } = require('../middleware/errorHandler');
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

  async updateComplaintStatus(id, status) {
    const validStatuses = ['open', 'pending', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400, 'VALIDATION_ERROR');
    }
    const complaint = await ComplaintRepository.updateStatus(id, status);
    if (!complaint) throw new AppError('Complaint not found', 404, 'NOT_FOUND');
    return complaint;
  },
};

module.exports = AdminService;
