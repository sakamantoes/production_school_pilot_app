// pages/teacher/TeacherDashboard.jsx
// ─── Teacher Dashboard - Overview Only ─────────────────────────────────────
// Features: Profile, Classes, Subjects, Announcements, Notifications
// Creative UI/UX with gradient backgrounds, card animations, and modern design

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BookOpen, Users, GraduationCap, FileText,
  Megaphone, RefreshCw, Loader2, ChevronRight,
  Sparkles, TrendingUp, Calendar, Clock, Award,
  Target, CheckCircle, BarChart3, Star,
} from 'lucide-react';
import teacherApi from '../../services/TeacherApi';
import Loader from '../../components/Loader'

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

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// ─────────────────────────────────────────────────────────────
// STAT CARD COMPONENT - Enhanced
// ─────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, gradient, subtitle, trend, loading }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
    className="relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${gradient}`} />
    <div className="relative p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-600">{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-slate-800">{value}</p>
        )}
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
// QUICK ACTION CARD
// ─────────────────────────────────────────────────────────────
const QuickActionCard = ({ title, description, icon: Icon, gradient, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="group relative overflow-hidden rounded-xl bg-white p-4 text-left shadow-sm hover:shadow-md transition-all duration-300"
  >
    <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${gradient} mb-3`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <h4 className="font-semibold text-slate-800">{title}</h4>
    <p className="text-xs text-slate-400 mt-1">{description}</p>
  </motion.button>
);

// ─────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────
const TeacherDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [assignedData, setAssignedData] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all data
  const fetchAllData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [profileRes, classesRes, subjectsRes, announcementsRes, notificationsRes, analyticsRes, studentsRes] = await Promise.allSettled([
        teacherApi.getProfile(),
        teacherApi.getAssignedClasses(),
        teacherApi.getAssignedSubjects(),
        teacherApi.getAnnouncements(),
        teacherApi.getNotifications(),
        teacherApi.getTeachingAnalytics({ period: 'year' }),
        teacherApi.getStudents(),
      ]);

      setProfile(profileRes.status === 'fulfilled' ? profileRes.value?.data?.data || profileRes.value?.data || profileRes.value : null);
      setAssignedData(toArray(classesRes.status === 'fulfilled' ? classesRes.value : null, 'data'));
      setSubjectsList(toArray(subjectsRes.status === 'fulfilled' ? subjectsRes.value : null, 'data'));
      setAnnouncements(toArray(announcementsRes.status === 'fulfilled' ? announcementsRes.value : null, 'announcements', 'data'));
      setNotifications(toArray(notificationsRes.status === 'fulfilled' ? notificationsRes.value : null, 'notifications', 'data'));
      setAnalytics(analyticsRes.status === 'fulfilled' ? analyticsRes.value?.data?.data || analyticsRes.value?.data || analyticsRes.value : null);
      setStudents(toArray(studentsRes.status === 'fulfilled' ? studentsRes.value : null, 'students', 'data'));

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
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const totalClasses = assignedData.length;
  const totalSubjects = assignedData.reduce((sum, item) => sum + (item.subjects?.length || 0), 0);
  
  // ─── FIX: Calculate total students from the students list ───
  const totalStudents = students.length;
  
  const stats = analytics?.stats || {};
  const greeting = getGreeting();
  const teacher = profile?.user || profile;
  const fullName = teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}` : 'Teacher';
  const unreadCount = notifications.filter(n => !n.readAt).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-40 w-80 h-80 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 -right-40 w-80 h-80 rounded-full bg-white blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-blue-100 text-xs font-semibold tracking-wide">TEACHER PORTAL</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {greeting}, {fullName}!
              </h1>
              <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchAllData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </motion.button>
              
              {unreadCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-xs font-medium text-white">{unreadCount} unread</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Assigned Classes"
            value={totalClasses}
            icon={Users}
            gradient="from-blue-500 to-blue-600"
            subtitle={`${totalSubjects} total subjects`}
            loading={loading}
          />
          <StatCard
            title="Subjects Teaching"
            value={totalSubjects}
            icon={BookOpen}
            gradient="from-purple-500 to-purple-600"
            subtitle="Across all classes"
            loading={loading}
          />
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon={GraduationCap}
            gradient="from-emerald-500 to-emerald-600"
            trend={totalStudents > 0 ? "+12%" : undefined}
            loading={loading}
          />
          <StatCard
            title="Results Submitted"
            value={stats.resultsSubmitted || 0}
            icon={FileText}
            gradient="from-amber-500 to-amber-600"
            subtitle={`${stats.approvedResults || 0} approved`}
            loading={loading}
          />
        </div>

        {/* Welcome Card with Progress */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Teaching Performance</h3>
                  <p className="text-sm text-slate-500">Keep up the great work! You're making a difference.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">{stats.approvalRate || 0}%</p>
                  <p className="text-xs text-slate-500">Approval Rate</p>
                </div>
                <div className="w-px h-10 bg-indigo-200" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">{stats.completionRate || 0}%</p>
                  <p className="text-xs text-slate-500">Completion Rate</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Overall Progress</span>
                <span>{stats.overallProgress || 0}%</span>
              </div>
              <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats.overallProgress || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-yellow-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionCard
                title="Mark Attendance"
                description="Record today's attendance"
                icon={CheckCircle}
                gradient="from-green-500 to-emerald-600"
                onClick={() => window.location.href = '/teacher/attendance'}
              />
              <QuickActionCard
                title="Upload Results"
                description="Submit student grades"
                icon={FileText}
                gradient="from-blue-500 to-blue-600"
                onClick={() => window.location.href = '/teacher/results'}
              />
              <QuickActionCard
                title="View Timetable"
                description="Check your schedule"
                icon={Clock}
                gradient="from-purple-500 to-purple-600"
                onClick={() => window.location.href = '/teacher/timetable'}
              />
              <QuickActionCard
                title="Analytics"
                description="View performance metrics"
                icon={BarChart3}
                gradient="from-amber-500 to-orange-600"
                onClick={() => window.location.href = '/teacher/analytics'}
              />
            </div>
          </div>

          {/* Assigned Classes & Subjects */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Your Assignments</h3>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <div className="space-y-3">
                {assignedData.map((item, idx) => (
                  <motion.div
                    key={item.class?.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-50 to-white p-4 hover:shadow-md transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 transition-all duration-300" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {item.class?.name || 'Unknown Class'}
                          </p>
                          {item.arm?.name && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Section: {item.arm.name}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      {item.subjects && item.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.subjects.map(sub => (
                            <span
                              key={sub.id}
                              className="px-2.5 py-1 bg-white rounded-lg text-xs font-medium text-slate-600 border border-slate-200 shadow-sm"
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {assignedData.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400">No classes assigned yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Announcements Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">School Announcements</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.slice(0, 4).map((ann, idx) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white rounded-xl border border-slate-200/80 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {ann.body || ann.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(ann.createdAt)}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {announcements.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-slate-200">
                <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400">No announcements yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Section - Simplified */}
        {notifications.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Recent Updates</h3>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {notifications.slice(0, 5).map((notif, idx) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      notif.readAt ? 'hover:bg-slate-50' : 'bg-amber-50/30 hover:bg-amber-50'
                    }`}
                    onClick={() => !notif.readAt && handleMarkNotificationRead(notif.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${!notif.readAt ? 'bg-amber-500' : 'bg-transparent'}`} />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{notif.title}</p>
                        <p className="text-sm text-slate-600 mt-1">{notif.body}</p>
                        <p className="text-xs text-slate-400 mt-2">{formatDate(notif.createdAt)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;