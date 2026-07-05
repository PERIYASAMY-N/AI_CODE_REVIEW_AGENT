import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Code, Loader2, Cpu } from 'lucide-react';
import FileUpload from './FileUpload';
import ReviewResult from './ReviewResult';
import api from '../services/api';
import { LANGUAGES, AI_MODELS } from './DiffViewer';

const CodeEditor = () => {
  const [code, setCode] = useState('// Paste your code here or upload a file...');
  const [language, setLanguage] = useState('java');
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [analyzing, setAnalyzing] = useState(false);
  const [review, setReview] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = (content, lang) => {
    setCode(content);
    setLanguage(lang);
    setReview(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!code.trim() || code.trim().startsWith('// Paste your code here')) return;
    setAnalyzing(true);
    setError(null);
    setReview(null);
    try {
      const res = await api.post('/review/analyze', {
        language,
        source_code: code,
        model_name: selectedModel,
      });
      setReview({ ...res.data, _sourceCode: code });
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. You can run 5 reviews per minute. Please wait and try again.');
      } else {
        setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-[700px]">
      {/* Editor Panel */}
      <div className="flex-1 flex flex-col bg-gray-800 dark:bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-gray-900 border-b border-gray-700 p-3 flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-3">
          <div className="flex items-center flex-wrap gap-2">
            {/* Language */}
            <div className="relative">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="appearance-none bg-gray-800 border border-gray-700 text-gray-200 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
              >
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <Code className="absolute right-2 top-2.5 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>

            {/* Model Selector */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="appearance-none bg-gray-800 border border-gray-700 text-gray-200 py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
              >
                {AI_MODELS.map(m => <option key={m.id} value={m.id}>{m.label} — {m.badge}</option>)}
              </select>
              <Cpu className="absolute right-2 top-2.5 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
            </div>

            <FileUpload onFileContent={handleFileUpload} />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className={`flex items-center px-5 py-2 rounded-lg font-bold transition text-sm shadow-lg
              ${analyzing
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white transform hover:-translate-y-0.5'}`}
          >
            {analyzing
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
              : <><Play className="w-4 h-4 mr-2" /> Analyze Code</>}
          </button>
        </div>

        <div className="flex-1 h-[550px] xl:h-auto">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={v => setCode(v || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Fira Code', monospace",
              padding: { top: 12 },
              scrollbar: { verticalScrollbarSize: 6 },
            }}
          />
        </div>
      </div>

      {/* Results Panel */}
      {(review || error || analyzing) && (
        <div className="xl:w-[48%] flex flex-col border border-gray-700 rounded-xl overflow-hidden shadow-2xl bg-gray-900">
          <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
            <h3 className="font-bold text-white">Analysis Results</h3>
            {review && (
              <span className="text-xs text-gray-500">
                Model: {AI_MODELS.find(m => m.id === selectedModel)?.label}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {analyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-16">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                <p className="animate-pulse text-sm">Deep AI analysis in progress...</p>
              </div>
            ) : error ? (
              <div className="flex items-start justify-center pt-12">
                <div className="bg-red-900/40 border border-red-600 text-red-200 p-6 rounded-xl max-w-md text-center">
                  <p className="font-bold mb-2">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : review ? (
              <ReviewResult
                result={review}
                language={review.language}
                score={review.overall_score}
                risk={review.risk_level}
                sourceCode={code}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
