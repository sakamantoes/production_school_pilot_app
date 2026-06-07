import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────
// Sub-components outside parent to prevent focus-loss on re-render
// ─────────────────────────────────────────────────────────────

const InputField = ({
  icon: Icon,
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  required,
  rightSlot,
  error,
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
      {label}
      {required && <span className="text-rose-400 ml-1">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className={`w-4 h-4 transition-colors ${error ? "text-rose-400" : "text-slate-400"}`} />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full h-11 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300
          pl-10 ${rightSlot ? "pr-11" : "pr-4"}
          border-2 outline-none transition-all duration-200 bg-slate-50/60
          ${error
            ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:bg-white"
            : "border-slate-200 focus:border-blue-500 focus:bg-white hover:border-slate-300"
          }`}
      />
      {rightSlot && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xs text-rose-500 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Success overlay — shown after successful login
// ─────────────────────────────────────────────────────────────

const SuccessOverlay = ({ userName }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white rounded-2xl"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
      className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5"
    >
      <CheckCircle className="w-10 h-10 text-emerald-600" />
    </motion.div>
    <motion.h2
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="text-2xl font-bold text-slate-800 mb-1"
    >
      Welcome back{userName ? `, ${userName}` : ""}!
    </motion.h2>
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="text-sm text-slate-500 mb-8"
    >
      Login successful — redirecting you now…
    </motion.p>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.45 }}
      className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"
    />
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

const LoginAnimation = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [userName, setUserName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "Invalid email address";
    if (!formData.password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      // Show success confirmation before redirect
      if (result && result.success !== false) {
        const name = result?.user?.firstName || result?.data?.firstName || "";
        setUserName(name);
        setLoginSuccess(true);
        
        // Redirect after success overlay
        setTimeout(() => {
          const from = location.state?.from?.pathname || "/dashboard";
          navigate(from, { replace: true });
        }, 1500);
      }
    } catch (err) {
      // Handle different error scenarios
      const errorMessage = err?.response?.data?.message || err?.message || "Login failed. Please try again.";
      
      // Specific error messages for common scenarios
      if (errorMessage.toLowerCase().includes("invalid") || 
          errorMessage.toLowerCase().includes("credential")) {
        toast.error("Invalid email or password. Please try again.");
      } else if (errorMessage.toLowerCase().includes("verify")) {
        toast.error("Please verify your email before logging in.");
      } else if (errorMessage.toLowerCase().includes("blocked") || 
                 errorMessage.toLowerCase().includes("suspended")) {
        toast.error("Your account has been suspended. Contact support.");
      } else {
        toast.error(errorMessage);
      }
      
      // Clear password field on error for security
      setFormData(prev => ({ ...prev, password: "" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0fdf4 100%)" }}
    >
      {/* Back link */}
      <div className="w-full max-w-md mb-5 block sm:hidden">
        <Link to="/">
          <motion.span
            whileHover={{ x: -4 }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </motion.span>
        </Link>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden"
      >
        {/* Success overlay */}
        <AnimatePresence>{loginSuccess && <SuccessOverlay userName={userName} />}</AnimatePresence>

        {/* Header */}
        <div className="px-8 pt-9 pb-7 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0, y: [0, -5, 0] }}
              transition={{
                scale: { type: "spring", stiffness: 200, damping: 18 },
                rotate: { duration: 0.4 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
              }}
              className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg shadow-blue-100"
            >
              <img
                src="/logo.jpg"
                alt="Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement.classList.add(
                    "bg-gradient-to-br", "from-blue-600", "to-indigo-600",
                    "flex", "items-center", "justify-center"
                  );
                }}
              />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
              <p className="text-sm text-slate-500 mt-0.5">Sign in to your account to continue</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 py-7">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <InputField
              icon={Mail}
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              error={errors.email}
            />

            <InputField
              icon={Lock}
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              error={errors.password}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 transition-colors"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors select-none">
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                  shadow-lg shadow-blue-200 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/60">
          <p className="text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 font-semibold hover:underline transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Trust note */}
      <p className="text-xs text-slate-400 mt-6 text-center">
        Your data is encrypted and never shared with third parties.
      </p>
    </div>
  );
};

export default LoginAnimation;