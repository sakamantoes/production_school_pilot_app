// pages/school/AnnouncementsAdmin.jsx
// ─── Complete Announcement & Notification Management System ───────────────────
// Features: Create/Edit/Delete announcements, Send notifications,
// View notification history, Target audiences, Schedule posts
// FIXED: Backend expects 'body' (not 'content') and uppercase audience values

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Megaphone, Plus, Edit2, Trash2, X, Save, RefreshCw, Loader2,
  AlertCircle, Send, Eye, EyeOff, Calendar, Clock, Users,
  GraduationCap, Briefcase, UserCheck, Globe, Filter, Search,
  CheckCircle, XCircle, AlertTriangle, Bell, Mail, MessageCircle,
  ChevronDown, ChevronUp, MoreVertical, Play, Pause, History,
  Target, Tag, FileText, Image, Link2, AtSign,
} from 'lucide-react';
import { notificationAPI } from '../../services/schoolApi';

// ─────────────────────────────────────────────────────────────
// DATA HELPERS
// ─────────────────────────────────────────────────────────────
const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [
    res, res.data, res.data?.data,
    ...keys.map(k => res[k]),
    ...keys.map(k => res.data?.[k]),
  ];
  for (const c of candidates) { if (Array.isArray(c)) return c; }
  return [];
};

// ─── FIX: Backend expects uppercase audience values ───
const AUDIENCE_OPTIONS = [
  { value: 'SCHOOL', label: 'Everyone (School)', icon: Globe, color: '#8b5cf6', bg: '#f3e8ff' },
  { value: 'STUDENT', label: 'Students Only', icon: GraduationCap, color: '#3b82f6', bg: '#eff6ff' },
  { value: 'TEACHER', label: 'Teachers Only', icon: Briefcase, color: '#10b981', bg: '#f0fdf4' },
  // Note: Parents may not be directly supported, using SCHOOL as fallback
  { value: 'SCHOOL', label: 'Parents (via School)', icon: Users, color: '#f59e0b', bg: '#fffbeb' },
];

