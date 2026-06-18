// pages/teacher/TeacherResultUpload.jsx
// ─── Production-ready Result Upload — matches school admin design system ──────
// FIXED: Properly handles enrollmentId and termId for result creation

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Upload, Users, BookOpen, FileText, RefreshCw, Loader2,
  Edit2, Save, X, CheckCircle, XCircle, Clock, AlertCircle,
  Search, ChevronDown, TrendingUp, BarChart3, Award,
  GraduationCap, BookMarked, Layers, Filter, Check,
  AlertTriangle, RotateCcw, Eye, Minus, Plus, UserPlus,
  UserCheck, Sparkles, Crown, Star
} from 'lucide-react';
import { teacherApi } from '../../services/teacherApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toArray = (res, ...keys) => {
  if (!res) return [];
  const c = [res, res.data, res.data?.data, ...keys.map(k => res[k]), ...keys.map(k => res.data?.[k])];
  for (const v of c) { if (Array.isArray(v)) return v; }
  return [];
};
const extract = (res) => res?.data?.data ?? res?.data ?? res ?? null;

const calcGrade = (total) => {
  if (total >= 75) return 'A';
  if (total >= 65) return 'B';
  if (total >= 55) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
};

const GRADE_META = {
  A: { label: 'Excellent',   bg: 'bg-emerald-100', text: 'text-emerald-700', bar: '#10b981' },
  B: { label: 'Very Good',   bg: 'bg-blue-100',    text: 'text-blue-700',    bar: '#3b82f6' },
  C: { label: 'Good',        bg: 'bg-cyan-100',    text: 'text-cyan-700',    bar: '#06b6d4' },
  D: { label: 'Average',     bg: 'bg-amber-100',   text: 'text-amber-700',   bar: '#f59e0b' },
  E: { label: 'Pass',        bg: 'bg-orange-100',  text: 'text-orange-700',  bar: '#f97316' },
  F: { label: 'Fail',        bg: 'bg-rose-100',    text: 'text-rose-700',    bar: '#ef4444' },
};

const STATUS_META = {
  PENDING:   { icon: Clock,        bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Pending'   },
  APPROVED:  { icon: CheckCircle,  bg: 'bg-emerald-100',text: 'text-emerald-700',label: 'Approved'  },
  REJECTED:  { icon: XCircle,      bg: 'bg-rose-100',   text: 'text-rose-700',   label: 'Rejected'  },
};

const PALETTE = ['#3b82f6','#6366f1','#8b5cf6','#ec4899','#10b981','#f59e0b'];

// ─── Helper functions to handle nested user object ────────────────────
const getFirstName = (s) => s?.user?.firstName || s?.firstName || '';
const getLastName = (s) => s?.user?.lastName || s?.lastName || '';
const getFullName = (s) => {
  const first = getFirstName(s);
  const last = getLastName(s);
  return `${first} ${last}`.trim() || 'Unknown';
};
const getInitials = (s) => {
  const first = getFirstName(s)[0] || '';
  const last = getLastName(s)[0] || '';
  return (first + last).toUpperCase() || 'S';
};
const getAvatarBg = (s) => {
  const name = getFirstName(s) || 'S';
  return PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length];
};
const getStudentId = (s) => s?.studentId || s?.id?.slice(-6) || 'N/A';

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, accent, loading, delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: 'easeOut' }}
    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-3"
    style={{ borderTop: `3px solid ${accent}` }}>
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}18` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest mt-1"
        style={{ color: `${accent}99` }}>{label}</span>
    </div>
    {loading
      ? <div className="h-9 w-20 bg-slate-100 rounded-lg animate-pulse" />
      : <p className="text-4xl font-black text-slate-900 leading-none">{value}</p>
    }
    {sub && !loading && <p className="text-xs text-slate-400 leading-snug">{sub}</p>}
  </motion.div>
);

// ─── Grade chip ───────────────────────────────────────────────────────────────
const GradeChip = ({ total }) => {
  const g = calcGrade(total);
  const m = GRADE_META[g];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${m.bg} ${m.text}`}>
      {g} · {m.label}
    </span>
  );
};

