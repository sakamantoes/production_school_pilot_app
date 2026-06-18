// pages/teacher/TeacherClassManagement.jsx
// ─── Professional Teacher Class Management Component ───────────────────────────
// Features: View assigned classes, subjects, and students with full CRUD operations
// Updated to use teacherApi.getStudents() for fetching students
// FIXED: Student status detection uses user.isActive from API response

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BookOpen, Users, GraduationCap, Search, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, Eye, UserPlus, Mail, Phone,
  MapPin, Calendar, Clock, Award, Star, TrendingUp, UserCheck,
  BookMarked, FolderOpen, FolderClosed, CheckCircle, XCircle,
  MoreVertical, Edit, Trash2, Filter, Download, Printer,
  School, Briefcase, Activity, BarChart3, PieChart,
  User, MessageSquare, FileText, AlertCircle, ZoomIn,
  Grid3x3, List, Maximize2, Minimize2, Sparkles, Crown, X
} from 'lucide-react';
import { teacherApi } from '../../services/TeacherApi';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [res, res.data, res.data?.data, ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const c of candidates) { if (Array.isArray(c)) return c; }
  return [];
};

// ─────────────────────────────────────────────────────────────
// STATS CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const StatsCard = ({ title, value, icon: Icon, color, bgColor, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ duration: 0.2 }}
    className="group relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-full -mr-16 -mt-16" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-800 mb-1">{value}</p>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
