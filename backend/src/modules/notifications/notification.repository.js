const Notification = require('../../entities/Notification');

const createNotification = async (notificationData) => {
  return await Notification.create(notificationData);
};

const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ recipientId: userId, read: false });
};

const getNotifications = async (userId, limit = 20, offset = 0) => {
  return await Notification.find({ recipientId: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);
};

module.exports = {
  createNotification,
  getUnreadCount,
  getNotifications,
};