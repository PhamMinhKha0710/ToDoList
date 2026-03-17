const { getIO } = require('../config/socket');

/**
 * Emit khi một comment được tạo
 * @param {string} taskId
 * @param {object} comment - Comment document (đã populated)
 */
const emitCommentCreated = (taskId, comment) => {
  getIO().to(taskId).emit('comment:created', comment);
};

/**
 * Emit khi một comment bị xóa
 * @param {string} taskId
 * @param {string} commentId
 */
const emitCommentDeleted = (taskId, commentId) => {
  getIO().to(taskId).emit('comment:deleted', { commentId, taskId });
};

/**
 * Emit khi một comment được chỉnh sửa
 * @param {string} taskId
 * @param {object} comment - Comment document sau update (đã populated)
 */
const emitCommentUpdated = (taskId, comment) => {
  getIO().to(taskId).emit('comment:updated', comment);
};

module.exports = { emitCommentCreated, emitCommentDeleted, emitCommentUpdated };
