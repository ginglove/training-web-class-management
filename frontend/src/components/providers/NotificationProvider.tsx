'use client';

import * as React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { toast } from 'react-hot-toast';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  const { fetchNotifications, addNotification } = useNotificationStore();
  const eventSourceRef = React.useRef<EventSource | null>(null);

  React.useEffect(() => {
    if (user && token) {
      // Fetch existing
      fetchNotifications();

      // Connect SSE
      // Note: EventSource doesn't support custom headers easily, 
      // but our backend checks query param userId. 
      // In a real app we'd use token and verify on backend.
      const url = `/api/notifications/stream?userId=${user.id}`;
      const es = new EventSource(url);

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NOTIFICATION') {
            addNotification(data.notification);
            toast.success(data.notification.title, {
              icon: '🔔',
              duration: 5000,
            });
          }
        } catch (err) {
          console.error('Failed to parse SSE message', err);
        }
      };

      es.onerror = (err) => {
        console.error('SSE Error:', err);
        es.close();
      };

      eventSourceRef.current = es;

      return () => {
        es.close();
      };
    }
  }, [user, token, fetchNotifications, addNotification]);

  return <>{children}</>;
}
