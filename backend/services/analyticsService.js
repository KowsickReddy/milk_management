// ── Analytics Service ─────────────────────────────────────────────────────
// Business logic for dashboard and analytics

const AnalyticsRepository = require('../repositories/analyticsRepository');

const AnalyticsService = {
  async getDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    return await AnalyticsRepository.getDashboard(today, year, month);
  },

  async getEarnings(year, month) {
    return await AnalyticsRepository.getEarnings(year, month);
  },

  async getStats() {
    const today = new Date().toISOString().split('T')[0];
    return await AnalyticsRepository.getStats(today);
  },

  async getFarmStats() {
    return await AnalyticsRepository.getFarmStats();
  },
};

module.exports = AnalyticsService;
