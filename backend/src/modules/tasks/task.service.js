const taskRepository = require('./task.repository');
const Column = require('../../models/Column');
const ApiError = require('../../utils/ApiError');
const attachmentRepository = require('../attachments/attachment.repository');

const createTask = async (taskData, files) => {
  const column = await Column.findById(taskData.columnId);
  if (!column) {
    throw new ApiError(404, 'Không tìm thấy cột tương ứng');
  }

  // Repository handles task creation, column order update, and attachments
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

  // 1. Remove task ID from the associated column's taskOrder
  await taskRepository.removeTaskFromColumnOrder(task.columnId, taskId);

  // 2. Delete the actual task
  await taskRepository.deleteTask(taskId);
};

const moveTask = async (moveData) => {
  const { sourceColumnId, destinationColumnId, sourceIndex, destinationIndex, taskId } = moveData;

  const sourceColumn = await Column.findById(sourceColumnId);
  const destColumn = await Column.findById(destinationColumnId);

  if (!sourceColumn || !destColumn) {
    throw new ApiError(404, 'Không tìm thấy cột nguồn hoặc cột đích');
  }

  // Same Column Move
  if (sourceColumnId === destinationColumnId) {
    const newTaskOrder = Array.from(sourceColumn.taskOrder);
    // Remove from sourceIndex
    newTaskOrder.splice(sourceIndex, 1);
    // Insert into destinationIndex
    newTaskOrder.splice(destinationIndex, 0, taskId);

    await Column.findByIdAndUpdate(sourceColumnId, { taskOrder: newTaskOrder }, { new: true });
    return;
  }

  // Different Column Move
  const sourceTaskOrder = Array.from(sourceColumn.taskOrder);
  const destTaskOrder = Array.from(destColumn.taskOrder);

  // Remove from source
  sourceTaskOrder.splice(sourceIndex, 1);
  // Add to destination
  destTaskOrder.splice(destinationIndex, 0, taskId);

  await Promise.all([
    Column.findByIdAndUpdate(sourceColumnId, { taskOrder: sourceTaskOrder }, { new: true }),
    Column.findByIdAndUpdate(destinationColumnId, { taskOrder: destTaskOrder }, { new: true }),
    taskRepository.updateTask(taskId, { columnId: destinationColumnId }) // Update columnRef of the task
  ]);
};

const addTagsToTask = async (taskId, tagsArray) => {
  const task = await taskRepository.getTaskById(taskId);
  if (!task) {
    throw new ApiError(404, 'Không tìm thấy task để thêm tag');
  }

  if (!tagsArray || tagsArray.length === 0) {
    return task; // No tags to add, return current task
  }

  // Handle unique tag check via JS instead of raw mongo $addToSet for better colored duplicates resolution
  // Assuming a tag name should be unique in the given task
  const existingNames = task.tags.map(t => t.name.toLowerCase());
  const newTagsToInsert = tagsArray.filter(t => !existingNames.includes(t.name.toLowerCase()));

  if (newTagsToInsert.length === 0) {
    return task; // All tags already exist, return as is
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
