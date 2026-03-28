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
}

module.exports = new UserService({
  User: require('../entities/User'),
});
