// pages/teacher/TeacherTimeTable.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  GraduationCap,
  Bell,
  AlertCircle,
  XCircle,
  TrendingUp,
  Target,
  Sparkles,
  Info,
  Building,
  Calendar as CalendarIcon,
  Hash,
  FileText
} from 'lucide-react';
import teacherApi from '../../services/teacherApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDayName = (index) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[index];
};

const getShortDayName = (index) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days[index];
};

const formatTime = (time) => {
  if (!time) return '—';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const getCurrentWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
};

const formatDateRange = (start, end) => {
  const options = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${end.getFullYear()}`;
};

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

// ─── Time slot component ──────────────────────────────────────────────────────
const TimeSlot = ({ time, label }) => (
  <div className="flex flex-col items-center gap-1 py-2">
    <span className="text-xs font-bold text-slate-600">{formatTime(time)}</span>
    {label && <span className="text-[10px] text-slate-400">{label}</span>}
  </div>
);

// ─── Class card component ─────────────────────────────────────────────────────
const ClassCard = ({ classItem, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getSubjectColor = (subjectName) => {
    const colors = [
      { bg: 'from-blue-500 to-indigo-600', border: 'border-blue-200', text: 'text-blue-700', light: 'bg-blue-50' },
      { bg: 'from-emerald-500 to-teal-600', border: 'border-emerald-200', text: 'text-emerald-700', light: 'bg-emerald-50' },
      { bg: 'from-purple-500 to-pink-600', border: 'border-purple-200', text: 'text-purple-700', light: 'bg-purple-50' },
      { bg: 'from-orange-500 to-red-600', border: 'border-orange-200', text: 'text-orange-700', light: 'bg-orange-50' },
      { bg: 'from-cyan-500 to-blue-600', border: 'border-cyan-200', text: 'text-cyan-700', light: 'bg-cyan-50' },
    ];
    const index = (subjectName?.length || 0) % colors.length;
    return colors[index];
  };
  
  const color = getSubjectColor(classItem.subject?.name);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${
        isHovered ? 'shadow-xl border-white' : 'shadow-md border-white/50'
      } ${color.light}`}
    >
      <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity" />
      <div className="p-3 relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-800 mb-1 line-clamp-2">
              {classItem.subject?.name || 'Subject'}
            </h4>
            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
              <Users className="w-3 h-3" />
              <span>{classItem.timetable?.class?.name || classItem.className || 'Class'} 
                {classItem.timetable?.arm?.name && ` - ${classItem.timetable?.arm?.name}`}
              </span>
            </div>
          </div>
          {isHovered && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center"
            >
              <Sparkles className="w-3 h-3 text-slate-600" />
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-slate-600 text-xs mt-2">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}</span>
          </div>
          {classItem.room && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{classItem.room}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Empty state component ────────────────────────────────────────────────────
const EmptySlot = ({ day, time }) => (
  <div className="h-full min-h-[100px] rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 p-3 transition-all hover:border-slate-300">
    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
      <Clock className="w-4 h-4 text-slate-400" />
    </div>
    <p className="text-xs text-slate-400 text-center">No class scheduled</p>
    <p className="text-[9px] text-slate-300">{formatTime(time)}</p>
  </div>
);

// ─── Class details modal with full API data ───────────────────────────────────
const ClassDetailsModal = ({ isOpen, onClose, classItem }) => {
  if (!isOpen || !classItem) return null;
  
  // Extract all available data from the classItem structure
  const timetable = classItem.timetable || {};
  const subject = classItem.subject || {};
  const classData = timetable.class || {};
  const arm = timetable.arm || {};
  
  // Format additional info
  const hasSessionInfo = timetable.session || timetable.term;
  const hasNotes = classItem.note;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-20 -mb-20" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{subject.name || 'Class Details'}</h2>
                    <p className="text-xs text-white/80">Complete session information</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Subject Section */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <GraduationCap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-800 mb-1">Subject Information</p>
                  <p className="text-base font-bold text-slate-800">{subject.name || 'N/A'}</p>
                  {subject.id && (
                    <p className="text-xs text-slate-500 mt-1 font-mono">ID: {subject.id.slice(0, 8)}...</p>
                  )}
                </div>
              </div>
              
              {/* Class & Schedule Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-slate-500" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Class Details</p>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{classData.name || 'N/A'}</p>
                  {arm?.name && (
                    <p className="text-xs text-slate-600 mt-1">Arm: {arm.name}</p>
                  )}
                  {classData.id && (
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">ID: {classData.id.slice(0, 8)}...</p>
                  )}
                </div>
                
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Time & Schedule</p>
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {getDayName(classItem.dayOfWeek)}
                  </p>
                  {classItem.room && (
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Room: {classItem.room}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Timetable Information */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="w-4 h-4 text-purple-600" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-purple-800">Timetable Details</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-purple-600 font-semibold">Title</p>
                    <p className="text-sm font-medium text-slate-700">{timetable.title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-purple-600 font-semibold">Status</p>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold mt-1">
                      {timetable.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  {timetable.session && (
                    <div>
                      <p className="text-[10px] text-purple-600 font-semibold">Session</p>
                      <p className="text-sm font-medium text-slate-700">{timetable.session.name || 'N/A'}</p>
                    </div>
                  )}
                  {timetable.term && (
                    <div>
                      <p className="text-[10px] text-purple-600 font-semibold">Term</p>
                      <p className="text-sm font-medium text-slate-700">{timetable.term.name || 'N/A'}</p>
                    </div>
                  )}
                </div>
                {timetable.createdAt && (
                  <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-purple-200">
                    Created: {new Date(timetable.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              {/* Additional Notes */}
              {hasNotes && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">Notes</p>
                  </div>
                  <p className="text-sm text-slate-700">{classItem.note}</p>
                </div>
              )}
              
              {/* Meta Information */}
              <div className="p-3 rounded-xl bg-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-3 h-3 text-slate-500" />
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Meta Information</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                  <div>
                    <span className="font-semibold">Schedule ID:</span> {classItem.id?.slice(0, 12)}...
                  </div>
                  <div>
                    <span className="font-semibold">Teacher ID:</span> {classItem.teacherId?.slice(0, 12)}...
                  </div>
                  {classItem.createdAt && (
                    <div>
                      <span className="font-semibold">Created:</span> {new Date(classItem.createdAt).toLocaleString()}
                    </div>
                  )}
                  {classItem.updatedAt && classItem.updatedAt !== classItem.createdAt && (
                    <div>
                      <span className="font-semibold">Updated:</span> {new Date(classItem.updatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all"
                >
                  Got it
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Stats card for summary ───────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, gradient }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${gradient} shadow-lg`}
  >
    <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
      <Icon className="w-full h-full" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center`}>
          <Icon className={`w-4 h-4 text-white`} />
        </div>
        <span className="text-white/80 text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-3xl font-black text-white mb-1`}>{value}</p>
      <p className="text-white/60 text-xs">Current schedule</p>
    </div>
  </motion.div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const TeacherTimeTable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [viewMode, setViewMode] = useState('week');
  const [displayWeekStart, setDisplayWeekStart] = useState(() => getCurrentWeekRange().start);
  
  const fetchTimetable = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await teacherApi.getTimetable();
      // Handle the API response structure properly
      const data = response?.data?.data || response?.data || [];
      setTimetable(data);
      if (!isRefresh) toast.success('Timetable loaded successfully');
    } catch (error) {
      console.error('Error fetching timetable:', error);
      toast.error(error?.response?.data?.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);
  
  // Generate time slots (8 AM to 4 PM)
  const timeSlots = [];
  for (let hour = 8; hour <= 16; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    timeSlots.push({ startTime, endTime, label: `${hour}:00 - ${hour + 1}:00` });
  }
  
  // Organize timetable by day (0 = Monday, 6 = Sunday)
  const timetableByDay = Array(7).fill().map(() => []);
  
  timetable.forEach(classItem => {
    const dayOfWeek = classItem.dayOfWeek;
    // Adjust for Sunday (0) to Monday (0) mapping
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    if (adjustedDay >= 0 && adjustedDay <= 6) {
      timetableByDay[adjustedDay].push(classItem);
    }
  });
  
  // Sort classes by start time for each day
  timetableByDay.forEach(day => {
    day.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  });
  
  // Generate dates for the week
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(displayWeekStart);
    date.setDate(displayWeekStart.getDate() + i);
    weekDates.push(date);
  }
  
  const navigateWeek = (direction) => {
    const newDate = new Date(displayWeekStart);
    newDate.setDate(displayWeekStart.getDate() + (direction * 7));
    setDisplayWeekStart(newDate);
  };
  
  const goToCurrentWeek = () => {
    setDisplayWeekStart(getCurrentWeekRange().start);
  };
  
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  // Stats
  const totalClasses = timetable.length;
  const uniqueSubjects = new Set(timetable.map(c => c.subject?.id)).size;
  const uniqueClasses = new Set(timetable.map(c => c.timetable?.class?.id || c.classId)).size;
  const todayClasses = timetable.filter(c => {
    const today = new Date().getDay();
    // Convert JS day (0=Sunday, 1=Monday) to our dayOfWeek (1=Monday, 2=Tuesday...)
    const currentDay = today === 0 ? 7 : today;
    return c.dayOfWeek === currentDay;
  }).length;
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-blue-500" />
        </motion.div>
        <p className="text-sm font-medium text-slate-500">Loading your timetable...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden px-6 py-8 mb-6"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 mb-3 backdrop-blur-sm">
                <Calendar className="w-3.5 h-3.5 text-blue-300" />
                <span className="text-white/80 text-xs font-semibold">Weekly Schedule</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">My Timetable</h1>
              <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
                <span>Week {getWeekNumber(displayWeekStart)}</span>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span>{formatDateRange(displayWeekStart, weekDates[6])}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1 backdrop-blur-sm">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'week'
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    viewMode === 'day'
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Day
                </button>
              </div>
              
              <button
                onClick={() => fetchTimetable(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToCurrentWeek}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all"
              >
                Current Week
              </button>
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="hidden sm:flex items-center gap-4 text-white/60 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Ongoing</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Upcoming</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={BookOpen}
            label="Total Classes"
            value={totalClasses}
            gradient="from-blue-600 to-indigo-600"
          />
          <StatCard
            icon={GraduationCap}
            label="Subjects"
            value={uniqueSubjects}
            gradient="from-emerald-600 to-teal-600"
          />
          <StatCard
            icon={Users}
            label="Class Groups"
            value={uniqueClasses}
            gradient="from-purple-600 to-pink-600"
          />
          <StatCard
            icon={Clock}
            label="Today's Classes"
            value={todayClasses}
            gradient="from-orange-600 to-red-600"
          />
        </div>
        
        {/* Timetable Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Time column header */}
              <div className="flex border-b border-slate-200 bg-slate-50/50">
                <div className="w-24 flex-shrink-0 px-3 py-4 border-r border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-center">Time</p>
                </div>
                {weekDates.map((date, idx) => (
                  <div key={idx} className="flex-1 px-3 py-4 text-center border-r border-slate-200 last:border-r-0">
                    <p className={`text-xs font-bold ${isToday(date) ? 'text-blue-600' : 'text-slate-700'}`}>
                      {getShortDayName(idx)}
                    </p>
                    <p className={`text-[10px] ${isToday(date) ? 'text-blue-500 font-semibold' : 'text-slate-400'}`}>
                      {date.getDate()}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Time slots rows */}
              {timeSlots.map((slot, slotIdx) => (
                <div key={slotIdx} className="flex border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  {/* Time column */}
                  <div className="w-24 flex-shrink-0 px-3 py-4 border-r border-slate-100 bg-slate-50/30">
                    <TimeSlot time={slot.startTime} label={slot.label} />
                  </div>
                  
                  {/* Classes for each day at this time */}
                  {weekDates.map((date, dayIdx) => {
                    const dayClasses = timetableByDay[dayIdx] || [];
                    const classAtTime = dayClasses.find(c => c.startTime === slot.startTime);
                    
                    return (
                      <div key={dayIdx} className="flex-1 px-2 py-2 min-h-[100px]">
                        {classAtTime ? (
                          <ClassCard
                            classItem={classAtTime}
                            onClick={() => setSelectedClass(classAtTime)}
                          />
                        ) : (
                          <EmptySlot day={dayIdx} time={slot.startTime} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-800">Schedule Information</h3>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                Classes are displayed according to your assigned schedule
              </p>
              <p className="text-xs text-slate-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                Click on any class card to view detailed session information
              </p>
              <p className="text-xs text-slate-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
                Use the navigation buttons to browse different weeks
              </p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800">Quick Tips</h3>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" />
                Arrive at least 5 minutes before class starts
              </p>
              <p className="text-xs text-slate-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" />
                Prepare lesson notes before each session
              </p>
              <p className="text-xs text-slate-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" />
                Contact admin for any schedule conflicts
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Class Details Modal with full data display */}
      <ClassDetailsModal
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        classItem={selectedClass}
      />
    </div>
  );
};

export default TeacherTimeTable;