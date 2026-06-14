// pages/teacher/TeacherAnnouncements.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Megaphone,
  Calendar,
  Clock,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Bell,
  AlertCircle,
  Info,
  Users,
  Pin,
  Eye,
  ThumbsUp,
  Zap,
  Building,
  BookOpen,
  Award,
  Target,
  FileText,
  MessageCircle,
  Share2,
  Printer,
  Download,
  CheckCircle,
  Archive,
  GraduationCap,
  Heart
} from 'lucide-react';
import teacherApi from '../../services/teacherApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

const formatFullDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getAudienceIcon = (audience) => {
  const icons = {
    TEACHERS: { icon: Users, label: 'Teachers', color: 'blue' },
    STUDENTS: { icon: GraduationCap, label: 'Students', color: 'emerald' },
    PARENTS: { icon: Heart, label: 'Parents', color: 'purple' },
    ALL: { icon: Users, label: 'All', color: 'indigo' },
    STAFF: { icon: Building, label: 'Staff', color: 'orange' }
  };
  return icons[audience] || { icon: Megaphone, label: audience, color: 'gray' };
};

const getStatusColor = (status) => {
  const statuses = {
    PUBLISHED: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700', icon: FileText },
    ARCHIVED: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Archive },
    EXPIRED: { bg: 'bg-red-100', text: 'text-red-700', icon: Clock }
  };
  return statuses[status] || statuses.PUBLISHED;
};

