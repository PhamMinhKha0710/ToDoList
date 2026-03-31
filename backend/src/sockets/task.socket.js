const { getIO } = require('../config/socket');

/**
 * Emit khi một task được tạo mới
 * @param {string} projectId
 * @param {object} task - Task document (đã populate nếu cần)
 */
const emitTaskCreated = (projectId, task) => {
  console.log(`[Socket Emit] task:created to project ${projectId}, taskId: ${task._id}`);
  getIO().to(projectId).emit('task:created', task);
};

/**
 * Emit khi một task được cập nhật
 * @param {string} projectId
 * @param {object} task - Task document sau update
 */
const emitTaskUpdated = (projectId, task) => {
  console.log(`[Socket Emit] task:updated to project ${projectId}, taskId: ${task._id}`);
  getIO().to(projectId).emit('task:updated', task);
};

/**
 * Emit khi một task bị xóa
 * @param {string} projectId
 * @param {string} taskId
 * @param {string} columnId
 */
const emitTaskDeleted = (projectId, taskId, columnId) => {
  console.log(`[Socket Emit] task:deleted to project ${projectId}, taskId: ${taskId}`);
  getIO().to(projectId).emit('task:deleted', { taskId, columnId });
};

/**
 * Emit khi task bị di chuyển (drag & drop)
 * @param {string} projectId
 * @param {object} moveData - { taskId, sourceColumnId, destinationColumnId, sourceTaskIds, destinationTaskIds }
 */
const emitTaskMoved = (projectId, moveData) => {
  console.log(`[Socket Emit] task:moved to project ${projectId}, taskId: ${moveData.taskId}`);
  getIO().to(projectId).emit('task:moved', moveData);
};

module.exports = { emitTaskCreated, emitTaskUpdated, emitTaskDeleted, emitTaskMoved };
