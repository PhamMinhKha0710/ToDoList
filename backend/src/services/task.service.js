const taskRepository = require('../repositories/task.repository');
const Column = require('../entities/Column');
const Task = require('../entities/Task');
const ApiError = require('../utils/ApiError');
const attachmentRepository = require('../repositories/attachment.repository');

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
  let task = await taskRepository.getTaskById(taskId);
  if (!task) {
    const PersonalTask = require('../entities/PersonalTask');
    task = await PersonalTask.findById(taskId);
    if (task) {
      const taskObj = task.toObject();
      return { ...taskObj, isPersonal: true };
    }
    throw new ApiError(404, 'Không tìm thấy task');
  }
  return { ...task.toObject(), isPersonal: false };
};

const updateTask = async (taskId, updateData) => {
  let task = await taskRepository.updateTask(taskId, updateData);
  if (!task) {
    const PersonalTask = require('../entities/PersonalTask');
    task = await PersonalTask.findByIdAndUpdate(taskId, updateData, { new: true });
    if (task) {
      return { ...task.toObject(), isPersonal: true };
    }
    throw new ApiError(404, 'Không tìm thấy task để cập nhật');
  }
  return { ...task.toObject(), isPersonal: false };
};

const deleteTask = async (taskId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    const PersonalTask = require('../entities/PersonalTask');
    const personalTask = await PersonalTask.findById(taskId);
    if (personalTask) {
      await PersonalTask.findByIdAndDelete(taskId);
      return;
    }
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

const getAllTasksForUser = async (userId) => {
  const personalTaskService = require('./personalTask.service');

  // Lấy project tasks
  const projectTasks = await taskRepository.getAllTasksForUser(userId);

  // Lấy personal tasks
  const personalTasks = await personalTaskService.getPersonalTasks(userId);

  // Gắn nhãn hoặc format lại nếu cần
  const formattedPersonalTasks = personalTasks.map(t => ({
    ...t.toObject(),
    isPersonal: true,
    // Đảm bảo có dueDate để FullCalendar nhận diện (hoặc dùng startDate)
    dueDate: t.endDate || t.startDate
  }));

  return [
    ...projectTasks.map(t => ({ ...t.toObject(), isPersonal: false })),
    ...formattedPersonalTasks
  ];
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
  getAllTasksForUser,
};
