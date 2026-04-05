const twoFactorService = require('../services/twoFactor.service');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

class TwoFactorController {
  generate = catchAsync(async (req, res) => {
    const { secret, qrCodeUrl } = await twoFactorService.generateSecret(req.user.email);
    new ApiResponse(200, "Tạo mã QR thành công", { secret, qrCodeUrl }).send(res);
  });

  verifySetup = catchAsync(async (req, res) => {
    const { secret, code } = req.body;
    
    if (!secret || !code) {
      const ApiError = require('../utils/ApiError');
      throw new ApiError(400, 'Yêu cầu cung cấp secret key và mã OTP');
    }

    const { backupCodes } = await twoFactorService.verifySetup(req.user._id, { secret, code });
    new ApiResponse(200, "Kích hoạt xác thực 2 bước thành công", { backupCodes }).send(res);
  });

  authenticate = catchAsync(async (req, res) => {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      const ApiError = require('../utils/ApiError');
      throw new ApiError(400, 'Thiếu phiên đăng nhập hoặc mã xác nhận');
    }
    
    const authService = require('../services/auth.service');
    const { accessToken, refreshToken, user } = await authService.authenticate2FA({ tempToken, code });
    
    res.cookie('refreshToken', refreshToken, authService.REFRESH_COOKIE_OPTIONS);
    new ApiResponse(200, "Đăng nhập thành công", { accessToken, user }).send(res);
  });
}

module.exports = new TwoFactorController();
