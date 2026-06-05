// layouts/AuthLayout.jsx
import { motion } from "framer-motion";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to waitlist if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/waitlist" replace />;
  }

  const floatVariants = {
    slow: {
      y: [0, -20, 0],
      transition: { 
        duration: 8, 
        repeat: Infinity, 
        ease: "easeInOut" 
      },
    },
    medium: {
      y: [0, -15, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1,
      },
    },
    fast: {
      y: [0, -10, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 2,
      },
    },
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400 rounded-full opacity-20 blur-3xl"
          variants={floatVariants}
          animate="slow"
        />
        <motion.div
          className="absolute top-1/4 -left-16 w-48 h-48 bg-indigo-500 rounded-full opacity-15 blur-3xl"
          variants={floatVariants}
          animate="medium"
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-purple-600 rounded-full opacity-10 blur-3xl"
          variants={floatVariants}
          animate="fast"
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-600 rounded-full opacity-10 blur-3xl"
          variants={floatVariants}
          animate="slow"
        />
        
        {/* Additional decorative blobs */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300 rounded-full opacity-5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full min-h-screen flex flex-col "
      >
        {/* Optional: Add a subtle gradient overlay */}
        <div className="absolute inset-0 bg-white pointer-events-none">
        </div>
        
        {/* Content Container */}
        <div className="relative z-20 flex-1 flex items-center justify-center">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthLayout;