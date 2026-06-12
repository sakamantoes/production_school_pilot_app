import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Calendar, Users, CheckCircle, XCircle, Clock, FileText, 
  Download, RefreshCw, Loader2, Search, Filter, ChevronDown,
  UserCheck, UserX, UserMinus, UserPlus, TrendingUp, Award,
  BarChart3, PieChart, Eye, Printer, Grid3x3, List,
  AlertCircle, Check, X, Activity
} from 'lucide-react';
import { reportsAPI, classAPI, studentAPI } from '../../services/schoolApi';

// ───────────────────────────────
// HELPERS
// ───────────────────────────────
const extractData = (res) => res?.data?.data || res?.data || res;

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const formatTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'present': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case 'absent': return <XCircle className="w-4 h-4 text-red-500" />;
    case 'late': return <Clock className="w-4 h-4 text-amber-500" />;
    case 'excused': return <UserMinus className="w-4 h-4 text-blue-500" />;
    default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'present': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'absent': return 'bg-red-50 text-red-700 border-red-200';
    case 'late': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'excused': return 'bg-blue-50 text-blue-700 border-blue-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

// ───────────────────────────────
// STAT CARD COMPONENT
// ───────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 hover:shadow-md transition-all"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color.bg}`}>
        <Icon className={`w-6 h-6 ${color.text}`} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend.color}`}>
          {trend.icon}
          {trend.value}
        </div>
      )}
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
    </div>
  </motion.div>
);

// ───────────────────────────────
// STUDENT ROW COMPONENT
// ───────────────────────────────
const StudentRow = ({ student, attendance, onStatusChange, index }) => {
  const [isEditing, setIsEditing] = useState(false);
  const currentStatus = attendance?.status || 'absent';
  const timeIn = attendance?.timeIn;

  // Get student name from either nested user object or direct fields
  const getStudentName = () => {
    if (student.user?.firstName && student.user?.lastName) {
      return `${student.user.firstName} ${student.user.lastName}`;
    }
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.name || 'Unknown Student';
  };

  const getStudentId = () => {
    return student.studentId || student.id || 'N/A';
  };

  const getInitials = () => {
    const name = getStudentName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const statusOptions = [
    { value: 'present', label: 'Present', icon: CheckCircle, color: 'emerald' },
    { value: 'absent', label: 'Absent', icon: XCircle, color: 'red' },
    { value: 'late', label: 'Late', icon: Clock, color: 'amber' },
    { value: 'excused', label: 'Excused', icon: UserMinus, color: 'blue' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="group bg-white hover:bg-indigo-50/30 transition-all duration-200 border-b border-slate-100 last:border-0"
    >
      <div className="flex items-center justify-between p-4">
        {/* Student Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-semibold">
            {getInitials()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              {getStudentName()}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">ID: {getStudentId()}</span>
              {timeIn && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(timeIn)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge & Dropdown */}
        <div className="relative">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all hover:shadow-sm ${getStatusColor(currentStatus)}`}
            >
              {getStatusIcon(currentStatus)}
              <span className="text-sm font-medium capitalize">{currentStatus}</span>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={currentStatus}
                onChange={(e) => {
                  onStatusChange(student.id, e.target.value);
                  setIsEditing(false);
                }}
                className="px-4 py-2 pr-8 rounded-xl border border-indigo-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                autoFocus
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsEditing(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ───────────────────────────────
// MAIN COMPONENT
// ───────────────────────────────
const AttendanceReport = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [stats, setStats] = useState({ 
    present: 0, absent: 0, late: 0, excused: 0, total: 0,
    attendanceRate: 0, presentPercentage: 0 
  });

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list or grid
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Load base data
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          classAPI.getClasses(),
          studentAPI.getStudents({ limit: 5000 }),
        ]);

        setClasses(extractData(cRes) || []);
        const studentsData = extractData(sRes) || [];
        
        // Transform student data to ensure consistent structure
        const normalizedStudents = studentsData.map(student => ({
          ...student,
          firstName: student.user?.firstName || student.firstName,
          lastName: student.user?.lastName || student.lastName,
          studentId: student.studentId || student.id,
        }));
        
        setStudents(normalizedStudents);
      } catch {
        toast.error('Failed to load base data');
      }
    };

    load();
  }, []);

  // ── Fetch attendance
  const fetchAttendance = useCallback(async () => {
    if (!selectedClass) return;

    setLoading(true);
    try {
      const res = await reportsAPI.getAttendance({
        classId: selectedClass,
        date: selectedDate,
      });

      const data = extractData(res);
      const map = {};

      (Array.isArray(data) ? data : data?.records || []).forEach((r) => {
        const id = r.studentId || r.student?.id;
        if (!id) return;

        map[id] = {
          status: r.status,
          timeIn: r.timeIn || null,
        };
      });

      setAttendanceData(map);

      // Calculate stats
      const classStudents = students.filter((s) =>
        s.enrollments?.some((e) => String(e.classId) === String(selectedClass))
      );

      let present = 0, absent = 0, late = 0, excused = 0;

      classStudents.forEach((s) => {
        const status = map[s.id]?.status || 'absent';
        if (status === 'present') present++;
        else if (status === 'late') late++;
        else if (status === 'excused') excused++;
        else absent++;
      });

      const total = classStudents.length;
      const presentTotal = present + late; // Late counts as present for attendance rate
      const attendanceRate = total > 0 ? ((presentTotal / total) * 100).toFixed(1) : 0;

      setStats({
        present,
        absent,
        late,
        excused,
        total,
        attendanceRate: parseFloat(attendanceRate),
        presentPercentage: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
      });

    } catch (error) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate, students]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ── Update status
  const updateStatus = async (studentId, status) => {
    setSaving(true);
    
    // Optimistic update
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        timeIn: status === 'present' || status === 'late' ? new Date().toISOString() : null,
      },
    }));

    try {
      // Call API to save attendance
      await reportsAPI.markAttendance({
        studentId,
        classId: selectedClass,
        date: selectedDate,
        status,
      });
      
      toast.success(`Attendance marked as ${status}`);
      fetchAttendance(); // Refresh stats
    } catch (error) {
      toast.error('Failed to update attendance');
      fetchAttendance(); // Revert on error
    } finally {
      setSaving(false);
    }
  };

  // ── Filter students
  const filteredStudents = students.filter((s) => {
    const inClass = s.enrollments?.some((e) => String(e.classId) === String(selectedClass));
    if (!inClass) return false;

    const firstName = s.firstName || s.user?.firstName || '';
    const lastName = s.lastName || s.user?.lastName || '';
    const name = `${firstName} ${lastName}`.toLowerCase();
    const studentId = s.studentId?.toLowerCase() || '';
    const searchTerm = search.toLowerCase();
    
    if (search && !name.includes(searchTerm) && !studentId.includes(searchTerm)) return false;

    const status = attendanceData[s.id]?.status || 'absent';
    if (statusFilter !== 'all' && status !== statusFilter) return false;

    return true;
  });

  // ── Export CSV
  const exportCSV = () => {
    const rows = filteredStudents.map((s) => {
      const firstName = s.firstName || s.user?.firstName || '';
      const lastName = s.lastName || s.user?.lastName || '';
      const name = `${firstName} ${lastName}`.trim();
      return [
        name || 'Unknown',
        s.studentId || '',
        attendanceData[s.id]?.status || 'absent',
        attendanceData[s.id]?.timeIn ? formatTime(attendanceData[s.id].timeIn) : '',
      ];
    });

    const csv = [
      ['Name', 'Student ID', 'Status', 'Time In'],
      ...rows,
    ].map(r => r.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedDate}_class_${selectedClass}.csv`;
    a.click();
    toast.success('Report exported successfully');
  };

  // ── Export PDF (print)
  const exportPDF = () => {
    window.print();
  };

  // ── Get class name
  const getClassName = () => {
    const classObj = classes.find(c => String(c.id) === String(selectedClass));
    return classObj?.name || 'Selected Class';
  };

  // ── Render loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-200" />
              <div>
                <div className="h-5 w-32 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-24 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="h-10 w-28 bg-slate-200 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );

  // ── Helper to get student name for grid view
  const getStudentDisplayName = (student) => {
    const firstName = student.firstName || student.user?.firstName || '';
    const lastName = student.lastName || student.user?.lastName || '';
    const name = `${firstName} ${lastName}`.trim();
    return name || 'Unknown Student';
  };

  const getStudentInitials = (student) => {
    const name = getStudentDisplayName(student);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // ───────────────────────────────
  // UI RENDER
  // ───────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Attendance Report</h1>
                <p className="text-sm text-slate-500 mt-0.5">Track and manage student attendance</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchAttendance}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm hover:shadow-md"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setStatusFilter('all');
                  setSearch('');
                }}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="">Choose a class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="all">All Students</option>
                <option value="present">Present Only</option>
                <option value="absent">Absent Only</option>
                <option value="late">Late Only</option>
                <option value="excused">Excused Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Search Student
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  placeholder="Name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  viewMode === 'list' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <List className="w-4 h-4" />
                List View
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
                Grid View
              </button>
            </div>
            
            {selectedClass && (
              <div className="text-sm text-slate-500">
                Showing {filteredStudents.length} of {stats.total} students
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {selectedClass && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <StatCard
              title="Attendance Rate"
              value={`${stats.attendanceRate}%`}
              icon={TrendingUp}
              color={{ bg: 'bg-indigo-100', text: 'text-indigo-600' }}
              trend={{ icon: <TrendingUp className="w-3 h-3" />, value: 'vs yesterday', color: 'text-green-600' }}
            />
            <StatCard
              title="Present"
              value={stats.present}
              icon={UserCheck}
              color={{ bg: 'bg-emerald-100', text: 'text-emerald-600' }}
              subtitle={`${stats.presentPercentage}% of total`}
            />
            <StatCard
              title="Absent"
              value={stats.absent}
              icon={UserX}
              color={{ bg: 'bg-red-100', text: 'text-red-600' }}
            />
            <StatCard
              title="Late"
              value={stats.late}
              icon={Clock}
              color={{ bg: 'bg-amber-100', text: 'text-amber-600' }}
            />
            <StatCard
              title="Excused"
              value={stats.excused}
              icon={UserMinus}
              color={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
            />
            <StatCard
              title="Total"
              value={stats.total}
              icon={Users}
              color={{ bg: 'bg-slate-100', text: 'text-slate-600' }}
            />
          </div>
        )}

        {/* Attendance Summary Card */}
        {selectedClass && stats.total > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-indigo-200 text-sm font-medium mb-1">Summary for {formatDate(selectedDate)}</p>
                <h2 className="text-2xl font-bold">{getClassName()}</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{stats.attendanceRate}%</p>
                  <p className="text-xs text-indigo-200">Attendance Rate</p>
                </div>
                <div className="h-12 w-px bg-indigo-500" />
                <div className="flex gap-4">
                  <div>
                    <p className="text-2xl font-bold">{stats.present + stats.late}</p>
                    <p className="text-xs text-indigo-200">Present Today</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.absent}</p>
                    <p className="text-xs text-indigo-200">Absent Today</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Students List/Grid */}
        {!selectedClass ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium mb-2">No Class Selected</p>
            <p className="text-sm text-slate-400">Please select a class to view attendance records</p>
          </div>
        ) : loading ? (
          renderSkeleton()
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium mb-2">No students found</p>
            <p className="text-sm text-slate-400">
              {search ? 'Try adjusting your search or filters' : 'No students enrolled in this class'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span className="flex-1">Student Information</span>
                <span>Attendance Status</span>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {filteredStudents.map((student, idx) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  attendance={attendanceData[student.id]}
                  onStatusChange={updateStatus}
                  index={idx}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student, idx) => {
              const status = attendanceData[student.id]?.status || 'absent';
              const timeIn = attendanceData[student.id]?.timeIn;
              const studentName = getStudentDisplayName(student);
              const studentInitials = getStudentInitials(student);
              const studentId = student.studentId || student.id || 'N/A';
              
              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl">
                      {studentInitials}
                    </div>
                    <div className={`px-3 py-1.5 rounded-xl border text-sm font-medium flex items-center gap-2 ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                      <span className="capitalize">{status}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h3 className="font-semibold text-slate-800 text-lg">
                      {studentName}
                    </h3>
                    <p className="text-sm text-slate-400">ID: {studentId}</p>
                  </div>

                  {timeIn && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                      <Clock className="w-4 h-4" />
                      <span>Checked in: {formatTime(timeIn)}</span>
                    </div>
                  )}

                  <select
                    value={status}
                    onChange={(e) => updateStatus(student.id, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="present">✅ Present</option>
                    <option value="absent">❌ Absent</option>
                    <option value="late">⏰ Late</option>
                    <option value="excused">📝 Excused</option>
                  </select>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Saving Indicator */}
        {saving && (
          <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 z-50">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Saving changes...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReport;