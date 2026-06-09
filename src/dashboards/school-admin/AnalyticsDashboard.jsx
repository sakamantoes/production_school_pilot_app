// pages/school/AnalyticsDashboard.jsx
// ─── Correctly wired to the actual API response ──────────────────────────────
//
// ACTUAL API SHAPE (from network tab):
// {
//   "status": 200, "success": true, "message": "Analytics fetched successfully",
//   "data": {
//     "teachers":     1,               ← flat number
//     "students":     1,               ← flat number
//     "classes":      3,               ← flat number
//     "subjects":     2,               ← flat number
//     "payments": {
//       "count":                0,
//       "totalPaid":            0,
//       "schoolAmount":         0,
//       "platformChargeAmount": 0,
//     },
//     "walletBalance": 0,
//   }
// }
//
// The old code tried to read analytics.students.total, analytics.finance.totalRevenue etc.
// which are ALL undefined on this shape. This file reads the real fields.

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BarChart3, RefreshCw, Download, Loader2,
  Users, GraduationCap, BookOpen, BookMarked,
  Wallet, DollarSign, CreditCard, TrendingUp,
  ArrowUpRight, ArrowDownRight, Minus,
  School, ChevronRight, AlertCircle,
  ReceiptText, Banknote, ShieldCheck,
} from 'lucide-react';
import { analyticsAPI } from '../../services/schoolApi';

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtCurrency = (n = 0) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const fmtNum = (n = 0) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
};

// ─── Skeleton pulse block ─────────────────────────────────────────────────────
const Skel = ({ h = 'h-8', w = 'w-24', round = 'rounded-lg' }) => (
  <div className={`${h} ${w} ${round} bg-slate-100 animate-pulse`} />
);

