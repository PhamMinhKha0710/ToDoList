const Column = require('../models/Column');
const projectService = require('../modules/projects/project.service');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const requireColumnOwner = catchAsync(async (req, res, next) => {
  const columnId = req.params.columnId;
  const column = await Column.findById(columnId);
  if (!column) {
    throw new ApiError(404, 'Không tìm thấy cột');
  }

  // Check project ownership
  const project = await projectService.getProjectById(column.projectId);
  const isOwner = project.members.some(
    (m) => m.userId._id.toString() === req.user._id.toString() && m.role === 'owner'
  );

  if (!isOwner) {
    throw new ApiError(403, 'Chỉ Project Owner mới có quyền thay đổi cột');
  }

  req.column = column;
  next();
});

const requireProjectOwnerFromBody = catchAsync(async (req, res, next) => {
  const projectId = req.body.projectId;
  if (!projectId) {
    throw new ApiError(400, 'Thiếu projectId');
  }
  
  const project = await projectService.getProjectById(projectId);
  const isOwner = project.members.some(
    (m) => m.userId._id.toString() === req.user._id.toString() && m.role === 'owner'
  );

  if (!isOwner) {
    throw new ApiError(403, 'Chỉ Project Owner mới có quyền tạo cột');
  }
  
  next();
});

module.exports = { requireColumnOwner, requireProjectOwnerFromBody };
