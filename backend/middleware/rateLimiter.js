// ── Rate Limiter Middleware ───────────────────────────────────────────────
// In-memory rate limiting for login endpoints

const config = require('../config/auth');

/**
 * In-memory store for rate limiting
 * Note: For production with multiple instances, use Redis or similar
 */
const store = new Map();

// Clean up expired entries periodically (skip during tests)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) {
        store.delete(key);
      }
    }
  }, 60 * 1000);
}

/**
 * Rate limiter middleware factory
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxAttempts - Max requests in the window
 * @returns {Function} Express middleware
 */
function rateLimiter({ windowMs, maxAttempts } = config.rateLimit.login) {
  return (req, res, next) => {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
      .split(',')[0].trim();
    const now = Date.now();

    let entry = store.get(ip);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 1, resetAt: now + windowMs };
      store.set(ip, entry);
      return next();
    }

    entry.count++;

    if (entry.count > maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Too many attempts. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfter,
      });
    }

    next();
  };
}

/**
 * Reset rate limit for a specific IP (useful after successful login)
 * @param {string} ip
 */
function resetRateLimit(ip) {
  store.delete(ip);
}

module.exports = { rateLimiter, resetRateLimit };
