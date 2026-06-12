// pages/school/AnnouncementsAdmin.jsx
// ─── Complete Announcement & Notification Management System ───────────────────
// Features: Create/Edit/Delete announcements, Send notifications,
// View notification history, Target audiences, Schedule posts

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Megaphone, Plus, Edit2, Trash2, X, Save, RefreshCw, Loader2,
  AlertCircle, Send, Eye, EyeOff, Calendar, Clock, Users,
  GraduationCap, Briefcase, UserCheck, Globe, Filter, Search,
  CheckCircle, XCircle, AlertTriangle, Bell, Mail, MessageCircle,
  ChevronDown, ChevronUp, MoreVertical, Play, Pause, History,
  Target, Tag, FileText, Image, Link2, AtSign, Sparkles,
  TrendingUp, Award, Zap, Shield, Star, Rocket, Heart,
} from 'lucide-react';
import { notificationAPI, classAPI, teacherAPI, studentAPI } from '../../services/schoolApi';

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

const formatDate = (dateString) => {
  if (!dateString) return null;
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatFullDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const AUDIENCE_OPTIONS = [
  { value: 'SCHOOL', label: 'Everyone', icon: Globe, color: '#8b5cf6', bg: '#f3e8ff', description: 'All users in the school' },
  { value: 'STUDENT', label: 'Students Only', icon: GraduationCap, color: '#3b82f6', bg: '#eff6ff', description: 'All enrolled students' },
  { value: 'TEACHER', label: 'Teachers Only', icon: Briefcase, color: '#10b981', bg: '#f0fdf4', description: 'All teaching staff' },
  { value: 'CLASS', label: 'Specific Class', icon: Users, color: '#f59e0b', bg: '#fffbeb', description: 'Students in a specific class' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', icon: Heart, color: '#94a3b8', bg: '#f1f5f9', badge: 'info' },
  { value: 'normal', label: 'Normal', icon: Star, color: '#3b82f6', bg: '#eff6ff', badge: 'info' },
  { value: 'high', label: 'High', icon: Zap, color: '#f59e0b', bg: '#fffbeb', badge: 'warning' },
  { value: 'urgent', label: 'Urgent', icon: AlertCircle, color: '#ef4444', bg: '#fef2f2', badge: 'error' },
];

const TYPE_OPTIONS = [
  { value: 'announcement', label: 'Announcement', icon: Megaphone, color: '#8b5cf6', gradient: 'from-purple-500 to-purple-600' },
  { value: 'reminder', label: 'Reminder', icon: Bell, color: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
  { value: 'alert', label: 'Alert', icon: AlertTriangle, color: '#ef4444', gradient: 'from-red-500 to-red-600' },
  { value: 'message', label: 'Message', icon: MessageCircle, color: '#10b981', gradient: 'from-emerald-500 to-emerald-600' },
];

// ─────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, trend, onClick }) => (
  <motion.div
    whileHover={{ y: -2, transition: { duration: 0.2 } }}
    onClick={onClick}
    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 cursor-pointer hover:shadow-md transition-all"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`p-3 rounded-xl ${color.bg}`}>
        <Icon className={`w-5 h-5 ${color.text}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend.bg}`}>
          {trend.icon}
          <span className={trend.color}>{trend.value}</span>
        </div>
      )}
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </motion.div>
);

const PriorityBadge = ({ priority }) => {
  const option = PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1];
  const Icon = option.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium`}
      style={{ background: option.bg, color: option.color }}>
      <Icon className="w-3 h-3" />
      {option.label}
    </span>
  );
};

const AudienceBadge = ({ audience }) => {
  const option = AUDIENCE_OPTIONS.find(a => a.value === audience) || AUDIENCE_OPTIONS[0];
  const Icon = option.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium`}
      style={{ background: option.bg, color: option.color }}>
      <Icon className="w-3 h-3" />
      {option.label}
    </span>
  );
};

