// ── Expense Controller ────────────────────────────────────────────────────

const ExpenseService = require('../services/expenseService');
const asyncHandler = require('../middleware/asyncHandler');

const expenseController = {
  getAll: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const expenses = await ExpenseService.getAll({ startDate, endDate });
    res.json(expenses);
  }),

  create: asyncHandler(async (req, res) => {
    const expense = await ExpenseService.create(req.body);
    res.status(201).json(expense);
  }),

  update: asyncHandler(async (req, res) => {
    const expense = await ExpenseService.update(req.params.id, req.body);
    res.json(expense);
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await ExpenseService.delete(req.params.id);
    res.json(result);
  }),
};

module.exports = expenseController;
