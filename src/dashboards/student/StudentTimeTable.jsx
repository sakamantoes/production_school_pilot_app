// pages/student/StudentTimetable.jsx
// ─── Student Timetable with API integration ──────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, BookOpen, User, RefreshCw,
  Loader2, ChevronLeft, ChevronRight, MapPin,
  GraduationCap, Users
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = ['1st', '2nd', '3rd', '4th', '5th', '6th'];
const TIME_SLOTS = [
  '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00',
  '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00'
];

const DAY_COLORS = {
  Monday: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  Tuesday: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  Wednesday: { bg: '#fefce8', border: '#fde68a', text: '#a16207' },
  Thursday: { bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce' },
  Friday: { bg: '#fff1f2', border: '#fecdd3', text: '#be123c' },
};

const StudentTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState('grid'); // grid or list

  const fetchTimetable = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await studentApi.getTimetable();
      const data = res?.data?.data || res?.data || res;
      setTimetable(Array.isArray(data) ? data : []);
      if (isRefresh) toast.success('Timetable refreshed');
    } catch (error) {
      toast.error('Failed to load timetable');
      setTimetable([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const getEntriesByDay = () => {
    const map = {};
    DAYS.forEach(d => { map[d] = {}; });
    timetable.forEach(entry => {
      const day = entry.day || entry.dayOfWeek;
      const dayName = typeof day === 'number' 
        ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day - 1]
        : day;
      if (dayName && map[dayName]) {
        const period = entry.period || '1st';
        map[dayName][period] = entry;
      }
    });
    return map;
  };

  const renderGrid = () => {
    const lookup = getEntriesByDay();
    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">
                Period
              </th>
              {DAYS.map(d => (
                <th key={d} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
                  style={{ color: DAY_COLORS[d]?.text || '#64748b' }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PERIODS.map((period, idx) => (
              <tr key={period} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 bg-slate-50/50 border-r border-slate-100">
                  <p className="text-xs font-bold text-slate-700">{period}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{TIME_SLOTS[idx]}</p>
                </td>
                {DAYS.map(day => {
                  const entry = lookup[day]?.[period];
                  const dc = DAY_COLORS[day] || DAY_COLORS.Monday;
                  return (
                    <td key={`${day}-${period}`} className="px-3 py-2 align-top border-r border-slate-100 last:border-r-0">
                      {entry ? (
                        <div className="rounded-xl p-2.5" style={{ background: dc.bg, border: `1px solid ${dc.border}` }}>
                          <p className="text-xs font-bold truncate" style={{ color: dc.text }}>
                            {entry.subject?.name || entry.subjectName || 'Subject'}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {entry.teacher?.user?.firstName || entry.teacherName || 'Teacher'}
                          </p>
                          {entry.room && (
                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />{entry.room}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                          <span className="text-[10px]">Free</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderList = () => {
    const sorted = [...timetable].sort((a, b) => {
      const dayA = DAYS.indexOf(a.day || a.dayOfWeek);
      const dayB = DAYS.indexOf(b.day || b.dayOfWeek);
      return dayA - dayB;
    });

    if (sorted.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No timetable entries</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {sorted.map((entry, idx) => {
          const dayName = entry.day || 
            (entry.dayOfWeek ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][entry.dayOfWeek - 1] : 'Monday');
          const dc = DAY_COLORS[dayName] || DAY_COLORS.Monday;
          return (
            <motion.div
              key={entry.id || idx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-2 h-12 rounded-full flex-shrink-0" style={{ background: dc.border }} />
              <div className="flex-1 grid grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="font-bold text-xs" style={{ color: dc.text }}>{dayName}</p>
                  <p className="text-[11px] text-slate-400">{entry.startTime || '—'} – {entry.endTime || '—'}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 truncate">
                    {entry.subject?.name || entry.subjectName || 'Subject'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 truncate flex items-center gap-1">
                    <User className="w-3 h-3 flex-shrink-0 text-slate-400" />
                    {entry.teacher?.user?.firstName || entry.teacherName || 'Teacher'}
                  </p>
                </div>
                <div>
                  {entry.room
                    ? <p className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />{entry.room}</p>
                    : <span className="text-slate-300">—</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading timetable...</p>
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
              <h1 className="text-2xl font-bold text-white">My Timetable</h1>
              <p className="text-blue-200 text-sm">Weekly class schedule</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-white/10 rounded-xl">
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  view === 'grid' ? 'bg-white text-blue-600' : 'text-white/70 hover:text-white'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  view === 'list' ? 'bg-white text-blue-600' : 'text-white/70 hover:text-white'
                }`}
              >
                List
              </button>
            </div>
            <button
              onClick={() => fetchTimetable(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {timetable.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No timetable available</h3>
            <p className="text-slate-400 text-sm">Your timetable will appear here once assigned.</p>
          </div>
        ) : view === 'grid' ? renderGrid() : renderList()}
      </div>
    </div>
  );
};

export default StudentTimetable;