// pages/teacher/TeacherAttendance.jsx
// ─── Complete Teacher Attendance Management System ───────────────────────────
// Features: Take attendance for class, update existing records, view attendance history
// Connects to: POST /teacher/attendance (create), PATCH /teacher/attendance/:id (update)
// Backend expects: studentId (UUID), date (YYYY-MM-DD), status (present|absent|late|excused)

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle,
  Loader2, RefreshCw, Search, Filter, ChevronDown, Edit2,
  Save, X, Eye, UserCheck, UserX, Clock as ClockIcon,
  GraduationCap, BookOpen, ChevronLeft, ChevronRight,
  Download, Printer, FileText, Activity,
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

const ATTENDANCE_STATUS = {
  present: { value: 'present', label: 'Present', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
  absent: { value: 'absent', label: 'Absent', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  late: { value: 'late', label: 'Late', color: 'text-amber-600', bg: 'bg-amber-50', icon: ClockIcon },
  excused: { value: 'excused', label: 'Excused', color: 'text-blue-600', bg: 'bg-blue-50', icon: AlertCircle },
};

// ─────────────────────────────────────────────────────────────
// STUDENT ATTENDANCE ROW COMPONENT
// ─────────────────────────────────────────────────────────────
const StudentAttendanceRow = ({ student, status, onStatusChange, remarks, onRemarksChange, isSubmitting }) => {
  const [showRemarks, setShowRemarks] = useState(false);
  
  return (
    <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-all">
      {/* Student Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {student.firstName?.[0]}{student.lastName?.[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-800">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-xs text-slate-400">ID: {student.studentId || student.id?.slice(-6)}</p>
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
                  ? `${statusOption.bg} ${statusOption.color} ring-2 ring-offset-1 ring-${statusOption.value === 'present' ? 'emerald' : statusOption.value === 'absent' ? 'red' : statusOption.value === 'late' ? 'amber' : 'blue'}-300`
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{statusOption.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Remarks */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowRemarks(!showRemarks)}
          className="p-2 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
          title="Add remarks"
        >
          <FileText className="w-4 h-4" />
        </button>
        
        {showRemarks && (
          <div className="absolute right-0 top-full mt-2 z-10 bg-white rounded-lg shadow-lg border border-slate-200 p-2 min-w-[200px]">
            <textarea
              value={remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              placeholder="Add remarks (optional)..."
              rows="2"
              className="w-full px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>
    </div>
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
  
  // ── Fetch Assigned Classes with Students ─────────────────────────────
  const fetchAssignedClasses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await teacherApi.getAssignedClasses();
      const data = response?.data?.data || response?.data || response;
      
      // Process the assigned classes to extract class-arm info and students
      const classesWithArms = [];
      if (Array.isArray(data)) {
        for (const item of data) {
          const classArm = {
            id: item.arm?.id || item.classArmId || item.id,
            name: `${item.class?.name || item.className || 'Class'} - ${item.arm?.name || item.armName || 'Arm'}`,
            students: item.students || item.class?.students || item.arm?.students || [],
          };
          classesWithArms.push(classArm);
        }
      }
      setAssignedClasses(classesWithArms);
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
      // Try to get students from the already loaded class data first
      const selectedClass = assignedClasses.find(c => c.id === selectedClassArmId);
      if (selectedClass?.students?.length > 0) {
        setStudents(selectedClass.students);
      } else {
        // If students not loaded, try to fetch them
        // Note: You may need to implement a specific endpoint for this
        // For now, we'll use a placeholder
        setStudents([]);
        toast.info('Student list not available. Please ensure students are assigned to this class.');
      }
      
      // Reset attendance records
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
  
  // ── Check Existing Attendance for selected date ────────────
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
      
      // Pre-fill attendance records for students
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
      // If no records exist, initialize all as present
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
  
  // ── Handle Class Arm Selection ────────────────────────────
  const handleClassSelection = (classArmId) => {
    setSelectedClassArmId(classArmId);
    const selected = assignedClasses.find(c => c.id === classArmId);
    setSelectedClassArmName(selected?.name || '');
  };
  
  // ── Handle Status Change ───────────────────────────────────
  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };
  
  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };
  
  // ── Submit Attendance ──────────────────────────────────────
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
      // Process each student's attendance
      for (const student of students) {
        const record = attendanceRecords[student.id];
        if (!record) continue;
        
        try {
          if (record.id) {
            // Update existing record - Backend expects status and optional remarks
            await teacherApi.updateAttendance(record.id, {
              status: record.status,
              remarks: record.remarks || undefined,
            });
            successCount++;
          } else {
            // Create new record - Backend expects studentId, date, status, optional remarks
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
        toast.success(`Attendance saved for ${successCount} student${successCount !== 1 ? 's' : ''}`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to save for ${errorCount} student${errorCount !== 1 ? 's' : ''}: ${errors.join(', ')}`);
      }
      
      // Refresh existing records
      await checkExistingAttendance();
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };
  
  // ── View Attendance History for a Student ──────────────────
  const viewStudentHistory = async (student) => {
    setSelectedStudent(student);
    setShowHistory(true);
    
    try {
      const response = await teacherApi.viewAttendance({
        studentId: student.id,
      });
      
      const history = response?.data?.data || response?.data || [];
      setAttendanceHistory(Array.isArray(history) ? history.sort((a, b) => new Date(b.date) - new Date(a.date)) : []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load attendance history');
      setAttendanceHistory([]);
    }
  };
  
  // ── Edit Existing Record ───────────────────────────────────
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
  
  // ── Refresh Data ───────────────────────────────────────────
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
  
  // ── Summary Stats ──────────────────────────────────────────
  const getAttendanceSummary = () => {
    const records = Object.values(attendanceRecords);
    const present = records.filter(r => r?.status === 'present').length;
    const absent = records.filter(r => r?.status === 'absent').length;
    const late = records.filter(r => r?.status === 'late').length;
    const excused = records.filter(r => r?.status === 'excused').length;
    
    return { present, absent, late, excused, total: records.length };
  };
  
  const summary = getAttendanceSummary();
  
  // ── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500">Loading your classes...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Attendance Management</h1>
                <p className="text-xs text-slate-500">Record and track student attendance</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Selection Panel */}
        <div className="bg-white rounded-xl border shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Class Arm Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Class <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClassArmId}
                onChange={(e) => handleClassSelection(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a class...</option>
                {assignedClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              {assignedClasses.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No classes assigned yet</p>
              )}
            </div>
            
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Students List - Take Attendance */}
        {selectedClassArmId && (
          <>
            {/* Summary Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{summary.total}</p>
                <p className="text-xs text-slate-500">Total Students</p>
              </div>
              <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{summary.present}</p>
                <p className="text-xs text-emerald-600">Present</p>
              </div>
              <div className="bg-red-50 rounded-lg border border-red-200 p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
                <p className="text-xs text-red-600">Absent</p>
              </div>
              <div className="bg-amber-50 rounded-lg border border-amber-200 p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{summary.late}</p>
                <p className="text-xs text-amber-600">Late</p>
              </div>
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{summary.excused}</p>
                <p className="text-xs text-blue-600">Excused</p>
              </div>
            </div>
            
            {/* Students List */}
            {fetchingStudents ? (
              <div className="flex items-center justify-center py-12 bg-white rounded-xl border">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">No students found</h3>
                <p className="text-slate-400">No students are assigned to this class yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-800">Student Attendance</h2>
                    <p className="text-xs text-slate-500">
                      {selectedClassArmName} • {formatDisplayDate(selectedDate)} • {students.length} students
                    </p>
                  </div>
                  <button
                    onClick={handleSubmitAttendance}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {submitting ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
                
                <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                  {students.map((student) => (
                    <div key={student.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <StudentAttendanceRow
                          student={student}
                          status={attendanceRecords[student.id]?.status || 'present'}
                          onStatusChange={(status) => handleStatusChange(student.id, status)}
                          remarks={attendanceRecords[student.id]?.remarks || ''}
                          onRemarksChange={(remarks) => handleRemarksChange(student.id, remarks)}
                          isSubmitting={submitting}
                        />
                        
                        {/* History Button */}
                        <button
                          onClick={() => viewStudentHistory(student)}
                          className="p-2 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                          title="View attendance history"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {!selectedClassArmId && (
          <div className="text-center py-16 bg-white rounded-xl border">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">Select a Class</h3>
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Attendance History
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-6">
                {attendanceHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No attendance records found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendanceHistory.map((record) => {
                      const statusInfo = ATTENDANCE_STATUS[record.status] || ATTENDANCE_STATUS.present;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-800">
                              {formatDisplayDate(record.date)}
                            </p>
                            {record.remarks && (
                              <p className="text-xs text-slate-500 mt-1">{record.remarks}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusInfo.bg}`}>
                              <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                              <span className={`text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <button
                              onClick={() => handleEditRecord(record)}
                              className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg transition-colors"
                              title="Edit record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
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
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingRecord(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-bold text-slate-800">Edit Attendance Record</h2>
                <p className="text-sm text-slate-500">{formatDisplayDate(editingRecord.date)}</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.values(ATTENDANCE_STATUS).map((statusOption) => {
                      const Icon = statusOption.icon;
                      const isSelected = editingRecord.status === statusOption.value;
                      return (
                        <button
                          key={statusOption.value}
                          onClick={() => setEditingRecord({ ...editingRecord, status: statusOption.value })}
                          className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            isSelected
                              ? `${statusOption.bg} ${statusOption.color} ring-2 ring-offset-1`
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                  <textarea
                    value={editingRecord.remarks || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, remarks: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add remarks..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 px-6 py-4 border-t bg-slate-50">
                <button
                  onClick={() => setEditingRecord(null)}
                  className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRecord}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
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