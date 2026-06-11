// pages/school/AnnouncementsAdmin.jsx
// ─── Fixes ────────────────────────────────────────────────────────────────────
// Bug 1: field was "content" → backend expects "body"
// Bug 2: audience values were lowercase ("all","students") →
//        backend expects "EVERYONE"|"TEACHERS"|"STUDENTS"|"SPECIFIC_CLASSES"
// Bug 3: scheduledFor and expiresAt sent as datetime-local strings →
//        converted to ISO strings before sending
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Megaphone, Plus, Edit2, Trash2, X, Save, RefreshCw, Loader2,
  AlertCircle, Send, EyeOff, Calendar, Clock, Users,
  GraduationCap, Briefcase, Globe, Search, CheckCircle,
  ChevronDown, Bell, Link2, FileText, Filter,
} from 'lucide-react';
import { announcementAPI } from '../../services/schoolApi';

// ─── Constants ────────────────────────────────────────────────────────────────
// Values match exactly what the backend enum accepts
const AUDIENCE = [
  { value: 'EVERYONE',         label: 'Everyone',        icon: Globe,        color: '#8b5cf6', bg: '#f5f3ff' },
  { value: 'STUDENTS',         label: 'Students',         icon: GraduationCap,color: '#3b82f6', bg: '#eff6ff' },
  { value: 'TEACHERS',         label: 'Teachers',         icon: Briefcase,    color: '#10b981', bg: '#f0fdf4' },
  { value: 'SPECIFIC_CLASSES', label: 'Specific Classes', icon: Users,        color: '#f59e0b', bg: '#fffbeb' },
];

const PRIORITY = [
  { value: 'low',    label: 'Low',    dot: '#94a3b8', chip: 'bg-slate-100 text-slate-600'  },
  { value: 'normal', label: 'Normal', dot: '#3b82f6', chip: 'bg-blue-100  text-blue-700'   },
  { value: 'high',   label: 'High',   dot: '#f59e0b', chip: 'bg-amber-100 text-amber-700'  },
  { value: 'urgent', label: 'Urgent', dot: '#ef4444', chip: 'bg-rose-100  text-rose-700'   },
];

const aud = (v)  => AUDIENCE.find(a => a.value === v) || AUDIENCE[0];
const pri = (v)  => PRIORITY.find(p => p.value === v) || PRIORITY[1];
const fmt = (d)  => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
const toISO = (s) => s ? new Date(s).toISOString() : undefined;

// ─── Data helper ──────────────────────────────────────────────────────────────
const toArray = (res, ...keys) => {
  if (!res) return [];
  const c = [res, res.data, res.data?.data, ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const v of c) { if (Array.isArray(v)) return v; }
  return [];
};

// ─── Form defaults ────────────────────────────────────────────────────────────
const DEFAULTS = {
  title: '', body: '',          // ← "body" matches the backend field name
  audience: 'EVERYONE',        // ← uppercase enum value
  priority: 'normal',
  scheduledFor: '', expiresAt: '', link: '', linkText: '',
};

// ─── Small primitives ─────────────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
    {children}{required && <span className="text-purple-500 ml-0.5">*</span>}
  </label>
);

const Input = ({ error, ...props }) => (
  <input {...props}
    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 outline-none transition-all
      bg-slate-50 text-slate-800 placeholder:text-slate-300
      focus:border-purple-500 focus:bg-white hover:border-slate-300
      ${error ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}
  />
);

const Textarea = ({ error, ...props }) => (
  <textarea {...props}
    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 outline-none transition-all resize-none
      bg-slate-50 text-slate-800 placeholder:text-slate-300
      focus:border-purple-500 focus:bg-white hover:border-slate-300
      ${error ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}
  />
);

