// pages/student/StudentAttendance.jsx
// ─── Student Attendance with API integration ─────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar, CheckCircle, XCircle, Clock, RefreshCw,
  Loader2, TrendingUp, BarChart3, Activity,
  ChevronDown, Filter, Search, AlertCircle, User
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';

const ATTENDANCE_STATUS = {
  PRESENT: { label: 'Present', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
  ABSENT: { label: 'Absent', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  LATE: { label: 'Late', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchAttendance = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [attRes, sumRes] = await Promise.allSettled([
        studentApi.getAttendance(),
        studentApi.getAttendanceSummary(),
      ]);

      if (attRes.status === 'fulfilled') {
        const data = attRes.value?.data?.data || attRes.value?.data || attRes.value;
        setAttendance(Array.isArray(data) ? data : []);
      }
      if (sumRes.status === 'fulfilled') {
        const data = sumRes.value?.data?.data || sumRes.value?.data || sumRes.value;
        setSummary(data);
      }

      if (isRefresh) toast.success('Attendance refreshed');
    } catch (error) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const filteredAttendance = attendance.filter(record => {
    const matchesFilter = filter === 'all' || record.status === filter;
    const matchesSearch = search === '' || 
      (record.teacher?.user?.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
      (record.teacher?.user?.lastName || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusInfo = (status) => {
    return ATTENDANCE_STATUS[status] || ATTENDANCE_STATUS.PRESENT;
  };

  const stats = {
    total: summary?.total || 0,
    present: summary?.present || 0,
    absent: summary?.absent || 0,
    late: summary?.late || 0,
    rate: summary?.presentRate || 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Attendance</h1>
              <p className="text-blue-200 text-sm">Track your attendance records</p>
            </div>
          </div>
          <button
            onClick={() => fetchAttendance(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Attendance Rate</p>
            <p className="text-3xl font-bold text-slate-800">{stats.rate}%</p>
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.rate}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Present</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.present}</p>
            <p className="text-xs text-slate-400 mt-1">{stats.total > 0 ? Math.round((stats.present/stats.total)*100) : 0}% of total</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Absent</p>
            <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-xs text-slate-400 mt-1">{stats.total > 0 ? Math.round((stats.absent/stats.total)*100) : 0}% of total</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Late</p>
            <p className="text-3xl font-bold text-amber-600">{stats.late}</p>
            <p className="text-xs text-slate-400 mt-1">{stats.total > 0 ? Math.round((stats.late/stats.total)*100) : 0}% of total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Filter:</span>
            </div>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filter === 'all' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            {Object.entries(ATTENDANCE_STATUS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  filter === key ? `${val.bg} ${val.color}` : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {val.label}
              </button>
            ))}
          </div>
        </div>

        {/* Records */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-700">Attendance Records</h2>
            <span className="text-xs text-slate-400">{filteredAttendance.length} records</span>
          </div>

          {filteredAttendance.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">No attendance records found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAttendance.map((record, idx) => {
                const statusInfo = getStatusInfo(record.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <motion.div
                    key={record.id || idx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{formatDate(record.date)}</p>
                      <p className="text-xs text-slate-400">
                        {record.teacher?.user?.firstName || 'Teacher'} {record.teacher?.user?.lastName || ''}
                        {record.remarks && ` • ${record.remarks}`}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusInfo.bg}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                      <span className={`text-xs font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;