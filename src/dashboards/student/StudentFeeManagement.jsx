// pages/student/StudentFeeManagement.jsx
// ─── Student Fee Management with API integration ──────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  CreditCard, DollarSign, RefreshCw, Loader2,
  CheckCircle, XCircle, Clock, AlertCircle,
  TrendingUp, Calendar, FileText, Download,
  ChevronDown, Filter, Search, Receipt,
  Banknote, Wallet
} from 'lucide-react';
import { studentApi } from '../../services/studentApi';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const PaymentStatusBadge = ({ status }) => {
  const map = {
    COMPLETED: { label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
    PENDING: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
    FAILED: { label: 'Failed', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  };
  const info = map[status] || map.PENDING;
  const Icon = info.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${info.bg} ${info.color}`}>
      <Icon className="w-2.5 h-2.5" /> {info.label}
    </span>
  );
};

const StudentFeeManagement = () => {
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchFees = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await studentApi.getPaymentSummary();
      const data = res?.data?.data || res?.data || res;
      setFeeData(data);
      if (isRefresh) toast.success('Fee data refreshed');
    } catch (error) {
      toast.error('Failed to load fee data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const fees = feeData?.fees || [];
  const payments = feeData?.payments || [];

  const totalFees = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0);
  const outstanding = totalFees - totalPaid;

  const filteredFees = filter === 'all' 
    ? fees 
    : fees.filter(f => f.outstanding > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading fee data...</p>
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
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Fee Management</h1>
              <p className="text-blue-200 text-sm">View fee obligations and payment history</p>
            </div>
          </div>
          <button
            onClick={() => fetchFees(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Fees</p>
            <p className="text-3xl font-bold text-slate-800">{formatCurrency(totalFees)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Amount Paid</p>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm ${outstanding > 0 ? 'ring-2 ring-amber-200' : ''}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Outstanding</p>
            <p className={`text-3xl font-bold ${outstanding > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatCurrency(outstanding)}
            </p>
            {outstanding > 0 && (
              <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Payment pending
              </p>
            )}
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-700">Fee Breakdown</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  filter === 'all' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('outstanding')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  filter === 'outstanding' ? 'bg-amber-100 text-amber-600' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                Outstanding
              </button>
            </div>
          </div>

          {filteredFees.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">No fees found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredFees.map((fee, idx) => (
                <motion.div
                  key={fee.id || idx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="px-5 py-4"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{fee.title}</p>
                      <p className="text-xs text-slate-400">
                        {fee.class?.name || 'Class'} • {fee.term?.name || 'Term'} • {fee.session?.name || 'Session'}
                      </p>
                      {fee.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{fee.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{formatCurrency(fee.amount)}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-600">Paid: {formatCurrency(fee.amountPaid || 0)}</span>
                        {fee.outstanding > 0 && (
                          <span className="text-amber-600">Outstanding: {formatCurrency(fee.outstanding)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-700">Payment History</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {payments.map((payment, idx) => (
                <motion.div
                  key={payment.id || idx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="px-5 py-4 flex items-center justify-between flex-wrap gap-3"
                >
                  <div>
                    <p className="font-medium text-slate-800">{payment.fee?.title || 'Payment'}</p>
                    <p className="text-xs text-slate-400">
                      {formatDate(payment.createdAt)} • Ref: {payment.reference || payment.id?.slice(-8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">{formatCurrency(payment.amountPaid)}</span>
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeeManagement;