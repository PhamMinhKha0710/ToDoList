import { create } from 'zustand'
import { notificationService } from '@/services/notification.service'
import type { Notification } from '@/types/notification'

interface NotificationState {
  unreadCount: number
  notifications: Notification[]
  setUnreadCount: (n: number) => void
  setNotifications: (notifications: Notification[]) => void
  increment: () => void
  reset: () => void
  fetchUnreadCount: () => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  notifications: [],
  setUnreadCount: (n) => set({ unreadCount: n }),
  setNotifications: (notifications) => set({ notifications }),
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
  fetchUnreadCount: async () => {
    try {
      const count = await notificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }
}))
