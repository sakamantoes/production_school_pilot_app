import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building,
  Shield,
  UserCircle,
  Phone,
  X,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  MapPin,
  Globe,
  Calendar,
  Award,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// ALL sub-components are defined OUTSIDE the parent component.
// This is critical — if defined inside, they get recreated on every keystroke,
// React unmounts/remounts them, and the input loses focus after each character.
// ─────────────────────────────────────────────────────────────────────────────

const InputField = ({
  icon: Icon,
  label,
  name,
  type = "text",
  required,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  rightSlot,
  hint,
  ...props
}) => {
  const hasError = touched && error;
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
        {required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon
              className={`w-4 h-4 transition-colors ${
                hasError ? "text-rose-400" : "text-slate-400"
              }`}
            />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full h-11 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300
            ${Icon ? "pl-10" : "pl-4"} ${rightSlot ? "pr-11" : "pr-4"}
            border-2 outline-none transition-all duration-200 bg-slate-50/60
            ${
              hasError
                ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:bg-white"
                : "border-slate-200 focus:border-blue-500 focus:bg-white hover:border-slate-300"
            }`}
          {...props}
        />
        {rightSlot && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {hint && !hasError && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
      <AnimatePresence>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-xs text-rose-500 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

const FileUploadField = ({
  label,
  accept,
  icon: Icon,
  uploading,
  preview,
  previewType,
  fieldName,
  onUpload,
  onRemove,
  hint,
}) => {
  const isPdf = typeof preview === "object" && preview?.type === "pdf";

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </label>
      {preview ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative inline-flex items-center gap-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl"
        >
          {isPdf ? (
            <>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-sm font-medium text-slate-700 truncate max-w-[160px]">
                {preview.name}
              </span>
            </>
          ) : (
            <img
              src={preview}
              alt={label}
              className="w-14 h-14 object-cover rounded-lg border-2 border-white shadow-sm"
            />
          )}
          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
            <Check className="w-3.5 h-3.5" />
            Uploaded
          </div>
          <button
            type="button"
            onClick={() => onRemove(previewType, fieldName)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      ) : (
        <label className="block cursor-pointer group">
          <input
            type="file"
            accept={accept}
            onChange={onUpload}
            className="hidden"
            disabled={uploading}
          />
          <div
            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed transition-all duration-200
              ${
                uploading
                  ? "border-blue-300 bg-blue-50 cursor-wait"
                  : "border-slate-200 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/40 group-active:scale-[0.99]"
              }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
              ${uploading ? "bg-blue-100" : "bg-slate-100 group-hover:bg-blue-100"}`}
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon className="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                {uploading ? "Uploading…" : "Click to upload"}
              </p>
              {hint && (
                <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
              )}
            </div>
          </div>
        </label>
      )}
    </div>
  );
};

const PasswordStrengthDots = ({ password }) => {
  const checks = [
    { label: "8+ characters", ok: password?.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
  ];
  return (
    <div className="flex flex-wrap gap-3 mt-2">
      {checks.map((c) => (
        <span
          key={c.label}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            c.ok ? "text-emerald-600" : "text-slate-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              c.ok ? "bg-emerald-500" : "bg-slate-300"
            }`}
          />
          {c.label}
        </span>
      ))}
    </div>
  );
};

const StepIndicator = ({ steps, current, completed, onStepClick }) => (
  <div className="flex items-center justify-center gap-0">
    {steps.map((step, i) => {
      const isActive = step.id === current;
      const isDone = completed.includes(step.id);
      const isClickable = isDone || i === 0 || completed.includes(steps[i - 1]?.id);

      return (
        <div key={step.id} className="flex items-center">
          <button
            type="button"
            disabled={!isClickable}
            onClick={() => isClickable && onStepClick(step.id)}
            className={`relative flex flex-col items-center gap-2 group transition-all
              ${isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110"
                    : isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
            >
              {isDone && !isActive ? (
                <Check className="w-4 h-4" />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
            </div>
            <span
              className={`text-xs font-semibold hidden sm:block transition-colors ${
                isActive ? "text-blue-600" : isDone ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </button>

          {i < steps.length - 1 && (
            <div className="w-12 sm:w-16 mx-2 mb-5 sm:mb-0 h-0.5 transition-colors duration-500">
              <div
                className={`h-full transition-all duration-500 ${
                  isDone ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "personal", label: "Personal", icon: User },
  { id: "school", label: "School", icon: Building },
  { id: "account", label: "Account", icon: Shield },
];

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const RegisterAnimation = () => {
  const [formData, setFormData] = useState({
    schoolName: "", schoolEmail: "", logo: "", phoneNumber: "",
    website: "", address: "", city: "", state: "", country: "",
    coverImage: "", isRegistered: false, registrationNumber: "",
    registrationDocument: "", principalName: "", establishedYear: "",
    firstName: "", lastName: "", email: "", username: "",
    password: "", confirmPassword: "", phone: "", image: "",
  });

  const [imagePreviews, setImagePreviews] = useState({
    logo: null, coverImage: null, registrationDocument: null, profileImage: null,
  });

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [completedSections, setCompletedSections] = useState([]);
  const [uploadingImages, setUploadingImages] = useState({
    logo: false, coverImage: false, registrationDocument: false, profileImage: false,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = useCallback((e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleBlur = useCallback((e) => {
    const name = e.target.name;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    validateSingleField(name, e.target.value);
  }, []);

  const validateSingleField = (fieldName, value) => {
    let error = "";
    switch (fieldName) {
      case "firstName":
        if (!value?.trim()) error = "First name is required";
        else if (value.trim().length < 2) error = "Must be at least 2 characters";
        break;
      case "lastName":
        if (!value?.trim()) error = "Last name is required";
        else if (value.trim().length < 2) error = "Must be at least 2 characters";
        break;
      case "email":
        if (!value?.trim()) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email format";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 8) error = "Must be at least 8 characters";
        else if (!/[A-Z]/.test(value)) error = "Must contain an uppercase letter";
        else if (!/[0-9]/.test(value)) error = "Must contain a number";
        break;
      case "confirmPassword":
        if (!value) error = "Please confirm your password";
        break;
      default:
        break;
    }
    setFieldErrors((prev) => ({ ...prev, [fieldName]: error }));
    return error;
  };

  const removePreview = useCallback((type, fieldName) => {
    setImagePreviews((prev) => ({ ...prev, [type]: null }));
    setFormData((prev) => ({ ...prev, [fieldName]: "" }));
  }, []);

  const uploadToCloudinary = async (file, type) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error("Cloudinary configuration is missing");
      return null;
    }
    setUploadingImages((prev) => ({ ...prev, [type]: true }));
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd }
      );
      const data = await res.json();
      if (data.secure_url) {
        toast.success(`${type} uploaded!`);
        return data.secure_url;
      }
      throw new Error(data.error?.message || "Upload failed");
    } catch (err) {
      toast.error(`Failed to upload ${type}`);
      return null;
    } finally {
      setUploadingImages((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleFileUpload = useCallback(async (e, fieldName, uploadType) => {
    const file = e.target.files[0];
    if (!file) return;
    const imgTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const docTypes = ["application/pdf"];
    const allowed = uploadType === "registrationDocument"
      ? [...imgTypes, ...docTypes]
      : imgTypes;
    if (!allowed.includes(file.type)) {
      toast.error("Invalid file type");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    if (file.type !== "application/pdf") {
      const reader = new FileReader();
      reader.onloadend = () =>
        setImagePreviews((prev) => ({ ...prev, [uploadType]: reader.result }));
      reader.readAsDataURL(file);
    } else {
      setImagePreviews((prev) => ({
        ...prev,
        [uploadType]: { name: file.name, type: "pdf" },
      }));
    }
    const url = await uploadToCloudinary(file, uploadType);
    if (url) {
      setFormData((prev) => ({ ...prev, [fieldName]: url }));
    } else {
      removePreview(uploadType, fieldName);
    }
  }, [removePreview]);

  const goToNextSection = useCallback(() => {
    if (activeSection === "personal") {
      const firstErr = validateSingleField("firstName", formData.firstName);
      const lastErr = validateSingleField("lastName", formData.lastName);
      setTouchedFields((p) => ({ ...p, firstName: true, lastName: true }));
      if (firstErr || lastErr) {
        toast.error("Please complete your name before continuing");
        return;
      }
    }
    const idx = SECTIONS.findIndex((s) => s.id === activeSection);
    if (idx < SECTIONS.length - 1) {
      setCompletedSections((prev) =>
        prev.includes(activeSection) ? prev : [...prev, activeSection]
      );
      setActiveSection(SECTIONS[idx + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeSection, formData.firstName, formData.lastName]);

  const goToPreviousSection = useCallback(() => {
    const idx = SECTIONS.findIndex((s) => s.id === activeSection);
    if (idx > 0) {
      setActiveSection(SECTIONS[idx - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeSection]);

  const handleStepClick = useCallback((sectionId) => {
    setActiveSection(sectionId);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ["firstName", "lastName", "email", "password", "confirmPassword"];
    let valid = true;
    const newTouched = {};
    required.forEach((f) => {
      newTouched[f] = true;
      if (validateSingleField(f, formData[f])) valid = false;
    });
    if (formData.password !== formData.confirmPassword) {
      setFieldErrors((p) => ({ ...p, confirmPassword: "Passwords do not match" }));
      valid = false;
    }
    setTouchedFields((p) => ({ ...p, ...newTouched }));
    if (!valid) { toast.error("Please fix errors before submitting"); return; }
    if (!termsAccepted) { toast.error("Please accept the Terms of Service"); return; }

    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };
      const optionals = [
        "username","phone","image","schoolName","schoolEmail","logo","phoneNumber",
        "website","address","city","state","country","coverImage","registrationNumber",
        "registrationDocument","principalName",
      ];
      optionals.forEach((k) => {
        if (formData[k]?.trim?.()) payload[k] = formData[k].trim();
      });
      if (formData.establishedYear) payload.establishedYear = parseInt(formData.establishedYear);
      payload.isRegistered = formData.isRegistered;

      const result = await register(payload);
      if (result && result.success !== false) {
        setSuccess(true);
        toast.success("Account created! Redirecting…");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        throw new Error(result?.message || "Registration failed");
      }
    } catch (err) {
      toast.error(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const isUploading = Object.values(uploadingImages).some(Boolean);
  const currentIdx = SECTIONS.findIndex((s) => s.id === activeSection);

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #fafafa 50%, #f0fdf4 100%)" }}>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Create your account
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            Join thousands of schools already using our platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">

          {/* Step indicator */}
          <div className="px-8 pt-7 pb-6 border-b border-slate-100 bg-slate-50/50">
            <StepIndicator
              steps={SECTIONS}
              current={activeSection}
              completed={completedSections}
              onStepClick={handleStepClick}
            />
          </div>

          {/* Form body */}
          <div className="p-7 sm:p-9">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">You're all set! 🎉</h2>
                <p className="text-slate-500 mb-8">Account created. Redirecting to login…</p>
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto" />
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Section title */}
                <div className="mb-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSection + "-title"}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeSection === "personal" && (
                        <>
                          <h2 className="text-xl font-bold text-slate-800">Personal information</h2>
                          <p className="text-sm text-slate-500 mt-0.5">Tell us a bit about yourself</p>
                        </>
                      )}
                      {activeSection === "school" && (
                        <>
                          <h2 className="text-xl font-bold text-slate-800">School details</h2>
                          <p className="text-sm text-slate-500 mt-0.5">Help us set up your school profile</p>
                        </>
                      )}
                      {activeSection === "account" && (
                        <>
                          <h2 className="text-xl font-bold text-slate-800">Account setup</h2>
                          <p className="text-sm text-slate-500 mt-0.5">Secure your account with a strong password</p>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Section fields */}
                <AnimatePresence mode="wait">
                  {/* ── PERSONAL ── */}
                  {activeSection === "personal" && (
                    <motion.div
                      key="personal"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputField
                          icon={User}
                          label="First Name"
                          name="firstName"
                          required
                          placeholder="John"
                          value={formData.firstName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={fieldErrors.firstName}
                          touched={touchedFields.firstName}
                        />
                        <InputField
                          icon={User}
                          label="Last Name"
                          name="lastName"
                          required
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={fieldErrors.lastName}
                          touched={touchedFields.lastName}
                        />
                      </div>

                      <InputField
                        icon={Phone}
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        placeholder="+234 800 000 0000"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={fieldErrors.phone}
                        touched={touchedFields.phone}
                        hint="Optional — used for account recovery"
                      />

                      <FileUploadField
                        label="Profile Photo (optional)"
                        accept="image/*"
                        icon={Upload}
                        uploading={uploadingImages.profileImage}
                        preview={imagePreviews.profileImage}
                        previewType="profileImage"
                        fieldName="image"
                        onUpload={(e) => handleFileUpload(e, "image", "profileImage")}
                        onRemove={removePreview}
                        hint="JPEG, PNG or WEBP — max 5 MB"
                      />
                    </motion.div>
                  )}

                  {/* ── SCHOOL ── */}
                  {activeSection === "school" && (
                    <motion.div
                      key="school"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputField
                          icon={Building}
                          label="School Name"
                          name="schoolName"
                          placeholder="Oxford International School"
                          value={formData.schoolName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={fieldErrors.schoolName}
                          touched={touchedFields.schoolName}
                        />
                        <InputField
                          icon={Mail}
                          label="School Email"
                          name="schoolEmail"
                          type="email"
                          placeholder="contact@school.edu"
                          value={formData.schoolEmail}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={fieldErrors.schoolEmail}
                          touched={touchedFields.schoolEmail}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputField
                          icon={Phone}
                          label="School Phone"
                          name="phoneNumber"
                          type="tel"
                          placeholder="+234 800 000 0000"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={fieldErrors.phoneNumber}
                          touched={touchedFields.phoneNumber}
                        />
                        <InputField
                          icon={Globe}
                          label="Website"
                          name="website"
                          placeholder="https://school.edu"
                          value={formData.website}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={fieldErrors.website}
                          touched={touchedFields.website}
                        />
                      </div>

                      <InputField
                        icon={MapPin}
                        label="Address"
                        name="address"
                        placeholder="123 Education Street"
                        value={formData.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={fieldErrors.address}
                        touched={touchedFields.address}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <InputField
                          icon={MapPin}
                          label="City"
                          name="city"
                          placeholder="Lagos"
                          value={formData.city}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={fieldErrors.city}
                          touched={touchedFields.city}
                        />
                        <InputField
                          icon={MapPin}
                          label="State"
                          name="state"
                          placeholder="Lagos"
                          value={formData.state}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={fieldErrors.state}
                          touched={touchedFields.state}
                        />
                        <InputField
                          icon={Globe}
                          label="Country"
                          name="country"
                          placeholder="Nigeria"
                          value={formData.country}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={fieldErrors.country}
                          touched={touchedFields.country}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InputField
                          icon={User}
                          label="Principal Name"
                          name="principalName"
                          placeholder="Dr. Sarah Johnson"
                          value={formData.principalName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={fieldErrors.principalName}
                          touched={touchedFields.principalName}
                        />
                        <InputField
                          icon={Calendar}
                          label="Established Year"
                          name="establishedYear"
                          type="number"
                          placeholder="2000"
                          value={formData.establishedYear}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={fieldErrors.establishedYear}
                          touched={touchedFields.establishedYear}
                        />
                      </div>

                      <InputField
                        icon={Award}
                        label="Registration Number"
                        name="registrationNumber"
                        placeholder="REG123456"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={fieldErrors.registrationNumber}
                        touched={touchedFields.registrationNumber}
                      />

                      {/* Divider */}
                      <div className="pt-1">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                          Media &amp; Documents
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <FileUploadField
                            label="School Logo"
                            accept="image/*"
                            icon={ImageIcon}
                            uploading={uploadingImages.logo}
                            preview={imagePreviews.logo}
                            previewType="logo"
                            fieldName="logo"
                            onUpload={(e) => handleFileUpload(e, "logo", "logo")}
                            onRemove={removePreview}
                            hint="Square image recommended"
                          />
                          <FileUploadField
                            label="Cover Image"
                            accept="image/*"
                            icon={ImageIcon}
                            uploading={uploadingImages.coverImage}
                            preview={imagePreviews.coverImage}
                            previewType="coverImage"
                            fieldName="coverImage"
                            onUpload={(e) => handleFileUpload(e, "coverImage", "coverImage")}
                            onRemove={removePreview}
                            hint="Wide banner image"
                          />
                        </div>

                        <div className="mt-5">
                          <FileUploadField
                            label="Registration Document"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            icon={FileText}
                            uploading={uploadingImages.registrationDocument}
                            preview={imagePreviews.registrationDocument}
                            previewType="registrationDocument"
                            fieldName="registrationDocument"
                            onUpload={(e) => handleFileUpload(e, "registrationDocument", "registrationDocument")}
                            onRemove={removePreview}
                            hint="PDF or image — official govt document"
                          />
                        </div>
                      </div>

                      {/* Registered toggle */}
                      <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-slate-100 bg-slate-50/60 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                        <input
                          type="checkbox"
                          name="isRegistered"
                          checked={formData.isRegistered}
                          onChange={handleChange}
                          className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            Government-registered institution
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Check this if your school is officially registered with the government
                          </p>
                        </div>
                      </label>
                    </motion.div>
                  )}

                  {/* ── ACCOUNT ── */}
                  {activeSection === "account" && (
                    <motion.div
                      key="account"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="space-y-5"
                    >
                      <InputField
                        icon={UserCircle}
                        label="Username"
                        name="username"
                        placeholder="johndoe_school"
                        value={formData.username}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={fieldErrors.username}
                        touched={touchedFields.username}
                        hint="Optional — used as your public handle"
                      />

                      <InputField
                        icon={Mail}
                        label="Email Address"
                        name="email"
                        type="email"
                        required
                        placeholder="john.doe@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={fieldErrors.email}
                        touched={touchedFields.email}
                      />

                      {/* Password */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                          Password <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            type={showPassword1 ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Create a strong password"
                            className={`w-full h-11 pl-10 pr-11 rounded-xl text-sm font-medium border-2 outline-none transition-all bg-slate-50/60
                              ${touchedFields.password && fieldErrors.password
                                ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:bg-white"
                                : "border-slate-200 focus:border-blue-500 focus:bg-white hover:border-slate-300"}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword1((v) => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <PasswordStrengthDots password={formData.password} />
                        <AnimatePresence>
                          {touchedFields.password && fieldErrors.password && (
                            <motion.p
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-xs text-rose-500 flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" />
                              {fieldErrors.password}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Confirm password */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                          Confirm Password <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            type={showPassword2 ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Repeat your password"
                            className={`w-full h-11 pl-10 pr-11 rounded-xl text-sm font-medium border-2 outline-none transition-all bg-slate-50/60
                              ${touchedFields.confirmPassword && (fieldErrors.confirmPassword || formData.confirmPassword !== formData.password)
                                ? "border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:bg-white"
                                : formData.confirmPassword && formData.confirmPassword === formData.password
                                ? "border-emerald-400 bg-emerald-50/30 focus:border-emerald-500 focus:bg-white"
                                : "border-slate-200 focus:border-blue-500 focus:bg-white hover:border-slate-300"}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword2((v) => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <AnimatePresence>
                          {touchedFields.confirmPassword && formData.confirmPassword && formData.confirmPassword !== formData.password && (
                            <motion.p
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-xs text-rose-500 flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" />
                              Passwords do not match
                            </motion.p>
                          )}
                          {formData.confirmPassword && formData.confirmPassword === formData.password && (
                            <motion.p
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-xs text-emerald-600 flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Passwords match
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Terms */}
                      <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-slate-100 bg-slate-50/60 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0"
                        />
                        <p className="text-sm text-slate-600">
                          I agree to the{" "}
                          <button
                            type="button"
                            onClick={() => window.open("/terms", "_blank")}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            Terms of Service
                          </button>{" "}
                          and{" "}
                          <button
                            type="button"
                            onClick={() => window.open("/privacy", "_blank")}
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            Privacy Policy
                          </button>
                        </p>
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-100">
                  {currentIdx > 0 && (
                    <motion.button
                      type="button"
                      onClick={goToPreviousSection}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 text-sm font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </motion.button>
                  )}

                  <div className="flex-1" />

                  {activeSection !== "account" ? (
                    <motion.button
                      type="button"
                      onClick={goToNextSection}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-200 transition-all"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      type="submit"
                      disabled={loading || isUploading}
                      whileHover={{ scale: loading || isUploading ? 1 : 1.02 }}
                      whileTap={{ scale: loading || isUploading ? 1 : 0.98 }}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading || isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          {isUploading ? "Uploading files…" : "Creating account…"}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Complete Registration
                        </>
                      )}
                    </motion.button>
                  )}
                </div>

                {/* Sign in link */}
                <p className="text-center text-sm text-slate-500 mt-5">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Your data is encrypted and never shared with third parties.
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterAnimation;
