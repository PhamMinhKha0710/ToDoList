const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

class UserController {
  /**
   * GET /api/users/me
   */
  getMe = catchAsync(async (req, res) => {
    // req.user được gán từ middleware authenticate
    const User = require('../entities/User');
    const user = await User.findById(req.user._id);
    if (!user) {
      const ApiError = require('../utils/ApiError');
      throw new ApiError(404, 'Không tìm thấy người dùng');
    }
    
    new ApiResponse(200, "Lấy thông tin thành công", {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      is2FAEnabled: user.is2FAEnabled
    }).send(res);
  });

  updateProfile = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const user = await userService.updateProfile(userId, req.body);
    new ApiResponse(200, "Cập nhật hồ sơ thành công", { 
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
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
