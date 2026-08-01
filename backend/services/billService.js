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
   * Generate a bill for a single customer for a given month/year.
   *
   * Billing is based on the LITERS ACTUALLY DELIVERED in the month
   * (delivered_quantity + extra_milk from the deliveries table).
   *
   * Uses manual transaction management to coordinate multiple table updates.
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

    // Local-time month boundaries. NEVER use toISOString() here — it converts
    // to UTC and shifts the date back a day in UTC+ zones (e.g. India UTC+5:30),
    // which silently dropped the last day of the month from billing.
    const pad = (n) => String(n).padStart(2, '0');
    const startDate = `${billYear}-${pad(billMonth)}-01`;
    const lastDay = new Date(billYear, billMonth, 0).getDate();
    const endDate = `${billYear}-${pad(billMonth)}-${pad(lastDay)}`;

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const customer = await CustomerRepository.getCustomerWithCredit(customerId);
      if (!customer) throw new AppError('Customer not found', 404, 'NOT_FOUND');

      const defaultQty = Number(customer.default_milk_quantity || customer.daily_milk_quantity || 0);
      const totalDays = lastDay;
      const scheduledMilk = defaultQty * totalDays;
      const periods = JSON.stringify([{
        start: startDate,
        end: endDate,
        qty: defaultQty,
        days: totalDays,
        total: scheduledMilk,
      }]);

      // Total milk actually delivered in the month. Billing must follow the
      // liters delivered — a delivery row with status 'delivered'/'extra' means
      // milk was handed over, so leave-request overlap must NOT exclude it.
      // (Leave days are already represented as status='leave' rows.)
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
           AND d.date BETWEEN $2::date AND $3::date`,
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

      // 🛡️ NEVER create a dummy ₹0 bill. If nothing was delivered or no rate is
      // set, skip generation entirely — previously this produced a bill that was
      // auto-marked as PAID without any user interaction.
      if (totalQuantity <= 0) {
        await client.query('ROLLBACK');
        return {
          success: false, skipped: true,
          message: 'No milk delivered in this period',
          customer_id: customerId, bill_month: billMonth, bill_year: billYear,
        };
      }
      if (billAmount <= 0) {
        await client.query('ROLLBACK');
        return {
          success: false, skipped: true,
          message: 'Milk rate per liter is not set for this customer',
          customer_id: customerId, bill_month: billMonth, bill_year: billYear,
        };
      }

      // Check for an existing bill BEFORE touching credit. Wallet credit must
      // only be deducted once per month — re-generating a bill must reuse the
      // credit already applied, not deduct it again from the customer.
      const existingBill = await BillRepository.findByCustomerMonth(customerId, billMonth, billYear);

      let creditUsed = 0;
      let finalAmount = billAmount;
      if (existingBill) {
        // Regeneration: reuse the credit applied on the original bill.
        const appliedCredit = Math.max(0,
          Number(existingBill.gross_amount || 0) - Number(existingBill.final_amount || 0));
        creditUsed = Math.min(appliedCredit, billAmount);
        finalAmount = Number(Math.max(0, billAmount - creditUsed).toFixed(2));
        // If the corrected bill is SMALLER than the credit already applied
        // (it was deducted from the customer's wallet at creation), refund the
        // surplus so the customer doesn't lose wallet money on regeneration.
        if (appliedCredit > creditUsed) {
          const surplus = Number((appliedCredit - creditUsed).toFixed(2));
          await client.query(
            'UPDATE customers SET credit_balance = credit_balance + $1 WHERE id = $2',
            [surplus, customerId]
          );
        }
      } else {
        // New bill: auto-apply available wallet credit (deduct once).
        const credit = Number(customer.credit_balance || 0);
        creditUsed = Number(Math.min(credit, billAmount).toFixed(2));
        finalAmount = Number(Math.max(0, billAmount - creditUsed).toFixed(2));
        const remainingCredit = Number(Math.max(0, credit - creditUsed).toFixed(2));
        await client.query(
          'UPDATE customers SET credit_balance = $1 WHERE id = $2',
          [remainingCredit, customerId]
        );
      }

      const leaveDays = Number(deliveryLeaveRows.rows[0].leave_days || 0) + Number(longLeaveDays);
      const extraDays = Number(totals.rows[0].extra_days || 0);

      // Upsert bill (pass the already-fetched existing bill so it isn't re-queried)
      const result = await BillRepository.upsert(
        customerId, customer.name, billMonth, billYear, startDate, endDate,
        totalQuantity, billAmount, finalAmount, leaveDays, extraDays,
        totalExtra, periods, client, existingBill
      );

      // If the corrected bill is smaller than what the customer already paid in
      // cash, refund the difference to their wallet credit.
      const refund = Number(result.credit_refunded || 0);
      if (refund > 0) {
        await client.query(
          'UPDATE customers SET credit_balance = credit_balance + $1 WHERE id = $2',
          [refund, customerId]
        );
      }

      await client.query('COMMIT');

      const rows = await client.query('SELECT * FROM bills WHERE id = $1', [result.id]);
      return { ...rows.rows[0], ...result };
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) { /* already rolled back */ }
      throw err;
    } finally {
      client.release();
    }
  },

  async generateBatch(month, year) {
    const activeCustomers = await CustomerRepository.findActiveCustomers();
    const results = [];
    let processed = 0;
    let skipped = 0;

    for (const customer of activeCustomers) {
      try {
        const res = await this.generateBill(customer.id, month, year);
        if (res.skipped) {
          skipped++;
          results.push({ customer_id: customer.id, success: false, skipped: true, message: res.message });
        } else {
          processed++;
          results.push({ customer_id: customer.id, success: true, ...res });
        }
      } catch (err) {
        results.push({ customer_id: customer.id, success: false, error: err.message });
      }
    }

    return { success: true, processed, skipped, details: results };
  },

  async getUnpaidWithCredit() {
    return await BillRepository.getUnpaidWithCredit();
  },

  async update(id, data) {
    const updated = await BillRepository.update(id, data);
    if (!updated) throw new AppError('Bill not found', 404, 'NOT_FOUND');
    return await BillRepository.findById(id);
  },

  /**
   * Delete bill(s) and refund any wallet credit that was applied to them.
   *
   * When a bill was created, wallet credit (gross − final) was deducted from
   * the customer's credit_balance. Deleting that bill without refunding the
   * credit would silently lose the customer's wallet money — and worse, a
   * regeneration after deletion would treat the bill as new and deduct credit
   * AGAIN (double loss). This runs in a transaction: refund first, then delete.
   *
   * @param {{ ids?: number[], customerId?: number, paid?: boolean, billMonth?: number, billYear?: number }} criteria
   * @returns {{ success: boolean, deleted: number, refunded: number, refund_amount: number }}
   */
  async deleteWithRefund(criteria = {}) {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Which bills are we deleting? Compute the wallet credit to refund.
      const creditRows = await BillRepository.findCreditForDeletion(criteria, client);

      // 2. Refund applied credit per customer (credit_used = gross − final).
      const refundByCustomer = new Map();
      for (const row of creditRows) {
        const credit = Number(row.credit_used || 0);
        const customerId = row.customer_id;
        if (!customerId || credit <= 0) continue;
        refundByCustomer.set(customerId, (refundByCustomer.get(customerId) || 0) + credit);
      }
      let refundAmount = 0;
      for (const [customerId, amount] of refundByCustomer) {
        const rounded = Number(amount.toFixed(2));
        refundAmount += rounded;
        await client.query(
          'UPDATE customers SET credit_balance = credit_balance + $1 WHERE id = $2',
          [rounded, customerId]
        );
      }

      // 3. Delete the bills (all in the same transaction).
      let deleted = 0;
      if (criteria.ids && criteria.ids.length) {
        deleted = await BillRepository.deleteMany(criteria.ids, client);
      } else if (criteria.customerId || criteria.paid !== undefined || criteria.billMonth || criteria.billYear) {
        deleted = await BillRepository.deleteByFilters(criteria, client);
      } else {
        deleted = await BillRepository.deleteAll(client);
      }

      await client.query('COMMIT');
      return { success: true, deleted, refunded: refundByCustomer.size, refund_amount: Number(refundAmount.toFixed(2)) };
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch (_) { /* already rolled back */ }
      throw err;
    } finally {
      client.release();
    }
  },

  async delete(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new AppError('Invalid bill ID', 400, 'VALIDATION_ERROR');
    }
    const result = await this.deleteWithRefund({ ids: [numericId] });
    if (!result.deleted) throw new AppError('Bill not found', 404, 'NOT_FOUND');
    return { success: true, deleted: result.deleted, refunded: result.refunded, refund_amount: result.refund_amount };
  },

  async deleteMany(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('ids array is required', 400, 'VALIDATION_ERROR');
    }
    const clean = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
    if (clean.length === 0) {
      throw new AppError('ids must be valid bill IDs', 400, 'VALIDATION_ERROR');
    }
    const result = await this.deleteWithRefund({ ids: clean });
    return { success: true, deleted: result.deleted, refunded: result.refunded, refund_amount: result.refund_amount };
  },

  async deleteAll() {
    const result = await this.deleteWithRefund({});
    return { success: true, deleted: result.deleted, refunded: result.refunded, refund_amount: result.refund_amount };
  },

  async deleteByFilters(filters = {}) {
    const { customerId, paid, billMonth, billYear } = filters;
    // Normalize & validate the optional filters
    const clean = {
      customerId: customerId ? Number(customerId) : undefined,
      paid: paid === 'true' || paid === true ? true : paid === 'false' || paid === false ? false : undefined,
      billMonth: billMonth ? Number(billMonth) : undefined,
      billYear: billYear ? Number(billYear) : undefined,
    };
    const result = await this.deleteWithRefund(clean);
    return { success: true, deleted: result.deleted, refunded: result.refunded, refund_amount: result.refund_amount };
  },
};

module.exports = BillService;
