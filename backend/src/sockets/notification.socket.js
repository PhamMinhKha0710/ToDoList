const { getIO } = require('../config/socket');

/**
 * Emit notification tới đúng user (dùng private user room "user:<userId>")
 * @param {string} userId - ObjectId string của user nhận notification
 * @param {object} notification - Notification document
 */
const emitNotification = (userId, notification) => {
  const room = `user:${userId.toString()}`;
  console.log(`[Socket] Emitting notification:new to room: ${room}`);
  getIO().to(room).emit('notification:new', notification);
};

module.exports = { emitNotification };
