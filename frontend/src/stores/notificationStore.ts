import { create } from 'zustand';
import { fetchApi } from '@/lib/api';

export interface Notification {
  id: string;
  user_id: string;
  booking_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    set({ notifications, unreadCount });
  },

  addNotification: (notification) => {
    const current = get().notifications;
    // Prepend to list
    const updated = [notification, ...current].slice(0, 100); // Keep last 100
    const unreadCount = updated.filter(n => !n.is_read).length;
    set({ notifications: updated, unreadCount });
  },

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const response = await fetchApi('/api/notifications');
      const data = response.data || [];
      const unreadCount = response.unread || 0;
      set({ notifications: data, unreadCount, loading: false });
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      set({ loading: false });
    }
  },

  markAsRead: async (id) => {
    // 1. Optimistic Update
    const currentNotifications = get().notifications;
    const currentUnreadCount = get().unreadCount;
    
    const target = currentNotifications.find(n => n.id === id);
    if (!target || target.is_read) return;

    const optimisticUpdated = currentNotifications.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    );
    
    set({ 
      notifications: optimisticUpdated, 
      unreadCount: Math.max(0, currentUnreadCount - 1)
    });

    // 2. Call API
    try {
      await fetchApi(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch (err) {
      // 3. Rollback on Error
      console.error('Failed to mark notification as read, rolling back', err);
      set({ 
        notifications: currentNotifications, 
        unreadCount: currentUnreadCount 
      });
    }
  },

  markAllAsRead: async () => {
    // 1. Optimistic Update
    const currentNotifications = get().notifications;
    const currentUnreadCount = get().unreadCount;

    if (currentUnreadCount === 0) return;

    const optimisticUpdated = currentNotifications.map(n => ({ ...n, is_read: true }));
    set({ notifications: optimisticUpdated, unreadCount: 0 });

    // 2. Call API
    try {
      await fetchApi('/api/notifications/read-all', { method: 'PATCH' });
    } catch (err) {
      // 3. Rollback on Error
      console.error('Failed to mark all as read, rolling back', err);
      set({ 
        notifications: currentNotifications, 
        unreadCount: currentUnreadCount 
      });
    }
  },

  deleteNotification: async (id) => {
    // 1. Optimistic Update
    const currentNotifications = get().notifications;
    const currentUnreadCount = get().unreadCount;
    
    const target = currentNotifications.find(n => n.id === id);
    if (!target) return;

    const optimisticUpdated = currentNotifications.filter(n => n.id !== id);
    
    set({ 
      notifications: optimisticUpdated, 
      unreadCount: target.is_read ? currentUnreadCount : Math.max(0, currentUnreadCount - 1)
    });

    // 2. Call API
    try {
      await fetchApi(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (err) {
      // 3. Rollback on Error
      console.error('Failed to delete notification, rolling back', err);
      set({ 
        notifications: currentNotifications, 
        unreadCount: currentUnreadCount 
      });
      throw err; // Allow UI to catch and show toast
    }
  }
}));