// ─── Stat card ────────────────────────────────────────────────────────────────
// accent: hex color string
const StatCard = ({ label, value, sub, icon: Icon, accent, loading, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35, ease: 'easeOut' }}
    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-3"
    style={{ borderTop: `3px solid ${accent}` }}
  >
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}18` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest mt-1"
        style={{ color: `${accent}99` }}>{label}</span>
    </div>
    {loading
      ? <Skel h="h-9" w="w-20" />
      : <p className="text-4xl font-black text-slate-900 leading-none">{value}</p>
    }
    {sub && !loading && (
      <p className="text-xs text-slate-400 font-medium leading-snug">{sub}</p>
    )}
  </motion.div>
);

// ─── Finance tile (used inside the finance band) ──────────────────────────────
const FinTile = ({ label, value, icon: Icon, color, loading }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5" style={{ color }} />
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: `${color}cc` }}>{label}</p>
    </div>
    {loading
      ? <Skel h="h-7" w="w-28" round="rounded-md" />
      : <p className="text-xl font-black text-white leading-tight">{value}</p>
    }
  </div>
);

// ─── Metric row (used in the breakdown card) ──────────────────────────────────
const MetricRow = ({ label, value, max, color, loading }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        {loading
          ? <div className="h-full w-full bg-slate-200 animate-pulse rounded-full" />
          : <motion.div className="h-full rounded-full" style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }} />
        }
      </div>
      <span className="text-xs font-bold text-slate-700 w-8 text-right">
        {loading ? '…' : fmtNum(value)}
      </span>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const AnalyticsDashboard = () => {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const res = await analyticsAPI.getSchoolAnalytics();

      // API returns: { status, success, message, data: { teachers, students, classes, subjects, payments:{…}, walletBalance } }
      // Handle every possible wrapping level defensively
      const d = res?.data?.data ?? res?.data ?? res ?? {};
      setData(d);
      if (isRefresh) toast.success('Analytics updated');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load analytics';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  // ── Extract flat fields from the ACTUAL response shape ─────
  // All are either top-level numbers or the payments sub-object.
  const teachers     = data?.teachers    ?? 0;   // number
  const students     = data?.students    ?? 0;   // number
  const classes      = data?.classes     ?? 0;   // number
  const subjects     = data?.subjects    ?? 0;   // number
  const walletBal    = data?.walletBalance ?? 0;  // number

  const pmts         = data?.payments    ?? {};
  const pmtCount     = pmts.count                ?? 0;
  const totalPaid    = pmts.totalPaid            ?? 0;
  const schoolAmt    = pmts.schoolAmount         ?? 0;
  const platformAmt  = pmts.platformChargeAmount ?? 0;

  // Derived
  const collectionRate = totalPaid > 0 && schoolAmt > 0
    ? Math.round((schoolAmt / totalPaid) * 100)
    : 0;

  // ── CSV export ─────────────────────────────────────────────
  const handleExport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Teachers',                teachers],
      ['Students',                students],
      ['Classes',                 classes],
      ['Subjects',                subjects],
      ['Payment Count',           pmtCount],
      ['Total Paid',              totalPaid],
      ['School Amount',           schoolAmt],
      ['Platform Charge',         platformAmt],
      ['Wallet Balance',          walletBal],
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const url  = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: `analytics_${new Date().toISOString().split('T')[0]}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as CSV');
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 py-8 mb-6"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #2e1065 100%)' }}>
        {/* dot grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '26px 26px' }} />
        {/* glow */}
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full opacity-[0.08] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)', transform: 'translate(30%,-30%)' }} />

        <div className="relative max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
              <BarChart3 className="w-3.5 h-3.5 text-purple-300" />
              <span className="text-purple-200 text-xs font-semibold">Analytics & Insights</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">School Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Live snapshot of your school's key metrics</p>
          </div>

          {/* Hero quick numbers */}
          <div className="flex gap-3 flex-wrap">
            {[
              { label: 'Students', value: students,  color: '#60a5fa' },
              { label: 'Teachers', value: teachers,  color: '#a78bfa' },
              { label: 'Classes',  value: classes,   color: '#34d399' },
              { label: 'Subjects', value: subjects,  color: '#fbbf24' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl px-4 py-3 text-center min-w-[68px]"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {loading
                  ? <div className="h-7 w-10 mx-auto bg-white/10 rounded animate-pulse mb-1" />
                  : <p className="text-2xl font-black" style={{ color }}>{fmtNum(value)}</p>
                }
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={() => fetchAnalytics(true)} disabled={refreshing || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating…' : 'Refresh'}
            </button>
            <button onClick={handleExport} disabled={loading || !!error}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 pb-12">

        {/* ── Error banner ──────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-4 rounded-2xl border border-rose-200 bg-rose-50">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-rose-800">Failed to load analytics</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
              <button onClick={() => fetchAnalytics()}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors">
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Primary stat cards ────────────────────────────────── */}
        {/* Mapped directly to the 6 actual fields the API returns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Students"    value={fmtNum(students)}  sub="Registered in the system"  icon={Users}          accent="#3b82f6" loading={loading} delay={0.0} />
          <StatCard label="Teachers"    value={fmtNum(teachers)}  sub="Active staff members"       icon={GraduationCap}  accent="#8b5cf6" loading={loading} delay={0.05} />
          <StatCard label="Classes"     value={fmtNum(classes)}   sub="Academic class levels"      icon={BookOpen}       accent="#10b981" loading={loading} delay={0.1} />
          <StatCard label="Subjects"    value={fmtNum(subjects)}  sub="Subjects in catalogue"      icon={BookMarked}     accent="#f59e0b" loading={loading} delay={0.15} />
        </div>

        {/* ── Finance band ─────────────────────────────────────── */}
        {/* Uses payments.* and walletBalance from the actual response */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden shadow-lg"
          style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-300" />
              </div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Financial Overview</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <FinTile label="Wallet Balance"     value={fmtCurrency(walletBal)}  icon={Wallet}      color="#6ee7b7" loading={loading} />
              <FinTile label="Total Collected"    value={fmtCurrency(totalPaid)}  icon={TrendingUp}  color="#a7f3d0" loading={loading} />
              <FinTile label="School Earnings"    value={fmtCurrency(schoolAmt)}  icon={Banknote}    color="#d1fae5" loading={loading} />
              <FinTile label="Platform Charges"   value={fmtCurrency(platformAmt)}icon={ShieldCheck} color="#6ee7b7" loading={loading} />
            </div>

            {/* Payment count + collection bar */}
            <div className="mt-5 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-200 font-semibold">
                  {loading ? '…' : pmtCount} payment{pmtCount !== 1 ? 's' : ''} recorded
                </span>
              </div>

              {totalPaid > 0 && (
                <div className="flex items-center gap-3 flex-1 max-w-xs">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide flex-shrink-0">
                    School net
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div className="h-full bg-emerald-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${collectionRate}%` }}
                      transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }} />
                  </div>
                  <span className="text-xs font-black text-emerald-300 flex-shrink-0">{collectionRate}%</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Breakdown cards ───────────────────────────────────── */}
        {/* Shows the 4 academic counts as relative bars — useful even with small numbers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Academic structure */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <School className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Academic Structure</h3>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Students', value: students, color: '#3b82f6' },
                { label: 'Teachers', value: teachers, color: '#8b5cf6' },
                { label: 'Classes',  value: classes,  color: '#10b981' },
                { label: 'Subjects', value: subjects,  color: '#f59e0b' },
              ].map(({ label, value, color }) => (
                <MetricRow key={label} label={label} value={value}
                  max={Math.max(students, teachers, classes, subjects, 1)}
                  color={color} loading={loading} />
              ))}
            </div>
          </motion.div>

          {/* Payment breakdown */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Payment Breakdown</h3>
            </div>
            <div className="p-5 space-y-4">
              {loading ? (
                <>
                  <Skel h="h-14" w="w-full" round="rounded-xl" />
                  <Skel h="h-14" w="w-full" round="rounded-xl" />
                  <Skel h="h-14" w="w-full" round="rounded-xl" />
                </>
              ) : (
                <>
                  {/* Total paid */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-800">Total Paid</p>
                        <p className="text-[11px] text-emerald-600">{pmtCount} transaction{pmtCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <p className="text-base font-black text-emerald-700">{fmtCurrency(totalPaid)}</p>
                  </div>

                  {/* School amount */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Banknote className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-800">School Earnings</p>
                        <p className="text-[11px] text-blue-600">After platform fee</p>
                      </div>
                    </div>
                    <p className="text-base font-black text-blue-700">{fmtCurrency(schoolAmt)}</p>
                  </div>

                  {/* Platform charge */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Platform Fee</p>
                        <p className="text-[11px] text-slate-400">Service charge</p>
                      </div>
                    </div>
                    <p className="text-base font-black text-slate-600">{fmtCurrency(platformAmt)}</p>
                  </div>

                  {/* Zero state */}
                  {pmtCount === 0 && (
                    <p className="text-center text-xs text-slate-400 pt-1">
                      No payments recorded yet — fees collected will appear here.
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <p className="text-center text-[11px] text-slate-400 pt-2">
          Data is live — last fetched {new Date().toLocaleTimeString('en-NG')}
        </p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;