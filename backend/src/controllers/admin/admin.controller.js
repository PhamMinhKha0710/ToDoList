const adminService = require('../../services/admin/admin.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const { getIO } = require('../../config/socket');

class AdminController {
  getAllUsers = catchAsync(async (req, res) => {
    const { page, limit, search } = req.query;
    const users = await adminService.getAllUsers({ page, limit, search });
    new ApiResponse(200, "Danh sách người dùng", users).send(res);
  });

  updateRole = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const user = await adminService.updateUserRole(id, role);
    new ApiResponse(200, "Cập nhật quyền người dùng thành công", user).send(res);
  });

  resetPassword = catchAsync(async (req, res) => {
    const { id } = req.params;
    await adminService.resetUserPassword(id);
    new ApiResponse(200, "Yêu cầu khôi phục mật khẩu đã được gửi đến email người dùng").send(res);
  });

  setActive = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await adminService.setUserActiveStatus(id, isActive);
    
    // Nếu vô hiệu hóa, đá user ra ngay lập tức
    if (isActive === false) {
      try {
        getIO().to(`user:${id}`).emit('user:locked');
      } catch (err) {
        console.error(`[Socket] Failed to emit user:locked for ${id}`, err);
      }
    }
    
    new ApiResponse(200, 'Cập nhật trạng thái user thành công', user).send(res);
  });

  getDashboardTasks = catchAsync(async (req, res) => {
    const stats = await adminService.getDashboardStats();
    new ApiResponse(200, 'Thống kê dashboard', stats).send(res);
  });

  getAllProjects = catchAsync(async (req, res) => {
    const projects = await adminService.getAllProjects();
    new ApiResponse(200, 'Danh sách dự án', projects).send(res);
  });

  createProject = catchAsync(async (req, res) => {
    const project = await adminService.createAdminProject(req.body);
    const io = getIO();
    
    // 1. Thông báo cho tất cả Admin đang xem danh sách
    try {
      io.to('admin:projects').emit('admin:project_list_updated');
    } catch (err) {
      console.error('[Socket] Failed to emit admin:project_list_updated', err);
    }

    // 2. Thông báo cho người sở hữu dự án để danh sách của họ cập nhật
    if (project.members && project.members.length > 0) {
      project.members.forEach(member => {
        const userId = member.userId._id || member.userId;
        try {
          io.to(`user:${userId}`).emit('project:list_updated');
        } catch (err) {
          console.error(`[Socket] Failed to emit project:list_updated to user:${userId}`, err);
        }
      });
    }

    new ApiResponse(201, 'Tạo dự án thành công', project).send(res);
  });

  updateProject = catchAsync(async (req, res) => {
    const { id } = req.params;
    const project = await adminService.updateAdminProject(id, req.body);
    
    const io = getIO();
    
    // 1. Nếu vô hiệu hoá, đuổi tất cả user đang xem ra ngay lập tức
    if (req.body.isActive === false) {
      try {
        io.to(id).emit('project:deactivated', { projectId: id });
      } catch (err) {
        console.error('[Socket] Failed to emit project:deactivated', err);
      }
    }

    // 2. Luôn thông báo cập nhật danh sách cho tất cả thành viên trong dự án
    if (project.members && project.members.length > 0) {
      project.members.forEach(member => {
        const userId = member.userId._id || member.userId;
        try {
          io.to(`user:${userId}`).emit('project:list_updated');
        } catch (err) {
          console.error(`[Socket] Failed to emit project:list_updated to user:${userId}`, err);
        }
      });
    }
    
    // 3. Thông báo cho tất cả Admin đang xem danh sách
    try {
      io.to('admin:projects').emit('admin:project_list_updated');
    } catch (err) {
      console.error('[Socket] Failed to emit admin:project_list_updated', err);
    }

    new ApiResponse(200, 'Cập nhật dự án thành công', project).send(res);
  });

  deleteProject = catchAsync(async (req, res) => {
    const { id } = req.params;
    const io = getIO();

    // Lấy thông tin dự án trước khi xoá để biết danh sách thành viên
    const project = await adminService.updateAdminProject(id, {}); 
    
    if (project) {
      // 1. Đuổi tất cả user đang xem ra
      try {
        io.to(id).emit('project:deleted', { projectId: id });
      } catch (err) {
        console.error('[Socket] Failed to emit project:deleted', err);
      }

      // 2. Thông báo cập nhật danh sách cho tất cả thành viên
      project.members.forEach(member => {
        const userId = member.userId._id || member.userId;
        try {
          io.to(`user:${userId}`).emit('project:list_updated');
        } catch (err) {
          console.error(`[Socket] Failed to emit project:list_updated to user:${userId}`, err);
        }
      });
    }

    // 3. Thông báo cho tất cả Admin đang xem danh sách
    try {
      io.to('admin:projects').emit('admin:project_list_updated');
    } catch (err) {
      console.error('[Socket] Failed to emit admin:project_list_updated', err);
    }

    await adminService.deleteAdminProject(id);
    new ApiResponse(200, 'Xóa dự án thành công', null).send(res);
  });
}

module.exports = new AdminController();
