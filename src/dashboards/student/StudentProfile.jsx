// pages/student/StudentProfile.jsx
// ─── Student Profile with API integration ──────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Camera, Save, X, Loader2,
  RefreshCw, Calendar, GraduationCap, BookOpen,
  CheckCircle, AlertCircle, Edit2, EyeOff, Eye,
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ phone: '', image: '' });
  const [errors, setErrors] = useState({});

  const fetchProfile = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await studentApi.getProfile();
      const data = res?.data?.data || res?.data || res;
      setProfile(data);
      setForm({
        phone: data?.user?.phone || data?.phone || '',
        image: data?.user?.image || data?.image || '',
      });
      if (isRefresh) toast.success('Profile refreshed');
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (form.phone && form.phone.length < 7) {
      newErrors.phone = 'Phone must be at least 7 characters';
    }
    if (form.image && !form.image.match(/^https?:\/\/.+/)) {
      newErrors.image = 'Enter a valid image URL';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      if (form.phone !== profile?.user?.phone) payload.phone = form.phone;
      if (form.image !== profile?.user?.image) payload.image = form.image;

      if (Object.keys(payload).length === 0) {
        toast('No changes to save', { icon: 'ℹ️' });
        setEditing(false);
        setSaving(false);
        return;
      }

      const res = await studentApi.updateProfile(payload);
      const updated = res?.data?.data || res?.data || res;
      setProfile(updated);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (!profile) return 'S';
    const user = profile.user || profile;
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName[0] || '') + (lastName[0] || '');
  };

  const getFullName = () => {
    if (!profile) return 'Student';
    const user = profile.user || profile;
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  const user = profile?.user || profile || {};
  const enrollments = profile?.enrollments || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold">
              {getInitials()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
              <p className="text-blue-200 text-sm">{getFullName()}</p>
            </div>
          </div>
          <button
            onClick={() => fetchProfile(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <h2 className="font-bold text-slate-700">Personal Information</h2>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Full Name
                </label>
                <div className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  {getFullName()}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Name cannot be changed. Contact admin.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Email
                </label>
                <div className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  {user.email || '—'}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed. Contact admin.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={`w-full px-3 py-2 text-sm rounded-xl border-2 outline-none transition-all ${
                    errors.phone ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Profile Image URL
                </label>
                <input
                  type="url"
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                  className={`w-full px-3 py-2 text-sm rounded-xl border-2 outline-none transition-all ${
                    errors.image ? 'border-rose-400 bg-rose-50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                {errors.image && <p className="text-xs text-rose-500 mt-1">{errors.image}</p>}
                {form.image && (
                  <div className="mt-2">
                    <img src={form.image} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      phone: user.phone || '',
                      image: user.image || '',
                    });
                    setErrors({});
                  }}
                  className="px-5 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Full Name</p>
                  <p className="text-sm font-medium text-slate-700">{getFullName()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Email</p>
                  <p className="text-sm font-medium text-slate-700">{user.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Phone</p>
                  <p className="text-sm font-medium text-slate-700">{user.phone || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Student ID</p>
                  <p className="text-sm font-medium text-slate-700">{profile.studentId || '—'}</p>
                </div>
              </div>

              {user.image && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Profile Photo</p>
                  <img src={user.image} alt="Profile" className="w-20 h-20 rounded-xl object-cover border border-slate-200" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enrollments */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-400" />
              <h2 className="font-bold text-slate-700">Enrollment History</h2>
            </div>
          </div>
          <div className="p-6">
            {enrollments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No enrollment records found</p>
            ) : (
              <div className="space-y-3">
                {enrollments.map((enrollment, idx) => (
                  <div key={enrollment.id || idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-medium text-slate-800">
                        {enrollment.class?.name || 'Class'} {enrollment.arm?.name ? `- ${enrollment.arm.name}` : ''}
                      </p>
                      <p className="text-xs text-slate-400">
                        Session: {enrollment.session?.name || '—'} • Status: {enrollment.status || 'ACTIVE'}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      enrollment.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {enrollment.status || 'ACTIVE'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;