import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000'

let socket: Socket | null = null

/**
 * Kết nối Socket.IO — gọi sau khi đăng nhập thành công
 */
export const connectSocket = (accessToken: string): Socket => {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL, {
    auth: { token: accessToken },
    withCredentials: true,
    autoConnect: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => console.log('[Socket] Connected:', socket?.id))
  socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason))
  socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message))

  return socket
}

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
