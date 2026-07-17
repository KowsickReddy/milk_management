// ── Report Repository (PostgreSQL) ────────────────────────────────────────
// All report-related database queries
// NOTE: pg returns { rows, fields, rowCount } — never use array destructuring!

const { getPool } = require('../config/database');

const ReportRepository = {
  async getMonthly(year, month) {
    const result = await getPool().query(
      `SELECT c.id as customer_id, c.name as customer_name,
        COUNT(d.id)::int as total_days,
        SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN 1 ELSE 0 END)::int as delivered_days,
        SUM(CASE WHEN d.status = 'leave' THEN 1 ELSE 0 END)::int as leave_days,
        COALESCE(SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN d.delivered_quantity ELSE 0 END), 0) as total_milk,
        COALESCE(SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN d.extra_milk ELSE 0 END), 0) as total_extra_milk,
        c.milk_rate_per_liter,
        (COALESCE(SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN d.delivered_quantity ELSE 0 END), 0) +
         COALESCE(SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN d.extra_milk ELSE 0 END), 0)) * c.milk_rate_per_liter as raw_total,
        COALESCE(b.credit_used, 0) as wallet_deduction,
        ((COALESCE(SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN d.delivered_quantity ELSE 0 END), 0) +
          COALESCE(SUM(CASE WHEN d.status IN ('delivered', 'extra') THEN d.extra_milk ELSE 0 END), 0)) * c.milk_rate_per_liter) - COALESCE(b.credit_used, 0) as final_payable
      FROM customers c
      LEFT JOIN deliveries d ON c.id = d.customer_id AND EXTRACT(YEAR FROM d.date) = $1 AND EXTRACT(MONTH FROM d.date) = $2 AND d.is_deleted = FALSE
      LEFT JOIN (
        SELECT customer_id, GREATEST(0, COALESCE(gross_amount, total_amount) - final_amount) as credit_used
        FROM bills
        WHERE bill_month = $3 AND bill_year = $4
      ) b ON c.id = b.customer_id
      GROUP BY c.id, b.credit_used, c.name, c.milk_rate_per_liter
      ORDER BY c.name`,
      [year, month, month, year]
    );
    return { year, month, customers: result.rows };
  },

  async getDaily(date) {
    const deliveries = await getPool().query(
      `SELECT d.*, c.name AS customer_name, c.milk_rate_per_liter, c.shift AS customer_shift
       FROM deliveries d
       JOIN customers c ON c.id = d.customer_id
       WHERE d.date = $1::date AND d.is_deleted = FALSE
       ORDER BY c.name ASC`,
      [date]
    );

    const allDeliveries = deliveries.rows;
    const delivered = allDeliveries.filter(d => d.status === 'delivered' || d.status === 'extra');
    const onLeave = allDeliveries.filter(d => d.status === 'leave');
    const totalMilk = delivered.reduce((s, d) => s + Number(d.delivered_quantity || 0) + Number(d.extra_milk || 0), 0);

    return {
      date,
      summary: {
        total_deliveries: allDeliveries.length,
        delivered_count: delivered.length,
        leave_count: onLeave.length,
        total_milk: totalMilk,
      },
      deliveries: allDeliveries,
    };
  },

  async getCustomerReport(customerId, startDate, endDate) {
    const result = await getPool().query(
      'SELECT d.id, d.date, d.status, d.delivered_quantity, d.extra_milk FROM deliveries d WHERE d.customer_id = $1 AND d.is_deleted = FALSE AND d.date BETWEEN $2::date AND $3::date ORDER BY d.date ASC',
      [customerId, startDate, endDate]
    );

    return result.rows;
  },
};

module.exports = ReportRepository;
