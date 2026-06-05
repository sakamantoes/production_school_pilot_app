import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getAccessToken, clearTokens } from "../services/mainApi";
import axios from "axios";

// communicationsAPI removed from services/api — provide stub to avoid runtime import error
const _apiStubFactory = () => new Proxy({}, { get: () => async () => ({ data: null }) });
const communicationsAPI = _apiStubFactory();

// Simple versions since you don't have refresh token
const getRefreshToken = () => null;
const setTokens = (token) => {
  if (token?.access) {
    localStorage.setItem("access_token", token.access);
  } else if (token) {
    localStorage.setItem("access_token", token);
  }
};

const NotificationContext = createContext(null);
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, logout } = useAuth();

  // Get API URL from env
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Refresh token manually (returns null since no refresh token)
  const refreshAccessToken = async () => {
    try {
      const refresh = getRefreshToken();
      if (!refresh) {
        // No refresh token available, just return null
        return null;
      }

      const res = await fetch(`${API_URL}/api/accounts/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Token refresh failed");

      setTokens({ access: data.access });
      return data.access;
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearTokens();
      logout();
      return null;
    }
  };

  // Wrap API calls to auto-refresh token on 401
  const fetchWithTokenRefresh = async (apiCall) => {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return await apiCall(); // retry original call
        }
      }
      throw error;
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const response = await fetchWithTokenRefresh(async () => {
        // Make actual API call if you have a notifications endpoint
        // For now, return mock data
        const res = await fetch(`${API_URL}/api/notifications/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (!res.ok) throw new Error("Failed to fetch notifications");
        return await res.json();
      });

      // If using communicationsAPI stub, use this instead:
      // const response = await fetchWithTokenRefresh(
      //   () => communicationsAPI.notifications()
      // );

      const data = Array.isArray(response)
        ? response
        : response?.data || response?.results || [];

      const transformed = (Array.isArray(data) ? data : []).map((n) => ({
        id: n.id,
        title: n.title || "",
        message: n.message || "",
        type: n.type || "info",
        read: n.read || !n.unread,
        created_at: n.timestamp || n.created_at || new Date().toISOString(),
      }));

      setNotifications(transformed);
      const unread = transformed.filter((n) => !n.read).length;
      setUnreadCount(unread);
      
      console.log("Notifications fetched:", transformed);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      // Don't show error to user for background fetch
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = getAccessToken();
      if (!token) return;

      if (notificationId === "all") {
        // Mark all as read
        await fetch(`${API_URL}/api/notifications/mark-all-read/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } else {
        // Mark single as read
        await fetch(`${API_URL}/api/notifications/${notificationId}/read/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ read: true }),
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );

        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: notification.id || Date.now(),
      title: notification.title || "",
      message: notification.message || "",
      type: notification.type || "info",
      read: notification.read || false,
      created_at: notification.created_at || new Date().toISOString(),
    };

    setNotifications((prev) => [newNotification, ...prev]);

    if (!newNotification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    refreshNotifications: fetchNotifications,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};