const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const { toNotificationModel } = require('../models/notifications/notification.model.js');

class NotificationController {
  constructor({ notificationService, ApiResponse, catchAsync }) {
    this.notificationService = notificationService;

  }

  getNotifications = catchAsync(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;
    const notifications = await this.notificationService.getNotifications(req.user._id, parseInt(limit), parseInt(offset));
    new ApiResponse(200, 'Lấy danh sách thông báo thành công', { notifications: notifications.map(toNotificationModel) }).send(res);
  });

  getUnreadCount = catchAsync(async (req, res) => {
    const count = await this.notificationService.getUnreadCount(req.user._id);
    new ApiResponse(200, 'Lấy số lượng chưa đọc thành công', { unreadCount: count }).send(res);
  });

  markAsRead = catchAsync(async (req, res) => {
    const notification = await this.notificationService.markAsRead(req.params.id);
    new ApiResponse(200, 'Đã đánh dấu là đã đọc', { notification: toNotificationModel(notification) }).send(res);
  });

  markAllAsRead = catchAsync(async (req, res) => {
    await this.notificationService.markAllAsRead(req.user._id);
    new ApiResponse(200, 'Đã đánh dấu tất cả là đã đọc').send(res);
  });
}

module.exports = NotificationController;
