/**
 * twoFactor.service.js
 * Compatible with otplib v13 which exports from the root module:
 *   { generateSecret, generateURI, verify, ... }
 * (No .authenticator object in the CJS build)
 */
const {
  generateSecret: libGenerateSecret,
  generateURI,
  verify: libVerify,
} = require('otplib');

const qrcode = require('qrcode');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../entities/User');
const { encrypt, decrypt } = require('../utils/encryption');
const ApiError = require('../utils/ApiError');

class TwoFactorService {
  /**
   * Generates a new TOTP secret and QR code base64 image for the setup phase.
   */
  async generateSecret(userEmail) {
    const secret = libGenerateSecret();

    // generateURI signature (v14+): generateURI({ label, issuer, secret })
    const otpauthUrl = generateURI({
      label: userEmail,
      issuer: 'ToDoList',
      secret,
    });

    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
    return { secret, qrCodeUrl };
  }

  /**
   * Verifies the initial TOTP input and locks in the 2FA secret on success,
   * returning a fresh batch of single-use backup codes (plaintext for the user only).
   */
  async verifySetup(userId, { secret, code }) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');

    if (user.is2FAEnabled) {
      throw new ApiError(400, 'Xác thực 2 bước đã được bật trước đó');
    }

    // libVerify({ token, secret }) returns boolean
    const isValid = libVerify({ token: code, secret });
    if (!isValid) {
      throw new ApiError(400, 'Mã TOTP không hợp lệ hoặc đã hết hạn');
    }

    // Generate 10 randomised recovery codes (8 hex characters = 32 bits)
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex')
    );

    const hashedCodes = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, 10))
    );

    user.twoFactorSecret = encrypt(secret);
    user.is2FAEnabled = true;
    user.twoFactorBackupCodes = hashedCodes;
    await user.save();

    return { backupCodes };
  }

  /**
   * Decrypts the stored TOTP secret and verifies a TOTP token.
   */
  verifyToken(encryptedSecret, token) {
    const secret = decrypt(encryptedSecret);
    return libVerify({ token, secret });
  }
}

module.exports = new TwoFactorService();
