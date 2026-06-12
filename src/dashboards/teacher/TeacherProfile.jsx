import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Building, Globe,
  Calendar, FileText, Edit2, Save, X, Camera,
  CheckCircle, Upload, Loader2, Lock,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import { schoolProfileAPI } from '../../services/schoolApi';
import { authAPI } from '../../services/authApi';

// ─────────────────────────────────────────────────────────────
// ALL sub-components are defined OUTSIDE the parent so their
// references stay stable across renders — prevents focus loss.
// ─────────────────────────────────────────────────────────────

/** Labelled field — view or edit mode */
const Field = ({
  label, name, value, type = 'text', isEditing, onChange,
  required = false, multiline = false, icon: Icon,
}) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
      {required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
    {isEditing ? (
      multiline ? (
        <textarea
          name={name}
          value={value || ''}
          onChange={onChange}
          rows={3}
          className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 border-2 border-slate-200
            rounded-xl outline-none resize-none transition-all duration-200
            focus:border-blue-500 focus:bg-white hover:border-slate-300"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={onChange}
          className="w-full h-10 px-3.5 text-sm text-slate-800 bg-slate-50 border-2 border-slate-200
            rounded-xl outline-none transition-all duration-200
            focus:border-blue-500 focus:bg-white hover:border-slate-300"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      )
    ) : (
      <p className={`text-sm py-2 px-0.5 font-medium ${value ? 'text-slate-800' : 'text-slate-400 italic'}`}>
        {value || 'Not provided'}
      </p>
    )}
  </div>
);

/** Section card with coloured left accent */
const Section = ({ title, icon: Icon, accent = '#3b82f6', children }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
    <div
      className="flex items-center gap-3 px-6 py-4 border-b border-slate-100"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}18` }}
      >
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
    <div className="px-6 py-5 space-y-5">{children}</div>
  </div>
);

/** Image upload field */
const ImageField = ({
  label, hint, preview, fieldName, previewType,
  isEditing, onUpload, onRemove, uploading, shape = 'square',
}) => {
  const isRound = shape === 'round';
  const shapeClass = isRound ? 'rounded-full' : 'rounded-xl';
  const dim = isRound ? 'w-20 h-20' : 'w-28 h-28';

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
      {isEditing ? (
        <div className="flex items-start gap-4">
          {preview ? (
            <div className="relative flex-shrink-0">
              <img
                src={preview}
                alt={label}
                className={`${dim} ${shapeClass} object-cover border-2 border-slate-200`}
              />
              <button
                type="button"
                onClick={() => onRemove(previewType, fieldName)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <label
              className={`${dim} ${shapeClass} border-2 border-dashed border-slate-300 hover:border-blue-400
                flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-blue-50/40 flex-shrink-0`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onUpload(e, fieldName, previewType)}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-[10px] text-slate-400 mt-1 font-medium">Upload</span>
                </>
              )}
            </label>
          )}
          <div className="pt-1 space-y-1">
            {hint && <p className="text-xs text-slate-400">{hint}</p>}
            {uploading && (
              <p className="text-xs text-blue-500 font-medium flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
              </p>
            )}
          </div>
        </div>
      ) : (
        preview ? (
          <img src={preview} alt={label} className={`${dim} ${shapeClass} object-cover border-2 border-slate-200`} />
        ) : (
          <div className={`${dim} ${shapeClass} bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-200`}>
            <Upload className="w-5 h-5 text-slate-300" />
          </div>
        )
      )}
    </div>
  );
};

/** Pill badge */
const Badge = ({ label, color = 'blue' }) => {
  const styles = {
    blue:   'bg-blue-100 text-blue-700',
    green:  'bg-emerald-100 text-emerald-700',
    orange: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${styles[color] || styles.blue}`}>
      {label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// CLOUDINARY — module level (stable, no closure issues)
// ─────────────────────────────────────────────────────────────
const CLOUD_NAME     = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET  = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const cloudUpload = async (file, label, setUploading) => {
  setUploading(true);
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  try {
    const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || 'Upload failed');
  } catch {
    toast.error(`Failed to upload ${label}`);
    return null;
  } finally {
    setUploading(false);
  }
};

// ─────────────────────────────────────────────────────────────
// DATA HELPERS
// ─────────────────────────────────────────────────────────────
const extractSchool = (r) =>
  r?.data?.data?.school || r?.data?.data || r?.data?.school || r?.data || r?.school || r || {};

const extractUser = (r, fallback) =>
  r?.data?.data || r?.data || r || fallback || {};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const TeacherProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [isEditing, setIsEditing]   = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const EMPTY = {
    schoolName: '', logo: '', phoneNumber: '', website: '', address: '',
    city: '', state: '', country: 'Nigeria', coverImage: '',
    registrationNumber: '', registrationDocument: '', principalName: '',
    establishedYear: '', isRegistered: false,
    firstName: '', lastName: '', email: '', phone: '', image: '',
  };

  const [saved, setSaved]     = useState(EMPTY);
  const [form, setForm]       = useState(EMPTY);
  const [previews, setPreviews] = useState({ logo: null, coverImage: null, profileImage: null });

  // ── Fetch ────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, uRes] = await Promise.allSettled([
        schoolProfileAPI.getSchoolProfile(),
        authAPI.getCurrentUser(),
      ]);
      const s = sRes.status === 'fulfilled' ? extractSchool(sRes.value) : {};
      const u = uRes.status === 'fulfilled' ? extractUser(uRes.value, user) : (user || {});

      const data = {
        schoolName:           s.schoolName          || s.school_name           || '',
        logo:                 s.logo                || '',
        phoneNumber:          s.phoneNumber         || s.phone_number          || '',
        website:              s.website             || '',
        address:              s.address             || '',
        city:                 s.city                || '',
        state:                s.state               || '',
        country:              s.country             || 'Nigeria',
        coverImage:           s.coverImage          || s.cover_image           || '',
        registrationNumber:   s.registrationNumber  || s.registration_number   || '',
        registrationDocument: s.registrationDocument || s.registration_document || '',
        principalName:        s.principalName       || s.principal_name        || '',
        establishedYear:      s.establishedYear     || s.established_year      || '',
        isRegistered:         s.isRegistered        || s.is_registered         || false,
        firstName:            u.firstName           || u.first_name            || '',
        lastName:             u.lastName            || u.last_name             || '',
        email:                u.email               || '',
        phone:                u.phone               || u.phoneNumber           || '',
        image:                u.image               || u.profileImage          || '',
      };

      setSaved(data);
      setForm(data);
      setPreviews({ logo: data.logo || null, coverImage: data.coverImage || null, profileImage: data.image || null });
    } catch {
      toast.error('Failed to load profile');
      if (user) {
        const fb = { ...EMPTY, firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', image: user.image || '' };
        setSaved(fb); setForm(fb);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Track unsaved changes ─────────────────────────────────────
  useEffect(() => {
    if (!isEditing) { setHasChanges(false); return; }
    setHasChanges(JSON.stringify(form) !== JSON.stringify(saved));
  }, [form, saved, isEditing]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handleImageUpload = useCallback(async (e, fieldName, previewKey) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      toast.error('JPEG, PNG or WEBP only'); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return; }

    // Optimistic local preview
    const reader = new FileReader();
    reader.onloadend = () => setPreviews((p) => ({ ...p, [previewKey]: reader.result }));
    reader.readAsDataURL(file);

    const url = await cloudUpload(file, fieldName, setUploading);
    if (url) {
      setForm((p) => ({ ...p, [fieldName]: url }));
      setPreviews((p) => ({ ...p, [previewKey]: url }));
    } else {
      setPreviews((p) => ({ ...p, [previewKey]: saved[fieldName] || null }));
    }
  }, [saved]);

  const handleImageRemove = useCallback((previewKey, fieldName) => {
    setPreviews((p) => ({ ...p, [previewKey]: null }));
    setForm((p) => ({ ...p, [fieldName]: '' }));
  }, []);

  const cancelEdit = useCallback(() => {
    setForm(saved);
    setPreviews({ logo: saved.logo || null, coverImage: saved.coverImage || null, profileImage: saved.image || null });
    setIsEditing(false);
    setHasChanges(false);
  }, [saved]);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!hasChanges) { toast('No changes to save', { icon: 'ℹ️' }); return; }
    setSaving(true);
    try {
      // Build school patch
      const schoolKeys = ['schoolName','logo','phoneNumber','website','address','city','state','country',
        'coverImage','registrationNumber','registrationDocument','principalName','establishedYear','isRegistered'];
      const schoolPatch = {};
      schoolKeys.forEach((k) => {
        if (form[k] === saved[k]) return;
        if (k === 'isRegistered') { schoolPatch[k] = form[k]; return; }
        if (k === 'establishedYear') {
          const y = parseInt(form[k]);
          if (y >= 1800 && y <= new Date().getFullYear()) schoolPatch[k] = y;
          return;
        }
        if (form[k]?.toString().trim()) schoolPatch[k] = form[k].toString().trim();
      });

      // Build user patch
      const userPatch = {};
      ['firstName','lastName','phone','image'].forEach((k) => {
        if (form[k] !== saved[k]) userPatch[k] = form[k]?.trim() || null;
      });

      const tasks = [];
      if (Object.keys(schoolPatch).length) tasks.push(schoolProfileAPI.updateSchoolProfile(schoolPatch));
      if (Object.keys(userPatch).length && user?.id) tasks.push(authAPI.updateUserProfile(user.id, userPatch));

      if (!tasks.length) { toast('No changes to save', { icon: 'ℹ️' }); setSaving(false); return; }

      await Promise.all(tasks);
      if (Object.keys(userPatch).length && updateUser && user?.id) {
        await updateUser(user.id, userPatch).catch(() => {});
      }

      toast.success('Profile saved successfully');
      await fetchData();
      setIsEditing(false);
      setHasChanges(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [form, saved, hasChanges, user, updateUser, fetchData]);

  // ── Derived values ────────────────────────────────────────────
  const fullName = [saved.firstName, saved.lastName].filter(Boolean).join(' ') || 'School Admin';
  const initials = [saved.firstName?.[0], saved.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'SA';

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-[#f5f6fa] py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Page header ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-3"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">School Profile</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage school information and admin account settings</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-white transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            ) : (
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-white transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Hero card ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
        >
          {/* Cover */}
          <div className="relative h-44 overflow-hidden">
            {previews.coverImage ? (
              <img src={previews.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full relative"
                style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #312e81 100%)' }}
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}
                />
              </div>
            )}
            {isEditing && (
              <label className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'coverImage', 'coverImage')}
                  className="hidden"
                />
                <Camera className="w-3.5 h-3.5" />
                Change Cover
              </label>
            )}
          </div>

          {/* Avatar + meta */}
          <div className="px-6 pb-6">
            <div className="flex flex-wrap items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                  {previews.profileImage
                    ? <img src={previews.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold text-white">{initials}</span>
                  }
                </div>
                {isEditing && (
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-md border-2 border-white">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'image', 'profileImage')}
                      className="hidden"
                    />
                    <Camera className="w-3.5 h-3.5" />
                  </label>
                )}
              </div>

              {/* Info strip */}
              <div className="flex-1 pt-14 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        name="schoolName"
                        value={form.schoolName || ''}
                        onChange={handleChange}
                        placeholder="School name"
                        className="text-xl font-bold text-slate-900 bg-transparent border-b-2 border-blue-400 outline-none w-full pb-0.5 placeholder:text-slate-300"
                      />
                    ) : (
                      <h2 className="text-xl font-bold text-slate-900 truncate">
                        {saved.schoolName || (
                          <span className="text-slate-400 font-normal italic">School name not set</span>
                        )}
                      </h2>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge label={fullName} color="blue" />
                      {saved.isRegistered   && <Badge label="✓ Govt. Registered"   color="green"  />}
                      {saved.establishedYear && <Badge label={`Est. ${saved.establishedYear}`} color="orange" />}
                      {saved.city           && <Badge label={saved.city}            color="blue"   />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Editing notice banner */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-blue-100 bg-blue-50/60 px-6 py-3 flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-semibold text-blue-700">
                  Editing mode — changes are not saved until you click Save Changes
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Content grid ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* School Information */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Section title="School Information" icon={Building} accent="#3b82f6">
              <div className="grid grid-cols-2 gap-4">
                <Field label="School Name"    name="schoolName"    value={form.schoolName}    isEditing={isEditing} onChange={handleChange} required icon={Building} />
                <Field label="Principal Name" name="principalName" value={form.principalName} isEditing={isEditing} onChange={handleChange} icon={User} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone"    name="phoneNumber" value={form.phoneNumber} type="tel"   isEditing={isEditing} onChange={handleChange} icon={Phone} />
                <Field label="Email"    name="email"       value={form.email}       type="email" isEditing={false}     onChange={handleChange} icon={Mail} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Website"          name="website"         value={form.website}         type="url"    isEditing={isEditing} onChange={handleChange} icon={Globe} />
                <Field label="Established Year" name="establishedYear" value={form.establishedYear} type="number" isEditing={isEditing} onChange={handleChange} icon={Calendar} />
              </div>
              <ImageField
                label="School Logo"
                hint="Square, max 5 MB — PNG/JPG/WEBP"
                preview={previews.logo}
                fieldName="logo"
                previewType="logo"
                isEditing={isEditing}
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                uploading={uploading}
              />
            </Section>
          </motion.div>

          {/* Admin Account */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Section title="Admin Account" icon={User} accent="#10b981">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" name="firstName" value={form.firstName} isEditing={isEditing} onChange={handleChange} required icon={User} />
                <Field label="Last Name"  name="lastName"  value={form.lastName}  isEditing={isEditing} onChange={handleChange} required icon={User} />
              </div>
              <div>
                <Field label="Email Address" name="email" value={form.email} type="email" isEditing={false} onChange={handleChange} required icon={Mail} />
                <p className="text-[11px] text-slate-400 flex items-center gap-1 -mt-1">
                  <Lock className="w-3 h-3" /> Email cannot be changed here
                </p>
              </div>
              <Field label="Phone Number" name="phone" value={form.phone} type="tel" isEditing={isEditing} onChange={handleChange} icon={Phone} />
              <ImageField
                label="Profile Photo"
                hint="Square, max 5 MB"
                preview={previews.profileImage}
                fieldName="image"
                previewType="profileImage"
                isEditing={isEditing}
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                uploading={uploading}
                shape="round"
              />
            </Section>
          </motion.div>

          {/* Location */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Section title="Location" icon={MapPin} accent="#f59e0b">
              <Field label="Street Address" name="address" value={form.address} isEditing={isEditing} onChange={handleChange} multiline icon={MapPin} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="City"  name="city"  value={form.city}  isEditing={isEditing} onChange={handleChange} />
                <Field label="State" name="state" value={form.state} isEditing={isEditing} onChange={handleChange} />
              </div>
              <Field label="Country" name="country" value={form.country} isEditing={isEditing} onChange={handleChange} icon={Globe} />
            </Section>
          </motion.div>

          {/* Registration */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Section title="Registration & Compliance" icon={FileText} accent="#8b5cf6">
              <Field label="Registration Number" name="registrationNumber" value={form.registrationNumber} isEditing={isEditing} onChange={handleChange} icon={FileText} />

              {/* Registration toggle */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Registration Status</label>
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                    ${form.isRegistered ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'}
                    ${!isEditing ? 'pointer-events-none' : 'cursor-pointer'}`}
                >
                  {/* Toggle switch */}
                  <div className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form.isRegistered ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isRegistered ? 'left-5' : 'left-0.5'}`} />
                    <input
                      type="checkbox"
                      name="isRegistered"
                      checked={form.isRegistered || false}
                      onChange={handleChange}
                      className="sr-only"
                    />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${form.isRegistered ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {form.isRegistered ? 'Government-Registered Institution' : 'Not yet registered'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {form.isRegistered
                        ? 'This school is officially registered with the government.'
                        : 'Toggle to mark this school as registered.'}
                    </p>
                  </div>
                  {form.isRegistered && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                </label>
              </div>

              {/* Cover image upload */}
              <ImageField
                label="Cover / Banner Image"
                hint="Wide banner — max 5 MB"
                preview={previews.coverImage}
                fieldName="coverImage"
                previewType="coverImage"
                isEditing={isEditing}
                onUpload={handleImageUpload}
                onRemove={handleImageRemove}
                uploading={uploading}
              />
            </Section>
          </motion.div>
        </div>

        {/* ── Sticky save bar ──────────────────────────────────── */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="sticky bottom-4 z-40"
            >
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasChanges ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                  {hasChanges
                    ? <span className="font-medium text-slate-700">You have unsaved changes</span>
                    : <span className="text-slate-400">No changes yet — edit a field above</span>
                  }
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving || uploading || !hasChanges}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl
                      shadow-sm shadow-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : <><Save className="w-4 h-4" /> Save Changes</>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default TeacherProfile;
