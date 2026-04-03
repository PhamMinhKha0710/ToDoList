const registerProjectHandlers = require('./project.socket');

/**
 * Đăng ký tất cả Socket.IO event handlers
 * @param {import('socket.io').Server} io
 */
const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // Project room / presence / user private room
    registerProjectHandlers(io, socket);

    // Các domain-specific handlers không cần lắng nghe client events —
    // chúng chỉ emit từ service layer thông qua getIO()
    // Xem: task.socket.js, column.socket.js, comment.socket.js, notification.socket.js
  });
};

module.exports = { registerSocketHandlers };
