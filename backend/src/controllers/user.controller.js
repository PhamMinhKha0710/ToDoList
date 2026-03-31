const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

class UserController {
  /**
   * GET /api/v1/users/search?q=keyword
   */
  searchUsers = catchAsync(async (req, res) => {
    const { q } = req.query;
    const currentUserId = req.user._id;

    const users = await userService.searchUsers(q, currentUserId);
    new ApiResponse(200, 'Tìm kiếm thành công', { users }).send(res);
  });

  getAllUsers = catchAsync(async (req, res) => {
    const users = await userService.getAllUsers();
    new ApiResponse(200, 'Danh sách user', users).send(res);
  });

  setActive = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await userService.setUserActiveStatus(id, isActive);
    new ApiResponse(200, 'Cập nhật trạng thái user thành công', user).send(res);
  });
}

module.exports = new UserController();
