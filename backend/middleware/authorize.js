// ── Role-based Authorization Middleware ───────────────────────────────────

/**
 * Require specific roles to access a route
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'worker')
 * @returns {Function} Express middleware
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Unauthorized role.', code: 'FORBIDDEN' });
    }
    next();
  };
}

/**
 * Allow self-access for customers or staff access for admin/workers
 * @param {string} paramName - Parameter name to check (default: 'customerId')
 * @returns {Function} Express middleware
 */
function requireSelfOrStaff(paramName = 'customerId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    // Staff can access all
    if (req.user.role !== 'customer') {
      return next();
    }

    // Customers can only access their own data
    const targetId = req.params[paramName] || req.body[paramName] || req.query[paramName];
    if (String(req.user.id) !== String(targetId)) {
      return res.status(403).json({ error: 'Access denied. Unauthorized access.', code: 'FORBIDDEN' });
    }

    next();
  };
}

module.exports = { requireRole, requireSelfOrStaff };
