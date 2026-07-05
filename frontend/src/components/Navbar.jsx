import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LogOut, Home, History, User, Sun, Moon, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const location = useLocation();

  const navLink = (to, icon, label) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition
          ${active
            ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
      >
        {icon} {label}
      </Link>
    );
  };

  return (
    <nav className="bg-gray-800 dark:bg-gray-900 border-b border-gray-700 px-4 py-3 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto flex justify-between items-center max-w-7xl">

        {/* Brand */}
        <Link
          to="/"
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 flex items-center gap-2"
        >
          <ShieldCheck className="w-6 h-6 text-blue-400" />
          AI Code Review
        </Link>

        {/* Right side */}
        {user ? (
          <div className="flex items-center gap-2">
            {navLink('/dashboard', <Home    className="w-4 h-4" />, 'Dashboard')}
            {navLink('/history',   <History className="w-4 h-4" />, 'History')}
            {navLink('/profile',   <User    className="w-4 h-4" />, 'Profile')}
            {user.is_admin && navLink('/admin', <ShieldCheck className="w-4 h-4" />, 'Admin')}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition ml-1"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg border border-transparent hover:border-red-800 transition ml-1"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link to="/login"    className="text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition">Login</Link>
            <Link to="/register" className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition font-medium">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
