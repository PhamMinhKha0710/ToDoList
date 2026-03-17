import api from '@/lib/axios';
import type { Notification } from '@/types/notification';

export const notificationService = {
  getNotifications: async (limit = 20, offset = 0): Promise<Notification[]> => {
    const response = await api.get('/notifications', { params: { limit, offset } });
    return response.data.data.notifications;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.data.unreadCount;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data.data.notification;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/mark-all-read');
  },
};
