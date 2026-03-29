const notificationRepository = require('./notification.repository');

const createNotification = async (notificationData) => {
  return await notificationRepository.createNotification(notificationData);
};

const getUnreadCount = async (userId) => {
  return await notificationRepository.getUnreadCount(userId);
};

const getNotifications = async (userId, limit = 20, offset = 0) => {
  return await notificationRepository.getNotifications(userId, limit, offset);
};

module.exports = {
  createNotification,
  getUnreadCount,
  getNotifications,
};