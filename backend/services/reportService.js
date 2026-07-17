// ── Report Service ────────────────────────────────────────────────────────
// Business logic for report generation

const { AppError } = require('../middleware/errorHandler');
const ReportRepository = require('../repositories/reportRepository');
const CustomerRepository = require('../repositories/customerRepository');

const ReportService = {
  async getDaily(date) {
    return await ReportRepository.getDaily(date || new Date().toISOString().split('T')[0]);
  },

  async getMonthly(year, month) {
    return await ReportRepository.getMonthly(year, month);
  },

  async getCustomerReport(customerId, { startDate, endDate, year, month }) {
    const customer = await CustomerRepository.findById(customerId);
    if (!customer) throw new AppError('Customer not found', 404, 'NOT_FOUND');

    // Determine date range
    let sDate = startDate;
    let eDate = endDate;
    if (year && month) {
      sDate = `${year}-${String(month).padStart(2, '0')}-01`;
      eDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0];
    }

    const deliveries = await ReportRepository.getCustomerReport(customerId, sDate, eDate);

    // Build leave ranges
    const leaveDays = deliveries.filter(d => d.status === 'leave').map(d => d.date).sort();
    const leaveRanges = buildDateRanges(leaveDays);

    // Build extra milk ranges
    const extraDays = deliveries
      .filter(d => d.status === 'extra' || Number(d.extra_milk || 0) > 0)
      .map(d => ({ date: d.date, qty: Number(d.extra_milk || 0) }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const extraRanges = buildExtraRanges(extraDays);

    // Summary
    const delivered = deliveries.filter(d => d.status === 'delivered' || d.status === 'extra');
    const totalMilk = delivered.reduce((s, d) => s + Number(d.delivered_quantity || 0), 0);
    const totalExtraMilk = delivered.reduce((s, d) => s + Number(d.extra_milk || 0), 0);
    const totalLeaveDays = leaveDays.length;
    const rate = Number(customer.milk_rate_per_liter || 0);
    const grossAmount = (totalMilk + totalExtraMilk) * rate;

    // Find associated bill if year+month provided
    let billSummary = null;
    if (year && month) {
      const BillRepository = require('../repositories/billRepository');
      billSummary = await BillRepository.findByCustomerMonth(customerId, Number(month), Number(year));
    }

    return {
      customer,
      deliveries,
      leave_ranges: leaveRanges,
      extra_ranges: extraRanges,
      summary: {
        total_delivered_days: delivered.length,
        total_leave_days: totalLeaveDays,
        total_milk: totalMilk,
        total_extra_milk: totalExtraMilk,
        gross_amount: grossAmount,
        milk_rate_per_liter: rate,
      },
      bill: billSummary,
    };
  },
};

function buildDateRanges(dates) {
  const ranges = [];
  let rangeStart = null, rangePrev = null;
  for (const dateStr of dates) {
    const d = new Date(dateStr);
    if (!rangeStart) { rangeStart = dateStr; rangePrev = d; continue; }
    const diffDays = (d.getTime() - rangePrev.getTime()) / 86400000;
    if (diffDays === 1) { rangePrev = d; }
    else {
      ranges.push({ from: rangeStart, to: rangePrev.toISOString().split('T')[0] });
      rangeStart = dateStr; rangePrev = d;
    }
  }
  if (rangeStart) ranges.push({ from: rangeStart, to: rangePrev.toISOString().split('T')[0] });
  return ranges;
}

function buildExtraRanges(extraDays) {
  const ranges = [];
  let eStart = null, ePrev = null, eQty = null;
  for (const { date: dateStr, qty } of extraDays) {
    const d = new Date(dateStr);
    if (!eStart) { eStart = dateStr; ePrev = d; eQty = qty; continue; }
    const diffDays = (d.getTime() - ePrev.getTime()) / 86400000;
    const sameQty = qty === eQty;
    if (diffDays === 1 && sameQty) { ePrev = d; }
    else {
      ranges.push({ from: eStart, to: ePrev.toISOString().split('T')[0], extra_ml_per_day: eQty });
      eStart = dateStr; ePrev = d; eQty = qty;
    }
  }
  if (eStart) ranges.push({ from: eStart, to: ePrev.toISOString().split('T')[0], extra_ml_per_day: eQty });
  return ranges;
}

module.exports = ReportService;
