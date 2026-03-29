import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';

let socket: Socket | null = null;

/**
 * Kết nối Socket.IO với JWT token xác thực.
 * Nếu đã có kết nối thì trả về instance hiện tại.
 * @param token - JWT access token
 */
export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  // Nếu socket tồn tại nhưng bị ngắt, xóa nó trước
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  return socket;
};

/**
 * Lấy socket instance hiện tại (có thể null nếu chưa connect)
 */
export const getSocket = (): Socket | null => socket;

/**
 * Ngắt kết nối và xóa socket instance
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
