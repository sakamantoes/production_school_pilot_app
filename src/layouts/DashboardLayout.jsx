import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  School,
  Users,
  User,
  Settings,
  BarChart3,
  History,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Bell,
  BookOpen,
  CreditCard,
  Shield,
  UserPlus,
  GraduationCap,
  ClipboardCheck,
  FileText,
  Clock,
  Building,
  Mail,
  Award,
  TrendingUp,
  FileCheck,
  Upload,
  PlusCircle,
  Activity,
  Database,
  Menu,
  X,
} from "lucide-react";
import { Announcement, ControlPoint, MoneyOff } from "@mui/icons-material";
import FloatingChatbot from "../components/FloatingChatbot";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const getRoleDashboardPath = (role) => {
  switch (role?.toLowerCase()) {
    case "super_admin":    return "/super-admin/dashboard";
    case "school_admin":   return "/school-admin/dashboard";
    case "teacher":        return "/teacher/dashboard";
    case "student":        return "/student/dashboard";
    default:               return "/";
  }
};

const getRoleDisplayName = (role) => {
  const map = {
    super_admin:  "Super Administrator",
    school_admin: "School Administrator",
    teacher:      "Teacher",
    student:      "Student",
  };
  return map[role?.toLowerCase()] || role || "User";
};

const getRoleBadgeColor = (role) => {
  const map = {
    super_admin:  "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",
    school_admin: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
    teacher:      "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",
    student:      "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  };
  return map[role?.toLowerCase()] || "bg-slate-500/15 text-slate-400";
};

// ─────────────────────────────────────────────────────────────
// Menu definitions — defined outside component (stable refs)
// ─────────────────────────────────────────────────────────────

const getMenuItems = (role, dashboardPath) => {
  const base = [
    { text: "Dashboard",      icon: LayoutDashboard, path: dashboardPath },
    // { text: "Notifications",  icon: Bell,            path: "/notifications" },
  ];

  if (role === "super_admin") return [
    ...base,
    { text: "Overview",          icon: Activity,   path: "/super-admin/dashboard",        group: "Management" },
    { text: "School Management", icon: Building,   path: "/super-admin/schools",           group: "Management" },
    { text: "Create School",     icon: PlusCircle, path: "/super-admin/create-school",     group: "Management" },
    { text: "Activate Accounts", icon: Shield,     path: "/super-admin/activate-accounts", group: "Management" },
    { text: "User Management",   icon: Users,      path: "/super-admin/users",             group: "Management" },
    { text: "System Settings",   icon: Settings,   path: "/super-admin/settings",          group: "System" },
    { text: "Audit Logs",        icon: History,    path: "/super-admin/audit-logs",        group: "System" },
    { text: "Reports",           icon: BarChart3,  path: "/super-admin/reports",           group: "System" },
    { text: "Database Backup",   icon: Database,   path: "/super-admin/backup",            group: "System" },
  ];

  if (role === "school_admin") return [
    ...base,
    { text: "My Profile",           icon: User,          path: "/school-admin/profile",            group: "Account" },
    { text: "Student Management",       icon: UserPlus,      path: "/school-admin/student-management",     group: "People" },
    { text: "Teacher Management",   icon: UserPlus,      path: "/school-admin/teachers-management",           group: "People" },
    { text: "Academic Management",     icon: GraduationCap, path: "/school-admin/academic-management",            group: "Academics" },
    { text: "Subject Management",   icon: BookOpen,      path: "/school-admin/subjects",           group: "Academics" },
    { text: "Timetable",            icon: Clock,         path: "/school-admin/timetable",          group: "Academics" },
    { text: "Attendance",           icon: ClipboardCheck,path: "/school-admin/attendance",         group: "Academics" },
    { text: "Result Approval",      icon: FileCheck,     path: "/school-admin/result-approval",    group: "Academics" },
    { text: "Bulk Student Upload",  icon: Upload,        path: "/school-admin/bulk-upload",        group: "Academics" },
    { text: "Fee Management",       icon: CreditCard,    path: "/school-admin/fees",               group: "Finance" },
    { text: "Subscription Plan",    icon: MoneyOff,      path: "/school-admin/subscriptions",      group: "Finance" },
    { text: "Results",              icon: FileText,      path: "/school-admin/results",            group: "Reports" },
    { text: "Reports",              icon: BarChart3,     path: "/school-admin/reports",            group: "Reports" },
    { text: "Announcements",        icon: Announcement,  path: "/school-admin/announcements",      group: "Comms" },
    { text: "Create Notification",  icon: Mail,          path: "/school-admin/create-notification",group: "Comms" },
  ];

  if (role === "teacher") return [
    ...base,
    { text: "Overview",       icon: Activity,      path: "/teacher/dashboard",      group: "Overview" },
    { text: "My Classes",     icon: School,        path: "/teacher/classes",        group: "Teaching" },
    { text: "My Subjects",    icon: BookOpen,      path: "/teacher/subjects",       group: "Teaching" },
    { text: "Mark Attendance",icon: ClipboardCheck,path: "/teacher/attendance",     group: "Teaching" },
    { text: "Enter Scores",   icon: FileText,      path: "/teacher/enter-scores",   group: "Teaching" },
    { text: "Timetable",      icon: Clock,         path: "/teacher/timetable",      group: "Teaching" },
    { text: "Students",       icon: Users,         path: "/teacher/students",       group: "Teaching" },
    { text: "Submit Results", icon: Award,         path: "/teacher/submit-results", group: "Teaching" },
    { text: "Lesson Notes",   icon: FileText,      path: "/teacher/lesson-notes",   group: "Teaching" },
    { text: "Announcements",  icon: Announcement,  path: "/teacher/announcements",  group: "Comms" },
  ];

  if (role === "student") return [
    ...base,
    { text: "Overview",          icon: Activity,      path: "/student/dashboard",   group: "Overview" },
    { text: "My Results",        icon: Award,         path: "/student/results",     group: "Academics" },
    { text: "My Profile",        icon: User,          path: "/student/profile",     group: "Academics" },
    { text: "Timetable",         icon: Clock,         path: "/student/timetable",   group: "Academics" },
    { text: "Attendance Record", icon: TrendingUp,    path: "/student/attendance",  group: "Academics" },
    { text: "Fee Statement",     icon: CreditCard,    path: "/student/studentFees", group: "Finance" },
    { text: "Assignments",       icon: FileText,      path: "/student/assignments", group: "Academics" },
    { text: "Announcements",     icon: Announcement,  path: "/student/announcements",group: "Comms" },
    { text: "Class Schedule",    icon: Calendar,      path: "/student/schedule",    group: "Academics" },
  ];

  return base;
};

// ─────────────────────────────────────────────────────────────
// NavItem — stable component outside parent
// ─────────────────────────────────────────────────────────────

const NavItem = ({ item, isActive, collapsed, onClick }) => (
  <button
    onClick={onClick}
    title={collapsed ? item.text : undefined}
    className={`
      w-full flex items-center gap-3 rounded-xl text-sm font-medium
      transition-all duration-200 group relative
      ${collapsed ? "justify-center p-3" : "px-3 py-2.5"}
      ${isActive
        ? "bg-white/10 text-white shadow-sm"
        : "text-slate-400 hover:text-white hover:bg-white/6"
      }
    `}
  >
    {isActive && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-400 rounded-r-full" />
    )}
    <item.icon className={`flex-shrink-0 transition-all ${collapsed ? "w-5 h-5" : "w-4 h-4"} ${isActive ? "text-blue-400" : ""}`} />
    {!collapsed && <span className="truncate">{item.text}</span>}

    {/* Tooltip */}
    {collapsed && (
      <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50 border border-slate-700">
        {item.text}
      </span>
    )}
  </button>
);

