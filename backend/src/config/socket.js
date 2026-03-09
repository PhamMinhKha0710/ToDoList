const { Server } = require('socket.io');
const { CLIENT_URL } = require('./env');

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
