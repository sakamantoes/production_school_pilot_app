import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, RefreshCw, Search, X,
  GraduationCap, Edit2, Trash2, BookOpen, ChevronDown,
  AlertCircle, Loader2, CheckCircle, Clock, Power, PowerOff,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import CreateStudent from '../../components/school/CreateStudent';
import EditStudentModal from '../../components/school/EditStudentModal';
import EnrollStudentModal from '../../components/school/EnrollStudentModal';
import { studentAPI, classAPI, sessionAPI } from '../../services/schoolApi';

// ─────────────────────────────────────────────────────────────
// DATA HELPERS
// API shape: { status, success, message, data: [ { id, studentId, user:{}, enrollments:[] } ] }
// ─────────────────────────────────────────────────────────────

const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [res, res.data, res.data?.data,
    ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const c of candidates) { if (Array.isArray(c)) return c; }
  return [];
};

const normalise = (s) => {
  const u   = s.user || s;
  const enr = s.enrollments?.[0] || s.currentEnrollment || null;
  return {
    id:            s.id,
    studentId:     s.studentId     || s.student_id    || '—',
    admissionYear: s.admissionYear || s.admission_year || '—',
    firstName:     u.firstName     || u.first_name    || '',
    lastName:      u.lastName      || u.last_name     || '',
    email:         u.email         || '—',
    phone:         u.phone         || '—',
    image:         u.image         || u.profileImage  || null,
    isActive:      u.isActive      !== false,
    className:     enr?.class?.name   || null,
    armName:       enr?.arm?.name     || null,
    session:       enr?.session?.name || null,
    enrollStatus:  enr?.status        || null,
    isGraduated:   enr?.status === 'GRADUATED' || s.isGraduated || false,
    hasEnrollment: !!enr,
    _raw: s,
  };
};

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS — outside parent (stable refs, no focus loss)
// ─────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, accent, sub }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-start justify-between"
    style={{ borderTop: `3px solid ${accent}` }}>
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${accent}18` }}>
      <Icon className="w-5 h-5" style={{ color: accent }} />
    </div>
  </div>
);

const FilterSelect = ({ value, onChange, options, placeholder }) => (
  <div className="relative">
    <select value={value} onChange={onChange}
      className="w-full h-10 pl-3.5 pr-9 text-sm font-medium text-slate-700 bg-slate-50 border-2 border-slate-200
        rounded-xl outline-none appearance-none focus:border-blue-500 focus:bg-white hover:border-slate-300 transition-all">
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
  </div>
);

const StatusBadge = ({ student }) => {
  if (!student.isActive)
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700"><PowerOff className="w-3 h-3"/>Inactive</span>;
  if (student.isGraduated)
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700"><GraduationCap className="w-3 h-3"/>Graduated</span>;
  if (student.hasEnrollment)
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3"/>Enrolled</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700"><Clock className="w-3 h-3"/>Not Enrolled</span>;
};

const Avatar = ({ student }) => {
  const initials = `${student.firstName?.[0]||''}${student.lastName?.[0]||''}`.toUpperCase() || '?';
  const palette  = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b'];
  const bg       = palette[(student.firstName?.charCodeAt(0)||0) % palette.length];
  return student.image
    ? <img src={student.image} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" />
    : <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 border-2 border-white shadow-sm" style={{ background: bg }}>{initials}</div>;
};

// ── Confirm dialog — two variants: soft and hard ──────────────
const ConfirmDialog = ({ title, message, detail, onConfirm, onCancel, confirmLabel, variant = 'default' }) => {
  const styles = {
    default: { icon: 'bg-blue-100',   btn: 'bg-blue-600  hover:bg-blue-700',  iconColor: 'text-blue-600'  },
    warning: { icon: 'bg-amber-100',  btn: 'bg-amber-600 hover:bg-amber-700', iconColor: 'text-amber-600' },
    danger:  { icon: 'bg-rose-100',   btn: 'bg-rose-600  hover:bg-rose-700',  iconColor: 'text-rose-600'  },
  };
  const s = styles[variant] || styles.default;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
        <div className="flex items-start gap-3 mb-5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.icon}`}>
            <AlertCircle className={`w-4 h-4 ${s.iconColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1">{message}</p>
            {detail && (
              <p className="text-xs text-rose-600 font-semibold mt-2 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 flex-shrink-0" />{detail}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors ${s.btn}`}>
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
      <Users className="w-10 h-10 text-blue-300" />
    </div>
    <h3 className="text-base font-bold text-slate-700 mb-1">No students found</h3>
    <p className="text-sm text-slate-400 mb-6">Add your first student to get started.</p>
    <button onClick={onAdd}
      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200">
      <UserPlus className="w-4 h-4" /> Create Student
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

