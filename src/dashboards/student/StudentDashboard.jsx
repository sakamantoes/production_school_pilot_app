// pages/student/StudentDashboard.jsx
// ─── Student Dashboard with API integration ───────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Home, Calendar, BookOpen, CreditCard, Bell, User,
  TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, RefreshCw, GraduationCap, Award, FileText,
  ChevronRight, Eye, Users, MessageSquare, DollarSign,
  BarChart3, PieChart, Activity
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';

const toArray = (res, ...keys) => {
  if (!res) return [];
  const c = [res, res.data, res.data?.data, ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const v of c) { if (Array.isArray(v)) return v; }
  return [];
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const StatCard = ({ title, value, icon: Icon, color, bgColor, subtitle, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
    {loading ? (
      <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
    ) : (
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    )}
    <p className="text-xs text-slate-500 mt-1 font-medium">{title}</p>
    {subtitle && <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>}
  </motion.div>
);

const QuickAction = ({ title, icon: Icon, color, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all flex-1 min-w-[80px]"
  >
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{title}</span>
  </motion.button>
);

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [profileRes, attendanceRes, paymentRes, notifRes] = await Promise.allSettled([
        studentApi.getProfile(),
        studentApi.getAttendanceSummary(),
        studentApi.getPaymentSummary(),
        studentApi.getNotifications(),
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value?.data?.data || profileRes.value?.data || profileRes.value);
      }
      if (attendanceRes.status === 'fulfilled') {
        setAttendanceSummary(attendanceRes.value?.data?.data || attendanceRes.value?.data || attendanceRes.value);
      }
      if (paymentRes.status === 'fulfilled') {
        setPaymentSummary(paymentRes.value?.data?.data || paymentRes.value?.data || paymentRes.value);
      }
      if (notifRes.status === 'fulfilled') {
        const notifs = toArray(notifRes.value, 'notifications', 'data');
        setNotifications(notifs.slice(0, 3));
      }

      if (isRefresh) toast.success('Dashboard refreshed');
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getInitials = () => {
    if (!profile) return 'S';
    const user = profile.user || profile;
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName[0] || '') + (lastName[0] || '');
  };

  const attendanceRate = attendanceSummary?.presentRate || 0;
  const totalFees = paymentSummary?.fees?.reduce((sum, f) => sum + f.amount, 0) || 0;
  const totalPaid = paymentSummary?.fees?.reduce((sum, f) => sum + (f.amountPaid || 0), 0) || 0;
  const outstanding = totalFees - totalPaid;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold">
                {getInitials()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Welcome back!</h1>
                <p className="text-blue-200 text-sm">
                  {profile?.user?.firstName || profile?.firstName} {profile?.user?.lastName || profile?.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Attendance Rate"
            value={`${attendanceRate}%`}
            icon={CheckCircle}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            subtitle="Based on recorded attendance"
            loading={loading}
          />
          <StatCard
            title="Classes"
            value={profile?.enrollments?.length || 0}
            icon={GraduationCap}
            color="text-blue-600"
            bgColor="bg-blue-50"
            subtitle="Current enrollment"
            loading={loading}
          />
          <StatCard
            title="Outstanding Fees"
            value={formatCurrency(outstanding)}
            icon={DollarSign}
            color="text-amber-600"
            bgColor="bg-amber-50"
            subtitle={outstanding === 0 ? 'All paid ✓' : 'Pending payment'}
            loading={loading}
          />
          <StatCard
            title="Notifications"
            value={notifications.length}
            icon={Bell}
            color="text-purple-600"
            bgColor="bg-purple-50"
            subtitle="Unread messages"
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <QuickAction
            title="Timetable"
            icon={Calendar}
            color="bg-blue-500"
            onClick={() => window.location.href = '/student/timetable'}
          />
          <QuickAction
            title="Results"
            icon={Award}
            color="bg-emerald-500"
            onClick={() => window.location.href = '/student/results'}
          />
          <QuickAction
            title="Attendance"
            icon={Activity}
            color="bg-amber-500"
            onClick={() => window.location.href = '/student/attendance'}
          />
          <QuickAction
            title="Fees"
            icon={CreditCard}
            color="bg-purple-500"
            onClick={() => window.location.href = '/student/fees'}
          />
          <QuickAction
            title="Profile"
            icon={User}
            color="bg-indigo-500"
            onClick={() => window.location.href = '/student/profile'}
          />
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-400" />
              <h2 className="font-bold text-slate-700">Recent Notifications</h2>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={notif.id || idx} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                  <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{notif.body || notif.content}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} School Management System • Student Portal
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;