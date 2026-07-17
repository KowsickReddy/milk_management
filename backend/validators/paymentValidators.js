// ── Payment Validators ────────────────────────────────────────────────────

const createPaymentSchema = {
  body: {
    bill_id: { required: true, type: 'number', min: 1 },
    amount_paid: { required: true, type: 'number', min: 0.01 },
    payment_method: { type: 'string' },
  },
};

module.exports = { createPaymentSchema };
