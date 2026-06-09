// pages/school/AcademicManagement.jsx
// ── Same blue-indigo color palette kept exactly. UX/UI overhauled. ──────────
// Changes: slide-in drawer replaces basic modal, rich tab bar with counts,
// expandable class cards showing arms inline, stat cards, toast feedback,
// animated transitions, better empty states, form validation with inline errors.

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BookOpen, Grid3x3, FlaskConical, CalendarDays, Clock4,
  Plus, RefreshCw, Edit2, Trash2, X, ChevronRight,
  CheckCircle, Loader2, AlertCircle, Save, ChevronDown,
  GraduationCap, Layers, BookMarked, Calendar, Timer,
  Sparkles, ArrowRight,
} from 'lucide-react';
import {
  classAPI, classArmAPI, subjectAPI, sessionAPI, termAPI,
} from '../../services/schoolApi';

// ─── helpers ────────────────────────────────────────────────────────────────
const extractData = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

const TERM_LABELS = {
  FIRST_TERM:  'First Term',
  SECOND_TERM: 'Second Term',
  THIRD_TERM:  'Third Term',
};
const termLabel = (v) => TERM_LABELS[v] || v;

// ─── Tab config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'classes',    label: 'Classes',    icon: GraduationCap, color: '#2563eb' },
  { id: 'class-arms', label: 'Arms',       icon: Layers,        color: '#7c3aed' },
  { id: 'subjects',   label: 'Subjects',   icon: BookMarked,    color: '#0891b2' },
  { id: 'sessions',   label: 'Sessions',   icon: Calendar,      color: '#059669' },
  { id: 'terms',      label: 'Terms',      icon: Timer,         color: '#d97706' },
];

// ─── Confirm Dialog ──────────────────────────────────────────────────────────
const ConfirmDialog = ({ title, message, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
    <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.93, opacity: 0 }}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-rose-100 flex-shrink-0 flex items-center justify-center">
          <AlertCircle className="w-4.5 h-4.5 text-rose-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} disabled={loading}
          className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Delete
        </button>
      </div>
    </motion.div>
  </div>
);

// ─── Field primitives (light theme, blue focus ring) ─────────────────────────
const Field = ({ label, error, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
      {label}{required && <span className="text-blue-600 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-[11px] text-rose-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />{error}
      </p>
    )}
  </div>
);

const Input = ({ error, ...props }) => (
  <input {...props}
    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 outline-none transition-all text-slate-800 placeholder:text-slate-300
      focus:border-blue-500 focus:bg-white bg-slate-50
      ${error ? 'border-rose-400 bg-rose-50' : 'border-slate-200 hover:border-slate-300'}`}
  />
);

const Select = ({ error, children, ...props }) => (
  <div className="relative">
    <select {...props}
      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 outline-none appearance-none transition-all text-slate-800 bg-slate-50
        focus:border-blue-500 focus:bg-white
        ${error ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300'}`}>
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
  </div>
);

const Toggle = ({ checked, onChange, label, sub }) => (
  <label className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-colors border-2
    ${checked ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
    <div className="relative w-10 h-5 flex-shrink-0" onClick={onChange}>
      <div className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`} />
      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-700">{label}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  </label>
);

// ─── Slide-in Drawer ─────────────────────────────────────────────────────────
const Drawer = ({ title, subtitle, icon: Icon, accentColor, onClose, onSave, saveLabel, saving, children }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-end"
    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      className="h-full w-full max-w-md flex flex-col bg-white shadow-2xl"
      style={{ borderLeft: '1px solid #e2e8f0' }}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}15` }}>
            <Icon className="w-4.5 h-4.5" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {children}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
        <button onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-white transition-colors">
          Cancel
        </button>
        <button onClick={onSave} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          style={{ background: saving ? `${accentColor}80` : accentColor }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : (saveLabel || 'Save')}
        </button>
      </div>
    </motion.div>
  </div>
);

