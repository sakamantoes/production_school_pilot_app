// pages/student/StudentResult.jsx
// ─── Student Results with API integration ──────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Award, BookOpen, RefreshCw, Loader2, CheckCircle,
  XCircle, Clock, TrendingUp, BarChart3, GraduationCap,
  ChevronDown, Filter, Search, FileText, Printer,
  Download, Eye, Calendar
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';

const GRADE_META = {
  A: { label: 'Excellent', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  B: { label: 'Very Good', bg: 'bg-blue-100', text: 'text-blue-700' },
  C: { label: 'Good', bg: 'bg-cyan-100', text: 'text-cyan-700' },
  D: { label: 'Average', bg: 'bg-amber-100', text: 'text-amber-700' },
  E: { label: 'Pass', bg: 'bg-orange-100', text: 'text-orange-700' },
  F: { label: 'Fail', bg: 'bg-rose-100', text: 'text-rose-700' },
};

const calcGrade = (total) => {
  if (total >= 75) return 'A';
  if (total >= 65) return 'B';
  if (total >= 55) return 'C';
  if (total >= 45) return 'D';
  if (total >= 40) return 'E';
  return 'F';
};

const StudentResult = () => {
  const [results, setResults] = useState([]);
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedSession, setSelectedSession] = useState('all');

  const fetchResults = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [resRes, cardRes] = await Promise.allSettled([
        studentApi.getApprovedResults(),
        studentApi.getReportCards(),
      ]);

      if (resRes.status === 'fulfilled') {
        const data = resRes.value?.data?.data || resRes.value?.data || resRes.value;
        setResults(Array.isArray(data) ? data : []);
      }
      if (cardRes.status === 'fulfilled') {
        const data = cardRes.value?.data?.data || cardRes.value?.data || cardRes.value;
        setReportCards(Array.isArray(data) ? data : []);
      }

      if (isRefresh) toast.success('Results refreshed');
    } catch (error) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Get unique terms and sessions for filters
  const terms = [...new Set(results.map(r => r.term?.name).filter(Boolean))];
  const sessions = [...new Set(results.map(r => r.term?.session?.name).filter(Boolean))];

  const filteredResults = results.filter(r => {
    const matchTerm = selectedTerm === 'all' || r.term?.name === selectedTerm;
    const matchSession = selectedSession === 'all' || r.term?.session?.name === selectedSession;
    return matchTerm && matchSession;
  });

  const getGradeInfo = (total) => {
    const grade = calcGrade(total);
    return { grade, ...GRADE_META[grade] };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Results</h1>
              <p className="text-blue-200 text-sm">Approved academic results</p>
            </div>
          </div>
          <button
            onClick={() => fetchResults(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Report Cards Summary */}
        {reportCards.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportCards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{card.term?.name || 'Term'}</p>
                    <p className="text-xs text-slate-400">{card.session?.name || 'Session'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Average</p>
                    <p className="text-xl font-bold text-slate-800">{card.averageScore}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(card.averageScore, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{card.results?.length || 0} subjects</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">Filters:</span>
            </div>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Terms</option>
              {terms.map(term => <option key={term} value={term}>{term}</option>)}
            </select>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sessions</option>
              {sessions.map(session => <option key={session} value={session}>{session}</option>)}
            </select>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-700">Approved Results</h2>
            <span className="text-xs text-slate-400">{filteredResults.length} results</span>
          </div>

          {filteredResults.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">No approved results found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">CA Score</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Exam Score</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Total</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Grade</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((result, idx) => {
                    const gradeInfo = getGradeInfo(result.totalScore);
                    return (
                      <motion.tr
                        key={result.id || idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-800">{result.subject?.name || 'Subject'}</p>
                          <p className="text-[10px] text-slate-400">{result.term?.name} • {result.term?.session?.name}</p>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-700">{result.caScore || '—'}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-700">{result.examScore || '—'}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">{result.totalScore || '—'}</td>
                        <td className="px-5 py-3.5">
                          {result.totalScore != null && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${gradeInfo.bg} ${gradeInfo.text}`}>
                              {gradeInfo.grade} · {gradeInfo.label}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                            <CheckCircle className="w-2.5 h-2.5" /> Approved
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentResult;