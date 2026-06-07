// dashboards/school-admin/StudentDetail.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Users,
  Award,
  Star,
  PowerOff,
  Edit2,
  GraduationCap,
  CheckCircle,
  XCircle,
  MapPin,
  Briefcase,
  Clock,
  Loader2,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Shield,
  Smartphone,
  AtSign,
  FileText,
  PieChart,
  TrendingUp,
  Calendar as CalendarIcon,
  ExternalLink,
  CreditCard,
  Activity,
  Home,
  School,
  BookMarked,
} from "lucide-react";
import { studentAPI, classAPI, sessionAPI, termAPI } from "../../services/schoolApi";

// ─────────────────────────────────────────────────────────────
// HELPERS
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

const normaliseStudent = (s) => {
  const u = s.user || s;
  // Get current enrollment
  const enrollments = Array.isArray(s.enrollments) ? s.enrollments : [];
  const currentEnrollment = enrollments.find(e => e.status === "ACTIVE" || e.status === "active") || enrollments[0];
  const classArm = currentEnrollment?.classArm || currentEnrollment?.arm;
  const classObj = currentEnrollment?.class || classArm?.class;
  const armObj = currentEnrollment?.arm || classArm;
  
  return {
    id: s.id,
    userId: s.userId || u.id,
    studentId: s.studentId || u.student_id || null,
    firstName: u.firstName || u.first_name || '',
    lastName: u.lastName || u.last_name || '',
    email: u.email || '—',
    phone: u.phone || null,
    image: u.image || null,
    isActive: u.isActive !== false,
    admissionYear: s.admissionYear || u.admission_year || null,
    currentClass: classObj?.name || currentEnrollment?.class?.name || null,
    currentArm: armObj?.name || currentEnrollment?.arm?.name || null,
    currentSession: currentEnrollment?.session?.name || null,
    currentTerm: currentEnrollment?.term?.name || null,
    enrollmentStatus: currentEnrollment?.status || 'PENDING',
    enrollments: enrollments,
    createdAt: s.createdAt || u.createdAt || s.created_at,
    updatedAt: s.updatedAt || u.updatedAt,
    _raw: s,
  };
};

// ─────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────
const PALETTE = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444'];

