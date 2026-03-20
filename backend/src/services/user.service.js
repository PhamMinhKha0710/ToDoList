const User = require('../entities/User');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');

class UserService {
  async updateProfile(userId, data) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "Người dùng không tồn tại");

    if (data.displayName !== undefined) user.displayName = data.displayName;
    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;

    // Yêu cầu OTP nếu như đổi email
    if (data.email !== undefined && data.email !== user.email) {
      if (!data.otp) throw new ApiError(400, "Yêu cầu mã OTP để cập nhật email");
      const authService = require('./auth.service');
      await authService.verifyOtp({ email: user.email, otp: data.otp, action: 'UPDATE_EMAIL' });
      user.email = data.email;
    }

    await user.save();
    return user;
  }

  async changePassword(userId, { currentPassword, newPassword, otp }) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "Người dùng không tồn tại");

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new ApiError(400, "Mật khẩu hiện tại không chính xác");

    // Yêu cầu xác thực OTP
    if (!otp) throw new ApiError(400, "Yêu cầu mã OTP để đổi mật khẩu");
    const authService = require('./auth.service');
    await authService.verifyOtp({ email: user.email, otp, action: 'CHANGE_PASSWORD' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return true;
  }

  /** Tìm kiếm users theo email hoặc displayName
   * @param {string} keyword Từ khóa tìm kiếm
   * @param {string} currentUserId ID của người đang search để loại trừ
   */
  async searchUsers(keyword, currentUserId) {
    if (!keyword || keyword.trim() === '') {
      return [];
    }

    const regex = new RegExp(keyword, 'i'); // 'i' for case-insensitive

    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        {
          $or: [
            { email: { $regex: regex } },
            { displayName: { $regex: regex } },
          ],
        },
      ],
    })
      .select('_id email displayName avatarUrl')
      .limit(10)
      .lean();

    return users;
  }
}

module.exports = new UserService();
