// ── Notes Service ─────────────────────────────────────────────────────────
// Business logic for admin notes/notepad

const { AppError } = require('../middleware/errorHandler');
const NotesRepository = require('../repositories/notesRepository');

const NotesService = {
  async getAll() {
    return await NotesRepository.findAll();
  },

  async getById(id) {
    const note = await NotesRepository.findById(id);
    if (!note) throw new AppError('Note not found', 404, 'NOT_FOUND');
    return note;
  },

  async create(data, userId) {
    if (!data.note_text || !data.note_text.trim()) {
      throw new AppError('Note text is required', 400, 'VALIDATION_ERROR');
    }
    return await NotesRepository.create({
      note_text: data.note_text.trim(),
      mentioned_customer_ids: data.mentioned_customer_ids || [],
    }, userId);
  },

  async update(id, data, userId) {
    const existing = await NotesRepository.findById(id);
    if (!existing) throw new AppError('Note not found', 404, 'NOT_FOUND');
    return await NotesRepository.update(id, {
      note_text: data.note_text.trim(),
      mentioned_customer_ids: data.mentioned_customer_ids || [],
    });
  },

  async delete(id) {
    const deleted = await NotesRepository.delete(id);
    if (!deleted) throw new AppError('Note not found', 404, 'NOT_FOUND');
    return { success: true };
  },
};

module.exports = NotesService;
