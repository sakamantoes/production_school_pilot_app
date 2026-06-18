// pages/student/StudentClassSchedule.jsx
// ─── Student Class Schedule with API integration ──────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar, BookOpen, RefreshCw, Loader2,
  GraduationCap, Users, Clock, MapPin,
  ChevronDown, Filter, Search, Eye,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';

const StudentClassSchedule = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClasses = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await studentApi.getClasses();
      const data = res?.data?.data || res?.data || res;
      setClasses(Array.isArray(data) ? data : []);
      if (isRefresh) toast.success('Schedule refreshed');
    } catch (error) {
      toast.error('Failed to load class schedule');
      setClasses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const activeClasses = classes.filter(c => c.status === 'ACTIVE' || !c.status);
  const pastClasses = classes.filter(c => c.status === 'COMPLETED' || c.status === 'GRADUATED');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading schedule...</p>
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
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Class Schedule</h1>
              <p className="text-blue-200 text-sm">View your class enrollment history</p>
            </div>
          </div>
          <button
            onClick={() => fetchClasses(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Active Classes */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Current Classes
          </h2>
          {activeClasses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <GraduationCap className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No active classes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeClasses.map((cls, idx) => (
                <motion.div
                  key={cls.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-bold text-slate-800">
                        {cls.class?.name || 'Class'} {cls.arm?.name ? `- ${cls.arm.name}` : ''}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {cls.session?.name || 'Current Session'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {cls.status || 'Active'}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle className="w-2.5 h-2.5" /> Active
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Past Classes */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Past Classes
          </h2>
          {pastClasses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No past classes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastClasses.map((cls, idx) => (
                <motion.div
                  key={cls.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 opacity-80"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-bold text-slate-800">
                        {cls.class?.name || 'Class'} {cls.arm?.name ? `- ${cls.arm.name}` : ''}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {cls.session?.name || 'Previous Session'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {cls.status || 'Completed'}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                      <Clock className="w-2.5 h-2.5" /> {cls.status || 'Completed'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Showing {classes.length} class{classes.length !== 1 ? 'es' : ''} total
        </div>
      </div>
    </div>
  );
};

export default StudentClassSchedule;