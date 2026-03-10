const projectService = require('./project.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/v1/projects
 */
const createProject = catchAsync(async (req, res) => {
  const project = await projectService.createProject(req.user._id, req.body);
  new ApiResponse(201, 'Tạo dự án thành công', { project }).send(res);
});

/**
 * GET /api/v1/projects
 */
const getUserProjects = catchAsync(async (req, res) => {
  const projects = await projectService.getUserProjects(req.user._id);
  new ApiResponse(200, 'Lấy danh sách dự án thành công', { projects }).send(res);
});

/**
 * GET /api/v1/projects/:projectId
 */
const getProjectById = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId);
  new ApiResponse(200, 'Lấy thông tin dự án thành công', { project }).send(res);
});

/**
 * PUT /api/v1/projects/:projectId
 */
const updateProject = catchAsync(async (req, res) => {
  const project = await projectService.updateProject(req.params.projectId, req.body);
  new ApiResponse(200, 'Cập nhật dự án thành công', { project }).send(res);
});

/**
 * DELETE /api/v1/projects/:projectId
 */
const deleteProject = catchAsync(async (req, res) => {
  await projectService.deleteProject(req.params.projectId);
  new ApiResponse(200, 'Xóa dự án thành công').send(res);
});

/**
 * POST /api/v1/projects/:projectId/members
 */
const addMember = catchAsync(async (req, res) => {
  const project = await projectService.addMember(req.params.projectId, req.body.email);
  new ApiResponse(200, 'Thêm thành viên thành công', { project }).send(res);
});

/**
 * DELETE /api/v1/projects/:projectId/members/:memberId
 */
const removeMember = catchAsync(async (req, res) => {
  const project = await projectService.removeMember(req.params.projectId, req.params.memberId);
  new ApiResponse(200, 'Xóa thành viên thành công', { project }).send(res);
});

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};
