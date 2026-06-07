import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, Upload, RefreshCw,
  GraduationCap, Calendar, BookOpen, Layers, X, Check,
  AlertCircle, Loader2, UserPlus, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI, classAPI, sessionAPI, termAPI } from '../../services/schoolApi';

// ─────────────────────────────────────────────────────────────
// ENV (Vite uses import.meta.env, NOT process.env)
// ─────────────────────────────────────────────────────────────
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// ─────────────────────────────────────────────────────────────
// HELPERS — module-level, stable refs
// ─────────────────────────────────────────────────────────────

/** Extract an array from any common API response shape */
const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [res, res.data, res.data?.data, ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const c of candidates) { if (Array.isArray(c)) return c; }
  return [];
};

/** Upload a file to Cloudinary and return the secure URL */
const cloudUpload = async (file, setUploading) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('Cloudinary is not configured. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.');
  setUploading(true);
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'students');
  try {
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || 'Upload failed');
  } finally {
    setUploading(false);
  }
};

/** Generate a unique student ID not in the existing set */
const makeStudentId = (year, existingSet) => {
  for (let i = 0; i < 200; i++) {
    const n  = Math.floor(Math.random() * 9000) + 1000;
    const id = `STU/${year}/${n}`;
    if (!existingSet.has(id)) return id;
  }
  return `STU/${year}/${Date.now().toString().slice(-6)}`;
};

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS — all outside parent (stable refs, no focus loss)
// ─────────────────────────────────────────────────────────────