const CLASS_AUDIENCE_OPTIONS = [
  { value: 'CLASS', label: 'Specific Class', icon: GraduationCap, color: '#3b82f6', bg: '#eff6ff' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#94a3b8', bg: '#f1f5f9' },
  { value: 'normal', label: 'Normal', color: '#3b82f6', bg: '#eff6ff' },
  { value: 'high', label: 'High', color: '#f59e0b', bg: '#fffbeb' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444', bg: '#fef2f2' },
];

const TYPE_OPTIONS = [
  { value: 'announcement', label: 'Announcement', icon: Megaphone },
  { value: 'reminder', label: 'Reminder', icon: Bell },
  { value: 'alert', label: 'Alert', icon: AlertTriangle },
  { value: 'message', label: 'Message', icon: MessageCircle },
];

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const AnnouncementsAdmin = () => {
  const [notifications, setNotifications] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  
  // Form state - FIXED to match backend expectations
  const [form, setForm] = useState({
    title: '',
    body: '',  // ← FIXED: backend expects 'body' not 'content'
    type: 'announcement',
    audience: 'SCHOOL',  // ← FIXED: uppercase
    priority: 'normal',
    scheduledFor: '',
    expiresAt: '',
    link: '',
    linkText: '',
    imageUrl: '',
    // Additional fields for specific audiences
    classId: '',
    teacherId: '',
    studentId: '',
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch Data ─────────────────────────────────────────────
  const fetchData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [notifRes, classRes, teacherRes, studentRes] = await Promise.allSettled([
        notificationAPI.getNotificationHistory(),
        // Import these APIs if needed
        import('../../services/schoolApi').then(module => module.classAPI?.getClasses()),
        import('../../services/schoolApi').then(module => module.teacherAPI?.getTeachers()),
        import('../../services/schoolApi').then(module => module.studentAPI?.getStudents()),
      ]);
      
      setNotifications(toArray(notifRes.status === 'fulfilled' ? notifRes.value : null, 'notifications', 'data'));
      setClasses(toArray(classRes.status === 'fulfilled' ? classRes.value : null, 'classes'));
      setTeachers(toArray(teacherRes.status === 'fulfilled' ? teacherRes.value : null, 'teachers', 'items'));
      setStudents(toArray(studentRes.status === 'fulfilled' ? studentRes.value : null, 'students', 'items'));
      
      if (isRefresh) toast.success('Notifications refreshed');
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error?.response?.data?.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filter Notifications ───────────────────────────────────
  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title?.toLowerCase().includes(search.toLowerCase()) ||
                          notif.body?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' ? true :
                          filterStatus === 'sent' ? notif.sentAt :
                          filterStatus === 'scheduled' ? notif.scheduledFor && !notif.sentAt :
                          filterStatus === 'draft' ? !notif.sentAt && !notif.scheduledFor : true;
    const matchesAudience = filterAudience === 'all' ? true : notif.audience === filterAudience;
    const matchesType = filterType === 'all' ? true : notif.type === filterType;
    return matchesSearch && matchesStatus && matchesAudience && matchesType;
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => 
    new Date(b.createdAt || b.scheduledFor || 0) - new Date(a.createdAt || a.scheduledFor || 0)
  );

  // ── CRUD Operations - FIXED payload structure ──────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) {
      toast.error('Title and body are required');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,  // ← FIXED: use 'body' not 'content'
        type: form.type,
        audience: form.audience,
        priority: form.priority,
        scheduledFor: form.scheduledFor || undefined,
        expiresAt: form.expiresAt || undefined,
        link: form.link || undefined,
        linkText: form.linkText || undefined,
        imageUrl: form.imageUrl || undefined,
      };
      
      // Add conditional fields based on audience
      if (form.audience === 'CLASS' && form.classId) {
        payload.classId = form.classId;
      }
      if (form.audience === 'TEACHER' && form.teacherId) {
        payload.teacherId = form.teacherId;
      }
      if (form.audience === 'STUDENT' && form.studentId) {
        payload.studentId = form.studentId;
      }
      
      await notificationAPI.createNotification(payload);
      toast.success('Notification created successfully');
      resetForm();
      setShowCreateModal(false);
      fetchData();
    } catch (error) {
      const errorMsg = error?.response?.data?.errors?.[0]?.message || 
                       error?.response?.data?.message || 
                       'Failed to create notification';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) {
      toast.error('Title and body are required');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        type: form.type,
        audience: form.audience,
        priority: form.priority,
        scheduledFor: form.scheduledFor || undefined,
        expiresAt: form.expiresAt || undefined,
        link: form.link || undefined,
        linkText: form.linkText || undefined,
        imageUrl: form.imageUrl || undefined,
      };
      
      if (form.audience === 'CLASS' && form.classId) payload.classId = form.classId;
      if (form.audience === 'TEACHER' && form.teacherId) payload.teacherId = form.teacherId;
      if (form.audience === 'STUDENT' && form.studentId) payload.studentId = form.studentId;
      
      await notificationAPI.updateNotification(editingNotification.id, payload);
      toast.success('Notification updated successfully');
      resetForm();
      setShowCreateModal(false);
      setEditingNotification(null);
      fetchData();
    } catch (error) {
      const errorMsg = error?.response?.data?.errors?.[0]?.message || 
                       error?.response?.data?.message || 
                       'Failed to update notification';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (id, title) => {
    if (!window.confirm(`Send "${title}" now? This will notify all selected recipients.`)) return;
    
    setSendingId(id);
    try {
      await notificationAPI.sendNotification(id);
      toast.success(`"${title}" sent successfully`);
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send notification');
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    
    try {
      await notificationAPI.deleteNotification(id);
      toast.success('Notification deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // ── Form Helpers ───────────────────────────────────────────
  const resetForm = () => {
    setForm({
      title: '',
      body: '',
      type: 'announcement',
      audience: 'SCHOOL',
      priority: 'normal',
      scheduledFor: '',
      expiresAt: '',
      link: '',
      linkText: '',
      imageUrl: '',
      classId: '',
      teacherId: '',
      studentId: '',
    });
    setErrors({});
  };

  const openEditModal = (notification) => {
    setEditingNotification(notification);
    setForm({
      title: notification.title || '',
      body: notification.body || '',
      type: notification.type || 'announcement',
      audience: notification.audience || 'SCHOOL',
      priority: notification.priority || 'normal',
      scheduledFor: notification.scheduledFor?.split('T')[0] || '',
      expiresAt: notification.expiresAt?.split('T')[0] || '',
      link: notification.link || '',
      linkText: notification.linkText || '',
      imageUrl: notification.imageUrl || '',
      classId: notification.classId || '',
      teacherId: notification.teacherId || '',
      studentId: notification.studentId || '',
    });
    setShowCreateModal(true);
  };

  // ── Get Status Badge ───────────────────────────────────────
  const getStatusBadge = (notification) => {
    if (notification.sentAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle className="w-3 h-3" /> Sent
        </span>
      );
    }
    if (notification.scheduledFor && new Date(notification.scheduledFor) > new Date()) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" /> Scheduled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        <FileText className="w-3 h-3" /> Draft
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const option = PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium`}
        style={{ background: option.bg, color: option.color }}>
        {priority?.toUpperCase()}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    const option = TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0];
    const Icon = option.icon;
    return <Icon className="w-3.5 h-3.5" />;
  };

  const getAudienceInfo = (audience) => {
    const option = AUDIENCE_OPTIONS.find(a => a.value === audience) || AUDIENCE_OPTIONS[0];
    const Icon = option.icon;
    return { icon: <Icon className="w-3 h-3" />, label: option.label, color: option.color, bg: option.bg };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-slate-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Announcements & Notifications</h1>
                <p className="text-xs text-slate-500">Create and manage school-wide communications</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setEditingNotification(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                New Notification
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Filters */}
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              {TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
            </select>
            
            <select
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Audiences</option>
              <option value="SCHOOL">School</option>
              <option value="CLASS">Class</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
            </select>
            
            {(search || filterStatus !== 'all' || filterAudience !== 'all' || filterType !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterStatus('all');
                  setFilterAudience('all');
                  setFilterType('all');
                }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Notifications Grid */}
        {sortedNotifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border shadow-sm">
            <Megaphone className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No notifications found</h3>
            <p className="text-slate-400 mb-4">
              {search || filterStatus !== 'all' || filterAudience !== 'all' || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first notification to get started'}
            </p>
            {(search || filterStatus !== 'all' || filterAudience !== 'all' || filterType !== 'all') ? (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterStatus('all');
                  setFilterAudience('all');
                  setFilterType('all');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => {
                  resetForm();
                  setEditingNotification(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                Create Notification
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedNotifications.map((notification, idx) => {
              const audienceInfo = getAudienceInfo(notification.audience);
              const isSending = sendingId === notification.id;
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {getStatusBadge(notification)}
                          {getPriorityBadge(notification.priority)}
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                            style={{ background: audienceInfo.bg, color: audienceInfo.color }}>
                            {audienceInfo.icon}
                            <span>{audienceInfo.label}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {getTypeIcon(notification.type)}
                            <span className="capitalize">{notification.type}</span>
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{notification.title}</h3>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!notification.sentAt && (
                          <button
                            onClick={() => handleSend(notification.id, notification.title)}
                            disabled={isSending}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Send Now"
                          >
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        )}
                        {!notification.sentAt && (
                          <button
                            onClick={() => openEditModal(notification)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id, notification.title)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                      {notification.body}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created: {formatDate(notification.createdAt)}
                      </div>
                      {notification.scheduledFor && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Scheduled: {formatDate(notification.scheduledFor)}
                        </div>
                      )}
                      {notification.sentAt && (
                        <div className="flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          Sent: {formatDate(notification.sentAt)}
                        </div>
                      )}
                      {notification.expiresAt && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Expires: {formatDate(notification.expiresAt)}
                        </div>
                      )}
                    </div>
                    
                    {notification.link && (
                      <div className="mt-3">
                        <a
                          href={notification.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Link2 className="w-3 h-3" />
                          {notification.linkText || 'View Link'} →
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        
        {sortedNotifications.length > 0 && (
          <div className="mt-6 text-center text-xs text-slate-400">
            Showing {sortedNotifications.length} of {notifications.length} notifications
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowCreateModal(false);
              setEditingNotification(null);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    {editingNotification ? <Edit2 className="w-4 h-4 text-purple-600" /> : <Megaphone className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      {editingNotification ? 'Edit Notification' : 'Create Notification'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {editingNotification ? 'Update your announcement' : 'Create a new school announcement'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingNotification(null);
                    resetForm();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={editingNotification ? handleUpdate : handleCreate} className="p-6">
                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Notification title"
                      required
                    />
                  </div>
                  
                  {/* Body - FIXED: changed from 'content' to 'body' */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Body <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      rows="5"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Write your notification body here..."
                      required
                    />
                  </div>
                  
                  {/* Type, Audience, Priority */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
                      <select
                        value={form.audience}
                        onChange={(e) => setForm({ ...form, audience: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="SCHOOL">School (Everyone)</option>
                        <option value="CLASS">Specific Class</option>
                        <option value="TEACHER">Specific Teacher</option>
                        <option value="STUDENT">Specific Student</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {PRIORITY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Conditional fields based on audience */}
                  {form.audience === 'CLASS' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Select Class</label>
                      <select
                        value={form.classId}
                        onChange={(e) => setForm({ ...form, classId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select a class...</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {form.audience === 'TEACHER' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Select Teacher</label>
                      <select
                        value={form.teacherId}
                        onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select a teacher...</option>
                        {teachers.map(t => {
                          const firstName = t.user?.firstName || t.firstName || '';
                          const lastName = t.user?.lastName || t.lastName || '';
                          return (
                            <option key={t.id} value={t.id}>{firstName} {lastName}</option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                  
                  {form.audience === 'STUDENT' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Select Student</label>
                      <select
                        value={form.studentId}
                        onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select a student...</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Scheduling */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Schedule For (Optional)</label>
                      <input
                        type="datetime-local"
                        value={form.scheduledFor}
                        onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-slate-400 mt-1">Leave empty to save as draft</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Expires At (Optional)</label>
                      <input
                        type="datetime-local"
                        value={form.expiresAt}
                        onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  {/* Link */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link URL (Optional)</label>
                    <input
                      type="url"
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  {/* Link Text */}
                  {form.link && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Link Text (Optional)</label>
                      <input
                        type="text"
                        value={form.linkText}
                        onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Learn more"
                      />
                    </div>
                  )}
                  
                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Optional)</label>
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingNotification(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingNotification ? 'Update' : 'Create'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementsAdmin;