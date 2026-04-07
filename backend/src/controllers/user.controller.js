const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
class UserController {
  constructor({ userService, User, ApiError, ApiResponse, catchAsync }) {
    this.userService = userService;
    this.User = User;

  }

  getMe = catchAsync(async (req, res) => {
    const user = await this.User.findById(req.user._id);
    if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');

    new ApiResponse(200, 'Lấy thông tin thành công', {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      is2FAEnabled: user.is2FAEnabled,
    }).send(res);
  });

  updateProfile = catchAsync(async (req, res) => {
    const user = await this.userService.updateProfile(req.user._id, req.body);
    new ApiResponse(200, 'Cập nhật hồ sơ thành công', {
      user: {
        _id: user._id, email: user.email, fullName: user.fullName,
        displayName: user.displayName, avatarUrl: user.avatarUrl, role: user.role,
      },
    }).send(res);
  });

  changePassword = catchAsync(async (req, res) => {
    await this.userService.changePassword(req.user._id, req.body);
    new ApiResponse(200, 'Đổi mật khẩu thành công').send(res);
  });

  searchUsers = catchAsync(async (req, res) => {
    const users = await this.userService.searchUsers(req.query.q, req.user._id);
    new ApiResponse(200, 'Tìm kiếm thành công', { users }).send(res);
  });
}

module.exports = UserController;
