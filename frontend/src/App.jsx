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
          {/* Full-screen shell — no max-width, no padding at this level */}
          <div
            className="flex flex-col min-h-screen w-full overflow-hidden transition-colors duration-300"
            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            <Navbar />

            {/* Routes that need the IDE full-bleed layout (Dashboard) get no wrapper.
                All other routes keep their comfortable centered container. */}
            <Routes>
              <Route path="/" element={
                <div className="container mx-auto px-4 pb-12 max-w-7xl">
                  <Landing />
                </div>
              } />
              <Route path="/login"    element={<div className="container mx-auto px-4 pb-12 max-w-7xl"><Login /></div>} />
              <Route path="/register" element={<div className="container mx-auto px-4 pb-12 max-w-7xl"><Register /></div>} />

              {/* Dashboard — full-bleed, no container wrapper */}
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />

              <Route path="/history" element={
                <ProtectedRoute>
                  <div className="container mx-auto px-4 pb-12 max-w-7xl"><ReviewHistory /></div>
                </ProtectedRoute>
              } />
              <Route path="/history/:id" element={
                <ProtectedRoute>
                  <div className="container mx-auto px-4 pb-12 max-w-7xl"><ReviewDetails /></div>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <div className="container mx-auto px-4 pb-12 max-w-7xl"><Profile /></div>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <div className="container mx-auto px-4 pb-12 max-w-7xl"><AdminDashboard /></div>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
