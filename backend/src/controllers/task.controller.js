const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { toCreateTaskModel } = require('../models/tasks/createTask.model');
const { toUpdateTaskModel } = require('../models/tasks/updateTask.model');
const { toMoveTaskModel } = require('../models/tasks/moveTask.model');
const { toTaskResponseModel } = require('../models/tasks/taskResponse.model');
const { toAddTagsModel } = require('../models/tasks/tag.model');

class TaskController {
  constructor({ taskService, ApiResponse, catchAsync }) {
    this.taskService = taskService;

  }

  createTask = catchAsync(async (req, res) => {
    const taskData = toCreateTaskModel(req.body);
    taskData.creatorId = req.user._id;
    const task = await this.taskService.createTask(taskData, req.files);
    new ApiResponse(201, 'Tạo tác vụ thành công', { task: toTaskResponseModel(task) }).send(res);
  });

  getTasksByColumnId = catchAsync(async (req, res) => {
    const tasks = await this.taskService.getTasksByColumnId(req.params.columnId);
    new ApiResponse(200, 'Lấy danh sách tác vụ thành công', { tasks: tasks.map(toTaskResponseModel) }).send(res);
  });

  getTaskById = catchAsync(async (req, res) => {
    const task = await this.taskService.getTaskById(req.params.taskId);
    new ApiResponse(200, 'Lấy chi tiết tác vụ thành công', { task: toTaskResponseModel(task) }).send(res);
  });

  updateTask = catchAsync(async (req, res) => {
    const updateData = toUpdateTaskModel(req.body);
    const task = await this.taskService.updateTask(req.params.taskId, updateData, req.user._id);
    new ApiResponse(200, 'Cập nhật tác vụ thành công', { task: toTaskResponseModel(task) }).send(res);
  });

  moveTask = catchAsync(async (req, res) => {
    const moveData = toMoveTaskModel(req.body);
    await this.taskService.moveTask(moveData, req.user._id);
    new ApiResponse(200, 'Di chuyển tác vụ thành công').send(res);
  });

  deleteTask = catchAsync(async (req, res) => {
    await this.taskService.deleteTask(req.params.taskId, req.user._id);
    new ApiResponse(200, 'Xóa tác vụ thành công').send(res);
  });

  addTags = catchAsync(async (req, res) => {
    const tagsData = toAddTagsModel(req.body);
    const task = await this.taskService.addTagsToTask(req.params.taskId, tagsData);
    new ApiResponse(200, 'Thêm tag thành công', { task: toTaskResponseModel(task) }).send(res);
  });

  removeTag = catchAsync(async (req, res) => {
    const task = await this.taskService.removeTagFromTask(req.params.taskId, req.params.tagName);
    new ApiResponse(200, 'Xóa tag thành công', { task: toTaskResponseModel(task) }).send(res);
  });

  getAllTasksForUser = catchAsync(async (req, res) => {
    const tasks = await this.taskService.getAllTasksForUser(req.user._id);
    new ApiResponse(200, 'Lấy danh sách tác vụ thành công', { tasks: tasks.map(toTaskResponseModel) }).send(res);
  });
}

module.exports = TaskController;
