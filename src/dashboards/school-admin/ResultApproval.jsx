// pages/school/ResultApproval.jsx
// ─── Complete Result Approval System ─────────────────────────────
// Features: View pending results by class, approve/reject single or bulk,
// View approval history and statistics

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CheckCircle, XCircle, Clock, AlertCircle, Eye, Filter,
  Users, BookOpen, GraduationCap, Calendar, ChevronDown,
  RefreshCw, Loader2, Search, FileText, History, BarChart3,
  ThumbsUp, ThumbsDown, Send, Download, Printer, ChevronRight,
  Award, TrendingUp, TrendingDown, Minus, Star, AlertTriangle,
  CheckSquare, Square, X, Settings, Shield, UserCheck, UserX,
  Flag, Target, Percent, PieChart, Activity, Calendar as CalendarIcon,
  Filter as FilterIcon, ArrowUp, ArrowDown, Plus, MinusCircle,
} from 'lucide-react';
import { resultApprovalAPI, classAPI } from '../../services/schoolApi';

// ─────────────────────────────────────────────────────────────
// DATA HELPERS
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

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// ─────────────────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, accent, subtitle, trend, loading }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
        style={{ background: `${accent}15` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
          trend > 0 ? 'bg-emerald-50 text-emerald-600' : trend < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
        }`}>
          {trend > 0 ? <ArrowUp className="w-3 h-3" /> : trend < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{title}</p>
      {loading ? (
        <div className="h-8 w-20 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      )}
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// REMARK MODAL COMPONENT
// ─────────────────────────────────────────────────────────────
const RemarkModal = ({ isOpen, onClose, onConfirm, action, resultCount = 1, loading }) => {
  const [remark, setRemark] = useState('');
  const isReject = action === 'reject';
  const isBulk = resultCount > 1;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-4 ${isReject ? 'bg-gradient-to-r from-rose-50 to-red-50' : 'bg-gradient-to-r from-emerald-50 to-green-50'} border-b`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isReject ? 'bg-rose-100' : 'bg-emerald-100'
              }`}>
                {isReject ? (
                  <ThumbsDown className="w-5 h-5 text-rose-600" />
                ) : (
                  <ThumbsUp className="w-5 h-5 text-emerald-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {isReject ? 'Reject Result' : 'Approve Result'}
                </h2>
                {isBulk && (
                  <p className="text-sm text-slate-500">{resultCount} result(s) selected</p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {isReject ? 'Reason for Rejection' : 'Remarks (Optional)'}
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              placeholder={isReject 
                ? "Please provide a detailed reason for rejection..." 
                : "Add any notes or comments about this approval..."}
              autoFocus
            />
            {isReject && remark.length < 5 && remark.length > 0 && (
              <p className="text-xs text-rose-500 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Please provide at least 5 characters
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(remark)}
              disabled={loading || (isReject && !remark.trim())}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                isReject
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 disabled:from-rose-300'
                  : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-emerald-300'
              } disabled:cursor-not-allowed shadow-sm`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                isReject ? 'Reject Result' : 'Approve Result'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// RESULT CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const ResultCard = ({ result, onApprove, onReject, selected, onSelect, isPendingView }) => {
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBg = (score) => {
    if (score >= 70) return 'bg-emerald-50';
    if (score >= 50) return 'bg-blue-50';
    if (score >= 40) return 'bg-amber-50';
    return 'bg-rose-50';
  };

  const displayStatus = result.status?.toLowerCase();
  const isPending = displayStatus === 'pending';
  const isApproved = displayStatus === 'approved';
  const isRejected = displayStatus === 'rejected';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border transition-all hover:shadow-lg ${
        selected ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {isPendingView && (
              <button
                onClick={() => onSelect(result.id)}
                className="flex-shrink-0 transition-transform hover:scale-105"
              >
                {selected ? (
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300 hover:text-blue-400 transition-colors" />
                )}
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {(result.studentName || result.student?.user?.firstName)?.charAt(0) || 'S'}
            </div>
            <div>
              <h4 className="font-bold text-slate-800">
                {result.studentName || `${result.student?.user?.firstName} ${result.student?.user?.lastName}`}
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                {result.studentId || result.student?.studentId}
              </p>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            isPending ? 'bg-amber-100 text-amber-700' :
            isApproved ? 'bg-emerald-100 text-emerald-700' :
            'bg-rose-100 text-rose-700'
          }`}>
            {displayStatus?.toUpperCase()}
          </div>
        </div>

        {/* Subject & Class */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Subject</p>
              <p className="text-sm font-semibold text-slate-700">{result.subject?.name || result.subjectName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Class</p>
              <p className="text-sm font-semibold text-slate-700">
                {result.enrollment?.class?.name || result.className} {result.enrollment?.arm?.name || result.armName}
              </p>
            </div>
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Exam Score</p>
            <div className={`inline-flex items-center justify-center px-4 py-2 rounded-xl font-bold text-lg ${getScoreBg(result.examScore)} ${getScoreColor(result.examScore)}`}>
              {result.examScore}%
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-1">Total Score</p>
            <div className={`inline-flex items-center justify-center px-4 py-2 rounded-xl font-bold text-lg ${getScoreBg(result.totalScore)} ${getScoreColor(result.totalScore)}`}>
              {result.totalScore}%
            </div>
          </div>
        </div>

        {/* Actions */}
        {isPending && isPendingView && (
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => onApprove(result)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all font-semibold text-sm"
            >
              <ThumbsUp className="w-4 h-4" /> Approve
            </button>
            <button
              onClick={() => onReject(result)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all font-semibold text-sm"
            >
              <ThumbsDown className="w-4 h-4" /> Reject
            </button>
          </div>
        )}
        
        {/* Approval Info */}
        {!isPending && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {isApproved ? (
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <UserX className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span>
                {isApproved ? 'Approved' : 'Rejected'} by: {result.approvedByUser?.firstName || result.approvedBy || 'Admin'}
              </span>
              <span className="text-slate-300">•</span>
              <span>{formatDate(result.approvedAt || result.rejectedAt)}</span>
            </div>
            {result.approvalRemark && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                  {result.approvalRemark}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// HISTORY ITEM COMPONENT
// ─────────────────────────────────────────────────────────────
const HistoryItem = ({ item }) => {
  const actionLower = item.action?.toLowerCase();
  const isApproved = actionLower === 'approved';
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isApproved ? 'bg-emerald-100' : 'bg-rose-100'
      }`}>
        {isApproved ? (
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        ) : (
          <XCircle className="w-5 h-5 text-rose-600" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
          <div>
            <p className="font-semibold text-slate-800">
              {item.result?.student?.user?.firstName} {item.result?.student?.user?.lastName}
            </p>
            <p className="text-sm text-slate-500">
              {item.result?.subject?.name} • {item.result?.enrollment?.class?.name} {item.result?.enrollment?.arm?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {item.action}
            </span>
            <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5" />
            Score: {item.result?.totalScore}%
          </span>
          <span className="flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            By: {item.actor?.firstName} {item.actor?.lastName}
          </span>
        </div>
        {item.remark && (
          <div className="mt-2 p-2.5 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              {item.remark}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
const ResultApproval = () => {
  const [pendingClasses, setPendingClasses] = useState([]);
  const [results, setResults] = useState([]);
  const [approvalStats, setApprovalStats] = useState(null);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedArm, setSelectedArm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedResults, setSelectedResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('results');
  
  const [remarkModal, setRemarkModal] = useState({
    isOpen: false,
    action: null,
    resultId: null,
    result: null,
    isBulk: false,
    resultIds: [],
  });

  // ── Fetch Data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classRes, pendingRes, statsRes, historyRes] = await Promise.allSettled([
        classAPI.getClasses(),
        resultApprovalAPI.getPendingResultClasses(),
        resultApprovalAPI.getResultApprovalStats(),
        resultApprovalAPI.getApprovalHistory(),
      ]);
      
      setClasses(toArray(classRes.status === 'fulfilled' ? classRes.value : null, 'classes'));
      setPendingClasses(toArray(pendingRes.status === 'fulfilled' ? pendingRes.value : null, 'classes', 'data'));
      
      if (statsRes.status === 'fulfilled') {
        const statsData = statsRes.value?.data || statsRes.value;
        setApprovalStats(statsData);
      }
      
      if (historyRes.status === 'fulfilled') {
        const historyData = historyRes.value?.data || historyRes.value;
        setApprovalHistory(Array.isArray(historyData) ? historyData : []);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Fetch Results by Class ─────────────────────────────────
  const fetchResults = useCallback(async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const res = await resultApprovalAPI.getResultsByClass(selectedClass, selectedArm, statusFilter);
      const data = res?.data?.data || res?.data || res;
      setResults(Array.isArray(data) ? data : []);
      setSelectedResults([]);
    } catch (error) {
      console.error('Fetch results error:', error);
      toast.error('Failed to load results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedArm, statusFilter]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // ── Single Approve/Reject Handlers ─────────────────────────
  const handleApproveClick = (result) => {
    setRemarkModal({
      isOpen: true,
      action: 'approve',
      resultId: result.id,
      result: result,
      isBulk: false,
      resultIds: [],
    });
  };

  const handleRejectClick = (result) => {
    setRemarkModal({
      isOpen: true,
      action: 'reject',
      resultId: result.id,
      result: result,
      isBulk: false,
      resultIds: [],
    });
  };

  const handleSingleActionConfirm = async (remark) => {
    setSubmitting(true);
    try {
      if (remarkModal.action === 'approve') {
        await resultApprovalAPI.approveResult(remarkModal.resultId, { remark });
        toast.success('Result approved successfully');
      } else {
        if (!remark) {
          toast.error('Please provide a reason for rejection');
          return;
        }
        await resultApprovalAPI.rejectResult(remarkModal.resultId, { remark });
        toast.success('Result rejected');
      }
      setRemarkModal({ isOpen: false, action: null, resultId: null, result: null, isBulk: false, resultIds: [] });
      fetchResults();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to ${remarkModal.action}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Bulk Actions ───────────────────────────────────────────
  const handleSelectResult = (resultId) => {
    setSelectedResults(prev =>
      prev.includes(resultId)
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId]
    );
  };

  const handleSelectAll = () => {
    if (selectedResults.length === results.length) {
      setSelectedResults([]);
    } else {
      setSelectedResults(results.map(r => r.id));
    }
  };

  const handleBulkApproveClick = () => {
    if (selectedResults.length === 0) {
      toast.error('No results selected');
      return;
    }
    setRemarkModal({
      isOpen: true,
      action: 'approve',
      isBulk: true,
      resultIds: selectedResults,
      result: null,
      resultId: null,
    });
  };

  const handleBulkRejectClick = () => {
    if (selectedResults.length === 0) {
      toast.error('No results selected');
      return;
    }
    setRemarkModal({
      isOpen: true,
      action: 'reject',
      isBulk: true,
      resultIds: selectedResults,
      result: null,
      resultId: null,
    });
  };

  const handleBulkActionConfirm = async (remark) => {
    if (remarkModal.action === 'reject' && !remark) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setSubmitting(true);
    try {
      if (remarkModal.action === 'approve') {
        await resultApprovalAPI.bulkApproveResults({
          resultIds: remarkModal.resultIds,
          remark: remark || '',
        });
        toast.success(`${remarkModal.resultIds.length} results approved`);
      } else {
        await resultApprovalAPI.bulkRejectResults({
          resultIds: remarkModal.resultIds,
          remark: remark,
        });
        toast.success(`${remarkModal.resultIds.length} results rejected`);
      }
      setRemarkModal({ isOpen: false, action: null, resultId: null, result: null, isBulk: false, resultIds: [] });
      setSelectedResults([]);
      fetchResults();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || `Bulk ${remarkModal.action} failed`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalConfirm = (remark) => {
    if (remarkModal.isBulk) {
      handleBulkActionConfirm(remark);
    } else {
      handleSingleActionConfirm(remark);
    }
  };

  const filteredResults = results.filter(result => {
    const studentName = result.studentName || `${result.student?.user?.firstName} ${result.student?.user?.lastName}`;
    const studentId = result.studentId || result.student?.studentId;
    return studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentId?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = approvalStats || { pending: 0, approved: 0, rejected: 0, total: 0 };
  const approvalRate = stats.total ? Math.round((stats.approved / stats.total) * 100) : 0;

  // ── Render Statistics View ─────────────────────────────────
  const renderStatsView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Results"
          value={stats.total}
          icon={FileText}
          accent="#6366f1"
          loading={loading}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          accent="#f59e0b"
          loading={loading}
        />
        <StatCard
          title="Approved"
          value={stats.approved}
          icon={CheckCircle}
          accent="#10b981"
          loading={loading}
        />
        <StatCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          accent="#ef4444"
          loading={loading}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Rate Card */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Approval Rate
            </h3>
            <Percent className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${approvalRate}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
                />
              </div>
            </div>
            <span className="text-3xl font-bold text-slate-800">{approvalRate}%</span>
          </div>
          <p className="text-sm text-slate-500 mt-3">
            {stats.approved} of {stats.total} total results have been approved
          </p>
        </div>

        {/* Distribution Card */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Result Distribution
            </h3>
            <Activity className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Approved</span>
                <span className="font-semibold text-emerald-600">{stats.approved}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.approved / stats.total) * 100 || 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Rejected</span>
                <span className="font-semibold text-rose-600">{stats.rejected}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(stats.rejected / stats.total) * 100 || 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Pending</span>
                <span className="font-semibold text-amber-600">{stats.pending}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(stats.pending / stats.total) * 100 || 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Render History View ────────────────────────────────────
  const renderHistoryView = () => (
    <div className="space-y-3">
      {approvalHistory.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No approval history</h3>
          <p className="text-sm text-slate-400">Results will appear here once reviewed</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {approvalHistory.length} total records
            </p>
          </div>
          <div className="space-y-3">
            {approvalHistory.map(item => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );

  // ── Render Results View ────────────────────────────────────
  const renderResultsView = () => (
    <>
      {/* Class Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              SELECT CLASS
            </label>
            <select
              value={selectedClass || ''}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedArm(null);
              }}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
            >
              <option value="">Choose class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              CLASS ARM
            </label>
            <select
              value={selectedArm || ''}
              onChange={(e) => setSelectedArm(e.target.value || null)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
              disabled={!selectedClass}
            >
              <option value="">All Arms</option>
              {classes.find(c => c.id === selectedClass)?.arms?.map(arm => (
                <option key={arm.id} value={arm.id}>{arm.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
              <FilterIcon className="w-3.5 h-3.5" />
              STATUS
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
            >
              <option value="PENDING">⏳ Pending</option>
              <option value="APPROVED">✅ Approved</option>
              <option value="REJECTED">❌ Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {selectedClass ? (
        <>
          {/* Bulk Actions Bar */}
          {results.length > 0 && statusFilter === 'PENDING' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
            >
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                {selectedResults.length === results.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectedResults.length === results.length ? 'Deselect All' : 'Select All'}
                {selectedResults.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    {selectedResults.length}
                  </span>
                )}
              </button>
              
              {selectedResults.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkApproveClick}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all transform hover:scale-105 font-medium text-sm shadow-sm"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Approve Selected
                  </button>
                  <button
                    onClick={handleBulkRejectClick}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl hover:from-rose-700 hover:to-red-700 transition-all transform hover:scale-105 font-medium text-sm shadow-sm"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Reject Selected
                  </button>
                </div>
              )}
            </motion.div>
          )}
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name or ID..."
              className="w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Results Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-3" />
              <p className="text-slate-500 font-medium">Loading results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No results found</h3>
              <p className="text-sm text-slate-400">
                {searchTerm ? 'Try a different search term' : 'No results available for this class'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-3 flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Showing {filteredResults.length} result(s)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredResults.map(result => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    onApprove={handleApproveClick}
                    onReject={handleRejectClick}
                    selected={selectedResults.includes(result.id)}
                    onSelect={handleSelectResult}
                    isPendingView={statusFilter === 'PENDING'}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Select a class to view results</h3>
          <p className="text-sm text-slate-400">Choose a class from the dropdown above to get started</p>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    {/* Header */}
<div className="relative overflow-hidden px-6 py-8 mb-6"
  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 50%, #3730a3 100%)' }}>
  <div className="absolute inset-0 opacity-10"
    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
  <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
  
  <div className="relative max-w-7xl mx-auto">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
          <Shield className="w-3.5 h-3.5 text-indigo-200" />
          <span className="text-indigo-200 text-xs font-semibold">Result Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Result Approval Dashboard</h1>
        <p className="text-indigo-200 text-sm mt-1">Review, approve, and manage examination results</p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1">
          {[
            { id: 'results', label: 'Results', icon: FileText },
            { id: 'stats', label: 'Statistics', icon: BarChart3 },
            { id: 'history', label: 'History', icon: History },
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${
                viewMode === mode.id 
                  ? 'bg-white text-indigo-600 shadow-lg' 
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <mode.icon className="w-4 h-4" />
              {mode.label}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>
  </div>
</div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Pending Classes Alert */}
        {pendingClasses.length > 0 && viewMode === 'results' && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 rounded-xl shadow-sm"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800">Pending Results Alert</h4>
                <p className="text-sm text-amber-700">
                  {pendingClasses.length} class(es) have results waiting for your review
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {pendingClasses.map(cls => (
                    <button
                      key={cls.classId}
                      onClick={() => {
                        setSelectedClass(cls.classId);
                        setViewMode('results');
                      }}
                      className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors flex items-center gap-1"
                    >
                      <Flag className="w-3 h-3" />
                      {cls.className} {cls.armName && `- ${cls.armName}`}
                      <span className="bg-amber-200 px-1.5 py-0.5 rounded-full text-xs font-bold ml-1">
                        {cls.pendingCount}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'results' && renderResultsView()}
            {viewMode === 'stats' && renderStatsView()}
            {viewMode === 'history' && renderHistoryView()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Remark Modal */}
      <RemarkModal
        isOpen={remarkModal.isOpen}
        onClose={() => setRemarkModal({ isOpen: false, action: null, resultId: null, result: null, isBulk: false, resultIds: [] })}
        onConfirm={handleModalConfirm}
        action={remarkModal.action}
        resultCount={remarkModal.isBulk ? remarkModal.resultIds?.length : 1}
        loading={submitting}
      />
    </div>
  );
};

export default ResultApproval;