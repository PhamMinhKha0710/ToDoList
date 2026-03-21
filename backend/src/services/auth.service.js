const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../entities/User");
const Otp = require("../entities/Otp");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("./token.service");
const { sendOtpEmail } = require("./mail.service");
const { toUserResponse } = require("../models/users/userResponse.model");
const ApiError = require("../utils/ApiError");

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

  // --- NEW 2FA LOGIC ---
  if (user.is2FAEnabled) {
    const jwt = require("jsonwebtoken");
    const tempToken = jwt.sign(
      { _id: user._id.toString(), type: '2fa_temp' }, 
      process.env.JWT_ACCESS_SECRET, 
      { expiresIn: '5m' }
    );
    return { require2FA: true, tempToken };
  }
  // ---------------------

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
  } = require("./token.service");
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

  await sendOtpEmail(email, otp, 'Khôi phục mật khẩu');
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

/**
 * Yêu cầu gửi OTP (Change Password / Update Email)
 */
const requestOtp = async ({ email, action }) => {
  const otpCode = crypto.randomInt(100000, 999999).toString();
  
  // Xóa các OTP cũ của email và action này để tránh spam database
  await Otp.deleteMany({ email, action });
  
  await Otp.create({ email, otp: otpCode, action });
  await sendOtpEmail(email, otpCode, action);
};

/**
 * Xác minh OTP (Single-use)
 */
const verifyOtp = async ({ email, otp, action }) => {
  const record = await Otp.findOne({ email, otp, action });
  if (!record) {
    throw new ApiError(400, "Mã OTP không hợp lệ hoặc đã hết hạn");
  }
  
  // Xác thực chặt chẽ: mã chỉ được sử dụng 1 lần (delete after use)
  await Otp.deleteOne({ _id: record._id });
  return true;
};

/**
 * Xác thực bước 2 sử dụng mã Authenticator App hoặc Backup Code
 */
const authenticate2FA = async ({ tempToken, code }) => {
  const jwt = require("jsonwebtoken");
  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_ACCESS_SECRET);
    if (decoded.type !== '2fa_temp') throw new Error();
  } catch (err) {
    throw new ApiError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
  }

  const user = await User.findById(decoded._id);
  if (!user || !user.is2FAEnabled) throw new ApiError(400, "Xác thực 2 bước không khả dụng");

  const { verify: totpVerify } = require('otplib');
  const { decrypt } = require('../utils/encryption');
  
  const decryptedSecret = decrypt(user.twoFactorSecret);
  
  let isValid = false;
  const normalizedCode = code.replace(/\s/g, ''); // Xóa khoảng trắng (nếu có)
  
  if (normalizedCode.length === 6) {
    isValid = totpVerify({ token: normalizedCode, secret: decryptedSecret });
  } else if (normalizedCode.length === 8) {
    const hashedCodes = user.twoFactorBackupCodes || [];
    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await bcrypt.compare(normalizedCode, hashedCodes[i]);
      if (isMatch) {
        isValid = true;
        // Phải burn (xóa bỏ) backup code này sau khi dùng
        hashedCodes.splice(i, 1);
        user.twoFactorBackupCodes = hashedCodes;
        await user.save();
        break;
      }
    }
  }

  if (!isValid) throw new ApiError(400, "Mã xác thực không chính xác");

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
 * Đăng nhập / đăng ký qua Google OAuth (user đã được Passport tìm/tạo sẵn)
 */
const loginWithGoogle = async (user) => {
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

module.exports = {
  register,
  login,
  loginWithGoogle,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  requestOtp,
  verifyOtp,
  authenticate2FA,
  REFRESH_COOKIE_OPTIONS,
};