const StatusBadge = ({ notification }) => {
  if (notification.sentAt) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle className="w-3 h-3" />
        Sent
      </span>
    );
  }
  if (notification.scheduledFor && new Date(notification.scheduledFor) > new Date()) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3" />
        Scheduled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
      <FileText className="w-3 h-3" />
      Draft
    </span>
  );
};

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
  const [showStats, setShowStats] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
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
  
  const [submitting, setSubmitting] = useState(false);

  // Statistics
  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.sentAt).length,
    scheduled: notifications.filter(n => n.scheduledFor && !n.sentAt).length,
    drafts: notifications.filter(n => !n.sentAt && !n.scheduledFor).length,
    urgent: notifications.filter(n => n.priority === 'urgent').length,
  };

  // ── Fetch Data ─────────────────────────────────────────────
  const fetchData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [notifRes, classRes, teacherRes, studentRes] = await Promise.allSettled([
        notificationAPI.getNotificationHistory(),
        classAPI.getClasses(),
        teacherAPI.getTeachers(),
        studentAPI.getStudents(),
      ]);
      
      setNotifications(toArray(notifRes.status === 'fulfilled' ? notifRes.value : null, 'notifications', 'data'));
      setClasses(toArray(classRes.status === 'fulfilled' ? classRes.value : null, 'classes'));
      setTeachers(toArray(teacherRes.status === 'fulfilled' ? teacherRes.value : null, 'teachers', 'items'));
      
      // Handle student data - extract from response correctly
      let studentData = [];
      if (studentRes.status === 'fulfilled' && studentRes.value) {
        const studentResponse = studentRes.value;
        studentData = studentResponse.data?.data || studentResponse.data || studentResponse;
        if (!Array.isArray(studentData) && studentData?.data) {
          studentData = studentData.data;
        }
      }
      setStudents(Array.isArray(studentData) ? studentData : []);
      
      if (isRefresh) toast.success('Notifications refreshed');
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load notifications');
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

  // ── CRUD Operations ────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) {
      toast.error('Title and body are required');
      return;
    }
    
    // Validate student ID when audience is STUDENT
    if (form.audience === 'STUDENT' && !form.studentId) {
      toast.error('Please select a student');
      return;
    }
    
    // Validate teacher ID when audience is TEACHER
    if (form.audience === 'TEACHER' && !form.teacherId) {
      toast.error('Please select a teacher');
      return;
    }
    
    // Validate class ID when audience is CLASS
    if (form.audience === 'CLASS' && !form.classId) {
      toast.error('Please select a class');
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
      
      // Add conditional fields based on audience - using correct field names
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
      const errorMsg = error?.response?.data?.message || 
                       error?.response?.data?.errors?.[0]?.message || 
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
    
    // Validate conditional fields
    if (form.audience === 'STUDENT' && !form.studentId) {
      toast.error('Please select a student');
      return;
    }
    if (form.audience === 'TEACHER' && !form.teacherId) {
      toast.error('Please select a teacher');
      return;
    }
    if (form.audience === 'CLASS' && !form.classId) {
      toast.error('Please select a class');
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
      const errorMsg = error?.response?.data?.message || 
                       error?.response?.data?.errors?.[0]?.message || 
                       'Failed to update notification';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (id, title) => {
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

  // ── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/20">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 rounded-full animate-pulse" />
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-slate-500 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/10">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-2xl blur-xl opacity-30" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Announcements</h1>
                <p className="text-sm text-slate-500 mt-0.5">Manage school-wide communications and notifications</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  showStats ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Analytics</span>
              </button>
              
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => {
                  resetForm();
                  setEditingNotification(null);
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Create</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* Stats Cards */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard
                  title="Total"
                  value={stats.total}
                  icon={Megaphone}
                  color={{ bg: 'bg-purple-100', text: 'text-purple-600' }}
                />
                <StatCard
                  title="Sent"
                  value={stats.sent}
                  icon={Send}
                  color={{ bg: 'bg-emerald-100', text: 'text-emerald-600' }}
                />
                <StatCard
                  title="Scheduled"
                  value={stats.scheduled}
                  icon={Clock}
                  color={{ bg: 'bg-amber-100', text: 'text-amber-600' }}
                />
                <StatCard
                  title="Drafts"
                  value={stats.drafts}
                  icon={FileText}
                  color={{ bg: 'bg-slate-100', text: 'text-slate-600' }}
                />
                <StatCard
                  title="Urgent"
                  value={stats.urgent}
                  icon={AlertCircle}
                  color={{ bg: 'bg-red-100', text: 'text-red-600' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search announcements..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Types</option>
              {TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
            </select>
            
            <select
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Audiences</option>
              {AUDIENCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
            {(search || filterStatus !== 'all' || filterAudience !== 'all' || filterType !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterStatus('all');
                  setFilterAudience('all');
                  setFilterType('all');
                }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        {filteredNotifications.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filteredNotifications.length}</span> of{' '}
              <span className="font-semibold text-slate-700">{notifications.length}</span> notifications
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Sparkles className="w-3 h-3" />
              <span>Sorted by latest</span>
            </div>
          </div>
        )}

        {/* Notifications Grid */}
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full blur-2xl opacity-20" />
              <Megaphone className="w-20 h-20 text-slate-300 mx-auto relative" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mt-6 mb-2">No notifications found</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              {search || filterStatus !== 'all' || filterAudience !== 'all' || filterType !== 'all'
                ? 'Try adjusting your filters to see more results'
                : 'Get started by creating your first announcement'}
            </p>
            {(search || filterStatus !== 'all' || filterAudience !== 'all' || filterType !== 'all') ? (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterStatus('all');
                  setFilterAudience('all');
                  setFilterType('all');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
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
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                Create First Announcement
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification, idx) => {
              const typeOption = TYPE_OPTIONS.find(t => t.value === notification.type) || TYPE_OPTIONS[0];
              const TypeIcon = typeOption.icon;
              const isExpanded = expandedId === notification.id;
              const isSending = sendingId === notification.id;
              
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Type Icon */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeOption.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                        <TypeIcon className="w-6 h-6 text-white" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <StatusBadge notification={notification} />
                          <PriorityBadge priority={notification.priority} />
                          <AudienceBadge audience={notification.audience} />
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-800 mb-2">{notification.title}</h3>
                        
                        <p className={`text-slate-600 text-sm ${!isExpanded ? 'line-clamp-2' : ''}`}>
                          {notification.body}
                        </p>
                        
                        {notification.link && isExpanded && (
                          <a
                            href={notification.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 text-sm text-purple-600 hover:underline"
                          >
                            <Link2 className="w-3 h-3" />
                            {notification.linkText || 'View Link'} →
                          </a>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Created {formatDate(notification.createdAt)}
                          </div>
                          {notification.scheduledFor && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Scheduled for {formatFullDate(notification.scheduledFor)}
                            </div>
                          )}
                          {notification.sentAt && (
                            <div className="flex items-center gap-1">
                              <Send className="w-3 h-3" />
                              Sent {formatDate(notification.sentAt)}
                            </div>
                          )}
                          {notification.expiresAt && (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Expires {formatDate(notification.expiresAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {!notification.sentAt && (
                          <button
                            onClick={() => handleSend(notification.id, notification.title)}
                            disabled={isSending}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors disabled:opacity-50"
                            title="Send Now"
                          >
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        )}
                        {!notification.sentAt && (
                          <button
                            onClick={() => openEditModal(notification)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id, notification.title)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : notification.id)}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    {editingNotification ? (
                      <Edit2 className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Megaphone className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {editingNotification ? 'Edit Announcement' : 'Create Announcement'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {editingNotification ? 'Update your announcement details' : 'Create a new school announcement'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingNotification(null);
                    resetForm();
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={editingNotification ? handleUpdate : handleCreate} className="p-6">
                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., School Holiday Announcement"
                      required
                    />
                  </div>
                  
                  {/* Body */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      rows="6"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Write your announcement message here..."
                      required
                    />
                  </div>
                  
                  {/* Type, Audience, Priority */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        {TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Audience</label>
                      <select
                        value={form.audience}
                        onChange={(e) => {
                          // Reset conditional fields when audience changes
                          setForm({ 
                            ...form, 
                            audience: e.target.value,
                            classId: '',
                            teacherId: '',
                            studentId: ''
                          });
                        }}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        {AUDIENCE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        {PRIORITY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Conditional Fields */}
                  {form.audience === 'CLASS' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Select Class <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.classId}
                        onChange={(e) => setForm({ ...form, classId: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
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
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Select Teacher <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.teacherId}
                        onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
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
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Select Student <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.studentId}
                        onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="">Select a student...</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.user?.firstName || s.firstName} {s.user?.lastName || s.lastName} - {s.studentId}
                          </option>
                        ))}
                      </select>
                      {students.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">No students found. Please check student data.</p>
                      )}
                    </div>
                  )}
                  
                  {/* Scheduling */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Schedule For
                      </label>
                      <input
                        type="datetime-local"
                        value={form.scheduledFor}
                        onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-slate-400 mt-1">Leave empty to save as draft</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Expires At
                      </label>
                      <input
                        type="datetime-local"
                        value={form.expiresAt}
                        onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  
                  {/* Link */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Link URL</label>
                    <input
                      type="url"
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  {/* Link Text */}
                  {form.link && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Link Text</label>
                      <input
                        type="text"
                        value={form.linkText}
                        onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Learn more"
                      />
                    </div>
                  )}
                  
                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Image URL</label>
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingNotification(null);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-md"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingNotification ? 'Update' : 'Create'} Announcement
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