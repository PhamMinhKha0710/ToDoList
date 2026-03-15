const projectService = require("./project.service");
const catchAsync = require("../../utils/catchAsync");
const ApiResponse = require("../../utils/ApiResponse");
const ProjectResponseDTO = require("./dtos/projectResponse.dto");
const uploadService = require("../../services/upload.service");

/**
 * POST /api/projects
 */
const createProject = catchAsync(async (req, res) => {
  const projectData = { ...req.body };
  if (req.file) {
    projectData.imageUrl = uploadService.handleUpload(req.file);
  }

  const project = await projectService.createProject(req.user._id, projectData);
  const projectDTO = ProjectResponseDTO.fromEntity(project);
  new ApiResponse(201, "Tạo dự án thành công", { project: projectDTO }).send(
    res,
  );
});

/**
 * GET /api/projects
 */
const getUserProjects = catchAsync(async (req, res) => {
  const projects = await projectService.getUserProjects(req.user._id);
  const projectsDTO = ProjectResponseDTO.fromEntities(projects);
  new ApiResponse(200, "Lấy danh sách dự án thành công", {
    projects: projectsDTO,
  }).send(res);
});

/**
 * GET /api/projects/:projectId
 */
const getProjectById = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId);
  const projectDTO = ProjectResponseDTO.fromEntity(project);
  new ApiResponse(200, "Lấy thông tin dự án thành công", {
    project: projectDTO,
  }).send(res);
});

/**
 * PUT /api/projects/:projectId
 */
const updateProject = catchAsync(async (req, res) => {
  const projectData = { ...req.body };
  if (req.file) {
    projectData.imageUrl = uploadService.handleUpload(req.file);
  }

  const project = await projectService.updateProject(
    req.params.projectId,
    projectData,
  );
  const projectDTO = ProjectResponseDTO.fromEntity(project);
  new ApiResponse(200, "Cập nhật dự án thành công", {
    project: projectDTO,
  }).send(res);
});

/**
 * DELETE /api/projects/:projectId
 */
const deleteProject = catchAsync(async (req, res) => {
  await projectService.deleteProject(req.params.projectId);
  new ApiResponse(200, "Xóa dự án thành công").send(res);
});

const mailService = require("../../services/mail.service");
const { CLIENT_URL } = require("../../config/env");

/**
 * POST /api/projects/:projectId/members
 */
const addMember = catchAsync(async (req, res) => {
  const role = req.body.role || "member"; // 'member' là default nếu không truyền
  const project = await projectService.addMember(
    req.params.projectId,
    req.body.email,
    role,
  );

  // Gửi email thông báo bất đồng bộ (không await để block response)
  const projectUrl = `${CLIENT_URL}/projects/${project._id}/invite`;
  mailService
    .sendProjectInvitationEmail(
      req.body.email,
      project.name,
      req.user.displayName || req.user.email, // Lấy tên người mời
      projectUrl,
      project.color,
      project.imageUrl,
    )
    .catch((err) => console.error("Error sending invitation email:", err));

  const projectDTO = ProjectResponseDTO.fromEntity(project);
  new ApiResponse(200, "Thêm thành viên thành công", {
    project: projectDTO,
  }).send(res);
});

/**
 * DELETE /api/projects/:projectId/members/:memberId
 */
const removeMember = catchAsync(async (req, res) => {
  const project = await projectService.removeMember(
    req.params.projectId,
    req.params.memberId,
  );
  const projectDTO = ProjectResponseDTO.fromEntity(project);
  new ApiResponse(200, "Xóa thành viên thành công", {
    project: projectDTO,
  }).send(res);
});

/**
 * PUT /api/projects/:projectId/members/:memberId
 */
const updateMemberRole = catchAsync(async (req, res) => {
  const { role } = req.body;
  const project = await projectService.updateMemberRole(
    req.params.projectId,
    req.params.memberId,
    role,
  );
  const projectDTO = ProjectResponseDTO.fromEntity(project);
  new ApiResponse(200, "Cập nhật phân quyền thành công", {
    project: projectDTO,
  }).send(res);
});

/**
 * GET /api/projects/:projectId/invitation
 */
const getInvitationDetails = catchAsync(async (req, res) => {
  const projectDetails = await projectService.getInvitationDetails(
    req.params.projectId,
    req.user._id,
  );
  new ApiResponse(200, "Lấy thông tin lời mời thành công", {
    project: projectDetails,
  }).send(res);
});

/**
 * POST /api/projects/:projectId/invitation/respond
 */
const respondToInvitation = catchAsync(async (req, res) => {
  const { action } = req.body;
  await projectService.respondToInvitation(
    req.params.projectId,
    req.user._id,
    action,
  );
  const message =
    action === "accept" ? "Chấp nhận lời mời thành công" : "Đã từ chối lời mời";
  new ApiResponse(200, message).send(res);
});

module.exports = {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
  getInvitationDetails,
  respondToInvitation,
};
