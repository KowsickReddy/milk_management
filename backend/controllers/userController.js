// ── User Controller ───────────────────────────────────────────────────────

const UserService = require('../services/userService');
const asyncHandler = require('../middleware/asyncHandler');

const userController = {
  getAll: asyncHandler(async (req, res) => {
    const users = await UserService.getAll();
    res.json(users);
  }),

  create: asyncHandler(async (req, res) => {
    const user = await UserService.create(req.body);
    res.status(201).json(user);
  }),

  update: asyncHandler(async (req, res) => {
    const user = await UserService.update(req.params.id, req.body);
    res.json(user);
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await UserService.delete(req.params.id);
    res.json(result);
  }),
};

module.exports = userController;
