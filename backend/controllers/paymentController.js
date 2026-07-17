// ── Payment Controller ────────────────────────────────────────────────────

const PaymentService = require('../services/paymentService');
const asyncHandler = require('../middleware/asyncHandler');

const paymentController = {
  getAll: asyncHandler(async (req, res) => {
    const { customerId } = req.query;
    const payments = await PaymentService.getAll({ customerId });
    res.json(payments);
  }),

  getByBill: asyncHandler(async (req, res) => {
    const payments = await PaymentService.getByBill(req.params.billId);
    res.json(payments);
  }),

  create: asyncHandler(async (req, res) => {
    const result = await PaymentService.create(req.body);
    res.status(201).json(result);
  }),
};

module.exports = paymentController;
