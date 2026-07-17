// ── Auth Validators ───────────────────────────────────────────────────────

const loginSchema = {
  body: {
    pin: { required: true, type: 'string', minLength: 4, maxLength: 6 },
  },
};

const adminLoginSchema = {
  body: {
    ...loginSchema.body,
    username: { required: true, type: 'string', minLength: 2 },
  },
};

const customerLoginSchema = {
  body: {
    ...loginSchema.body,
    phone: { required: true, type: 'string', minLength: 10, maxLength: 10 },
  },
};

module.exports = { adminLoginSchema, customerLoginSchema };
