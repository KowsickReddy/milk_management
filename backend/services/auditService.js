const auditRepository = require('../repositories/auditRepository');

const auditService = {
  async log({ userId, userName, action, entityType, entityId, details, ipAddress }) {
    return auditRepository.create({ userId, userName, action, entityType, entityId, details, ipAddress });
  },

  async getLogs({ limit, offset } = {}) {
    return auditRepository.getAll({ limit, offset });
  },

  async getLogsByUser(userId) {
    return auditRepository.getByUser(userId);
  },

  async getLogsByEntity(entityType, entityId) {
    return auditRepository.getByEntity(entityType, entityId);
  },

  async getCount() {
    return auditRepository.count();
  },
};

module.exports = auditService;
