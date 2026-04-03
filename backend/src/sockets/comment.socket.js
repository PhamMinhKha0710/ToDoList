const { getIO } = require('../config/socket');

/**
 * Emit khi một comment được tạo
 * @param {string} taskId
 * @param {object} comment - Comment document (đã populated)
 */
const emitCommentCreated = (taskId, comment) => {
  console.log(`[Socket Emit] comment:created to task ${taskId}, commentId: ${comment._id}`);
  getIO().to(taskId).emit('comment:created', comment);
};

/**
 * Emit khi một comment bị xóa
 * @param {string} taskId
 * @param {string} commentId
 */
const emitCommentDeleted = (taskId, commentId) => {
  console.log(`[Socket Emit] comment:deleted to task ${taskId}, commentId: ${commentId}`);
  getIO().to(taskId).emit('comment:deleted', { commentId, taskId });
};

/**
 * Emit khi một comment được chỉnh sửa
 * @param {string} taskId
 * @param {object} comment - Comment document sau update (đã populated)
 */
const emitCommentUpdated = (taskId, comment) => {
  console.log(`[Socket Emit] comment:updated to task ${taskId}, commentId: ${comment._id}`);
  getIO().to(taskId).emit('comment:updated', comment);
};

module.exports = { emitCommentCreated, emitCommentDeleted, emitCommentUpdated };
