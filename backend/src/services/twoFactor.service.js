const { authenticator } = require('otplib');
const qrcode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../entities/User');
const { encrypt } = require('../utils/encryption');
const ApiError = require('../utils/ApiError');

// Configure otplib to allow 1 step window drift (±30 seconds) to tolerate slight time desync
authenticator.options = { window: 1 };

class TwoFactorService {
  /**
   * Generates a new TOTP secret and QR code URI for the setup phase
   */
  async generateSecret(userEmail) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(userEmail, 'ToDoList', secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
    return { secret, qrCodeUrl };
  }

  /**
   * Verifies the initial TOTP input and locks in the hardware 2FA secret on success, yielding backup codes
   */
  async verifySetup(userId, { secret, code }) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');

    if (user.is2FAEnabled) {
      throw new ApiError(400, 'Xác thực 2 bước đã được bật trước đó');
    }

    const isValid = authenticator.verify({ token: code, secret });
    if (!isValid) {
      throw new ApiError(400, 'Mã TOTP không hợp lệ hoặc đã hết hạn');
    }

    // Generate 10 randomized recovery codes (length 8 hex strings)
    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));
    
    // Scrypt/Hash backup codes so plaintext is never exposed in the DB
    const hashedCodes = await Promise.all(backupCodes.map(c => bcrypt.hash(c, 10)));

    user.twoFactorSecret = encrypt(secret);
    user.is2FAEnabled = true;
    user.twoFactorBackupCodes = hashedCodes;
    await user.save();

    return { backupCodes };
  }
}

module.exports = new TwoFactorService();
