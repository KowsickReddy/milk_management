// ── Credit Controller ─────────────────────────────────────────────────────

const CreditService = require('../services/creditService');
const asyncHandler = require('../middleware/asyncHandler');

const creditController = {
  getCredit: asyncHandler(async (req, res) => {
    const result = await CreditService.getCredit(req.params.customerId);
    res.json(result);
  }),

  applyCredit: asyncHandler(async (req, res) => {
    const { customer_id, bill_id, amount } = req.body;
    const result = await CreditService.applyCredit(customer_id, bill_id, amount);
    res.json(result);
  }),
};

module.exports = creditController;
