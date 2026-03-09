const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { registerSocketHandlers } = require('./sockets/index');
const { PORT } = require('./config/env');
const logger = require('./utils/logger');

const startServer = async () => {
  // 1. Kết nối MongoDB
  await connectDB();

  // 2. Tạo HTTP server từ Express app
  const httpServer = http.createServer(app);

  // 3. Gắn Socket.IO vào HTTP server
  const io = initSocket(httpServer);

  // 4. Đăng ký tất cả socket event handlers
  registerSocketHandlers(io);

  // 5. Lắng nghe kết nối
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    logger.info(`📡 Socket.IO đã sẵn sàng`);
  });

  // ─── Xử lý lỗi không được catch ─────────────────────────────────────────
  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    httpServer.close(() => process.exit(1));
  });

  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
  });
};

startServer();
