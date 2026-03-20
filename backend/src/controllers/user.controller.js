const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

class UserController {
  updateProfile = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const user = await userService.updateProfile(userId, req.body);
    new ApiResponse(200, "Cập nhật hồ sơ thành công", { 
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role
      } 
    }).send(res);
  });

  changePassword = catchAsync(async (req, res) => {
    const userId = req.user._id;
    await userService.changePassword(userId, req.body);
    new ApiResponse(200, "Đổi mật khẩu thành công").send(res);
  });

  /**
   * GET /api/v1/users/search?q=keyword
   */
  searchUsers = catchAsync(async (req, res) => {
    const { q } = req.query;
    const currentUserId = req.user._id;

    const users = await userService.searchUsers(q, currentUserId);
    new ApiResponse(200, 'Tìm kiếm thành công', { users }).send(res);
  });
}

module.exports = new UserController();
