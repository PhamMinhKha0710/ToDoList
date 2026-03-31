const bcrypt = require("bcryptjs");
const crypto = require("crypto");

class AuthService {
  constructor({ bcrypt, crypto, User, tokenService, mailService, userResponseDTO, ApiError }) {
    this.bcrypt = bcrypt;
    this.crypto = crypto;
    this.User = User;
    this.tokenService = tokenService;
    this.mailService = mailService;
    this.userResponseDTO = userResponseDTO;
    this.ApiError = ApiError;
    this.REFRESH_COOKIE_OPTIONS = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  register = async ({ email, password, displayName }) => {
    const existing = await this.User.findOne({ email });
    if (existing) throw new this.ApiError(409, "Email đã được sử dụng");

    const passwordHash = await this.bcrypt.hash(password, 10);
    const user = await this.User.create({ email, passwordHash, displayName });
    return this.userResponseDTO(user);
  };

  login = async ({ email, password }) => {
    const user = await this.User.findOne({ email });
    if (!user) throw new this.ApiError(401, "Email hoặc mật khẩu không đúng");

    if (user.isActive === false) {
      throw new this.ApiError(403, 'Tài khoản đã bị khóa');
    }

    const isMatch = await this.bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new this.ApiError(401, "Email hoặc mật khẩu không đúng");

    const payload = {
      _id: user._id.toString(),
      role: user.role,
      displayName: user.displayName,
      email: user.email,
    };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken({ _id: user._id.toString() });

    return { accessToken, refreshToken, user: this.userResponseDTO(user) };
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
    const user = await this.User.findOne({ email });
    if (!user) return;

    const otp = this.crypto.randomInt(100000, 999999).toString();
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await this.mailService.sendOtpEmail(email, otp);
  };

  resetPassword = async ({ email, otp, newPassword }) => {
    const user = await this.User.findOne({ email });
    if (!user) throw new this.ApiError(400, "Email không tồn tại");
    if (!user.otpCode || user.otpCode !== otp)
      throw new this.ApiError(400, "OTP không hợp lệ");
    if (user.otpExpires < new Date()) throw new this.ApiError(400, "OTP đã hết hạn");

    user.passwordHash = await this.bcrypt.hash(newPassword, 10);
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();
  };
}

const tokenService = require("./token.service");
const mailService = require("./mail.service");

module.exports = new AuthService({
  bcrypt: require("bcryptjs"),
  crypto: require("crypto"),
  User: require("../entities/User"),
  tokenService: {
    generateAccessToken: tokenService.generateAccessToken,
    generateRefreshToken: tokenService.generateRefreshToken,
    verifyRefreshToken: tokenService.verifyRefreshToken,
  },
  mailService: {
    sendOtpEmail: mailService.sendOtpEmail,
  },
  userResponseDTO: require("../models/users/userResponse.model"),
  ApiError: require("../utils/ApiError"),
});
