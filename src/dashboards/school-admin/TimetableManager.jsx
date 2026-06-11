// pages/school/TimetableManager.jsx
// ─── Complete fix for backend validation errors ─────────────────────────────
// Backend expects: dayOfWeek (number 1-7), startTime (string), endTime (string)
// Fixed payload structure to match backend expectations

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Calendar, Clock, BookOpen, Plus, Edit2, Trash2, X,
  Save, RefreshCw, Loader2, AlertCircle, Grid, List,
  ChevronDown, Users, MapPin,
} from 'lucide-react';
import { timetableAPI, classAPI, subjectAPI, teacherAPI } from '../../services/schoolApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [res, res.data, res.data?.data, ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const c of candidates) { if (Array.isArray(c)) return c; }
  return [];
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = ['1st', '2nd', '3rd', '4th', '5th', '6th'];

// Time slot mapping with start and end times
const TIME_SLOTS = {
  '1st': { start: '08:00', end: '09:00', display: '08:00 – 09:00' },
  '2nd': { start: '09:00', end: '10:00', display: '09:00 – 10:00' },
  '3rd': { start: '10:00', end: '11:00', display: '10:00 – 11:00' },
  '4th': { start: '11:00', end: '12:00', display: '11:00 – 12:00' },
  '5th': { start: '12:00', end: '13:00', display: '12:00 – 13:00' },
  '6th': { start: '13:00', end: '14:00', display: '13:00 – 14:00' },
};

// Day mapping: Monday=1, Tuesday=2, etc.
const DAY_TO_NUMBER = {
  'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
  'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7
};

const NUMBER_TO_DAY = { 
  1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 
  4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' 
};

const DAY_COLORS = {
  Monday:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  Tuesday:   { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  Wednesday: { bg: '#fefce8', border: '#fde68a', text: '#a16207' },
  Thursday:  { bg: '#fdf4ff', border: '#e9d5ff', text: '#7e22ce' },
  Friday:    { bg: '#fff1f2', border: '#fecdd3', text: '#be123c' },
};

// ─── Field primitives ──────────────────────────────────────────────────────
const DLabel = ({ children, required }) => (
  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">
    {children}{required && <span className="text-blue-500 ml-0.5">*</span>}
  </label>
);

const DInput = ({ error, ...props }) => (
  <input {...props}
    className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none text-slate-800 placeholder:text-slate-400 transition-all bg-white border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300"
    style={error ? { borderColor: '#ef4444' } : {}}
  />
);

const DSelect = ({ error, children, ...props }) => (
  <div className="relative">
    <select {...props}
      className="w-full px-3.5 py-2.5 text-sm rounded-xl outline-none appearance-none transition-all bg-white border-2 border-slate-200 focus:border-blue-500 hover:border-slate-300 text-slate-800"
      style={error ? { borderColor: '#ef4444' } : {}}>
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
  </div>
);

const DError = ({ msg }) => msg
  ? <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />{msg}</p>
  : null;

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
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
          className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 transition-colors">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Delete
        </button>
      </div>
    </motion.div>
  </div>
);

