// ── Expense Service ───────────────────────────────────────────────────────
// Business logic for expense operations

const { AppError } = require('../middleware/errorHandler');
const ExpenseRepository = require('../repositories/expenseRepository');

const ExpenseService = {
  async getAll({ startDate, endDate } = {}) {
    return await ExpenseRepository.findAll({ startDate, endDate });
  },

  async create(data) {
    const { category, amount, expense_date } = data;
    if (!category || !amount || !expense_date) {
      throw new AppError('Category, amount, and date are required', 400, 'VALIDATION_ERROR');
    }
    return await ExpenseRepository.create(data);
  },

  async update(id, data) {
    const { category, amount, expense_date } = data;
    if (!category || !amount || !expense_date) {
      throw new AppError('Category, amount, and date are required', 400, 'VALIDATION_ERROR');
    }
    const result = await ExpenseRepository.update(id, data);
    if (!result) throw new AppError('Expense not found', 404, 'NOT_FOUND');
    return result;
  },

  async delete(id) {
    const deleted = await ExpenseRepository.delete(id);
    if (!deleted) throw new AppError('Expense not found', 404, 'NOT_FOUND');
    return { success: true };
  },
};

module.exports = ExpenseService;
