// ── Bill Controller ───────────────────────────────────────────────────────

const BillService = require('../services/billService');
const asyncHandler = require('../middleware/asyncHandler');

const billController = {
  getAll: asyncHandler(async (req, res) => {
    const { customerId, paid } = req.query;
    const paidBool = paid === 'true' ? true : paid === 'false' ? false : undefined;
    const bills = await BillService.getAll({ customerId, paid: paidBool });
    res.json(bills);
  }),

  getById: asyncHandler(async (req, res) => {
    const bill = await BillService.getById(req.params.id);
    // Self-access check for customer role
    if (req.user.role === 'customer' && String(bill.customer_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    }
    res.json(bill);
  }),

  create: asyncHandler(async (req, res) => {
    const bill = await BillService.create(req.body);
    res.status(201).json(bill);
  }),

  generate: asyncHandler(async (req, res) => {
    const { customer_id, month, year } = req.body;
    const result = await BillService.generateBill(customer_id, month, year);
    // Skipped bills (no milk delivered / no rate) are a normal outcome — 200.
    const status = result.skipped ? 200 : (result.already_exists ? 200 : 201);
    res.status(status).json(result);
  }),

  generateBatch: asyncHandler(async (req, res) => {
    const { month, year } = req.body;
    const result = await BillService.generateBatch(month, year);
    res.json(result);
  }),

  getUnpaidWithCredit: asyncHandler(async (req, res) => {
    const bills = await BillService.getUnpaidWithCredit();
    res.json(bills);
  }),

  update: asyncHandler(async (req, res) => {
    const bill = await BillService.update(req.params.id, req.body);
    res.json(bill);
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await BillService.delete(req.params.id);
    res.json(result);
  }),
};

module.exports = billController;
