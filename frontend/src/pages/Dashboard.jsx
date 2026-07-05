import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Activity, ShieldAlert, ShieldCheck, Shield, FileCode, CheckCircle } from 'lucide-react';
import { SkeletonStat, EmptyState } from '../components/UI';
import CodeEditor from '../components/CodeEditor';
import { Link } from 'react-router-dom';

const StatsCard = ({ title, value, icon, colorClass }) => (
  <div className="bg-gray-800 dark:bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center gap-4 shadow-lg hover:scale-105 transition-transform duration-200">
    <div className={`p-4 rounded-full ${colorClass} bg-opacity-10 flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-extrabold text-white">{value ?? '—'}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link to="/history" className="text-sm text-blue-400 hover:text-blue-300 transition">
          View all reviews →
        </Link>
      </div>

      {/* Stats Row */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {[...Array(5)].map((_, i) => <SkeletonStat key={i} />)}
        </div>
      ) : !stats ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-12 text-center text-gray-400 text-sm">
          Could not load statistics. Please refresh.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          <StatsCard title="Total Reviews"   value={stats.total_reviews}       icon={<FileCode   className="w-7 h-7 text-blue-400" />}    colorClass="bg-blue-500" />
          <StatsCard title="Average Score"   value={stats.average_score}       icon={<Activity   className="w-7 h-7 text-emerald-400" />} colorClass="bg-emerald-500" />
          <StatsCard title="High Risk"       value={stats.high_risk_reviews}   icon={<ShieldAlert className="w-7 h-7 text-red-400" />}   colorClass="bg-red-500" />
          <StatsCard title="Medium Risk"     value={stats.medium_risk_reviews} icon={<Shield     className="w-7 h-7 text-yellow-400" />} colorClass="bg-yellow-500" />
          <StatsCard title="Low Risk"        value={stats.low_risk_reviews}    icon={<ShieldCheck className="w-7 h-7 text-green-400" />} colorClass="bg-green-500" />
        </div>
      )}

      {/* Code Editor */}
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CheckCircle className="w-6 h-6 text-emerald-400" /> New Review
      </h2>
      <CodeEditor />
    </div>
  );
};

export default Dashboard;