const Field = ({
  label, name, type = 'text', value, onChange, error,
  required, placeholder, icon: Icon, hint, rightSlot, disabled,
}) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
      {required && <span className="text-rose-400">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className={`w-4 h-4 ${error ? 'text-rose-400' : 'text-slate-400'}`} />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full h-10 text-sm font-medium text-slate-800 placeholder:text-slate-300 rounded-xl border-2 outline-none transition-all
          ${Icon ? 'pl-10' : 'pl-3.5'} ${rightSlot ? 'pr-12' : 'pr-3.5'}
          ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' :
            error
              ? 'border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:bg-white'
              : 'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white hover:border-slate-300'
          }`}
      />
      {rightSlot && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>}
    </div>
    {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="flex items-center gap-1 text-xs text-rose-500 font-medium"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const SelectField = ({ label, name, value, onChange, options, disabled, placeholder, icon: Icon, error, required }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
      {required && <span className="text-rose-400">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className="w-4 h-4 text-slate-400" />
        </div>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full h-10 text-sm font-medium text-slate-800 rounded-xl border-2 outline-none transition-all appearance-none
          ${Icon ? 'pl-10' : 'pl-3.5'} pr-9
          ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' :
            error ? 'border-rose-300 bg-rose-50/40 focus:border-rose-400' :
            'border-slate-200 bg-slate-50 focus:border-blue-500 focus:bg-white hover:border-slate-300'
          }`}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map((o) => (
          <option key={o.id || o.value} value={o.id || o.value}>{o.name || o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
    <AnimatePresence>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="flex items-center gap-1 text-xs text-rose-500 font-medium"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const SectionTitle = ({ icon: Icon, title, accent }) => (
  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-1" style={{ borderBottomColor: `${accent}30` }}>
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15` }}>
      <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
    </div>
    <h3 className="text-sm font-bold text-slate-700">{title}</h3>
  </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const INIT = {
  firstName: '', lastName: '', email: '', phone: '', image: '',
  studentId: '', admissionYear: new Date().getFullYear(),
  password: '', confirmPassword: '',
  classId: '', armId: '', sessionId: '', termId: '',
};

const CreateStudent = ({ onSuccess, onClose }) => {
  const [form, setForm]             = useState(INIT);
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [showPwd1, setShowPwd1]     = useState(false);
  const [showPwd2, setShowPwd2]     = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Reference data
  const [classes,  setClasses]   = useState([]);
  const [arms,     setArms]      = useState([]);
  const [sessions, setSessions]  = useState([]);
  const [terms,    setTerms]     = useState([]);
  const existingIdsRef           = useRef(new Set());

  // Image preview
  const [imgPreview, setImgPreview] = useState(null);

  // ── Load reference data ───────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setFetchingData(true);
      try {
        const [classRes, sessionRes, termRes, studentRes] = await Promise.allSettled([
          classAPI.getClasses(),
          sessionAPI.getSessions(),
          termAPI.getTerms(),
          studentAPI.getStudents({ limit: 5000 }),
        ]);

        const classData   = toArray(classRes.status   === 'fulfilled' ? classRes.value   : null, 'classes',  'items');
        const sessionData = toArray(sessionRes.status === 'fulfilled' ? sessionRes.value : null, 'sessions', 'items');
        const termData    = toArray(termRes.status    === 'fulfilled' ? termRes.value    : null, 'terms',    'items');
        const studentData = toArray(studentRes.status === 'fulfilled' ? studentRes.value : null, 'students', 'items');

        setClasses(classData);
        setSessions(sessionData);
        setTerms(termData);
        existingIdsRef.current = new Set(studentData.map(s => s.studentId).filter(Boolean));
      } catch (err) {
        toast.error('Failed to load form data');
      } finally {
        setFetchingData(false);
      }
    };
    load();
  }, []);

  // ── Auto-generate student ID ──────────────────────────────────
  useEffect(() => {
    if (fetchingData) return;
    setForm(p => ({ ...p, studentId: makeStudentId(p.admissionYear, existingIdsRef.current) }));
  }, [form.admissionYear, fetchingData]);

  // ── Arms: extracted from already-loaded classes (no extra API call) ──
  useEffect(() => {
    if (!form.classId) { setArms([]); setForm(p => ({ ...p, armId: '' })); return; }
    const cls = classes.find(c => String(c.id) === String(form.classId));
    // arms may live at cls.arms, cls.classArms, cls.class_arms
    const found = cls?.arms || cls?.classArms || cls?.class_arms || [];
    setArms(found);
    setForm(p => ({ ...p, armId: '' }));
  }, [form.classId, classes]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: '' }));
  }, []);

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/jpg','image/webp'].includes(file.type)) {
      setErrors(p => ({ ...p, image: 'JPEG, PNG or WEBP only' })); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(p => ({ ...p, image: 'Max 5 MB' })); return;
    }
    // Optimistic preview
    const reader = new FileReader();
    reader.onloadend = () => setImgPreview(reader.result);
    reader.readAsDataURL(file);
    setErrors(p => ({ ...p, image: '' }));
    try {
      const url = await cloudUpload(file, setUploading);
      setForm(p => ({ ...p, image: url }));
      setImgPreview(url);
      toast.success('Photo uploaded');
    } catch (err) {
      setErrors(p => ({ ...p, image: err.message }));
      setImgPreview(null);
    }
  }, []);

  const removeImage = useCallback(() => {
    setForm(p => ({ ...p, image: '' }));
    setImgPreview(null);
  }, []);

  const regenerateId = useCallback(() => {
    setForm(p => ({ ...p, studentId: makeStudentId(p.admissionYear, existingIdsRef.current) }));
  }, []);

  // ── Validate ──────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.firstName.trim())  e.firstName = 'First name is required';
    if (!form.lastName.trim())   e.lastName  = 'Last name is required';
    if (!form.email.trim())      e.email     = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim())      e.phone     = 'Phone number is required';
    else if (!/^[0-9+\-\s()]+$/.test(form.phone)) e.phone = 'Invalid phone number';
    if (!form.studentId.trim())  e.studentId = 'Student ID is required';
    if (!form.password)          e.password  = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.classId)           e.classId   = 'Class is required';
    if (!form.armId)             e.armId     = 'Class arm is required';
    if (!form.sessionId)         e.sessionId = 'Academic session is required';
    if (!form.termId)            e.termId    = 'Term is required';
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Please fix the errors below'); return; }

    setLoading(true);
    try {
      const payload = {
        firstName:     form.firstName.trim(),
        lastName:      form.lastName.trim(),
        email:         form.email.trim(),
        phone:         form.phone.trim()  || null,
        image:         form.image         || null,
        studentId:     form.studentId,
        admissionYear: parseInt(form.admissionYear),
        password:      form.password,
        classId:       form.classId       || null,
        armId:         form.armId         || null,
        sessionId:     form.sessionId     || null,
        termId:        form.termId        || null,
      };

      const res = await studentAPI.createStudent(payload);

      // Accept various success shapes
      if (res?.success !== false && !res?.error) {
        toast.success(`Student ${form.firstName} ${form.lastName} created successfully!`);
        onSuccess?.(res?.data || res);
        onClose?.();
      } else {
        throw new Error(res?.message || 'Failed to create student');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create student';
      setErrors(p => ({ ...p, submit: msg }));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [form, onSuccess, onClose]);

  // Year options
  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { id: y, name: String(y) };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="bg-[#f5f6fa] w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Student</h2>
              <p className="text-xs text-slate-400">Fill in the details to enrol a student</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Loading overlay for initial data fetch */}
        {fetchingData && (
          <div className="flex-1 flex items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm font-medium">Loading form data…</span>
          </div>
        )}

        {/* Scrollable body */}
        {!fetchingData && (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Global error */}
            <AnimatePresence>
              {errors.submit && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.submit}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Personal Information ─────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <SectionTitle icon={User} title="Personal Information" accent="#3b82f6" />

              {/* Avatar upload */}
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                    {imgPreview
                      ? <img src={imgPreview} alt="Preview" className="w-full h-full object-cover" />
                      : <User className="w-8 h-8 text-slate-300" />
                    }
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 rounded-2xl bg-white/80 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Profile Photo <span className="text-rose-400">*</span></p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer transition-colors shadow-sm shadow-blue-200">
                      <Upload className="w-3.5 h-3.5" />
                      {uploading ? 'Uploading…' : 'Upload Photo'}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                    {imgPreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  {errors.image
                    ? <p className="text-xs text-rose-500 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.image}</p>
                    : <p className="text-xs text-slate-400">JPEG, PNG or WEBP — max 5 MB</p>
                  }
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} required placeholder="John" icon={User} />
                <Field label="Last Name"  name="lastName"  value={form.lastName}  onChange={handleChange} error={errors.lastName}  required placeholder="Doe"  icon={User} />
                <Field label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} required placeholder="student@school.com" icon={Mail} />
                <Field label="Phone Number"  name="phone" type="tel"   value={form.phone} onChange={handleChange} error={errors.phone} required placeholder="+234 800 000 0000"       icon={Phone} />
              </div>
            </div>

            {/* ── Student Details ──────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <SectionTitle icon={GraduationCap} title="Student Details" accent="#8b5cf6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student ID */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <GraduationCap className="w-3 h-3" /> Student ID <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.studentId}
                      readOnly
                      className="flex-1 h-10 px-3.5 text-sm font-medium text-slate-600 bg-slate-100 border-2 border-slate-200 rounded-xl outline-none cursor-default select-all"
                    />
                    <button
                      type="button"
                      onClick={regenerateId}
                      title="Generate new ID"
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-purple-100 border-2 border-slate-200 hover:border-purple-300 flex items-center justify-center transition-all text-slate-500 hover:text-purple-600"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">Format: STU/YEAR/XXXX — auto-generated &amp; unique</p>
                </div>

                {/* Admission Year */}
                <SelectField
                  label="Admission Year"
                  name="admissionYear"
                  value={form.admissionYear}
                  onChange={handleChange}
                  options={yearOptions}
                  icon={Calendar}
                  required
                />
              </div>
            </div>

            {/* ── Account Security ─────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <SectionTitle icon={Lock} title="Account Security" accent="#10b981" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Password" name="password" type={showPwd1 ? 'text' : 'password'}
                  value={form.password} onChange={handleChange} error={errors.password}
                  required placeholder="Minimum 8 characters" icon={Lock}
                  rightSlot={
                    <button type="button" onClick={() => setShowPwd1(v => !v)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      {showPwd1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                <Field
                  label="Confirm Password" name="confirmPassword" type={showPwd2 ? 'text' : 'password'}
                  value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword}
                  required placeholder="Repeat password" icon={Lock}
                  rightSlot={
                    <button type="button" onClick={() => setShowPwd2(v => !v)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      {showPwd2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
              {/* Password match indicator */}
              <AnimatePresence>
                {form.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      form.password === form.confirmPassword ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {form.password === form.confirmPassword
                      ? <><Check className="w-3.5 h-3.5" /> Passwords match</>
                      : <><X className="w-3.5 h-3.5" /> Passwords do not match</>
                    }
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* ── Enrollment (Required) ────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <SectionTitle icon={BookOpen} title="Enrollment Information" accent="#f59e0b" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">Required</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Class"
                  name="classId"
                  value={form.classId}
                  onChange={handleChange}
                  options={classes}
                  placeholder="Select class"
                  icon={GraduationCap}
                  required
                  error={errors.classId}
                />
                <SelectField
                  label="Class Arm"
                  name="armId"
                  value={form.armId}
                  onChange={handleChange}
                  options={arms}
                  placeholder={form.classId ? (arms.length ? 'Select arm' : 'No arms found') : 'Select a class first'}
                  disabled={!form.classId || arms.length === 0}
                  icon={Layers}
                  required
                  error={errors.armId}
                />
                <SelectField
                  label="Academic Session"
                  name="sessionId"
                  value={form.sessionId}
                  onChange={handleChange}
                  options={sessions}
                  placeholder="Select session"
                  icon={Calendar}
                  required
                  error={errors.sessionId}
                />
                <SelectField
                  label="Term"
                  name="termId"
                  value={form.termId}
                  onChange={handleChange}
                  options={terms}
                  placeholder="Select term"
                  icon={BookOpen}
                  required
                  error={errors.termId}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-white border-t border-slate-200 flex-shrink-0">
          <p className="text-xs text-slate-400">
            Fields marked <span className="text-rose-400 font-bold">*</span> are required
          </p>
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={loading || uploading || fetchingData}
              whileHover={{ scale: loading || uploading ? 1 : 1.02 }}
              whileTap={{ scale: loading || uploading ? 1 : 0.98 }}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl
                shadow-sm shadow-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                : <><UserPlus className="w-4 h-4" /> Create Student</>
              }
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateStudent;