// ── User Validators ──────────────────────────────────────────────────────

const createUserSchema = {
  body: {
    username: { required: true, type: 'string', minLength: 2 },
    pin: { required: true, type: 'string', minLength: 4 },
    role: { type: 'string' },
    full_name: { type: 'string', maxLength: 255 },
    phone: { type: 'string', maxLength: 15 },
    is_active: { type: 'boolean' },
  },
};

const updateUserSchema = createUserSchema;

module.exports = { createUserSchema, updateUserSchema };
