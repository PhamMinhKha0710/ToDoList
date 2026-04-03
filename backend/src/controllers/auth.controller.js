const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  register = catchAsync(async (req, res) => {
    const user = await authService.register(req.body);
    new ApiResponse(201, 'Đăng ký thành công', { user }).send(res);
  });

  /**
   * POST /api/v1/auth/login
   */
  login = catchAsync(async (req, res) => {
    const loginResult = await authService.login(req.body);

    if (loginResult.require2FA) {
      return new ApiResponse(200, "Yêu cầu xác thực 2 bước", { 
        require2FA: true, 
        tempToken: loginResult.tempToken 
      }).send(res);
    }

    const { accessToken, refreshToken, user } = loginResult;
    res.cookie('refreshToken', refreshToken, authService.REFRESH_COOKIE_OPTIONS);
    new ApiResponse(200, 'Đăng nhập thành công', { accessToken, user }).send(res);
  });

  /**
   * POST /api/v1/auth/logout
   */
  logout = catchAsync(async (req, res) => {
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
    new ApiResponse(200, 'Đăng xuất thành công').send(res);
  });

  /**
   * POST /api/v1/auth/refresh-token
   */
  refreshToken = catchAsync(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
      const ApiError = require('../utils/ApiError');
      throw new ApiError(401, 'Không tìm thấy refresh token');
    }
    const { accessToken } = await authService.refreshAccessToken(token);
    new ApiResponse(200, 'Làm mới token thành công', { accessToken }).send(res);
  });

  /**
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword = catchAsync(async (req, res) => {
    await authService.forgotPassword(req.body);
    // Luôn trả 200 để không lộ thông tin email
    new ApiResponse(200, 'Nếu email tồn tại, OTP đã được gửi').send(res);
  });

  /**
   * POST /api/v1/auth/reset-password
   */
  resetPassword = catchAsync(async (req, res) => {
    await authService.resetPassword(req.body);
    new ApiResponse(200, 'Đặt lại mật khẩu thành công').send(res);
  });

  /**
   * POST /api/v1/auth/request-otp
   */
  requestOtp = catchAsync(async (req, res) => {
    await authService.requestOtp(req.body);
    new ApiResponse(200, 'Mã OTP đã được gửi đến email của bạn').send(res);
  });

  /**
   * POST /api/v1/auth/verify-otp
   */
  verifyOtp = catchAsync(async (req, res) => {
    await authService.verifyOtp(req.body);
    new ApiResponse(200, 'Xác thực OTP thành công').send(res);
  });

  /**
   * GET /api/auth/google/callback
   * Passport đã xác thực xong và gắn user vào req.user
   */
  googleCallback = catchAsync(async (req, res) => {
    const { accessToken, refreshToken } = await authService.loginWithGoogle(req.user);
    res.cookie('refreshToken', refreshToken, authService.REFRESH_COOKIE_OPTIONS);
    // Redirect về frontend kèm accessToken trong URL (frontend sẽ lưu vào store)
    res.redirect(`${process.env.CLIENT_URL}/auth/google/callback?accessToken=${accessToken}`);
  });
}

module.exports = new AuthController();
