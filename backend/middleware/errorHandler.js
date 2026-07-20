// ── Global Error Handler ──────────────────────────────────────────────────
// Centralized error handling middleware

const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, _next) => {
  // Log the full error server-side
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    path: req.path,
    method: req.method,
    requestId: req.id,
  });

  // Determine response
  const statusCode = err.statusCode || 500;
  const response = {
    error: err.isOperational ? err.message : 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  };

  // Add request ID for debugging
  if (req.id) {
    response.requestId = req.id;
  }

  // In development, include stack trace
  if (process.env.NODE_ENV !== 'production' && !err.isOperational) {
    response.stack = err.stack;
  }

  // Include PostgreSQL error details temporarily for debugging
  // Will be removed after confirming customer creation fix
  if (err.code && /^[0-9]{5}$/.test(err.code)) {
    response.detail = err.message;
  }

  // Handle PostgreSQL-specific error codes
  // 23505 = unique_violation
  if (err.code === '23505') {
    return res.status(400).json({
      error: 'Duplicate entry. This record already exists.',
      code: 'DUPLICATE_ENTRY',
    });
  }

  // 23503 = foreign_key_violation
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Cannot perform this operation. Related records exist.',
      code: 'FOREIGN_KEY_CONSTRAINT',
    });
  }

  res.status(statusCode).json(response);
};

module.exports = { errorHandler, AppError };
