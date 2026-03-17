const { getIO } = require('../config/socket');

/**
 * Emit khi một column được tạo mới
 * @param {string} projectId
 * @param {object} column
 */
const emitColumnCreated = (projectId, column) => {
  getIO().to(projectId).emit('column:created', column);
};

/**
 * Emit khi một column được cập nhật (tên, màu...)
 * @param {string} projectId
 * @param {object} column
 */
const emitColumnUpdated = (projectId, column) => {
  getIO().to(projectId).emit('column:updated', column);
};

/**
 * Emit khi một column bị xóa
 * @param {string} projectId
 * @param {string} columnId
 */
const emitColumnDeleted = (projectId, columnId) => {
  getIO().to(projectId).emit('column:deleted', { columnId });
};

/**
 * Emit khi các column được reorder (drag & drop)
 * @param {string} projectId
 * @param {object[]} columns - Mảng column objects theo thứ tự mới
 */
const emitColumnsReordered = (projectId, columns) => {
  getIO().to(projectId).emit('column:reordered', columns);
};

module.exports = { emitColumnCreated, emitColumnUpdated, emitColumnDeleted, emitColumnsReordered };
