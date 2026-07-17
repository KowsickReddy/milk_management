// ── Cattle Service ────────────────────────────────────────────────────────
// Business logic for cattle management

const { AppError } = require('../middleware/errorHandler');
const CattleRepository = require('../repositories/cattleRepository');

const CattleService = {
  async getAll() {
    return await CattleRepository.findAll();
  },

  async create(data) {
    if (!data.tag_number) {
      throw new AppError('Tag number is required', 400, 'VALIDATION_ERROR');
    }
    return await CattleRepository.create(data);
  },

  async update(id, data) {
    if (!data.tag_number) {
      throw new AppError('Tag number is required', 400, 'VALIDATION_ERROR');
    }
    return await CattleRepository.update(id, data);
  },

  async delete(id) {
    return await CattleRepository.delete(id);
  },
};

module.exports = CattleService;
