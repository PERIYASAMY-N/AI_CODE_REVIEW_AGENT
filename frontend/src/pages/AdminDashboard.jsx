import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, FileCode, Activity, BarChart2, ShieldCheck } from 'lucide-react';

const AdminCard = ({ title, value, icon, color }) => (
  <div className={`bg-gray-800 border border-gray-700 rounded-xl p-6 flex items-center gap-5 shadow-lg hover:scale-105 transition-transform`}>
    <div className={`p-4 rounded-full ${color} bg-opacity-20`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-3xl font-extrabold text-white">{value}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(err => setError(err.response?.data?.detail || 'Access denied or failed to load.'));
  }, []);

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-purple-400" /> Admin Dashboard
      </h1>
      <p className="text-gray-400 mb-8 text-sm">Platform-wide statistics visible only to administrators.</p>

      {error ? (
        <div className="bg-red-900/40 border border-red-600 text-red-300 p-6 rounded-xl max-w-md">
          <strong>Error:</strong> {error}
        </div>
      ) : !stats ? (
        <div className="text-gray-400">Loading admin stats...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <AdminCard
            title="Total Users"
            value={stats.total_users}
            icon={<Users className="w-8 h-8 text-blue-400" />}
            color="bg-blue-500"
          />
          <AdminCard
            title="Total Reviews"
            value={stats.total_reviews}
            icon={<FileCode className="w-8 h-8 text-emerald-400" />}
            color="bg-emerald-500"
          />
          <AdminCard
            title="Most Used Language"
            value={stats.most_used_language}
            icon={<BarChart2 className="w-8 h-8 text-yellow-400" />}
            color="bg-yellow-500"
          />
          <AdminCard
            title="Average Score"
            value={`${stats.average_score}/100`}
            icon={<Activity className="w-8 h-8 text-purple-400" />}
            color="bg-purple-500"
          />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
