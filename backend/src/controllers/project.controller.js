const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
class ProjectController {
  constructor({ projectService, ApiResponse, catchAsync }) {
    this.projectService = projectService;

  }

  getUserProjects = catchAsync(async (req, res) => {
    const projects = await this.projectService.getUserProjects(req.user._id);
    new ApiResponse(200, 'Lấy danh sách dự án thành công', { projects }).send(res);
  });

  createProject = catchAsync(async (req, res) => {
    const project = await this.projectService.createProject(req.body, req.user._id);
    new ApiResponse(201, 'Tạo dự án thành công', { project }).send(res);
  });

  getProjectById = catchAsync(async (req, res) => {
    const project = await this.projectService.getProjectById(req.params.projectId);
    new ApiResponse(200, 'Lấy thông tin dự án thành công', { project }).send(res);
  });

  updateProject = catchAsync(async (req, res) => {
    const project = await this.projectService.updateProject(req.params.projectId, req.body);
    new ApiResponse(200, 'Cập nhật dự án thành công', { project }).send(res);
  });

  // FIX BUG #3: truyền req.user._id cho deleteProject
  deleteProject = catchAsync(async (req, res) => {
    await this.projectService.deleteProject(req.params.projectId, req.user._id);
    new ApiResponse(200, 'Xóa dự án thành công').send(res);
  });

  addMember = catchAsync(async (req, res) => {
    const { email, role } = req.body;
    const project = await this.projectService.addMember(req.params.projectId, email, role, req.user._id);
    new ApiResponse(200, 'Thêm thành viên thành công', { project }).send(res);
  });

  removeMember = catchAsync(async (req, res) => {
    const project = await this.projectService.removeMember(req.params.projectId, req.params.memberId, req.user._id);
    new ApiResponse(200, 'Xóa thành viên thành công', { project }).send(res);
  });

  updateMemberRole = catchAsync(async (req, res) => {
    const { role } = req.body;
    const project = await this.projectService.updateMemberRole(req.params.projectId, req.params.memberId, role, req.user._id);
    new ApiResponse(200, 'Cập nhật vai trò thành công', { project }).send(res);
  });

  getInvitationDetails = catchAsync(async (req, res) => {
    const project = await this.projectService.getInvitationDetails(req.params.projectId);
    new ApiResponse(200, 'Lấy thông tin mời thành công', { project }).send(res);
  });

  respondToInvitation = catchAsync(async (req, res) => {
    const { action } = req.body;
    const project = await this.projectService.respondToInvitation(req.params.projectId, req.user._id, action);
    new ApiResponse(200, `Đã ${action === 'accept' ? 'chấp nhận' : 'từ chối'} lời mời`, { project }).send(res);
  });

  getInviteCode = catchAsync(async (req, res) => {
    const result = await this.projectService.getInviteCode(req.params.projectId);
    new ApiResponse(200, 'Lấy mã mời thành công', result).send(res);
  });

  regenerateInviteCode = catchAsync(async (req, res) => {
    const result = await this.projectService.regenerateInviteCode(req.params.projectId);
    new ApiResponse(200, 'Tạo mã mời mới thành công', result).send(res);
  });

  deleteInviteCode = catchAsync(async (req, res) => {
    await this.projectService.deleteInviteCode(req.params.projectId);
    new ApiResponse(200, 'Đã xóa mã mời').send(res);
  });

  getProjectByInviteCode = catchAsync(async (req, res) => {
    const project = await this.projectService.getProjectByInviteCode(req.params.inviteCode);
    new ApiResponse(200, 'Lấy thông tin dự án thành công', { project }).send(res);
  });

  joinByInviteCode = catchAsync(async (req, res) => {
    const project = await this.projectService.joinByInviteCode(req.params.inviteCode, req.user._id);
    new ApiResponse(200, 'Tham gia dự án thành công', { project }).send(res);
  });

  getProjectStats = catchAsync(async (req, res) => {
    const stats = await this.projectService.getProjectStats(req.params.projectId);
    new ApiResponse(200, 'Lấy thống kê thành công', stats).send(res);
  });
}

module.exports = ProjectController;
