// ── Payment Service ──────────────────────────────────────────────────────
// Business logic for payment operations with transaction management

const { AppError } = require('../middleware/errorHandler');
const BillRepository = require('../repositories/billRepository');
const PaymentRepository = require('../repositories/paymentRepository');
const CustomerRepository = require('../repositories/customerRepository');
const { withTransaction } = require('../config/database');

const PaymentService = {
  async getAll({ customerId } = {}) {
    return await PaymentRepository.findAll({ customerId });
  },

  async getByBill(billId) {
    return await PaymentRepository.findByBillId(billId);
  },

  async create(data) {
    const billId = Number(data.bill_id);
    const paymentAmount = Number(data.amount_paid);

    if (!billId || isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new AppError('bill_id and valid positive amount_paid are required', 400, 'VALIDATION_ERROR');
    }

    return await withTransaction(async (connection) => {
      // Lock bill row for update
      const bills = await connection.query(
        'SELECT id, customer_id, total_amount, amount_paid, balance FROM bills WHERE id = $1 FOR UPDATE',
        [billId]
      );

      if (bills.rows.length === 0) throw new AppError('Bill not found', 404, 'NOT_FOUND');

      const bill = bills.rows[0];
      const customerId = Number(bill.customer_id);
      const currentBalance = Number(bill.balance || 0);
      const appliedToBill = Number(Math.min(paymentAmount, currentBalance).toFixed(2));
      const creditAdded = Number(Math.max(0, paymentAmount - currentBalance).toFixed(2));
      const newAmountPaid = Number((Number(bill.amount_paid || 0) + appliedToBill).toFixed(2));
      const newBalance = Number(Math.max(0, currentBalance - appliedToBill).toFixed(2));
      const isPaid = newBalance <= 0;

      // Create payment record
      const payResult = await PaymentRepository.create({
        bill_id: billId,
        customer_id: customerId,
        amount_paid: paymentAmount,
        change_given: creditAdded,
        payment_method: data.payment_method || 'cash',
        is_partial: paymentAmount < currentBalance,
        is_full_with_change: creditAdded > 0,
        change_amount: creditAdded,
      }, connection);

      // Update bill
      await connection.query(
        'UPDATE bills SET paid = $1, amount_paid = $2, balance = $3, payment_date = CURRENT_DATE WHERE id = $4',
        [isPaid, newAmountPaid, newBalance, billId]
      );

      // Update customer credit balance if overpaid
      if (creditAdded > 0) {
        await CustomerRepository.updateCreditBalance(customerId, creditAdded, connection);
      }

      // Get updated customer credit balance
      const creditData = await CustomerRepository.getCustomerWithCredit(customerId);

      return {
        id: payResult.id,
        success: true,
        bill_id: billId,
        customer_id: customerId,
        amount_paid: paymentAmount,
        applied_to_bill: appliedToBill,
        credit_added: creditAdded,
        wallet_added: creditAdded,
        new_balance: newBalance,
        customer_credit_balance: creditData?.credit_balance || 0,
        credit_balance: creditData?.credit_balance || 0,
        paid: isPaid,
        payment_method: data.payment_method || 'cash',
        message: creditAdded > 0 ? `₹${creditAdded.toFixed(2)} added to wallet` : 'Payment recorded',
      };
    });
  },
};

module.exports = PaymentService;
