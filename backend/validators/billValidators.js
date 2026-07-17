// ── Bill Validators ───────────────────────────────────────────────────────

const createBillSchema = {
  body: {
    customer_id: { required: true, type: 'number', min: 1 },
    bill_month: { required: true, type: 'integer', min: 1, max: 12 },
    bill_year: { required: true, type: 'integer', min: 2000, max: 2100 },
  },
};

const generateBillSchema = {
  body: {
    customer_id: { required: true, type: 'number', min: 1 },
    month: { required: true, type: 'integer', min: 1, max: 12 },
    year: { required: true, type: 'integer', min: 2000, max: 2100 },
  },
};

const batchGenerateSchema = {
  body: {
    month: { required: true, type: 'integer', min: 1, max: 12 },
    year: { required: true, type: 'integer', min: 2000, max: 2100 },
  },
};

module.exports = { createBillSchema, generateBillSchema, batchGenerateSchema };
