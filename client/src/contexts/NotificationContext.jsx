import { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { SocketContext } from './SocketContext';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};

/**
 * NotificationProvider - Manages app-wide notifications
 * Listens for socket events and fetches from API
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useContext(SocketContext);
  const { isAuthenticated } = useContext(AuthContext);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get('/notifications');
      const items = data.notifications || data.data || data || [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    } catch (err) {
      // Silently handle - notifications are not critical
      console.debug('Failed to fetch notifications:', err.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Listen for socket notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification', handleNotification);
    socket.on('attendance:marked', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('attendance:marked', handleNotification);
    };
  }, [socket]);

  const addNotification = useCallback((notification) => {
    const newNotif = {
      _id: Date.now().toString(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      // continue even if API fails
    }
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
    } catch (err) {
      // continue even if API fails
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
