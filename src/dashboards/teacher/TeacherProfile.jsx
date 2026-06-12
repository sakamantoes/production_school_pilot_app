// pages/teacher/TeacherProfile.jsx
// ─── Complete Teacher Profile Component ─────────────────────────────────────────
// Allows editing: firstName, lastName, phone, image
// Professional design with form validation and image upload

import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Camera, Edit2, Save, X,
  CheckCircle, Upload, Loader2, Lock, RefreshCw,
  Calendar, Award, BookOpen, Users,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';
import { authAPI } from '../../services/authApi';

// ─────────────────────────────────────────────────────────────
// CLOUDINARY CONFIG
// ─────────────────────────────────────────────────────────────
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const cloudUpload = async (file, setUploading) => {
  setUploading(true);
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'teachers');
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || 'Upload failed');
  } catch {
    toast.error('Failed to upload image');
    return null;
  } finally {
    setUploading(false);
  }
};

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

const Field = ({ label, name, value, type = 'text', isEditing, onChange, required = false, icon: Icon }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
      {required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
    {isEditing ? (
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
    ) : (
      <p className={`text-sm py-2 px-0.5 font-medium ${value ? 'text-slate-800' : 'text-slate-400 italic'}`}>
        {value || 'Not provided'}
      </p>
    )}
  </div>
);

const Section = ({ title, icon: Icon, accent = '#3b82f6', children }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
    <div
      className="flex items-center gap-3 px-6 py-4 border-b border-slate-100"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}18` }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
    <div className="px-6 py-5 space-y-5">{children}</div>
  </div>
);

const InfoCard = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
    </div>
  </div>
);

const Badge = ({ label, color = 'blue' }) => {
  const styles = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${styles[color] || styles.blue}`}>
      {label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const TeacherProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [schoolData, setSchoolData] = useState(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    image: '',
    password: '',
    confirmPassword: '',
  });

  const [savedForm, setSavedForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    image: '',
  });

  const [imgPreview, setImgPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // ── Fetch teacher data ────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authAPI.getCurrentUser();
      const data = res?.data?.data || res?.data || res;
      
      // Extract teacher and school info from response
      const teacherInfo = {
        id: data.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        image: data.image || '',
        role: data.role || 'TEACHER',
        createdAt: data.createdAt,
      };
      
      const schoolInfo = data.school || {
        schoolName: '',
        logo: '',
        address: '',
        city: '',
        state: '',
        country: '',
      };
      
      setTeacherData(teacherInfo);
      setSchoolData(schoolInfo);
      
      setForm({
        firstName: teacherInfo.firstName,
        lastName: teacherInfo.lastName,
        email: teacherInfo.email,
        phone: teacherInfo.phone || '',
        image: teacherInfo.image || '',
        password: '',
        confirmPassword: '',
      });
      
      setSavedForm({
        firstName: teacherInfo.firstName,
        lastName: teacherInfo.lastName,
        email: teacherInfo.email,
        phone: teacherInfo.phone || '',
        image: teacherInfo.image || '',
      });
      
      setImgPreview(teacherInfo.image || null);
      
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Track unsaved changes ─────────────────────────────────
  useEffect(() => {
    if (!isEditing) {
      setHasChanges(false);
      return;
    }
    const hasChangesFlag = 
      form.firstName !== savedForm.firstName ||
      form.lastName !== savedForm.lastName ||
      form.phone !== savedForm.phone ||
      form.image !== savedForm.image ||
      form.password !== '';
    setHasChanges(hasChangesFlag);
  }, [form, savedForm, isEditing]);

  // ── Handlers ──────────────────────────────────────────────
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }, [errors]);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'JPEG, PNG or WEBP only' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Max 5 MB' }));
      return;
    }
    
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setImgPreview(reader.result);
    reader.readAsDataURL(file);
    setErrors(prev => ({ ...prev, image: '' }));
    
    try {
      const url = await cloudUpload(file, setUploading);
      if (url) {
        setForm(prev => ({ ...prev, image: url }));
        setImgPreview(url);
        toast.success('Photo uploaded successfully');
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, image: err.message }));
      setImgPreview(savedForm.image || null);
    }
  };
  
  const removeImage = () => {
    setForm(prev => ({ ...prev, image: '' }));
    setImgPreview(null);
  };

  // Validate form
  const validate = () => {
    const newErrors = {};
    
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (form.password) {
      if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors before saving');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        image: form.image || undefined,
      };
      
      if (form.password) {
        payload.password = form.password;
      }
      
      await authAPI.updateUserProfile(teacherData.id, payload);
      
      // Update saved form state
      setSavedForm({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email,
        phone: form.phone.trim() || '',
        image: form.image || '',
      });
      
      toast.success('Profile updated successfully');
      setIsEditing(false);
      setForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      
      // Update auth context
      if (updateUser) {
        await updateUser(teacherData.id, payload);
      }
      
      await fetchData();
      
    } catch (error) {
      console.error('Update error:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to update profile';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setForm({
      ...savedForm,
      password: '',
      confirmPassword: '',
    });
    setImgPreview(savedForm.image || null);
    setErrors({});
    setIsEditing(false);
    setHasChanges(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const fullName = `${savedForm.firstName} ${savedForm.lastName}`.trim() || 'Teacher';
  const initials = [savedForm.firstName?.[0], savedForm.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'T';

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-[#f5f6fa] py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-3"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your personal information and account settings</p>
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

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
        >
          {/* Cover Banner */}
          <div className="relative h-32 overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
          </div>

          {/* Avatar + Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-wrap items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                  {imgPreview ? (
                    <img src={imgPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{initials}</span>
                  )}
                </div>
                {isEditing && (
                  <>
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-md border-2 border-white">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Camera className="w-3.5 h-3.5" />
                    </label>
                    {imgPreview && (
                      <button
                        onClick={removeImage}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md border-2 border-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pt-14 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-slate-900 truncate">{fullName}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge label={teacherData?.role || 'Teacher'} color="blue" />
                      <Badge label={teacherData?.email} color="purple" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Editing notice */}
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

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <InfoCard label="Email" value={savedForm.email} icon={Mail} color="#3b82f6" />
          <InfoCard label="Phone" value={savedForm.phone || 'Not provided'} icon={Phone} color="#10b981" />
          <InfoCard label="Member Since" value={formatDate(teacherData?.createdAt)} icon={Calendar} color="#f59e0b" />
          <InfoCard label="Role" value={teacherData?.role || 'Teacher'} icon={Award} color="#8b5cf6" />
        </div>

        {/* School Information Card (if available) */}
        {schoolData?.schoolName && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Section title="School Information" icon={BookOpen} accent="#10b981">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">School Name</p>
                  <p className="text-sm font-semibold text-slate-800">{schoolData.schoolName}</p>
                </div>
                {schoolData.address && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Location</p>
                    <p className="text-sm text-slate-700">
                      {[schoolData.address, schoolData.city, schoolData.state, schoolData.country]
                        .filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {schoolData.logo && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">School Logo</p>
                    <img src={schoolData.logo} alt="School Logo" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                  </div>
                )}
              </div>
            </Section>
          </motion.div>
        )}

        {/* Edit Form */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-800">Edit Profile Information</h3>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 outline-none transition-all ${
                          errors.firstName ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500'
                        }`}
                        placeholder="Enter first name"
                      />
                      {errors.firstName && (
                        <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 outline-none transition-all ${
                          errors.lastName ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500'
                        }`}
                        placeholder="Enter last name"
                      />
                      {errors.lastName && (
                        <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={form.email}
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border-2 border-slate-200 outline-none focus:border-blue-500 transition-all"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Password Change Section */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-500" />
                      Change Password (Optional)
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                          New Password
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={form.password}
                          onChange={handleChange}
                          className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 outline-none transition-all ${
                            errors.password ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500'
                          }`}
                          placeholder="Minimum 8 characters"
                        />
                        {errors.password && (
                          <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 outline-none transition-all ${
                              errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500'
                            }`}
                            placeholder="Repeat new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                        )}
                        {form.password && form.confirmPassword && form.password === form.confirmPassword && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Passwords match
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-5 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || uploading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherProfile;