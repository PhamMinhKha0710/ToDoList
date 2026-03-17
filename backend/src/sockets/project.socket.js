const logger = require("../utils/logger");

/**
 * Xử lý join/leave project room + user private room + presence events
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Socket} socket
 */
module.exports = (io, socket) => {
  // Mỗi user tự động join room riêng để nhận notification cá nhân
  const userId = socket.user?.id || socket.user?._id;
  if (userId) {
    socket.join(`user:${userId}`);
    logger.info(`Socket ${socket.id} joined user room: user:${userId}`);
  }

  // Client join room của project khi vào Kanban
  socket.on("join:project", (projectId) => {
    socket.join(projectId);
    logger.info(`Socket ${socket.id} joined project room: ${projectId}`);

    console.log(`Socket: User ${userId} joined project room: ${projectId}`);
    // Thông báo cho các user khác trong room về sự hiện diện
    socket.to(projectId).emit("user:online", {
      userId,
      projectId,
    });
  });

  // Client rời room khi thoát khỏi project
  socket.on("leave:project", (projectId) => {
    socket.leave(projectId);
    logger.info(`Socket ${socket.id} left project room: ${projectId}`);

    console.log(`Socket: User ${userId} left project room: ${projectId}`);
    socket.to(projectId).emit("user:offline", {
      userId,
      projectId,
    });
  });

  // Khi ngắt kết nối, Socket.IO tự xóa khỏi tất cả rooms
  socket.on("disconnect", (reason) => {
    logger.info(`Socket ${socket.id} disconnected: ${reason}`);
  });
};
