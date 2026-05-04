'use client';

import * as React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { toast } from 'react-hot-toast';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  const { fetchNotifications, addNotification } = useNotificationStore();
  const eventSourceRef = React.useRef<EventSource | null>(null);
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const connectSSE = React.useCallback(() => {
    if (!user || !token) return;

    // Clean up existing
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const url = `/api/notifications/stream?userId=${user.id}`;
    console.log('📡 Connecting to SSE:', url);
    
    const es = new EventSource(url);

    es.onopen = () => {
      console.log('✅ SSE Connected');
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📩 SSE Message:', data);
        
        if (data.type === 'NOTIFICATION') {
          addNotification(data.notification);
          toast.success(data.notification.title, {
            icon: '🔔',
            duration: 5000,
          });
        }
      } catch (err) {
        console.error('❌ Failed to parse SSE message', err);
      }
    };

    es.onerror = (err) => {
      console.error('⚠️ SSE Error (Connection might have dropped):', err);
      es.close();
      
      // Attempt reconnection after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Attempting to reconnect SSE...');
        connectSSE();
      }, 5000);
    };

    eventSourceRef.current = es;
  }, [user, token, addNotification]);

  React.useEffect(() => {
    if (user && token) {
      fetchNotifications();
      connectSSE();

      return () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }
  }, [user, token, fetchNotifications, connectSSE]);

  return <>{children}</>;
}
