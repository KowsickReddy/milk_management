// ── Portal Service ────────────────────────────────────────────────────────
// Business logic for customer portal operations

const { AppError } = require('../middleware/errorHandler');
const PortalRepository = require('../repositories/portalRepository');
const ComplaintRepository = require('../repositories/complaintRepository');
const { sendTelegramNotification } = require('../utils/telegram');
const { withTransaction } = require('../config/database');

const PortalService = {
  async getDashboard(customerId) {
    const data = await PortalRepository.getDashboard(customerId);
    if (!data) throw new AppError('Customer not found', 404, 'NOT_FOUND');
    return data;
  },

  async getDeliveries(customerId) {
    return await PortalRepository.getDeliveries(customerId);
  },

  async getBills(customerId) {
    return await PortalRepository.getBills(customerId);
  },

  async updateQuantity(customerId, date, quantity, session) {
    if (quantity === undefined || isNaN(parseFloat(quantity)) || parseFloat(quantity) < 0) {
      throw new AppError('Valid positive quantity is required', 400, 'VALIDATION_ERROR');
    }

    return await withTransaction(async (connection) => {
      const { customer } = await PortalRepository.updateQuantity(customerId, date, quantity, session, connection);

      // Create alert for admin
      const alertMsg = `Customer #${customerId} ${customer.name} (${customer.phone || 'No Phone'}) updated quantity to ${quantity}L for ${date}`;
      await ComplaintRepository.createAlert('customer_update', alertMsg, connection);

      // Send Telegram Notification
      await sendTelegramNotification(`🔔 <b>Quantity Update</b>\n${alertMsg}`);

      return { success: true };
    });
  },

  async createComplaint(customerId, subject, message) {
    if (!subject || !message) {
      throw new AppError('Subject and message are required', 400, 'VALIDATION_ERROR');
    }

    return await withTransaction(async (connection) => {
      const customer = await PortalRepository.createComplaint(customerId, subject, message, connection);

      // Create alert for admin
      const alertMsg = `New Complaint from #${customerId} ${customer.name} (${customer.phone || 'No Phone'}): ${subject}`;
      await ComplaintRepository.createAlert('complaint', alertMsg, connection);

      // Send Telegram Notification
      await sendTelegramNotification(`🚨 <b>New Complaint</b>\n${alertMsg}\n\n<i>Message: ${message}</i>`);

      return { success: true };
    });
  },
};

module.exports = PortalService;
