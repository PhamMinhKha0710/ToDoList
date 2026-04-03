class AdminService {
  constructor({ User }) {
    this.User = User;
  }

  async getAllUsers() {
    return await this.User.find({}, '-passwordHash -otpCode -otpExpires -__v').lean();
  }

  async setUserActiveStatus(userId, isActive) {
    const user = await this.User.findById(userId);
    if (!user) {
      const ApiError = require('../../utils/ApiError');
      throw new ApiError(404, 'Người dùng không tồn tại');
    }
    user.isActive = isActive;
    await user.save();
    return user;
  }
}

module.exports = new AdminService({
  User: require('../../entities/User'),
});
