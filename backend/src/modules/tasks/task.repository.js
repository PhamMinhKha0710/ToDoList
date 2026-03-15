const Task = require('../../models/Task');
const Column = require('../../models/Column');
const Attachment = require('../../models/Attachment');

const createTask = async (taskData, files = []) => {
  // 1. Create the task
  const task = await Task.create(taskData);
  
  // 2. Add task to column order
  await Column.findByIdAndUpdate(
    taskData.columnId,
    { $push: { taskOrder: task._id } },
    { new: true }
  );

  // 3. Create attachments if files are provided
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

  // Return task as plain object with attachments included
  const taskObj = task.toObject();
  taskObj.attachments = attachments;
  return taskObj;
};

const getTasksByColumnId = async (columnId) => {
  const tasks = await Task.find({ columnId })
    .populate('creatorId assignees', 'displayName email avatar avatarUrl');

  // Fetch attachments for all these tasks concurrently
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

const addTagsToTask = async (taskId, tagsArray) => {
  // Use $addToSet or multiple $push. We will use $push with $each to allow duplicate tag names with different colors,
  // or $addToSet if we want strictly unique tags. Let's use $push with $each to simply append, 
  // but a better approach is to pull existing tags with the same name first to avoid duplicates, 
  // or handle uniqueness in logic. For simplicity, $push with $each as requested by typical 'add Tags' behavior.
  return await Task.findByIdAndUpdate(
    taskId,
    { $push: { tags: { $each: tagsArray } } },
    { new: true }
  ).populate('creatorId assignees', 'displayName email avatar');
};

const removeTagFromTask = async (taskId, tagName) => {
  // Removes all tags that match the given name
  return await Task.findByIdAndUpdate(
    taskId,
    { $pull: { tags: { name: tagName } } },
    { new: true }
  ).populate('creatorId assignees', 'displayName email avatar');
};

module.exports = {
  createTask,
  getTasksByColumnId,
  getTaskById,
  updateTask,
  deleteTask,
  updateColumnTaskOrder,
  removeTaskFromColumnOrder,
  addTagsToTask,
  removeTagFromTask,
};
