const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

class AuthController {
  constructor({ authService, ApiResponse, catchAsync, CLIENT_URL }) {
    this.authService = authService;

    this.CLIENT_URL = CLIENT_URL;
  }

  register = catchAsync(async (req, res) => {
    const user = await this.authService.register(req.body);
    new ApiResponse(201, 'Đăng ký thành công', { user }).send(res);
  });

  login = catchAsync(async (req, res) => {
    const loginResult = await this.authService.login(req.body);

    if (loginResult.require2FA) {
      return new ApiResponse(200, 'Yêu cầu xác thực 2 bước', {
        require2FA: true,
        tempToken: loginResult.tempToken,
      }).send(res);
    }

    const { accessToken, refreshToken, user } = loginResult;
    res.cookie('refreshToken', refreshToken, this.authService.REFRESH_COOKIE_OPTIONS);
    new ApiResponse(200, 'Đăng nhập thành công', { accessToken, user }).send(res);
  });

  logout = catchAsync(async (req, res) => {
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
    new ApiResponse(200, 'Đăng xuất thành công').send(res);
  });

  refreshToken = catchAsync(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) throw new ApiError(401, 'Không tìm thấy refresh token');
    const { accessToken } = await this.authService.refreshAccessToken(token);
    new ApiResponse(200, 'Làm mới token thành công', { accessToken }).send(res);
  });

  forgotPassword = catchAsync(async (req, res) => {
    await this.authService.forgotPassword(req.body);
    new ApiResponse(200, 'Nếu email tồn tại, OTP đã được gửi').send(res);
  });

  resetPassword = catchAsync(async (req, res) => {
    await this.authService.resetPassword(req.body);
    new ApiResponse(200, 'Đặt lại mật khẩu thành công').send(res);
  });

  requestOtp = catchAsync(async (req, res) => {
    await this.authService.requestOtp(req.body);
    new ApiResponse(200, 'Mã OTP đã được gửi đến email của bạn').send(res);
  });

  verifyOtp = catchAsync(async (req, res) => {
    await this.authService.verifyOtp(req.body);
    new ApiResponse(200, 'Xác thực OTP thành công').send(res);
  });

  googleCallback = catchAsync(async (req, res) => {
    const { accessToken, refreshToken } = await this.authService.loginWithGoogle(req.user);
    res.cookie('refreshToken', refreshToken, this.authService.REFRESH_COOKIE_OPTIONS);
    res.redirect(`${this.CLIENT_URL}/auth/google/callback?accessToken=${accessToken}`);
  });
}

module.exports = AuthController;
