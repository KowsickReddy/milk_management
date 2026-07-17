// ── Bill Service ──────────────────────────────────────────────────────────
// Business logic for bill generation and management

const { AppError } = require('../middleware/errorHandler');
const BillRepository = require('../repositories/billRepository');
const CustomerRepository = require('../repositories/customerRepository');
const DeliveryRepository = require('../repositories/deliveryRepository');
const LeaveRepository = require('../repositories/leaveRepository');
const { getPool } = require('../config/database');

const BillService = {
  async getAll({ customerId, paid } = {}) {
    return await BillRepository.findAll({ customerId, paid });
  },

  async getById(id) {
    const bill = await BillRepository.findById(id);
    if (!bill) throw new AppError('Bill not found', 404, 'NOT_FOUND');
    return bill;
  },

  async create(data) {
    const { customer_id, bill_month, bill_year } = data;
    if (!customer_id || !bill_month || !bill_year) {
      throw new AppError('customer_id, bill_month, and bill_year are required', 400, 'VALIDATION_ERROR');
    }
    if (bill_month < 1 || bill_month > 12) {
      throw new AppError('bill_month must be between 1 and 12', 400, 'VALIDATION_ERROR');
    }
    if (bill_year < 2000 || bill_year > 2100) {
      throw new AppError('Invalid bill_year', 400, 'VALIDATION_ERROR');
    }
    return await BillRepository.create(data);
  },

  /**
   * Generate a bill for a single customer for a given month/year
   * Uses manual transaction management to coordinate multiple table updates
   */
  async generateBill(customerId, month, year) {
    const billMonth = Number(month);
    const billYear = Number(year);

    if (!month || !year || isNaN(billMonth) || isNaN(billYear)) {
      throw new AppError('month and year are required', 400, 'VALIDATION_ERROR');
    }
    if (billMonth < 1 || billMonth > 12 || billYear < 2000 || billYear > 2100) {
      throw new AppError('Invalid month or year', 400, 'VALIDATION_ERROR');
    }

    const startDate = `${billYear}-${String(billMonth).padStart(2, '0')}-01`;
    const endDate = new Date(billYear, billMonth, 0).toISOString().split('T')[0];

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const customer = await CustomerRepository.getCustomerWithCredit(customerId);
      if (!customer) throw new AppError('Customer not found', 404, 'NOT_FOUND');

      const defaultQty = Number(customer.default_milk_quantity || customer.daily_milk_quantity || 0);
      const totalDays = Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
      const scheduledMilk = defaultQty * totalDays;
      const periods = JSON.stringify([{
        start: startDate,
        end: endDate,
        qty: defaultQty,
        days: totalDays,
        total: scheduledMilk,
      }]);

      // Calculate totals from deliveries (pg returns { rows, ... }, not array)
      const totals = await client.query(
        `SELECT
          COALESCE(SUM(d.delivered_quantity), 0) AS total_delivered,
          COALESCE(SUM(d.extra_milk), 0) AS total_extra,
          COUNT(DISTINCT CASE WHEN d.extra_milk > 0 THEN d.date END) AS extra_days,
          COUNT(DISTINCT d.date) AS delivery_days
         FROM deliveries d
         WHERE d.customer_id = $1
           AND d.is_deleted = FALSE
           AND d.status IN ('delivered', 'extra')
           AND d.date BETWEEN $2::date AND $3::date
           AND NOT EXISTS (
             SELECT 1 FROM leave_requests lr
             WHERE lr.customer_id = d.customer_id
               AND d.date BETWEEN lr.start_date AND lr.end_date
           )`,
        [customerId, startDate, endDate]
      );

      // Delivery-based leave days
      const deliveryLeaveRows = await client.query(
        `SELECT COUNT(DISTINCT d.date) AS leave_days
         FROM deliveries d
         WHERE d.customer_id = $1
           AND d.is_deleted = FALSE
           AND d.status = 'leave'
           AND d.date BETWEEN $2::date AND $3::date`,
        [customerId, startDate, endDate]
      );

      // Long leave days
      const longLeaveDays = await LeaveRepository.getLeaveDaysInRange(customerId, startDate, endDate, client);

      const totalDelivered = Number(totals.rows[0].total_delivered || 0);
      const totalExtra = Number(totals.rows[0].total_extra || 0);
      const totalQuantity = totalDelivered + totalExtra;
      const billAmount = Number((totalQuantity * Number(customer.milk_rate_per_liter || 0)).toFixed(2));
      const credit = Number(customer.credit_balance || 0);
      const creditUsed = Number(Math.min(credit, billAmount).toFixed(2));
      const finalAmount = Number(Math.max(0, billAmount - creditUsed).toFixed(2));
      const remainingCredit = Number(Math.max(0, credit - creditUsed).toFixed(2));
      const leaveDays = Number(deliveryLeaveRows.rows[0].leave_days || 0) + Number(longLeaveDays);
      const extraDays = Number(totals.rows[0].extra_days || 0);

      // Update customer credit balance
      await client.query(
        'UPDATE customers SET credit_balance = $1 WHERE id = $2',
        [remainingCredit, customerId]
      );

      // Upsert bill
      const result = await BillRepository.upsert(
        customerId, customer.name, billMonth, billYear, startDate, endDate,
        totalQuantity, billAmount, finalAmount, leaveDays, extraDays,
        totalExtra, periods, client
      );

      await client.query('COMMIT');

      const rows = await client.query('SELECT * FROM bills WHERE id = $1', [result.id]);
      return { ...rows.rows[0], ...result };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async generateBatch(month, year) {
    const activeCustomers = await CustomerRepository.findActiveCustomers();
    const results = [];

    for (const customer of activeCustomers) {
      try {
        const res = await this.generateBill(customer.id, month, year);
        results.push({ customer_id: customer.id, success: true, ...res });
      } catch (err) {
        results.push({ customer_id: customer.id, success: false, error: err.message });
      }
    }

    return { success: true, processed: results.length, details: results };
  },

  async getUnpaidWithCredit() {
    return await BillRepository.getUnpaidWithCredit();
  },

  async update(id, data) {
    const updated = await BillRepository.update(id, data);
    if (!updated) throw new AppError('Bill not found', 404, 'NOT_FOUND');
    return await BillRepository.findById(id);
  },

  async delete(id) {
    const deleted = await BillRepository.delete(id);
    if (!deleted) throw new AppError('Bill not found', 404, 'NOT_FOUND');
    return { success: true };
  },
};

module.exports = BillService;
