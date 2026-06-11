// pages/school/AttendanceReport.jsx
// ─── Complete Attendance Report System ───────────────────────────
// Features: View attendance by class, date range, student
// Statistics, charts, export functionality

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle,
  Download, RefreshCw, Loader2, Filter, Search, ChevronDown,
  Eye, FileText, PieChart, BarChart3, TrendingUp, TrendingDown,
  UserCheck, UserX, Activity, Printer, Calendar as CalendarIcon,
  ArrowUpRight, ArrowDownRight, GraduationCap, BookOpen,
} from 'lucide-react';
import { reportsAPI, classAPI, studentAPI } from '../../services/schoolApi';

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

const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// ─────────────────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const StatCard = ({ title, value, change, icon: Icon, accent, subtitle }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center`}
        style={{ background: `${accent}15` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
          change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
    <p className="text-xs text-slate-500 mt-1">{title}</p>
    {subtitle && <p className="text-[10px] text-slate-400 mt-1">{subtitle}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────────
// ATTENDANCE ROW COMPONENT
// ─────────────────────────────────────────────────────────────
const AttendanceRow = ({ student, attendance, onToggle }) => {
  const status = attendance?.status || 'present';
  const statusColors = {
    present: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    absent: 'bg-rose-100 text-rose-700 border-rose-200',
    late: 'bg-amber-100 text-amber-700 border-amber-200',
    excused: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  
  return (
    <div className="flex items-center justify-between p-3 bg-white border-b last:border-0 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
          <span className="text-sm font-semibold text-slate-600">
            {student.firstName?.[0]}{student.lastName?.[0]}
          </span>
        </div>
        <div>
          <p className="font-medium text-slate-800">{student.firstName} {student.lastName}</p>
          <p className="text-xs text-slate-400">ID: {student.studentId || '—'}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => onToggle(student.id, e.target.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${statusColors[status]}`}
        >
          <option value="present">✓ Present</option>
          <option value="absent">✗ Absent</option>
          <option value="late">⏰ Late</option>
          <option value="excused">📝 Excused</option>
        </select>
        
        {attendance?.timeIn && (
          <span className="text-[10px] text-slate-400">{formatTime(attendance.timeIn)}</span>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN ATTENDANCE REPORT COMPONENT
// ─────────────────────────────────────────────────────────────
const AttendanceReport = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0,
  });
  
  // View mode
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
  const [summary, setSummary] = useState(null);
  
  // ── Fetch Data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, studentRes] = await Promise.allSettled([
        classAPI.getClasses(),
        studentAPI.getStudents({ limit: 5000 }),
      ]);
      
      setClasses(toArray(classRes.status === 'fulfilled' ? classRes.value : null, 'classes'));
      setStudents(toArray(studentRes.status === 'fulfilled' ? studentRes.value : null, 'students', 'items'));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // ── Fetch Attendance ───────────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const params = {
        classId: selectedClass,
        date: selectedDate,
      };
      
      const res = await reportsAPI.getAttendance(params);
      const data = res?.data?.data || res?.data || res;
      
      // Format attendance data
      const attendanceMap = {};
      if (Array.isArray(data)) {
        data.forEach(record => {
          attendanceMap[record.studentId] = record;
        });
      } else if (data?.records) {
        data.records.forEach(record => {
          attendanceMap[record.studentId] = record;
        });
      }
      
      setAttendanceData(attendanceMap);
      
      // Calculate stats
      const classStudents = students.filter(s => s.classId === parseInt(selectedClass));
      const total = classStudents.length;
      let present = 0, absent = 0, late = 0, excused = 0;
      
      classStudents.forEach(student => {
        const status = attendanceMap[student.id]?.status || 'absent';
        switch(status) {
          case 'present': present++; break;
          case 'late': late++; break;
          case 'excused': excused++; break;
          default: absent++;
        }
      });
      
      setStats({ present, absent, late, excused, total });
    } catch (error) {
      toast.error('Failed to load attendance');
      setAttendanceData({});
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate, students]);
  
  useEffect(() => {
    if (selectedClass) {
      fetchAttendance();
    }
  }, [selectedClass, selectedDate, fetchAttendance]);
  
  // ── Fetch Summary (Weekly/Monthly) ─────────────────────────
  const fetchSummary = useCallback(async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const params = {
        classId: selectedClass,
        period: viewMode,
      };
      
      const res = await reportsAPI.getAttendance(params);
      const data = res?.data?.data || res?.data || res;
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, viewMode]);
  
  useEffect(() => {
    if (selectedClass && viewMode !== 'daily') {
      fetchSummary();
    }
  }, [selectedClass, viewMode, fetchSummary]);
  
  // ── Handle Status Change ───────────────────────────────────
  const handleStatusChange = async (studentId, status) => {
    setSubmitting(true);
    try {
      // Optimistic update
      setAttendanceData(prev => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          status,
          timeIn: status === 'present' || status === 'late' ? new Date().toISOString() : null,
        }
      }));
      
      // Update stats
      const oldStatus = attendanceData[studentId]?.status || 'absent';
      setStats(prev => {
        const newStats = { ...prev };
        // Decrement old
        if (oldStatus === 'present') newStats.present--;
        else if (oldStatus === 'absent') newStats.absent--;
        else if (oldStatus === 'late') newStats.late--;
        else if (oldStatus === 'excused') newStats.excused--;
        // Increment new
        if (status === 'present') newStats.present++;
        else if (status === 'absent') newStats.absent++;
        else if (status === 'late') newStats.late++;
        else if (status === 'excused') newStats.excused++;
        return newStats;
      });
      
      // Here you would call API to save attendance
      // await reportsAPI.saveAttendance({ studentId, date: selectedDate, status });
      toast.success(`Attendance updated`);
    } catch (error) {
      toast.error('Failed to update attendance');
      fetchAttendance(); // Rollback
    } finally {
      setSubmitting(false);
    }
  };
  
  // ── Export CSV ─────────────────────────────────────────────
  const handleExport = () => {
    const filteredStudents = getFilteredStudents();
    const headers = ['Student Name', 'Student ID', 'Status', 'Time In'];
    const rows = filteredStudents.map(student => [
      `${student.firstName} ${student.lastName}`,
      student.studentId || '—',
      attendanceData[student.id]?.status || 'absent',
      attendanceData[student.id]?.timeIn ? formatTime(attendanceData[student.id].timeIn) : '—',
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedClass}_${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Attendance exported');
  };
  
  // ── Filter Students ────────────────────────────────────────
  const getFilteredStudents = () => {
    let classStudents = students.filter(s => s.classId === parseInt(selectedClass));
    
    if (selectedStatus !== 'all') {
      classStudents = classStudents.filter(s => 
        (attendanceData[s.id]?.status || 'absent') === selectedStatus
      );
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      classStudents = classStudents.filter(s => 
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
        s.studentId?.toLowerCase().includes(term)
      );
    }
    
    return classStudents;
  };
  
  // ── Render Daily View ──────────────────────────────────────
  const renderDailyView = () => {
    const filteredStudents = getFilteredStudents();
    const attendanceRate = stats.total > 0 ? ((stats.present + stats.late) / stats.total * 100).toFixed(1) : 0;
    
    return (
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            title="Present"
            value={stats.present}
            icon={CheckCircle}
            accent="#10b981"
            subtitle={`${stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%`}
          />
          <StatCard
            title="Absent"
            value={stats.absent}
            icon={XCircle}
            accent="#ef4444"
          />
          <StatCard
            title="Late"
            value={stats.late}
            icon={Clock}
            accent="#f59e0b"
          />
          <StatCard
            title="Excused"
            value={stats.excused}
            icon={FileText}
            accent="#3b82f6"
          />
          <StatCard
            title="Attendance Rate"
            value={`${attendanceRate}%`}
            icon={TrendingUp}
            accent="#8b5cf6"
          />
        </div>
        
        {/* Attendance List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">
                Students ({filteredStudents.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                {formatDate(selectedDate)}
              </span>
            </div>
          </div>
          
          <div className="divide-y">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No students found</p>
              </div>
            ) : (
              filteredStudents.map(student => (
                <AttendanceRow
                  key={student.id}
                  student={student}
                  attendance={attendanceData[student.id]}
                  onToggle={handleStatusChange}
                />
              ))
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // ── Render Summary View ────────────────────────────────────
  const renderSummaryView = () => {
    if (!summary) return null;
    
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">
            {viewMode === 'weekly' ? 'Weekly Summary' : 'Monthly Summary'}
          </h3>
          <BarChart3 className="w-5 h-5 text-slate-400" />
        </div>
        
        <div className="space-y-3">
          {(summary.data || []).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400">{item.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">
                  {item.present}/{item.total}
                </p>
                <p className="text-xs text-emerald-600">
                  {((item.present / item.total) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // ── Loading State ──────────────────────────────────────────
  if (loading && !selectedClass) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500">Loading attendance data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Attendance Report</h1>
                <p className="text-xs text-slate-500">Track and manage student attendance</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAttendance()}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={handleExport}
                disabled={!selectedClass}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">View Mode</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily View</option>
                <option value="weekly">Weekly Summary</option>
                <option value="monthly">Monthly Summary</option>
              </select>
            </div>
            
            {viewMode === 'daily' && selectedClass && (
              <>
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Status Filter</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Students</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
                
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search student..."
                      className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Content */}
        {!selectedClass ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No Class Selected</h3>
            <p className="text-slate-400">Select a class to view attendance records</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : viewMode === 'daily' ? (
          renderDailyView()
        ) : (
          renderSummaryView()
        )}
        
        {/* Footer Stats */}
        {selectedClass && viewMode === 'daily' && stats.total > 0 && (
          <div className="mt-6 p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Present: {stats.present}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span>Absent: {stats.absent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Late: {stats.late}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Excused: {stats.excused}</span>
                </div>
              </div>
              <div className="text-slate-500">
                Total: {stats.total} students
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReport;