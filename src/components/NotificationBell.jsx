// components/NotificationBell.jsx
// ─── Professional Notification Bell Component with Full CRUD Operations ───────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, BellRing, CheckCircle, X, MessageSquare, Clock, 
  MoreVertical, Edit, Trash2, Send, Eye, EyeOff,
  RefreshCw, Loader2, Users, UserCheck, GraduationCap,
  Check, AlertCircle, Filter, Archive, Star, StarOff,
  Calendar, Pin, PinOff, Mail, Inbox, ArrowRight,
  Sparkles, Award, Zap, Heart, Shield,
  FileText,
  Globe,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/schoolApi';
import { teacherApi } from '../services/teacherApi';
import {studentApi} from '../services/studentApi';

// Helper to extract array from response
const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [res, res.data, res.data?.data, ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const c of candidates) { if (Array.isArray(c)) return c; }
  return [];
};

// Format date with relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatFullDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get audience icon and color
const getAudienceInfo = (audience) => {
  const audiences = {
    SCHOOL: { icon: Globe, color: '#8b5cf6', bg: '#f3e8ff', label: 'Everyone' },
    TEACHER: { icon: Briefcase, color: '#10b981', bg: '#f0fdf4', label: 'Teachers' },
    STUDENT: { icon: GraduationCap, color: '#3b82f6', bg: '#eff6ff', label: 'Students' },
    CLASS: { icon: Users, color: '#f59e0b', bg: '#fffbeb', label: 'Class' },
    EVERYONE: { icon: Globe, color: '#8b5cf6', bg: '#f3e8ff', label: 'Everyone' },
    TEACHERS: { icon: Briefcase, color: '#10b981', bg: '#f0fdf4', label: 'Teachers' },
    STUDENTS: { icon: GraduationCap, color: '#3b82f6', bg: '#eff6ff', label: 'Students' },
  };
  return audiences[audience] || audiences.SCHOOL;
};

