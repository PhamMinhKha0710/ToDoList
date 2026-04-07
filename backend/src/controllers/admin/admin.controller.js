const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
class AdminController {
  constructor({ adminService, ApiResponse, catchAsync }) {
    this.adminService = adminService;

  }

  getAllUsers = catchAsync(async (req, res) => {
    const { page, limit, search } = req.query;
    const users = await this.adminService.getAllUsers({ page, limit, search });
    new ApiResponse(200, 'Danh sách người dùng', users).send(res);
  });

  updateRole = catchAsync(async (req, res) => {
    const user = await this.adminService.updateUserRole(req.params.id, req.body.role);
    new ApiResponse(200, 'Cập nhật quyền người dùng thành công', user).send(res);
  });

  resetPassword = catchAsync(async (req, res) => {
    await this.adminService.resetUserPassword(req.params.id);
    new ApiResponse(200, 'Yêu cầu khôi phục mật khẩu đã được gửi đến email người dùng').send(res);
  });

  setActive = catchAsync(async (req, res) => {
    const user = await this.adminService.setUserActiveStatus(req.params.id, req.body.isActive);
    new ApiResponse(200, 'Cập nhật trạng thái user thành công', user).send(res);
  });

  getDashboardTasks = catchAsync(async (req, res) => {
    const stats = await this.adminService.getDashboardStats();
    new ApiResponse(200, 'Thống kê dashboard', stats).send(res);
  });

  getAllProjects = catchAsync(async (req, res) => {
    const projects = await this.adminService.getAllProjects();
    new ApiResponse(200, 'Danh sách dự án', projects).send(res);
  });

  createProject = catchAsync(async (req, res) => {
    const project = await this.adminService.createAdminProject(req.body);
    new ApiResponse(201, 'Tạo dự án thành công', project).send(res);
  });

  updateProject = catchAsync(async (req, res) => {
    const project = await this.adminService.updateAdminProject(req.params.id, req.body);
    new ApiResponse(200, 'Cập nhật dự án thành công', project).send(res);
  });

  deleteProject = catchAsync(async (req, res) => {
    await this.adminService.deleteAdminProject(req.params.id);
    new ApiResponse(200, 'Xóa dự án thành công', null).send(res);
  });
}

module.exports = AdminController;
