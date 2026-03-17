const { getIO } = require('../config/socket');

/**
 * Emit notification tới đúng user (dùng private user room "user:<userId>")
 * @param {string} userId - ObjectId string của user nhận notification
 * @param {object} notification - Notification document
 */
const emitNotification = (userId, notification) => {
  getIO().to(`user:${userId}`).emit('notification:new', notification);
};

module.exports = { emitNotification };
