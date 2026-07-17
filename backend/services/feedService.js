// ── Feed Service ──────────────────────────────────────────────────────────
// Business logic for feed purchase operations

const FeedRepository = require('../repositories/feedRepository');

const FeedService = {
  async getAll() {
    return await FeedRepository.findAll();
  },

  async create(data) {
    return await FeedRepository.create(data);
  },

  async delete(id) {
    return await FeedRepository.delete(id);
  },
};

module.exports = FeedService;