// ─────────────────────────────────────────────────────────────
// SidebarContent — extracted so it renders identically on
// mobile drawer and desktop static sidebar
// ─────────────────────────────────────────────────────────────

const SidebarContent = ({
  collapsed, setCollapsed, menuItems, location, navigate,
  userFullName, userImage, role, schoolName, logout, setSidebarOpen,
}) => {
  // Group menu items
  const grouped = menuItems.reduce((acc, item) => {
    const g = item.group || "General";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const handleNav = useCallback((path) => {
    navigate(path);
    setSidebarOpen(false);
  }, [navigate, setSidebarOpen]);

  return (
    <div className="flex flex-col h-full bg-[#0f1623] text-white">

      {/* Brand */}
      <div className={`flex items-center border-b border-white/8 flex-shrink-0 ${collapsed ? "justify-center p-4" : "gap-3 px-5 py-4"}`}>
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-blue-500/40 shadow-lg">
            <img src="/logo.jpg" alt="SchoolPilot" className="w-full h-full object-cover" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f1623]" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-base leading-tight tracking-tight">SchoolPilot</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">Education Platform</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden lg:flex ml-auto items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-all flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User card */}
      <div className={`border-b border-white/8 flex-shrink-0 ${collapsed ? "py-4 px-2 flex justify-center" : "px-4 py-4"}`}>
        <div className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
          <div className="relative flex-shrink-0">
            <div className={`rounded-full overflow-hidden ring-2 ring-white/10 ${collapsed ? "w-10 h-10" : "w-10 h-10"}`}>
              {userImage
                ? <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {userFullName?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                )
              }
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f1623]" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userFullName}</p>
              <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${getRoleBadgeColor(role)}`}>
                {getRoleDisplayName(role)}
              </span>
              {schoolName && schoolName !== "Education Management" && (
                <p className="text-xs text-slate-500 truncate mt-1">{schoolName}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-1.5">
                {group}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map((item) => (
                <NavItem
                  key={item.text}
                  item={item}
                  isActive={location.pathname === item.path}
                  collapsed={collapsed}
                  onClick={() => handleNav(item.path)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/8 p-2 space-y-0.5 flex-shrink-0`}>
        <button
          onClick={() => handleNav("/change-password")}
          className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/6 transition-all
            ${collapsed ? "justify-center p-3" : "px-3 py-2.5"}`}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Change Password</span>}
        </button>

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all
            ${collapsed ? "justify-center p-3" : "px-3 py-2.5"}`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {!collapsed && (
          <p className="text-[10px] text-slate-700 text-center pt-3 pb-1">
            SchoolPilot v2.0 · © 2024
          </p>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main layout
// ─────────────────────────────────────────────────────────────

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();

  const getSchoolName = () => {
    if (!user) return "";
    return user.school?.schoolName || user.schoolName || user.school_name || "Education Management";
  };

  const getUserFullName = () => {
    if (!user) return "User";
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    return user.name || user.username || "User";
  };

  const getUserImage = () => user?.image || user?.profile_image || user?.avatar || null;

  useEffect(() => {
    if (user && (location.pathname === "/" || location.pathname === "/dashboard")) {
      const path = getRoleDashboardPath(user.role);
      if (path !== "/") navigate(path, { replace: true });
    }
  }, [user, location.pathname, navigate]);

  if (!user) return null;

  const role         = user.role?.toLowerCase();
  const dashboardPath = getRoleDashboardPath(role);
  const schoolName   = getSchoolName();
  const userFullName = getUserFullName();
  const userImage    = getUserImage();
  const menuItems    = getMenuItems(role, dashboardPath);

  const sidebarProps = {
    collapsed, setCollapsed, menuItems, location, navigate,
    userFullName, userImage, role, schoolName, logout, setSidebarOpen,
  };

  return (
    <div className="flex h-screen bg-[#f5f6fa] overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          className: "!rounded-xl !shadow-xl !text-sm !font-medium",
          success: { style: { background: "#10b981", color: "#fff" } },
          error:   { style: { background: "#ef4444", color: "#fff" } },
          style:   { background: "#1e293b", color: "#f8fafc" },
        }}
      />

      {/* ── Desktop sidebar (static) ── */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-64"}`}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden flex flex-col shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent {...sidebarProps} collapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 h-16 bg-white border-b border-slate-200/80 flex items-center gap-4 px-4 md:px-6 shadow-sm">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title area — delegates to Navbar */}
          <div className="flex-1 min-w-0">
            <Navbar
              toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              title={`Good ${getGreeting()}, ${userFullName.split(" ")[0]}`}
              subtitle={getRoleDisplayName(user?.role)}
            />
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <Outlet />
          </div>
          <FloatingChatbot />
        </main>
      </div>
    </div>
  );
};

// Time-aware greeting
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
};

export default DashboardLayout;
