import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  User,
  ChevronDown,
  HelpCircle,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

// ─────────────────────────────────────────────────────────────
// Sub-components outside parent — no focus-loss, stable refs
// ─────────────────────────────────────────────────────────────

const UserAvatar = ({ user, size = "sm" }) => {
  const initials = (
    user?.firstName?.[0] ||
    user?.first_name?.[0] ||
    "U"
  ).toUpperCase();
  const image = user?.image || user?.profile_image || user?.avatar;
  const dim = size === "lg" ? "w-11 h-11" : "w-8 h-8";
  const font = size === "lg" ? "text-sm" : "text-xs";

  return image ? (
    <img
      src={image}
      alt="Profile"
      className={`${dim} rounded-full object-cover`}
    />
  ) : (
    <div
      className={`${dim} rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0`}
    >
      <span className={`${font} font-bold text-white`}>{initials}</span>
    </div>
  );
};

const DropdownItem = ({ icon: Icon, label, to, onClick, danger }) => {
  const base =
    "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-150 w-full text-left";
  const normal = "text-slate-300 hover:text-white hover:bg-white/6";
  const red = "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10";

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`${base} ${danger ? red : normal}`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        {label}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={`${base} ${danger ? red : normal}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Navbar
// ─────────────────────────────────────────────────────────────

const Navbar = ({ title, subtitle }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleLogout = useCallback(() => {
    setUserMenuOpen(false);
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const closeMenu = useCallback(() => setUserMenuOpen(false), []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : user?.name || user?.username || "User";

  const roleLabel = user?.role
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const getProfilePath = () => {
    const role = user?.role?.toLowerCase();
    if (role === "school_admin") return "/school-admin/profile";
    if (role === "teacher") return "/teacher/profile";
    if (role === "student") return "/student/profile";
    return "/profile";
  };

  return (
    <div className="w-full flex items-center gap-4 h-full">
      {/* ── Page title ── */}
      <div className="flex-1 min-w-0 hidden md:block">
        <h1 className="text-[15px] font-semibold text-slate-800 truncate leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Search bar ── */}
      <div className="flex-1 md:flex-none md:w-72 xl:w-80">
        <div
          className={`relative flex items-center h-9 rounded-xl border transition-all duration-200
            ${
              searchFocused
                ? "border-blue-500/50 bg-white shadow-sm shadow-blue-500/10"
                : "border-slate-200 bg-slate-100 hover:border-slate-300"
            }`}
        >
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search anything…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full h-full bg-transparent pl-8 pr-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Notification bell ── */}
      <NotificationBell />

      {/* ── Divider ── */}
      <div className="hidden md:block w-px h-6 bg-slate-200" />

      {/* ── User menu ── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          className={`flex items-center gap-2.5 h-9 pl-1 pr-3 rounded-xl border transition-all duration-200
            ${
              userMenuOpen
                ? "border-blue-500/30 bg-blue-50 shadow-sm"
                : "border-transparent hover:bg-slate-100 hover:border-slate-200"
            }`}
        >
          <div className="relative">
            <UserAvatar user={user} size="sm" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="hidden md:block text-left max-w-[110px]">
            <p className="text-[13px] font-semibold text-slate-800 truncate leading-tight">
              {displayName.split(" ")[0]}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{roleLabel}</p>
          </div>
          <ChevronDown
            className={`hidden md:block w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-60 rounded-2xl overflow-hidden z-[70] shadow-2xl shadow-slate-900/20 border border-slate-700/60"
              style={{ background: "#131c2e" }}
            >
              {/* User info header */}
              <div className="px-4 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <UserAvatar user={user} size="lg" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#131c2e]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {user?.email}
                    </p>
                    <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu links */}
              <div className="py-1.5">
                <DropdownItem
                  icon={User}
                  label="My Profile"
                  to={getProfilePath()}
                  onClick={closeMenu}
                />
                <DropdownItem
                  icon={Settings}
                  label="Change Password"
                  to="/change-password"
                  onClick={closeMenu}
                />
                <DropdownItem
                  icon={HelpCircle}
                  label="Help & Support"
                  to="/help"
                  onClick={closeMenu}
                />
              </div>

              <div className="border-t border-white/8 py-1.5">
                <DropdownItem
                  icon={LogOut}
                  label="Sign Out"
                  onClick={handleLogout}
                  danger
                />
              </div>

              {/* Online indicator footer */}
              <div className="px-4 py-2.5 border-t border-white/8 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-slate-500 font-medium">
                  Active now
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Navbar;
