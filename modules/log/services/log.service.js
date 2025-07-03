const logRepository = require('../repositories/log.repository');

module.exports = {
  async addUserLog(userId, action, status, ip, userAgent) {
    return logRepository.createLog(userId, action, status, ip, userAgent);
  },
  async getUserLogs({ userId, action, page, pageSize }) {
    return logRepository.getLogs({ userId, action, page, pageSize });
  }
};
