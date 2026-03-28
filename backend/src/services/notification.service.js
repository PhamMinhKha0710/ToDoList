const notificationRepository = require('../repositories/notification.repository');
const { emitNotification } = require('../sockets/notification.socket');
const { getIO } = require('../config/socket');

class NotificationService {
  /**
   * Kiểm tra xem một user có đang ở trong một room cụ thể không
   * @param {string} userId 
   * @param {string} roomName 
   * @returns {boolean}
   */
  isUserInRoom(userId, roomName) {
    try {
      const io = getIO();
      const room = io.sockets.adapter.rooms.get(roomName.toString());
      if (!room) {
        console.log(`[NotificationService] Room ${roomName} not found or empty.`);
        return false;
      }

      // Lấy tất cả socket IDs của user (user đã join room "user:<userId>")
      const userRoomName = `user:${userId}`;
      const userRoom = io.sockets.adapter.rooms.get(userRoomName);
      if (!userRoom) {
        console.log(`[NotificationService] Private user room ${userRoomName} not found.`);
        return false;
      }

      // Kiểm tra xem có socket nào của user nằm trong roomName không
      for (const socketId of userRoom) {
        if (room.has(socketId)) {
          console.log(`[NotificationService] Match found! Socket ${socketId} is in both ${userRoomName} and ${roomName}.`);
          return true;
        }
      }
      console.log(`[NotificationService] No overlap between ${userRoomName} and ${roomName}.`);
      return false;
    } catch (err) {
      console.error(`[NotificationService] Error in isUserInRoom:`, err);
      return false;
    }
  }

  /**
   * Tạo thông báo mới và gửi realtime (nếu cần)
   * @param {object} data - { recipientId, type, title, message, metadata }
   * @param {string} [roomToCheck] - Room ID để kiểm tra "smart delivery"
   */
  async createNotification(data, roomToCheck = null) {
    console.log(`[NotificationService] Creating notification for user: ${data.recipientId}, type: ${data.type}`);
    // Luôn lưu vào DB để tra cứu lịch sử
    const notification = await notificationRepository.create(data);
    
    // Smart Delivery: Nếu user đang ở trong room liên quan, không phát tín hiệu 'notification:new'
    if (roomToCheck && this.isUserInRoom(data.recipientId.toString(), roomToCheck.toString())) {
      console.log(`[NotificationService] User ${data.recipientId} is in room ${roomToCheck}, skipping realtime socket emission.`);
      return notification;
    }

    console.log(`[NotificationService] Emitting realtime notification to user room user:${data.recipientId}`);
    // Gửi socket realtime tới user nếu họ không ở trong room hoặc không truyền roomToCheck
    emitNotification(data.recipientId.toString(), notification);
    
    return notification;
  }

  async getNotifications(userId, limit, offset) {
    return await notificationRepository.findByUserId(userId, limit, offset);
  }

  async getUnreadCount(userId) {
    return await notificationRepository.countUnread(userId);
  }

  async markAsRead(notificationId) {
    return await notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId) {
    return await notificationRepository.markAllAsRead(userId);
  }
}

module.exports = new NotificationService();
