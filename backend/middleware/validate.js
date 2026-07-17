// ── Request Validation Middleware ─────────────────────────────────────────
// Validates request body/params/query against a schema

const { AppError } = require('./errorHandler');

/**
 * Validation middleware factory
 * @param {Object} schema - Object with validate functions for body, params, query
 * @returns {Function} Express middleware
 */
function validate(schema) {
  return (req, _res, next) => {
    const errors = [];

    if (schema.body) {
      const result = validateFields(req.body, schema.body);
      if (result.error) errors.push(...result.error);
    }

    if (schema.params) {
      const result = validateFields(req.params, schema.params);
      if (result.error) errors.push(...result.error);
    }

    if (schema.query) {
      const result = validateFields(req.query, schema.query);
      if (result.error) errors.push(...result.error);
    }

    if (errors.length > 0) {
      return next(new AppError(errors.join('; '), 400, 'VALIDATION_ERROR'));
    }

    next();
  };
}

/**
 * Validate fields against rules
 * @param {Object} data - Data to validate
 * @param {Object} rules - Validation rules
 * @returns {{ error: string[] | null }}
 */
function validateFields(data, rules) {
  const errors = [];

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value === undefined || value === null || value === '') {
      continue;
    }

    // Type checks
    if (rule.type === 'number' || rule.type === 'integer') {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`${field} must be a number`);
        continue;
      }
      if (rule.type === 'integer' && !Number.isInteger(num)) {
        errors.push(`${field} must be an integer`);
        continue;
      }
      if (rule.min !== undefined && num < rule.min) {
        errors.push(`${field} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && num > rule.max) {
        errors.push(`${field} must be at most ${rule.max}`);
      }
    }

    if (rule.type === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push(`${field} must be at most ${rule.maxLength} characters`);
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }

    if (rule.type === 'array' && !Array.isArray(value)) {
      errors.push(`${field} must be an array`);
    }

    if (rule.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${field} must be a boolean`);
    }

    // Custom validator
    if (rule.validate && typeof rule.validate === 'function') {
      const customError = rule.validate(value, data);
      if (customError) {
        errors.push(customError);
      }
    }
  }

  return { error: errors.length > 0 ? errors : null };
}

module.exports = validate;
