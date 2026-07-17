// ── Request ID Middleware ─────────────────────────────────────────────────
// Adds a unique request ID to each request for tracing

const { randomUUID } = require('crypto');

function requestId(req, _res, next) {
  req.id = randomUUID().slice(0, 8); // Short ID for readability
  next();
}

module.exports = requestId;
