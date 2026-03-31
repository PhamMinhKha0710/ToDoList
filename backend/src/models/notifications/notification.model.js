/**
 * Notification Model — Chuẩn hóa dữ liệu trả về của Notification
 * @param {Object} notification
 */
const toNotificationModel = (notification) => {
  if (!notification) return null;

  return {
    _id: notification._id,
    recipientId: notification.recipientId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    metadata: notification.metadata || {},
    createdAt: notification.createdAt,
  };
};

module.exports = { toNotificationModel };
