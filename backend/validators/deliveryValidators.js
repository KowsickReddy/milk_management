// ── Delivery Validators ───────────────────────────────────────────────────

const createDeliverySchema = {
  body: {
    customer_id: { required: true, type: 'number', min: 1 },
    date: { required: true, type: 'string', minLength: 10 },
    delivered_quantity: { type: 'number', min: 0 },
    extra_milk: { type: 'number', min: 0 },
    delivery_shift: { type: 'string' },
  },
};

const batchDeliverySchema = {
  body: {
    deliveries: { required: true, type: 'array' },
  },
};

module.exports = { createDeliverySchema, batchDeliverySchema };
