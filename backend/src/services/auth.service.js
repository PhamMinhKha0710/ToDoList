const jwt = require("jsonwebtoken");
const { verify: totpVerify } = require('otplib');

class AuthService {
  constructor({ bcrypt, crypto, User, Otp, tokenService, mailService, encryption, userResponseModel, ApiError }) {
    this.bcrypt = bcrypt;
    this.crypto = crypto;
    this.User = User;
    this.Otp = Otp;
    this.tokenService = tokenService;
    this.mailService = mailService;
    this.encryption = encryption;
    this.userResponseModel = userResponseModel;
    this.ApiError = ApiError;
    this.REFRESH_COOKIE_OPTIONS = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  register = async ({ email, password, displayName }) => {
    const normalizedEmail = email.toLowerCase();
    const existing = await this.User.findOne({ email: normalizedEmail });
    if (existing) throw new this.ApiError(409, "Email đã được sử dụng");

    const passwordHash = await this.bcrypt.hash(password, 10);
    const user = await this.User.create({ email: normalizedEmail, passwordHash, displayName });
    return this.userResponseModel(user);
  };

  login = async ({ email, password }) => {
    const normalizedEmail = email.toLowerCase();
    const user = await this.User.findOne({ email: normalizedEmail });
    if (!user) throw new this.ApiError(401, "Email hoặc mật khẩu không đúng");

    if (user.isActive === false) {
      throw new this.ApiError(403, 'Tài khoản đã bị khóa');
    }

    const isMatch = await this.bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new this.ApiError(401, "Email hoặc mật khẩu không đúng");

    // 2FA LOGIC
    if (user.is2FAEnabled) {
      const tempToken = jwt.sign(
        { _id: user._id.toString(), type: '2fa_temp' }, 
        process.env.JWT_ACCESS_SECRET, 
        { expiresIn: '5m' }
      );
      return { require2FA: true, tempToken };
    }

    const payload = {
      _id: user._id.toString(),
      role: user.role,
      displayName: user.displayName,
      email: user.email,
    };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken({ _id: user._id.toString() });

    return { accessToken, refreshToken, user: this.userResponseModel(user) };
  };

  refreshAccessToken = async (refreshToken) => {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const user = await this.User.findById(payload._id);
    if (!user) throw new this.ApiError(401, "Người dùng không tồn tại");

    const accessToken = this.tokenService.generateAccessToken({
      _id: user._id.toString(),
      role: user.role,
      displayName: user.displayName,
      email: user.email,
    });
    return { accessToken };
  };

  forgotPassword = async ({ email }) => {
    const normalizedEmail = email.toLowerCase();
    const user = await this.User.findOne({ email: normalizedEmail });
    if (!user) return;

    const otp = this.crypto.randomInt(100000, 999999).toString();
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const { CLIENT_URL } = require('../config/env');
    const resetUrl = `${CLIENT_URL}/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`;

    await this.mailService.sendResetPasswordEmail(email, otp, resetUrl);
  };

  resetPassword = async ({ email, otp, newPassword }) => {
    const normalizedEmail = email.toLowerCase();
    const user = await this.User.findOne({ email: normalizedEmail });
    if (!user) throw new this.ApiError(400, "Email không tồn tại");
    if (!user.otpCode || user.otpCode !== otp)
      throw new this.ApiError(400, "OTP không hợp lệ");
    if (user.otpExpires < new Date()) throw new this.ApiError(400, "OTP đã hết hạn");

    user.passwordHash = await this.bcrypt.hash(newPassword, 10);
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();
  };

  requestOtp = async ({ email, action }) => {
    const normalizedEmail = email.toLowerCase();
    const otpCode = this.crypto.randomInt(100000, 999999).toString();
    await this.Otp.deleteMany({ email: normalizedEmail, action });
    await this.Otp.create({ email: normalizedEmail, otp: otpCode, action });
    await this.mailService.sendOtpEmail(normalizedEmail, otpCode, action);
  };

  verifyOtp = async ({ email, otp, action }) => {
    const normalizedEmail = email.toLowerCase();
    const record = await this.Otp.findOne({ email: normalizedEmail, otp, action });
    if (!record) {
      throw new this.ApiError(400, "Mã OTP không hợp lệ hoặc đã hết hạn");
    }
    await this.Otp.deleteOne({ _id: record._id });
    return true;
  };

  authenticate2FA = async ({ tempToken, code }) => {
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_ACCESS_SECRET);
      if (decoded.type !== '2fa_temp') throw new Error();
    } catch (err) {
      throw new this.ApiError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
    }

    const user = await this.User.findById(decoded._id);
    if (!user || !user.is2FAEnabled) throw new this.ApiError(400, "Xác thực 2 bước không khả dụng");

    const decryptedSecret = this.encryption.decrypt(user.twoFactorSecret);
    
    let isValid = false;
    const normalizedCode = code.replace(/\s/g, '');
    
    if (normalizedCode.length === 6) {
      isValid = totpVerify({ token: normalizedCode, secret: decryptedSecret });
    } else if (normalizedCode.length === 8) {
      const hashedCodes = user.twoFactorBackupCodes || [];
      for (let i = 0; i < hashedCodes.length; i++) {
        const isMatch = await this.bcrypt.compare(normalizedCode, hashedCodes[i]);
        if (isMatch) {
          isValid = true;
          hashedCodes.splice(i, 1);
          user.twoFactorBackupCodes = hashedCodes;
          await user.save();
          break;
        }
      }
    }

    if (!isValid) throw new this.ApiError(400, "Mã xác thực không chính xác");

    const payload = {
      _id: user._id.toString(),
      role: user.role,
      displayName: user.displayName,
      email: user.email,
    };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken({ _id: user._id.toString() });

    return { accessToken, refreshToken, user: this.userResponseModel(user) };
  };

  loginWithGoogle = async (user) => {
    const payload = {
      _id: user._id.toString(),
      role: user.role,
      displayName: user.displayName,
      email: user.email,
    };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken({ _id: user._id.toString() });
    return { accessToken, refreshToken, user: this.userResponseModel(user) };
  };
}

const tokenService = require("./token.service");
const mailService = require("./mail.service");

module.exports = new AuthService({
  bcrypt: require("bcryptjs"),
  crypto: require("crypto"),
  User: require("../entities/User"),
  Otp: require("../entities/Otp"),
  tokenService: {
    generateAccessToken: tokenService.generateAccessToken,
    generateRefreshToken: tokenService.generateRefreshToken,
    verifyRefreshToken: tokenService.verifyRefreshToken,
  },
  mailService: {
    sendOtpEmail: mailService.sendOtpEmail,
    sendResetPasswordEmail: mailService.sendResetPasswordEmail,
  },
  encryption: require('../utils/encryption'),
  userResponseModel: require("../models/users/userResponse.model"),
  ApiError: require("../utils/ApiError"),
});
