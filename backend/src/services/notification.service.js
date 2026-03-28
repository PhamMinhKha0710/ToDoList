class NotificationService {
  constructor({ notificationRepository, emitNotification, getIO }) {
    this.notificationRepository = notificationRepository;
    this.emitNotification = emitNotification;
    this.getIO = getIO;
  }

  isUserInRoom(userId, roomName) {
    try {
      const io = this.getIO();
      const room = io.sockets.adapter.rooms.get(roomName.toString());
      if (!room) {
        console.log(`[NotificationService] Room ${roomName} not found or empty.`);
        return false;
      }

      const userRoomName = `user:${userId}`;
      const userRoom = io.sockets.adapter.rooms.get(userRoomName);
      if (!userRoom) {
        console.log(`[NotificationService] Private user room ${userRoomName} not found.`);
        return false;
      }

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

  async createNotification(data, roomToCheck = null) {
    console.log(`[NotificationService] Creating notification for user: ${data.recipientId}, type: ${data.type}`);
    const notification = await this.notificationRepository.create(data);

    if (roomToCheck && this.isUserInRoom(data.recipientId.toString(), roomToCheck.toString())) {
      console.log(`[NotificationService] User ${data.recipientId} is in room ${roomToCheck}, skipping realtime socket emission.`);
      return notification;
    }

    console.log(`[NotificationService] Emitting realtime notification to user room user:${data.recipientId}`);
    this.emitNotification(data.recipientId.toString(), notification);

    return notification;
  }

  async getNotifications(userId, limit, offset) {
    return await this.notificationRepository.findByUserId(userId, limit, offset);
  }

  async getUnreadCount(userId) {
    return await this.notificationRepository.countUnread(userId);
  }

  async markAsRead(notificationId) {
    return await this.notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId) {
    return await this.notificationRepository.markAllAsRead(userId);
  }
}

module.exports = new NotificationService({
  notificationRepository: require('../repositories/notification.repository'),
  emitNotification: require('../sockets/notification.socket').emitNotification,
  getIO: require('../config/socket').getIO,
});
