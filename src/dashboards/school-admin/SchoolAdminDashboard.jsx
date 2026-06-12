import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCircle,
  CreditCard,
  BarChart3,
  TrendingUp,
  BookOpen,
  Clock,
  Calendar,
  GraduationCap,
  DollarSign,
  Award,
  FileText,
  Activity,
  ChevronRight,
  Search,
  Book,
  UserPlus,
  Upload,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/Loader";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import schoolAPI from "../../services/schoolApi";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const GRADE_COLORS = ["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

// ─────────────────────────────────────────────────────────────────────────────
// DATA EXTRACTION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const extractArray = (res, ...keys) => {
  if (!res || res.status !== "fulfilled") return [];
  const data = res.value;
  const candidates = [
    data,
    data?.data,
    data?.data?.data,
    ...keys.map((k) => data?.[k]),
    ...keys.map((k) => data?.data?.[k]),
  ];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length >= 0) return c;
  }
  return [];
};

const extractObject = (res) => {
  if (!res || res.status !== "fulfilled") return {};
  const d = res.value;
  return d?.data?.data || d?.data || d || {};
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA NORMALISERS — fixed to match real API shape
//
// STUDENT API shape (from network tab):
// {
//   id, studentId, admissionYear,
//   user: { firstName, lastName, email, phone, image, isActive },
//   enrollments: [{ status, class: { name }, arm: { name }, session: { name } }]
// }
//
// TEACHER API shape:
// {
//   id, employee_id/staff_id,
//   user: { firstName, lastName, email, isActive },
//   subjects: [...], isClassHead, headedClassArm: { name }
// }
// ─────────────────────────────────────────────────────────────────────────────

const STUDENT_COLORS = ["#3b82f6","#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981"];
const TEACHER_COLORS = ["#10b981","#059669","#0d9488","#0891b2","#0284c7","#2563eb"];

const normaliseStudents = (raw) =>
  raw.map((s, i) => {
    // Name and personal info live in s.user, NOT on s directly
    const u   = s.user || {};
    // Latest/current enrollment
    const enr = Array.isArray(s.enrollments) ? s.enrollments[0] : (s.currentEnrollment || null);

    const firstName = u.firstName || u.first_name || "";
    const lastName  = u.lastName  || u.last_name  || "";

    // Build a readable meta line: "jss 1 — A · 2025-2026"
    const classPart   = enr?.class?.name  || null;
    const armPart     = enr?.arm?.name    || null;
    const sessionPart = enr?.session?.name || null;
    const classLabel  = classPart
      ? `${classPart}${armPart ? ` — ${armPart}` : ""}`
      : "No class assigned";
    const meta = [classLabel, sessionPart].filter(Boolean).join(" · ");

    return {
      id:       s.id,
      name:     firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || u.email || "Unknown",
      email:    u.email || "—",
      meta,
      active:   u.isActive !== false,
      isGraduated: enr?.status === "GRADUATED",
      avatarBg: STUDENT_COLORS[i % STUDENT_COLORS.length],
    };
  });

const normaliseTeachers = (raw) =>
  raw.map((t, i) => {
    // Same pattern — name lives in t.user
    const u = t.user || {};

    const firstName = u.firstName || u.first_name || "";
    const lastName  = u.lastName  || u.last_name  || "";

    // Subjects: could be t.subjects[] or t.assignments[].subject
    const subjects = (t.subjects || [])
      .slice(0, 2)
      .map((s) => (typeof s === "string" ? s : s?.name || s?.subject_name || ""))
      .filter(Boolean);

    // Also try assignments array
    const fromAssignments = (t.assignments || [])
      .slice(0, 2)
      .map((a) => a?.subject?.name || a?.subject || "")
      .filter(Boolean);

    const subjectList = subjects.length ? subjects : fromAssignments;

    const meta = [
      subjectList.length ? subjectList.join(", ") : "No subjects assigned",
      t.isClassHead
        ? `Class Head${t.headedClassArm?.name ? ` — ${t.headedClassArm.name}` : ""}`
        : null,
      t.employee_id || t.staff_id
        ? `ID: ${t.employee_id || t.staff_id}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      id:       t.id || u.id,
      name:     firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || u.email || "Unknown",
      email:    u.email || "—",
      meta,
      active:   u.isActive !== false,
      avatarBg: TEACHER_COLORS[i % TEACHER_COLORS.length],
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// OUTSIDE-COMPONENT SUB-COMPONENTS (stable refs — no focus loss)
// ─────────────────────────────────────────────────────────────────────────────

const StatCard = ({ title, value, icon: Icon, accent, change, positive, onClick, loading }) => (
  <motion.div
    whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
    className="bg-white rounded-2xl p-5 border border-slate-100 cursor-pointer transition-shadow"
    style={{ borderTop: `3px solid ${accent}` }}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">{title}</p>
        {loading ? (
          <div className="h-7 w-24 bg-slate-100 rounded-lg animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-slate-900 truncate">{value ?? "—"}</p>
        )}
        {change && !loading && (
          <p className={`flex items-center gap-1 text-xs font-medium mt-2 ${positive ? "text-emerald-600" : "text-rose-500"}`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change} vs last month
          </p>
        )}
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
        style={{ background: `${accent}18` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
    </div>
  </motion.div>
);

const DashCard = ({ title, subtitle, action, onAction, children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 overflow-hidden ${className}`}>
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          {action} <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const ChartTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1623] border border-white/10 rounded-xl px-3 py-2.5 shadow-xl">
      <p className="text-xs text-slate-400 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString() : p.value}{suffix}
        </p>
      ))}
    </div>
  );
};

