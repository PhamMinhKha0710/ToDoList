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
      if (!room) return false;

      const userRoomName = `user:${userId}`;
      const userRoom = io.sockets.adapter.rooms.get(userRoomName);
      if (!userRoom) return false;

      for (const socketId of userRoom) {
        if (room.has(socketId)) return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  async createNotification(data, roomToCheck = null) {
    const notification = await this.notificationRepository.create(data);

    if (roomToCheck && this.isUserInRoom(data.recipientId.toString(), roomToCheck.toString())) {
      return notification;
    }

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

module.exports = NotificationService;
