// pages/teacher/TeacherAttendanceView.jsx
// ─── Complete Teacher Attendance View Component ───────────────────────────
// Features: View attendance records by class, date range, and student
// FIXED: Properly handles backend response structure with uppercase status values

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar, Users, Search, Filter, Download, Printer,
  Loader2, RefreshCw, Eye, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock as ClockIcon, AlertCircle,
  FileText, UserCheck, UserX, Activity, BarChart3,
  ArrowLeft, ArrowRight, ZoomIn, X, TrendingUp, TrendingDown,
  PieChart, Calendar as CalendarIcon, ChevronDown, Sliders,
  Grid3x3, List, Maximize2, Minimize2, Star, Award
} from 'lucide-react';
import { teacherApi } from '../../services/teacherApi';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [res, res.data, res.data?.data, ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const c of candidates) { if (Array.isArray(c)) return c; }
  return [];
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const formatShortDate = (dateString) => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// ─── Backend uses UPPERCASE status values ──────────────────
// Backend enum: PRESENT, ABSENT, LATE
const ATTENDANCE_STATUS = {
  PRESENT: { 
    value: 'PRESENT', 
    label: 'Present', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200',
    icon: CheckCircle,
    gradient: 'from-emerald-500 to-teal-500'
  },
  ABSENT: { 
    value: 'ABSENT', 
    label: 'Absent', 
    color: 'text-red-600', 
    bg: 'bg-red-50', 
    border: 'border-red-200',
    icon: XCircle,
    gradient: 'from-red-500 to-rose-500'
  },
  LATE: { 
    value: 'LATE', 
    label: 'Late', 
    color: 'text-amber-600', 
    bg: 'bg-amber-50', 
    border: 'border-amber-200',
    icon: ClockIcon,
    gradient: 'from-amber-500 to-orange-500'
  },
};

// Map for display order
const STATUS_ORDER = ['PRESENT', 'ABSENT', 'LATE'];

