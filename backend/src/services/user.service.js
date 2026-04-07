class UserService {
  constructor({ User, bcrypt, ApiError, authService }) {
    this.User = User;
    this.bcrypt = bcrypt;
    this.ApiError = ApiError;
    this.authService = authService;
  }

  async updateProfile(userId, data) {
    const user = await this.User.findById(userId);
    if (!user) throw new this.ApiError(404, 'Người dùng không tồn tại');

    if (data.displayName !== undefined) user.displayName = data.displayName;
    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.avatarUrl !== undefined) user.avatarUrl = data.avatarUrl;

    if (data.email !== undefined && data.email !== user.email) {
      if (!data.otp) throw new this.ApiError(400, 'Yêu cầu mã OTP để cập nhật email');
      await this.authService.verifyOtp({ email: user.email, otp: data.otp, action: 'UPDATE_EMAIL' });
      user.email = data.email;
    }

    await user.save();
    return user;
  }

  async changePassword(userId, { currentPassword, newPassword, otp }) {
    const user = await this.User.findById(userId);
    if (!user) throw new this.ApiError(404, 'Người dùng không tồn tại');

    const isMatch = await this.bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new this.ApiError(400, 'Mật khẩu hiện tại không chính xác');

    if (!otp) throw new this.ApiError(400, 'Yêu cầu mã OTP để đổi mật khẩu');
    await this.authService.verifyOtp({ email: user.email, otp, action: 'CHANGE_PASSWORD' });

    user.passwordHash = await this.bcrypt.hash(newPassword, 10);
    await user.save();
    return true;
  }

  async searchUsers(keyword, currentUserId) {
    if (!keyword || keyword.trim() === '') return [];

    const regex = new RegExp(keyword, 'i');

    return await this.User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { $or: [{ email: { $regex: regex } }, { displayName: { $regex: regex } }] },
      ],
    })
      .select('_id email displayName avatarUrl')
      .limit(10)
      .lean();
  }
}

module.exports = UserService;
