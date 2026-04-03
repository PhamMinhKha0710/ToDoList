const adminService = require('../../services/admin/admin.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

class AdminController {
  getAllUsers = catchAsync(async (req, res) => {
    const users = await adminService.getAllUsers();
    new ApiResponse(200, 'Danh sách user', users).send(res);
  });

  setActive = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await adminService.setUserActiveStatus(id, isActive);
    new ApiResponse(200, 'Cập nhật trạng thái user thành công', user).send(res);
  });
}

module.exports = new AdminController();
