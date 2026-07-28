// ── User Service ──────────────────────────────────────────────────────────
// Business logic for staff user management

const bcrypt = require('bcryptjs');
const { AppError } = require('../middleware/errorHandler');
const UserRepository = require('../repositories/userRepository');

const UserService = {
  async getAll() {
    return await UserRepository.findAll();
  },

  async create(data) {
    const { username, pin, role, full_name, phone, is_active } = data;
    if (!username || !pin) {
      throw new AppError('Username and PIN are required', 400, 'VALIDATION_ERROR');
    }
    const hashedPin = await bcrypt.hash(pin, 10);
    return await UserRepository.create({
      username, hashedPin, role, full_name, phone, is_active,
    });
  },

  async update(id, data) {
    const current = await UserRepository.findById(id);
    if (!current) throw new AppError('User not found', 404, 'NOT_FOUND');

    // Protect default admin
    if (current.username === 'admin' && (data.is_active === false || (data.role && data.role !== 'admin'))) {
      throw new AppError('Cannot deactivate or change role of default admin', 400, 'VALIDATION_ERROR');
    }

    // Merge current data with updates so the repository doesn't need to re-query
    const merged = {
      username: data.username || current.username,
      role: data.role || current.role,
      full_name: data.full_name !== undefined ? data.full_name : current.full_name,
      phone: data.phone !== undefined ? data.phone : current.phone,
      is_active: data.is_active !== undefined ? data.is_active : current.is_active,
      profile_photo: data.profile_photo !== undefined ? data.profile_photo : current.profile_photo,
    };
    // Only include hashedPin if a new PIN was provided (prevents NULL overwrite)
    if (data.pin) {
      merged.hashedPin = await bcrypt.hash(data.pin, 10);
    }
    return await UserRepository.update(id, merged);
  },

  async delete(id) {
    const current = await UserRepository.findById(id);
    if (!current) throw new AppError('User not found', 404, 'NOT_FOUND');
    if (current.username === 'admin') {
      throw new AppError('Cannot delete the default admin account', 400, 'VALIDATION_ERROR');
    }
    await UserRepository.delete(id);
    return { success: true, message: 'User deleted successfully' };
  },
};

module.exports = UserService;
