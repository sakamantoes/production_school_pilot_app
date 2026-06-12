// pages/teacher/TeacherDashboard.jsx
// ─── Teacher Dashboard - Overview Only ─────────────────────────────────────
// Features: Profile, Classes, Subjects, Announcements, Notifications
// FIXED: Properly handles nested class/arm/subjects structure

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BookOpen, Users, GraduationCap, FileText,
  Bell, Megaphone, RefreshCw, Loader2, ChevronRight,
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─────────────────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, accent, subtitle, loading }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{title}</p>
      {loading ? (
        <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      )}
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
const TeacherDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [assignedData, setAssignedData] = useState([]); // Array of {class, arm, subjects}
  const [subjectsList, setSubjectsList] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all data
  const fetchAllData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [profileRes, classesRes, subjectsRes, announcementsRes, notificationsRes, analyticsRes] = await Promise.allSettled([
        teacherApi.getProfile(),
        teacherApi.getAssignedClasses(),
        teacherApi.getAssignedSubjects(),
        teacherApi.getAnnouncements(),
        teacherApi.getNotifications(),
        teacherApi.getTeachingAnalytics({ period: 'year' }),
      ]);

      // Handle profile
      setProfile(profileRes.status === 'fulfilled' ? profileRes.value?.data?.data || profileRes.value?.data || profileRes.value : null);
      
      // Handle assigned classes - response has {class, arm, subjects} structure
      const classesData = toArray(classesRes.status === 'fulfilled' ? classesRes.value : null, 'data');
      setAssignedData(classesData);
      
      // Handle assigned subjects
      const subjectsData = toArray(subjectsRes.status === 'fulfilled' ? subjectsRes.value : null, 'data');
      setSubjectsList(subjectsData);
      
      // Handle announcements and notifications
      setAnnouncements(toArray(announcementsRes.status === 'fulfilled' ? announcementsRes.value : null, 'announcements', 'data'));
      
      const notificationsData = toArray(notificationsRes.status === 'fulfilled' ? notificationsRes.value : null, 'notifications', 'data');
      setNotifications(notificationsData);
      
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
      toast.error('Failed to mark notification as read');
    }
  };

  // Calculate stats
  const totalClasses = assignedData.length;
  const totalSubjects = assignedData.reduce((sum, item) => sum + (item.subjects?.length || 0), 0);
  const stats = analytics?.stats || {};

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const teacher = profile?.user || profile;
  const fullName = teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}` : 'Teacher';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Teacher Dashboard</h1>
                <p className="text-xs text-slate-500">Welcome back, {fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchAllData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                <Bell className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  {notifications.filter(n => !n.readAt).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Assigned Classes"
            value={totalClasses}
            icon={Users}
            accent="#3b82f6"
            loading={loading}
          />
          <StatCard
            title="Subjects"
            value={totalSubjects}
            icon={BookOpen}
            accent="#8b5cf6"
            loading={loading}
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents || 0}
            icon={GraduationCap}
            accent="#10b981"
            subtitle="Across all classes"
            loading={loading}
          />
          <StatCard
            title="Results Submitted"
            value={stats.resultsSubmitted || 0}
            icon={FileText}
            accent="#f59e0b"
            subtitle={`${stats.approvedResults || 0} approved`}
            loading={loading}
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Classes & Subjects */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Your Classes & Subjects
            </h3>
            <div className="space-y-3">
              {assignedData.map((item, idx) => (
                <motion.div
                  key={item.class?.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.class?.name || 'Unknown Class'}
                        {item.arm?.name && (
                          <span className="text-sm font-normal text-slate-500 ml-2">
                            ({item.arm.name})
                          </span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                  {item.subjects && item.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.subjects.map(sub => (
                        <span
                          key={sub.id}
                          className="px-2 py-1 bg-white rounded-lg text-xs text-slate-600 border shadow-sm"
                        >
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              {assignedData.length === 0 && (
                <p className="text-center text-slate-400 py-8">No classes assigned</p>
              )}
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-purple-500" />
              Recent Announcements
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {announcements.slice(0, 5).map((ann, idx) => (
                <motion.div
                  key={ann.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 bg-slate-50 rounded-xl"
                >
                  <p className="font-semibold text-slate-800">{ann.title}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.body || ann.content}</p>
                  <p className="text-xs text-slate-400 mt-2">{formatDate(ann.createdAt)}</p>
                </motion.div>
              ))}
              {announcements.length === 0 && (
                <p className="text-center text-slate-400 py-8">No announcements yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            Notifications
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.slice(0, 10).map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${
                    notif.readAt ? 'bg-white hover:bg-slate-50' : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                  onClick={() => !notif.readAt && handleMarkNotificationRead(notif.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{notif.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{notif.body}</p>
                      <p className="text-xs text-slate-400 mt-2">{formatDate(notif.createdAt)}</p>
                    </div>
                    {!notif.readAt && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400">No notifications</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;