// ── Feed Service ──────────────────────────────────────────────────────────
// Business logic for feed purchase operations

const { AppError } = require('../middleware/errorHandler');
const FeedRepository = require('../repositories/feedRepository');

const FeedService = {
  async getAll() {
    return await FeedRepository.findAll();
  },

  async create(data) {
    return await FeedRepository.create(data);
  },

  async delete(id) {
    const deleted = await FeedRepository.delete(id);
    if (!deleted) throw new AppError('Feed purchase not found', 404, 'NOT_FOUND');
    return { success: true };
  },
};

module.exports = FeedService;
