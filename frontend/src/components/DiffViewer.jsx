import React from 'react';

// Supported languages — single source of truth shared with FileUpload and CodeEditor
export const LANGUAGES = [
  { value: 'java',       label: 'Java' },
  { value: 'python',     label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'c',          label: 'C' },
  { value: 'cpp',        label: 'C++' },
  { value: 'csharp',     label: 'C#' },
];

// Valid, active Groq models only.
// deepseek-r1-distill-llama-70b is REMOVED — Groq decommissioned it.
// IDs must exactly match SUPPORTED_MODELS in backend/app/schemas/review_request.py.
export const AI_MODELS = [
  {
    id: 'llama-3.3-70b-versatile',
    label: 'Llama 3.3 70B',
    badge: 'Recommended',
  },
  {
    id: 'llama-3.1-70b-versatile',
    label: 'Llama 3.1 70B',
    badge: 'Stable',
  },
  {
    id: 'mixtral-8x7b-32768',
    label: 'Mixtral 8x7B',
    badge: 'Fast',
  },
];

export const DiffViewer = ({ original, corrected, language }) => {
  const originalLines  = (original  || '').split('\n');
  const correctedLines = (corrected || '').split('\n');

  return (
    <div className="grid grid-cols-2 gap-0 border border-gray-700 rounded-xl overflow-hidden text-xs font-mono">
      {/* Original */}
      <div className="bg-gray-900 border-r border-gray-700">
        <div className="bg-red-900/30 border-b border-gray-700 px-4 py-2 text-red-400 font-semibold text-sm">
          ← Original Code
        </div>
        <div className="overflow-auto max-h-[400px]">
          {originalLines.map((line, i) => (
            <div key={i} className={`flex ${correctedLines[i] !== line ? 'diff-removed' : ''}`}>
              <span className="select-none w-8 text-right text-gray-600 pr-3 py-0.5 shrink-0">{i + 1}</span>
              <span className="py-0.5 px-2 break-all whitespace-pre-wrap">{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Corrected */}
      <div className="bg-gray-900">
        <div className="bg-emerald-900/30 border-b border-gray-700 px-4 py-2 text-emerald-400 font-semibold text-sm">
          → Corrected Code
        </div>
        <div className="overflow-auto max-h-[400px]">
          {correctedLines.map((line, i) => (
            <div key={i} className={`flex ${originalLines[i] !== line ? 'diff-added' : ''}`}>
              <span className="select-none w-8 text-right text-gray-600 pr-3 py-0.5 shrink-0">{i + 1}</span>
              <span className="py-0.5 px-2 break-all whitespace-pre-wrap">{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