const CreateStudentAdmin = () => {
  const [rawStudents, setRawStudents] = useState([]);
  const [students,    setStudents]    = useState([]);
  const [classes,     setClasses]     = useState([]);
  const [sessions,    setSessions]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const [search,        setSearch]        = useState('');
  const [filterClass,   setFilterClass]   = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');

  const [showCreate,   setShowCreate]   = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [showEnroll,   setShowEnroll]   = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Reference data ────────────────────────────────────────
  useEffect(() => {
    Promise.allSettled([classAPI.getClasses(), sessionAPI.getSessions()]).then(([cr, sr]) => {
      setClasses(toArray(cr.status === 'fulfilled' ? cr.value : null, 'classes', 'items'));
      setSessions(toArray(sr.status === 'fulfilled' ? sr.value : null, 'sessions', 'items'));
    });
  }, []);

  // ── Fetch students ────────────────────────────────────────
  const fetchStudents = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const params = {};
      if (filterClass)   params.classId   = filterClass;
      if (filterSession) params.sessionId = filterSession;
      const res = await studentAPI.getStudents(params);
      setRawStudents(toArray(res, 'students', 'items'));
      if (isRefresh) toast.success('Refreshed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterClass, filterSession]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Client-side search + status filter ───────────────────
  useEffect(() => {
    const term = search.toLowerCase();
    setStudents(
      rawStudents.map(normalise).filter(s => {
        const text = `${s.firstName} ${s.lastName} ${s.email} ${s.studentId}`.toLowerCase();
        if (term && !text.includes(term)) return false;
        switch (filterStatus) {
          case 'active':     return s.isActive && !s.isGraduated && s.hasEnrollment;
          case 'inactive':   return !s.isActive;
          case 'graduated':  return s.isGraduated;
          case 'unenrolled': return s.isActive && !s.isGraduated && !s.hasEnrollment;
          default:           return true;
        }
      })
    );
  }, [rawStudents, search, filterStatus]);

  // ── Stats ─────────────────────────────────────────────────
  const all          = rawStudents.map(normalise);
  const totalCount   = all.length;
  const activeCount  = all.filter(s =>  s.isActive && !s.isGraduated &&  s.hasEnrollment).length;
  const inactiveCount= all.filter(s => !s.isActive).length;
  const gradCount    = all.filter(s =>  s.isGraduated).length;
  const unenrolled   = all.filter(s =>  s.isActive && !s.isGraduated && !s.hasEnrollment).length;

  // ── Actions ───────────────────────────────────────────────

  // Soft delete / deactivate
  const handleDeactivate = useCallback(async () => {
    const s = confirmState?.student; if (!s) return;
    setActionLoading(true);
    try {
      await studentAPI.deleteStudent(s.id);   // DELETE /admin/students/:id/deactivate
      toast.success(`${s.firstName} ${s.lastName} deactivated`);
      setConfirmState(null); fetchStudents();
    } catch (err) { toast.error(err?.response?.data?.message || 'Deactivation failed'); }
    finally { setActionLoading(false); }
  }, [confirmState, fetchStudents]);

  // Reactivate
  const handleActivate = useCallback(async () => {
    const s = confirmState?.student; if (!s) return;
    setActionLoading(true);
    try {
      await studentAPI.activateStudent(s.id);  // POST /admin/students/:id/activate
      toast.success(`${s.firstName} ${s.lastName} reactivated`);
      setConfirmState(null); fetchStudents();
    } catch (err) { toast.error(err?.response?.data?.message || 'Activation failed'); }
    finally { setActionLoading(false); }
  }, [confirmState, fetchStudents]);

  // Hard delete — permanently removes student + user record
  // Calls DELETE /admin/students/:id  (no /deactivate suffix)
  // Backend: router.delete("/students/:id", authorizePermission(Permission.MANAGE_STUDENTS), deleteStudent)
  const handleHardDelete = useCallback(async () => {
    const s = confirmState?.student; if (!s) return;
    setActionLoading(true);
    try {
      await studentAPI.permanentlyDeleteStudent(s.id);  // DELETE /admin/students/:id
      toast.success(`${s.firstName} ${s.lastName} permanently deleted`);
      setConfirmState(null); fetchStudents();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Delete failed';
      // 403 = permission not set on backend route
      if (err?.response?.status === 403) {
        toast.error('Permission denied — ensure MANAGE_STUDENTS permission is set on the delete route');
      } else {
        toast.error(msg);
      }
    } finally { setActionLoading(false); }
  }, [confirmState, fetchStudents]);

  // Graduate
  const handleGraduate = useCallback(async () => {
    const s = confirmState?.student; if (!s) return;
    setActionLoading(true);
    try {
      await studentAPI.graduateStudent(s.id);
      toast.success(`${s.firstName} ${s.lastName} graduated`);
      setConfirmState(null); fetchStudents();
    } catch (err) { toast.error(err?.response?.data?.message || 'Graduate failed'); }
    finally { setActionLoading(false); }
  }, [confirmState, fetchStudents]);

  // Enroll
  const handleEnrollSuccess = useCallback(async (enrollmentData) => {
    await studentAPI.enrollStudent(enrollmentData);
    fetchStudents();
    setShowEnroll(false); setSelected(null);
  }, [fetchStudents]);

  const clearFilters = useCallback(() => {
    setSearch(''); setFilterClass(''); setFilterSession(''); setFilterStatus('');
  }, []);

  const hasFilters = search || filterClass || filterSession || filterStatus;

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* Hero */}
      <div className="relative overflow-hidden px-6 py-8 mb-6"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #312e81 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="relative max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
              <Users className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/90 text-xs font-semibold">School Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Student Management</h1>
            <p className="text-blue-200 text-sm mt-1">Manage records, enrollments and academic progress</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Total',      value: totalCount,    color: 'text-white' },
              { label: 'Active',     value: activeCount,   color: 'text-emerald-300' },
              { label: 'Graduated',  value: gradCount,     color: 'text-purple-300' },
              { label: 'Inactive',   value: inactiveCount, color: 'text-rose-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center min-w-[68px]">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5 pb-12">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Students"    value={totalCount}    icon={Users}        accent="#3b82f6" sub="All records" />
          <StatCard label="Active Enrolled"   value={activeCount}   icon={CheckCircle}  accent="#10b981" sub="Currently in class" />
          <StatCard label="Graduated"         value={gradCount}     icon={GraduationCap}accent="#8b5cf6" sub="Completed studies" />
          <StatCard label="Inactive"          value={inactiveCount} icon={PowerOff}     accent="#ef4444" sub="Deactivated accounts" />
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, email or ID…"
                className="w-full h-10 pl-10 pr-10 text-sm font-medium text-slate-800 placeholder:text-slate-300
                  bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white hover:border-slate-300 transition-all"
              />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
            </div>

            <div className="w-40"><FilterSelect value={filterClass}   onChange={e => setFilterClass(e.target.value)}   options={classes}  placeholder="All Classes"  /></div>
            <div className="w-44"><FilterSelect value={filterSession} onChange={e => setFilterSession(e.target.value)} options={sessions} placeholder="All Sessions" /></div>

            <div className="relative w-44">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="w-full h-10 pl-3.5 pr-9 text-sm font-medium text-slate-700 bg-slate-50 border-2 border-slate-200
                  rounded-xl outline-none appearance-none focus:border-blue-500 focus:bg-white hover:border-slate-300 transition-all">
                <option value="">All Status</option>
                <option value="active">Active Enrolled</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
                <option value="unenrolled">Not Enrolled</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:block">{students.length} of {totalCount}</span>
              <button onClick={() => fetchStudents(true)} disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              <motion.button onClick={() => setShowCreate(true)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-200 transition-colors">
                <UserPlus className="w-4 h-4" /> New Student
              </motion.button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-sm font-medium">Loading students…</span>
            </div>
          ) : students.length === 0 ? (
            <EmptyState onAdd={() => setShowCreate(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {['Student','ID','Contact','Class / Arm','Session','Status','Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s, i) => (
                    <motion.tr key={s.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      className={`hover:bg-slate-50/70 transition-colors ${!s.isActive ? 'opacity-60' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar student={s} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{s.firstName} {s.lastName}</p>
                            <p className="text-xs text-slate-400">{s.admissionYear ? `Admitted ${s.admissionYear}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg whitespace-nowrap">{s.studentId}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-slate-600 truncate max-w-[160px]">{s.email}</p>
                        {s.phone && s.phone !== '—' && <p className="text-[11px] text-slate-400">{s.phone}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        {s.className
                          ? <span className="text-xs font-semibold text-slate-700">{s.className}{s.armName ? ` — ${s.armName}` : ''}</span>
                          : <span className="text-xs text-slate-400 italic">Not assigned</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {s.session
                          ? <span className="text-xs font-semibold text-slate-700">{s.session}</span>
                          : <span className="text-xs text-slate-400 italic">—</span>}
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge student={s} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          {/* Edit */}
                          <button onClick={() => { setSelected(s._raw); setShowEdit(true); }} title="Edit"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Enroll (active + not graduated) */}
                          {s.isActive && !s.isGraduated && (
                            <button onClick={() => { setSelected(s._raw); setShowEnroll(true); }} title="Enroll"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                              <BookOpen className="w-4 h-4" />
                            </button>
                          )}

                          {/* Graduate (active + not graduated) */}
                          {s.isActive && !s.isGraduated && (
                            <button onClick={() => setConfirmState({ type: 'graduate', student: s })} title="Graduate"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all">
                              <GraduationCap className="w-4 h-4" />
                            </button>
                          )}

                          {/* Activate / Deactivate toggle */}
                          {!s.isGraduated && (
                            s.isActive ? (
                              <button onClick={() => setConfirmState({ type: 'deactivate', student: s })} title="Deactivate"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all">
                                <PowerOff className="w-4 h-4" />
                              </button>
                            ) : (
                              <button onClick={() => setConfirmState({ type: 'activate', student: s })} title="Activate"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                                <Power className="w-4 h-4" />
                              </button>
                            )
                          )}

                          {/* Hard delete */}
                          <button onClick={() => setConfirmState({ type: 'hardDelete', student: s })} title="Permanently delete"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && students.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">
                Showing <strong className="text-slate-600">{students.length}</strong> of <strong className="text-slate-600">{totalCount}</strong> students
              </p>
              {hasFilters && <button onClick={clearFilters} className="text-xs font-semibold text-blue-600 hover:underline">Clear filters</button>}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && <CreateStudent onSuccess={() => { fetchStudents(); setShowCreate(false); }} onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showEdit && selected && (
          <EditStudentModal student={selected}
            onSuccess={() => { fetchStudents(); setShowEdit(false); setSelected(null); }}
            onClose={() => { setShowEdit(false); setSelected(null); }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showEnroll && selected && (
          <EnrollStudentModal student={selected}
            onSuccess={handleEnrollSuccess}
            onClose={() => { setShowEnroll(false); setSelected(null); }} />
        )}
      </AnimatePresence>

      {/* Deactivate */}
      <AnimatePresence>
        {confirmState?.type === 'deactivate' && (
          <ConfirmDialog
            title="Deactivate Student"
            message={`Deactivate ${confirmState.student.firstName} ${confirmState.student.lastName}? They will lose system access until reactivated.`}
            confirmLabel={actionLoading ? 'Deactivating…' : 'Deactivate'}
            variant="warning"
            onConfirm={handleDeactivate}
            onCancel={() => setConfirmState(null)}
          />
        )}
      </AnimatePresence>

      {/* Activate */}
      <AnimatePresence>
        {confirmState?.type === 'activate' && (
          <ConfirmDialog
            title="Reactivate Student"
            message={`Reactivate ${confirmState.student.firstName} ${confirmState.student.lastName}? They will regain full system access.`}
            confirmLabel={actionLoading ? 'Activating…' : 'Activate'}
            variant="default"
            onConfirm={handleActivate}
            onCancel={() => setConfirmState(null)}
          />
        )}
      </AnimatePresence>

      {/* Graduate */}
      <AnimatePresence>
        {confirmState?.type === 'graduate' && (
          <ConfirmDialog
            title="Graduate Student"
            message={`Mark ${confirmState.student.firstName} ${confirmState.student.lastName} as graduated?`}
            confirmLabel={actionLoading ? 'Graduating…' : 'Graduate'}
            variant="default"
            onConfirm={handleGraduate}
            onCancel={() => setConfirmState(null)}
          />
        )}
      </AnimatePresence>

      {/* Hard delete — two-step warning */}
      <AnimatePresence>
        {confirmState?.type === 'hardDelete' && (
          <ConfirmDialog
            title="Permanently Delete Student"
            message={`Delete ${confirmState.student.firstName} ${confirmState.student.lastName} and all their data?`}
            detail="This removes the user account, all enrollments, results, and attendance records. This cannot be undone."
            confirmLabel={actionLoading ? 'Deleting…' : 'Yes, Delete Permanently'}
            variant="danger"
            onConfirm={handleHardDelete}
            onCancel={() => setConfirmState(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default CreateStudentAdmin;