// ─────────────────────────────────────────────────────────────
// STATS CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const StatsCard = ({ title, value, icon: Icon, color, bgColor, trend, trendValue }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="group relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50/50 to-transparent rounded-full -mr-16 -mt-16" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
// ATTENDANCE RECORD ROW COMPONENT
// ─────────────────────────────────────────────────────────────
const AttendanceRecordRow = ({ record, index, onViewDetails }) => {
  // Handle uppercase status from backend
  const statusKey = record.status || 'PRESENT';
  const statusInfo = ATTENDANCE_STATUS[statusKey] || ATTENDANCE_STATUS.PRESENT;
  const StatusIcon = statusInfo.icon;
  
  // Get student name from nested user object or direct fields
  const firstName = record.student?.user?.firstName || record.student?.firstName || record.user?.firstName || '';
  const lastName = record.student?.user?.lastName || record.student?.lastName || record.user?.lastName || '';
  const studentId = record.student?.studentId || record.studentId || '';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      whileHover={{ backgroundColor: '#f8fafc' }}
      className="group flex items-center justify-between p-4 bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-all duration-200"
    >
      {/* Student Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {firstName?.[0] || lastName?.[0] || 'S'}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
              statusKey === 'PRESENT' ? 'bg-emerald-500' :
              statusKey === 'LATE' ? 'bg-amber-500' : 'bg-red-500'
            }`} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {firstName} {lastName}
            </p>
            <p className="text-xs text-slate-400 font-mono">
              ID: {studentId || 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Date */}
      <div className="hidden md:block w-28">
        <p className="text-sm font-medium text-slate-700">{formatShortDate(record.date)}</p>
        <p className="text-xs text-slate-400">{formatTime(record.createdAt)}</p>
      </div>
      
      {/* Status */}
      <div className="w-28">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusInfo.bg} ${statusInfo.color} font-medium shadow-sm`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{statusInfo.label}</span>
        </div>
      </div>
      
      {/* Remarks */}
      <div className="hidden lg:block w-56">
        {record.remarks ? (
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
            <FileText className="w-3 h-3 text-slate-400" />
            <span className="truncate">{record.remarks}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-300 italic">—</span>
        )}
      </div>
      
      {/* Action Button */}
      <button
        onClick={() => onViewDetails(record)}
        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
        title="View details"
      >
        <Eye className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// ATTENDANCE DETAILS MODAL
// ─────────────────────────────────────────────────────────────
const AttendanceDetailsModal = ({ record, isOpen, onClose }) => {
  if (!isOpen || !record) return null;
  
  const statusKey = record.status || 'PRESENT';
  const statusInfo = ATTENDANCE_STATUS[statusKey] || ATTENDANCE_STATUS.PRESENT;
  const StatusIcon = statusInfo.icon;
  
  const firstName = record.student?.user?.firstName || record.student?.firstName || record.user?.firstName || '';
  const lastName = record.student?.user?.lastName || record.student?.lastName || record.user?.lastName || '';
  const studentId = record.student?.studentId || record.studentId || '';
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Gradient */}
        <div className={`relative px-6 py-5 bg-gradient-to-r ${statusInfo.gradient} from-indigo-600 to-indigo-700`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-20 -mb-20" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Attendance Details</h2>
                <p className="text-sm text-white/80">Complete record information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Student Info */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-xl">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {firstName?.[0] || lastName?.[0] || 'S'}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {firstName} {lastName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 font-mono">Student ID:</span>
                <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {studentId || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
                <p className="text-xs font-medium text-slate-500">Date</p>
              </div>
              <p className="font-semibold text-slate-800">{formatDisplayDate(record.date)}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <ClockIcon className="w-3.5 h-3.5 text-indigo-500" />
                <p className="text-xs font-medium text-slate-500">Recorded At</p>
              </div>
              <p className="font-semibold text-slate-800">{formatTime(record.createdAt) || 'N/A'}</p>
            </div>
          </div>
          
          {/* Status Card */}
          <div className={`p-4 rounded-xl bg-gradient-to-r ${statusInfo.bg}`}>
            <p className="text-xs font-medium text-slate-500 mb-2">Attendance Status</p>
            <div className={`flex items-center gap-3 font-bold text-lg ${statusInfo.color}`}>
              <StatusIcon className="w-6 h-6" />
              <span>{statusInfo.label}</span>
            </div>
          </div>
          
          {/* Remarks */}
          {record.remarks && (
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <p className="text-xs font-medium text-slate-500">Remarks</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{record.remarks}</p>
            </div>
          )}
          
          {/* Metadata */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-mono">
              Record ID: {record.id?.slice(0, 8) || 'N/A'}...
            </p>
            {record.updatedAt && record.updatedAt !== record.createdAt && (
              <p className="text-xs text-slate-400 mt-1">
                Last updated: {formatDisplayDate(record.updatedAt)} at {formatTime(record.updatedAt)}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const TeacherAttendanceView = () => {
  // Data states
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Filter states
  const [selectedClassArmId, setSelectedClassArmId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return formatDate(date);
  });
  const [endDate, setEndDate] = useState(formatDate(new Date()));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal state
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Statistics
  const [statistics, setStatistics] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0,
  });
  
  // ── Fetch Assigned Classes ─────────────────────────────
  const fetchAssignedClasses = useCallback(async () => {
    try {
      const response = await teacherApi.getAssignedClasses();
      const data = response?.data?.data || response?.data || response;
      
      const classes = Array.isArray(data) ? data.map(item => ({
        id: item.arm?.id || item.armId || item.id,
        name: `${item.class?.name || 'Class'} - ${item.arm?.name || 'Arm'}`,
        classId: item.class?.id,
        armId: item.arm?.id,
      })).filter(c => c.id) : [];
      
      setAssignedClasses(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    }
  }, []);
  
  // ── Fetch Attendance Records ──────────────────────────
  const fetchAttendanceRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClassArmId) params.classArmId = selectedClassArmId;
      if (selectedStudentId) params.studentId = selectedStudentId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedStatus) params.status = selectedStatus;
      
      const response = await teacherApi.viewAttendance(params);
      const records = toArray(response, 'attendance', 'records', 'data');
      
      setAttendanceRecords(records);
      setFilteredRecords(records);
      
      // Calculate statistics
      const total = records.length;
      const present = records.filter(r => r.status === 'PRESENT').length;
      const absent = records.filter(r => r.status === 'ABSENT').length;
      const late = records.filter(r => r.status === 'LATE').length;
      const attendanceRate = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;
      
      setStatistics({ total, present, absent, late, attendanceRate });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
      setAttendanceRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClassArmId, selectedStudentId, startDate, endDate, selectedStatus]);
  
  // ── Filter Records by Search Term ─────────────────────
  useEffect(() => {
    if (!searchTerm.trim() && !selectedStatus) {
      setFilteredRecords(attendanceRecords);
      return;
    }
    
    let filtered = [...attendanceRecords];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        const firstName = record.student?.user?.firstName || record.student?.firstName || record.user?.firstName || '';
        const lastName = record.student?.user?.lastName || record.student?.lastName || record.user?.lastName || '';
        const studentName = `${firstName} ${lastName}`.toLowerCase();
        const studentId = (record.student?.studentId || record.studentId || '').toLowerCase();
        return studentName.includes(term) || studentId.includes(term);
      });
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(record => record.status === selectedStatus);
    }
    
    setFilteredRecords(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, attendanceRecords]);
  
  // ── Pagination Logic ──────────────────────────────────
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // ── Handlers ──────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    fetchAttendanceRecords();
  };
  
  const handleReset = () => {
    setSelectedClassArmId('');
    setSelectedStudentId('');
    setSelectedStatus('');
    const date = new Date();
    date.setDate(date.getDate() - 30);
    setStartDate(formatDate(date));
    setEndDate(formatDate(new Date()));
    setSearchTerm('');
    setCurrentPage(1);
    
    setTimeout(() => {
      fetchAttendanceRecords();
    }, 100);
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssignedClasses();
    await fetchAttendanceRecords();
    setRefreshing(false);
    toast.success('Data refreshed');
  };
  
  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowDetailsModal(true);
  };
  
  const handleExport = async () => {
    setExporting(true);
    try {
      const headers = ['Date', 'Student Name', 'Student ID', 'Status', 'Remarks', 'Recorded At'];
      const rows = filteredRecords.map(record => {
        const firstName = record.student?.user?.firstName || record.student?.firstName || record.user?.firstName || '';
        const lastName = record.student?.user?.lastName || record.student?.lastName || record.user?.lastName || '';
        const statusInfo = ATTENDANCE_STATUS[record.status] || ATTENDANCE_STATUS.PRESENT;
        return [
          formatDisplayDate(record.date),
          `${firstName} ${lastName}`.trim(),
          record.student?.studentId || record.studentId || '',
          statusInfo.label,
          `"${(record.remarks || '').replace(/"/g, '""')}"`,
          formatTime(record.createdAt),
        ];
      });
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_records_${formatDate(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`${filteredRecords.length} records exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };
  
  // ── Initial Load ──────────────────────────────────────
  useEffect(() => {
    fetchAssignedClasses();
  }, [fetchAssignedClasses]);
  
  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-700 border-b border-indigo-500/20 sticky top-0 z-20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Attendance Records</h1>
                <p className="text-sm text-indigo-200 mt-0.5">View and track student attendance history</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center bg-white/10 rounded-lg p-1 mr-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-indigo-200 hover:text-white'}`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-indigo-200 hover:text-white'}`}
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleExport}
                disabled={exporting || filteredRecords.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-white rounded-xl hover:bg-indigo-50 transition-all shadow-md disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatsCard
            title="Total Records"
            value={statistics.total}
            icon={Activity}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
          <StatsCard
            title="Present"
            value={statistics.present}
            icon={CheckCircle}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            trend="up"
            trendValue={`${statistics.total > 0 ? ((statistics.present / statistics.total) * 100).toFixed(0) : 0}%`}
          />
          <StatsCard
            title="Absent"
            value={statistics.absent}
            icon={XCircle}
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <StatsCard
            title="Late"
            value={statistics.late}
            icon={ClockIcon}
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
          <StatsCard
            title="Attendance Rate"
            value={`${statistics.attendanceRate}%`}
            icon={Award}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>
        
        {/* Filter Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg mb-6 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-slate-100">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-indigo-700 font-medium hover:text-indigo-800 transition-colors"
            >
              <Sliders className="w-4 h-4" />
              <span>Filter Records</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Class Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Class</label>
                <select
                  value={selectedClassArmId}
                  onChange={(e) => setSelectedClassArmId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">All Classes</option>
                  {assignedClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">All Status</option>
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                </select>
              </div>
              
              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              
              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={fetchAttendanceRecords}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md font-medium"
              >
                Apply Filters
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-medium"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by student name, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white shadow-sm"
            />
          </div>
        </div>
        
        {/* Records Display */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-slate-100">
            <div className="flex-1 font-semibold text-sm text-slate-600">Student</div>
            <div className="w-28 font-semibold text-sm text-slate-600">Date</div>
            <div className="w-28 font-semibold text-sm text-slate-600">Status</div>
            <div className="hidden lg:block w-56 font-semibold text-sm text-slate-600">Remarks</div>
            <div className="w-10 font-semibold text-sm text-slate-600"></div>
          </div>
          
          {/* Records List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                <p className="text-slate-500">Loading attendance records...</p>
              </div>
            </div>
          ) : paginatedRecords.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-12 h-12 text-indigo-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No attendance records found</h3>
              <p className="text-slate-400">Try adjusting your filters or select a different date range.</p>
            </div>
          ) : viewMode === 'list' ? (
            <>
              {paginatedRecords.map((record, index) => (
                <AttendanceRecordRow
                  key={record.id || index}
                  record={record}
                  index={index}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {paginatedRecords.map((record, index) => {
                const statusKey = record.status || 'PRESENT';
                const statusInfo = ATTENDANCE_STATUS[statusKey] || ATTENDANCE_STATUS.PRESENT;
                const StatusIcon = statusInfo.icon;
                const firstName = record.student?.user?.firstName || record.student?.firstName || record.user?.firstName || '';
                const lastName = record.student?.user?.lastName || record.student?.lastName || record.user?.lastName || '';
                
                return (
                  <motion.div
                    key={record.id || index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => handleViewDetails(record)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {firstName?.[0] || lastName?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {firstName} {lastName}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            {record.student?.studentId || record.studentId || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-lg ${statusInfo.bg}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-slate-500">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{formatShortDate(record.date)}</span>
                      </div>
                      <span className={`text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    {record.remarks && (
                      <p className="text-xs text-slate-500 mt-2 truncate">{record.remarks}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  Showing {filteredRecords.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length}
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-lg font-medium transition-all ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-indigo-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Details Modal */}
      <AttendanceDetailsModal
        record={selectedRecord}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedRecord(null);
        }}
      />
    </div>
  );
};

export default TeacherAttendanceView;