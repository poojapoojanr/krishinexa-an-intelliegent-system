import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'weather' | 'market' | 'disease' | 'crop' | 'scheme';
  icon: string;
  time: string;
  read: boolean;
  timestamp?: number;
  currentCondition?: {
    description?: string;
    temp_c?: number | null;
  };
}

export function useNotifications(userId?: string, district?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setLastCheckTime(Date.now());
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Generate new notifications (call this periodically)
  const generateNewNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Merge with existing, avoiding duplicates
        setNotifications(prev => {
          const newNotifications = data.notifications.filter(
            (newNotif: Notification) =>
              !prev.find(existing => existing.id === newNotif.id)
          );
          return [...newNotifications, ...prev].slice(0, 50); // Keep last 50
        });
        setLastCheckTime(Date.now());
      }
    } catch (error) {
      console.error('Error generating notifications:', error);
    }

    // Additionally poll VajraSOS in-app alerts for the selected district (if provided)
    if (district) {
      try {
        const base = process.env.NEXT_PUBLIC_VAJRA_SOS_BASE || 'http://127.0.0.1:8000';
        const res = await fetch(`${base}/api/vajra-sos/inapp-alerts?district=${encodeURIComponent(district)}`);
        if (res.ok) {
          const data = await res.json();
          const vaAlerts = (data.alerts || []).map((a: any) => ({
            id: a.id,
            title: a.title,
            message: a.message,
            currentCondition: a.currentCondition || data.currentCondition || undefined,
            type: 'weather' as const,
            icon: a.icon || 'Cloud',
            time: a.time || data.generatedAt,
            read: false,
            timestamp: a.time ? new Date(a.time).getTime() : Date.now(),
          }));

          setNotifications(prev => {
            const newNotifications = vaAlerts.filter(
              (newNotif: Notification) => !prev.find(existing => existing.id === newNotif.id)
            );
            return [...newNotifications, ...prev].slice(0, 50);
          });
          setLastCheckTime(Date.now());
        }
      } catch (err) {
        console.error('Error fetching VajraSOS alerts:', err);
      }
    }
  }, [userId]);

  // Initial load on mount
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  // Poll for new notifications every hour (3600000 ms)
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      generateNewNotifications();
    }, 3600000); // Check every hour

    return () => clearInterval(interval);
  }, [userId, district, generateNewNotifications]);

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Delete notification
  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Delete all read notifications
  const deleteReadNotifications = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    unreadCount,
    lastCheckTime,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReadNotifications,
    fetchNotifications,
    generateNewNotifications,
  };
}
