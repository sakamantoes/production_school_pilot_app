// components/NotificationBell.jsx
// ─── Notification Bell Component with Role-Based API Integration ───────────
// Fetches notifications based on user role (admin, teacher, student)
// Displays dropdown with notifications and mark-as-read functionality

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellRing, CheckCircle, X, MessageSquare, Calendar, Clock, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/schoolApi';
import { teacherApi } from '../services/teacherApi';

// Helper to extract array from response
const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [res, res.data, res.data?.data, ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const c of candidates) { if (Array.isArray(c)) return c; }
  return [];
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Notification Item Component
const NotificationItem = ({ notification, onMarkRead, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isUnread = !notification.readAt;

  const handleClick = async () => {
    if (isUnread) {
      await onMarkRead(notification.id);
    }
    if (onClose) onClose();
  };

  // Get icon based on notification type
  const getIcon = () => {
    const type = notification.type?.toLowerCase();
    if (type === 'announcement') return <Megaphone className="w-4 h-4" />;
    if (type === 'reminder') return <BellRing className="w-4 h-4" />;
    if (type === 'alert') return <AlertTriangle className="w-4 h-4" />;
    return <MessageSquare className="w-4 h-4" />;
  };

  // Get background color based on priority
  const getBgColor = () => {
    if (!isUnread) return 'bg-white hover:bg-slate-50';
    const priority = notification.priority?.toLowerCase();
    if (priority === 'urgent') return 'bg-rose-50 hover:bg-rose-100';
    if (priority === 'high') return 'bg-amber-50 hover:bg-amber-100';
    return 'bg-blue-50 hover:bg-blue-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ x: 4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      className={`relative p-4 rounded-xl cursor-pointer transition-all ${getBgColor()} border-b border-slate-100 last:border-0`}
    >
      <div className="flex items-start gap-3">
        {/* Icon Circle */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUnread ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
        }`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-semibold truncate pr-4 ${isUnread ? 'text-slate-900' : 'text-slate-600'}`}>
              {notification.title}
            </h4>
            {isUnread && (
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-slate-600 line-clamp-2">{notification.body || notification.content}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(notification.createdAt)}
            </span>
            {notification.priority && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                notification.priority === 'urgent' ? 'bg-rose-100 text-rose-600' :
                notification.priority === 'high' ? 'bg-amber-100 text-amber-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {notification.priority}
              </span>
            )}
          </div>
        </div>

        {/* Mark as read dot */}
        {isUnread && isHovered && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
              className="p-1 rounded-full bg-white shadow-sm text-blue-500 hover:text-blue-600 transition-colors"
              title="Mark as read"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main Notification Bell Component
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  // Fetch notifications based on user role
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let fetchedNotifications = [];
      const role = user?.role?.toLowerCase();
      
      // Role-based API calls
      if (role === 'school_admin') {
        // Admin uses notificationAPI from schoolApi
        const res = await notificationAPI.getNotificationHistory();
        fetchedNotifications = toArray(res, 'notifications', 'data');
      } 
      else if (role === 'teacher') {
        // Teacher uses teacherApi
        const res = await teacherApi.getNotifications();
        fetchedNotifications = toArray(res, 'notifications', 'data');
      }
      else if (role === 'student') {
        // Student would use studentApi (to be implemented)
        // For now, return empty array
        fetchedNotifications = [];
      }
      
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.readAt).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const role = user?.role?.toLowerCase();
      
      if (role === 'teacher') {
        await teacherApi.markNotificationRead(notificationId);
      } 
      else if (role === 'school_admin') {
        // Admin mark as read endpoint would be here
        // await notificationAPI.markNotificationRead(notificationId);
      }
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, [user]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.readAt);
    if (unreadNotifications.length === 0) return;
    
    try {
      const role = user?.role?.toLowerCase();
      const promises = unreadNotifications.map(n => 
        role === 'teacher' ? teacherApi.markNotificationRead(n.id) : Promise.resolve()
      );
      await Promise.all(promises);
      
      setNotifications(prev => prev.map(n => 
        !n.readAt ? { ...n, readAt: new Date().toISOString() } : n
      ));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to update notifications');
    }
  }, [notifications, user]);

  // Load notifications when bell is opened
  useEffect(() => {
    if (isOpen && notifications.length === 0 && !loading) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications, notifications.length, loading]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Initial load (background)
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200
          hover:bg-slate-100 active:scale-95
          border border-slate-200/60 bg-white/50"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="w-4.5 h-4.5 text-amber-500" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-rose-500 to-rose-600 rounded-full flex items-center justify-center px-1 shadow-md"
            >
              <span className="text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </motion.div>
          </>
        ) : (
          <Bell className="w-4.5 h-4.5 text-slate-500" />
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-96 sm:w-[420px] max-w-[calc(100vw-2rem)] z-[100] shadow-2xl shadow-slate-900/20 rounded-2xl overflow-hidden"
            style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h3 className="font-bold text-slate-800">Notifications</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 mx-auto mb-3">
                    <div className="w-full h-full rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                  </div>
                  <p className="text-sm text-slate-500">Loading notifications...</p>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={markAsRead}
                    onClose={() => setIsOpen(false)}
                  />
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <Bell className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No notifications yet</p>
                  <p className="text-xs text-slate-400 mt-1">We'll notify you when something arrives</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/80">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {/* Live indicator */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-medium">Live updates</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Import missing icons
const Megaphone = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 11h18a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2Z" />
      <path d="M3 9v6" />
      <path d="M15 15v5" />
      <path d="M9 15v5" />
      <path d="M21 9v6" />
      <path d="M12 3v2" />
      <path d="M9 7 6 4" />
      <path d="M15 7l3-3" />
    </svg>
  );
};

const AlertTriangle = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
};

export default NotificationBell;