// ─── Timetable Form Drawer ─────────────────────────────────────────────────────
const TimetableDrawer = ({ classes, onSave, onClose, saving }) => {
  const [form, setForm] = useState({ title: '', classId: '', term: '', session: '' });
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.classId) e.classId = 'Select a class';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onSave({
      title: form.title.trim(),
      classId: form.classId,
      term: form.term.trim() || undefined,
      session: form.session.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="h-full w-full max-w-md flex flex-col bg-white shadow-2xl border-l border-slate-200">

        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">New Timetable</h2>
              <p className="text-[11px] text-slate-400">Create a schedule for a class</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <DLabel required>Timetable Title</DLabel>
            <DInput value={form.title} onChange={set('title')} placeholder="e.g., 2024/2025 JSS 1 Timetable" error={errors.title} autoFocus />
            <DError msg={errors.title} />
          </div>
          <div>
            <DLabel required>Class</DLabel>
            <DSelect value={form.classId} onChange={set('classId')} error={errors.classId}>
              <option value="">Select a class…</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </DSelect>
            <DError msg={errors.classId} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <DLabel>Term</DLabel>
              <DSelect value={form.term} onChange={set('term')}>
                <option value="">Select term…</option>
                <option value="FIRST_TERM">First Term</option>
                <option value="SECOND_TERM">Second Term</option>
                <option value="THIRD_TERM">Third Term</option>
              </DSelect>
            </div>
            <div>
              <DLabel>Session</DLabel>
              <DInput value={form.session} onChange={set('session')} placeholder="e.g., 2024/2025" />
            </div>
          </div>
        </form>

        <div className="flex-shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all bg-blue-600 hover:bg-blue-700 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Creating…' : 'Create Timetable'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Entry Form Drawer - FIXED to send correct backend format ─────────────────
const EntryDrawer = ({ initial, subjects, teachers, onSave, onClose, saving, isEdit }) => {
  // Convert initial data to the correct format
  const getInitialForm = () => {
    if (initial?.dayOfWeek) {
      // Already in correct format
      return {
        dayOfWeek: initial.dayOfWeek,
        period: Object.keys(TIME_SLOTS).find(p => 
          TIME_SLOTS[p].start === initial.startTime && TIME_SLOTS[p].end === initial.endTime
        ) || '1st',
        startTime: initial.startTime || '08:00',
        endTime: initial.endTime || '09:00',
        subjectId: initial.subjectId || '',
        teacherId: initial.teacherId || '',
        room: initial.room || '',
      };
    }
    
    if (initial?.day && initial?.period) {
      // Convert from day/period format
      const slot = TIME_SLOTS[initial.period];
      return {
        dayOfWeek: DAY_TO_NUMBER[initial.day] || 1,
        period: initial.period,
        startTime: slot?.start || '08:00',
        endTime: slot?.end || '09:00',
        subjectId: initial.subjectId || '',
        teacherId: initial.teacherId || '',
        room: initial.room || '',
      };
    }
    
    // Default
    return {
      dayOfWeek: 1,
      period: '1st',
      startTime: '08:00',
      endTime: '09:00',
      subjectId: '',
      teacherId: '',
      room: '',
    };
  };

  const [form, setForm] = useState(getInitialForm());
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const handlePeriodChange = (e) => {
    const period = e.target.value;
    const slot = TIME_SLOTS[period];
    setForm(p => ({
      ...p,
      period: period,
      startTime: slot.start,
      endTime: slot.end,
    }));
  };

  const handleDayChange = (e) => {
    setForm(p => ({ ...p, dayOfWeek: parseInt(e.target.value) }));
  };

  const validate = () => {
    const e = {};
    if (!form.dayOfWeek) e.dayOfWeek = 'Select a day';
    if (!form.startTime) e.startTime = 'Start time required';
    if (!form.endTime) e.endTime = 'End time required';
    if (!form.subjectId) e.subjectId = 'Select a subject';
    if (!form.teacherId) e.teacherId = 'Select a teacher';
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      e.endTime = 'End time must be after start time';
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // ─── FIX: Send correct payload format for backend ───
    // Backend expects: dayOfWeek (number), startTime (string), endTime (string)
    onSave({
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      subjectId: form.subjectId,
      teacherId: form.teacherId,
      room: form.room.trim() || undefined,
    });
  };

  const selectedDayName = NUMBER_TO_DAY[form.dayOfWeek] || 'Monday';
  const currentSlot = TIME_SLOTS[form.period];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="h-full w-full max-w-md flex flex-col bg-white shadow-2xl border-l border-slate-200">

        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">{isEdit ? 'Edit Entry' : 'Add Entry'}</h2>
              <p className="text-[11px] text-slate-400">{isEdit ? 'Update this time slot' : 'Assign a subject to a slot'}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          
          {/* Day of Week - Number select (1=Monday) */}
          <div>
            <DLabel required>Day</DLabel>
            <DSelect value={form.dayOfWeek} onChange={handleDayChange} error={errors.dayOfWeek}>
              <option value="">Select day…</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
              <option value={7}>Sunday</option>
            </DSelect>
            <DError msg={errors.dayOfWeek} />
          </div>

          {/* Period selection (maps to start/end times) */}
          <div>
            <DLabel required>Period</DLabel>
            <DSelect value={form.period} onChange={handlePeriodChange}>
              {PERIODS.map(period => (
                <option key={period} value={period}>
                  {period} ({TIME_SLOTS[period].display})
                </option>
              ))}
            </DSelect>
          </div>

          {/* Time display */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
            <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-blue-700">
              {form.startTime} – {form.endTime}
            </span>
          </div>

          {/* Subject */}
          <div>
            <DLabel required>Subject</DLabel>
            <DSelect value={form.subjectId} onChange={set('subjectId')} error={errors.subjectId}>
              <option value="">Select subject…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </DSelect>
            <DError msg={errors.subjectId} />
          </div>

          {/* Teacher */}
          <div>
            <DLabel required>Teacher</DLabel>
            <DSelect value={form.teacherId} onChange={set('teacherId')} error={errors.teacherId}>
              <option value="">Select teacher…</option>
              {teachers.map(t => {
                const firstName = t.user?.firstName || t.firstName || '';
                const lastName = t.user?.lastName || t.lastName || '';
                return <option key={t.id} value={t.id}>{firstName} {lastName}</option>;
              })}
            </DSelect>
            <DError msg={errors.teacherId} />
          </div>

          {/* Room */}
          <div>
            <DLabel>Room (optional)</DLabel>
            <DInput value={form.room} onChange={set('room')} placeholder="e.g., Room 101, Science Lab" />
          </div>

          {/* Summary preview */}
          <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Summary</p>
            <p className="text-xs text-slate-600">
              <strong>{selectedDayName}</strong> · {form.startTime} – {form.endTime}
            </p>
            {form.subjectId && (
              <p className="text-xs text-slate-500 mt-1">
                Subject: {subjects.find(s => s.id === form.subjectId)?.name || '—'}
              </p>
            )}
          </div>
        </form>

        <div className="flex-shrink-0 flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : isEdit ? 'Update Entry' : 'Add Entry'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const TimetableManager = () => {
  const [timetables, setTimetables] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedTT, setSelectedTT] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const [view, setView] = useState('grid');

  const [panel, setPanel] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Initial fetch ──────────────────────────────────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [ttRes, clRes, subRes, tchRes] = await Promise.allSettled([
        timetableAPI.getTimetables(),
        classAPI.getClasses(),
        subjectAPI.getSubjects(),
        teacherAPI.getTeachers(),
      ]);
      setTimetables(toArray(ttRes.status === 'fulfilled' ? ttRes.value : null, 'timetables'));
      setClasses(toArray(clRes.status === 'fulfilled' ? clRes.value : null, 'classes'));
      setSubjects(toArray(subRes.status === 'fulfilled' ? subRes.value : null, 'subjects'));
      setTeachers(toArray(tchRes.status === 'fulfilled' ? tchRes.value : null, 'teachers', 'items'));
      if (isRefresh) toast.success('Refreshed');
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Load entries for selected timetable ────────────────────
  const loadEntries = useCallback(async (ttId) => {
    setLoadingEntries(true);
    try {
      const res = await timetableAPI.getTimetable(ttId);
      const data = res?.data?.data ?? res?.data ?? res;
      // Convert backend format to frontend format if needed
      const loadedEntries = Array.isArray(data?.entries) ? data.entries : [];
      // Map backend entries to include period for display
      const mappedEntries = loadedEntries.map(entry => {
        // Find which period matches the start/end times
        let period = '1st';
        for (const [p, slot] of Object.entries(TIME_SLOTS)) {
          if (slot.start === entry.startTime && slot.end === entry.endTime) {
            period = p;
            break;
          }
        }
        return {
          ...entry,
          period: period,
          day: NUMBER_TO_DAY[entry.dayOfWeek] || 'Monday',
        };
      });
      setEntries(mappedEntries);
    } catch {
      toast.error('Failed to load entries');
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  const selectTimetable = (tt) => {
    setSelectedTT(tt);
    if (tt) loadEntries(tt.id);
    else setEntries([]);
  };

  // ── Name helpers ──────────────────────────────────────────
  const subjectName = (id) => subjects.find(s => s.id === id)?.name || '—';
  const teacherName = (id) => {
    const t = teachers.find(t => t.id === id);
    if (!t) return '—';
    const fn = t.user?.firstName || t.firstName || '';
    const ln = t.user?.lastName || t.lastName || '';
    return `${fn} ${ln}`.trim() || '—';
  };
  const className = (id) => classes.find(c => c.id === id)?.name || '—';

  // ── Create timetable ───────────────────────────────────────
  const handleCreateTimetable = async (payload) => {
    setSaving(true);
    try {
      const res = await timetableAPI.createTimetable(payload);
      toast.success('Timetable created');
      setPanel(null);
      await fetchAll();
      const newTT = res?.data?.data ?? res?.data ?? res;
      if (newTT?.id) selectTimetable(newTT);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  // ── Create / update entry ──────────────────────────────────
  const handleSaveEntry = async (payload) => {
    if (!selectedTT) return;
    setSaving(true);
    try {
      if (editEntry) {
        await timetableAPI.updateTimetableEntry(editEntry.id, payload);
        toast.success('Entry updated');
      } else {
        await timetableAPI.addTimetableEntry(selectedTT.id, payload);
        toast.success('Entry added');
      }
      setPanel(null);
      setEditEntry(null);
      setPrefill(null);
      loadEntries(selectedTT.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.errors?.[0]?.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.type === 'timetable') {
        await timetableAPI.deleteTimetable(confirm.id);
        toast.success('Timetable deleted');
        if (selectedTT?.id === confirm.id) selectTimetable(null);
        fetchAll();
      } else {
        await timetableAPI.deleteTimetableEntry(confirm.id);
        toast.success('Entry removed');
        loadEntries(selectedTT.id);
      }
      setConfirm(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // ── Open entry drawer ─────────────────────────────────────
  const openAddEntry = (day, period) => {
    setEditEntry(null);
    setPrefill({
      day: day,
      period: period,
    });
    setPanel('entry');
  };

  const openEditEntry = (entry) => {
    setEditEntry(entry);
    setPrefill({
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      subjectId: entry.subjectId || entry.subject?.id || '',
      teacherId: entry.teacherId || entry.teacher?.id || '',
      room: entry.room || '',
    });
    setPanel('entry');
  };

  // ── Build grid lookup ──────────────────────────────────────
  const gridLookup = () => {
    const map = {};
    DAYS.forEach(d => { map[d] = {}; });
    entries.forEach(e => {
      if (map[e.day]) {
        map[e.day][e.period] = e;
      }
    });
    return map;
  };

  // ── Renders ────────────────────────────────────────────────
  const renderGrid = () => {
    const lookup = gridLookup();
    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 w-32">
                Period / Time
              </th>
              {DAYS.map(d => (
                <th key={d} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
                  style={{ color: DAY_COLORS[d].text }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PERIODS.map((period, idx) => {
              const slot = TIME_SLOTS[period];
              return (
                <tr key={period} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 bg-slate-50/50 border-r border-slate-100">
                    <p className="text-xs font-bold text-slate-700">{period} Period</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{slot.display}</p>
                  </td>
                  {DAYS.map(day => {
                    const entry = lookup[day]?.[period];
                    const dc = DAY_COLORS[day];
                    return (
                      <td key={`${day}-${period}`} className="px-3 py-2 align-top border-r border-slate-100 last:border-r-0">
                        {entry ? (
                          <div className="rounded-xl p-2.5 group relative"
                            style={{ background: dc.bg, border: `1px solid ${dc.border}` }}>
                            <p className="text-xs font-bold truncate" style={{ color: dc.text }}>
                              {subjectName(entry.subjectId || entry.subject?.id)}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {teacherName(entry.teacherId || entry.teacher?.id)}
                            </p>
                            {entry.room && (
                              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />{entry.room}
                              </p>
                            )}
                            <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditEntry(entry)}
                                className="w-5 h-5 rounded flex items-center justify-center bg-white/80 text-slate-500 hover:text-blue-600 transition-colors shadow-sm">
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button onClick={() => setConfirm({ type: 'entry', id: entry.id, label: `${day} ${period}` })}
                                className="w-5 h-5 rounded flex items-center justify-center bg-white/80 text-slate-500 hover:text-rose-600 transition-colors shadow-sm">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => openAddEntry(day, period)}
                            className="w-full h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 hover:border-blue-300 hover:text-blue-400 hover:bg-blue-50/50 transition-all">
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderList = () => {
    const sorted = [...entries].sort((a, b) => {
      const dayCompare = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      if (dayCompare !== 0) return dayCompare;
      return PERIODS.indexOf(a.period) - PERIODS.indexOf(b.period);
    });
    
    return (
      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No entries yet</p>
          </div>
        )}
        {sorted.map((entry, i) => {
          const dc = DAY_COLORS[entry.day] || DAY_COLORS.Monday;
          const slot = TIME_SLOTS[entry.period];
          return (
            <motion.div key={entry.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-2 h-12 rounded-full flex-shrink-0" style={{ background: dc.border }} />
              <div className="flex-1 grid grid-cols-5 gap-3 text-sm">
                <div>
                  <p className="font-bold text-xs" style={{ color: dc.text }}>{entry.day}</p>
                  <p className="text-[11px] text-slate-400">{entry.period} period</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">{slot?.display || `${entry.startTime}–${entry.endTime}`}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 truncate">
                    {subjectName(entry.subjectId || entry.subject?.id)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 truncate flex items-center gap-1">
                    <Users className="w-3 h-3 flex-shrink-0 text-slate-400" />
                    {teacherName(entry.teacherId || entry.teacher?.id)}
                  </p>
                </div>
                <div>
                  {entry.room
                    ? <p className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />{entry.room}</p>
                    : <span className="text-slate-300">—</span>}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditEntry(entry)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setConfirm({ type: 'entry', id: entry.id, label: `${entry.day} ${entry.period}` })}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f6fa] gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      <p className="text-sm font-medium text-slate-400">Loading timetables…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* Hero */}
      <div className="relative overflow-hidden px-6 py-8 mb-6"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 55%, #312e81 100%)' }}>
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="relative max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-3 py-1 mb-3">
              <Calendar className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/90 text-xs font-semibold">Schedule Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Timetable Manager</h1>
            <p className="text-blue-200 text-sm mt-1">Build and manage class schedules</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Timetables', value: timetables.length, color: 'text-white' },
              { label: 'Entries', value: entries.length, color: 'text-blue-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl px-4 py-3 text-center min-w-[80px]"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5 pb-12">

        {/* Selector toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">

            <div className="relative w-72">
              <DSelect
                value={selectedTT?.id || ''}
                onChange={e => {
                  const tt = timetables.find(t => t.id === e.target.value);
                  selectTimetable(tt || null);
                }}>
                <option value="">— Select a timetable —</option>
                {timetables.map(t => (
                  <option key={t.id} value={t.id}>{t.title || t.name}</option>
                ))}
              </DSelect>
            </div>

            {selectedTT && (
              <button
                onClick={() => setConfirm({ type: 'timetable', id: selectedTT.id, label: selectedTT.title || selectedTT.name })}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              {selectedTT && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  <button onClick={() => setView('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setView('list')}
                    className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button onClick={() => fetchAll(true)} disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing…' : 'Refresh'}
              </button>

              {selectedTT && (
                <button onClick={() => { setEditEntry(null); setPrefill(null); setPanel('entry'); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors">
                  <Plus className="w-4 h-4" /> Add Entry
                </button>
              )}

              <motion.button onClick={() => setPanel('create')}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 transition-colors">
                <Plus className="w-4 h-4" /> New Timetable
              </motion.button>
            </div>
          </div>

          {selectedTT && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-sm font-bold text-slate-800">{selectedTT.title || selectedTT.name}</span>
              </div>
              <span className="text-xs text-slate-400">Class: <strong className="text-slate-600">{className(selectedTT.classId)}</strong></span>
              {selectedTT.term && <span className="text-xs text-slate-400">Term: <strong className="text-slate-600">{selectedTT.term}</strong></span>}
              {selectedTT.session && <span className="text-xs text-slate-400">Session: <strong className="text-slate-600">{selectedTT.session}</strong></span>}
              <span className="text-xs text-slate-400 ml-auto">{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}</span>
            </div>
          )}
        </div>

        {/* Content */}
        {!selectedTT ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
              <Calendar className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">No timetable selected</h3>
            <p className="text-sm text-slate-400 mb-6">Select one from the dropdown or create a new timetable.</p>
            <motion.button onClick={() => setPanel('create')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Create First Timetable
            </motion.button>
          </div>
        ) : loadingEntries ? (
          <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
          </div>
        ) : view === 'grid' ? renderGrid() : renderList()}
      </div>

      {/* Drawers */}
      <AnimatePresence>
        {panel === 'create' && (
          <TimetableDrawer classes={classes} onSave={handleCreateTimetable} onClose={() => setPanel(null)} saving={saving} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === 'entry' && (
          <EntryDrawer
            initial={prefill}
            isEdit={!!editEntry}
            subjects={subjects}
            teachers={teachers}
            onSave={handleSaveEntry}
            onClose={() => { setPanel(null); setEditEntry(null); setPrefill(null); }}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Confirm delete */}
      <AnimatePresence>
        {confirm && (
          <ConfirmDialog
            title={`Delete ${confirm.type === 'timetable' ? 'Timetable' : 'Entry'}?`}
            message={
              confirm.type === 'timetable'
                ? `"${confirm.label}" and all its entries will be permanently removed.`
                : `The entry for ${confirm.label} will be removed from this timetable.`
            }
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimetableManager;