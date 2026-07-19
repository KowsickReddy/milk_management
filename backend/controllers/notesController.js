// ── Notes Controller ──────────────────────────────────────────────────────

const NotesService = require('../services/notesService');
const asyncHandler = require('../middleware/asyncHandler');

const notesController = {
  getAll: asyncHandler(async (req, res) => {
    const notes = await NotesService.getAll();
    res.json(notes);
  }),

  getById: asyncHandler(async (req, res) => {
    const note = await NotesService.getById(req.params.id);
    res.json(note);
  }),

  create: asyncHandler(async (req, res) => {
    const note = await NotesService.create(req.body, req.user.id);
    res.status(201).json(note);
  }),

  update: asyncHandler(async (req, res) => {
    const note = await NotesService.update(req.params.id, req.body, req.user.id);
    res.json(note);
  }),

  delete: asyncHandler(async (req, res) => {
    const result = await NotesService.delete(req.params.id);
    res.json(result);
  }),
};

module.exports = notesController;
