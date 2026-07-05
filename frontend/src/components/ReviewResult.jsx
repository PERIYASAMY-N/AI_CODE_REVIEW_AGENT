import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Lightbulb, Activity, Code, Target, Shield, Cpu, Gauge, GitCompare } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { DiffViewer } from './DiffViewer';

const ResultSection = ({ title, items, icon: Icon, colorClass }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-gray-800 dark:bg-gray-800 border border-gray-700 p-5 rounded-xl shadow-lg mb-5 hover:border-gray-600 transition">
      <h3 className={`text-lg font-bold mb-3 flex items-center gap-2 ${colorClass}`}>
        <Icon className="w-5 h-5" /> {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start text-gray-300 text-sm bg-gray-900/60 p-3 rounded-lg">
            <span className="mr-3 text-gray-500 font-mono">{idx + 1}.</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ReviewResult = ({ result, language, score, risk, sourceCode }) => {
  const [showDiff, setShowDiff] = useState(false);

  if (!result) return null;

  const getRiskColor = (r) => {
    switch (r) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH':     return 'bg-orange-500 text-white';
      case 'MEDIUM':   return 'bg-yellow-500 text-gray-900';
      case 'LOW':      return 'bg-emerald-500 text-white';
      default:         return 'bg-gray-500 text-white';
    }
  };

  const getScoreColor = (s) => {
    if (s >= 80) return 'text-emerald-400';
    if (s >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="w-full pb-8">
      {/* Summary Header */}
      <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl shadow-xl mb-5 flex flex-col gap-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white">Review Summary</h2>
          <div className="flex gap-3">
            <div className="bg-gray-900 border border-gray-700 py-2 px-5 rounded-lg text-center shadow-inner">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Score</p>
              <p className={`text-2xl font-extrabold ${getScoreColor(score)}`}>{score}</p>
            </div>
            <div className={`py-2 px-5 rounded-lg text-center shadow-lg flex flex-col justify-center ${getRiskColor(risk)}`}>
              <p className="text-xs uppercase font-bold tracking-wider opacity-80 mb-0.5">Risk</p>
              <p className="text-lg font-extrabold">{risk}</p>
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed">{result.summary}</p>

        {/* Advanced Metrics */}
        {(result.security_score || result.complexity) && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {result.security_score && (
              <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg text-center">
                <Shield className={`w-4 h-4 mx-auto mb-1 ${getScoreColor(result.security_score)}`} />
                <span className="text-xs text-gray-400 block">Security</span>
                <span className={`font-bold text-sm ${getScoreColor(result.security_score)}`}>{result.security_score}%</span>
              </div>
            )}
            {result.maintainability_score && (
              <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg text-center">
                <Cpu className={`w-4 h-4 mx-auto mb-1 ${getScoreColor(result.maintainability_score)}`} />
                <span className="text-xs text-gray-400 block">Maintainability</span>
                <span className={`font-bold text-sm ${getScoreColor(result.maintainability_score)}`}>{result.maintainability_score}%</span>
              </div>
            )}
            {result.complexity && (
              <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg text-center">
                <Gauge className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                <span className="text-xs text-gray-400 block">Complexity</span>
                <span className="font-bold text-sm text-purple-400">{result.complexity}</span>
              </div>
            )}
            {result.estimated_time_complexity && (
              <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg text-center">
                <Activity className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                <span className="text-xs text-gray-400 block">Time Complexity</span>
                <span className="font-bold text-sm text-blue-400">{result.estimated_time_complexity}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <ResultSection title="Bugs"              items={result.bugs}             icon={AlertTriangle} colorClass="text-red-400" />
      <ResultSection title="Security Issues"   items={result.security_issues}  icon={ShieldAlert}   colorClass="text-orange-400" />
      <ResultSection title="Root Cause"        items={result.root_cause}       icon={Target}        colorClass="text-purple-400" />
      <ResultSection title="Best Practices"    items={result.best_practices}   icon={CheckCircle}   colorClass="text-emerald-400" />
      <ResultSection title="Optimizations"     items={result.optimizations}    icon={Lightbulb}     colorClass="text-yellow-400" />

      {/* Diff Viewer */}
      {result.corrected_code && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mt-2">
          <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
            <h3 className="font-bold text-blue-400 flex items-center gap-2">
              <Code className="w-5 h-5" /> Corrected Code
            </h3>
            {sourceCode && (
              <button
                onClick={() => setShowDiff(prev => !prev)}
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 transition"
              >
                <GitCompare className="w-4 h-4 text-purple-400" />
                {showDiff ? 'Show Editor' : 'Show Diff'}
              </button>
            )}
          </div>
          {showDiff && sourceCode ? (
            <DiffViewer original={sourceCode} corrected={result.corrected_code} language={language} />
          ) : (
            <div className="h-[380px]">
              <Editor
                height="100%"
                language={language?.toLowerCase()}
                theme="vs-dark"
                value={result.corrected_code}
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollbar: { verticalScrollbarSize: 6 } }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewResult;
