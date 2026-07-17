// ── Analytics Repository (PostgreSQL) ─────────────────────────────────────
// All analytics/stats database queries
// NOTE: pg returns { rows, fields, rowCount } — never use array destructuring!

const { getPool } = require('../config/database');

const AnalyticsRepository = {
  async getDashboard(date, year, month) {
    const totalDeliveries = await getPool().query(
      'SELECT COUNT(*)::int as count FROM deliveries WHERE date = $1 AND is_deleted = FALSE', [date]);
    const delivered = await getPool().query(
      "SELECT COUNT(*)::int as count, COALESCE(SUM(delivered_quantity + extra_milk),0) as total_milk FROM deliveries WHERE date = $1 AND is_deleted = FALSE AND status IN ('delivered','extra')", [date]);
    const onLeave = await getPool().query(
      "SELECT COUNT(*)::int as count FROM deliveries WHERE date = $1 AND is_deleted = FALSE AND status = 'leave'", [date]);
    const totalCustomers = await getPool().query(
      "SELECT COUNT(*)::int as count FROM customers WHERE status = 'active'");
    const monthlyBilling = await getPool().query(
      'SELECT COALESCE(SUM(total_amount),0) as billed, COALESCE(SUM(amount_paid),0) as collected, COALESCE(SUM(balance),0) as pending FROM bills WHERE bill_year = $1 AND bill_month = $2', [year, month]);
    const unpaidBills = await getPool().query(
      "SELECT COUNT(*)::int as count, COALESCE(SUM(balance),0) as total FROM bills WHERE paid = FALSE");
    const monthMilk = await getPool().query(
      "SELECT COALESCE(SUM(delivered_quantity + extra_milk),0) as total FROM deliveries WHERE EXTRACT(YEAR FROM date)=$1 AND EXTRACT(MONTH FROM date)=$2 AND is_deleted=FALSE AND status IN ('delivered','extra')", [year, month]);

    return {
      total_deliveries: Number(totalDeliveries.rows[0].count),
      delivered: Number(delivered.rows[0].count),
      on_leave: Number(onLeave.rows[0].count),
      total_customers: Number(totalCustomers.rows[0].count),
      total_milk_today: Number(delivered.rows[0].total_milk || 0),
      monthly_income: Number(monthlyBilling.rows[0].billed || 0),
      monthly_collected: Number(monthlyBilling.rows[0].collected || 0),
      monthly_pending: Number(monthlyBilling.rows[0].pending || 0),
      unpaid_bills: Number(unpaidBills.rows[0].count),
      pending_amount: Number(unpaidBills.rows[0].total || 0),
      month_milk_total: Number(monthMilk.rows[0].total || 0),
    };
  },

  async getEarnings(year, month) {
    const billStats = await getPool().query(
      'SELECT COALESCE(SUM(total_amount), 0) as total_billed, COALESCE(SUM(amount_paid), 0) as total_paid, COALESCE(SUM(balance), 0) as total_pending FROM bills WHERE bill_year = $1 AND bill_month = $2',
      [year, month]
    );
    const expenseTotal = await this._getMonthlyExpenses(year, month);

    const billed = parseFloat(billStats.rows[0].total_billed);
    const paid = parseFloat(billStats.rows[0].total_paid);
    const expenses = expenseTotal;

    return {
      year: parseInt(year),
      month: parseInt(month),
      total_billed: billed,
      total_paid: paid,
      total_pending: parseFloat(billStats.rows[0].total_pending),
      total_expenses: expenses,
      profit: paid - expenses,
    };
  },

  async getStats(date) {
    const customerCount = await getPool().query("SELECT COUNT(*)::int as count FROM customers WHERE status='active'");
    const todayDelivery = await getPool().query("SELECT COUNT(*)::int as count FROM deliveries WHERE date=$1 AND is_deleted = FALSE AND status IN ('delivered', 'extra')", [date]);
    const unpaidBills = await getPool().query("SELECT COUNT(*)::int as count, SUM(balance) as total FROM bills WHERE paid=FALSE");
    const monthRevenue = await getPool().query("SELECT SUM(amount_paid) as total FROM payments WHERE EXTRACT(MONTH FROM payment_date)=EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM payment_date)=EXTRACT(YEAR FROM CURRENT_DATE)");

    return {
      activeCustomers: customerCount.rows[0].count,
      todayDeliveries: todayDelivery.rows[0].count,
      unpaidBills: unpaidBills.rows[0].count,
      pendingAmount: unpaidBills.rows[0].total || 0,
      monthlyRevenue: monthRevenue.rows[0].total || 0,
    };
  },

  async getFarmStats() {
    const cattleStats = await getPool().query('SELECT COUNT(*)::int as total_cattle, SUM(acquisition_cost + transport_cost) as total_investment FROM cattle');
    const feedStats = await getPool().query('SELECT SUM(bags_bought) as total_bags, SUM(total_cost) as total_feed_cost FROM feed_purchases');
    const upcomingCalving = await getPool().query(
      `SELECT *, (gestation_start_date + INTERVAL '10 MONTH') as expected_calving_date
       FROM cattle
       WHERE is_in_calf = TRUE
         AND (gestation_start_date + INTERVAL '10 MONTH') BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 DAY')`
    );

    return {
      summary: {
        total_cattle: cattleStats.rows[0].total_cattle || 0,
        total_investment: cattleStats.rows[0].total_investment || 0,
        total_bags: feedStats.rows[0].total_bags || 0,
        total_feed_cost: feedStats.rows[0].total_feed_cost || 0,
      },
      upcoming_calving: upcomingCalving.rows,
    };
  },

  async _getMonthlyExpenses(year, month) {
    const result = await getPool().query(
      'SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE EXTRACT(YEAR FROM expense_date) = $1 AND EXTRACT(MONTH FROM expense_date) = $2',
      [year, month]
    );
    return result.rows && result.rows[0] ? parseFloat(result.rows[0].total_expenses || 0) : 0;
  },
};

module.exports = AnalyticsRepository;
