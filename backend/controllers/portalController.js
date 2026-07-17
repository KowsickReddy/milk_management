// ── Portal Controller ─────────────────────────────────────────────────────

const PortalService = require('../services/portalService');
const asyncHandler = require('../middleware/asyncHandler');

const portalController = {
  getDashboard: asyncHandler(async (req, res) => {
    const data = await PortalService.getDashboard(req.params.customerId);
    res.json(data);
  }),

  getDeliveries: asyncHandler(async (req, res) => {
    const deliveries = await PortalService.getDeliveries(req.params.customerId);
    res.json(deliveries);
  }),

  getBills: asyncHandler(async (req, res) => {
    const bills = await PortalService.getBills(req.params.customerId);
    res.json(bills);
  }),

  updateQuantity: asyncHandler(async (req, res) => {
    const { customer_id, date, quantity, session } = req.body;
    const result = await PortalService.updateQuantity(customer_id, date, quantity, session);
    res.json(result);
  }),

  createComplaint: asyncHandler(async (req, res) => {
    const { customer_id, subject, message } = req.body;
    const result = await PortalService.createComplaint(customer_id, subject, message);
    res.status(201).json(result);
  }),
};

module.exports = portalController;
