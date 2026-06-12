// dashboards/school-admin/StudentDetail.jsx
// ─── Complete Edit Student Component ─────────────────────────────────────────
// Allows editing: firstName, lastName, email, phone, image, studentId, admissionYear
// Professional design with form validation and image upload

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Camera,
  Upload,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Calendar,
  Eye,
  EyeOff,
  Lock,
  BookOpen,
  Users,
} from 'lucide-react';
import { studentAPI, classAPI, sessionAPI, termAPI } from '../../services/schoolApi';

// ─────────────────────────────────────────────────────────────
// CLOUDINARY CONFIG
// ─────────────────────────────────────────────────────────────
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const cloudUpload = async (file, setUploading) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured');
  }
  setUploading(true);
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  fd.append('folder', 'students');
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: fd,
    });
    const data = await res.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || 'Upload failed');
  } finally {
    setUploading(false);
  }
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [res, res.data, res.data?.data, ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
};

const normaliseStudent = (s) => {
  const u = s.user || s;
  return {
    id: s.id,
    userId: s.userId || u.id,
    studentId: s.studentId || u.student_id || '',
    firstName: u.firstName || u.first_name || '',
    lastName: u.lastName || u.last_name || '',
    email: u.email || '',
    phone: u.phone || '',
    image: u.image || '',
    isActive: u.isActive !== false,
    admissionYear: s.admissionYear || u.admission_year || new Date().getFullYear(),
    createdAt: s.createdAt || u.createdAt || s.created_at,
    _raw: s,
  };
};

// ─────────────────────────────────────────────────────────────
// EDIT STUDENT COMPONENT
// ─────────────────────────────────────────────────────────────
const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [originalStudent, setOriginalStudent] = useState(null);
  
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    image: '',
    studentId: '',
    admissionYear: new Date().getFullYear(),
    isActive: true,
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [imgPreview, setImgPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Fetch student data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const studentRes = await studentAPI.getStudent(id);
      const studentData = studentRes?.data?.data || studentRes?.data || studentRes;
      setOriginalStudent(studentData);
      
      const normalized = normaliseStudent(studentData);
      setForm({
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        email: normalized.email,
        phone: normalized.phone,
        image: normalized.image,
        studentId: normalized.studentId,
        admissionYear: normalized.admissionYear,
        isActive: normalized.isActive,
        password: '',
        confirmPassword: '',
      });
      setImgPreview(normalized.image || null);
      
    } catch (error) {
      console.error('Error fetching student:', error);
      toast.error('Failed to load student data');
      navigate('/school-admin/student-management');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
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
      setForm(prev => ({ ...prev, image: url }));
      setImgPreview(url);
      toast.success('Photo uploaded successfully');
    } catch (err) {
      setErrors(prev => ({ ...prev, image: err.message }));
      setImgPreview(form.image || null);
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
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    
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
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        image: form.image || undefined,
        studentId: form.studentId,
        admissionYear: parseInt(form.admissionYear),
        isActive: form.isActive,
      };
      
      if (form.password) {
        payload.password = form.password;
      }
      
      await studentAPI.updateStudent(id, payload);
      toast.success('Student profile updated successfully');
      navigate('/school-admin/student-management');
    } catch (error) {
      console.error('Update error:', error);
      const errorMsg = error?.response?.data?.message || error?.response?.data?.errors?.[0]?.message || 'Failed to update student';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle activate/deactivate
  const handleToggleActive = async () => {
    try {
      if (form.isActive) {
        await studentAPI.deleteStudent(id);
        toast.success('Student deactivated');
      } else {
        await studentAPI.activateStudent(id);
        toast.success('Student activated');
      }
      setForm(prev => ({ ...prev, isActive: !prev.isActive }));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };
  
  // Year options for admission year dropdown
  const yearOptions = Array.from({ length: 20 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year };
  });
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-slate-500 font-medium">Loading student data...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/school-admin/student-management"
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Back to Students</span>
          </Link>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Edit Student</h1>
            <p className="text-xs text-slate-500">Update student information and settings</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleActive}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
              form.isActive
                ? 'text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100'
                : 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {form.isActive ? 'Deactivate Account' : 'Activate Account'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-500" />
            Profile Photo
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
                {imgPreview ? (
                  <img src={imgPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-slate-300" />
                )}
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-2xl bg-white/80 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload New Photo'}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
                {imgPreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    <X className="w-4 h-4" /> Remove
                  </button>
                )}
              </div>
              {errors.image && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.image}
                </p>
              )}
              <p className="text-xs text-slate-400">JPEG, PNG or WEBP — max 5 MB</p>
            </div>
          </div>
        </div>
        
        {/* Personal Information */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            Personal Information
          </h3>
          
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
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border-2 outline-none transition-all ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="student@school.com"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
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
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Student Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-500" />
            Student Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                Student ID
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="studentId"
                  value={form.studentId}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border-2 border-slate-200 bg-slate-50 outline-none cursor-not-allowed"
                  placeholder="Auto-generated"
                  readOnly
                  disabled
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Student ID is auto-generated and cannot be changed</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                Admission Year
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  name="admissionYear"
                  value={form.admissionYear}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border-2 border-slate-200 outline-none focus:border-blue-500 transition-all appearance-none bg-white"
                >
                  {yearOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-green-500" />
            Change Password
          </h3>
          
          <p className="text-xs text-slate-500 mb-4 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
            Leave password fields blank to keep the current password unchanged.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                New Password
              </label>
              <div className="relative">
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                Confirm Password
              </label>
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
          <Link
            to="/school-admin/student-management"
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentDetail;