// layouts/AuthLayout.jsx
// ─── No logic changes needed here — this was already correct ─────────────────
// The redirect logic reads `user` from AuthContext which is now correctly
// populated by the fixed login() and loadUser() functions.

import { motion } from "framer-motion";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthLayout = () => {
  const { isAuthenticated, loading, user, getRoleDashboardPath } = useAuth();

  // Show spinner while the token is being validated on mount
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  // Already authenticated — send straight to the correct dashboard
  if (isAuthenticated && user) {
    return <Navigate to={getRoleDashboardPath(user.role)} replace />;
  }

  const floatVariants = {
    slow: {
      y: [0, -20, 0],
      transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
    },
    medium: {
      y: [0, -15, 0],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 },
    },
    fast: {
      y: [0, -10, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 },
    },
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400 rounded-full opacity-20 blur-3xl"
          variants={floatVariants} animate="slow" />
        <motion.div className="absolute top-1/4 -left-16 w-48 h-48 bg-indigo-500 rounded-full opacity-15 blur-3xl"
          variants={floatVariants} animate="medium" />
        <motion.div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-purple-600 rounded-full opacity-10 blur-3xl"
          variants={floatVariants} animate="fast" />
        <motion.div className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-600 rounded-full opacity-10 blur-3xl"
          variants={floatVariants} animate="slow" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300 rounded-full opacity-5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Page content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
        className="relative z-10 min-h-screen flex items-center justify-center">
        <Outlet />
      </motion.div>
    </div>
  );
};

export default AuthLayout;