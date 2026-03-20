const User = require('../entities/User');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');

class UserService {
  async updateProfile(userId, data) {
    const updateData = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!user) throw new ApiError(404, "Người dùng không tồn tại");
    return user;
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "Người dùng không tồn tại");

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new ApiError(400, "Mật khẩu hiện tại không chính xác");

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
