const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
class TwoFactorController {
  constructor({ twoFactorService, authService, ApiError, ApiResponse, catchAsync }) {
    this.twoFactorService = twoFactorService;
    this.authService = authService;

  }

  generate = catchAsync(async (req, res) => {
    const { secret, qrCodeUrl } = await this.twoFactorService.generateSecret(req.user.email);
    new ApiResponse(200, "Tạo mã QR thành công", { secret, qrCodeUrl }).send(res);
  });

  verifySetup = catchAsync(async (req, res) => {
    const { secret, code } = req.body;

    if (!secret || !code) {
      throw new ApiError(400, 'Yêu cầu cung cấp secret key và mã OTP');
    }

    const { backupCodes } = await this.twoFactorService.verifySetup(req.user._id, { secret, code });
    new ApiResponse(200, "Kích hoạt xác thực 2 bước thành công", { backupCodes }).send(res);
  });

  authenticate = catchAsync(async (req, res) => {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      throw new ApiError(400, 'Thiếu phiên đăng nhập hoặc mã xác nhận');
    }

    const { accessToken, refreshToken, user } = await this.authService.authenticate2FA({ tempToken, code });

    res.cookie('refreshToken', refreshToken, this.authService.REFRESH_COOKIE_OPTIONS);
    new ApiResponse(200, "Đăng nhập thành công", { accessToken, user }).send(res);
  });
}

module.exports = TwoFactorController;