// ─── Empty state ─────────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, label, sub, onAdd, accentColor }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
      style={{ background: `${accentColor}12` }}>
      <Icon className="w-8 h-8" style={{ color: `${accentColor}60` }} />
    </div>
    <h3 className="text-sm font-bold text-slate-700 mb-1">{label}</h3>
    <p className="text-xs text-slate-400 mb-5">{sub}</p>
    <button onClick={onAdd}
      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors shadow-sm"
      style={{ background: accentColor }}>
      <Plus className="w-3.5 h-3.5" /> Add First
    </button>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const AcademicManagement = () => {
  const [activeTab,  setActiveTab]  = useState('classes');
  const [classes,    setClasses]    = useState([]);
  const [classArms,  setClassArms]  = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [terms,      setTerms]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Drawer state
  const [drawer,   setDrawer]   = useState(null); // 'create' | 'edit'
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState(null); // { type, id, name }
  const [deleting, setDeleting] = useState(false);

  // Inline errors
  const [errors, setErrors] = useState({});

  // Form state — one object per tab
  const [classForm,   setClassForm]   = useState({ name: '' });
  const [armForm,     setArmForm]     = useState({ name: '', classId: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '' });
  const [sessionForm, setSessionForm] = useState({ name: '', isCurrent: false });
  const [termForm,    setTermForm]    = useState({ name: '', sessionId: '', isCurrent: false });

  // Expanded class cards
  const [expandedClass, setExpandedClass] = useState(null);

  const tabCfg = TABS.find(t => t.id === activeTab) || TABS[0];

  // ── Fetchers ───────────────────────────────────────────────
  const fetchAll = useCallback(async (showRefresh = false) => {
    showRefresh ? setRefreshing(true) : setLoading(true);
    try {
      // Always fetch classes (arms are embedded inside classes)
      const [cr, sr, sesr, tr] = await Promise.allSettled([
        classAPI.getClasses(),
        subjectAPI.getSubjects(),
        sessionAPI.getSessions(),
        termAPI.getTerms(),
      ]);
      const cls  = cr.status  === 'fulfilled' ? extractData(cr.value)  : [];
      const subs = sr.status  === 'fulfilled' ? extractData(sr.value)  : [];
      const sess = sesr.status=== 'fulfilled' ? extractData(sesr.value): [];
      const trms = tr.status  === 'fulfilled' ? extractData(tr.value)  : [];

      setClasses(cls);
      setSubjects(subs);
      setSessions(sess);
      setTerms(trms);

      // Derive arms from classes
      const allArms = cls.flatMap(c =>
        (c.arms || []).map(a => ({ ...a, className: c.name, classId: c.id }))
      );
      setClassArms(allArms);

      if (showRefresh) toast.success('Data refreshed');
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Drawer helpers ─────────────────────────────────────────
  const openCreate = () => {
    setSelected(null);
    setErrors({});
    resetForm();
    setDrawer('create');
  };

  const openEdit = (item) => {
    setSelected(item);
    setErrors({});
    populateForm(item);
    setDrawer('edit');
  };

  const closeDrawer = () => { setDrawer(null); setSelected(null); setErrors({}); };

  const resetForm = () => {
    setClassForm({ name: '' });
    setArmForm({ name: '', classId: '' });
    setSubjectForm({ name: '' });
    setSessionForm({ name: '', isCurrent: false });
    setTermForm({ name: '', sessionId: '', isCurrent: false });
  };

  const populateForm = (item) => {
    switch (activeTab) {
      case 'classes':    setClassForm({ name: item.name || '' }); break;
      case 'class-arms': setArmForm({ name: item.name || '', classId: item.classId || '' }); break;
      case 'subjects':   setSubjectForm({ name: item.name || '' }); break;
      case 'sessions':   setSessionForm({ name: item.name || '', isCurrent: item.isCurrent || false }); break;
      case 'terms':      setTermForm({ name: item.name || '', sessionId: item.sessionId || '', isCurrent: item.isCurrent || false }); break;
    }
  };

  // ── Validate ───────────────────────────────────────────────
  const validate = () => {
    const e = {};
    switch (activeTab) {
      case 'classes':
        if (!classForm.name.trim()) e.name = 'Class name is required';
        break;
      case 'class-arms':
        if (!armForm.classId) e.classId = 'Select a class';
        if (!armForm.name.trim()) e.name = 'Arm name is required';
        break;
      case 'subjects':
        if (!subjectForm.name.trim()) e.name = 'Subject name is required';
        break;
      case 'sessions':
        if (!sessionForm.name.trim()) e.name = 'Session name is required';
        break;
      case 'terms':
        if (!termForm.sessionId) e.sessionId = 'Select a session';
        if (!termForm.name) e.name = 'Select a term';
        break;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (drawer === 'create') {
        switch (activeTab) {
          case 'classes':    await classAPI.createClass(classForm);           break;
          case 'class-arms': await classArmAPI.createClassArm(armForm);       break;
          case 'subjects':   await subjectAPI.createSubject(subjectForm);     break;
          case 'sessions':   await sessionAPI.createSession(sessionForm);     break;
          case 'terms':      await termAPI.createTerm(termForm);              break;
        }
        toast.success(`${tabCfg.label.replace(/s$/, '')} created`);
      } else {
        switch (activeTab) {
          case 'classes':    await classAPI.updateClass(selected.id, classForm);          break;
          case 'class-arms': await classArmAPI.updateClassArm(selected.id, armForm);      break;
          case 'subjects':   await subjectAPI.updateSubject(selected.id, subjectForm);    break;
          case 'sessions':   await sessionAPI.updateSession(selected.id, sessionForm);    break;
          case 'terms':      await termAPI.updateTerm(selected.id, termForm);             break;
        }
        toast.success(`${tabCfg.label.replace(/s$/, '')} updated`);
      }
      closeDrawer();
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const triggerDelete = (type, id, name) => setConfirm({ type, id, name });

  const handleDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      switch (confirm.type) {
        case 'classes':    await classAPI.deleteClass(confirm.id);          break;
        case 'class-arms': await classArmAPI.deleteClassArm(confirm.id);    break;
        case 'subjects':   await subjectAPI.deleteSubject(confirm.id);      break;
      }
      toast.success('Deleted successfully');
      setConfirm(null);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────
  const totalArms     = classArms.length;
  const currentSess   = sessions.find(s => s.isCurrent);
  const currentTerm   = terms.find(t => t.isCurrent);

  // ── Drawer form content per tab ────────────────────────────
  const renderDrawerForm = () => {
    switch (activeTab) {
      case 'classes':
        return (
          <Field label="Class Name" required error={errors.name}>
            <Input value={classForm.name} onChange={e => setClassForm({ name: e.target.value })}
              placeholder="e.g. JSS 1, Form 5, Grade 10" error={errors.name} autoFocus />
          </Field>
        );

      case 'class-arms':
        return (
          <>
            <Field label="Parent Class" required error={errors.classId}>
              <Select value={armForm.classId}
                onChange={e => setArmForm(p => ({ ...p, classId: e.target.value }))} error={errors.classId}>
                <option value="">Select class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Arm Name" required error={errors.name}>
              <Select value={armForm.name}
                onChange={e => setArmForm(p => ({ ...p, name: e.target.value }))} error={errors.name}>
                <option value="">Select arm…</option>
                {['A','B','C','D','E','F','G','H','I'].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Select>
            </Field>
          </>
        );

      case 'subjects':
        return (
          <Field label="Subject Name" required error={errors.name}>
            <Input value={subjectForm.name} onChange={e => setSubjectForm({ name: e.target.value })}
              placeholder="e.g. Mathematics, English Language" error={errors.name} autoFocus />
          </Field>
        );

      case 'sessions':
        return (
          <>
            <Field label="Session Name" required error={errors.name}>
              <Input value={sessionForm.name} onChange={e => setSessionForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. 2024/2025" error={errors.name} autoFocus />
            </Field>
            <Toggle
              checked={sessionForm.isCurrent}
              onChange={() => setSessionForm(p => ({ ...p, isCurrent: !p.isCurrent }))}
              label="Set as Current Session"
              sub="Marks this as the active academic session — deactivates any current one"
            />
          </>
        );

      case 'terms':
        return (
          <>
            <Field label="Session" required error={errors.sessionId}>
              <Select value={termForm.sessionId}
                onChange={e => setTermForm(p => ({ ...p, sessionId: e.target.value }))} error={errors.sessionId}>
                <option value="">Select session…</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Term" required error={errors.name}>
              <Select value={termForm.name}
                onChange={e => setTermForm(p => ({ ...p, name: e.target.value }))} error={errors.name}>
                <option value="">Select term…</option>
                <option value="FIRST_TERM">First Term</option>
                <option value="SECOND_TERM">Second Term</option>
                <option value="THIRD_TERM">Third Term</option>
              </Select>
            </Field>
            <Toggle
              checked={termForm.isCurrent}
              onChange={() => setTermForm(p => ({ ...p, isCurrent: !p.isCurrent }))}
              label="Set as Current Term"
              sub="Marks this as the active term for the selected session"
            />
          </>
        );

      default: return null;
    }
  };

  // ── Tab content ────────────────────────────────────────────
  const renderClasses = () => (
    <div className="space-y-3">
      {classes.length === 0
        ? <EmptyState icon={GraduationCap} label="No classes yet" sub="Create your school's class structure" onAdd={openCreate} accentColor="#2563eb" />
        : classes.map((cls, i) => (
          <motion.div key={cls.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Class header row */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800">{cls.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(cls.arms||[]).length} arm{(cls.arms||[]).length !== 1 ? 's' : ''}
                </p>
              </div>
              {/* Arms inline chips */}
              <div className="hidden sm:flex items-center gap-1.5 flex-wrap max-w-xs justify-end">
                {(cls.arms || []).map(arm => (
                  <span key={arm.id}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 group">
                    {arm.name}
                    <button onClick={() => triggerDelete('class-arms', arm.id, `${cls.name} ${arm.name}`)}
                      className="ml-0.5 text-indigo-300 hover:text-rose-500 transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(cls)} title="Edit"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => triggerDelete('classes', cls.id, cls.name)} title="Delete"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {(cls.arms||[]).length > 0 && (
                  <button onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all sm:hidden">
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedClass === cls.id ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>
            {/* Mobile: expanded arms */}
            <AnimatePresence>
              {expandedClass === cls.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden sm:hidden">
                  <div className="px-5 pb-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                    {(cls.arms||[]).map(arm => (
                      <span key={arm.id} className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {arm.name}
                        <button onClick={() => triggerDelete('class-arms', arm.id, `${cls.name} ${arm.name}`)}
                          className="ml-0.5 text-indigo-300 hover:text-rose-500 transition-colors">
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))
      }
    </div>
  );

  const renderArms = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {classArms.length === 0
        ? <div className="col-span-full"><EmptyState icon={Layers} label="No arms yet" sub="Add arms to your existing classes" onAdd={openCreate} accentColor="#7c3aed" /></div>
        : classArms.map((arm, i) => (
          <motion.div key={arm.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-700 font-black text-sm">{arm.name}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm">{arm.className} — {arm.name}</p>
              <p className="text-[11px] text-slate-400">Class Arm</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(arm)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                <Edit2 className="w-3 h-3" />
              </button>
              <button onClick={() => triggerDelete('class-arms', arm.id, `${arm.className} ${arm.name}`)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))
      }
    </div>
  );

  const renderSubjects = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {subjects.length === 0
        ? <div className="col-span-full"><EmptyState icon={BookMarked} label="No subjects yet" sub="Define the subjects taught at this school" onAdd={openCreate} accentColor="#0891b2" /></div>
        : subjects.map((sub, i) => (
          <motion.div key={sub.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
              <BookMarked className="w-4.5 h-4.5 text-cyan-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{sub.name}</p>
              <p className="text-[11px] text-slate-400">Subject</p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(sub)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                <Edit2 className="w-3 h-3" />
              </button>
              <button onClick={() => triggerDelete('subjects', sub.id, sub.name)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))
      }
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-3">
      {sessions.length === 0
        ? <EmptyState icon={Calendar} label="No sessions yet" sub="Create the academic year structure" onAdd={openCreate} accentColor="#059669" />
        : sessions.map((sess, i) => (
          <motion.div key={sess.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`bg-white rounded-2xl border shadow-sm p-5 ${sess.isCurrent ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${sess.isCurrent ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  <Calendar className={`w-4.5 h-4.5 ${sess.isCurrent ? 'text-emerald-600' : 'text-slate-500'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800">{sess.name}</p>
                    {sess.isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                        <Sparkles className="w-2.5 h-2.5" /> Current
                      </span>
                    )}
                  </div>
                  {/* Terms under this session */}
                  {(sess.terms || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {sess.terms.map(t => (
                        <span key={t.id} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {termLabel(t.name)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => openEdit(sess)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))
      }
    </div>
  );

  const renderTerms = () => (
    <div className="space-y-3">
      {terms.length === 0
        ? <EmptyState icon={Timer} label="No terms yet" sub="Add terms within your academic sessions" onAdd={openCreate} accentColor="#d97706" />
        : terms.map((term, i) => (
          <motion.div key={term.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`bg-white rounded-2xl border shadow-sm p-5 ${term.isCurrent ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${term.isCurrent ? 'bg-amber-100' : 'bg-slate-100'}`}>
                  <Timer className={`w-4.5 h-4.5 ${term.isCurrent ? 'text-amber-600' : 'text-slate-500'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800">{termLabel(term.name)}</p>
                    {term.isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide">
                        <Sparkles className="w-2.5 h-2.5" /> Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {term.session?.name ? `Session: ${term.session.name}` : 'No session linked'}
                  </p>
                </div>
              </div>
              <button onClick={() => openEdit(term)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))
      }
    </div>
  );

  const renderContent = () => {
    if (loading) return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-slate-400">Loading…</p>
      </div>
    );
    switch (activeTab) {
      case 'classes':    return renderClasses();
      case 'class-arms': return renderArms();
      case 'subjects':   return renderSubjects();
      case 'sessions':   return renderSessions();
      case 'terms':      return renderTerms();
      default:           return null;
    }
  };

  // Count per tab for badges
  const counts = {
    'classes':    classes.length,
    'class-arms': totalArms,
    'subjects':   subjects.length,
    'sessions':   sessions.length,
    'terms':      terms.length,
  };

  const drawerTitle = drawer === 'create'
    ? `New ${tabCfg.label.replace(/s$/, '')}`
    : `Edit ${tabCfg.label.replace(/s$/, '')}`;

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 55%, #312e81 100%)' }}>
        {/* Dot grid texture */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative px-6 py-8 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
                <BookOpen className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white/90 text-xs font-semibold">Academic Structure</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Academic Management</h1>
              <p className="text-blue-200 text-sm mt-1">Configure classes, subjects, sessions and terms</p>
            </div>

            {/* Hero stat pills */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'Classes',  value: classes.length,  color: 'text-white' },
                { label: 'Arms',     value: totalArms,        color: 'text-purple-300' },
                { label: 'Subjects', value: subjects.length,  color: 'text-cyan-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl px-4 py-3 text-center min-w-[68px]"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current session/term banner */}
        {(currentSess || currentTerm) && (
          <div className="border-t border-white/10 px-6 py-2.5 max-w-7xl mx-auto relative">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {currentSess && (
                <span className="flex items-center gap-1.5 text-white/80 text-xs">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span className="text-white/50">Active Session:</span>
                  <strong className="text-white">{currentSess.name}</strong>
                </span>
              )}
              {currentTerm && (
                <span className="flex items-center gap-1.5 text-white/80 text-xs">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="text-white/50">Active Term:</span>
                  <strong className="text-white">{termLabel(currentTerm.name)}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Tab Bar + Toolbar ─────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-0 overflow-x-auto">

            {/* Tabs */}
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count = counts[tab.id];
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-3.5 text-sm font-bold whitespace-nowrap transition-all relative flex-shrink-0"
                  style={{ color: isActive ? tab.color : '#94a3b8' }}>
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {count > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                      style={{ background: isActive ? `${tab.color}15` : '#f1f5f9', color: isActive ? tab.color : '#94a3b8' }}>
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: tab.color }} />
                  )}
                </button>
              );
            })}

            {/* Toolbar right */}
            <div className="ml-auto flex-shrink-0 flex items-center gap-2 pl-4 py-2">
              <button onClick={() => fetchAll(true)} disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing…' : 'Refresh'}
              </button>
              <motion.button onClick={openCreate}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white rounded-xl shadow-sm transition-colors"
                style={{ background: tabCfg.color }}>
                <Plus className="w-3.5 h-3.5" />
                New {tabCfg.label.replace(/s$/, '')}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-12">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Slide-in Drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {drawer && (
          <Drawer
            title={drawerTitle}
            subtitle={drawer === 'edit' && selected ? `Editing: ${selected.name || termLabel(selected.name)}` : undefined}
            icon={tabCfg.icon}
            accentColor={tabCfg.color}
            onClose={closeDrawer}
            onSave={handleSave}
            saveLabel={drawer === 'create' ? `Create ${tabCfg.label.replace(/s$/, '')}` : 'Save Changes'}
            saving={saving}
          >
            {renderDrawerForm()}
          </Drawer>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ────────────────────────────────────── */}
      <AnimatePresence>
        {confirm && (
          <ConfirmDialog
            title={`Delete ${confirm.name}?`}
            message="This action cannot be undone. All related data will be permanently removed."
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AcademicManagement;