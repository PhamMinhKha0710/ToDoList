const { getIO } = require('../config/socket');

/**
 * Emit khi một comment được tạo
 * @param {string} projectId
 * @param {object} comment - Comment document (đã populated)
 */
const emitCommentCreated = (projectId, comment) => {
  getIO().to(`project:${projectId}`).emit('comment:created', comment);
};

/**
 * Emit khi một comment bị xóa
 * @param {string} projectId
 * @param {string} commentId
 * @param {string} taskId
 */
const emitCommentDeleted = (projectId, commentId, taskId) => {
  getIO().to(`project:${projectId}`).emit('comment:deleted', { commentId, taskId });
};

/**
 * Emit khi một comment được chỉnh sửa
 * @param {string} projectId
 * @param {object} comment - Comment document sau update (đã populated)
 */
const emitCommentUpdated = (projectId, comment) => {
  getIO().to(`project:${projectId}`).emit('comment:updated', comment);
};

module.exports = { emitCommentCreated, emitCommentDeleted, emitCommentUpdated };
