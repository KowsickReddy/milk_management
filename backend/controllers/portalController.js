// ── Portal Controller ─────────────────────────────────────────────────────

const PortalService = require('../services/portalService');
const asyncHandler = require('../middleware/asyncHandler');
const { getPool } = require('../config/database');

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

  getCalendar: asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    // Get customer info (verify exists)
    const cRows = await getPool().query(
      'SELECT id, name, daily_milk_quantity, evening_milk_quantity, shift FROM customers WHERE id = $1',
      [customerId]
    );
    if (cRows.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const customer = cRows.rows[0];

    // Get all deliveries for this customer in the month
    const dRows = await getPool().query(
      `SELECT date, status, delivered_quantity, extra_milk, delivery_shift
       FROM deliveries
       WHERE customer_id = $1 AND date >= $2::date AND date <= $3::date AND is_deleted = FALSE
       ORDER BY date ASC`,
      [customerId, startDate, endDate]
    );

    // Build calendar map
    const calendar = {};
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      calendar[dateStr] = {
        date: dateStr, day,
        entries: [],
        summary: { delivered: false, leave: false, extra: false, totalQuantity: 0 },
      };
    }

    for (const d of dRows.rows) {
      const dateStr = d.date instanceof Date
        ? d.date.toISOString().split('T')[0]
        : new Date(d.date).toISOString().split('T')[0];
      if (calendar[dateStr]) {
        const qty = parseFloat(d.delivered_quantity || 0) + parseFloat(d.extra_milk || 0);
        calendar[dateStr].entries.push({
          status: d.status,
          quantity: qty,
          deliveredQuantity: parseFloat(d.delivered_quantity || 0),
          extraMilk: parseFloat(d.extra_milk || 0),
          shift: d.delivery_shift || 'morning',
        });
        if (d.status === 'delivered' || d.status === 'extra') calendar[dateStr].summary.delivered = true;
        if (d.status === 'leave') calendar[dateStr].summary.leave = true;
        if (parseFloat(d.extra_milk || 0) > 0) calendar[dateStr].summary.extra = true;
        calendar[dateStr].summary.totalQuantity += qty;
      }
    }

    // Check long leaves (leave_requests) that overlap this month
    const lRows = await getPool().query(
      `SELECT id, start_date, end_date FROM leave_requests
       WHERE customer_id = $1
         AND start_date <= $3::date
         AND (end_date IS NULL OR end_date >= $2::date)`,
      [customerId, startDate, endDate]
    );

    for (const lr of lRows.rows) {
      const lrStart = new Date(lr.start_date);
      const lrEnd = lr.end_date ? new Date(lr.end_date) : new Date(endDate);
      const loopStart = lrStart < new Date(startDate) ? new Date(startDate) : lrStart;
      const loopEnd = lrEnd > new Date(endDate) ? new Date(endDate) : lrEnd;
      for (let d = new Date(loopStart); d <= loopEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (calendar[dateStr] && calendar[dateStr].entries.length === 0) {
          calendar[dateStr].summary.leave = true;
          calendar[dateStr].summary.delivered = false;
        }
      }
    }

    res.json({
      customer: { id: customer.id, name: customer.name, daily_milk_quantity: customer.daily_milk_quantity, evening_milk_quantity: customer.evening_milk_quantity, shift: customer.shift },
      year, month, daysInMonth: lastDay,
      calendar: Object.values(calendar),
    });
  }),
};

module.exports = portalController;
