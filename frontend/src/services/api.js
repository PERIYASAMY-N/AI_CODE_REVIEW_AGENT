import axios from 'axios';

// VITE_API_URL must be set in the Render dashboard (Environment tab).
// It is baked into the build at compile time by Vite.
// For local dev it is read from frontend/.env (which is gitignored).
//
// If neither is set, the app logs a clear warning so it is easy to diagnose.
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error(
    '[api.js] VITE_API_URL is not set. ' +
    'For local dev: add it to frontend/.env. ' +
    'For Render: set it in the dashboard → Environment tab.'
  );
}

const api = axios.create({
  baseURL: API_URL,
});

// Attach JWT token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler — clears stale token and redirects to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
