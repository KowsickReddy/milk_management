const auditService = require('../services/auditService');

/**
 * Middleware factory to log admin actions.
 * Usage: router.post('/customers', auditLog('CREATE', 'customer'), controller.createCustomer)
 * The action is logged after the response is sent.
 */
function auditLog(action, entityType, getEntityId = null) {
  return (req, res, next) => {
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    res.send = function (body) {
      if (res.statusCode < 400) {
        const entityId = getEntityId ? getEntityId(req, res) : req.params.id || req.body?.customer_id || req.body?.id;
        const details = {
          method: req.method,
          path: req.originalUrl,
          body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
        };
        auditService.log({
          userId: req.user?.id,
          userName: req.user?.username || req.user?.full_name || 'Unknown',
          action,
          entityType,
          entityId: entityId ? parseInt(entityId, 10) : null,
          details,
          ipAddress: req.ip || req.headers['x-forwarded-for'],
        }).catch(err => console.error('Audit log error:', err.message));
      }
      return originalSend(body);
    };

    res.json = function (body) {
      if (res.statusCode < 400) {
        const entityId = getEntityId ? getEntityId(req, res) : req.params.id || req.body?.customer_id || req.body?.id;
        auditService.log({
          userId: req.user?.id,
          userName: req.user?.username || req.user?.full_name || 'Unknown',
          action,
          entityType,
          entityId: entityId ? parseInt(entityId, 10) : null,
          details: { method: req.method, path: req.originalUrl },
          ipAddress: req.ip || req.headers['x-forwarded-for'],
        }).catch(err => console.error('Audit log error:', err.message));
      }
      return originalJson(body);
    };

    next();
  };
}

function sanitizeBody(body) {
  if (!body) return {};
  const sanitized = { ...body };
  // Remove sensitive fields
  delete sanitized.pin;
  delete sanitized.password;
  delete sanitized.token;
  return sanitized;
}

module.exports = { auditLog };
