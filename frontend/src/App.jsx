import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReviewHistory from './pages/ReviewHistory';
import ReviewDetails from './pages/ReviewDetails';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Landing from './pages/Landing';

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <Navbar />
            <div className="container mx-auto px-4 pb-12 max-w-7xl">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/history"   element={<ProtectedRoute><ReviewHistory /></ProtectedRoute>} />
                <Route path="/history/:id" element={<ProtectedRoute><ReviewDetails /></ProtectedRoute>} />
                <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/admin"     element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              </Routes>
            </div>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
