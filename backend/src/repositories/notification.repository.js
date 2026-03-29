class NotificationRepository {
  constructor({ Notification }) {
    this.Notification = Notification;
  }

  async create(data) {
    return await this.Notification.create(data);
  }

  async findByUserId(userId, limit = 20, offset = 0) {
    return await this.Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  }

  async countUnread(userId) {
    return await this.Notification.countDocuments({ recipientId: userId, read: false });
  }

  async markAsRead(notificationId) {
    return await this.Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return await this.Notification.updateMany(
      { recipientId: userId, read: false },
      { read: true }
    );
  }

  async findById(id) {
    return await this.Notification.findById(id);
  }
}

module.exports = new NotificationRepository({
  Notification: require('../entities/Notification'),
});
