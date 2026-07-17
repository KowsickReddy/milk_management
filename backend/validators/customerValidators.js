// ── Customer Validators ───────────────────────────────────────────────────

const createCustomerSchema = {
  body: {
    name: { required: true, type: 'string', minLength: 2 },
    phone: { type: 'string', maxLength: 10 },
    address: { type: 'string', maxLength: 500 },
    daily_milk_quantity: { type: 'number', min: 0 },
    milk_rate_per_liter: { type: 'number', min: 0 },
    shift: { type: 'string' },
    status: { type: 'string' },
    customer_type: { type: 'string' },
    route_area: { type: 'string' },
  },
};

const updateCustomerSchema = createCustomerSchema;

const updatePinSchema = {
  body: {
    pin: { required: true, type: 'string', minLength: 4, maxLength: 6 },
  },
};

module.exports = { createCustomerSchema, updateCustomerSchema, updatePinSchema };
