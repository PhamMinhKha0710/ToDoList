const projectService = require('../services/project.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Task = require('../entities/Task');
const Column = require('../entities/Column');
const PersonalTask = require('../entities/PersonalTask');

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
  console.log('=== MIDDLEWARE isProjectManagerOrAbove ===');
  console.log('User ID:', req.user._id);
  console.log('Project ID:', req.params.projectId);
  const projectId = req.params.projectId;
  const project = await projectService.getProjectById(projectId);
  console.log('Project found:', project ? project._id : 'No project');

  const role = getUserRole(project, req.user._id);
  console.log('User role in project:', role);
  if (role !== 'owner' && role !== 'admin') {
    console.log('Access denied: user is not owner or admin');
    throw new ApiError(403, 'Chỉ Owner hoặc Admin mới có quyền thực hiện hành động này');
  }

  console.log('Access granted for role:', role);
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
  
  let task = await Task.findById(taskId);
  let isPersonal = false;

  if (!task) {
    // Thử tìm trong PersonalTask
    task = await PersonalTask.findById(taskId);
    if (!task) throw new ApiError(404, 'Không tìm thấy task');
    isPersonal = true;
  }

  if (isPersonal) {
    // Nếu là personal task, chỉ cần check xem có phải chủ sở hữu không
    if (task.userId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Bạn không có quyền chỉnh sửa công việc cá nhân của người khác');
    }
  } else {
    // Nếu là project task, thực hiện logic phân quyền cũ
    const column = await Column.findById(task.columnId);
    if (!column) throw new ApiError(404, 'Không tìm thấy cột tương ứng của task');

    const project = await projectService.getProjectById(column.projectId);
    const role = getUserRole(project, req.user._id);

    if (!role) throw new ApiError(403, 'Bạn không phải thành viên của dự án');
    if (role === 'viewer') throw new ApiError(403, 'Viewer không có quyền chỉnh sửa task');
    if (role === 'member') {
      const isCreator = task.creatorId && task.creatorId.toString() === req.user._id.toString();
      const isAssignee = task.assignees && task.assignees.some(id => id.toString() === req.user._id.toString());
      
      if (!isCreator && !isAssignee) {
        throw new ApiError(403, 'Bạn chỉ có quyền chỉnh sửa task do mình tạo hoặc được gán cho bạn');
      }
    }
    
    req.project = project;
    req.userRole = role;
  }

  req.task = task;
  next();
});

module.exports = {
  isProjectMember,
  isProjectOwner,
  isProjectManagerOrAbove,
  canWriteTask,
  canModifyTask,
};
