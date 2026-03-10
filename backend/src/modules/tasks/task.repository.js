const Task = require('../../models/Task');
const Column = require('../../models/Column');

const createTask = async (taskData) => {
  return await Task.create(taskData);
};

const getTasksByColumnId = async (columnId) => {
  return await Task.find({ columnId }).populate('assigneeId', 'displayName email avatar');
};

const getTaskById = async (taskId) => {
  return await Task.findById(taskId).populate('assigneeId', 'displayName email avatar');
};

const updateTask = async (taskId, updateData) => {
  return await Task.findByIdAndUpdate(taskId, updateData, { new: true });
};

const deleteTask = async (taskId) => {
  return await Task.findByIdAndDelete(taskId);
};

const updateColumnTaskOrder = async (columnId, taskId) => {
  return await Column.findByIdAndUpdate(
    columnId,
    { $push: { taskOrder: taskId } },
    { new: true }
  );
};

const removeTaskFromColumnOrder = async (columnId, taskId) => {
  return await Column.findByIdAndUpdate(
    columnId,
    { $pull: { taskOrder: taskId } },
    { new: true }
  );
};

module.exports = {
  createTask,
  getTasksByColumnId,
  getTaskById,
  updateTask,
  deleteTask,
  updateColumnTaskOrder,
  removeTaskFromColumnOrder,
};
