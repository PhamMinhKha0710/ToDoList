const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { CLIENT_URL, JWT_ACCESS_SECRET } = require('./env');
const logger = require('../utils/logger');

let io;

/**
 * Khởi tạo Socket.IO và gắn vào HTTP server
 * @param {http.Server} httpServer
 * @returns {Server} io instance
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ─── JWT Auth Middleware ───────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Unauthorized: Token not provided'));
    }
    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
      socket.user = decoded; // { id, email, ... }
      next();
    } catch (err) {
      logger.warn(`Socket auth failed: ${err.message}`);
      next(new Error('Unauthorized: Invalid token'));
    }
  });

  // ─── Connection Handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    logger.info(`User ${socket.user._id} connected with socket ${socket.id}`);
    
    // Join user-specific room for notifications
    socket.join(socket.user._id.toString());
    
    socket.on('disconnect', () => {
      logger.info(`User ${socket.user._id} disconnected`);
    });
  });

  return io;
};

/**
 * Lấy io instance sau khi đã khởi tạo
 */
const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIO };
