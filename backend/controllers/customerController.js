// ── Customer Controller ───────────────────────────────────────────────────

const CustomerService = require('../services/customerService');
const asyncHandler = require('../middleware/asyncHandler');

const customerController = {
  getAll: asyncHandler(async (req, res) => {
    const customers = await CustomerService.getAll();
    res.json(customers);
  }),

  getById: asyncHandler(async (req, res) => {
    const customer = await CustomerService.getById(req.params.id);
    res.json(customer);
  }),

  create: asyncHandler(async (req, res) => {
    const customer = await CustomerService.create(req.body);
    res.status(201).json(customer);
  }),

  update: asyncHandler(async (req, res) => {
    const customer = await CustomerService.update(req.params.id, req.body);
    res.json(customer);
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await CustomerService.delete(req.params.id);
    res.json(result);
  }),

  updatePin: asyncHandler(async (req, res) => {
    const result = await CustomerService.updatePin(req.params.id, req.body.pin);
    res.json(result);
  }),
};

module.exports = customerController;