// ─── Announcement Card Component ─────────────────────────────────────────────
const AnnouncementCard = ({ announcement, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const audience = getAudienceIcon(announcement.audience);
  const AudienceIcon = audience.icon;
  const status = getStatusColor(announcement.status);
  const StatusIcon = status.icon;
  
  const hasClassTargets = announcement.classTargets?.length > 0;
  const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date();
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className={`relative bg-white rounded-2xl border-2 transition-all duration-300 ${
        isExpired 
          ? 'border-gray-200 opacity-75' 
          : 'border-slate-200 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Audience Badge */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-${audience.color}-100 text-${audience.color}-700`}>
              <AudienceIcon className="w-3 h-3" />
              {audience.label}
            </div>
            
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
              <StatusIcon className="w-3 h-3" />
              {announcement.status}
            </div>
            
            {/* Expiry Warning */}
            {isExpired && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                <Clock className="w-3 h-3" />
                Expired
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-bold text-slate-800 mb-2 pr-8">
          {announcement.title}
        </h3>
        
        {/* Preview Content */}
        <p className={`text-slate-600 text-sm leading-relaxed ${!isExpanded && 'line-clamp-2'}`}>
          {announcement.body}
        </p>
        
        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-4"
            >
              {/* Full Content */}
              <div className="p-4 rounded-xl bg-slate-50">
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {announcement.body}
                </p>
              </div>
              
              {/* Class Targets */}
              {hasClassTargets && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Target className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">Target Classes:</span>
                  {announcement.classTargets.map((target, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {target.className || target.name || `Class ${idx + 1}`}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Meta Info */}
              <div className="space-y-2 pt-2 text-xs text-slate-400 border-t border-slate-200">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Published: {formatFullDate(announcement.publishedAt || announcement.createdAt)}</span>
                  </div>
                  {announcement.expiresAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Expires: {formatFullDate(announcement.expiresAt)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{announcement.views || 0} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Created: {formatFullDate(announcement.createdAt)}</span>
                  </div>
                </div>
                {announcement.updatedAt !== announcement.createdAt && (
                  <div className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    <span>Last updated: {formatFullDate(announcement.updatedAt)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Eye className="w-3 h-3" />
              <span>{announcement.views || 0} views</span>
            </div>
            <button 
              onClick={() => {
                toast.success('Feature coming soon');
              }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors"
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Like</span>
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(announcement.body);
                toast.success('Announcement copied to clipboard');
              }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors"
            >
              <Share2 className="w-3 h-3" />
              <span>Share</span>
            </button>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isExpanded ? 'Show Less ↑' : 'Read More →'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Filter Bar Component ────────────────────────────────────────────────────
const FilterBar = ({ filters, onFilterChange, onSearch }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };
  
  const audienceOptions = [
    { value: '', label: 'All Audiences' },
    { value: 'TEACHERS', label: 'Teachers' },
    { value: 'STUDENTS', label: 'Students' },
    { value: 'PARENTS', label: 'Parents' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'ALL', label: 'All' }
  ];
  
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'ARCHIVED', label: 'Archived' }
  ];
  
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Bar */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search announcements by title or content..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
          />
        </div>
        
        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showFilters 
              ? 'bg-blue-600 text-white' 
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Clear Filters */}
        {(filters.audience || filters.status) && (
          <button
            onClick={() => onFilterChange({ audience: '', status: '' })}
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
      
      {/* Expanded Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-2 flex flex-wrap gap-3">
              {/* Audience Filter */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Audience
                </label>
                <select
                  value={filters.audience || ''}
                  onChange={(e) => onFilterChange({ ...filters, audience: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-slate-200 focus:border-blue-500 outline-none"
                >
                  {audienceOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Status Filter */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-slate-200 focus:border-blue-500 outline-none"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Stats Card ──────────────────────────────────────────────────────────────
const StatsCard = ({ icon: Icon, label, value, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${gradient} shadow-lg`}
  >
    <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
      <Icon className="w-full h-full" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-white/80 text-[10px] font-black uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      <p className="text-white/60 text-xs">Total announcements</p>
    </div>
  </motion.div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ onRefresh }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-4">
      <Megaphone className="w-12 h-12 text-blue-300" />
    </div>
    <h3 className="text-lg font-bold text-slate-700 mb-2">No announcements found</h3>
    <p className="text-sm text-slate-400 mb-4 max-w-md">
      There are no announcements to display at this time. Check back later for updates from the school administration.
    </p>
    <button
      onClick={onRefresh}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      Refresh
    </button>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const TeacherAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ audience: '', status: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchAnnouncements = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await teacherApi.getAnnouncements();
      // Handle the API response structure properly
      const data = response?.data?.data || response?.data || [];
      setAnnouncements(data);
      if (!isRefresh) {
        toast.success(`Loaded ${data.length} announcements`);
      } else {
        toast.success('Announcements refreshed');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error(error?.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);
  
  // Filter and search announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    // Audience filter
    if (filters.audience && announcement.audience !== filters.audience) return false;
    
    // Status filter
    if (filters.status && announcement.status !== filters.status) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        announcement.title?.toLowerCase().includes(query) ||
        announcement.body?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Sort by published date (newest first)
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.createdAt);
    const dateB = new Date(b.publishedAt || b.createdAt);
    return dateB - dateA;
  });
  
  // Separate active and expired announcements
  const activeAnnouncements = sortedAnnouncements.filter(a => {
    if (a.status !== 'PUBLISHED') return false;
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
    return true;
  });
  
  const otherAnnouncements = sortedAnnouncements.filter(a => {
    if (a.status !== 'PUBLISHED') return true;
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return true;
    return false;
  });
  
  // Stats
  const totalAnnouncements = announcements.length;
  const publishedCount = announcements.filter(a => a.status === 'PUBLISHED').length;
  const activeCount = activeAnnouncements.length;
  const teacherTargetedCount = announcements.filter(a => a.audience === 'TEACHERS' || a.audience === 'ALL').length;
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-blue-500" />
        </motion.div>
        <p className="text-sm font-medium text-slate-500">Loading announcements...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden px-6 py-8 mb-6"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 mb-3 backdrop-blur-sm">
                <Megaphone className="w-3.5 h-3.5 text-blue-300" />
                <span className="text-white/80 text-xs font-semibold">School Updates</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Announcements</h1>
              <p className="text-slate-400 text-sm mt-1">
                Stay updated with the latest news and notifications
              </p>
            </div>
            
            <button
              onClick={() => fetchAnnouncements(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={Megaphone}
            label="Total"
            value={totalAnnouncements}
            gradient="from-blue-600 to-indigo-600"
            delay={0}
          />
          <StatsCard
            icon={CheckCircle}
            label="Published"
            value={publishedCount}
            gradient="from-emerald-600 to-teal-600"
            delay={0.05}
          />
          <StatsCard
            icon={Bell}
            label="Active"
            value={activeCount}
            gradient="from-purple-600 to-pink-600"
            delay={0.1}
          />
          <StatsCard
            icon={Users}
            label="For Teachers"
            value={teacherTargetedCount}
            gradient="from-orange-600 to-red-600"
            delay={0.15}
          />
        </div>
        
        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            onSearch={setSearchQuery}
          />
        </div>
        
        {/* Announcements List */}
        {filteredAnnouncements.length === 0 ? (
          <EmptyState onRefresh={() => fetchAnnouncements(true)} />
        ) : (
          <div className="space-y-4">
            {/* Active Announcements Section */}
            {activeAnnouncements.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-blue-700">
                    Active Announcements
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent" />
                </div>
                <div className="space-y-4">
                  {activeAnnouncements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Other Announcements Section (Expired/Draft/Archived) */}
            {otherAnnouncements.length > 0 && (
              <div>
                {activeAnnouncements.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 mt-6">
                    <Archive className="w-4 h-4 text-slate-500" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-600">
                      Past & Other Announcements
                    </h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                  </div>
                )}
                <div className="space-y-4">
                  {otherAnnouncements.map((announcement) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Info Section */}
        <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-800">Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <p className="text-xs text-slate-600 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
              Active announcements are current and not expired
            </p>
            <p className="text-xs text-slate-600 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
              Click "Read More" to view complete announcement details
            </p>
            <p className="text-xs text-slate-600 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
              Use filters to find announcements by audience or status
            </p>
            <p className="text-xs text-slate-600 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5" />
              Search by title or content to quickly find specific information
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAnnouncements;