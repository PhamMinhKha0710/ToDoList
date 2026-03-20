const Task = require('../entities/Task');
const Attachment = require('../entities/Attachment');
const mongoose = require('mongoose');

const createTask = async (taskData, files = []) => {
  // Tính position mới = số task hiện tại trong column
  const count = await Task.countDocuments({ columnId: taskData.columnId });
  const task = await Task.create({ ...taskData, position: count });

  // Tạo attachments nếu có file
  let attachments = [];
  if (files && files.length > 0) {
    const attachmentPromises = files.map(file => {
      return Attachment.create({
        taskId: task._id,
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
      });
    });
    attachments = await Promise.all(attachmentPromises);
  }

  const taskObj = task.toObject();
  taskObj.attachments = attachments;
  return taskObj;
};

const getTasksByColumnId = async (columnId) => {
  const tasks = await Task.find({ columnId })
    .sort({ position: 1 }) // Sort theo position thay vì taskOrder[]
    .populate('creatorId assignees', 'displayName email avatar avatarUrl');

  const tasksWithAttachments = await Promise.all(
    tasks.map(async (task) => {
      const taskObj = task.toObject();
      const attachments = await Attachment.find({ taskId: task._id });
      taskObj.attachments = attachments;
      return taskObj;
    })
  );

  return tasksWithAttachments;
};

const getTaskById = async (taskId) => {
  return await Task.findById(taskId).populate('creatorId assignees', 'displayName email avatar');
};

const updateTask = async (taskId, updateData) => {
  return await Task.findByIdAndUpdate(taskId, updateData, { new: true });
};

const deleteTask = async (taskId) => {
  return await Task.findByIdAndDelete(taskId);
};

/**
 * Khi xóa task, compact lại position của các task còn lại trong column
 */
const compactPositionsInColumn = async (columnId) => {
  const tasks = await Task.find({ columnId }).sort({ position: 1 });
  const bulkOps = tasks.map((task, index) => ({
    updateOne: {
      filter: { _id: task._id },
      update: { $set: { position: index } },
    },
  }));
  if (bulkOps.length > 0) {
    await Task.bulkWrite(bulkOps);
  }
};

/**
 * Reorder tasks trong một hoặc hai column (khi kéo thả)
 * @param {string[]} sourceTaskIds - Mảng taskId theo thứ tự mới của source column
 * @param {string} sourceColumnId
 * @param {string[]} [destTaskIds] - Mảng taskId theo thứ tự mới của dest column (nếu cross-column)
 * @param {string} [destColumnId]
 * @param {string} [movedTaskId] - Task bị di chuyển sang column khác
 */
const reorderTasks = async (sourceTaskIds, sourceColumnId, destTaskIds, destColumnId, movedTaskId) => {
  const ops = [];

  // Update source column positions
  sourceTaskIds.forEach((id, index) => {
    ops.push({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: { position: index, columnId: new mongoose.Types.ObjectId(sourceColumnId) } },
      },
    });
  });

  // Update dest column positions (cross-column move)
  if (destTaskIds && destColumnId && movedTaskId) {
    destTaskIds.forEach((id, index) => {
      ops.push({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(id) },
          update: { $set: { position: index, columnId: new mongoose.Types.ObjectId(destColumnId) } },
        },
      });
    });
  }

  if (ops.length > 0) {
    await Task.bulkWrite(ops);
  }
};

const addTagsToTask = async (taskId, tagsArray) => {
  return await Task.findByIdAndUpdate(
    taskId,
    { $push: { tags: { $each: tagsArray } } },
    { new: true }
  ).populate('creatorId assignees', 'displayName email avatar');
};

const removeTagFromTask = async (taskId, tagName) => {
  return await Task.findByIdAndUpdate(
    taskId,
    { $pull: { tags: { name: tagName } } },
    { new: true }
  ).populate('creatorId assignees', 'displayName email avatar');
};

const getAllTasksForUser = async (userId) => {
  const Project = require('../entities/Project');
  const Column = require('../entities/Column');

  // 1. Find all projects where user is a member
  const projects = await Project.find({
    'members.userId': userId
  });

  const projectIds = projects.map(p => p._id);

  // 2. Find all columns belong to those projects
  const columns = await Column.find({
    projectId: { $in: projectIds }
  });

  const columnIds = columns.map(c => c._id);

  // 3. Find all tasks in those columns
  const tasks = await Task.find({
    columnId: { $in: columnIds }
  }).populate('creatorId assignees', 'displayName email avatar avatarUrl');

  return tasks;
};

module.exports = {
  createTask,
  getTasksByColumnId,
  getTaskById,
  updateTask,
  deleteTask,
  compactPositionsInColumn,
  reorderTasks,
  addTagsToTask,
  removeTagFromTask,
  getAllTasksForUser,
};
