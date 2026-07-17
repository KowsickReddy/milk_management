// ── Delivery Service ──────────────────────────────────────────────────────
// Business logic for delivery operations

const { AppError } = require('../middleware/errorHandler');
const DeliveryRepository = require('../repositories/deliveryRepository');
const LeaveRepository = require('../repositories/leaveRepository');

const DeliveryService = {
  async getAll({ date, customerId, startDate, endDate } = {}) {
    // Single-date query with leave overlay
    if (date && !startDate && !endDate) {
      return await DeliveryRepository.getWithLeaveOverlay({ date, customerId });
    }
    // Date-range query (charts/reports)
    return await DeliveryRepository.findAll({ date, customerId, startDate, endDate });
  },

  async create(data) {
    const { customer_id, date, delivery_shift, status } = data;

    if (!customer_id || !date) {
      throw new AppError('customer_id and date are required', 400, 'VALIDATION_ERROR');
    }

    // Validate delivery state
    if (data.delivered && data.leave) {
      throw new AppError('Delivery cannot be both delivered and leave', 400, 'VALIDATION_ERROR');
    }

    // Validate quantities
    const baseQuantity = Number(data.delivered_quantity || 0);
    const extraQuantity = Number(data.extra_milk || 0);
    if (isNaN(baseQuantity) || isNaN(extraQuantity)) {
      throw new AppError('Invalid quantity values', 400, 'VALIDATION_ERROR');
    }
    if (baseQuantity < 0 || extraQuantity < 0) {
      throw new AppError('Quantities cannot be negative', 400, 'VALIDATION_ERROR');
    }

    // Check long leave conflict
    const leaveConflict = await LeaveRepository.findOverlapping(customer_id, date);
    if (leaveConflict && status !== 'leave') {
      throw new AppError('Customer is on long leave for this date', 400, 'VALIDATION_ERROR');
    }

    return await DeliveryRepository.upsert(data);
  },

  async createBatch(deliveries) {
    if (!Array.isArray(deliveries)) {
      throw new AppError('Deliveries must be an array', 400, 'VALIDATION_ERROR');
    }
    return await DeliveryRepository.upsertBatch(deliveries);
  },

  async softDelete(id) {
    const deleted = await DeliveryRepository.softDelete(id);
    if (!deleted) throw new AppError('Delivery record not found', 404, 'NOT_FOUND');
    return { success: true, message: 'Delivery removed from view' };
  },
};

module.exports = DeliveryService;
