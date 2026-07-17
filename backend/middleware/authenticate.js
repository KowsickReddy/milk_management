// ── Authentication Middleware ─────────────────────────────────────────────
// JWT verification from Authorization header or cookie

const jwt = require('jsonwebtoken');
const config = require('../config/auth');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid or expired token';
    return res.status(403).json({ error: message, code: 'TOKEN_INVALID' });
  }
}

module.exports = authenticateToken;
