// ── Authentication Service ────────────────────────────────────────────────
// Business logic for admin and customer login

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/auth');
const UserRepository = require('../repositories/userRepository');
const CustomerRepository = require('../repositories/customerRepository');
const LogRepository = require('../repositories/logRepository');

const AuthService = {
  async loginUser(username, pin, ip) {
    const user = await UserRepository.findByUsername(username);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

    const valid = await bcrypt.compare(pin, user.pin);
    if (!valid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

    // Remove pin from response
    const { pin: _, ...userData } = user;

    // Update last login
    await UserRepository.updateLastLogin(user.id);

    // Log login
    await LogRepository.createLoginLog({
      user_type: 'admin',
      user_id: user.id,
      username: user.username,
      ip_address: ip,
    });

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return { ...userData, token };
  },

  async loginCustomer(phone, pin, ip) {
    if (!phone || !pin) {
      throw Object.assign(new Error('Phone and PIN are required'), { statusCode: 400 });
    }
    const customer = await CustomerRepository.findByPhone(phone);
    if (!customer) throw Object.assign(new Error('Invalid phone or PIN'), { statusCode: 401 });
    if (customer.status !== 'active') throw Object.assign(new Error('Account is not active'), { statusCode: 401 });
    if (!customer.pin) throw Object.assign(new Error('No PIN set for this customer'), { statusCode: 401 });

    const valid = await bcrypt.compare(pin, customer.pin);
    if (!valid) throw Object.assign(new Error('Invalid phone or PIN'), { statusCode: 401 });

    // Remove pin from response
    const { pin: _, ...customerData } = customer;

    // Log login
    await LogRepository.createLoginLog({
      user_type: 'customer',
      user_id: customer.id,
      username: customer.name,
      ip_address: ip,
    });

    // Sign JWT
    const token = jwt.sign(
      { id: customer.id, username: customer.phone, role: 'customer' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return { ...customerData, role: 'customer', username: customer.phone, full_name: customer.name, token };
  },

  generateToken(payload) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  },
};

module.exports = AuthService;
