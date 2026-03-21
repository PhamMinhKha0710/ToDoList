const taskService = require('../services/task.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { toCreateTaskDTO } = require('../models/tasks/createTask.model');
const { toUpdateTaskDTO } = require('../models/tasks/updateTask.model');
const { toMoveTaskDTO } = require('../models/tasks/moveTask.model');
const { toTaskResponseDTO } = require('../models/tasks/taskResponse.model');
const { toAddTagsDTO } = require('../models/tasks/tag.model');
const User = require('../entities/User');
const Column = require('../entities/Column');
const Project = require('../entities/Project');
const mailService = require('../services/mail.service');
const { CLIENT_URL } = require('../config/env');

class TaskController {
  /**
   * POST /api/tasks
   */
  createTask = catchAsync(async (req, res) => {
    const taskData = toCreateTaskDTO(req.body);
    taskData.creatorId = req.user._id; // Inject creator from authenticated user
    const task = await taskService.createTask(taskData, req.files);
    
    // -- Thông báo Email Bất đồng bộ --
    if (task.assignees && task.assignees.length > 0) {
      (async () => {
        try {
          const column = await Column.findById(task.columnId);
          const project = await Project.findById(column.projectId);
          const assignees = await User.find({ _id: { $in: task.assignees } });
          
          const projectUrl = `${CLIENT_URL}/projects/${project._id}`;
          const assignerName = req.user.displayName || req.user.email;

          assignees.forEach(user => {
            mailService.sendTaskAssignmentEmail(
              user.email,
              task.title,
              project.name,
              assignerName,
              projectUrl
            ).catch(err => console.error('Error sending task assignment email:', err));
          });
        } catch (err) {
          console.error('Failed to process task assignment emails:', err);
        }
      })();
    }

    new ApiResponse(201, 'Tạo tác vụ thành công', { task: toTaskResponseDTO(task) }).send(res);
  });

  /**
   * GET /api/tasks/column/:columnId
   */
  getTasksByColumnId = catchAsync(async (req, res) => {
    const tasks = await taskService.getTasksByColumnId(req.params.columnId);
    new ApiResponse(200, 'Lấy danh sách tác vụ thành công', { tasks: tasks.map(toTaskResponseDTO) }).send(res);
  });

  /**
   * GET /api/tasks/:taskId
   */
  getTaskById = catchAsync(async (req, res) => {
    const task = await taskService.getTaskById(req.params.taskId);
    new ApiResponse(200, 'Lấy chi tiết tác vụ thành công', { task: toTaskResponseDTO(task) }).send(res);
  });

  /**
   * PUT /api/tasks/:taskId
   */
  updateTask = catchAsync(async (req, res) => {
    const updateData = toUpdateTaskDTO(req.body);
    const existingTask = await taskService.getTaskById(req.params.taskId);
    
    const task = await taskService.updateTask(req.params.taskId, updateData, req.user._id);

    // -- Thông báo Email Bất đồng bộ cho assignees mới --
    if (updateData.assignees !== undefined) {
      (async () => {
        try {
          const oldAssigneeIds = existingTask.assignees.map(u => u._id ? u._id.toString() : u.toString());
          const newAssigneeIds = Array.isArray(updateData.assignees) 
            ? updateData.assignees.map(id => id.toString()) 
            : [];
          
          // Tìm ra ai là người VỪA MỚI được gán
          const newlyAssignedIds = newAssigneeIds.filter(id => !oldAssigneeIds.includes(id));
          
          if (newlyAssignedIds.length > 0) {
            const column = await Column.findById(task.columnId);
            const project = await Project.findById(column.projectId);
            const newAssignees = await User.find({ _id: { $in: newlyAssignedIds } });
            
            const projectUrl = `${CLIENT_URL}/projects/${project._id}`;
            const assignerName = req.user.displayName || req.user.email;

            newAssignees.forEach(user => {
              mailService.sendTaskAssignmentEmail(
                user.email,
                task.title,
                project.name,
                assignerName,
                projectUrl
              ).catch(err => console.error('Error sending task assignment email:', err));
            });
          }
        } catch (err) {
          console.error('Failed to process task update assignment emails:', err);
        }
      })();
    }

    new ApiResponse(200, 'Cập nhật tác vụ thành công', { task: toTaskResponseDTO(task) }).send(res);
  });

  /**
   * POST /api/tasks/move
   */
  moveTask = catchAsync(async (req, res) => {
    const moveData = toMoveTaskDTO(req.body);
    await taskService.moveTask(moveData, req.user._id);
    new ApiResponse(200, 'Di chuyển tác vụ thành công').send(res);
  });

  /**
   * DELETE /api/tasks/:taskId
   */
  deleteTask = catchAsync(async (req, res) => {
    await taskService.deleteTask(req.params.taskId, req.user._id);
    new ApiResponse(200, 'Xóa tác vụ thành công').send(res);
  });

  /**
   * POST /api/tasks/:taskId/tags  
   */
  addTags = catchAsync(async (req, res) => {
    const tagsData = toAddTagsDTO(req.body);
    const task = await taskService.addTagsToTask(req.params.taskId, tagsData);
    new ApiResponse(200, 'Thêm tag thành công', { task: toTaskResponseDTO(task) }).send(res);
  });

  /**
   * DELETE /api/tasks/:taskId/tags/:tagName
   */
  removeTag = catchAsync(async (req, res) => {
    const task = await taskService.removeTagFromTask(req.params.taskId, req.params.tagName);
    new ApiResponse(200, 'Xóa tag thành công', { task: toTaskResponseDTO(task) }).send(res);
  });
}

module.exports = new TaskController();
