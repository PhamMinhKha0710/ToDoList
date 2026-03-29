const { getIO } = require('../config/socket');

/**
 * Emit khi một task được tạo mới
 * @param {string} projectId
 * @param {object} task - Task document (đã populate nếu cần)
 */
const emitTaskCreated = (projectId, task) => {
  getIO().to(projectId).emit('task:created', task);
};

/**
 * Emit khi một task được cập nhật
 * @param {string} projectId
 * @param {object} task - Task document sau update
 */
const emitTaskUpdated = (projectId, task) => {
  getIO().to(projectId).emit('task:updated', task);
};

/**
 * Emit khi một task bị xóa
 * @param {string} projectId
 * @param {string} taskId
 * @param {string} columnId
 */
const emitTaskDeleted = (projectId, taskId, columnId) => {
  getIO().to(projectId).emit('task:deleted', { taskId, columnId });
};

/**
 * Emit khi task bị di chuyển (drag & drop)
 * @param {string} projectId
 * @param {object} moveData - { taskId, sourceColumnId, destinationColumnId, sourceTaskIds, destinationTaskIds }
 */
const emitTaskMoved = (projectId, moveData) => {
  getIO().to(projectId).emit('task:moved', moveData);
};

module.exports = { emitTaskCreated, emitTaskUpdated, emitTaskDeleted, emitTaskMoved };
