const User = require('../../models/User');

class UserService {
  /**
   * Tìm kiếm users theo email hoặc displayName
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
