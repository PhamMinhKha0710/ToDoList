class UserService {
  constructor({ User }) {
    this.User = User;
  }

  async searchUsers(keyword, currentUserId) {
    if (!keyword || keyword.trim() === '') {
      return [];
    }

    const regex = new RegExp(keyword, 'i');

    const users = await this.User.find({
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

  async getAllUsers() {
    return await this.User.find({}, '-passwordHash -otpCode -otpExpires -__v').lean();
  }

  async setUserActiveStatus(userId, isActive) {
    const user = await this.User.findById(userId);
    if (!user) {
      const ApiError = require('../utils/ApiError');
      throw new ApiError(404, 'Người dùng không tồn tại');
    }
    user.isActive = isActive;
    await user.save();
    return user;
  }
}

module.exports = new UserService({
  User: require('../entities/User'),
});