// ─── Status chip ──────────────────────────────────────────────────────────────
const StatusChip = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.PENDING;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${m.bg} ${m.text}`}>
      <Icon className="w-2.5 h-2.5" />{m.label}
    </span>
  );
};

// ─── Score bar ────────────────────────────────────────────────────────────────
const ScoreBar = ({ value, max = 100, color }) => (
  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden w-full">
    <motion.div className="h-full rounded-full"
      style={{ background: color }}
      initial={{ width: 0 }}
      animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      transition={{ duration: 0.6, ease: 'easeOut' }} />
  </div>
);

// ─── Field primitive ──────────────────────────────────────────────────────────
const NField = ({ label, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
    {children}
    {error && <p className="text-[11px] text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
  </div>
);

const NInput = ({ error, ...props }) => (
  <input {...props}
    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 outline-none transition-all
      bg-white text-slate-800 placeholder:text-slate-300
      focus:border-blue-500 hover:border-slate-300
      ${error ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}
  />
);

const NSelect = ({ error, children, ...props }) => (
  <div className="relative">
    <select {...props}
      className={`w-full px-3.5 py-2.5 text-sm rounded-xl border-2 outline-none appearance-none transition-all
        bg-white text-slate-800 focus:border-blue-500 hover:border-slate-300
        ${error ? 'border-rose-400' : 'border-slate-200'} disabled:opacity-50 disabled:cursor-not-allowed`}>
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
  </div>
);

// ─── Score input cell ──────────────────────────────────────────────────────────
const ScoreCell = ({ value, onChange, disabled, max, label }) => (
  <div className="flex flex-col gap-1 min-w-[80px]">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    <input
      type="number" value={value} onChange={onChange} disabled={disabled}
      min={0} max={max} step={0.5}
      className={`w-full px-2.5 py-2 text-sm font-bold rounded-xl border-2 outline-none text-center transition-all
        ${disabled
          ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-default'
          : 'bg-white border-blue-200 text-slate-900 focus:border-blue-500'
        }`}
      placeholder="—"
    />
    <ScoreBar value={Number(value) || 0} max={max} color={disabled ? '#cbd5e1' : '#3b82f6'} />
  </div>
);

// ─── CREATE RESULT MODAL ──────────────────────────────────────────────────────
const CreateResultModal = ({ isOpen, onClose, students, subjectId, classId, armId, onSuccess }) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [caScore, setCaScore] = useState('');
  const [examScore, setExamScore] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setSelectedStudent('');
      setCaScore('');
      setExamScore('');
      setErrors({});
    }
  }, [isOpen]);

  const total = (Number(caScore) || 0) + (Number(examScore) || 0);
  const isValid = selectedStudent && caScore !== '' && examScore !== '' && total <= 100;

  const handleSubmit = async () => {
    const newErrors = {};
    if (!selectedStudent) newErrors.student = 'Select a student';
    if (caScore === '') newErrors.ca = 'Enter CA score';
    if (examScore === '') newErrors.exam = 'Enter exam score';
    if (Number(caScore) + Number(examScore) > 100) newErrors.total = 'Total cannot exceed 100';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      // ─── FIXED: Get the student's enrollment from the API ───
      const selectedStudentObj = students.find(s => s.id === selectedStudent);
      
      // Fetch enrollment details for this student
      let enrollmentId = null;
      let termId = null;
      let sessionId = null;
      
      try {
        // Get student details with enrollments
        const studentResponse = await teacherApi.getStudents();
        const allStudents = toArray(studentResponse, 'students', 'data');
        const studentWithEnrollments = allStudents.find(s => s.id === selectedStudent);
        
        // Get the active enrollment
        if (studentWithEnrollments?.enrollments && studentWithEnrollments.enrollments.length > 0) {
          const activeEnrollment = studentWithEnrollments.enrollments.find(e => e.status === 'ACTIVE') || studentWithEnrollments.enrollments[0];
          enrollmentId = activeEnrollment.id;
          termId = activeEnrollment.termId;
          sessionId = activeEnrollment.sessionId;
        }
      } catch (err) {
        console.warn('Could not fetch enrollment details:', err);
      }

      // ─── FIXED: Build result data with required fields ───
      const resultData = {
        studentId: selectedStudent,
        subjectId: subjectId,
        classId: classId,
        armId: armId,
        caScore: Number(caScore),
        examScore: Number(examScore),
      };

      // Add enrollmentId if available
      if (enrollmentId) {
        resultData.enrollmentId = enrollmentId;
      }

      // Add termId if available
      if (termId) {
        resultData.termId = termId;
      }

      // Add sessionId if available
      if (sessionId) {
        resultData.sessionId = sessionId;
      }

      const response = await teacherApi.uploadResult(resultData);
      const savedResult = extract(response);
      
      toast.success('Result created successfully!');
      onSuccess(savedResult, selectedStudent);
      onClose();
    } catch (error) {
      console.error('Error creating result:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.errors?.[0]?.message || 
                          'Failed to create result';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStudentObj = students.find(s => s.id === selectedStudent);
  const existingResult = selectedStudentObj?.existingResult;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Create Result</h2>
                    <p className="text-xs text-white/80">Manually enter a student's result</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <NField label="Student" error={errors.student}>
                <NSelect value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                  <option value="">Select a student...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {getFullName(student)} ({getStudentId(student)})
                    </option>
                  ))}
                </NSelect>
              </NField>

              {existingResult && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">This student already has a result. Submitting will update it.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <NField label="CA Score (max 100)" error={errors.ca}>
                  <NInput
                    type="number"
                    value={caScore}
                    onChange={(e) => setCaScore(e.target.value)}
                    placeholder="0 - 100"
                    min={0}
                    max={100}
                    step={0.5}
                  />
                </NField>
                
                <NField label="Exam Score (max 100)" error={errors.exam}>
                  <NInput
                    type="number"
                    value={examScore}
                    onChange={(e) => setExamScore(e.target.value)}
                    placeholder="0 - 100"
                    min={0}
                    max={100}
                    step={0.5}
                  />
                </NField>
              </div>

              {(caScore !== '' || examScore !== '') && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Preview</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Total Score</p>
                      <p className="text-2xl font-black text-slate-800">{total}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Grade</p>
                      <GradeChip total={total} />
                    </div>
                  </div>
                  {total > 100 && <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-2"><AlertCircle className="w-3 h-3" /> Total cannot exceed 100</p>}
                </motion.div>
              )}

              {errors.total && <p className="text-[11px] text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.total}</p>}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!isValid || submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {submitting ? 'Saving...' : 'Create Result'}
                </button>
                <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Result row ────────────────────────────────────────────────────────────────
const ResultRow = ({ student, result, editing, onEdit, onCancel, onSave, saving, idx }) => {
  const [ca, setCa] = useState('');
  const [exam, setExam] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (editing) {
      setCa(result?.caScore ?? '');
      setExam(result?.examScore ?? '');
      setErr('');
    }
  }, [editing, result]);

  const total = (Number(ca) || 0) + (Number(exam) || 0);
  const grade = calcGrade(total);
  const gm = GRADE_META[grade];

  const handleSave = () => {
    if (ca === '' || exam === '') { setErr('Enter both scores'); return; }
    if (total > 100) { setErr('Total cannot exceed 100'); return; }
    setErr('');
    onSave(student.id, {
      caScore: Number(ca),
      examScore: Number(exam),
    });
  };

  const isApproved = result?.status === 'APPROVED';
  const isRejected = result?.status === 'REJECTED';

  return (
    <motion.tr key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ delay: Math.min(idx * 0.025, 0.4) }}
      className={`group transition-colors ${editing ? 'bg-blue-50/50' : 'hover:bg-slate-50/60'}`}>
      <td className="px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: getAvatarBg(student) }}>
            {getInitials(student)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{getFullName(student)}</p>
            <p className="text-[11px] text-slate-400 font-mono">{getStudentId(student)}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3.5 border-b border-slate-100">
        {editing
          ? <ScoreCell value={ca} onChange={e => setCa(e.target.value)} max={100} label="CA" />
          : <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-700">{result?.caScore ?? '—'}</span>
              {result?.caScore != null && <ScoreBar value={result.caScore} max={100} color="#8b5cf6" />}
            </div>
        }
      </td>

      <td className="px-4 py-3.5 border-b border-slate-100">
        {editing
          ? <ScoreCell value={exam} onChange={e => setExam(e.target.value)} max={100} label="Exam" />
          : <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-700">{result?.examScore ?? '—'}</span>
              {result?.examScore != null && <ScoreBar value={result.examScore} max={100} color="#6366f1" />}
            </div>
        }
      </td>

      <td className="px-4 py-3.5 border-b border-slate-100">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-black text-slate-900">
            {editing ? total : (result?.totalScore ?? '—')}
          </span>
          {(editing || result?.totalScore != null) && (
            <ScoreBar value={editing ? total : result.totalScore} max={100} color={gm.bar} />
          )}
        </div>
      </td>

      <td className="px-4 py-3.5 border-b border-slate-100">
        {(editing && (Number(ca) + Number(exam)) > 0) || result?.totalScore != null
          ? <GradeChip total={editing ? total : result.totalScore} />
          : <span className="text-slate-300 text-sm">—</span>
        }
      </td>

      <td className="px-4 py-3.5 border-b border-slate-100">
        {result?.status
          ? <StatusChip status={result.status} />
          : <span className="text-[10px] text-slate-300 italic">Not submitted</span>
        }
        {isRejected && result.approvalRemark && (
          <p className="text-[10px] text-rose-500 mt-1 max-w-[140px] truncate" title={result.approvalRemark}>
            {result.approvalRemark}
          </p>
        )}
      </td>

      <td className="px-4 py-3.5 border-b border-slate-100">
        {editing ? (
          <div className="flex flex-col gap-1.5">
            {err && <p className="text-[10px] text-rose-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{err}</p>}
            <div className="flex items-center gap-1.5">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
              <button onClick={() => onCancel(student.id)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isApproved ? (
              <span className="text-[10px] text-emerald-600 font-semibold">Locked</span>
            ) : (
              <button onClick={() => onEdit(student.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors"
                style={{ background: isRejected ? '#fff1f2' : '#eff6ff', color: isRejected ? '#be123c' : '#1d4ed8' }}>
                {isRejected ? <RotateCcw className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                {result ? (isRejected ? 'Resubmit' : 'Edit') : 'Enter'}
              </button>
            )}
          </div>
        )}
      </td>
    </motion.tr>
  );
};

// ─── Progress ring ────────────────────────────────────────────────────────────
const ProgressRing = ({ value, max, color, size = 56, stroke = 5 }) => {
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c}
        animate={{ strokeDashoffset: c * (1 - pct) }}
        transition={{ duration: 0.8, ease: 'easeOut' }} />
    </svg>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const TeacherResultUpload = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});
  const [studentEnrollments, setStudentEnrollments] = useState({});

  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selClass, setSelClass] = useState('');
  const [selSubject, setSelSubject] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchMeta = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [clsRes, subRes] = await Promise.allSettled([
        teacherApi.getAssignedClasses(),
        teacherApi.getAssignedSubjects(),
      ]);
      
      let classesData = [];
      if (clsRes.status === 'fulfilled') {
        const rawData = clsRes.value?.data?.data || clsRes.value?.data || clsRes.value;
        if (Array.isArray(rawData)) {
          classesData = rawData.map(item => ({
            id: item.arm?.id || item.armId || item.id,
            name: `${item.class?.name || 'Class'} - ${item.arm?.name || 'Arm'}`,
            class: item.class,
            arm: item.arm,
            subjects: item.subjects || [],
          })).filter(c => c.id);
        }
      }
      setClasses(classesData);
      
      let subjectsData = [];
      if (subRes.status === 'fulfilled') {
        subjectsData = toArray(subRes.value, 'data', 'subjects');
      }
      setSubjects(subjectsData);
      
      if (isRefresh) toast.success('Refreshed');
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  // ── Get subjects for selected class ──────────────────────────────────────
  const getClassSubjects = useCallback(() => {
    if (!selClass) return [];
    const classObj = classes.find(c => c.id === selClass);
    if (classObj?.subjects?.length > 0) return classObj.subjects;
    const classId = classObj?.class?.id;
    return subjects.filter(s => s.classId === classId);
  }, [classes, subjects, selClass]);

  // ─── FIXED: Fetch students and their enrollments ───────────────────────────
  useEffect(() => {
    if (!selClass || !selSubject) {
      setStudents([]);
      setResults({});
      return;
    }

    const loadData = async () => {
      setLoadingData(true);
      try {
        // Get all students assigned to the teacher
        const response = await teacherApi.getStudents();
        const allStudents = toArray(response, 'students', 'data');
        
        // Map students and fetch enrollment details
        const mappedStudents = [];
        const enrollmentsMap = {};
        
        for (const student of allStudents) {
          // Try to get enrollment details for this student
          let enrollmentId = null;
          let termId = null;
          let sessionId = null;
          
          try {
            // Check if student has enrollments in the response
            if (student.enrollments && student.enrollments.length > 0) {
              const activeEnrollment = student.enrollments.find(e => e.status === 'ACTIVE') || student.enrollments[0];
              enrollmentId = activeEnrollment.id;
              termId = activeEnrollment.termId;
              sessionId = activeEnrollment.sessionId;
            } else {
              // Try to fetch enrollment details from the result status endpoint
              const classObj = classes.find(c => c.id === selClass);
              const statusRes = await teacherApi.getResultApprovalStatus({
                classId: classObj?.class?.id,
                subjectId: selSubject,
              });
              const statusData = toArray(statusRes, 'results', 'data');
              const studentResult = statusData.find(r => r.studentId === student.id);
              if (studentResult) {
                enrollmentId = studentResult.enrollmentId;
                termId = studentResult.termId;
                sessionId = studentResult.sessionId;
              }
            }
          } catch (err) {
            console.warn(`Could not fetch enrollment for student ${student.id}:`, err);
          }
          
          // Store enrollment info
          if (enrollmentId) {
            enrollmentsMap[student.id] = {
              enrollmentId,
              termId,
              sessionId,
            };
          }
          
          mappedStudents.push({
            id: student.id,
            studentId: student.studentId,
            userId: student.userId,
            firstName: student.user?.firstName || '',
            lastName: student.user?.lastName || '',
            user: student.user,
            _count: student._count,
            enrollmentId: enrollmentId,
            termId: termId,
            sessionId: sessionId,
            ...student,
          });
        }
        
        setStudentEnrollments(enrollmentsMap);
        setStudents(mappedStudents);
        setResults({});
        
        // Try to get existing results for this subject
        try {
          const classObj = classes.find(c => c.id === selClass);
          const statusRes = await teacherApi.getResultApprovalStatus({
            classId: classObj?.class?.id,
            subjectId: selSubject,
          });
          
          const statusData = toArray(statusRes, 'results', 'data');
          const resultsMap = {};
          statusData.forEach(r => {
            resultsMap[r.studentId] = r;
          });
          setResults(resultsMap);
          
          // Update students with existing result info
          const updatedStudents = mappedStudents.map(s => ({
            ...s,
            existingResult: resultsMap[s.id] || null,
          }));
          setStudents(updatedStudents);
          
        } catch (err) {
          console.log('No existing results found');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load student data');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [selClass, selSubject, classes]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (studentId, scoreData) => {
    setSaving(true);
    try {
      const existing = results[studentId];
      const classObj = classes.find(c => c.id === selClass);
      
      // ─── FIXED: Get enrollmentId from the stored enrollments ───
      const enrollmentInfo = studentEnrollments[studentId] || {};
      const enrollmentId = enrollmentInfo.enrollmentId;
      const termId = enrollmentInfo.termId;
      const sessionId = enrollmentInfo.sessionId;
      
      let res;
      if (!existing) {
        // Create new result
        const resultData = {
          studentId,
          subjectId: selSubject,
          classId: classObj?.class?.id,
          armId: selClass,
          caScore: scoreData.caScore,
          examScore: scoreData.examScore,
        };
        
        // Add enrollmentId if available
        if (enrollmentId) {
          resultData.enrollmentId = enrollmentId;
        }
        if (termId) {
          resultData.termId = termId;
        }
        if (sessionId) {
          resultData.sessionId = sessionId;
        }
        
        res = await teacherApi.uploadResult(resultData);
      } else if (existing.status === 'REJECTED') {
        // Resubmit rejected result
        res = await teacherApi.resubmitRejectedResult(existing.id, {
          caScore: scoreData.caScore,
          examScore: scoreData.examScore,
        });
      } else {
        // Edit existing result
        res = await teacherApi.editResult(existing.id, {
          caScore: scoreData.caScore,
          examScore: scoreData.examScore,
        });
      }

      const saved = extract(res);
      setResults(prev => ({ ...prev, [studentId]: saved || { ...scoreData, studentId, status: 'PENDING' } }));
      setEditingId(null);
      toast.success(existing ? 'Result updated' : 'Result submitted');
    } catch (err) {
      console.error('Error saving result:', err);
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.errors?.[0]?.message || 
                          'Failed to save result';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [results, selClass, selSubject, classes, studentEnrollments]);

  const handleCreateResult = useCallback((newResult, studentId) => {
    setResults(prev => ({ ...prev, [studentId]: newResult }));
  }, []);

  // ─── Filters ────────────────────────────────────────────────────────────────
  const visibleStudents = students.filter(s => {
    if (!search) return true;
    const name = getFullName(s).toLowerCase();
    const id = (s.studentId || '').toLowerCase();
    return name.includes(search.toLowerCase()) || id.includes(search.toLowerCase());
  });

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const total = students.length;
  const entered = Object.keys(results).length;
  const approved = Object.values(results).filter(r => r.status === 'APPROVED').length;
  const pending = Object.values(results).filter(r => r.status === 'PENDING').length;
  const rejected = Object.values(results).filter(r => r.status === 'REJECTED').length;
  const avgScore = entered > 0
    ? Math.round(Object.values(results).reduce((s, r) => s + (r.totalScore || 0), 0) / entered)
    : 0;
  const passRate = entered > 0
    ? Math.round((Object.values(results).filter(r => calcGrade(r.totalScore || 0) !== 'F').length / entered) * 100)
    : 0;

  const selClassObj = classes.find(c => c.id === selClass);
  const classSubjects = getClassSubjects();
  const selSubjectObj = classSubjects.find(s => s.id === selSubject || s.subject?.id === selSubject);
  const subjectName = selSubjectObj?.name || selSubjectObj?.subject?.name || '';
  const className_ = selClassObj ? `${selClassObj.class?.name || ''} — ${selClassObj.arm?.name || ''}` : '';

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f6fa] gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      <p className="text-sm font-medium text-slate-400">Loading result upload…</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* Hero */}
      <div className="relative overflow-hidden px-6 py-8 mb-6"
        style={{ background: 'linear-gradient(135deg, #0d1117 0%, #111827 55%, #1a1205 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#f0a500 1px,transparent 1px),linear-gradient(90deg,#f0a500 1px,transparent 1px)', backgroundSize: '36px 36px' }} />
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full opacity-[0.06] pointer-events-none"
          style={{ background: 'radial-gradient(circle,#3b82f6,transparent 70%)', transform: 'translate(30%,-30%)' }} />

        <div className="relative max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 mb-3">
              <Upload className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-white/80 text-xs font-semibold">Result Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Upload Results</h1>
            <p className="text-slate-400 text-sm mt-1">
              {selClass && selSubject
                ? <><span className="text-white font-semibold">{subjectName}</span> · <span className="text-blue-300">{className_}</span></>
                : 'Select a class and subject to begin entering scores'
              }
            </p>
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            {selClass && selSubject && [
              { label: 'Students', value: total, color: 'text-white' },
              { label: 'Entered', value: entered, color: 'text-emerald-300' },
              { label: 'Pending', value: pending, color: 'text-amber-300' },
              { label: 'Approved', value: approved, color: 'text-blue-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl px-4 py-3 text-center min-w-[68px]"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}

            <button onClick={() => fetchMeta(true)} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Syncing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5 pb-12">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Students" value={total} icon={Users} accent="#3b82f6" delay={0.0} sub="In selected class" />
          <StatCard label="Scores Entered" value={`${entered}/${total}`} icon={FileText} accent="#8b5cf6" delay={0.05} sub={`${total > 0 ? Math.round((entered/total)*100) : 0}% complete`} />
          <StatCard label="Avg Score" value={entered ? `${avgScore}%` : '—'} icon={TrendingUp} accent="#10b981" delay={0.1} sub={entered ? `Pass rate: ${passRate}%` : 'No data yet'} />
          <StatCard label="Pending Approval" value={pending} icon={Clock} accent="#f59e0b" delay={0.15} sub={`${approved} approved · ${rejected} rejected`} />
        </div>

        {/* Selector card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Select Class & Subject</h2>
            </div>
            
            {selClass && selSubject && students.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create Result
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <NField label="Class">
                <NSelect value={selClass} onChange={e => { setSelClass(e.target.value); setSelSubject(''); setEditingId(null); }}>
                  <option value="">Select a class…</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.class?.name} — {c.arm?.name}
                    </option>
                  ))}
                </NSelect>
              </NField>
            </div>

            <div>
              <NField label="Subject">
                <NSelect value={selSubject} onChange={e => { setSelSubject(e.target.value); setEditingId(null); }} disabled={!selClass}>
                  <option value="">Select a subject…</option>
                  {classSubjects.map(s => {
                    const id = s.id || s.subject?.id;
                    const name = s.name || s.subject?.name || '';
                    return <option key={id} value={id}>{name}</option>;
                  })}
                </NSelect>
              </NField>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(GRADE_META).map(([g, m]) => (
              <span key={g} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${m.bg} ${m.text}`}>
                {g}: {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Progress + score distribution */}
        {selClass && selSubject && entered > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Score Distribution</h2>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {Object.entries(GRADE_META).map(([g, m]) => {
                const count = Object.values(results).filter(r => calcGrade(r.totalScore || 0) === g).length;
                return (
                  <div key={g} className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <ProgressRing value={count} max={Math.max(entered, 1)} color={m.bar} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-black text-slate-700">{count}</span>
                      </div>
                    </div>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${m.bg} ${m.text}`}>{g}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Main table */}
        {!selClass || !selSubject ? (
          <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
              <Upload className="w-10 h-10 text-blue-300" />
            </div>
            <h3 className="text-base font-bold text-slate-700 mb-1">No class or subject selected</h3>
            <p className="text-sm text-slate-400">Choose a class and subject above to start entering scores.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm font-black text-slate-700">
                  {subjectName} — {className_}
                </span>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:block">
                  {visibleStudents.length} of {students.length}
                </span>
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search students…"
                    className="w-full h-9 pl-9 pr-8 text-sm text-slate-700 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
                  />
                  {search && (
                    <button onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loadingData ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-slate-400">Loading students…</p>
              </div>
            ) : visibleStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-blue-300" />
                </div>
                <p className="text-sm font-bold text-slate-600 mb-1">
                  {search ? 'No students match' : 'No students found'}
                </p>
                <p className="text-xs text-slate-400">
                  {search ? 'Clear the search to see all students.' : 'No students are enrolled in this class arm.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      {['Student', 'CA Score', 'Exam Score', 'Total', 'Grade', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleStudents.map((s, i) => (
                      <ResultRow
                        key={s.id}
                        student={s}
                        result={results[s.id]}
                        editing={editingId === s.id}
                        onEdit={setEditingId}
                        onCancel={() => setEditingId(null)}
                        onSave={handleSave}
                        saving={saving}
                        idx={i}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loadingData && students.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Showing <strong className="text-slate-600">{visibleStudents.length}</strong> of <strong className="text-slate-600">{students.length}</strong> students
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <motion.div className="h-full bg-emerald-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${total > 0 ? (entered / total) * 100 : 0}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {total > 0 ? Math.round((entered / total) * 100) : 0}% entered
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scoring rules */}
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-blue-100 bg-blue-50">
          <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-blue-800 mb-1">Scoring Rules</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0.5">
              {[
                'CA score: max 100 points',
                'Exam score: max 100 points',
                'CA + Exam total must not exceed 100',
                'Grades: A≥75 · B≥65 · C≥55 · D≥45 · E≥40 · F<40',
                'Approved results are locked — contact admin to unlock',
                'Rejected results can be corrected and resubmitted',
              ].map(r => (
                <p key={r} className="text-[11px] text-blue-700 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />{r}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Result Modal */}
      <CreateResultModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        students={students}
        subjectId={selSubject}
        classId={selClassObj?.class?.id}
        armId={selClass}
        onSuccess={handleCreateResult}
      />
    </div>
  );
};

export default TeacherResultUpload;