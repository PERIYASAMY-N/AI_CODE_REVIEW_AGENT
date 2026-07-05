import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { User, Lock, Save, BarChart2 } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [name, setName]           = useState(user?.name || '');
  const [oldPassword, setOld]     = useState('');
  const [newPassword, setNew]     = useState('');
  const [nameMsg, setNameMsg]     = useState(null);
  const [pwMsg, setPwMsg]         = useState(null);
  const [nameErr, setNameErr]     = useState(null);
  const [pwErr, setPwErr]         = useState(null);

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setNameMsg(null); setNameErr(null);
    try {
      await api.put('/users/me', { name });
      setNameMsg('Name updated successfully!');
    } catch (err) {
      setNameErr(err.response?.data?.detail || 'Failed to update name.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg(null); setPwErr(null);
    try {
      await api.put('/users/me/password', { old_password: oldPassword, new_password: newPassword });
      setPwMsg('Password changed successfully!');
      setOld(''); setNew('');
    } catch (err) {
      setPwErr(err.response?.data?.detail || 'Failed to change password.');
    }
  };

  return (
    <div className="py-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {/* Account Info Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            {user?.is_admin && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-900/50 text-purple-300 border border-purple-700 rounded-full">Admin</span>
            )}
          </div>
        </div>

        {/* Update Name */}
        <form onSubmit={handleNameUpdate} className="space-y-3">
          <label className="block text-sm text-gray-400 font-medium">Display Name</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition">
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
          {nameMsg && <p className="text-emerald-400 text-sm">{nameMsg}</p>}
          {nameErr && <p className="text-red-400 text-sm">{nameErr}</p>}
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
          <Lock className="w-5 h-5 text-yellow-400" /> Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Current Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={e => setOld(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNew(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-2.5 rounded-lg font-medium text-sm transition">
            Change Password
          </button>
          {pwMsg && <p className="text-emerald-400 text-sm">{pwMsg}</p>}
          {pwErr && <p className="text-red-400 text-sm">{pwErr}</p>}
        </form>
      </div>
    </div>
  );
};

export default Profile;
