import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft, Shield } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Loader from "../Loader";
import toast from "react-hot-toast";

/* ================= Animations ================= */

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* ================= Component ================= */

const LoginAnimation = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    setLoading(true);

    const success = await login({
      email: formData.email,
      password: formData.password,
    });

    setLoading(false);

    // Navigation is handled in AuthContext.login()
  };

  return (
    <div className="relative min-h-screen flex flex-col px-4 sm:px-6 py-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Back button */}
      <div className="max-w-md mx-auto w-full mb-4">
        <Link to="/">
          <motion.button
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </motion.button>
        </Link>
      </div>

      {/* Login Card */}
      <motion.div
        className="z-10 w-full max-w-md mx-auto"
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
      >
        <div className="rounded-xl shadow-xl bg-white/90 backdrop-blur border border-gray-100 overflow-hidden">
          {/* Logo and Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <motion.div
                className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full drop-shadow-[0_10px_25px_rgba(59,130,246,0.35)]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -6, 0],
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                  y: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              >
                <img
                  src="/logo.jpg"
                  alt="Company Logo"
                  className="w-16 h-16 object-contain rounded-full drop-shadow-[0_10px_25px_rgba(59,130,246,0.35)]"
                />
              </motion.div>

              <div className="text-center sm:text-left">
                <motion.h2
                  className="text-xl sm:text-2xl font-bold text-gray-800"
                  variants={itemVariants}
                >
                  Welcome Back
                </motion.h2>
                <motion.p
                  className="text-sm text-gray-600 mt-1"
                  variants={itemVariants}
                >
                  Please sign in to your account
                </motion.p>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="p-6">
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Email Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-blue-50 px-10 py-2.5 rounded-lg outline-none border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    placeholder="Enter your email address"
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-blue-50 px-10 pr-12 py-2.5 rounded-lg outline-none border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-200 transition-all text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Remember Me and Forgot Password */}
              <motion.div 
                variants={itemVariants}
                className="flex items-center justify-between"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Remember me</span>
                </label>
                <Link
                  to="/change-password"
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </motion.div>

              {/* Show Password Toggle */}
              <motion.div variants={itemVariants}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Show Password</span>
                </label>
              </motion.div>

              {/* Submit Button */}
              <motion.div variants={itemVariants} className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader size="sm" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </motion.div>
            </motion.form>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-600 font-semibold hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginAnimation;