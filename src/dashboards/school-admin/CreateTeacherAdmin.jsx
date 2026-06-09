// pages/school/CreateTeacherAdmin.jsx
// ─── Complete single-file teacher management page ───────────────────────────
// Matches the student page pattern exactly: same Avatar logic, same normalise
// helper, same toArray data extraction, same dark-navy design system.
// Includes: list, create, edit, assign, deactivate, activate, remove assignment — all inline.
// Image upload uses Cloudinary — identical to student page!

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users, UserPlus, Search, X, Edit2, Trash2, Eye,
  ChevronDown, RefreshCw, Loader2, AlertCircle,
  BookOpen, GraduationCap, Phone, Mail,
  CheckCircle, XCircle, Award, Power, PowerOff,
  ArrowLeft, Save, EyeOff, Lock, AtSign, Link2,
  Star, Plus, Minus, ShieldAlert, BookMarked, Upload,
} from 'lucide-react';
import {
  teacherAPI, classAPI, subjectAPI,
} from '../../services/schoolApi';

// ─────────────────────────────────────────────────────────────
// ENV (Vite uses import.meta.env)
// ─────────────────────────────────────────────────────────────
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// ─────────────────────────────────────────────────────────────
// DATA HELPERS  (identical pattern to student page)
// API shape: { status, success, message, data: [...] }
// ─────────────────────────────────────────────────────────────
const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [
    res, res.data, res.data?.data,
    ...keys.map(k => res[k]),
    ...keys.map(k => res.data?.[k]),
  ];
  for (const c of candidates) { if (Array.isArray(c)) return c; }
  return [];
};

const normalise = (t) => {
  const u = t.user || t;
  return {
    id:            t.id,
    userId:        t.userId || u.id,
    firstName:     u.firstName  || u.first_name  || '',
    lastName:      u.lastName   || u.last_name   || '',
    email:         u.email      || '—',
    phone:         u.phone      || null,
    image:         u.image      || null,
    isActive:      u.isActive   !== false,
    isClassHead:   t.isClassHead ?? false,
    headedClassArm: t.headedClassArm || null,
    headedClassArmId: t.headedClassArmId || '',
    assignments:   Array.isArray(t.assignments) ? t.assignments : [],
    _raw:          t,
  };
};

/** Upload a file to Cloudinary and return the secure URL - identical to student page */
const cloudUpload = async (file, setUploading) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error('Cloudinary is not configured. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.');
  setUploading(true);
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'teachers');
  try {
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || 'Upload failed');
  } finally {
    setUploading(false);
  }
};

// ─────────────────────────────────────────────────────────────
// AVATAR  — mirrors student page exactly
// Shows image if present, otherwise coloured initials circle
// ─────────────────────────────────────────────────────────────
const PALETTE = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444'];

const Avatar = ({ t, size = 36 }) => {
  const initials = `${t.firstName?.[0] || ''}${t.lastName?.[0] || ''}`.toUpperCase() || 'T';
  const bg = PALETTE[(t.firstName?.charCodeAt(0) || 0) % PALETTE.length];

  if (t.image) {
    return (
      <img
        src={t.image}
        alt={`${t.firstName} ${t.lastName}`}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-white/10 flex-shrink-0"
        onError={e => {
          // Fallback: swap img for initials div on broken URL
          e.target.style.display = 'none';
          e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
        }}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, background: bg, fontSize: size * 0.37 }}
      className="rounded-full flex items-center justify-center text-white font-bold border-2 border-white/10 flex-shrink-0 select-none"
    >
      {initials}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SMALL REUSABLES
// ─────────────────────────────────────────────────────────────
const StatusBadge = ({ t }) => {
  if (!t.isActive)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
        <PowerOff className="w-3 h-3" /> Inactive
      </span>
    );
  if (t.isClassHead)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
        <Star className="w-3 h-3" /> Class Head
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
      <CheckCircle className="w-3 h-3" /> Active
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, accent, sub }) => (
  <div
    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-start justify-between"
    style={{ borderTop: `3px solid ${accent}` }}
  >
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

// ─────────────────────────────────────────────────────────────
// CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────
const ConfirmDialog = ({ title, message, detail, confirmLabel, variant = 'danger', onConfirm, onCancel, loading }) => {
  const map = {
    danger:  { bg: 'bg-rose-100',   text: 'text-rose-600',   btn: 'bg-rose-600  hover:bg-rose-700'  },
    warning: { bg: 'bg-amber-100',  text: 'text-amber-600',  btn: 'bg-amber-500 hover:bg-amber-600' },
    info:    { bg: 'bg-blue-100',   text: 'text-blue-600',   btn: 'bg-blue-600  hover:bg-blue-700'  },
    success: { bg: 'bg-emerald-100', text: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  };
  const s = map[variant] || map.danger;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}>
      <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
        <div className="flex items-start gap-3 mb-5">
          <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${s.bg}`}>
            <AlertCircle className={`w-4.5 h-4.5 ${s.text}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
            {detail && (
              <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${s.text}`}>
                <ShieldAlert className="w-3 h-3 flex-shrink-0" />{detail}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition-colors flex items-center gap-1.5 ${s.btn}`}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
    <h3 className="text-base font-bold text-slate-700 mb-1">No teachers found</h3>
    <p className="text-sm text-slate-400 mb-6">Add your first teacher to get started.</p>
    <button onClick={onAdd}
      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-blue-200">
      <UserPlus className="w-4 h-4" /> Create Teacher
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────────
// FORM DRAWER — shared by Create and Edit
// Slides in from the right, same UX pattern as student edit
// Includes Cloudinary image upload — identical to student page
// ─────────────────────────────────────────────────────────────
const FORM_DEFAULTS = {
  firstName: '', lastName: '', email: '', phone: '', image: '',
  password: '', confirmPassword: '', isClassHead: false, headedClassArmId: '',
};

const TeacherFormDrawer = ({ initial, onSave, onClose, classArms, isEdit }) => {
  const [form,     setForm]     = useState({ ...FORM_DEFAULTS, ...initial });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [imgPreview, setImgPreview] = useState(initial?.image || null);

  const set = (name, value) => {
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    set(name, type === 'checkbox' ? checked : value);
  };

  // ── Image upload handler — identical to student page ──────────
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
      setImgPreview(initial?.image || null);
    }
  }, [initial?.image]);

  const removeImage = useCallback(() => {
    setForm(p => ({ ...p, image: '' }));
    setImgPreview(null);
  }, []);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    if (!form.email.trim())     e.email     = 'Required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!isEdit) {
      if (!form.password)               e.password = 'Required';
      if (form.password?.length < 8)    e.password = 'Min. 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    } else if (form.password) {
      if (form.password.length < 8)     e.password = 'Min. 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = {
        firstName:    form.firstName.trim(),
        lastName:     form.lastName.trim(),
        email:        form.email.trim(),
        phone:        form.phone.trim() || undefined,
        image:        form.image.trim() || undefined,
        isClassHead:  form.isClassHead,
        headedClassArmId: form.isClassHead && form.headedClassArmId ? form.headedClassArmId : undefined,
      };
      if (!isEdit)         payload.password = form.password;
      else if (form.password) payload.password = form.password;
      await onSave(payload);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'An error occurred' });
      setLoading(false);
    }
  };

  // Arms dropdown options
  const armOptions = classArms.map(a => ({
    id: a.id,
    label: `${a.class?.name || 'Class'} — ${a.name}`,
  }));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end"
      style={{ background: 'rgba(15,17,23,0.72)', backdropFilter: 'blur(5px)' }}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 310, damping: 33 }}
        className="h-full w-full max-w-lg flex flex-col overflow-hidden"
        style={{ background: '#161b27', borderLeft: '1px solid #252d3d' }}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid #252d3d' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(240,165,0,0.13)' }}>
              {isEdit
                ? <Edit2 className="w-4 h-4" style={{ color: '#f0a500' }} />
                : <UserPlus className="w-4 h-4" style={{ color: '#f0a500' }} />}
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100">{isEdit ? 'Edit Teacher' : 'New Teacher'}</h2>
              <p className="text-[11px] text-slate-500">{isEdit ? 'Update staff record' : 'Add a staff member'}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {errors.submit && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-xs text-rose-400"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.submit}
            </div>
          )}

          {/* ── Personal ── */}
          <section>
            <SectionTitle icon={<Users className="w-3 h-3" />} label="Personal Information" color="#3b82f6" />

            {/* Avatar upload — identical to student page */}
            <div className="flex items-center gap-5 mb-4">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                  {imgPreview
                    ? <img src={imgPreview} alt="Preview" className="w-full h-full object-cover" />
                    : <Users className="w-8 h-8 text-slate-500" />
                  }
                </div>
                {uploading && (
                  <div className="absolute inset-0 rounded-2xl bg-slate-900/80 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Profile Photo</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading…' : 'Upload Photo'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                  {imgPreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-400 border border-rose-800 hover:bg-rose-950/30 rounded-xl transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                {errors.image
                  ? <p className="text-xs text-rose-400 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.image}</p>
                  : <p className="text-xs text-slate-500">JPEG, PNG or WEBP — max 5 MB</p>
                }
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <DField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} placeholder="Jane" required />
              <DField label="Last Name"  name="lastName"  value={form.lastName}  onChange={handleChange} error={errors.lastName}  placeholder="Doe"  required />
            </div>
            <DField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="jane@school.edu" required className="mb-3" />
            <DField label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+234 800 000 0000" className="mb-3" />

            {/* Live avatar preview */}
            {(imgPreview || form.firstName) && (
              <div className="flex items-center gap-3 mt-3 p-3 rounded-xl" style={{ background: '#1c2233', border: '1px solid #252d3d' }}>
                <Avatar t={{ ...form, image: imgPreview || form.image || null }} size={40} />
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {form.firstName || 'First'} {form.lastName || 'Last'}
                  </p>
                  <p className="text-xs text-slate-500">{form.email || 'email@school.edu'}</p>
                </div>
              </div>
            )}
          </section>

          {/* ── Role ── */}
          <section>
            <SectionTitle icon={<Star className="w-3 h-3" />} label="Role" color="#f59e0b" />

            <label className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-colors"
              style={{
                border: `1.5px solid ${form.isClassHead ? '#f0a500' : '#252d3d'}`,
                background: form.isClassHead ? 'rgba(240,165,0,0.07)' : 'transparent',
              }}>
              {/* Toggle */}
              <div className="relative w-10 h-5 flex-shrink-0" onClick={() => set('isClassHead', !form.isClassHead)}>
                <div className="w-10 h-5 rounded-full transition-colors"
                  style={{ background: form.isClassHead ? '#f0a500' : '#252d3d' }} />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                  style={{ transform: form.isClassHead ? 'translateX(20px)' : 'translateX(0)' }} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Class Head Teacher</p>
                <p className="text-[11px] text-slate-500">Assigns this teacher to lead a class arm</p>
              </div>
            </label>

            <AnimatePresence>
              {form.isClassHead && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                  <DSelect label="Headed Class Arm" name="headedClassArmId"
                    value={form.headedClassArmId} onChange={handleChange}
                    options={armOptions} placeholder="Select class arm" />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* ── Password ── */}
          <section>
            <SectionTitle icon={<Lock className="w-3 h-3" />} label={isEdit ? 'Change Password' : 'Account Security'} color="#10b981" />
            {isEdit && (
              <p className="text-xs text-slate-500 mb-3 p-2.5 rounded-lg"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                Leave blank to keep the current password.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <DField label={isEdit ? 'New Password' : 'Password'}
                  name="password" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  error={errors.password} placeholder="Min. 8 chars"
                  required={!isEdit} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 bottom-2.5 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <DField label="Confirm" name="confirmPassword"
                type={showPass ? 'text' : 'password'}
                value={form.confirmPassword} onChange={handleChange}
                error={errors.confirmPassword} placeholder="Repeat"
                required={!isEdit} />
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #252d3d' }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-300 transition-colors hover:bg-white/5"
            style={{ border: '1px solid #252d3d' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all"
            style={{ background: loading ? 'rgba(240,165,0,0.5)' : '#f0a500', color: '#0f1117' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Teacher'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ASSIGN TEACHER DRAWER
// Lets admin pick class, arm, subject then POST /teacher-assignments
// ─────────────────────────────────────────────────────────────
const AssignDrawer = ({ teacher, classes, subjects, onSave, onClose }) => {
  const t = normalise(teacher);
  const [form,    setForm]    = useState({ classId: '', armId: '', subjectId: '' });
  const [arms,    setArms]    = useState([]);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  // Derive arms from selected class (no extra API call — classes already include arms)
  useEffect(() => {
    if (!form.classId) { setArms([]); setForm(p => ({ ...p, armId: '' })); return; }
    const cls = classes.find(c => String(c.id) === String(form.classId));
    setArms(cls?.arms || []);
    setForm(p => ({ ...p, armId: '' }));
  }, [form.classId, classes]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.classId)   e.classId   = 'Required';
    if (!form.armId)     e.armId     = 'Required';
    if (!form.subjectId) e.subjectId = 'Required';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSave({ teacherId: t.id, ...form });
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to assign' });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end"
      style={{ background: 'rgba(15,17,23,0.72)', backdropFilter: 'blur(5px)' }}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 310, damping: 33 }}
        className="h-full w-full max-w-md flex flex-col overflow-hidden"
        style={{ background: '#161b27', borderLeft: '1px solid #252d3d' }}>

        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid #252d3d' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.13)' }}>
              <BookMarked className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100">Assign Teacher</h2>
              <p className="text-[11px] text-slate-500">
                {t.firstName} {t.lastName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Teacher preview */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl mb-2"
            style={{ background: '#1c2233', border: '1px solid #252d3d' }}>
            <Avatar t={t} size={40} />
            <div>
              <p className="text-sm font-bold text-slate-200">{t.firstName} {t.lastName}</p>
              <p className="text-xs text-slate-500">{t.email}</p>
            </div>
          </div>

          {errors.submit && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-xs text-rose-400"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.submit}
            </div>
          )}

          <DSelect label="Class *" name="classId" value={form.classId} onChange={handleChange}
            options={classes.map(c => ({ id: c.id, label: c.name }))} placeholder="Select class" error={errors.classId} />

          <DSelect label="Class Arm *" name="armId" value={form.armId} onChange={handleChange}
            options={arms.map(a => ({ id: a.id, label: a.name }))} placeholder="Select arm"
            disabled={!form.classId} error={errors.armId} />
          {form.classId && arms.length === 0 && (
            <p className="text-xs text-amber-500 -mt-2">No arms for this class yet.</p>
          )}

          <DSelect label="Subject *" name="subjectId" value={form.subjectId} onChange={handleChange}
            options={subjects.map(s => ({ id: s.id, label: s.name }))} placeholder="Select subject" error={errors.subjectId} />

          {/* Existing assignments */}
          {t.assignments.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Current Assignments</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {t.assignments.map((a, i) => (
                  <div key={a.id || i} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: '#1c2233', border: '1px solid #252d3d' }}>
                    <BookOpen className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    <span className="text-xs text-slate-300 truncate">
                      {a.subject?.name} — {a.class?.name}{a.arm?.name ? ` · ${a.arm.name}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        <div className="flex-shrink-0 flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #252d3d' }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-300 transition-colors hover:bg-white/5"
            style={{ border: '1px solid #252d3d' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 text-white transition-all"
            style={{ background: loading ? 'rgba(16,185,129,0.5)' : '#10b981' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// FIELD PRIMITIVES (dark theme)
// ─────────────────────────────────────────────────────────────
const DField = ({ label, name, type = 'text', value, onChange, error, placeholder, required, hint, className = '' }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
      {label}{required && <span className="text-amber-400 ml-0.5">*</span>}
    </label>
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-200 placeholder:text-slate-600 transition-all"
      style={{ background: '#0f1117', border: `1.5px solid ${error ? '#ef4444' : '#252d3d'}`, fontFamily: 'inherit' }}
      onFocus={e => { if (!error) e.target.style.borderColor = '#f0a500'; }}
      onBlur={e => { if (!error) e.target.style.borderColor = '#252d3d'; }}
    />
    {hint && !error && <p className="text-[11px] text-slate-600">{hint}</p>}
    {error && <p className="text-[11px] text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
  </div>
);

const DSelect = ({ label, name, value, onChange, options, placeholder, error, disabled }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
    <div className="relative">
      <select name={name} value={value} onChange={onChange} disabled={disabled}
        className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none appearance-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: '#0f1117',
          border: `1.5px solid ${error ? '#ef4444' : '#252d3d'}`,
          color: value ? '#e2e8f0' : '#475569',
          fontFamily: 'inherit',
        }}>
        <option value="" style={{ background: '#1c2233' }}>{placeholder}</option>
        {options.map(o => (
          <option key={o.id} value={o.id} style={{ background: '#1c2233', color: '#e2e8f0' }}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
    </div>
    {error && <p className="text-[11px] text-rose-400">{error}</p>}
  </div>
);

const SectionTitle = ({ icon, label, color }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}20`, color }}>
      {icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
    <div className="flex-1 h-px bg-slate-800" />
  </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
const CreateTeacherAdmin = () => {
  const [rawTeachers,  setRawTeachers]  = useState([]);
  const [teachers,     setTeachers]     = useState([]);
  const [classes,      setClasses]      = useState([]);
  const [subjects,     setSubjects]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const [search,       setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Drawer / modal state
  const [panel,     setPanel]     = useState(null); // 'create' | 'edit' | 'assign'
  const [selected,  setSelected]  = useState(null); // raw teacher object
  const [confirm,   setConfirm]   = useState(null); // { type, teacher }
  const [actionBusy, setActionBusy] = useState(false);

  // ── Reference data ─────────────────────────────────────────
  useEffect(() => {
    Promise.allSettled([
      classAPI.getClasses(),
      subjectAPI.getSubjects(),
    ]).then(([cr, sr]) => {
      setClasses(toArray(cr.status === 'fulfilled' ? cr.value : null, 'classes'));
      setSubjects(toArray(sr.status === 'fulfilled' ? sr.value : null, 'subjects'));
    });
  }, []);

  // ── Fetch teachers ─────────────────────────────────────────
  const fetchTeachers = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await teacherAPI.getTeachers();
      setRawTeachers(toArray(res, 'teachers', 'items'));
      if (isRefresh) toast.success('Teachers refreshed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  // ── Client-side filter ─────────────────────────────────────
  useEffect(() => {
    const term = search.toLowerCase();
    setTeachers(
      rawTeachers.map(normalise).filter(t => {
        const text = `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase();
        if (term && !text.includes(term)) return false;
        if (filterStatus === 'active')   return  t.isActive;
        if (filterStatus === 'inactive') return !t.isActive;
        if (filterStatus === 'heads')    return  t.isClassHead;
        if (filterStatus === 'assigned') return  t.assignments.length > 0;
        return true;
      })
    );
  }, [rawTeachers, search, filterStatus]);

  // ── Stats ──────────────────────────────────────────────────
  const all          = rawTeachers.map(normalise);
  const totalCount   = all.length;
  const activeCount  = all.filter(t =>  t.isActive).length;
  const headCount    = all.filter(t =>  t.isClassHead).length;
  const assignedCount= all.filter(t =>  t.assignments.length > 0).length;

  // ── Actions ────────────────────────────────────────────────
  const handleCreate = async payload => {
    await teacherAPI.createTeacher(payload);
    toast.success('Teacher created');
    fetchTeachers();
    setPanel(null);
  };

  const handleEdit = async payload => {
    await teacherAPI.updateTeacher(selected.id, payload);
    toast.success('Teacher updated');
    fetchTeachers();
    setPanel(null);
    setSelected(null);
  };

  const handleAssign = async payload => {
    await teacherAPI.assignTeacher(payload);
    toast.success('Assignment saved');
    fetchTeachers();
    setPanel(null);
    setSelected(null);
  };

  const handleRemoveAssignment = async (assignmentId, teacherName) => {
    try {
      await teacherAPI.removeTeacherAssignment(assignmentId);
      toast.success(`Assignment removed from ${teacherName}`);
      fetchTeachers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to remove assignment');
    }
  };

  const handleDeactivate = async () => {
    setActionBusy(true);
    try {
      await teacherAPI.deleteTeacher(confirm.teacher._raw?.id || confirm.teacher.id);
      toast.success(`${confirm.teacher.firstName} ${confirm.teacher.lastName} deactivated`);
      setConfirm(null);
      fetchTeachers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to deactivate teacher');
    } finally { setActionBusy(false); }
  };

  // NEW: Activate teacher handler
  const handleActivate = async () => {
    setActionBusy(true);
    try {
      await teacherAPI.activateTeacher(confirm.teacher._raw?.id || confirm.teacher.id);
      toast.success(`${confirm.teacher.firstName} ${confirm.teacher.lastName} activated`);
      setConfirm(null);
      fetchTeachers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to activate teacher');
    } finally { setActionBusy(false); }
  };

  const hasFilters = search || filterStatus;

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
              <span className="text-white/90 text-xs font-semibold">Staff Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Teacher Management</h1>
            <p className="text-blue-200 text-sm mt-1">Manage teacher records, class assignments, and access</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Total',    value: totalCount,    color: '#e8ecf4' },
              { label: 'Active',   value: activeCount,   color: '#10b981' },
              { label: 'Heads',    value: headCount,     color: '#f0a500' },
              { label: 'Assigned', value: assignedCount, color: '#3b82f6' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl px-4 py-3 text-center min-w-[68px]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-2xl font-black" style={{ color }}>{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: '#fff' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5 pb-12">

        {/* ── Stat cards ────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Staff"    value={totalCount}    icon={Users}      accent="#3b82f6" sub="All teachers" />
          <StatCard label="Active"         value={activeCount}   icon={CheckCircle}accent="#10b981" sub="With system access" />
          <StatCard label="Class Heads"    value={headCount}     icon={Star}       accent="#f0a500" sub="Leading a class arm" />
          <StatCard label="Assigned"       value={assignedCount} icon={BookOpen}   accent="#8b5cf6" sub="Have subjects" />
        </div>

        {/* ── Toolbar ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full h-10 pl-10 pr-9 text-sm font-medium text-slate-800 placeholder:text-slate-300
                  bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white hover:border-slate-300 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status filter */}
            <div className="relative w-44">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="w-full h-10 pl-3.5 pr-9 text-sm font-medium text-slate-700 bg-slate-50 border-2 border-slate-200
                  rounded-xl outline-none appearance-none focus:border-blue-500 hover:border-slate-300 transition-all">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="heads">Class Heads</option>
                <option value="assigned">Has Assignments</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {hasFilters && (
              <button onClick={() => { setSearch(''); setFilterStatus(''); }}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:block">{teachers.length} of {totalCount}</span>
              <button onClick={() => fetchTeachers(true)} disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing…' : 'Refresh'}
              </button>
              <motion.button onClick={() => { setSelected(null); setPanel('create'); }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-200 transition-colors">
                <UserPlus className="w-4 h-4" /> New Teacher
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-sm font-medium">Loading teachers…</span>
            </div>
          ) : teachers.length === 0 ? (
            <EmptyState onAdd={() => setPanel('create')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {['Teacher', 'Contact', 'Status', 'Assignments', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map((t, i) => (
                    <motion.tr key={t.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      className={`hover:bg-slate-50/70 transition-colors group ${!t.isActive ? 'opacity-55' : ''}`}>

                      {/* Teacher */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar t={t} size={36} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{t.firstName} {t.lastName}</p>
                            {t.headedClassArm && (
                              <p className="text-[11px] text-amber-600 font-semibold truncate">
                                Heads: {t.headedClassArm.class?.name} — {t.headedClassArm.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-slate-600 truncate max-w-[180px]">{t.email}</p>
                        {t.phone && <p className="text-[11px] text-slate-400">{t.phone}</p>}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5"><StatusBadge t={t} /></td>

                      {/* Assignments — inline remove */}
                      <td className="px-5 py-3.5">
                        {t.assignments.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">None</span>
                        ) : (
                          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                            {t.assignments.map((a, ai) => (
                              <div key={a.id || ai}
                                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 group/row">
                                <BookOpen className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                <span className="text-[11px] text-slate-600 truncate flex-1">
                                  {a.subject?.name} · {a.class?.name}{a.arm?.name ? ` ${a.arm.name}` : ''}
                                </span>
                                <button
                                  onClick={() => handleRemoveAssignment(a.id, `${t.firstName} ${t.lastName}`)}
                                  title="Remove assignment"
                                  className="w-4 h-4 flex-shrink-0 opacity-0 group-hover/row:opacity-100 text-slate-400 hover:text-rose-500 transition-all">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          {/* Assign */}
                          <ActionBtn
                            title="Assign Subject"
                            onClick={() => { setSelected(t._raw); setPanel('assign'); }}
                            hoverColor="text-emerald-600 bg-emerald-50">
                            <BookMarked className="w-4 h-4" />
                          </ActionBtn>

                          {/* Edit */}
                          <ActionBtn
                            title="Edit"
                            onClick={() => { setSelected(t._raw); setPanel('edit'); }}
                            hoverColor="text-blue-600 bg-blue-50">
                            <Edit2 className="w-4 h-4" />
                          </ActionBtn>

                          {/* Activate/Deactivate based on status */}
                          {t.isActive ? (
                            <ActionBtn
                              title="Deactivate"
                              onClick={() => setConfirm({ type: 'deactivate', teacher: t })}
                              hoverColor="text-amber-600 bg-amber-50">
                              <PowerOff className="w-4 h-4" />
                            </ActionBtn>
                          ) : (
                            <ActionBtn
                              title="Activate"
                              onClick={() => setConfirm({ type: 'activate', teacher: t })}
                              hoverColor="text-emerald-600 bg-emerald-50">
                              <Power className="w-4 h-4" />
                            </ActionBtn>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && teachers.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">
                Showing <strong className="text-slate-600">{teachers.length}</strong> of <strong className="text-slate-600">{totalCount}</strong> teachers
              </p>
              {hasFilters && (
                <button onClick={() => { setSearch(''); setFilterStatus(''); }}
                  className="text-xs font-semibold text-blue-600 hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Drawers ──────────────────────────────────────── */}
      <AnimatePresence>
        {panel === 'create' && (
          <TeacherFormDrawer classArms={classes.flatMap(c => (c.arms||[]).map(a => ({ ...a, class: c })))}
            onSave={handleCreate} onClose={() => setPanel(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === 'edit' && selected && (
          <TeacherFormDrawer
            isEdit
            initial={{
              firstName:       normalise(selected).firstName,
              lastName:        normalise(selected).lastName,
              email:           normalise(selected).email,
              phone:           normalise(selected).phone || '',
              image:           normalise(selected).image || '',
              isClassHead:     normalise(selected).isClassHead,
              headedClassArmId: selected.headedClassArmId || '',
              password: '', confirmPassword: '',
            }}
            classArms={classes.flatMap(c => (c.arms||[]).map(a => ({ ...a, class: c })))}
            onSave={handleEdit}
            onClose={() => { setPanel(null); setSelected(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === 'assign' && selected && (
          <AssignDrawer
            teacher={selected}
            classes={classes}
            subjects={subjects}
            onSave={handleAssign}
            onClose={() => { setPanel(null); setSelected(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Confirm dialogs ───────────────────────────────── */}
      <AnimatePresence>
        {confirm?.type === 'deactivate' && (
          <ConfirmDialog
            title="Deactivate Teacher"
            message={`${confirm.teacher.firstName} ${confirm.teacher.lastName} will lose login access immediately. All assignments and records are preserved.`}
            confirmLabel={actionBusy ? 'Deactivating…' : 'Deactivate'}
            variant="warning"
            loading={actionBusy}
            onConfirm={handleDeactivate}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* NEW: Activate confirmation dialog */}
      <AnimatePresence>
        {confirm?.type === 'activate' && (
          <ConfirmDialog
            title="Activate Teacher"
            message={`${confirm.teacher.firstName} ${confirm.teacher.lastName} will regain login access immediately.`}
            confirmLabel={actionBusy ? 'Activating…' : 'Activate'}
            variant="success"
            loading={actionBusy}
            onConfirm={handleActivate}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Tiny action button helper
const ActionBtn = ({ onClick, title, hoverColor, children }) => (
  <button onClick={onClick} title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 transition-all hover:${hoverColor}`}>
    {children}
  </button>
);

export default CreateTeacherAdmin;