// CLASS CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const ClassCard = ({ classItem, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(classItem)}
      className="group cursor-pointer bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <School className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">
              {classItem.name || `${classItem.class?.name} - ${classItem.arm?.name}`}
            </h3>
            <p className="text-xs text-slate-500 font-mono">ID: {classItem.id?.slice(0, 8)}</p>
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Users className="w-4 h-4 text-emerald-500" />
          <span>{classItem.studentCount || classItem._count?.students || 0} Students</span>
        </div>
        {classItem.teacher && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4 text-emerald-500" />
            <span>Teacher: {classItem.teacher.name}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// SUBJECT CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const SubjectCard = ({ subject, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(subject)}
      className="group cursor-pointer bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
              {subject.name}
            </h3>
            <p className="text-xs text-slate-500">Code: {subject.code || 'N/A'}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <GraduationCap className="w-4 h-4 text-blue-500" />
          <span>{subject.className || subject.class?.name || 'N/A'}</span>
        </div>
        {subject.creditHours && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{subject.creditHours} Credit Hours</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// STUDENT CARD COMPONENT - FIXED status detection
// ─────────────────────────────────────────────────────────────
const StudentCard = ({ student, onClick }) => {
  // Handle both API response formats (user nested or flat)
  const firstName = student.user?.firstName || student.firstName || '';
  const lastName = student.user?.lastName || student.lastName || '';
  const email = student.user?.email || student.email || '';
  const studentId = student.studentId || student.id?.slice(0, 8) || '';
  // ─── FIX: Status is in user.isActive ───
  const isActive = student.user?.isActive ?? student.isActive ?? true;
  const status = isActive ? 'active' : 'inactive';
  
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(student)}
      className="group cursor-pointer bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {firstName?.[0] || lastName?.[0] || 'S'}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            isActive ? 'bg-emerald-500' : 'bg-red-500'
          }`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 group-hover:text-purple-600 transition-colors truncate">
            {firstName} {lastName}
          </h3>
          <p className="text-xs text-slate-500 font-mono">ID: {studentId}</p>
          {email && (
            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
              <Mail className="w-3 h-3" />
              <span className="truncate">{email}</span>
            </div>
          )}
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// STUDENT DETAILS MODAL - FIXED status detection
// ─────────────────────────────────────────────────────────────
const StudentDetailsModal = ({ student, isOpen, onClose }) => {
  if (!isOpen || !student) return null;

  // Handle both API response formats
  const firstName = student.user?.firstName || student.firstName || '';
  const lastName = student.user?.lastName || student.lastName || '';
  const email = student.user?.email || student.email || '';
  const phone = student.user?.phone || student.phone || '';
  const studentId = student.studentId || student.id?.slice(0, 8) || '';
  // ─── FIX: Status is in user.isActive ───
  const isActive = student.user?.isActive ?? student.isActive ?? true;
  const status = isActive ? 'active' : 'inactive';

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
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Student Details</h2>
                <p className="text-sm text-white/80">Complete student information</p>
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
          {/* Profile Section */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50/50 to-transparent rounded-xl">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {firstName?.[0] || lastName?.[0] || 'S'}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xl">
                {firstName} {lastName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {studentId}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {email && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Mail className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-700">{email}</p>
                </div>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Phone className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm font-medium text-slate-700">{phone}</p>
                </div>
              </div>
            )}
            {student.address && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl col-span-2">
                <MapPin className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs text-slate-500">Address</p>
                  <p className="text-sm font-medium text-slate-700">{student.address}</p>
                </div>
              </div>
            )}
            {student.dateOfBirth && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Calendar className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs text-slate-500">Date of Birth</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(student.dateOfBirth)}</p>
                </div>
              </div>
            )}
            {student.enrollmentDate && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Calendar className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-xs text-slate-500">Enrollment Date</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(student.enrollmentDate)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-mono">
              Student ID: {student.id}
            </p>
            {student.createdAt && (
              <p className="text-xs text-slate-400 mt-1">
                Joined: {formatDate(student.createdAt)}
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
const TeacherClassManagement = () => {
  // Data states
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('classes'); // classes, subjects, students
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection states
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  // Modal state
  const [showStudentModal, setShowStudentModal] = useState(false);
  
  // Statistics
  const [statistics, setStatistics] = useState({
    totalClasses: 0,
    totalSubjects: 0,
    totalStudents: 0,
    activeStudents: 0,
  });

  // ── Fetch Assigned Classes ─────────────────────────────
  const fetchAssignedClasses = useCallback(async () => {
    try {
      const response = await teacherApi.getAssignedClasses();
      const data = response?.data?.data || response?.data || response;
      
      let classes = [];
      if (Array.isArray(data)) {
        classes = data.map(item => ({
          id: item.arm?.id || item.classArmId || item.id,
          name: `${item.class?.name || 'Class'} - ${item.arm?.name || 'Arm'}`,
          classId: item.class?.id,
          armId: item.arm?.id,
          studentCount: item._count?.students || item.studentCount || 0,
          teacher: item.teacher,
        }));
      }
      
      setAssignedClasses(classes);
      setStatistics(prev => ({ ...prev, totalClasses: classes.length }));
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load assigned classes');
    }
  }, []);

  // ── Fetch Assigned Subjects ────────────────────────────
  const fetchAssignedSubjects = useCallback(async () => {
    try {
      const response = await teacherApi.getAssignedSubjects();
      const data = response?.data?.data || response?.data || response;
      
      let subjects = [];
      if (Array.isArray(data)) {
        subjects = data.map(item => ({
          id: item.subject?.id || item.id,
          name: item.subject?.name || item.name,
          code: item.subject?.code || item.code,
          creditHours: item.subject?.creditHours || item.creditHours,
          className: item.class?.name,
        }));
      }
      
      setAssignedSubjects(subjects);
      setStatistics(prev => ({ ...prev, totalSubjects: subjects.length }));
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load assigned subjects');
    }
  }, []);

  // ── Fetch Students using teacherApi.getStudents() ──────
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await teacherApi.getStudents();
      const data = toArray(response, 'data', 'students');
      
      // Handle both response formats: direct array or nested in data
      let studentsData = data;
      if (!Array.isArray(studentsData)) {
        studentsData = response?.data?.data || response?.data || response || [];
        if (!Array.isArray(studentsData)) {
          studentsData = [];
        }
      }
      
      setStudents(studentsData);
      setFilteredStudents(studentsData);
      
      // ─── FIX: Count active students using user.isActive ───
      const activeCount = studentsData.filter(s => {
        const isActive = s.user?.isActive ?? s.isActive ?? true;
        return isActive;
      }).length;
      
      setStatistics(prev => ({ 
        ...prev, 
        totalStudents: studentsData.length,
        activeStudents: activeCount
      }));
      
      if (studentsData.length > 0) {
        toast.success(`Loaded ${studentsData.length} students`);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error(error?.response?.data?.message || 'Failed to load students');
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Filter Students by Search Term ─────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = students.filter(student => {
      const firstName = student.user?.firstName || student.firstName || '';
      const lastName = student.user?.lastName || student.lastName || '';
      const fullName = `${firstName} ${lastName}`.toLowerCase();
      const studentId = (student.studentId || '').toLowerCase();
      const email = (student.user?.email || student.email || '').toLowerCase();
      return fullName.includes(term) || studentId.includes(term) || email.includes(term);
    });
    
    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [searchTerm, students]);

  // ── Handle Class Selection ────────────────────────────
  const handleClassSelect = (classItem) => {
    setSelectedClass(classItem);
    setSelectedSubject(null);
    setActiveTab('students');
    // Fetch all students when a class is selected
    fetchStudents();
    toast.success(`Showing students for ${classItem.name}`);
  };

  // ── Handle Subject Selection ───────────────────────────
  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setSelectedClass(null);
    toast.success(`Selected ${subject.name}`);
  };

  // ── Handle Student Selection ───────────────────────────
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  // ── Refresh All Data ───────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAssignedClasses(),
      fetchAssignedSubjects(),
      activeTab === 'students' && fetchStudents()
    ]);
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  // ── Pagination Logic ───────────────────────────────────
  const getPaginatedData = () => {
    let data = [];
    if (activeTab === 'classes') data = assignedClasses;
    else if (activeTab === 'subjects') data = assignedSubjects;
    else data = filteredStudents;
    
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginated = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    return { data: paginated, totalPages, totalItems: data.length };
  };

  const { data: paginatedData, totalPages, totalItems } = getPaginatedData();

  // ── Initial Load ───────────────────────────────────────
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAssignedClasses(),
        fetchAssignedSubjects()
      ]);
      setLoading(false);
    };
    loadInitialData();
  }, [fetchAssignedClasses, fetchAssignedSubjects]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 border-b border-emerald-500/20 sticky top-0 z-20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Class Management</h1>
                <p className="text-sm text-emerald-200 mt-0.5">Manage your classes, subjects, and students</p>
              </div>
            </div>
            
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Assigned Classes"
            value={statistics.totalClasses}
            icon={School}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <StatsCard
            title="Assigned Subjects"
            value={statistics.totalSubjects}
            icon={BookOpen}
            color="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatsCard
            title="Total Students"
            value={statistics.totalStudents}
            icon={Users}
            color="text-purple-600"
            bgColor="bg-purple-50"
            subtitle={selectedClass ? `in ${selectedClass.name}` : 'All assigned students'}
          />
          <StatsCard
            title="Active Students"
            value={statistics.activeStudents}
            icon={UserCheck}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('classes')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
                activeTab === 'classes'
                  ? 'text-emerald-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <School className="w-4 h-4" />
              <span>My Classes</span>
              {activeTab === 'classes' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
                activeTab === 'subjects'
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>My Subjects</span>
              {activeTab === 'subjects' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                />
              )}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('students');
                // Fetch students when switching to students tab
                if (students.length === 0) {
                  fetchStudents();
                }
              }}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
                activeTab === 'students'
                  ? 'text-purple-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Students</span>
              {activeTab === 'students' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
                />
              )}
            </button>
          </div>

          {/* Selected Class Indicator */}
          {activeTab === 'students' && selectedClass && (
            <div className="px-6 py-3 bg-gradient-to-r from-purple-50/50 to-transparent border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-slate-600">
                  Showing students for: <span className="font-semibold text-purple-700">{selectedClass.name}</span>
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedClass(null);
                  setActiveTab('classes');
                }}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                Change Class
              </button>
            </div>
          )}
        </div>

        {/* Search and View Controls */}
        {(activeTab === 'students' || activeTab === 'classes' || activeTab === 'subjects') && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder={`Search ${activeTab === 'students' ? 'students by name, ID, or email' : activeTab === 'subjects' ? 'subjects by name or code' : 'classes by name'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white shadow-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                  title="Grid view"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Display */}
        {loading && activeTab === 'students' ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
              <p className="text-slate-500">Loading students...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Classes Grid/List */}
            {activeTab === 'classes' && (
              <>
                {assignedClasses.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                    <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                      <School className="w-12 h-12 text-emerald-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No classes assigned</h3>
                    <p className="text-slate-400">You haven't been assigned to any classes yet.</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedData.map((classItem, index) => (
                      <ClassCard
                        key={classItem.id || index}
                        classItem={classItem}
                        onClick={handleClassSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    {paginatedData.map((classItem, index) => (
                      <motion.div
                        key={classItem.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleClassSelect(classItem)}
                        className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <School className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{classItem.name}</p>
                            <p className="text-xs text-slate-500">ID: {classItem.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Users className="w-4 h-4" />
                            <span>{classItem.studentCount || 0}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Subjects Grid/List */}
            {activeTab === 'subjects' && (
              <>
                {assignedSubjects.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                    <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-12 h-12 text-blue-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No subjects assigned</h3>
                    <p className="text-slate-400">You haven't been assigned to any subjects yet.</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedData.map((subject, index) => (
                      <SubjectCard
                        key={subject.id || index}
                        subject={subject}
                        onClick={handleSubjectSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    {paginatedData.map((subject, index) => (
                      <motion.div
                        key={subject.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSubjectSelect(subject)}
                        className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{subject.name}</p>
                            <p className="text-xs text-slate-500">Code: {subject.code || 'N/A'}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Students Grid/List - FIXED status display */}
            {activeTab === 'students' && (
              <>
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                    <div className="w-24 h-24 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-12 h-12 text-purple-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No students found</h3>
                    <p className="text-slate-400">
                      {searchTerm ? 'No students match your search criteria.' : 'You have no students assigned to you yet.'}
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedData.map((student, index) => (
                      <StudentCard
                        key={student.id || index}
                        student={student}
                        onClick={handleStudentSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    {paginatedData.map((student, index) => {
                      const firstName = student.user?.firstName || student.firstName || '';
                      const lastName = student.user?.lastName || student.lastName || '';
                      const email = student.user?.email || student.email || '';
                      const studentId = student.studentId || student.id?.slice(0, 8) || '';
                      // ─── FIX: Status is in user.isActive ───
                      const isActive = student.user?.isActive ?? student.isActive ?? true;
                      const status = isActive ? 'active' : 'inactive';
                      
                      return (
                        <motion.div
                          key={student.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleStudentSelect(student)}
                          className="flex items-center justify-between p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                                {firstName?.[0] || lastName?.[0] || 'S'}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                isActive ? 'bg-emerald-500' : 'bg-red-500'
                              }`} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {firstName} {lastName}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">{studentId}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {email && (
                              <div className="hidden md:flex items-center gap-1 text-xs text-slate-500">
                                <Mail className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{email}</span>
                              </div>
                            )}
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              isActive 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {status}
                            </div>
                            <Eye className="w-4 h-4 text-slate-400" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 mt-6 bg-white rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={12}>12 / page</option>
                    <option value={24}>24 / page</option>
                    <option value={48}>48 / page</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
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
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'text-slate-600 hover:bg-emerald-50'
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
                    className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Student Details Modal */}
      <StudentDetailsModal
        student={selectedStudent}
        isOpen={showStudentModal}
        onClose={() => {
          setShowStudentModal(false);
          setSelectedStudent(null);
        }}
      />
    </div>
  );
};

export default TeacherClassManagement;