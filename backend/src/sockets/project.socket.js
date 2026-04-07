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
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    console.log(`[Socket] Socket ${socket.id} joined personal room: ${userRoom}`);
    logger.info(`Socket ${socket.id} joined user room: ${userRoom}`);
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
    console.log(`[Socket] User ${userId} leaving project: ${projectId}`);
    socket.leave(projectId);
    logger.info(`Socket ${socket.id} left project room: ${projectId}`);

    socket.to(projectId).emit("user:offline", {
      userId,
      projectId,
    });
  });

  socket.on('join:task', (taskId) => {
    console.log(`[Socket] User ${userId} joining task: ${taskId}`);
    socket.join(taskId);
  });

  socket.on('leave:task', (taskId) => {
    console.log(`[Socket] User ${userId} leaving task: ${taskId}`);
    socket.leave(taskId);
  });

  // ─── Admin Projects Room ───────────────────────────────────────────────────
  socket.on('join:admin_projects', () => {
    if (socket.user?.role !== 'admin') {
      return console.warn(`[Socket] Non-admin user ${userId} tried to join admin room`);
    }
    socket.join('admin:projects');
    logger.info(`Admin socket ${socket.id} joined admin:projects room`);
  });

  socket.on('leave:admin_projects', () => {
    socket.leave('admin:projects');
    logger.info(`Admin socket ${socket.id} left admin:projects room`);
  });

  // Khi ngắt kết nối, Socket.IO tự xóa khỏi tất cả rooms
  socket.on("disconnect", (reason) => {
    logger.info(`Socket ${socket.id} disconnected: ${reason}`);
  });
};
