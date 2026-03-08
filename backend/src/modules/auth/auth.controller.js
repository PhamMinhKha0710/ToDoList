const authService = require('./auth.service');
const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/v1/auth/register
 */
const register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);
  new ApiResponse(201, 'Đăng ký thành công', { user }).send(res);
});

/**
 * POST /api/v1/auth/login
 */
const login = catchAsync(async (req, res) => {
  const { accessToken, refreshToken, user } = await authService.login(req.body);

  res.cookie('refreshToken', refreshToken, authService.REFRESH_COOKIE_OPTIONS);

  new ApiResponse(200, 'Đăng nhập thành công', { accessToken, user }).send(res);
});

/**
 * POST /api/v1/auth/logout
 */
const logout = catchAsync(async (req, res) => {
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
  new ApiResponse(200, 'Đăng xuất thành công').send(res);
});

/**
 * POST /api/v1/auth/refresh-token
 */
const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    const ApiError = require('../../utils/ApiError');
    throw new ApiError(401, 'Không tìm thấy refresh token');
  }
  const { accessToken } = await authService.refreshAccessToken(token);
  new ApiResponse(200, 'Làm mới token thành công', { accessToken }).send(res);
});

/**
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body);
  // Luôn trả 200 để không lộ thông tin email
  new ApiResponse(200, 'Nếu email tồn tại, OTP đã được gửi').send(res);
});

/**
 * POST /api/v1/auth/reset-password
 */
const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body);
  new ApiResponse(200, 'Đặt lại mật khẩu thành công').send(res);
});

module.exports = { register, login, logout, refreshToken, forgotPassword, resetPassword };