const AttendanceChart = ({ data, loading }) => {
  if (loading) return <div className="h-64 flex items-center justify-center"><Loader size="sm" /></div>;
  const monthly = data?.monthly_data || data?.monthlyAttendance || [];
  const chartData = monthly.length
    ? monthly.map((v, i) => ({ month: MONTHS[i], attendance: Number(v) || 0 }))
    : MONTHS.map((m) => ({ month: m, attendance: Math.floor(80 + Math.random() * 15) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip suffix="%" />} />
        <Area type="monotone" dataKey="attendance" name="Attendance" stroke="#3b82f6"
          strokeWidth={2.5} fill="url(#attGrad)" dot={false}
          activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const FeesChart = ({ collected = 0, target = 0, monthlyData = [], loading }) => {
  if (loading) return <div className="h-64 flex items-center justify-center"><Loader size="sm" /></div>;
  const pct = target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0;
  const chartData = monthlyData.length
    ? monthlyData.map((v, i) => ({ month: MONTHS[i], collected: Number(v) || 0, target: Math.round(target / 12) }))
    : MONTHS.map((m) => ({ month: m, collected: Math.floor(200000 + Math.random() * 400000), target: Math.round((target || 5000000) / 12) }));
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-500">
          <span>₦{collected.toLocaleString()} collected</span>
          <span className="text-blue-600">{pct}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>Target: ₦{target.toLocaleString()}</span>
          <span>Remaining: ₦{Math.max(0, target - collected).toLocaleString()}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barSize={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip prefix="₦" />} />
          <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="collected" name="Collected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="target" name="Target" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const GradeChart = ({ gradeDistribution = [], overallGpa = 0, loading }) => {
  if (loading) return <div className="h-64 flex items-center justify-center"><Loader size="sm" /></div>;
  const data = gradeDistribution.length
    ? gradeDistribution
    : [{ grade: "A", count: 120 }, { grade: "B", count: 95 }, { grade: "C", count: 60 }, { grade: "D", count: 25 }, { grade: "F", count: 10 }];
  const radialData = [{ name: "GPA", value: Math.min((overallGpa / 4) * 100, 100), fill: "#3b82f6" }];
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Grade Split</p>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="grade" cx="50%" cy="50%"
              outerRadius={75} innerRadius={40} paddingAngle={3} strokeWidth={0}
              label={({ grade, percent }) => percent > 0.05 ? `${grade} ${(percent * 100).toFixed(0)}%` : ""}
              labelLine={false}>
              {data.map((_, i) => <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,.12)" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Overall GPA</p>
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="55%" outerRadius="90%"
            barSize={14} data={radialData} startAngle={90} endAngle={-270}>
            <RadialBar background={{ fill: "#f1f5f9" }} clockWise dataKey="value" cornerRadius={8} fill="#3b82f6" />
            <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fill="#0f172a" fontSize={24} fontWeight={700}>
              {overallGpa > 0 ? overallGpa.toFixed(1) : "—"}
            </text>
            <text x="50%" y="63%" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize={10}>out of 4.0</text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const SubjectChart = ({ subjectPerformance = [], loading }) => {
  if (loading) return <div className="h-64 flex items-center justify-center"><Loader size="sm" /></div>;
  if (!subjectPerformance.length) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
        <BarChart3 className="w-8 h-8 opacity-40" />
        <p className="text-sm">No subject data yet</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={subjectPerformance} margin={{ top: 5, right: 10, left: -20, bottom: 30 }} barSize={10}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-30} textAnchor="end" axisLine={false} tickLine={false} interval={0} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTooltip suffix="%" />} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="average" name="Avg Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="passRate" name="Pass Rate" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// ── Person List ────────────────────────────────────────────────────────────
const PersonList = ({ items, loading, emptyIcon: EmptyIcon, emptyLabel, onViewAll, onViewItem, totalLabel }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = items.filter((p) => {
    const text = `${p.name} ${p.email} ${p.meta || ""}`.toLowerCase();
    const matchSearch = text.includes(search.toLowerCase());
    const matchStatus = status === "all" ? true : status === "active" ? p.active : !p.active;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="p-8 text-center space-y-2">
        <Loader size="sm" />
        <p className="text-xs text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-8 px-2 text-xs rounded-lg border border-slate-200 bg-white outline-none focus:border-blue-400 text-slate-600"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="overflow-y-auto max-h-80 divide-y divide-slate-100">
        {!items.length ? (
          <div className="py-10 text-center space-y-2 text-slate-400">
            <EmptyIcon className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm">{emptyLabel}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">No results match your search</div>
        ) : (
          filtered.map((p, i) => (
            <motion.div
              key={p.id || i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.015, 0.3) }}
              onClick={() => onViewItem(p.id)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              {/* Avatar with real initials */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: p.avatarBg }}
              >
                {p.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                <p className="text-xs text-slate-400 truncate">{p.meta}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  p.active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"
                }`}>
                  {p.active ? "Active" : "Inactive"}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
        <button onClick={onViewAll}
          className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors py-1">
          View all {totalLabel} ({items.length}) →
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const SchoolAdminDashboard = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats,      setStats]      = useState({ totalStudents: 0, totalTeachers: 0, totalRevenue: 0, attendanceRate: 0, totalClasses: 0, totalSubjects: 0 });
  const [students,   setStudents]   = useState([]);
  const [teachers,   setTeachers]   = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [fees,       setFees]       = useState(null);
  const [academics,  setAcademics]  = useState(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [studRes, teachRes, classRes, subRes, analyticsRes, walletRes, payRes] =
        await Promise.allSettled([
          schoolAPI.getStudents({ limit: 1000, page: 1 }),
          schoolAPI.getTeachers({ limit: 1000, page: 1 }),
          schoolAPI.getClasses(),
          schoolAPI.getSubjects(),
          schoolAPI.getSchoolAnalytics(),
          schoolAPI.getSchoolWallet(),
          schoolAPI.getPayments({ limit: 1000 }),
        ]);

      const rawStudents = extractArray(studRes,    "students", "items", "results");
      const rawTeachers = extractArray(teachRes,   "teachers", "items", "results");
      const rawClasses  = extractArray(classRes,   "classes",  "items");
      const rawSubjects = extractArray(subRes,     "subjects", "items");
      const analytics   = extractObject(analyticsRes);
      const wallet      = extractObject(walletRes);
      const rawPayments = extractArray(payRes,     "payments", "items");

      const paidStatuses = new Set(["completed","paid","success","confirmed"]);
      const calcRevenue = rawPayments.reduce((sum, p) => {
        const status = (p.status || p.payment_status || "").toLowerCase();
        return paidStatuses.has(status) ? sum + (p.amount || p.amount_paid || 0) : sum;
      }, 0);
      const finalRevenue = calcRevenue || wallet.balance || wallet.total_balance || 0;

      setStats({
        totalStudents:  rawStudents.length || analytics.total_students  || 0,
        totalTeachers:  rawTeachers.length || analytics.total_teachers  || 0,
        totalClasses:   rawClasses.length  || analytics.total_classes   || 0,
        totalSubjects:  rawSubjects.length || analytics.total_subjects  || 0,
        attendanceRate: analytics.attendance_rate || analytics.average_attendance || 0,
        totalRevenue:   finalRevenue,
      });

      setAttendance({ monthly_data: analytics.monthly_attendance || analytics.attendance_trend || [] });
      setFees({
        total_collected: finalRevenue,
        target:  analytics.fees_target || analytics.annual_fees_target || 0,
        monthly: analytics.monthly_fees || analytics.fees_trend || [],
      });
      setAcademics({
        grade_distribution:  analytics.grade_distribution  || analytics.grades           || [],
        subject_performance: analytics.subject_performance || analytics.subject_averages || [],
        overall_gpa:         analytics.overall_gpa         || analytics.average_gpa      || 0,
      });

      // ── Use fixed normalisers that read s.user.* and s.enrollments[] ──
      setStudents(normaliseStudents(rawStudents));
      setTeachers(normaliseTeachers(rawTeachers));

      if (isRefresh) toast.success("Dashboard refreshed");
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  const firstName  = user?.firstName || user?.first_name || user?.username || "Admin";
  const schoolName = user?.school?.schoolName || user?.schoolName || user?.school_name || "your school";
  const today      = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const STAT_CARDS = [
    { title: "Total Students",  value: stats.totalStudents,                       icon: Users,        accent: "#3b82f6", change: "+12%", positive: true, action: "/school-admin/student-management" },
    { title: "Total Teachers",  value: stats.totalTeachers,                       icon: UserCircle,   accent: "#10b981", change: "+5%",  positive: true, action: "/school-admin/teachers-management" },
    { title: "Total Revenue",   value: `₦${stats.totalRevenue.toLocaleString()}`, icon: DollarSign,   accent: "#8b5cf6", change: "+18%", positive: true, action: "/school-admin/fees"       },
    { title: "Attendance Rate", value: `${stats.attendanceRate}%`,                icon: TrendingUp,   accent: "#f59e0b", change: "+3%",  positive: true, action: "/school-admin/attendance" },
    { title: "Total Classes",   value: stats.totalClasses,                        icon: GraduationCap,accent: "#ef4444", change: "+2%",  positive: true, action: "/school-admin/classes"    },
    { title: "Total Subjects",  value: stats.totalSubjects,                       icon: Book,         accent: "#06b6d4", change: "+4%",  positive: true, action: "/school-admin/subjects"   },
  ];

  const QUICK_ACTIONS = [
    { icon: UserPlus,   label: "Add Student",   path: "/school-admin/create-student",   color: "#3b82f6" },
    { icon: UserPlus,   label: "Add Teacher",   path: "/school-admin/create-teacher",   color: "#10b981" },
    { icon: CreditCard, label: "Fees",          path: "/school-admin/fees",             color: "#8b5cf6" },
    { icon: Award,      label: "Results",       path: "/school-admin/results",          color: "#f59e0b" },
    { icon: Clock,      label: "Timetable",     path: "/school-admin/timetable",        color: "#06b6d4" },
    { icon: Calendar,   label: "Attendance",    path: "/school-admin/attendance",       color: "#ef4444" },
    { icon: BookOpen,   label: "Subjects",      path: "/school-admin/subjects",         color: "#6366f1" },
    { icon: FileText,   label: "Bulk Upload",   path: "/school-admin/bulk-upload",      color: "#0891b2" },
    { icon: BarChart3,  label: "Reports",       path: "/school-admin/reports",          color: "#0d9488" },
    { icon: Upload,     label: "Announcements", path: "/school-admin/announcements",    color: "#be185d" },
  ];

  if (loading) return <Loader fullScreen />;

  return (
    <div className="space-y-6 pb-8">

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #312e81 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">{today}</p>
            <h1 className="text-2xl font-bold tracking-tight">{greeting}, {firstName}! 👋</h1>
            <p className="text-blue-200 mt-1 text-sm">
              Here's what's happening at <span className="text-white font-semibold">{schoolName}</span>.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { label: `${stats.totalStudents} Students`, icon: Users },
                { label: `${stats.totalTeachers} Teachers`, icon: UserCircle },
                { label: `${stats.attendanceRate}% Attendance`, icon: Activity },
              ].map(({ label, icon: Icon }) => (
                <span key={label} className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                  <Icon className="w-3.5 h-3.5" />{label}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => fetchAll(true)} disabled={refreshing}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {STAT_CARDS.map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <StatCard {...c} loading={false} onClick={() => navigate(c.action)} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <DashCard title="Attendance Overview" subtitle="Monthly attendance rate (%)" action="View Details" onAction={() => navigate("/school-admin/attendance")}>
            <AttendanceChart data={attendance} loading={false} />
          </DashCard>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <DashCard title="Fees Collection" subtitle="Monthly collected vs target" action="View Details" onAction={() => navigate("/school-admin/fees")}>
            <FeesChart collected={fees?.total_collected} target={fees?.target} monthlyData={fees?.monthly} loading={false} />
          </DashCard>
        </motion.div>
      </div>

      {/* Person lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <DashCard title="Students" subtitle={`${students.length} total`} action="Manage" onAction={() => navigate("/school-admin/student-management")} className="!p-0">
            <div className="-mx-6 -mb-6">
              <PersonList items={students} loading={false} emptyIcon={Users} emptyLabel="No students found"
                onViewAll={() => navigate("/school-admin/student-management")}
                onViewItem={(id) => navigate(`/school-admin/student-management/${id}`)}
                totalLabel="students" />
            </div>
          </DashCard>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <DashCard title="Teachers" subtitle={`${teachers.length} teaching staff`} action="Manage" onAction={() => navigate("/school-admin/teachers-management")} className="!p-0">
            <div className="-mx-6 -mb-6">
              <PersonList items={teachers} loading={false} emptyIcon={UserCircle} emptyLabel="No teachers found"
                onViewAll={() => navigate("/school-admin/teachers-management")}
                onViewItem={(id) => navigate(`/school-admin/teachers-management/${id}`)}
                totalLabel="teachers" />
            </div>
          </DashCard>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <DashCard title="Quick Actions" subtitle="Jump to common tasks">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {QUICK_ACTIONS.map((a, i) => (
              <motion.button key={a.label} onClick={() => navigate(a.path)}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${a.color}18` }}>
                  <a.icon className="w-5 h-5" style={{ color: a.color }} />
                </div>
                <span className="text-xs font-semibold text-slate-600 text-center leading-tight">{a.label}</span>
              </motion.button>
            ))}
          </div>
        </DashCard>
      </motion.div>

      {/* Academic Performance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <DashCard title="Academic Performance" subtitle="Grade distribution, GPA & subject averages" action="View Results" onAction={() => navigate("/school-admin/results")}>
          <div className="space-y-8">
            <GradeChart gradeDistribution={academics?.grade_distribution} overallGpa={academics?.overall_gpa} loading={false} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Subject Performance</p>
              <SubjectChart subjectPerformance={academics?.subject_performance} loading={false} />
            </div>
          </div>
        </DashCard>
      </motion.div>

    </div>
  );
};

export default SchoolAdminDashboard;