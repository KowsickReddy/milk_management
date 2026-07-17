// ── Delivery Controller ───────────────────────────────────────────────────

const DeliveryService = require('../services/deliveryService');
const asyncHandler = require('../middleware/asyncHandler');

const deliveryController = {
  getAll: asyncHandler(async (req, res) => {
    const { date, customerId, startDate, endDate } = req.query;
    const deliveries = await DeliveryService.getAll({ date, customerId, startDate, endDate });
    res.json(deliveries);
  }),

  create: asyncHandler(async (req, res) => {
    const delivery = await DeliveryService.create(req.body);
    res.status(201).json(delivery);
  }),

  createBatch: asyncHandler(async (req, res) => {
    const result = await DeliveryService.createBatch(req.body.deliveries);
    res.json(result);
  }),

  softDelete: asyncHandler(async (req, res) => {
    const result = await DeliveryService.softDelete(req.params.id);
    res.json(result);
  }),
};

module.exports = deliveryController;
