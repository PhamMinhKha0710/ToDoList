class AdminService {
  constructor({ User, Task }) {
    this.User = User;
    this.Task = Task;
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

  async getDashboardTasks() {
    // Return only the fields needed for the dashboard charts to save bandwidth
    return await this.Task.find({}, '_id title status createdAt').lean();
  }
}

module.exports = new AdminService({
  User: require('../../entities/User'),
  Task: require('../../entities/Task'),
});
