const taskRepository = require('./task.repository');
const Column = require('../../models/Column');
const Task = require('../../models/Task');
const ApiError = require('../../utils/ApiError');
const attachmentRepository = require('../attachments/attachment.repository');

const createTask = async (taskData, files) => {
  const column = await Column.findById(taskData.columnId);
  if (!column) {
    throw new ApiError(404, 'Không tìm thấy cột tương ứng');
  }

  return await taskRepository.createTask(taskData, files);
};

const getTasksByColumnId = async (columnId) => {
  return await taskRepository.getTasksByColumnId(columnId);
};

const getTaskById = async (taskId) => {
  const task = await taskRepository.getTaskById(taskId);
  if (!task) {
    throw new ApiError(404, 'Không tìm thấy task');
  }
  return task;
};

const updateTask = async (taskId, updateData) => {
  const task = await taskRepository.updateTask(taskId, updateData);
  if (!task) {
    throw new ApiError(404, 'Không tìm thấy task để cập nhật');
  }
  return task;
};

const deleteTask = async (taskId) => {
  const task = await taskRepository.getTaskById(taskId);
  if (!task) {
    throw new ApiError(404, 'Không tìm thấy task để xóa');
  }

  const columnId = task.columnId;
  const deletedPosition = task.position;

  // Xóa task
  await taskRepository.deleteTask(taskId);

  // Compact positions của tasks còn lại trong cùng column
  await Task.updateMany(
    { columnId, position: { $gt: deletedPosition } },
    { $inc: { position: -1 } }
  );
};

/**
 * Di chuyển task (drag & drop)
 * Nhận mảng taskIds theo thứ tự mới để bulk-update position
 */
const moveTask = async (moveData) => {
  const { taskId, sourceColumnId, destinationColumnId, sourceTaskIds, destinationTaskIds } = moveData;

  // Validate task tồn tại
  const task = await taskRepository.getTaskById(taskId);
  if (!task) {
    throw new ApiError(404, 'Không tìm thấy task');
  }

  if (sourceColumnId === destinationColumnId) {
    // Same column: chỉ reorder trong source
    await taskRepository.reorderTasks(sourceTaskIds, sourceColumnId);
  } else {
    // Cross-column: reorder cả hai column và update columnId của task
    await taskRepository.reorderTasks(
      sourceTaskIds,
      sourceColumnId,
      destinationTaskIds,
      destinationColumnId,
      taskId
    );
  }
};

const addTagsToTask = async (taskId, tagsArray) => {
  const task = await taskRepository.getTaskById(taskId);
  if (!task) {
    throw new ApiError(404, 'Không tìm thấy task để thêm tag');
  }

  if (!tagsArray || tagsArray.length === 0) {
    return task;
  }

  const existingNames = task.tags.map(t => t.name.toLowerCase());
  const newTagsToInsert = tagsArray.filter(t => !existingNames.includes(t.name.toLowerCase()));

  if (newTagsToInsert.length === 0) {
    return task;
  }

  return await taskRepository.addTagsToTask(taskId, newTagsToInsert);
};

const removeTagFromTask = async (taskId, tagName) => {
  const task = await taskRepository.getTaskById(taskId);
  if (!task) {
    throw new ApiError(404, 'Không tìm thấy task để xóa tag');
  }

  return await taskRepository.removeTagFromTask(taskId, tagName);
};

module.exports = {
  createTask,
  getTasksByColumnId,
  getTaskById,
  updateTask,
  deleteTask,
  moveTask,
  addTagsToTask,
  removeTagFromTask,
};