// Priority badge component
const PriorityBadge = ({ priority }) => {
  const priorities = {
    low: { icon: Heart, color: '#94a3b8', bg: '#f1f5f9', label: 'Low' },
    normal: { icon: Star, color: '#3b82f6', bg: '#eff6ff', label: 'Normal' },
    high: { icon: Zap, color: '#f59e0b', bg: '#fffbeb', label: 'High' },
    urgent: { icon: AlertCircle, color: '#ef4444', bg: '#fef2f2', label: 'Urgent' },
  };
  const p = priorities[priority] || priorities.normal;
  const Icon = p.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium`}
      style={{ background: p.bg, color: p.color }}>
      <Icon className="w-3 h-3" />
      {p.label}
    </span>
  );
};

// Edit Notification Modal
const EditNotificationModal = ({ notification, isOpen, onClose, onUpdate }) => {
  const [title, setTitle] = useState(notification?.title || '');
  const [body, setBody] = useState(notification?.body || '');
  const [audience, setAudience] = useState(notification?.audience || 'SCHOOL');
  const [priority, setPriority] = useState(notification?.priority || 'normal');
  const [scheduledFor, setScheduledFor] = useState(notification?.scheduledFor?.split('T')[0] || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (notification) {
      setTitle(notification.title || '');
      setBody(notification.body || '');
      setAudience(notification.audience || 'SCHOOL');
      setPriority(notification.priority || 'normal');
      setScheduledFor(notification.scheduledFor?.split('T')[0] || '');
    }
  }, [notification]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setLoading(true);
    try {
      await onUpdate(notification.id, { 
        title, 
        body, 
        audience, 
        priority,
        scheduledFor: scheduledFor || undefined 
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Edit className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Edit Notification</h2>
                <p className="text-xs text-slate-500">Update your announcement details</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Notification title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows="4"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Write your message here..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="SCHOOL">🏫 Everyone</option>
                  <option value="TEACHERS">👨‍🏫 Teachers Only</option>
                  <option value="STUDENTS">🎓 Students Only</option>
                  <option value="CLASS">📚 Specific Class</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="low">💜 Low</option>
                  <option value="normal">💙 Normal</option>
                  <option value="high">🧡 High</option>
                  <option value="urgent">❤️ Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Schedule For</label>
              <input
                type="date"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">Leave empty to update immediately</p>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 font-medium shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Notification'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, notificationTitle }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Delete Notification</h2>
              <p className="text-sm text-slate-500">This action cannot be undone</p>
            </div>
          </div>

          <p className="text-slate-600 mb-6">
            Are you sure you want to delete "<span className="font-semibold text-slate-800">{notificationTitle}</span>"?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium shadow-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Notification Item Component
const NotificationItem = ({ notification, onMarkRead, onEdit, onDelete, onSend, canManage, onClose }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const isUnread = !notification.readAt && (!notification.reads || notification.reads.length === 0);
  const isSent = !!notification.sentAt;
  const audienceInfo = getAudienceInfo(notification.audience);
  const AudienceIcon = audienceInfo.icon;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (e) => {
    e.stopPropagation();
    await onMarkRead(notification.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit(notification);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(notification);
  };

  const handleSend = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onSend(notification.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => {
        setIsHovered(false);
        // Don't auto-close menu on hover end, only on click outside
      }}
      className={`relative p-4 cursor-pointer transition-all duration-200 ${
        isUnread 
          ? 'bg-gradient-to-r from-blue-50/50 to-transparent hover:bg-blue-50/80' 
          : 'bg-white hover:bg-slate-50/80'
      } border-b border-slate-100 last:border-0`}
      onClick={() => isUnread && onMarkRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        {/* Icon Circle */}
        <div className="relative flex-shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isUnread 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md' 
              : 'bg-slate-100'
          }`}>
            <MessageSquare className={`w-4 h-4 ${isUnread ? 'text-white' : 'text-slate-500'}`} />
          </div>
          {isUnread && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold truncate ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
              {notification.title}
            </h4>
            <span className="text-xs text-slate-400 flex-shrink-0">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </div>
          
          <p className={`text-sm ${isUnread ? 'text-slate-600' : 'text-slate-500'} line-clamp-2 mb-2`}>
            {notification.body}
          </p>
          
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full`}
              style={{ background: audienceInfo.bg, color: audienceInfo.color }}>
              <AudienceIcon className="w-3 h-3" />
              {audienceInfo.label}
            </span>
            {notification.priority && <PriorityBadge priority={notification.priority} />}
            {!isSent && canManage && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs">
                <Clock className="w-3 h-3" />
                Draft
              </span>
            )}
            {isSent && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                <Send className="w-3 h-3" />
                Sent
              </span>
            )}
          </div>
        </div>

        {/* Actions Menu - Fixed Dropdown */}
        {canManage && (
          <div className="relative flex-shrink-0">
            <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-[200] overflow-hidden"
                  style={{ 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <div className="py-1">
                    <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors group"
                    >
                      <Edit className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <span>Edit Notification</span>
                    </button>
                    
                    {!isSent && (
                      <button
                        onClick={handleSend}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors group"
                      >
                        <Send className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        <span>Send Now</span>
                      </button>
                    )}
                    
                    <div className="border-t border-slate-100 my-1"></div>
                    
                    <button
                      onClick={handleDelete}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors group"
                    >
                      <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-500 transition-colors" />
                      <span>Delete</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Mark as read button for non-admin */}
        {!canManage && isUnread && isHovered && (
          <button
            onClick={handleMarkRead}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white shadow-md text-blue-500 hover:text-blue-600 transition-all"
            title="Mark as read"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
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
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [editingNotification, setEditingNotification] = useState(null);
  const [deletingNotification, setDeletingNotification] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, sent, draft
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  const role = user?.role?.toLowerCase();
  const canManage = role === 'school_admin' || role === 'super_admin';

  // Process notifications to determine read status
  const processNotifications = useCallback((rawNotifications) => {
    return rawNotifications.map(notification => ({
      ...notification,
      readAt: notification.readAt || (notification.reads && notification.reads.length > 0 ? notification.reads[0].readAt : null),
      isSent: !!notification.sentAt,
      isDraft: !notification.sentAt && !notification.scheduledFor,
      isScheduled: !!notification.scheduledFor && !notification.sentAt,
    }));
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (showRefreshing = false) => {
    if (!user) return;
    
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      let fetchedNotifications = [];
      
      if (canManage) {
        const res = await notificationAPI.getNotificationHistory();
        fetchedNotifications = toArray(res, 'notifications', 'data');
      } 
      else if (role === 'teacher') {
        const res = await teacherApi.getNotifications();
        fetchedNotifications = toArray(res, 'notifications', 'data');
      }
      else if (role === 'student') {
        const res = await studentApi.getNotifications();
        fetchedNotifications = toArray(res, 'notifications', 'data');
      }
      
      const processed = processNotifications(fetchedNotifications);
      setNotifications(processed);
      
      if (!canManage) {
        const unread = processed.filter(n => !n.readAt).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      if (showRefreshing) toast.error('Failed to refresh notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, role, canManage, processNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      if (role === 'teacher') {
        await teacherApi.markNotificationRead(notificationId);
      } 
else if (role === 'student') {
  await studentApi.markNotificationRead(notificationId);
}
      
      setNotifications(prev => {
        const updated = prev.map(n => 
          n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
        );
        setUnreadCount(updated.filter(n => !n.readAt).length);
        return updated;
      });
      
      toast.success('Marked as read', { icon: '✅' });
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, [role]);

  // Update notification
  const updateNotification = useCallback(async (id, data) => {
    try {
      await notificationAPI.updateNotification(id, data);
      toast.success('Notification updated successfully');
      await fetchNotifications(true);
    } catch (error) {
      console.error('Failed to update notification:', error);
      toast.error(error?.response?.data?.message || 'Failed to update notification');
      throw error;
    }
  }, [fetchNotifications]);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      toast.success('Notification deleted successfully');
      await fetchNotifications(true);
      setDeletingNotification(null);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete notification');
    }
  }, [fetchNotifications]);

  // Send notification
  const sendNotification = useCallback(async (id) => {
    try {
      await notificationAPI.sendNotification(id);
      toast.success('Notification sent successfully');
      await fetchNotifications(true);
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error(error?.response?.data?.message || 'Failed to send notification');
    }
  }, [fetchNotifications]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.readAt);
    if (unreadNotifications.length === 0) return;
    
    const toastId = toast.loading('Marking all as read...');
    
    try {
      const promises = unreadNotifications.map(n => 
        role === 'teacher' 
          ? teacherApi.markNotificationRead(n.id) 
          : studentApi.markNotificationRead(n.id)
      );
      await Promise.all(promises);
      
      setNotifications(prev => {
        const updated = prev.map(n => 
          !n.readAt ? { ...n, readAt: new Date().toISOString() } : n
        );
        setUnreadCount(0);
        return updated;
      });
      
      toast.success('All notifications marked as read', { id: toastId });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to update notifications', { id: toastId });
    }
  }, [notifications, role]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.readAt;
    if (filter === 'sent') return notification.isSent;
    if (filter === 'draft') return notification.isDraft;
    return true;
  });

  // Load notifications when bell is opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

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

  // Initial load
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Auto-refresh every 30 seconds when open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [isOpen, fetchNotifications]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
          hover:bg-slate-100 active:scale-95
          border border-slate-200/60 bg-white/50 backdrop-blur-sm"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="w-5 h-5 text-amber-500" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-gradient-to-r from-rose-500 to-rose-600 rounded-full flex items-center justify-center px-1 shadow-md"
            >
              <span className="text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </motion.div>
          </>
        ) : (
          <Bell className="w-5 h-5 text-slate-500" />
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-[480px] max-w-[calc(100vw-2rem)] z-[100] shadow-2xl shadow-slate-900/30 rounded-2xl overflow-hidden"
            style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Notifications</h3>
                      <p className="text-xs text-slate-400">
                        {canManage 
                          ? `${notifications.length} total notifications` 
                          : `${unreadCount} unread ${unreadCount === 1 ? 'message' : 'messages'}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => fetchNotifications(true)}
                      disabled={refreshing}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
                      title="Refresh"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 pb-2">
                  {[
                    { id: 'all', label: 'All', icon: Inbox },
                    { id: 'unread', label: 'Unread', icon: Mail },
                    { id: 'sent', label: 'Sent', icon: Send },
                    { id: 'draft', label: 'Drafts', icon: FileText },
                  ].map(tab => {
                    const Icon = tab.icon;
                    const count = tab.id === 'unread' ? unreadCount : 
                                 tab.id === 'sent' ? notifications.filter(n => n.isSent).length :
                                 tab.id === 'draft' ? notifications.filter(n => n.isDraft).length :
                                 notifications.length;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          filter === tab.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {count > 0 && (
                          <span className={`text-xs ${
                            filter === tab.id ? 'text-blue-600' : 'text-slate-400'
                          }`}>
                            ({count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Bar */}
              {!canManage && unreadCount > 0 && (
                <div className="px-5 pb-3">
                  <button
                    onClick={markAllAsRead}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark all as read
                  </button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[500px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-10 h-10 mx-auto mb-3 text-blue-500 animate-spin" />
                  <p className="text-sm text-slate-500">Loading notifications...</p>
                </div>
              ) : filteredNotifications.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markAsRead}
                      onEdit={setEditingNotification}
                      onDelete={setDeletingNotification}
                      onSend={sendNotification}
                      canManage={canManage}
                      onClose={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <Inbox className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium mb-1">No notifications</p>
                  <p className="text-xs text-slate-400">
                    {filter !== 'all' 
                      ? `No ${filter} notifications found`
                      : "You're all caught up!"}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-medium">Live</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {filteredNotifications.length} of {notifications.length} shown
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <EditNotificationModal
        notification={editingNotification}
        isOpen={!!editingNotification}
        onClose={() => setEditingNotification(null)}
        onUpdate={updateNotification}
      />

      <DeleteConfirmModal
        isOpen={!!deletingNotification}
        onClose={() => setDeletingNotification(null)}
        onConfirm={() => deleteNotification(deletingNotification?.id)}
        notificationTitle={deletingNotification?.title}
      />
    </div>
  );
};

export default NotificationBell;