// ── Feed Controller ───────────────────────────────────────────────────────

const FeedService = require('../services/feedService');
const asyncHandler = require('../middleware/asyncHandler');

const feedController = {
  getAll: asyncHandler(async (req, res) => {
    const feed = await FeedService.getAll();
    res.json(feed);
  }),

  create: asyncHandler(async (req, res) => {
    const result = await FeedService.create(req.body);
    res.status(201).json(result);
  }),

  delete: asyncHandler(async (req, res) => {
    await FeedService.delete(req.params.id);
    res.json({ success: true });
  }),
};

module.exports = feedController;
