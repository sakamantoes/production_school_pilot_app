// pages/teacher/TeacherAttendance.jsx
// ─── Complete Teacher Attendance Management System ───────────────────────────
// Features: Take attendance for class, update existing records, view attendance history

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle,
  Loader2, RefreshCw, Search, Filter, ChevronDown, Edit2,
  Save, X, Eye, UserCheck, UserX, Clock as ClockIcon,
  GraduationCap, BookOpen, ChevronLeft, ChevronRight,
  Download, Printer, FileText, Activity, TrendingUp, TrendingDown,
  Award, Sparkles, Shield, Zap, Star, BarChart3
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
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatShortDate = (dateString) => {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ATTENDANCE_STATUS = {
  present: { value: 'present', label: 'Present', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, gradient: 'from-emerald-500 to-teal-500' },
  absent: { value: 'absent', label: 'Absent', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, gradient: 'from-red-500 to-rose-500' },
  late: { value: 'late', label: 'Late', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: ClockIcon, gradient: 'from-amber-500 to-orange-500' },
  excused: { value: 'excused', label: 'Excused', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: AlertCircle, gradient: 'from-indigo-500 to-purple-500' },
};

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
// STUDENT ATTENDANCE ROW COMPONENT
// ─────────────────────────────────────────────────────────────
const StudentAttendanceRow = ({ student, status, onStatusChange, remarks, onRemarksChange, isSubmitting, index }) => {
  const [showRemarks, setShowRemarks] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      whileHover={{ scale: 1.01 }}
      className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-md transition-all duration-200"
    >
      {/* Student Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {student.firstName?.[0]}{student.lastName?.[0]}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
              status === 'present' ? 'bg-emerald-500' :
              status === 'late' ? 'bg-amber-500' :
              status === 'excused' ? 'bg-indigo-500' : 'bg-red-500'
            }`} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-xs text-slate-400 font-mono">ID: {student.studentId || student.id?.slice(-6)}</p>
          </div>
        </div>
      </div>
      
      {/* Status Selector */}
      <div className="flex items-center gap-2">
        {Object.values(ATTENDANCE_STATUS).map((statusOption) => {
          const Icon = statusOption.icon;
          const isSelected = status === statusOption.value;
          return (
            <button
              key={statusOption.value}
              type="button"
              onClick={() => onStatusChange(statusOption.value)}
              disabled={isSubmitting}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                isSelected
                  ? `${statusOption.bg} ${statusOption.color} ring-2 ring-offset-2 ring-${statusOption.value === 'present' ? 'emerald' : statusOption.value === 'absent' ? 'red' : statusOption.value === 'late' ? 'amber' : 'indigo'}-400`
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-indigo-600'
              } disabled:opacity-50`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{statusOption.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Remarks */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowRemarks(!showRemarks)}
          className={`p-2 rounded-lg transition-colors ${showRemarks ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'}`}
          title="Add remarks"
        >
          <FileText className="w-4 h-4" />
        </button>
        
        <AnimatePresence>
          {showRemarks && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 z-10 bg-white rounded-xl shadow-xl border border-slate-200 p-3 min-w-[250px]"
            >
              <textarea
                value={remarks}
                onChange={(e) => onRemarksChange(e.target.value)}
                placeholder="Add remarks (optional)..."
                rows="3"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                autoFocus
              />
              <button
                onClick={() => setShowRemarks(false)}
                className="mt-2 w-full px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const TeacherAttendance = () => {
  // Data states
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form states
  const [selectedClassArmId, setSelectedClassArmId] = useState('');
  const [selectedClassArmName, setSelectedClassArmName] = useState('');
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  
  // View states
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Modal states
  const [editingRecord, setEditingRecord] = useState(null);
  
  // ── Fetch Assigned Classes ─────────────────────────────
  const fetchAssignedClasses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await teacherApi.getAssignedClasses();
      const data = response?.data?.data || response?.data || response;
      
      const classesWithArms = [];
      if (Array.isArray(data)) {
        for (const item of data) {
          const classArm = {
            id: item.arm?.id || item.classArmId || item.id,
            name: `${item.class?.name || 'Class'} - ${item.arm?.name || 'Arm'}`,
            classId: item.class?.id,
            armId: item.arm?.id,
            subjects: item.subjects || [],
            students: [],
          };
          classesWithArms.push(classArm);
        }
      }
      setAssignedClasses(classesWithArms);
      
      if (classesWithArms.length === 0) {
        toast.error('No classes assigned to you');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load assigned classes');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // ── Fetch Students for selected class-arm ──────────────────────────
  const fetchStudentsForClass = useCallback(async () => {
    if (!selectedClassArmId) {
      setStudents([]);
      return;
    }
    
    setFetchingStudents(true);
    try {
      const selectedClass = assignedClasses.find(c => c.id === selectedClassArmId);
      
      if (!selectedClass) {
        setStudents([]);
        return;
      }
      
      let fetchedStudents = [];
      
      try {
        const response = await teacherApi.getStudentsByClassArm?.(selectedClassArmId);
        fetchedStudents = response?.data?.data || response?.data || [];
      } catch (err) {
        console.warn('Could not fetch students via class arm endpoint:', err);
        
        try {
          const response = await teacherApi.getStudentsByClass?.(selectedClass.classId);
          fetchedStudents = response?.data?.data || response?.data || [];
        } catch (err2) {
          console.warn('Could not fetch students via class endpoint:', err2);
        }
      }
      
      if (fetchedStudents.length === 0) {
        toast('No students found for this class. Please ensure students are enrolled.', {
          icon: 'ℹ️',
          duration: 4000,
        });
      }
      
      setStudents(fetchedStudents);
      setAttendanceRecords({});
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
      setStudents([]);
    } finally {
      setFetchingStudents(false);
    }
  }, [selectedClassArmId, assignedClasses]);
  
  useEffect(() => {
    fetchAssignedClasses();
  }, [fetchAssignedClasses]);
  
  useEffect(() => {
    if (selectedClassArmId) {
      fetchStudentsForClass();
    }
  }, [selectedClassArmId, fetchStudentsForClass]);
  
  // ── Check Existing Attendance ────────────
  const checkExistingAttendance = useCallback(async () => {
    if (!selectedClassArmId || !selectedDate || students.length === 0) return;
    
    try {
      const response = await teacherApi.viewAttendance({
        classArmId: selectedClassArmId,
        date: selectedDate,
      });
      
      const records = response?.data?.data || response?.data || [];
      const recordsMap = {};
      (Array.isArray(records) ? records : []).forEach(record => {
        recordsMap[record.studentId] = record;
      });
      
      const newRecords = {};
      students.forEach(student => {
        const existing = recordsMap[student.id];
        if (existing) {
          newRecords[student.id] = {
            status: existing.status,
            remarks: existing.remarks || '',
            id: existing.id,
          };
        } else {
          newRecords[student.id] = {
            status: 'present',
            remarks: '',
            id: null,
          };
        }
      });
      setAttendanceRecords(newRecords);
    } catch (error) {
      console.error('Error checking attendance:', error);
      const newRecords = {};
      students.forEach(student => {
        newRecords[student.id] = {
          status: 'present',
          remarks: '',
          id: null,
        };
      });
      setAttendanceRecords(newRecords);
    }
  }, [selectedClassArmId, selectedDate, students]);
  
  useEffect(() => {
    if (students.length > 0 && selectedClassArmId && selectedDate) {
      checkExistingAttendance();
    }
  }, [students, selectedClassArmId, selectedDate, checkExistingAttendance]);
  
  // ── Handlers ──────────────────────────────
  const handleClassSelection = (classArmId) => {
    setSelectedClassArmId(classArmId);
    const selected = assignedClasses.find(c => c.id === classArmId);
    setSelectedClassArmName(selected?.name || '');
  };
  
  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };
  
  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };
  
  const handleSubmitAttendance = async () => {
    if (!selectedClassArmId) {
      toast.error('Please select a class');
      return;
    }
    
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    
    if (students.length === 0) {
      toast.error('No students found for this class');
      return;
    }
    
    setSubmitting(true);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    try {
      for (const student of students) {
        const record = attendanceRecords[student.id];
        if (!record) continue;
        
        try {
          if (record.id) {
            await teacherApi.updateAttendance(record.id, {
              status: record.status,
              remarks: record.remarks || undefined,
            });
            successCount++;
          } else {
            await teacherApi.recordAttendance({
              studentId: student.id,
              date: selectedDate,
              status: record.status,
              remarks: record.remarks || undefined,
            });
            successCount++;
          }
        } catch (err) {
          console.error(`Error saving attendance for ${student.firstName} ${student.lastName}:`, err);
          errorCount++;
          errors.push(`${student.firstName} ${student.lastName}`);
        }
      }
      
      if (successCount > 0) {
        toast.success(`✓ Attendance saved for ${successCount} student${successCount !== 1 ? 's' : ''}`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to save for ${errorCount} student${errorCount !== 1 ? 's' : ''}: ${errors.join(', ')}`);
      }
      
      await checkExistingAttendance();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };
  
  const viewStudentHistory = async (student) => {
    setSelectedStudent(student);
    setShowHistory(true);
    
    try {
      const response = await teacherApi.viewAttendance({ studentId: student.id });
      const history = response?.data?.data || response?.data || [];
      setAttendanceHistory(Array.isArray(history) ? history.sort((a, b) => new Date(b.date) - new Date(a.date)) : []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load attendance history');
      setAttendanceHistory([]);
    }
  };
  
  const handleEditRecord = (record) => {
    setEditingRecord(record);
  };
  
  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    
    setSubmitting(true);
    try {
      await teacherApi.updateAttendance(editingRecord.id, {
        status: editingRecord.status,
        remarks: editingRecord.remarks,
      });
      toast.success('Attendance record updated');
      setEditingRecord(null);
      await checkExistingAttendance();
    } catch (error) {
      toast.error('Failed to update record');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssignedClasses();
    if (selectedClassArmId) {
      await fetchStudentsForClass();
      await checkExistingAttendance();
    }
    setRefreshing(false);
    toast.success('Data refreshed');
  };
  
  const getAttendanceSummary = () => {
    const records = Object.values(attendanceRecords);
    const present = records.filter(r => r?.status === 'present').length;
    const absent = records.filter(r => r?.status === 'absent').length;
    const late = records.filter(r => r?.status === 'late').length;
    const excused = records.filter(r => r?.status === 'excused').length;
    const attendanceRate = records.length > 0 ? ((present + late) / records.length * 100).toFixed(1) : 0;
    
    return { present, absent, late, excused, total: records.length, attendanceRate };
  };
  
  const summary = getAttendanceSummary();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-slate-600 font-medium mt-4">Loading your classes...</p>
          <p className="text-xs text-slate-400 mt-1">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header with Indigo Theme */}
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
                <h1 className="text-2xl font-bold text-white tracking-tight">Attendance Management</h1>
                <p className="text-sm text-indigo-200 mt-0.5">Record and track student attendance</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            title="Total Students"
            value={summary.total}
            icon={Users}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
          <StatsCard
            title="Present"
            value={summary.present}
            icon={CheckCircle}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            trend="up"
            trendValue={`${summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(0) : 0}%`}
          />
          <StatsCard
            title="Absent"
            value={summary.absent}
            icon={XCircle}
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <StatsCard
            title="Late"
            value={summary.late}
            icon={ClockIcon}
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
          <StatsCard
            title="Excused"
            value={summary.excused}
            icon={AlertCircle}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
          />
          <StatsCard
            title="Attendance Rate"
            value={`${summary.attendanceRate}%`}
            icon={Award}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        </div>
        
        {/* Selection Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg mb-6 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-slate-800">Attendance Configuration</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Class Arm Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Select Class <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={selectedClassArmId}
                    onChange={(e) => handleClassSelection(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white appearance-none"
                  >
                    <option value="">Select a class...</option>
                    {assignedClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {assignedClasses.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    No classes assigned yet
                  </p>
                )}
              </div>
              
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Students List - Take Attendance */}
        {selectedClassArmId && (
          <>
            {fetchingStudents ? (
              <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-3" />
                  <p className="text-slate-500">Loading students...</p>
                </div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-12 h-12 text-indigo-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No students found</h3>
                <p className="text-slate-400">No students are assigned to this class yet.</p>
                <p className="text-xs text-slate-400 mt-2">Please ensure students are enrolled in this class-arm.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50/30 to-transparent flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      Student Attendance
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedClassArmName} • {formatDisplayDate(selectedDate)} • {students.length} students
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitAttendance}
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md disabled:opacity-50 font-medium"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {submitting ? 'Saving...' : 'Save Attendance'}
                  </motion.button>
                </div>
                
                <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                  {students.map((student, index) => (
                    <div key={student.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex-1">
                          <StudentAttendanceRow
                            student={student}
                            index={index}
                            status={attendanceRecords[student.id]?.status || 'present'}
                            onStatusChange={(status) => handleStatusChange(student.id, status)}
                            remarks={attendanceRecords[student.id]?.remarks || ''}
                            onRemarksChange={(remarks) => handleRemarksChange(student.id, remarks)}
                            isSubmitting={submitting}
                          />
                        </div>
                        
                        {/* History Button */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => viewStudentHistory(student)}
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          title="View attendance history"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {!selectedClassArmId && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-12 h-12 text-indigo-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Select a Class</h3>
            <p className="text-slate-400">Choose a class from the dropdown above to take attendance.</p>
          </div>
        )}
      </div>
      
      {/* Attendance History Modal */}
      <AnimatePresence>
        {showHistory && selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Attendance History
                  </h2>
                  <p className="text-sm text-indigo-200">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-6">
                {attendanceHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No attendance records found</p>
                    <p className="text-xs text-slate-400 mt-1">This student has no attendance records yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendanceHistory.map((record, idx) => {
                      const statusInfo = ATTENDANCE_STATUS[record.status] || ATTENDANCE_STATUS.present;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:shadow-md transition-all"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">
                              {formatDisplayDate(record.date)}
                            </p>
                            {record.remarks && (
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {record.remarks}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusInfo.bg}`}>
                              <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                              <span className={`text-xs font-semibold ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <button
                              onClick={() => handleEditRecord(record)}
                              className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                              title="Edit record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Edit Record Modal */}
      <AnimatePresence>
        {editingRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setEditingRecord(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                <h2 className="text-lg font-bold text-white">Edit Attendance Record</h2>
                <p className="text-sm text-indigo-200">{formatDisplayDate(editingRecord.date)}</p>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(ATTENDANCE_STATUS).map((statusOption) => {
                      const Icon = statusOption.icon;
                      const isSelected = editingRecord.status === statusOption.value;
                      return (
                        <button
                          key={statusOption.value}
                          onClick={() => setEditingRecord({ ...editingRecord, status: statusOption.value })}
                          className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            isSelected
                              ? `${statusOption.bg} ${statusOption.color} ring-2 ring-offset-2 ring-${statusOption.value === 'present' ? 'emerald' : statusOption.value === 'absent' ? 'red' : statusOption.value === 'late' ? 'amber' : 'indigo'}-400`
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {statusOption.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Remarks</label>
                  <textarea
                    value={editingRecord.remarks || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, remarks: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Add remarks..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 px-6 py-4 border-t bg-slate-50">
                <button
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-white transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRecord}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-md"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherAttendance;