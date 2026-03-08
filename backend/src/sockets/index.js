/**
 * Đăng ký tất cả Socket.IO event handlers
 * Các handler cụ thể sẽ được thêm khi implement từng feature
 * @param {import('socket.io').Server} io
 */
const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // Người dùng join vào room của project
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    // Người dùng rời room của project
    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      // cleanup nếu cần
    });
  });
};

module.exports = { registerSocketHandlers };