const Sel = ({ error, children, ...props }) => (
  <div className="relative">
    <select {...props}
      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 outline-none appearance-none transition-all
        bg-slate-50 text-slate-800 focus:border-purple-500 focus:bg-white hover:border-slate-300
        ${error ? 'border-rose-400' : 'border-slate-200'}`}>
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
  </div>
);

const Err = ({ msg }) => msg
  ? <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />{msg}</p>
  : null;

// ─── Confirm dialog ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ title, message, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
    <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.93, opacity: 0 }}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-rose-100 flex-shrink-0 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-rose-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Delete
        </button>
      </div>
    </motion.div>
  </div>
);

// ─── Announcement Form Drawer ─────────────────────────────────────────────────
const AnnouncementDrawer = ({ initial, onSave, onClose, saving, isEdit }) => {
  const [form,   setForm]   = useState({ ...DEFAULTS, ...initial });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.body.trim())  e.body  = 'Content is required';
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // ── Build payload with CORRECT field names ──────────────────────────────
    onSave({
      title:        form.title.trim(),
      body:         form.body.trim(),          // ← "body" not "content"
      audience:     form.audience,             // ← already uppercase enum
      priority:     form.priority,
      scheduledFor: toISO(form.scheduledFor),  // ← ISO string or undefined
      expiresAt:    toISO(form.expiresAt),
      link:         form.link.trim()     || undefined,
      linkText:     form.linkText.trim() || undefined,
    });
  };

  const charCount = form.body.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="h-full w-full max-w-lg flex flex-col bg-white shadow-2xl border-l border-slate-100">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
              {isEdit ? <Edit2 className="w-4 h-4 text-purple-600" /> : <Megaphone className="w-4 h-4 text-purple-600" />}
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">{isEdit ? 'Edit Announcement' : 'New Announcement'}</h2>
              <p className="text-[11px] text-slate-400">{isEdit ? 'Update this post' : 'Compose and send to your school'}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Title */}
          <div>
            <Label required>Title</Label>
            <Input value={form.title} onChange={set('title')} placeholder="What's this announcement about?" error={errors.title} autoFocus />
            <Err msg={errors.title} />
          </div>

          {/* Body — field name is "body" per backend */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label required>Message</Label>
              <span className="text-[10px] text-slate-400">{charCount} chars</span>
            </div>
            <Textarea value={form.body} onChange={set('body')}
              placeholder="Write your announcement here — be clear and direct…"
              rows={6} error={errors.body} />
            <Err msg={errors.body} />
          </div>

          {/* Audience + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Audience</Label>
              {/* Audience visual picker */}
              <div className="space-y-1.5">
                {AUDIENCE.map(a => {
                  const Icon = a.icon;
                  const active = form.audience === a.value;
                  return (
                    <button key={a.value} type="button"
                      onClick={() => setForm(p => ({ ...p, audience: a.value }))}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor:  active ? a.color : '#e2e8f0',
                        background:   active ? a.bg    : '#f8fafc',
                        color:        active ? a.color : '#64748b',
                      }}>
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs font-semibold">{a.label}</span>
                      {active && <CheckCircle className="w-3 h-3 ml-auto flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Priority */}
              <div>
                <Label>Priority</Label>
                <div className="space-y-1.5">
                  {PRIORITY.map(p => {
                    const active = form.priority === p.value;
                    return (
                      <button key={p.value} type="button"
                        onClick={() => setForm(prev => ({ ...prev, priority: p.value }))}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 text-left transition-all text-xs font-semibold
                          ${active ? p.chip + ' border-current' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.dot }} />
                        {p.label}
                        {active && <CheckCircle className="w-3 h-3 ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Scheduling (optional)</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Publish at</Label>
              <Input type="datetime-local" value={form.scheduledFor} onChange={set('scheduledFor')} />
            </div>
            <div>
              <Label>Expires at</Label>
              <Input type="datetime-local" value={form.expiresAt} onChange={set('expiresAt')} />
            </div>
          </div>

          {/* Link */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Link (optional)</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <div>
            <Label>URL</Label>
            <Input type="url" value={form.link} onChange={set('link')} placeholder="https://…" />
          </div>

          <AnimatePresence>
            {form.link && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <Label>Link label</Label>
                <Input value={form.linkText} onChange={set('linkText')} placeholder="e.g. View results, Read more" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all bg-purple-600 hover:bg-purple-700 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Announcement card ────────────────────────────────────────────────────────
const AnnCard = ({ ann, onEdit, onDelete, onPublish, onUnpublish, idx }) => {
  const a   = aud(ann.audience);
  const p   = pri(ann.priority);
  const Icon = a.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.04, 0.4) }}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

      {/* Priority accent bar */}
      <div className="h-1" style={{ background: p.dot }} />

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Audience icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: a.bg }}>
            <Icon className="w-4.5 h-4.5" style={{ color: a.color }} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {ann.isPublished
                ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-2.5 h-2.5" /> Published
                  </span>
                : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    <Clock className="w-2.5 h-2.5" /> Draft
                  </span>
              }
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.chip}`}>{p.label}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: a.bg, color: a.color }}>
                {a.label}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 leading-snug">{ann.title}</h3>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {ann.isPublished
              ? <button onClick={() => onUnpublish(ann.id)} title="Unpublish"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all">
                  <EyeOff className="w-4 h-4" />
                </button>
              : <button onClick={() => onPublish(ann.id)} title="Publish"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                  <Send className="w-4 h-4" />
                </button>
            }
            <button onClick={() => onEdit(ann)} title="Edit"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(ann)} title="Delete"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body preview */}
        <div className="mt-3 ml-13">
          <p className={`text-sm text-slate-600 leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
            {ann.body || ann.content}
          </p>
          {(ann.body || ann.content || '').length > 120 && (
            <button onClick={() => setExpanded(e => !e)}
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 mt-1 transition-colors">
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 ml-13 text-[11px] text-slate-400">
          {ann.createdAt && (
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmt(ann.createdAt)}</span>
          )}
          {ann.scheduledFor && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Publishes {fmt(ann.scheduledFor)}</span>
          )}
          {ann.expiresAt && (
            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />Expires {fmt(ann.expiresAt)}</span>
          )}
        </div>

        {/* Link */}
        {ann.link && (
          <div className="mt-3 ml-13">
            <a href={ann.link} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors">
              <Link2 className="w-3 h-3" />
              {ann.linkText || 'View link'}
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const AnnouncementsAdmin = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [filterAudience,setFilterAudience]= useState('all');

  const [panel,         setPanel]         = useState(null);  // 'create' | 'edit'
  const [editing,       setEditing]       = useState(null);
  const [confirm,       setConfirm]       = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await announcementAPI.getAnnouncements();
      setAnnouncements(toArray(res, 'announcements'));
      if (isRefresh) toast.success('Refreshed');
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filter ─────────────────────────────────────────────────
  const visible = [...announcements]
    .filter(a => {
      const text = `${a.title} ${a.body || a.content || ''}`.toLowerCase();
      if (search && !text.includes(search.toLowerCase())) return false;
      if (filterStatus === 'published' && !a.isPublished) return false;
      if (filterStatus === 'draft'     &&  a.isPublished) return false;
      if (filterAudience !== 'all' && a.audience !== filterAudience) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // ── Stats ──────────────────────────────────────────────────
  const total     = announcements.length;
  const published = announcements.filter(a => a.isPublished).length;
  const drafts    = total - published;

  // ── CRUD ───────────────────────────────────────────────────
  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await announcementAPI.updateAnnouncement(editing.id, payload);
        toast.success('Announcement updated');
      } else {
        await announcementAPI.createAnnouncement(payload);
        toast.success('Announcement created');
      }
      setPanel(null);
      setEditing(null);
      fetchAll();
    } catch (err) {
      // Surface backend validation errors clearly
      const msg = err?.response?.data?.errors?.[0]?.message
                || err?.response?.data?.message
                || 'Save failed';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (id) => {
    try {
      await announcementAPI.publishAnnouncement(id);
      toast.success('Published');
      fetchAll();
    } catch { toast.error('Failed to publish'); }
  };

  const handleUnpublish = async (id) => {
    try {
      await announcementAPI.unpublishAnnouncement(id);
      toast.success('Unpublished');
      fetchAll();
    } catch { toast.error('Failed to unpublish'); }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await announcementAPI.deleteAnnouncement(confirm.id);
      toast.success('Deleted');
      setConfirm(null);
      fetchAll();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const openEdit = (ann) => {
    setEditing(ann);
    setPanel('edit');
  };

  const hasFilters = search || filterStatus !== 'all' || filterAudience !== 'all';

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* ── Hero ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 py-8 mb-6"
        style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #6d28d9 100%)' }}>
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)', transform: 'translate(30%,-30%)' }} />

        <div className="relative max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
              <Megaphone className="w-3.5 h-3.5 text-purple-200" />
              <span className="text-purple-100 text-xs font-semibold">Communications</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Announcements</h1>
            <p className="text-purple-300 text-sm mt-1">Communicate with students, teachers and parents</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Total',     value: total,     color: 'text-white'       },
              { label: 'Published', value: published, color: 'text-emerald-300' },
              { label: 'Drafts',    value: drafts,    color: 'text-purple-300'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl px-4 py-3 text-center min-w-[70px]"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5 pb-12">

        {/* ── Toolbar ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search announcements…"
                className="w-full h-10 pl-10 pr-9 text-sm font-medium text-slate-800 placeholder:text-slate-300
                  bg-slate-50 border-2 border-slate-200 rounded-xl outline-none
                  focus:border-purple-500 focus:bg-white hover:border-slate-300 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status */}
            <div className="relative w-36">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="w-full h-10 pl-3.5 pr-9 text-sm font-medium text-slate-700 bg-slate-50 border-2 border-slate-200
                  rounded-xl outline-none appearance-none focus:border-purple-500 hover:border-slate-300 transition-all">
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Audience */}
            <div className="relative w-44">
              <select value={filterAudience} onChange={e => setFilterAudience(e.target.value)}
                className="w-full h-10 pl-3.5 pr-9 text-sm font-medium text-slate-700 bg-slate-50 border-2 border-slate-200
                  rounded-xl outline-none appearance-none focus:border-purple-500 hover:border-slate-300 transition-all">
                <option value="all">All Audiences</option>
                {AUDIENCE.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {hasFilters && (
              <button onClick={() => { setSearch(''); setFilterStatus('all'); setFilterAudience('all'); }}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:block">{visible.length} of {total}</span>
              <button onClick={() => fetchAll(true)} disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing…' : 'Refresh'}
              </button>
              <motion.button onClick={() => { setEditing(null); setPanel('create'); }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm shadow-purple-200 transition-colors">
                <Plus className="w-4 h-4" /> New Announcement
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── List ───────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-sm font-medium text-slate-400">Loading announcements…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 text-center">
            <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center mb-5">
              <Megaphone className="w-10 h-10 text-purple-300" />
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">
              {hasFilters ? 'No announcements match' : 'No announcements yet'}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {hasFilters ? 'Try adjusting your filters.' : 'Create your first school announcement.'}
            </p>
            {!hasFilters && (
              <motion.button onClick={() => { setEditing(null); setPanel('create'); }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-colors">
                <Plus className="w-4 h-4" /> Create First Announcement
              </motion.button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((ann, i) => (
              <AnnCard key={ann.id} ann={ann} idx={i}
                onEdit={openEdit}
                onDelete={setConfirm}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
              />
            ))}
          </div>
        )}

        {!loading && visible.length > 0 && (
          <p className="text-center text-xs text-slate-400 py-2">
            Showing {visible.length} of {total} announcements
          </p>
        )}
      </div>

      {/* ── Drawers ─────────────────────────────────────────── */}
      <AnimatePresence>
        {panel === 'create' && (
          <AnnouncementDrawer
            onSave={handleSave} onClose={() => setPanel(null)} saving={saving} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === 'edit' && editing && (
          <AnnouncementDrawer
            isEdit
            initial={{
              title:        editing.title        || '',
              body:         editing.body         || editing.content || '',
              audience:     editing.audience     || 'EVERYONE',
              priority:     editing.priority     || 'normal',
              scheduledFor: editing.scheduledFor ? editing.scheduledFor.slice(0, 16) : '',
              expiresAt:    editing.expiresAt    ? editing.expiresAt.slice(0, 16)    : '',
              link:         editing.link         || '',
              linkText:     editing.linkText     || '',
            }}
            onSave={handleSave}
            onClose={() => { setPanel(null); setEditing(null); }}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* ── Confirm delete ──────────────────────────────────── */}
      <AnimatePresence>
        {confirm && (
          <ConfirmDialog
            title={`Delete "${confirm.title}"?`}
            message="This announcement will be permanently removed and can't be recovered."
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnnouncementsAdmin;