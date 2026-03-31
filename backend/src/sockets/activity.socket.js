const { getIO } = require('../config/socket');

/**
 * Emit khi một activity mới được tạo
 * @param {string} projectId
 * @param {object} activity - ActivityLog document (đã populated)
 */
const emitActivityCreated = (projectId, activity) => {
  if (!projectId) return;
  getIO().to(projectId.toString()).emit('activity:created', activity);
};

module.exports = { emitActivityCreated };
