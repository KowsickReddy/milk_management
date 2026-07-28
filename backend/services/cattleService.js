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
    const cattle = await CattleRepository.update(id, data);
    if (!cattle) throw new AppError('Cattle not found', 404, 'NOT_FOUND');
    return cattle;
  },

  async delete(id) {
    const deleted = await CattleRepository.delete(id);
    if (!deleted) throw new AppError('Cattle not found', 404, 'NOT_FOUND');
    return { success: true };
  },
};

module.exports = CattleService;
