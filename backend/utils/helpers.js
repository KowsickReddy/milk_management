// ── Helper Utilities ─────────────────────────────────────────────────────

/**
 * Sanitize string input to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function sanitize(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}

/**
 * Get today's date as YYYY-MM-DD string
 * @returns {string}
 */
function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Parse a date string safely
 * @param {string} dateStr
 * @returns {Date}
 */
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Format date to ISO string
 * @param {Date|string} date
 * @returns {string}
 */
function toISODate(date) {
  const d = parseDate(date);
  return d.toISOString().split('T')[0];
}

/**
 * Days in a given month/year
 * @param {number} month - 1-12
 * @param {number} year
 * @returns {number}
 */
function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

/**
 * Get client IP from request
 * @param {Object} req - Express request
 * @returns {string}
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

module.exports = {
  sanitize,
  getToday,
  parseDate,
  toISODate,
  daysInMonth,
  getClientIP,
};
