// ── Credit Service ────────────────────────────────────────────────────────
// Business logic for credit/wallet operations

const { AppError } = require('../middleware/errorHandler');
const CreditRepository = require('../repositories/creditRepository');
const { withTransaction } = require('../config/database');

const CreditService = {
  async getCredit(customerId) {
    const data = await CreditRepository.getBalance(customerId);
    if (!data) throw new AppError('Customer not found', 404, 'NOT_FOUND');
    return { customer_id: customerId, credit_balance: data.credit_balance };
  },

  async applyCredit(customerId, billId, amount) {
    return await withTransaction(async () => {
      const result = await CreditRepository.applyCredit(customerId, billId, amount);
      return { message: `Credit of ₹${result.applied} applied`, applied: result.applied };
    });
  },
};

module.exports = CreditService;
