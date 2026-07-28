// ── Customer Service ─────────────────────────────────────────────────────
// Business logic for customer operations

const bcrypt = require('bcryptjs');
const CustomerRepository = require('../repositories/customerRepository');

const CustomerService = {
  async getAll() {
    return await CustomerRepository.findAll();
  },

  async getById(id) {
    const customer = await CustomerRepository.findById(id);
    if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
    return customer;
  },

  async create(data) {
    if (!data.name) throw Object.assign(new Error('Customer name is required'), { statusCode: 400 });
    return await CustomerRepository.create(data);
  },

  async update(id, data) {
    if (!data.name) throw Object.assign(new Error('Customer name is required'), { statusCode: 400 });
    const customer = await CustomerRepository.update(id, data);
    if (!customer) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
    return customer;
  },

  async delete(id) {
    const deleted = await CustomerRepository.delete(id);
    if (!deleted) throw Object.assign(new Error('Customer not found'), { statusCode: 404 });
    return { success: true };
  },

  async updatePin(id, pin) {
    if (!pin || pin.length < 4) {
      throw Object.assign(new Error('PIN must be at least 4 digits'), { statusCode: 400 });
    }
    const hashedPin = await bcrypt.hash(pin, 10);
    await CustomerRepository.updatePin(id, hashedPin);
    return { success: true, message: 'PIN updated successfully' };
  },
};

module.exports = CustomerService;
