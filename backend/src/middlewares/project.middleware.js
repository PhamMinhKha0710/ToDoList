const projectService = require('../modules/projects/project.service');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');

const isProjectMember = catchAsync(async (req, res, next) => {
  const projectId = req.params.projectId;
  const project = await projectService.getProjectById(projectId);

  const isMember = project.members.some(
    (member) => member.userId._id.toString() === req.user._id.toString()
  );

  if (!isMember) {
    throw new ApiError(403, 'Bạn không có quyền truy cập vào dự án này');
  }

  // Gắn project vào req để các middleware/controller sau không cần query lại nếu cần
  req.project = project;
  next();
});

const isProjectOwner = catchAsync(async (req, res, next) => {
  const projectId = req.params.projectId;
  const project = await projectService.getProjectById(projectId);

  const isOwner = project.members.some(
    (member) =>
      member.userId._id.toString() === req.user._id.toString() &&
      member.role === 'owner'
  );

  if (!isOwner) {
    throw new ApiError(403, 'Chỉ Project Owner mới có quyền thực hiện hành động này');
  }

  req.project = project;
  next();
});

module.exports = {
  isProjectMember,
  isProjectOwner,
};
