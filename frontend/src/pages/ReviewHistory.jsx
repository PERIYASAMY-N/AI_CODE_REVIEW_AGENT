import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FileCode, Calendar, Activity, Shield, ChevronRight, Trash2, Search, Filter, FileSearch } from 'lucide-react';
import { SkeletonCard, EmptyState } from '../components/UI';

const RISK_LEVELS = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const ReviewHistory = () => {
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchLang, setSearchLang] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [minScore, setMinScore]     = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchLang) params.language = searchLang;
      if (riskFilter) params.risk_level = riskFilter;
      if (minScore)   params.min_score = parseInt(minScore);
      const res = await api.get('/history', { params });
      setReviews(res.data.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleReset = () => {
    setSearchLang(''); setRiskFilter(''); setMinScore('');
    setTimeout(fetchHistory, 50);
  };

  const deleteReview = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await api.delete(`/history/${id}`);
      setReviews(r => r.filter(x => x.id !== id));
    } catch { /* ignore */ }
  };

  const getRiskBadge = risk => ({
    CRITICAL: 'bg-red-900/60 text-red-300 border-red-700',
    HIGH:     'bg-orange-900/60 text-orange-300 border-orange-700',
    MEDIUM:   'bg-yellow-900/60 text-yellow-300 border-yellow-700',
    LOW:      'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  }[risk] || 'bg-gray-700 text-gray-300 border-gray-600');

  const hasFilters = searchLang || riskFilter || minScore;

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-6">Review History</h1>

      {/* Filter Bar */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Language</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input value={searchLang} onChange={e => setSearchLang(e.target.value)}
              placeholder="e.g. python"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div className="min-w-[140px]">
          <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Risk Level</label>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
              className="appearance-none w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-9 pr-6 text-sm text-white focus:outline-none focus:border-blue-500">
              {RISK_LEVELS.map(r => <option key={r} value={r}>{r || 'All Risks'}</option>)}
            </select>
          </div>
        </div>
        <div className="min-w-[110px]">
          <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Min Score</label>
          <input type="number" min="0" max="100" value={minScore} onChange={e => setMinScore(e.target.value)}
            placeholder="0–100"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500" />
        </div>
        <button onClick={fetchHistory} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition">
          Search
        </button>
        {hasFilters && (
          <button onClick={handleReset} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 rounded-lg text-sm transition">
            Reset
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<FileSearch className="w-16 h-16 mx-auto" />}
          title={hasFilters ? 'No reviews match your filters' : 'No reviews yet'}
          description={hasFilters ? 'Try adjusting your search criteria.' : 'Run your first AI code review to see results here.'}
          action={
            hasFilters
              ? <button onClick={handleReset} className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-lg text-sm transition">Clear Filters</button>
              : <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm transition inline-block">Analyze Code</Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 mb-2">{reviews.length} review{reviews.length !== 1 ? 's' : ''} found</p>
          {reviews.map(review => (
            <Link key={review.id} to={`/history/${review.id}`} className="block group">
              <div className="bg-gray-800 border border-gray-700 hover:border-blue-500 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center transition duration-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-xs font-semibold border border-gray-600 flex items-center gap-1">
                      <FileCode className="w-3 h-3" /> {review.language}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getRiskBadge(review.risk_level)}`}>
                      <Shield className="w-3 h-3" /> {review.risk_level}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-400 text-xs gap-5">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(review.created_at).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-blue-400" /> Score: <strong className="text-white ml-1">{review.overall_score}/100</strong></span>
                  </div>
                </div>
                <div className="mt-3 md:mt-0 flex items-center gap-3">
                  <button onClick={e => deleteReview(review.id, e)} title="Delete"
                    className="p-2 text-gray-500 hover:text-red-400 transition hover:bg-gray-700 rounded-full">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2 bg-gray-700 text-gray-300 rounded-full group-hover:bg-blue-600 group-hover:text-white transition">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewHistory;
