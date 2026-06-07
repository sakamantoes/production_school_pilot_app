// dashboards/school-admin/TeacherDetail.jsx
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
  BookMarked,
  CheckCircle,
  XCircle,
  MapPin,
  Briefcase,
  Clock,
  GraduationCap,
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
} from "lucide-react";
import { teacherAPI, classAPI, subjectAPI } from "../../services/schoolApi";

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

const normaliseTeacher = (t) => {
  const u = t.user || t;
  return {
    id: t.id,
    userId: t.userId || u.id,
    firstName: u.firstName || u.first_name || '',
    lastName: u.lastName || u.last_name || '',
    email: u.email || '—',
    phone: u.phone || null,
    image: u.image || null,
    isActive: u.isActive !== false,
    isClassHead: t.isClassHead ?? false,
    headedClassArm: t.headedClassArm || null,
    headedClassArmId: t.headedClassArmId || '',
    employeeId: t.employee_id || t.staff_id || u.employee_id || null,
    assignments: Array.isArray(t.assignments) ? t.assignments : [],
    subjects: Array.isArray(t.subjects) ? t.subjects : [],
    createdAt: t.createdAt || u.createdAt || t.created_at,
    updatedAt: t.updatedAt || u.updatedAt,
  };
};

// ─────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────
const PALETTE = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444'];

const Avatar = ({ t, size = 80 }) => {
  const initials = `${t.firstName?.[0] || ''}${t.lastName?.[0] || ''}`.toUpperCase() || 'T';
  const bg = PALETTE[(t.firstName?.charCodeAt(0) || 0) % PALETTE.length];

  if (t.image) {
    return (
      <img
        src={t.image}
        alt={`${t.firstName} ${t.lastName}`}
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

const StatusBadge = ({ isActive, isClassHead }) => {
  if (!isActive)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
        <PowerOff className="w-3.5 h-3.5" /> Inactive
      </span>
    );
  if (isClassHead)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
        <Star className="w-3.5 h-3.5" /> Class Head
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
      <CheckCircle className="w-3.5 h-3.5" /> Active
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
const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalClasses: 0,
    totalStudents: 0,
  });

  const fetchTeacher = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [teacherRes, classesRes, subjectsRes] = await Promise.allSettled([
        teacherAPI.getTeacher(id),
        classAPI.getClasses(),
        subjectAPI.getSubjects(),
      ]);

      const rawTeacher = teacherRes.status === 'fulfilled' ? teacherRes.value : null;
      const teacherData = rawTeacher?.data?.data || rawTeacher?.data || rawTeacher;
      
      if (!teacherData) throw new Error('Teacher not found');
      
      const normalized = normaliseTeacher(teacherData);
      setTeacher(normalized);

      // Calculate stats from assignments
      const assignments = normalized.assignments || [];
      const uniqueClasses = new Set(assignments.map(a => a.class?.id || a.classId).filter(Boolean));
      const uniqueSubjects = new Set(assignments.map(a => a.subject?.id || a.subjectId).filter(Boolean));
      
      // Estimate student count (if available from assignments)
      let totalStudents = 0;
      if (normalized.headedClassArm?.class?.studentsCount) {
        totalStudents = normalized.headedClassArm.class.studentsCount;
      }

      setStats({
        totalSubjects: uniqueSubjects.size,
        totalClasses: uniqueClasses.size,
        totalStudents: totalStudents || 0,
      });

      if (isRefresh) toast.success('Teacher data refreshed');
    } catch (err) {
      console.error('Error fetching teacher:', err);
      toast.error(err?.response?.data?.message || 'Failed to load teacher details');
      if (err?.response?.status === 404) navigate('/school-admin/teachers-management');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchTeacher();
  }, [fetchTeacher]);

  const formatDate = (date) => {
    if (!date) return 'Not available';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = () => {
    if (!teacher) return 'T';
    return `${teacher.firstName?.[0] || ''}${teacher.lastName?.[0] || ''}`.toUpperCase() || 'T';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-slate-500 font-medium">Loading teacher profile...</p>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">Teacher not found</h2>
        <p className="text-slate-500">The teacher you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/school-admin/teachers-management')}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Teachers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/school-admin/teachers-management')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Back to Teachers</span>
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTeacher(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => navigate(`/school-admin/teachers-management/edit/${teacher.id}`)}
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
        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700" />
        
        <div className="relative px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            <Avatar t={teacher} size={100} />
            
            <div className="flex-1 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {teacher.firstName} {teacher.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StatusBadge isActive={teacher.isActive} isClassHead={teacher.isClassHead} />
                  {teacher.employeeId && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                      <Briefcase className="w-3.5 h-3.5" /> ID: {teacher.employeeId}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.href = `mailto:${teacher.email}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
                {teacher.phone && (
                  <button
                    onClick={() => window.location.href = `tel:${teacher.phone}`}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBadge
          label="Subjects Taught"
          value={stats.totalSubjects}
          icon={BookOpen}
          color="#3b82f6"
        />
        <StatBadge
          label="Classes Assigned"
          value={stats.totalClasses}
          icon={Users}
          color="#8b5cf6"
        />
        <StatBadge
          label="Students Impacted"
          value={stats.totalStudents}
          icon={GraduationCap}
          color="#10b981"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-1 space-y-6">
          <InfoCard title="Personal Information" icon={User} accent="#3b82f6">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Full Name</p>
                <p className="text-sm font-medium text-slate-800">{teacher.firstName} {teacher.lastName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
                <div className="flex items-center gap-2">
                  <AtSign className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-sm text-slate-700">{teacher.email}</p>
                </div>
              </div>
              {teacher.phone && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Phone Number</p>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-sm text-slate-700">{teacher.phone}</p>
                  </div>
                </div>
              )}
              {teacher.createdAt && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Member Since</p>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-sm text-slate-700">{formatDate(teacher.createdAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </InfoCard>

          {teacher.isClassHead && teacher.headedClassArm && (
            <InfoCard title="Leadership Role" icon={Star} accent="#f59e0b">
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-bold text-amber-700 uppercase">Class Head Teacher</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {teacher.headedClassArm.class?.name || 'Class'} — {teacher.headedClassArm.name || 'Arm'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Responsible for overall class management, student welfare, and academic oversight.
                  </p>
                </div>
              </div>
            </InfoCard>
          )}
        </div>

        {/* Right Column - Assignments & Subjects */}
        <div className="lg:col-span-2 space-y-6">
          <InfoCard title="Subject Assignments" icon={BookMarked} accent="#10b981">
            {teacher.assignments && teacher.assignments.length > 0 ? (
              <div className="space-y-3">
                {teacher.assignments.map((assignment, idx) => (
                  <motion.div
                    key={assignment.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {assignment.subject?.name || assignment.subjectName || 'Subject'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {assignment.class?.name || assignment.className}
                          {assignment.arm?.name && ` — ${assignment.arm.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">No subjects assigned yet</p>
                <p className="text-xs text-slate-400 mt-1">Assign subjects to this teacher to get started</p>
                <button
                  onClick={() => navigate(`/school-admin/teachers-management/assign/${teacher.id}`)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  <BookMarked className="w-4 h-4" /> Assign Subjects
                </button>
              </div>
            )}
          </InfoCard>

          {/* Performance Summary (placeholder - can be extended) */}
          <InfoCard title="Performance Summary" icon={TrendingUp} accent="#8b5cf6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Subjects Load</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalSubjects}</p>
                <p className="text-xs text-slate-500 mt-1">Active subjects currently teaching</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Classes Handled</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalClasses}</p>
                <p className="text-xs text-slate-500 mt-1">Different classes assigned</p>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetail;