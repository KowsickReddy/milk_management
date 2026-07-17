// ── Leave Validators ──────────────────────────────────────────────────────

const createLeaveSchema = {
  body: {
    customer_id: { required: true, type: 'number', min: 1 },
    start_date: { required: true, type: 'string', minLength: 10 },
    end_date: { type: 'string' },
    reason: { type: 'string', maxLength: 500 },
  },
};

module.exports = { createLeaveSchema };
