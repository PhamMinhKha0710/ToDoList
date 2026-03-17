const Notification = require('../entities/Notification');

class NotificationRepository {
  async create(data) {
    return await Notification.create(data);
  }

  async findByUserId(userId, limit = 20, offset = 0) {
    return await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
  }

  async countUnread(userId) {
    return await Notification.countDocuments({ recipientId: userId, read: false });
  }

  async markAsRead(notificationId) {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { recipientId: userId, read: false },
      { read: true }
    );
  }

  async findById(id) {
    return await Notification.findById(id);
  }
}

module.exports = new NotificationRepository();
