const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../services/token.service");
const { sendOtpEmail } = require("../../services/mail.service");
const { toUserResponse } = require("../users/dtos/userResponse.dto");
const ApiError = require("../../utils/ApiError");

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày (ms)
};

/**
 * Đăng ký tài khoản mới
 */
const register = async ({ email, password, displayName }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email đã được sử dụng");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, displayName });
  return toUserResponse(user);
};

/**
 * Đăng nhập — trả về accessToken + refreshToken (cookie)
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Email hoặc mật khẩu không đúng");

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new ApiError(401, "Email hoặc mật khẩu không đúng");

  const payload = {
    _id: user._id.toString(),
    role: user.role,
    displayName: user.displayName,
    email: user.email,
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ _id: user._id.toString() });

  return { accessToken, refreshToken, user: toUserResponse(user) };
};

/**
 * Làm mới accessToken từ refreshToken (lưu trong cookie)
 */
const refreshAccessToken = async (refreshToken) => {
  const {
    verifyRefreshToken,
    generateAccessToken: genAccess,
  } = require("../../services/token.service");
  const payload = verifyRefreshToken(refreshToken); // throw nếu hết hạn / sai
  const user = await User.findById(payload._id);
  if (!user) throw new ApiError(401, "Người dùng không tồn tại");

  const accessToken = genAccess({
    _id: user._id.toString(),
    role: user.role,
    displayName: user.displayName,
    email: user.email,
  });
  return { accessToken };
};

/**
 * Gửi OTP về email để reset mật khẩu
 */
const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email });
  // Luôn trả thành công để tránh lộ thông tin
  if (!user) return;

  const otp = crypto.randomInt(100000, 999999).toString();
  user.otpCode = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // hết hạn sau 10 phút
  await user.save();

  await sendOtpEmail(email, otp);
};

/**
 * Đặt lại mật khẩu bằng OTP
 */
const resetPassword = async ({ email, otp, newPassword }) => {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(400, "Email không tồn tại");
  if (!user.otpCode || user.otpCode !== otp)
    throw new ApiError(400, "OTP không hợp lệ");
  if (user.otpExpires < new Date()) throw new ApiError(400, "OTP đã hết hạn");

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.otpCode = null;
  user.otpExpires = null;
  await user.save();
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  REFRESH_COOKIE_OPTIONS,
};
