import React from 'react';

// Full-page spinner for auth/loading states
export const PageSpinner = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
    <p className="text-gray-400 text-sm animate-pulse">{message}</p>
  </div>
);

// Inline spinner for buttons
export const ButtonSpinner = () => (
  <svg className="animate-spin h-4 w-4 mr-2 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

// Skeleton loader card
export const SkeletonCard = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 animate-pulse">
    <div className="flex gap-3 mb-3">
      <div className="h-5 w-20 bg-gray-700 rounded-full" />
      <div className="h-5 w-24 bg-gray-700 rounded-full" />
    </div>
    <div className="h-4 w-48 bg-gray-700 rounded mb-2" />
    <div className="h-4 w-32 bg-gray-700 rounded" />
  </div>
);

// Skeleton stats card
export const SkeletonStat = () => (
  <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex items-center gap-4 animate-pulse">
    <div className="w-14 h-14 bg-gray-700 rounded-full" />
    <div>
      <div className="h-3 w-24 bg-gray-700 rounded mb-2" />
      <div className="h-8 w-16 bg-gray-700 rounded" />
    </div>
  </div>
);

// Empty state with icon + CTA
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="text-5xl mb-4 opacity-30">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-300 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm mb-6 max-w-sm">{description}</p>
    {action}
  </div>
);

// Dismissible error alert
export const ErrorAlert = ({ message, onDismiss }) => (
  <div className="flex items-start gap-3 bg-red-900/40 border border-red-700 text-red-200 px-4 py-3 rounded-xl text-sm animate-fade-in">
    <span className="mt-0.5">⚠️</span>
    <span className="flex-1">{message}</span>
    {onDismiss && (
      <button onClick={onDismiss} className="text-red-400 hover:text-red-200 transition ml-2 shrink-0">✕</button>
    )}
  </div>
);

// Success alert
export const SuccessAlert = ({ message }) => (
  <div className="flex items-center gap-3 bg-emerald-900/40 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl text-sm">
    <span>✅</span>
    <span>{message}</span>
  </div>
);
