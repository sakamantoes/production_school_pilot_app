// pages/teacher/TeacherDashboard.jsx
// ─── Professional Teacher Dashboard - Enhanced UI/UX ──────────────────────
// Features: Profile, Classes, Subjects, Announcements, Notifications
// Modern design with gradients, animations, and creative card layouts

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BookOpen, Users, GraduationCap, FileText, Calendar, Clock,
  MessageSquare, Sparkles, TrendingUp, Award, Target,
  ChevronRight, RefreshCw, Loader2, Mail, Eye, Star,
  Activity, BarChart3, PieChart, Zap, Shield, Compass,
  Coffee, Sun, Moon, Layers, Grid, Layout,
} from 'lucide-react';
import teacherApi from '../../services/teacherApi';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [res, res.data, res.data?.data, ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const c of candidates) { if (Array.isArray(c)) return c; }
  return [];
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// ─────────────────────────────────────────────────────────────
// STAT CARD COMPONENT - Enhanced
// ─────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, gradient, subtitle, trend, loading }) => {
  const gradients = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
  };
  
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200/80 group"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradients[gradient]} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[gradient]} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-600">{trend}%</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          {loading ? (
            <div className="h-9 w-24 bg-slate-100 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-slate-900">{value}</p>
          )}
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// CLASS CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const ClassCard = ({ item, index }) => {
  const colors = [
    { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
    { bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
    { bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    { bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
    { bg: 'from-rose-50 to-rose-100', border: 'border-rose-200', icon: 'text-rose-600', badge: 'bg-rose-100 text-rose-700' },
    { bg: 'from-cyan-50 to-cyan-100', border: 'border-cyan-200', icon: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-700' },
  ];
  const color = colors[index % colors.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`bg-gradient-to-br ${color.bg} rounded-xl border ${color.border} p-4 hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm`}>
              <GraduationCap className={`w-4 h-4 ${color.icon}`} />
            </div>
            <h4 className="font-bold text-slate-800">{item.class?.name}</h4>
          </div>
          {item.arm?.name && (
            <p className="text-sm text-slate-600 ml-10">{item.arm.name}</p>
          )}
        </div>
        <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${color.badge}`}>
          {item.subjects?.length || 0} Subjects
        </div>
      </div>
      
      {item.subjects && item.subjects.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {item.subjects.slice(0, 4).map(sub => (
              <span
                key={sub.id}
                className="px-2.5 py-1 bg-white/80 backdrop-blur-sm rounded-lg text-xs font-medium text-slate-700 shadow-sm"
              >
                {sub.name}
              </span>
            ))}
            {item.subjects.length > 4 && (
              <span className="px-2.5 py-1 bg-white/80 rounded-lg text-xs font-medium text-slate-500">
                +{item.subjects.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// ANNOUNCEMENT CARD
// ─────────────────────────────────────────────────────────────
const AnnouncementCard = ({ announcement, index }) => {
  const priorityColors = {
    urgent: 'bg-rose-100 text-rose-700 border-rose-200',
    high: 'bg-amber-100 text-amber-700 border-amber-200',
    normal: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
          <Megaphone className="w-4 h-4 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {announcement.priority && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColors[announcement.priority]}`}>
                {announcement.priority.toUpperCase()}
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(announcement.createdAt)}
            </span>
          </div>
          <h4 className="font-bold text-slate-800 mb-1">{announcement.title}</h4>
          <p className="text-sm text-slate-600 line-clamp-2">{announcement.body || announcement.content}</p>
          {announcement.link && (
            <a
              href={announcement.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Read more <ChevronRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// NOTIFICATION ITEM
// ─────────────────────────────────────────────────────────────
const NotificationItem = ({ notification, onMarkRead, index }) => {
  const [isRead, setIsRead] = useState(!!notification.readAt);
  
  const handleClick = async () => {
    if (!isRead) {
      await onMarkRead(notification.id);
      setIsRead(true);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ x: 4 }}
      onClick={handleClick}
      className={`group relative p-4 rounded-xl cursor-pointer transition-all ${
        isRead ? 'bg-white hover:bg-slate-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isRead ? 'bg-slate-100' : 'bg-blue-100'
        }`}>
          <MessageSquare className={`w-4 h-4 ${isRead ? 'text-slate-500' : 'text-blue-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-semibold ${isRead ? 'text-slate-700' : 'text-slate-900'}`}>
              {notification.title}
            </h4>
            {!isRead && (
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </div>
          <p className="text-sm text-slate-600">{notification.body}</p>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(notification.createdAt)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
const TeacherDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [assignedData, setAssignedData] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch all data
  const fetchAllData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [profileRes, classesRes, announcementsRes, notificationsRes, analyticsRes] = await Promise.allSettled([
        teacherApi.getProfile(),
        teacherApi.getAssignedClasses(),
        teacherApi.getAnnouncements(),
        teacherApi.getNotifications(),
        teacherApi.getTeachingAnalytics({ period: 'year' }),
      ]);

      setProfile(profileRes.status === 'fulfilled' ? profileRes.value?.data?.data || profileRes.value?.data || profileRes.value : null);
      setAssignedData(toArray(classesRes.status === 'fulfilled' ? classesRes.value : null, 'data'));
      setAnnouncements(toArray(announcementsRes.status === 'fulfilled' ? announcementsRes.value : null, 'announcements', 'data'));
      setNotifications(toArray(notificationsRes.status === 'fulfilled' ? notificationsRes.value : null, 'notifications', 'data'));
      setAnalytics(analyticsRes.status === 'fulfilled' ? analyticsRes.value?.data?.data || analyticsRes.value?.data || analyticsRes.value : null);

      if (isRefresh) toast.success('Dashboard refreshed');
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle notification read
  const handleMarkNotificationRead = async (id) => {
    try {
      await teacherApi.markNotificationRead(id);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      ));
      toast.success('Marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Calculate stats
  const totalClasses = assignedData.length;
  const totalSubjects = assignedData.reduce((sum, item) => sum + (item.subjects?.length || 0), 0);
  const unreadCount = notifications.filter(n => !n.readAt).length;
  const stats = analytics?.stats || {};
  
  const greeting = getGreeting();
  const teacher = profile?.user || profile;
  const firstName = teacher?.firstName || 'Teacher';
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}/${currentYear + 1}`;

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-white rounded-2xl shadow-sm" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-white rounded-2xl" />
              <div className="h-96 bg-white rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-purple-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-400/5 to-amber-400/5 rounded-full blur-3xl" />
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Greeting Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">{greeting}</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{firstName}</span>
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>AY {academicYear}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchAllData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/20 transition-all border border-white/20"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing...' : 'Sync Data'}
              </motion.button>
              
              {/* Notifications Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all border border-white/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Messages</span>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                      {unreadCount}
                    </div>
                  )}
                </motion.button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                    >
                      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <h3 className="font-bold">Recent Messages</h3>
                        <p className="text-xs text-blue-100 mt-1">You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                        {notifications.slice(0, 5).map((notif, idx) => (
                          <NotificationItem
                            key={notif.id}
                            notification={notif}
                            onMarkRead={handleMarkNotificationRead}
                            index={idx}
                          />
                        ))}
                        {notifications.length === 0 && (
                          <div className="p-8 text-center">
                            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-400">No messages yet</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Stats Grid - 4 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="My Classes"
            value={totalClasses}
            icon={Users}
            gradient="blue"
            subtitle="Active assignments"
            trend="+12"
            loading={loading}
          />
          <StatCard
            title="Teaching Subjects"
            value={totalSubjects}
            icon={BookOpen}
            gradient="purple"
            subtitle="Across all classes"
            trend="+8"
            loading={loading}
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents || 0}
            icon={GraduationCap}
            gradient="emerald"
            subtitle="Enrolled this term"
            loading={loading}
          />
          <StatCard
            title="Results Processed"
            value={stats.resultsSubmitted || 0}
            icon={FileText}
            gradient="amber"
            subtitle={`${stats.approvedResults || 0} approved`}
            trend="+5"
            loading={loading}
          />
        </div>

        {/* Performance Overview Mini Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 border border-emerald-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-emerald-700">85%</span>
            </div>
            <p className="text-sm font-semibold text-emerald-800">Student Performance</p>
            <p className="text-xs text-emerald-600 mt-1">Above school average</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-blue-700">{stats.approvedResults || 0}</span>
            </div>
            <p className="text-sm font-semibold text-blue-800">Approved Results</p>
            <p className="text-xs text-blue-600 mt-1">Ready for publication</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-5 border border-amber-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-amber-700">98%</span>
            </div>
            <p className="text-sm font-semibold text-amber-800">Attendance Rate</p>
            <p className="text-xs text-amber-600 mt-1">This academic session</p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Classes & Subjects Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  My Teaching Schedule
                </h2>
                <p className="text-xs text-slate-500 mt-1">Classes and subjects assigned to you</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Grid className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              {assignedData.length > 0 ? (
                assignedData.map((item, idx) => (
                  <ClassCard key={item.class?.id || idx} item={item} index={idx} />
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400">No classes assigned yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Announcements Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-purple-600" />
                  School Announcements
                </h2>
                <p className="text-xs text-slate-500 mt-1">Important updates and notices</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Star className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              {announcements.length > 0 ? (
                announcements.slice(0, 5).map((ann, idx) => (
                  <AnnouncementCard key={ann.id} announcement={ann} index={idx} />
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <Coffee className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400">No announcements available</p>
                </div>
              )}
              {announcements.length > 5 && (
                <button className="w-full py-2 text-sm text-purple-600 hover:text-purple-700 font-medium">
                  View all announcements →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 mb-2">Teacher Quick Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-sm text-slate-600">Submit pending results before the deadline</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <p className="text-sm text-slate-600">Mark daily attendance for your classes</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <p className="text-sm text-slate-600">Review school announcements regularly</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">
            © {currentYear} Teacher Portal • Empowering Education
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;