const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { toPersonalTaskModel } = require('../models/personal-tasks/personalTask.model.js');

class PersonalTaskController {
  constructor({ personalTaskService, ApiResponse, catchAsync }) {
    this.personalTaskService = personalTaskService;

  }

  createPersonalTask = catchAsync(async (req, res) => {
    const task = await this.personalTaskService.createPersonalTask(req.user._id, req.body);
    new ApiResponse(201, 'Tạo công việc cá nhân thành công', { task: toPersonalTaskModel(task) }).send(res);
  });

  getPersonalTasks = catchAsync(async (req, res) => {
    const tasks = await this.personalTaskService.getPersonalTasks(req.user._id);
    new ApiResponse(200, 'Lấy danh sách công việc cá nhân thành công', { tasks: tasks.map(toPersonalTaskModel) }).send(res);
  });

  getPersonalTaskById = catchAsync(async (req, res) => {
    const task = await this.personalTaskService.getPersonalTaskById(req.params.taskId, req.user._id);
    new ApiResponse(200, 'Lấy chi tiết công việc cá nhân thành công', { task: toPersonalTaskModel(task) }).send(res);
  });

  updatePersonalTask = catchAsync(async (req, res) => {
    const task = await this.personalTaskService.updatePersonalTask(req.params.taskId, req.body, req.user._id);
    new ApiResponse(200, 'Cập nhật công việc cá nhân thành công', { task: toPersonalTaskModel(task) }).send(res);
  });

  deletePersonalTask = catchAsync(async (req, res) => {
    await this.personalTaskService.deletePersonalTask(req.params.taskId, req.user._id);
    new ApiResponse(200, 'Xóa công việc cá nhân thành công').send(res);
  });
}

module.exports = PersonalTaskController;
