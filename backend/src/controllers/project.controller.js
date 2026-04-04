const projectService = require("../services/project.service");
const catchAsync = require("../utils/catchAsync");
const ApiResponse = require("../utils/ApiResponse");
const ProjectResponseModel = require("../models/projects/projectResponse.model");
const uploadService = require("../services/upload.service");
const mailService = require("../services/mail.service");
const { CLIENT_URL } = require("../config/env");

class ProjectController {
  /**
   * POST /api/projects
   */
  createProject = catchAsync(async (req, res) => {
    const projectData = { ...req.body };
    if (req.file) {
      projectData.imageUrl = uploadService.handleUpload(req.file);
    }

    const project = await projectService.createProject(req.user._id, projectData);
    const projectModel = ProjectResponseModel.fromEntity(project);
    new ApiResponse(201, "Tạo dự án thành công", { project: projectModel }).send(res);
  });

  /**
   * GET /api/projects
   */
  getUserProjects = catchAsync(async (req, res) => {
    const projects = await projectService.getUserProjects(req.user._id);
    const projectsModel = ProjectResponseModel.fromEntities(projects);
    new ApiResponse(200, "Lấy danh sách dự án thành công", {
      projects: projectsModel,
    }).send(res);
  });

  /**
   * GET /api/projects/:projectId
   */
  getProjectById = catchAsync(async (req, res) => {
    const project = await projectService.getProjectById(req.params.projectId);
    const projectModel = ProjectResponseModel.fromEntity(project);
    new ApiResponse(200, "Lấy thông tin dự án thành công", {
      project: projectModel,
    }).send(res);
  });

  /**
   * PUT /api/projects/:projectId
   */
  updateProject = catchAsync(async (req, res) => {
    const projectData = { ...req.body };
    if (req.file) {
      projectData.imageUrl = uploadService.handleUpload(req.file);
    }

    const project = await projectService.updateProject(
      req.params.projectId,
      projectData,
    );
    const projectModel = ProjectResponseModel.fromEntity(project);
    new ApiResponse(200, "Cập nhật dự án thành công", {
      project: projectModel,
    }).send(res);
  });

  /**
   * DELETE /api/projects/:projectId
   */
  deleteProject = catchAsync(async (req, res) => {
    await projectService.deleteProject(req.params.projectId);
    new ApiResponse(200, "Xóa dự án thành công").send(res);
  });

  /**
   * POST /api/projects/:projectId/members
   */
  addMember = catchAsync(async (req, res) => {
    const role = req.body.role || "member";
    const project = await projectService.addMember(
      req.params.projectId,
      req.body.email,
      role,
    );

    const projectUrl = `${CLIENT_URL}/projects/${project._id}/invite`;
    mailService
      .sendProjectInvitationEmail(
        req.body.email,
        project.name,
        req.user.displayName || req.user.email,
        projectUrl,
        project.color,
        project.imageUrl,
      )
      .catch((err) => console.error("Error sending invitation email:", err));

    const projectModel = ProjectResponseModel.fromEntity(project);
    new ApiResponse(200, "Thêm thành viên thành công", {
      project: projectModel,
    }).send(res);
  });

  /**
   * DELETE /api/projects/:projectId/members/:memberId
   */
  removeMember = catchAsync(async (req, res) => {
    const project = await projectService.removeMember(
      req.params.projectId,
      req.params.memberId,
    );
    const projectModel = ProjectResponseModel.fromEntity(project);
    new ApiResponse(200, "Xóa thành viên thành công", {
      project: projectModel,
    }).send(res);
  });

  /**
   * PUT /api/projects/:projectId/members/:memberId
   */
  updateMemberRole = catchAsync(async (req, res) => {
    const { role } = req.body;
    const project = await projectService.updateMemberRole(
      req.params.projectId,
      req.params.memberId,
      role,
    );
    const projectModel = ProjectResponseModel.fromEntity(project);
    new ApiResponse(200, "Cập nhật phân quyền thành công", {
      project: projectModel,
    }).send(res);
  });

  /**
   * GET /api/projects/:projectId/invitation
   */
  getInvitationDetails = catchAsync(async (req, res) => {
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
  respondToInvitation = catchAsync(async (req, res) => {
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
 
  /**
   * GET /api/projects/:projectId/invite-code
   */
  getInviteCode = catchAsync(async (req, res) => {
    const data = await projectService.getInviteCode(req.params.projectId);
    new ApiResponse(200, "Lấy mã mời thành công", { 
      inviteCode: data.code,
      expiresAt: data.expiresAt 
    }).send(res);
  });

  /**
   * POST /api/projects/:projectId/invite-code/regenerate
   */
  regenerateInviteCode = catchAsync(async (req, res) => {
    const data = await projectService.regenerateInviteCode(req.params.projectId);
    new ApiResponse(200, "Làm mới mã mời thành công", { 
      inviteCode: data.code,
      expiresAt: data.expiresAt 
    }).send(res);
  });

  /**
   * DELETE /api/projects/:projectId/invite-code
   */
  deleteInviteCode = catchAsync(async (req, res) => {
    await projectService.deleteInviteCode(req.params.projectId);
    new ApiResponse(200, "Xóa mã mời thành công").send(res);
  });

  /**
   * GET /api/projects/invite/:inviteCode
   */
  getProjectByInviteCode = catchAsync(async (req, res) => {
    const project = await projectService.getProjectByInviteCode(req.params.inviteCode);
    new ApiResponse(200, "Lấy thông tin dự án thành công", { project }).send(res);
  });

  /**
   * POST /api/projects/invite/:inviteCode/join
   */
  joinByInviteCode = catchAsync(async (req, res) => {
    await projectService.joinByInviteCode(req.params.inviteCode, req.user._id);
    new ApiResponse(200, "Gia nhập dự án thành công").send(res);
  });
}

module.exports = new ProjectController();
