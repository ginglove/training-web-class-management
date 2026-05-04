import { create } from 'zustand';
import { fetchApi } from '@/lib/api';

export interface Notification {
  id: string;
  user_id: string;
  booking_id?: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  
  // Internal
  initialize: (userId: string) => void;
  cleanup: () => void;
}

let eventSource: EventSource | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const response = await fetchApi('/api/notifications');
      set({ 
        notifications: response.data || [], 
        unreadCount: response.unread || 0,
        loading: false 
      });
    } catch (err) {
      set({ error: 'Không thể tải thông báo', loading: false });
    }
  },

  markAsRead: async (id: string) => {
    const originalNotifications = get().notifications;
    const originalUnread = get().unreadCount;

    // Optimistic Update
    set({
      notifications: originalNotifications.map(n => 
        n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, originalUnread - 1)
    });

    try {
      await fetchApi(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch (err) {
      // Rollback
      set({ notifications: originalNotifications, unreadCount: originalUnread });
      throw err;
    }
  },

  markAllAsRead: async () => {
    const originalNotifications = get().notifications;
    const originalUnread = get().unreadCount;

    // Optimistic Update
    set({
      notifications: originalNotifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0
    });

    try {
      await fetchApi('/api/notifications/read-all', { method: 'PATCH' });
    } catch (err) {
      // Rollback
      set({ notifications: originalNotifications, unreadCount: originalUnread });
      throw err;
    }
  },

  deleteNotification: async (id: string) => {
    const originalNotifications = get().notifications;
    const originalUnread = get().unreadCount;
    const notification = originalNotifications.find(n => n.id === id);

    // Optimistic Update
    set({
      notifications: originalNotifications.filter(n => n.id !== id),
      unreadCount: notification && !notification.is_read ? originalUnread - 1 : originalUnread
    });

    try {
      await fetchApi(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (err) {
      // Rollback
      set({ notifications: originalNotifications, unreadCount: originalUnread });
      throw err;
    }
  },

  clearReadNotifications: async () => {
    const originalNotifications = get().notifications;
    
    // Optimistic Update
    set({
      notifications: originalNotifications.filter(n => !n.is_read)
    });

    try {
      await fetchApi('/api/notifications/read', { method: 'DELETE' });
    } catch (err) {
      // Rollback
      set({ notifications: originalNotifications });
      throw err;
    }
  },

  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  initialize: (userId: string) => {
    if (eventSource) return;
    
    get().fetchNotifications();

    const url = new URL('/api/notifications/stream', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8013');
    url.searchParams.append('userId', userId);
    
    eventSource = new EventSource(url.toString());

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'NOTIFICATION') {
        set(state => ({
          notifications: [data.notification, ...state.notifications],
          unreadCount: data.unreadCount ?? (state.unreadCount + 1)
        }));
      }

      if (data.type === 'READ_COUNT_UPDATED') {
        set({ unreadCount: data.unreadCount });
      }
    };

    eventSource.onerror = () => {
      eventSource?.close();
      eventSource = null;
      // Exponential backoff or simple retry
      setTimeout(() => get().initialize(userId), 5000);
    };
  },

  cleanup: () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }
}));
