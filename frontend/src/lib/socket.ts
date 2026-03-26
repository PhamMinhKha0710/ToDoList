import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000'

let socket: Socket | null = null

/**
 * Kết nối Socket.IO — gọi sau khi đăng nhập thành công
 */
export const connectSocket = (accessToken: string): Socket => {
  console.log('[Socket] Initializing connection with token:', accessToken.substring(0, 10) + '...');
  // Nếu đã có socket, ngắt kết nối cũ để đảm bảo dùng token mới nhất
  if (socket) {
    console.log('[Socket] Disconnecting existing socket before re-connecting');
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    withCredentials: true,
    autoConnect: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected successfully, ID:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected, reason:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
};

/**
 * Ngắt kết nối Socket.IO — gọi khi logout
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Lấy socket instance (đã kết nối)
 */
export const getSocket = (): Socket | null => socket
