import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Activity, ShieldAlert, ShieldCheck, Shield, FileCode } from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { Link } from 'react-router-dom';

const StatsCard = ({ title, value, icon, colorClass }) => (
  <div className={`bg-gray-800 border border-gray-700 px-4 py-3 rounded-lg flex items-center gap-3 shadow hover:border-gray-500 transition`}>
    <div className={`p-2.5 rounded-lg ${colorClass} bg-opacity-10 flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-xs uppercase tracking-wider leading-none mb-0.5">{title}</p>
      <h3 className="text-2xl font-extrabold text-white leading-none">{value ?? '—'}</h3>
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
    // Outer shell: full viewport height below navbar, no overflow on the shell itself
    <div className="flex flex-col w-full" style={{ height: 'calc(100vh - 57px)' }}>

      {/* ── Stats bar (fixed-height, full width) ──────────────────────────────── */}
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {loading ? (
            <div className="flex gap-3 flex-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 w-36 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !stats ? (
            <p className="text-gray-500 text-xs">Could not load statistics.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 flex-1">
              <StatsCard title="Total Reviews" value={stats.total_reviews}       icon={<FileCode    className="w-5 h-5 text-blue-400"    />} colorClass="bg-blue-500" />
              <StatsCard title="Avg Score"     value={stats.average_score}       icon={<Activity    className="w-5 h-5 text-emerald-400" />} colorClass="bg-emerald-500" />
              <StatsCard title="High Risk"     value={stats.high_risk_reviews}   icon={<ShieldAlert className="w-5 h-5 text-red-400"     />} colorClass="bg-red-500" />
              <StatsCard title="Medium Risk"   value={stats.medium_risk_reviews} icon={<Shield      className="w-5 h-5 text-yellow-400"  />} colorClass="bg-yellow-500" />
              <StatsCard title="Low Risk"      value={stats.low_risk_reviews}    icon={<ShieldCheck className="w-5 h-5 text-green-400"   />} colorClass="bg-green-500" />
            </div>
          )}
          <Link to="/history" className="text-xs text-blue-400 hover:text-blue-300 transition flex-shrink-0">
            All reviews →
          </Link>
        </div>
      </div>

      {/* ── IDE Workspace (fills remaining height) ────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <CodeEditor />
      </div>
    </div>
  );
};

export default Dashboard;
