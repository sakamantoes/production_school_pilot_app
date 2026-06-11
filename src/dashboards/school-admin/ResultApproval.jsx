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
  CheckSquare, Square, X, Settings, Shield,
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

// ─────────────────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, accent, subtitle, loading }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
        style={{ background: `${accent}15` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
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
// RESULT CARD COMPONENT
// ─────────────────────────────────────────────────────────────
const ResultCard = ({ result, onApprove, onReject, selected, onSelect }) => {
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
      selected ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelect(result.id)}
            className="flex-shrink-0"
          >
            {selected ? (
              <CheckSquare className="w-5 h-5 text-blue-600" />
            ) : (
              <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
            )}
          </button>
          <div>
            <h4 className="font-semibold text-slate-800">{result.studentName}</h4>
            <p className="text-xs text-slate-500">{result.studentId}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          result.status === 'pending' ? 'bg-amber-100 text-amber-700' :
          result.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
          'bg-red-100 text-red-700'
        }`}>
          {result.status?.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-slate-400">Subject</p>
          <p className="text-sm font-medium text-slate-700">{result.subjectName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Class</p>
          <p className="text-sm font-medium text-slate-700">{result.className} {result.armName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Exam Score</p>
          <p className={`text-lg font-bold ${getScoreColor(result.examScore)}`}>
            {result.examScore}%
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Total Score</p>
          <p className={`text-lg font-bold ${getScoreColor(result.totalScore)}`}>
            {result.totalScore}%
          </p>
        </div>
      </div>

      {result.status === 'pending' && (
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={() => onApprove(result.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
          >
            <ThumbsUp className="w-4 h-4" /> Approve
          </button>
          <button
            onClick={() => onReject(result.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <ThumbsDown className="w-4 h-4" /> Reject
          </button>
        </div>
      )}
      
      {result.status !== 'pending' && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            {result.approvedBy && `Approved by: ${result.approvedBy}`}
            {result.rejectedBy && `Rejected by: ${result.rejectedBy}`}
          </p>
          <p className="text-xs text-slate-400">
            {result.approvedAt && new Date(result.approvedAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// HISTORY ITEM COMPONENT
// ─────────────────────────────────────────────────────────────
const HistoryItem = ({ item }) => (
  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
      item.action === 'approved' ? 'bg-emerald-100' : 'bg-red-100'
    }`}>
      {item.action === 'approved' ? (
        <CheckCircle className="w-4 h-4 text-emerald-600" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600" />
      )}
    </div>
    <div className="flex-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-800">
            {item.studentName} - {item.subjectName}
          </p>
          <p className="text-xs text-slate-500">{item.className} {item.armName}</p>
        </div>
        <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-3 mt-1">
        <span className={`text-xs font-semibold ${
          item.action === 'approved' ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {item.action.toUpperCase()}
        </span>
        <span className="text-xs text-slate-400">Score: {item.totalScore}%</span>
      </div>
      {item.remarks && (
        <p className="text-xs text-slate-500 mt-1">Remarks: {item.remarks}</p>
      )}
    </div>
  </div>
);

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
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk selection
  const [selectedResults, setSelectedResults] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState(null);
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // View modes
  const [viewMode, setViewMode] = useState('results'); // results, stats, history

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
      setApprovalStats(statsRes.status === 'fulfilled' ? statsRes.value?.data || statsRes.value : null);
      setApprovalHistory(toArray(historyRes.status === 'fulfilled' ? historyRes.value : null, 'history', 'data'));
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
      toast.error('Failed to load results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedArm, statusFilter]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // ── Single Approve/Reject ──────────────────────────────────
  const handleApprove = async (resultId) => {
    const remarks = window.prompt('Optional remarks for approval:');
    
    try {
      await resultApprovalAPI.approveResult(resultId, { remarks: remarks || '' });
      toast.success('Result approved successfully');
      fetchResults();
      fetchData(); // Refresh stats and history
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (resultId) => {
    const remarks = window.prompt('Reason for rejection:');
    if (!remarks) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      await resultApprovalAPI.rejectResult(resultId, { remarks });
      toast.success('Result rejected');
      fetchResults();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reject');
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

  const handleBulkApprove = async () => {
    if (selectedResults.length === 0) {
      toast.error('No results selected');
      return;
    }
    
    setSubmitting(true);
    try {
      await resultApprovalAPI.bulkApproveResults({
        resultIds: selectedResults,
        remarks: bulkRemarks || '',
      });
      toast.success(`${selectedResults.length} results approved`);
      setShowBulkModal(false);
      setBulkRemarks('');
      setSelectedResults([]);
      fetchResults();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Bulk approval failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedResults.length === 0) {
      toast.error('No results selected');
      return;
    }
    
    if (!bulkRemarks) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setSubmitting(true);
    try {
      await resultApprovalAPI.bulkRejectResults({
        resultIds: selectedResults,
        remarks: bulkRemarks,
      });
      toast.success(`${selectedResults.length} results rejected`);
      setShowBulkModal(false);
      setBulkRemarks('');
      setSelectedResults([]);
      fetchResults();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Bulk rejection failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Filtered Results ───────────────────────────────────────
  const filteredResults = results.filter(result =>
    result.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Render Statistics View ─────────────────────────────────
  const renderStatsView = () => {
    const stats = approvalStats || {};
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Pending Results"
            value={stats.pendingCount || 0}
            icon={Clock}
            accent="#f59e0b"
            loading={loading}
          />
          <StatCard
            title="Approved Results"
            value={stats.approvedCount || 0}
            icon={CheckCircle}
            accent="#10b981"
            loading={loading}
          />
          <StatCard
            title="Rejected Results"
            value={stats.rejectedCount || 0}
            icon={XCircle}
            accent="#ef4444"
            loading={loading}
          />
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Approval Rate</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${stats.approvalRate || 0}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-slate-800">{stats.approvalRate || 0}%</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">By Class</h3>
          <div className="space-y-3">
            {(stats.byClass || []).map(cls => (
              <div key={cls.classId} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{cls.className}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-emerald-600">{cls.approved} ✓</span>
                  <span className="text-sm text-amber-600">{cls.pending} ⏳</span>
                  <span className="text-sm text-red-600">{cls.rejected} ✗</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Render History View ────────────────────────────────────
  const renderHistoryView = () => (
    <div className="space-y-3">
      {approvalHistory.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No approval history yet</p>
        </div>
      ) : (
        approvalHistory.map(item => (
          <HistoryItem key={item.id} item={item} />
        ))
      )}
    </div>
  );

  // ── Render Results View ────────────────────────────────────
  const renderResultsView = () => (
    <>
      {/* Class Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 mb-1">Select Class</label>
            <select
              value={selectedClass || ''}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedArm(null);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose class...</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 mb-1">Class Arm</label>
            <select
              value={selectedArm || ''}
              onChange={(e) => setSelectedArm(e.target.value || null)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Arms</option>
              {classes.find(c => c.id === parseInt(selectedClass))?.arms?.map(arm => (
                <option key={arm.id} value={arm.id}>{arm.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Display */}
      {selectedClass ? (
        <>
          {/* Bulk Actions Bar */}
          {results.length > 0 && statusFilter === 'pending' && (
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
              >
                {selectedResults.length === results.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectedResults.length === results.length ? 'Deselect All' : 'Select All'}
              </button>
              
              {selectedResults.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setBulkAction('approve');
                      setShowBulkModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Approve ({selectedResults.length})
                  </button>
                  <button
                    onClick={() => {
                      setBulkAction('reject');
                      setShowBulkModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Reject ({selectedResults.length})
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name or ID..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Results Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No results found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResults.map(result => (
                <ResultCard
                  key={result.id}
                  result={result}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  selected={selectedResults.includes(result.id)}
                  onSelect={handleSelectResult}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border">
          <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-2">Select a class to view results</p>
          <p className="text-sm text-slate-400">Choose from the dropdown above</p>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Result Approval</h1>
                <p className="text-xs text-slate-500">Review and approve examination results</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-lg p-1">
                {['results', 'stats', 'history'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                      viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => fetchData()}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Pending Classes Alert */}
        {pendingClasses.length > 0 && viewMode === 'results' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">Pending Results</h4>
                <p className="text-sm text-amber-700">
                  {pendingClasses.length} class(es) have results waiting for approval
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pendingClasses.map(cls => (
                    <button
                      key={cls.classId}
                      onClick={() => setSelectedClass(cls.classId)}
                      className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs hover:bg-amber-200"
                    >
                      {cls.className}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {viewMode === 'results' && renderResultsView()}
        {viewMode === 'stats' && renderStatsView()}
        {viewMode === 'history' && renderHistoryView()}
      </div>

      {/* Bulk Action Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBulkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">
                  {bulkAction === 'approve' ? 'Bulk Approve' : 'Bulk Reject'}
                </h2>
                <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-slate-600 mb-4">
                {bulkAction === 'approve' 
                  ? `You are about to approve ${selectedResults.length} result(s)`
                  : `You are about to reject ${selectedResults.length} result(s)`}
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {bulkAction === 'approve' ? 'Remarks (Optional)' : 'Reason for Rejection *'}
                </label>
                <textarea
                  value={bulkRemarks}
                  onChange={(e) => setBulkRemarks(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={bulkAction === 'approve' ? 'Add any notes...' : 'Provide reason for rejection...'}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={bulkAction === 'approve' ? handleBulkApprove : handleBulkReject}
                  disabled={submitting}
                  className={`flex-1 px-4 py-2 rounded-lg text-white ${
                    bulkAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {submitting ? 'Processing...' : (bulkAction === 'approve' ? 'Approve' : 'Reject')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultApproval;