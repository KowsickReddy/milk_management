// ── Auth Controller ───────────────────────────────────────────────────────

const AuthService = require('../services/authService');
const asyncHandler = require('../middleware/asyncHandler');
const config = require('../config/auth');
const { getClientIP } = require('../utils/helpers');
const { resetRateLimit } = require('../middleware/rateLimiter');

const authController = {
  loginUser: asyncHandler(async (req, res) => {
    const { username, pin } = req.body;
    const ip = getClientIP(req);

    const result = await AuthService.loginUser(username, pin, ip);

    // Set JWT cookie
    res.cookie(config.jwtCookieName, result.token, config.cookie);

    // Reset rate limit on successful login
    resetRateLimit(ip);

    res.json(result);
  }),

  loginCustomer: asyncHandler(async (req, res) => {
    const { phone, pin } = req.body;
    const ip = getClientIP(req);

    const result = await AuthService.loginCustomer(phone, pin, ip);

    res.cookie(config.jwtCookieName, result.token, config.cookie);
    resetRateLimit(ip);

    res.json(result);
  }),
};

module.exports = authController;