const Avatar = ({ s, size = 80 }) => {
  const initials = `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase() || 'S';
  const bg = PALETTE[(s.firstName?.charCodeAt(0) || 0) % PALETTE.length];

  if (s.image) {
    return (
      <img
        src={s.image}
        alt={`${s.firstName} ${s.lastName}`}
        style={{ width: size, height: size }}
        className="rounded-2xl object-cover border-4 border-white shadow-xl flex-shrink-0"
        onError={e => {
          e.target.style.display = 'none';
          e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
        }}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, background: bg, fontSize: size * 0.35 }}
      className="rounded-2xl flex items-center justify-center text-white font-bold border-4 border-white shadow-xl flex-shrink-0"
    >
      {initials}
    </div>
  );
};

const StatusBadge = ({ isActive, enrollmentStatus }) => {
  if (!isActive)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
        <PowerOff className="w-3.5 h-3.5" /> Inactive
      </span>
    );
  
  if (enrollmentStatus === "GRADUATED")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
        <Award className="w-3.5 h-3.5" /> Graduated
      </span>
    );
  
  if (enrollmentStatus === "ACTIVE" || enrollmentStatus === "active")
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
        <CheckCircle className="w-3.5 h-3.5" /> Active
      </span>
    );
  
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
      <Clock className="w-3.5 h-3.5" /> Pending
    </span>
  );
};

const InfoCard = ({ title, children, icon: Icon, accent = "#3b82f6" }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}15` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const StatBadge = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [academicStats, setAcademicStats] = useState({
    averageScore: 0,
    subjectsCount: 0,
    attendanceRate: 0,
  });

  const fetchStudent = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [studentRes, analyticsRes] = await Promise.allSettled([
        studentAPI.getStudent(id),
        studentAPI.getStudentAnalytics?.(id) || Promise.resolve({}),
      ]);

      const rawStudent = studentRes.status === 'fulfilled' ? studentRes.value : null;
      const studentData = rawStudent?.data?.data || rawStudent?.data || rawStudent;
      
      if (!studentData) throw new Error('Student not found');
      
      const normalized = normaliseStudent(studentData);
      setStudent(normalized);

      // Calculate academic stats from available data
      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : null;
      if (analytics) {
        setAcademicStats({
          averageScore: analytics.average_score || analytics.avgScore || 0,
          subjectsCount: analytics.subjects_count || analytics.subjectsEnrolled || 0,
          attendanceRate: analytics.attendance_rate || analytics.attendance || 0,
        });
      }

      if (isRefresh) toast.success('Student data refreshed');
    } catch (err) {
      console.error('Error fetching student:', err);
      toast.error(err?.response?.data?.message || 'Failed to load student details');
      if (err?.response?.status === 404) navigate('/school-admin/student-management');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const formatDate = (date) => {
    if (!date) return 'Not available';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getClassDisplay = () => {
    if (!student) return '—';
    if (student.currentClass && student.currentArm) {
      return `${student.currentClass} — ${student.currentArm}`;
    }
    if (student.currentClass) return student.currentClass;
    if (student.currentArm) return student.currentArm;
    return 'Not enrolled';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-slate-500 font-medium">Loading student profile...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">Student not found</h2>
        <p className="text-slate-500">The student you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/school-admin/student-management')}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/school-admin/student-management')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Back to Students</span>
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStudent(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => navigate(`/school-admin/student-management/edit/${student.id}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
          >
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
      >
        <div className="relative h-32 bg-gradient-to-r from-emerald-600 to-teal-700" />
        
        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            <Avatar s={student} size={100} />
            
            <div className="flex-1 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {student.firstName} {student.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StatusBadge isActive={student.isActive} enrollmentStatus={student.enrollmentStatus} />
                  {student.studentId && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                      <GraduationCap className="w-3.5 h-3.5" /> ID: {student.studentId}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.href = `mailto:${student.email}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
                {student.phone && (
                  <button
                    onClick={() => window.location.href = `tel:${student.phone}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <Phone className="w-4 h-4" /> Call
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatBadge
          label="Student ID"
          value={student.studentId || '—'}
          icon={GraduationCap}
          color="#3b82f6"
        />
        <StatBadge
          label="Class"
          value={getClassDisplay()}
          icon={School}
          color="#8b5cf6"
        />
        <StatBadge
          label="Admission Year"
          value={student.admissionYear || '—'}
          icon={CalendarIcon}
          color="#10b981"
        />
        <StatBadge
          label="Academic Session"
          value={student.currentSession || '—'}
          icon={BookOpen}
          color="#f59e0b"
        />
      </div>

      {/* Academic Stats (if available) */}
      {(academicStats.averageScore > 0 || academicStats.attendanceRate > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {academicStats.averageScore > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Average Score</p>
                  <p className="text-3xl font-bold text-blue-700 mt-1">{academicStats.averageScore}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          )}
          {academicStats.attendanceRate > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Attendance Rate</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-1">{academicStats.attendanceRate}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-1 space-y-6">
          <InfoCard title="Personal Information" icon={User} accent="#3b82f6">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Full Name</p>
                <p className="text-sm font-medium text-slate-800">{student.firstName} {student.lastName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
                <div className="flex items-center gap-2">
                  <AtSign className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-sm text-slate-700">{student.email}</p>
                </div>
              </div>
              {student.phone && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Phone Number</p>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-sm text-slate-700">{student.phone}</p>
                  </div>
                </div>
              )}
              {student.createdAt && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Enrolled Since</p>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-sm text-slate-700">{formatDate(student.createdAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </InfoCard>

          <InfoCard title="Enrollment Details" icon={School} accent="#8b5cf6">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500">Status</span>
                <StatusBadge isActive={student.isActive} enrollmentStatus={student.enrollmentStatus} />
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500">Class</span>
                <span className="text-sm font-medium text-slate-700">{getClassDisplay()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500">Session</span>
                <span className="text-sm font-medium text-slate-700">{student.currentSession || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-500">Term</span>
                <span className="text-sm font-medium text-slate-700">{student.currentTerm || '—'}</span>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Right Column - Academic History */}
        <div className="lg:col-span-2 space-y-6">
          <InfoCard title="Enrollment History" icon={BookMarked} accent="#10b981">
            {student.enrollments && student.enrollments.length > 0 ? (
              <div className="space-y-3">
                {student.enrollments.map((enrollment, idx) => (
                  <motion.div
                    key={enrollment.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <School className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {enrollment.class?.name || enrollment.className || 'Class'} 
                          {enrollment.arm?.name && ` — ${enrollment.arm.name}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {enrollment.session?.name || enrollment.sessionName}
                          {enrollment.term?.name && ` · ${enrollment.term.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                        enrollment.status === "ACTIVE" || enrollment.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : enrollment.status === "GRADUATED"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {enrollment.status || 'PENDING'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <School className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">No enrollment records found</p>
                <p className="text-xs text-slate-400 mt-1">Enroll this student in a class to get started</p>
                <button
                  onClick={() => navigate(`/school-admin/student-management/enroll/${student.id}`)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <BookMarked className="w-4 h-4" /> Enroll Student
                </button>
              </div>
            )}
          </InfoCard>

          {/* Quick Actions */}
          <InfoCard title="Quick Actions" icon={Activity} accent="#f59e0b">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate(`/school-admin/results/student/${student.id}`)}
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">View Results</p>
                  <p className="text-[10px] text-slate-400">Academic performance</p>
                </div>
              </button>
              <button
                onClick={() => navigate(`/school-admin/attendance/student/${student.id}`)}
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">Attendance</p>
                  <p className="text-[10px] text-slate-400">View attendance record</p>
                </div>
              </button>
              <button
                onClick={() => navigate(`/school-admin/fees/student/${student.id}`)}
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <CreditCard className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">Fee Statement</p>
                  <p className="text-[10px] text-slate-400">Payment history</p>
                </div>
              </button>
              <button
                onClick={() => navigate(`/school-admin/timetable/student/${student.id}`)}
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <CalendarIcon className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">Timetable</p>
                  <p className="text-[10px] text-slate-400">Class schedule</p>
                </div>
              </button>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;