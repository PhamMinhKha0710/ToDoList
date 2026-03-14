const taskService = require('./task.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const { toCreateTaskDTO } = require('./dtos/createTask.dto');
const { toUpdateTaskDTO } = require('./dtos/updateTask.dto');
const { toMoveTaskDTO } = require('./dtos/moveTask.dto');
const { toTaskResponseDTO } = require('./dtos/taskResponse.dto');
const { toAddTagsDTO } = require('./dtos/tag.dto');

/**
 * POST /api/v1/tasks
 */
const createTask = catchAsync(async (req, res) => {

  const taskData = toCreateTaskDTO(req.body);
  const task = await taskService.createTask(taskData, req.files);
  new ApiResponse(201, 'Tạo tác vụ thành công', { task: toTaskResponseDTO(task) }).send(res);
});

/**
 * GET /api/v1/tasks/column/:columnId
 */
const getTasksByColumnId = catchAsync(async (req, res) => {
  const tasks = await taskService.getTasksByColumnId(req.params.columnId);
  new ApiResponse(200, 'Lấy danh sách tác vụ thành công', { tasks: tasks.map(toTaskResponseDTO) }).send(res);
});

/**
 * GET /api/v1/tasks/:taskId
 */
const getTaskById = catchAsync(async (req, res) => {
  const task = await taskService.getTaskById(req.params.taskId);
  new ApiResponse(200, 'Lấy chi tiết tác vụ thành công', { task: toTaskResponseDTO(task) }).send(res);
});

/**
 * PUT /api/v1/tasks/:taskId
 */
const updateTask = catchAsync(async (req, res) => {
  const updateData = toUpdateTaskDTO(req.body);
  const task = await taskService.updateTask(req.params.taskId, updateData);
  new ApiResponse(200, 'Cập nhật tác vụ thành công', { task: toTaskResponseDTO(task) }).send(res);
});

/**
 * POST /api/v1/tasks/move
 */
const moveTask = catchAsync(async (req, res) => {
  const moveData = toMoveTaskDTO(req.body);
  // Add taskId from params or body. Let's assume it's in body as per DTO / validator or we can pull it from body.
  const payload = {
    ...moveData,
    taskId: req.body.taskId // Ensure taskId is passed in body
  };
  await taskService.moveTask(payload);
  new ApiResponse(200, 'Di chuyển tác vụ thành công').send(res);
});

/**
 * DELETE /api/v1/tasks/:taskId
 */
const deleteTask = catchAsync(async (req, res) => {
  await taskService.deleteTask(req.params.taskId);
  new ApiResponse(200, 'Xóa tác vụ thành công').send(res);
});

/**
 * POST /api/v1/tasks/:taskId/tags
 */
const addTags = catchAsync(async (req, res) => {
  const tagsData = toAddTagsDTO(req.body);
  const task = await taskService.addTagsToTask(req.params.taskId, tagsData);
  new ApiResponse(200, 'Thêm tag thành công', { task: toTaskResponseDTO(task) }).send(res);
});

/**
 * DELETE /api/v1/tasks/:taskId/tags/:tagName
 */
const removeTag = catchAsync(async (req, res) => {
  const task = await taskService.removeTagFromTask(req.params.taskId, req.params.tagName);
  new ApiResponse(200, 'Xóa tag thành công', { task: toTaskResponseDTO(task) }).send(res);
});

module.exports = {
  createTask,
  getTasksByColumnId,
  getTaskById,
  updateTask,
  moveTask,
  deleteTask,
  addTags,
  removeTag,
};
