// ── Leave Service ─────────────────────────────────────────────────────────
// Business logic for leave request operations

const { AppError } = require('../middleware/errorHandler');
const LeaveRepository = require('../repositories/leaveRepository');

const LeaveService = {
  async getAll({ customerId } = {}) {
    return await LeaveRepository.findAll({ customerId });
  },

  async create(data) {
    const { customer_id, start_date, end_date, reason } = data;

    if (!customer_id || !start_date) {
      throw new AppError('customer_id and start_date are required', 400, 'VALIDATION_ERROR');
    }

    if (end_date && new Date(start_date) > new Date(end_date)) {
      throw new AppError('start_date cannot be after end_date', 400, 'VALIDATION_ERROR');
    }

    const today = new Date().toISOString().split('T')[0];
    if (start_date < today) {
      throw new AppError('Leave cannot be applied for past dates', 400, 'VALIDATION_ERROR');
    }

    return await LeaveRepository.create(data);
  },

  async delete(id) {
    const deleted = await LeaveRepository.delete(id);
    if (!deleted) throw new AppError('Leave request not found', 404, 'NOT_FOUND');
    return { success: true, message: 'Leave request deleted' };
  },
};

module.exports = LeaveService;
