const projectService = require('../modules/projects/project.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Task = require('../models/Task');
const Column = require('../models/Column');

// Helper: lấy role của user hiện tại trong project
const getUserRole = (project, userId) => {
  const member = project.members.find(
    (m) => {
      const mUserId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
      return mUserId === userId.toString();
    }
  );

  // Nếu là thành viên và trạng thái KHÔNG phải pending (mặc định là active hoặc dành cho data cũ)
  if (member && member.status !== 'pending') {
    return member.role;
  }
  return null;
};

// ✅ Tất cả thành viên đều được xem (owner, admin, member, viewer)
const isProjectMember = catchAsync(async (req, res, next) => {
  const projectId = req.params.projectId;
  const project = await projectService.getProjectById(projectId);

  const role = getUserRole(project, req.user._id);
  if (!role) {
    throw new ApiError(403, 'Bạn không có quyền truy cập vào dự án này');
  }

  req.project = project;
  req.userRole = role;
  next();
});

// ✅ Chỉ Owner mới được: đổi role, xóa board, đổi owner
const isProjectOwner = catchAsync(async (req, res, next) => {
  const projectId = req.params.projectId;
  const project = await projectService.getProjectById(projectId);

  const role = getUserRole(project, req.user._id);
  if (role !== 'owner') {
    throw new ApiError(403, 'Chỉ Project Owner mới có quyền thực hiện hành động này');
  }

  req.project = project;
  req.userRole = role;
  next();
});

// ✅ Owner hoặc Admin: tạo/xóa column, thêm/xóa member
const isProjectManagerOrAbove = catchAsync(async (req, res, next) => {
  const projectId = req.params.projectId;
  const project = await projectService.getProjectById(projectId);

  const role = getUserRole(project, req.user._id);
  if (role !== 'owner' && role !== 'admin') {
    throw new ApiError(403, 'Chỉ Owner hoặc Admin mới có quyền thực hiện hành động này');
  }

  req.project = project;
  req.userRole = role;
  next();
});

// ✅ Tất cả trừ Viewer: tạo task, comment, upload file
const canWriteTask = catchAsync(async (req, res, next) => {
  // projectId có thể lấy từ columnId trong body
  const columnId = req.body.columnId;
  if (!columnId) return next(); // Nếu không có columnId, bỏ qua

  const column = await Column.findById(columnId);
  if (!column) throw new ApiError(404, 'Không tìm thấy cột');

  const project = await projectService.getProjectById(column.projectId);
  const role = getUserRole(project, req.user._id);

  if (!role) throw new ApiError(403, 'Bạn không phải thành viên của dự án này');
  if (role === 'viewer') throw new ApiError(403, 'Viewer không có quyền tạo task');

  req.project = project;
  req.userRole = role;
  next();
});

// ✅ Quyền sửa/xóa task: Owner & Admin sửa tất cả; Member chỉ sửa task của mình; Viewer bị chặn
const canModifyTask = catchAsync(async (req, res, next) => {
  const taskId = req.params.taskId || req.body.taskId;
  if (!taskId) throw new ApiError(400, 'Thiếu thông tin tác vụ (taskId)');
  
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Không tìm thấy task');

  const column = await Column.findById(task.columnId);
  if (!column) throw new ApiError(404, 'Không tìm thấy cột');

  const project = await projectService.getProjectById(column.projectId);
  const role = getUserRole(project, req.user._id);

  if (!role) throw new ApiError(403, 'Bạn không phải thành viên của dự án');
  if (role === 'viewer') throw new ApiError(403, 'Viewer không có quyền chỉnh sửa task');
  if (role === 'member') {
    // Member chỉ được sửa task do mình tạo HOẶC mình được gán vào (Assignee)
    const isCreator = task.creatorId && task.creatorId.toString() === req.user._id.toString();
    const isAssignee = task.assignees && task.assignees.some(id => id.toString() === req.user._id.toString());
    
    if (!isCreator && !isAssignee) {
      throw new ApiError(403, 'Bạn chỉ có quyền chỉnh sửa task do mình tạo hoặc được gán cho bạn');
    }
  }
  // owner và admin có thể sửa tất cả

  req.task = task;
  req.project = project;
  req.userRole = role;
  next();
});

module.exports = {
  isProjectMember,
  isProjectOwner,
  isProjectManagerOrAbove,
  canWriteTask,
  canModifyTask,
};
