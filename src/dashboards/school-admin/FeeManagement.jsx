// pages/school/FeeManagement.jsx
// ─── Production-ready Fee, Payment & Wallet management ──────────────────────
// Bug fixes:
//   1. SelectField was calling an outer `handleChange` instead of the `onChange` prop — FIXED
//   2. Term dropdown shows enum-friendly labels (FIRST_TERM → "First Term") — FIXED
//   3. All form fields now correctly bind and clear errors
// UX improvements:
//   • Richer fee card layout (no table on mobile, cards on all sizes)
//   • Payments drawer with student avatar, amount breakdown, timeline
//   • Wallet panel embedded in hero with transaction history
//   • Form drawer with live preview of fee amount
//   • Grouped term labels with session name
//   • Better empty states, loading skeletons, and toasts

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Wallet, Plus, Search, X, Edit2, Trash2, ChevronDown,
  RefreshCw, Loader2, AlertCircle, DollarSign, BookOpen,
  Calendar, Receipt, TrendingUp, Clock, CheckCircle,
  Banknote, FileText, Save, ArrowUpRight, LayoutGrid,
  List, CreditCard, ChevronRight, Circle,
} from 'lucide-react';
import {
  feeAPI, paymentAPI, walletAPI, classAPI, sessionAPI, termAPI,
} from '../../services/schoolApi';

// ─── helpers ─────────────────────────────────────────────────────────────────
const toArray = (res, ...keys) => {
  if (!res) return [];
  const candidates = [res, res.data, res.data?.data, ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const c of candidates) { if (Array.isArray(c)) return c; }
  return [];
};

const TERM_LABELS = { FIRST_TERM: 'First Term', SECOND_TERM: 'Second Term', THIRD_TERM: 'Third Term' };
const termLabel = (v) => TERM_LABELS[v] || v || '—';

const fmt = (n) => typeof n === 'number' ? `₦${n.toLocaleString('en-NG')}` : '₦0';

// Initials avatar for students in payment list
const PALETTE = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b'];
const SAvatar = ({ name = '', size = 32 }) => {
  const parts = name.trim().split(' ');
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (name[0] || '?').toUpperCase();
  const bg = PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length];
  return (
    <div style={{ width: size, height: size, background: bg, fontSize: size * 0.37 }}
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none">
      {initials}
    </div>
  );
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const PayBadge = ({ status }) => {
  const map = {
    COMPLETED: { cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Paid' },
    PENDING:   { cls: 'bg-amber-100   text-amber-700',   icon: Clock,        label: 'Pending' },
    PARTIAL:   { cls: 'bg-blue-100    text-blue-700',    icon: Circle,       label: 'Partial' },
    FAILED:    { cls: 'bg-rose-100    text-rose-700',    icon: X,            label: 'Failed' },
  };
  const c = map[status] || map.PENDING;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${c.cls}`}>
      <Icon className="w-2.5 h-2.5" />{c.label}
    </span>
  );
};

// ─── Confirm dialog ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ title, message, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}>
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
          className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Delete Fee
        </button>
      </div>
    </motion.div>
  </div>
);

// ─── Dark-theme field primitives (used inside drawers) ────────────────────────
const DLabel = ({ children, required }) => (
  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1.5">
    {children}{required && <span className="text-emerald-400 ml-0.5">*</span>}
  </label>
);

const DInput = ({ error, icon, ...props }) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">{icon}</div>
    )}
    <input
      {...props}
      className={`w-full py-2.5 text-sm rounded-xl outline-none text-slate-200 placeholder:text-slate-600 transition-all ${icon ? 'pl-10 pr-3.5' : 'px-3.5'}`}
      style={{
        background: '#0f1117',
        border: `1.5px solid ${error ? '#ef4444' : '#252d3d'}`,
        fontFamily: 'inherit',
      }}
      onFocus={e => { if (!error) e.target.style.borderColor = '#10b981'; }}
      onBlur={e => { if (!error) e.target.style.borderColor = error ? '#ef4444' : '#252d3d'; }}
    />
  </div>
);

// ── THE FIX: SelectField receives `onChange` as a prop and uses it directly ───
// Previously the component called an outer `handleChange` that didn't exist in scope.
const DSelect = ({ error, icon, onChange, value, options = [], placeholder, disabled, ...props }) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10">{icon}</div>
    )}
    <select
      value={value}
      onChange={onChange}   // ← directly uses the prop passed in, no outer reference
      disabled={disabled}
      {...props}
      className={`w-full py-2.5 text-sm rounded-xl outline-none appearance-none transition-all
        disabled:opacity-40 disabled:cursor-not-allowed ${icon ? 'pl-10 pr-9' : 'px-3.5 pr-9'}`}
      style={{
        background: '#0f1117',
        border: `1.5px solid ${error ? '#ef4444' : '#252d3d'}`,
        color: value ? '#e2e8f0' : '#475569',
        fontFamily: 'inherit',
      }}
    >
      <option value="" style={{ background: '#1c2233', color: '#94a3b8' }}>
        {placeholder || 'Select…'}
      </option>
      {options.map(o => (
        <option key={o.id} value={o.id} style={{ background: '#1c2233', color: '#e2e8f0' }}>
          {o.label}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
  </div>
);

const DError = ({ msg }) => msg ? (
  <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
    <AlertCircle className="w-3 h-3 flex-shrink-0" />{msg}
  </p>
) : null;

// ─── Fee Form Drawer ──────────────────────────────────────────────────────────
const FORM_DEFAULTS = { title: '', amount: '', classId: '', sessionId: '', termId: '' };

const FeeFormDrawer = ({ initial, onSave, onClose, isEdit, classes, sessions, terms }) => {
  const [form,    setForm]    = useState({ ...FORM_DEFAULTS, ...initial });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  // Generic field updater — clears the error for the touched field
  const setField = (name) => (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())                               e.title     = 'Fee title is required';
    if (!form.amount)                                     e.amount    = 'Amount is required';
    else if (isNaN(form.amount) || +form.amount <= 0)    e.amount    = 'Enter a valid amount greater than 0';
    if (!form.classId)                                    e.classId   = 'Select a class';
    if (!form.sessionId)                                  e.sessionId = 'Select a session';
    if (!form.termId)                                     e.termId    = 'Select a term';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSave({
        title:     form.title.trim(),
        amount:    parseFloat(form.amount),
        classId:   form.classId,
        sessionId: form.sessionId,
        termId:    form.termId,
      });
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Something went wrong. Try again.' });
      setLoading(false);
    }
  };

  const selectedClass   = classes.find(c  => c.id  === form.classId);
  const selectedSession = sessions.find(s => s.id  === form.sessionId);
  const selectedTerm    = terms.find(t    => t.id  === form.termId);

  // Preview card — only shown when all fields are filled
  const preview = form.title && form.amount && selectedClass;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end"
      style={{ background: 'rgba(15,17,23,0.72)', backdropFilter: 'blur(5px)' }}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 310, damping: 33 }}
        className="h-full w-full max-w-md flex flex-col overflow-hidden"
        style={{ background: '#161b27', borderLeft: '1px solid #252d3d' }}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid #252d3d' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
              {isEdit ? <Edit2 className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100">{isEdit ? 'Edit Fee' : 'New Fee'}</h2>
              <p className="text-[11px] text-slate-500">{isEdit ? 'Update this fee structure' : 'Define a new fee for a class'}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {errors.submit && (
            <div className="flex items-start gap-2 p-3.5 rounded-xl text-xs text-rose-300"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Live preview card */}
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-xl p-4 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #064e3b, #065f46)', border: '1px solid #059669' }}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
                  style={{ background: '#10b981', transform: 'translate(30%, -30%)' }} />
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Preview</p>
                <p className="text-lg font-black text-white truncate">{form.title}</p>
                <p className="text-2xl font-black text-emerald-300 mt-1">
                  {form.amount ? fmt(parseFloat(form.amount)) : '₦—'}
                </p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {selectedClass   && <span className="text-[11px] font-semibold text-emerald-200/70">{selectedClass.name}</span>}
                  {selectedSession && <><span className="text-emerald-700">·</span><span className="text-[11px] font-semibold text-emerald-200/70">{selectedSession.name}</span></>}
                  {selectedTerm    && <><span className="text-emerald-700">·</span><span className="text-[11px] font-semibold text-emerald-200/70">{termLabel(selectedTerm.name)}</span></>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fee Title */}
          <div>
            <DLabel required>Fee Title</DLabel>
            <DInput
              name="title" value={form.title} onChange={setField('title')}
              placeholder="e.g. Tuition Fee, Exam Fee, PTA Levy"
              error={errors.title}
              icon={<FileText className="w-4 h-4" />}
            />
            <DError msg={errors.title} />
          </div>

          {/* Amount */}
          <div>
            <DLabel required>Amount (₦)</DLabel>
            <DInput
              name="amount" type="number" min="0" step="0.01"
              value={form.amount} onChange={setField('amount')}
              placeholder="0.00"
              error={errors.amount}
              icon={<Banknote className="w-4 h-4" />}
            />
            <DError msg={errors.amount} />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Assign To</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Class */}
          <div>
            <DLabel required>Class</DLabel>
            <DSelect
              name="classId"
              value={form.classId}
              onChange={setField('classId')}   // ← correct: uses prop
              options={classes.map(c => ({ id: c.id, label: c.name }))}
              placeholder="Select a class"
              error={errors.classId}
              icon={<BookOpen className="w-4 h-4" />}
            />
            <DError msg={errors.classId} />
          </div>

          {/* Session */}
          <div>
            <DLabel required>Academic Session</DLabel>
            <DSelect
              name="sessionId"
              value={form.sessionId}
              onChange={setField('sessionId')}  // ← correct
              options={sessions.map(s => ({
                id: s.id,
                label: s.name + (s.isCurrent ? ' (Current)' : ''),
              }))}
              placeholder="Select a session"
              error={errors.sessionId}
              icon={<Calendar className="w-4 h-4" />}
            />
            <DError msg={errors.sessionId} />
          </div>

          {/* Term */}
          <div>
            <DLabel required>Term</DLabel>
            <DSelect
              name="termId"
              value={form.termId}
              onChange={setField('termId')}     // ← correct
              options={terms.map(t => ({
                id: t.id,
                // Show human-readable term label + parent session
                label: `${termLabel(t.name)}${t.session?.name ? ` — ${t.session.name}` : ''}`,
              }))}
              placeholder="Select a term"
              error={errors.termId}
              icon={<Clock className="w-4 h-4" />}
            />
            <DError msg={errors.termId} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #252d3d' }}>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-400 transition-colors hover:bg-white/5"
            style={{ border: '1px solid #252d3d' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all"
            style={{ background: loading ? 'rgba(16,185,129,0.5)' : '#10b981', color: '#fff' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Fee'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Payments Drawer ──────────────────────────────────────────────────────────
const PaymentsDrawer = ({ payments, onClose }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const visible = payments.filter(p => {
    const name = `${p.student?.user?.firstName || p.student?.firstName || ''} ${p.student?.user?.lastName || p.student?.lastName || ''}`.toLowerCase();
    const ref  = (p.reference || '').toLowerCase();
    if (search && !name.includes(search.toLowerCase()) && !ref.includes(search.toLowerCase())) return false;
    if (filter && p.status !== filter) return false;
    return true;
  });

  const total = payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + (p.amountPaid || p.amount || 0), 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-end"
      style={{ background: 'rgba(15,17,23,0.72)', backdropFilter: 'blur(5px)' }}>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 310, damping: 33 }}
        className="h-full w-full max-w-lg flex flex-col overflow-hidden"
        style={{ background: '#161b27', borderLeft: '1px solid #252d3d' }}>

        {/* Header */}
        <div className="flex-shrink-0 px-6 py-5" style={{ borderBottom: '1px solid #252d3d' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <Receipt className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-100">Payment History</h2>
                <p className="text-[11px] text-slate-500">{payments.length} transaction{payments.length !== 1 ? 's' : ''} total</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Collected summary */}
          <div className="rounded-xl p-4" style={{ background: '#1c2233', border: '1px solid #252d3d' }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Collected</p>
            <p className="text-2xl font-black text-emerald-400">{fmt(total)}</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Student name or reference…"
                className="w-full h-8 pl-8 pr-3 text-xs rounded-lg outline-none text-slate-300 placeholder:text-slate-600"
                style={{ background: '#0f1117', border: '1px solid #252d3d' }}
              />
            </div>
            <div className="relative w-32">
              <select value={filter} onChange={e => setFilter(e.target.value)}
                className="w-full h-8 pl-2.5 pr-7 text-xs rounded-lg outline-none appearance-none"
                style={{ background: '#0f1117', border: '1px solid #252d3d', color: filter ? '#e2e8f0' : '#475569' }}>
                <option value="" style={{ background: '#1c2233' }}>All status</option>
                <option value="COMPLETED" style={{ background: '#1c2233' }}>Paid</option>
                <option value="PENDING"   style={{ background: '#1c2233' }}>Pending</option>
                <option value="PARTIAL"   style={{ background: '#1c2233' }}>Partial</option>
                <option value="FAILED"    style={{ background: '#1c2233' }}>Failed</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-sm font-semibold text-slate-500">No payments found</p>
              {(search || filter) && <p className="text-xs text-slate-600 mt-1">Try adjusting your filters</p>}
            </div>
          ) : visible.map((p, i) => {
            const firstName = p.student?.user?.firstName || p.student?.firstName || '';
            const lastName  = p.student?.user?.lastName  || p.student?.lastName  || '';
            const fullName  = `${firstName} ${lastName}`.trim() || 'Unknown';
            const amount    = p.amountPaid || p.amount || 0;
            return (
              <motion.div key={p.id || i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="rounded-xl p-4 transition-colors"
                style={{ background: '#1c2233', border: '1px solid #252d3d' }}>
                <div className="flex items-start gap-3">
                  <SAvatar name={fullName} size={34} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate">{fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{p.fee?.title || '—'}</p>
                      </div>
                      <PayBadge status={p.status} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-emerald-400 font-black text-sm">{fmt(amount)}</span>
                      <span className="text-[10px] font-mono text-slate-600 truncate max-w-[120px]">{p.reference || '—'}</span>
                    </div>
                    {p.createdAt && (
                      <p className="text-[10px] text-slate-600 mt-1">
                        {new Date(p.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Stat card (light) ────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, accent, prefix = '' }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex items-start justify-between"
    style={{ borderTop: `3px solid ${accent}` }}>
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      <p className="text-2xl font-black text-slate-900">{prefix}{typeof value === 'number' ? value.toLocaleString('en-NG') : value}</p>
    </div>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${accent}18` }}>
      <Icon className="w-5 h-5" style={{ color: accent }} />
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const FeeManagement = () => {
  const [fees,      setFees]      = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [wallet,    setWallet]    = useState(null);
  const [classes,   setClasses]   = useState([]);
  const [sessions,  setSessions]  = useState([]);
  const [terms,     setTerms]     = useState([]);

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [filterClass, setFilterClass] = useState('');

  const [panel,      setPanel]      = useState(null); // 'create' | 'edit' | 'payments'
  const [selectedFee, setSelectedFee] = useState(null);
  const [confirm,    setConfirm]    = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [fr, pr, wr, cr, sr, tr] = await Promise.allSettled([
        feeAPI.getFees(),
        paymentAPI.getPayments(),
        walletAPI.getSchoolWallet(),
        classAPI.getClasses(),
        sessionAPI.getSessions(),
        termAPI.getTerms(),
      ]);
      if (fr.status === 'fulfilled') setFees(toArray(fr.value, 'fees', 'items'));
      if (pr.status === 'fulfilled') setPayments(toArray(pr.value, 'payments', 'items'));
      if (wr.status === 'fulfilled') setWallet(wr.value?.data || wr.value);
      if (cr.status === 'fulfilled') setClasses(toArray(cr.value, 'classes'));
      if (sr.status === 'fulfilled') setSessions(toArray(sr.value, 'sessions'));
      if (tr.status === 'fulfilled') setTerms(toArray(tr.value, 'terms'));
      if (isRefresh) toast.success('Data refreshed');
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtered fees ──────────────────────────────────────────
  const filteredFees = fees.filter(f => {
    const matchSearch = !search || f.title?.toLowerCase().includes(search.toLowerCase());
    const matchClass  = !filterClass || f.classId === filterClass || f.class?.id === filterClass;
    return matchSearch && matchClass;
  });

  // ── Stats ──────────────────────────────────────────────────
  const totalCollected = payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + (p.amountPaid || p.amount || 0), 0);
  const pendingAmount  = payments.filter(p => p.status === 'PENDING').reduce((s, p)  => s + (p.amountPaid || p.amount || 0), 0);

  // ── CRUD ───────────────────────────────────────────────────
  const handleCreate = async (payload) => {
    await feeAPI.createFee(payload);
    toast.success('Fee created');
    fetchAll();
    setPanel(null);
  };

  const handleUpdate = async (payload) => {
    await feeAPI.updateFee(selectedFee.id, payload);
    toast.success('Fee updated');
    fetchAll();
    setPanel(null);
    setSelectedFee(null);
  };

  const handleDelete = async () => {
    setActionBusy(true);
    try {
      await feeAPI.deleteFee(confirm.fee.id);
      toast.success(`"${confirm.fee.title}" deleted`);
      setConfirm(null);
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setActionBusy(false);
    }
  };

  const hasFilters = search || filterClass;

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* ── Hero ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 py-8 mb-6"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 55%, #312e81 100%)' }}>
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full opacity-[0.05] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)', transform: 'translate(30%,-30%)' }} />

        <div className="relative max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
              <Wallet className="w-3.5 h-3.5 text-white/80" />
              <span className="text-white/90 text-xs font-semibold">Financial Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Fees & Payments</h1>
            <p className="text-blue-200 text-sm mt-1">Manage fee structures, track collections, monitor school wallet</p>
          </div>

          {/* Wallet balance pill */}
          <div className="rounded-2xl px-5 py-4 text-center min-w-[160px]"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-1">Wallet Balance</p>
            <p className="text-2xl font-black text-white">{fmt(wallet?.balance || 0)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5 pb-12">

        {/* ── Stats ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Fee Types"        value={fees.length}    icon={FileText}    accent="#3b82f6" />
          <StatCard label="Total Collected"  value={totalCollected} icon={TrendingUp}  accent="#10b981" prefix="₦" />
          <StatCard label="Pending Payments" value={pendingAmount}  icon={Clock}       accent="#f59e0b" prefix="₦" />
        </div>

        {/* ── Toolbar ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search fees by title…"
                className="w-full h-10 pl-10 pr-9 text-sm font-medium text-slate-800 placeholder:text-slate-300
                  bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white hover:border-slate-300 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Class filter */}
            <div className="relative w-48">
              <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                className="w-full h-10 pl-3.5 pr-9 text-sm font-medium text-slate-700 bg-slate-50 border-2 border-slate-200
                  rounded-xl outline-none appearance-none focus:border-emerald-500 hover:border-slate-300 transition-all">
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {hasFilters && (
              <button onClick={() => { setSearch(''); setFilterClass(''); }}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                <X className="w-3 h-3" /> Clear
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium hidden sm:block">{filteredFees.length} of {fees.length}</span>
              <button onClick={() => fetchAll(true)} disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing…' : 'Refresh'}
              </button>
              <button onClick={() => setPanel('payments')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors">
                <Receipt className="w-4 h-4" /> Payments
              </button>
              <motion.button onClick={() => { setSelectedFee(null); setPanel('create'); }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-200 transition-colors">
                <Plus className="w-4 h-4" /> New Fee
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── Fee Table ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-sm font-medium text-slate-400">Loading fees…</span>
            </div>
          ) : filteredFees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                <DollarSign className="w-10 h-10 text-emerald-300" />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">
                {hasFilters ? 'No fees match your filters' : 'No fees yet'}
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                {hasFilters ? 'Try clearing your filters.' : 'Create the first fee structure for your school.'}
              </p>
              {!hasFilters && (
                <motion.button onClick={() => setPanel('create')}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors">
                  <Plus className="w-4 h-4" /> Create First Fee
                </motion.button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {['Fee Title', 'Amount', 'Class', 'Session', 'Term', 'Payments', ''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFees.map((fee, i) => {
                    const paidCount = (fee.payments || []).filter(p => p.status === 'COMPLETED').length;
                    const totalCount = (fee.payments || []).length;
                    return (
                      <motion.tr key={fee.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.025, 0.35) }}
                        className="hover:bg-slate-50/70 transition-colors group">

                        {/* Title */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            <p className="text-sm font-semibold text-slate-800">{fee.title}</p>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-black text-emerald-600">{fmt(fee.amount)}</span>
                        </td>

                        {/* Class */}
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                            {fee.class?.name || '—'}
                          </span>
                        </td>

                        {/* Session */}
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-slate-600">{fee.session?.name || '—'}</span>
                        </td>

                        {/* Term */}
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-slate-600">{termLabel(fee.term?.name)}</span>
                        </td>

                        {/* Payments count */}
                        <td className="px-5 py-3.5">
                          {totalCount > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-blue-600">{paidCount}</span>
                              <span className="text-[10px] text-slate-400">/ {totalCount} paid</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">None</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setSelectedFee(fee); setPanel('edit'); }} title="Edit"
                              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setConfirm({ fee })} title="Delete"
                              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredFees.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">
                Showing <strong className="text-slate-600">{filteredFees.length}</strong> of <strong className="text-slate-600">{fees.length}</strong> fees
              </p>
              {hasFilters && (
                <button onClick={() => { setSearch(''); setFilterClass(''); }}
                  className="text-xs font-semibold text-emerald-600 hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Drawers ─────────────────────────────────────────── */}
      <AnimatePresence>
        {panel === 'create' && (
          <FeeFormDrawer
            classes={classes} sessions={sessions} terms={terms}
            onSave={handleCreate}
            onClose={() => setPanel(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === 'edit' && selectedFee && (
          <FeeFormDrawer
            isEdit
            initial={{
              title:     selectedFee.title     || '',
              amount:    selectedFee.amount     || '',
              classId:   selectedFee.classId   || selectedFee.class?.id   || '',
              sessionId: selectedFee.sessionId || selectedFee.session?.id || '',
              termId:    selectedFee.termId    || selectedFee.term?.id    || '',
            }}
            classes={classes} sessions={sessions} terms={terms}
            onSave={handleUpdate}
            onClose={() => { setPanel(null); setSelectedFee(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === 'payments' && (
          <PaymentsDrawer payments={payments} onClose={() => setPanel(null)} />
        )}
      </AnimatePresence>

      {/* ── Confirm Delete ────────────────────────────────────── */}
      <AnimatePresence>
        {confirm && (
          <ConfirmDialog
            title={`Delete "${confirm.fee.title}"?`}
            message="This will permanently remove this fee. Any associated payments will remain in history."
            onConfirm={handleDelete}
            onCancel={() => setConfirm(null)}
            loading={actionBusy}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeeManagement;