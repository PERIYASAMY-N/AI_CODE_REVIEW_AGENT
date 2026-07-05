import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play, Code, Loader2, Cpu, AlertCircle, X,
  Upload, ChevronDown, Sparkles, Zap, BookOpen,
} from 'lucide-react';
import FileUpload from './FileUpload';
import ReviewResult from './ReviewResult';
import DiffModal from './DiffModal';
import api from '../services/api';
import { LANGUAGES, AI_MODELS } from './DiffViewer';

// ─── Splitter hook (60 / 40 default) ─────────────────────────────────────────
const MIN_LEFT_PCT = 30;
const MAX_LEFT_PCT = 80;

function useSplitter(initialPct = 60) {
  const [leftPct, setLeftPct] = useState(initialPct);
  const dragging = useRef(false);
  const containerRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, pct)));
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return { leftPct, containerRef, onMouseDown };
}

// ─── Language extension map ───────────────────────────────────────────────────
const EXT_MAP = { java: 'java', python: 'py', javascript: 'js', typescript: 'ts', cpp: 'cpp', csharp: 'cs', c: 'c' };

// ─── Friendly select pill ─────────────────────────────────────────────────────
const SelectPill = ({ value, onChange, options, icon: Icon, color }) => (
  <div className="relative inline-flex items-center">
    <div className={`absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none`}>
      <Icon className={`w-3.5 h-3.5 ${color}`} />
    </div>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`appearance-none bg-gray-800/80 border border-gray-700 text-gray-200
        py-1.5 pl-8 pr-6 rounded-xl text-xs font-semibold
        focus:outline-none focus:ring-2 focus:ring-blue-500/40
        hover:border-gray-500 hover:bg-gray-700/80 transition cursor-pointer`}
    >
      {options.map(o => (
        <option key={o.value ?? o.id} value={o.value ?? o.id}>
          {o.label}{o.badge ? ` · ${o.badge}` : ''}
        </option>
      ))}
    </select>
    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
  </div>
);

// ─── Step hint shown in the idle state ───────────────────────────────────────
const Step = ({ num, text, active }) => (
  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition
    ${active ? 'bg-blue-500/10 border border-blue-500/20' : 'opacity-40'}`}>
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
      ${active ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
      {num}
    </span>
    <span className={`text-sm ${active ? 'text-gray-200' : 'text-gray-500'}`}>{text}</span>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const CodeEditor = () => {
  const [code, setCode]                   = useState('');
  const [language, setLanguage]           = useState('java');
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [analyzing, setAnalyzing]         = useState(false);
  const [review, setReview]               = useState(null);
  const [error, setError]                 = useState(null);
  const [diffOpen, setDiffOpen]           = useState(false);

  const { leftPct, containerRef, onMouseDown } = useSplitter(60);
  const rightPct = 100 - leftPct;

  const hasCode = code.trim().length > 0;

  const handleFileUpload = (content, lang) => {
    setCode(content);
    setLanguage(lang);
    setReview(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!hasCode) return;
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
        setError('Rate limit reached — 5 reviews per minute. Please wait a moment and try again.');
      } else {
        setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const currentModel = AI_MODELS.find(m => m.id === selectedModel);
  const ext = EXT_MAP[language] ?? language;

  // Determine which step the user is on for the idle hint
  const currentStep = !hasCode ? 1 : !review ? 2 : 3;

  return (
    <>
      <div ref={containerRef} className="flex w-full h-full select-none"
        style={{ background: 'linear-gradient(180deg, #0c0f1a 0%, #0d1117 100%)' }}>

        {/* ══════════════════════════════════════════════════════════════════
            LEFT PANEL — Code Editor
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col min-w-0 h-full border-r border-gray-800/80"
          style={{ width: `${leftPct}%` }}>

          {/* ── Toolbar ── */}
          <div className="flex-shrink-0 flex items-center justify-between gap-2 px-3 py-2
            bg-gray-900/90 border-b border-gray-800 backdrop-blur-sm">

            {/* File tab */}
            <div className="flex items-center gap-1 min-w-0">
              <div className="flex items-center gap-1.5 bg-gray-800 border border-gray-700/60 px-3 py-1.5
                rounded-lg text-xs text-gray-300 font-mono group">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  review ? 'bg-emerald-400 animate-pulse-slow' :
                  analyzing ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
                <Code className="w-3 h-3 text-blue-400" />
                <span className="truncate max-w-[100px]">solution.{ext}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <SelectPill
                value={language}
                onChange={(v) => { setLanguage(v); setReview(null); setError(null); }}
                options={LANGUAGES}
                icon={Code}
                color="text-blue-400"
              />
              <SelectPill
                value={selectedModel}
                onChange={setSelectedModel}
                options={AI_MODELS}
                icon={Cpu}
                color="text-purple-400"
              />
              <FileUpload onFileContent={handleFileUpload} />

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !hasCode}
                className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold
                  transition-all duration-200 shadow-lg overflow-hidden
                  ${analyzing
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : !hasCode
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:shadow-blue-500/25 hover:scale-105 active:scale-95'}`}
              >
                {/* shimmer on hover */}
                {hasCode && !analyzing && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                    translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
                )}
                {analyzing
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</>
                  : <><Zap className="w-3.5 h-3.5" /> Analyze Code</>}
              </button>
            </div>
          </div>

          {/* ── Monaco Editor ── */}
          <div className="flex-1 min-h-0 relative">
            {!hasCode && (
              /* Placeholder overlay */
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center
                    justify-center mx-auto mb-3">
                    <Code className="w-6 h-6 text-blue-400/50" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Paste or upload your code</p>
                  <p className="text-gray-700 text-xs mt-1">Java · Python · JavaScript · TypeScript · C / C++ · C#</p>
                </div>
              </div>
            )}
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={v => setCode(v || '')}
              options={{
                minimap: { enabled: true, scale: 1 },
                fontSize: 14,
                fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
                fontLigatures: true,
                padding: { top: 16, bottom: 16 },
                scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
                lineNumbers: 'on',
                renderLineHighlight: 'gutter',
                bracketPairColorization: { enabled: true },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                wordWrap: 'off',
                guides: { bracketPairs: true },
              }}
            />
          </div>

          {/* ── VS Code–style status bar ── */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 py-1
            text-[11px] font-mono border-t border-gray-800"
            style={{ background: analyzing ? 'linear-gradient(90deg, #1d4ed8, #7c3aed)' : '#1a1f2e' }}>
            <div className="flex items-center gap-3 text-blue-300/70">
              <span className="uppercase">{language}</span>
              <span className="opacity-40">|</span>
              <span>{code.split('\n').length} lines</span>
              {hasCode && <span className="opacity-40">|</span>}
              {hasCode && <span>{code.length} chars</span>}
            </div>
            <div className="flex items-center gap-2">
              {analyzing && (
                <span className="text-yellow-300 animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Analyzing with {currentModel?.label}…
                </span>
              )}
              {review && !analyzing && (
                <span className="text-emerald-400 flex items-center gap-1">
                  ✓ Score: <strong>{review.overall_score}/100</strong>
                  <span className="opacity-50">·</span>
                  {review.risk_level}
                </span>
              )}
            </div>
            <span className="text-gray-600">{currentModel?.label}</span>
          </div>
        </div>

        {/* ══ DRAG HANDLE ══════════════════════════════════════════════════════ */}
        <div
          onMouseDown={onMouseDown}
          className="relative flex-shrink-0 w-1 group cursor-col-resize z-10 transition-all duration-150"
          style={{ background: 'linear-gradient(180deg, transparent, #3b82f6aa, transparent)' }}
          title="Drag to resize">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center
            justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />
            ))}
          </div>
          {/* Expanded hit area */}
          <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            RIGHT PANEL — Results
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col min-w-0 h-full" style={{ width: `${rightPct}%` }}>

          {/* Panel header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2
            bg-gray-900/90 border-b border-gray-800 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-bold text-gray-300 tracking-wide">
                {review ? 'AI Review Results' : 'Analysis Panel'}
              </h2>
              {review && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ml-1
                  ${review.risk_level === 'LOW'    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                    review.risk_level === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'  :
                    'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                  {review.risk_level} RISK
                </span>
              )}
            </div>
            {review?.corrected_code && (
              <button
                onClick={() => setDiffOpen(true)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg
                  bg-purple-600/20 border border-purple-500/30 text-purple-300
                  hover:bg-purple-600/30 transition font-medium">
                ⇄ Compare Changes
              </button>
            )}
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar"
            style={{ background: 'linear-gradient(180deg, #0d1117 0%, #0c0f1a 100%)' }}>

            {/* ── Idle: step guide ── */}
            {!analyzing && !review && !error && (
              <div className="flex flex-col justify-center h-full px-6 py-8 gap-3 animate-fade-in">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center
                    bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20">
                    <Sparkles className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-1">Ready to Review</h3>
                  <p className="text-gray-500 text-sm">Follow the steps to get AI-powered feedback</p>
                </div>

                <div className="space-y-2">
                  <Step num={1} text="Paste or upload your source code" active={currentStep === 1} />
                  <Step num={2} text="Choose language and AI model, then click Analyze" active={currentStep === 2} />
                  <Step num={3} text="Read your personalised AI review results" active={currentStep === 3} />
                </div>

                {/* Tip */}
                <div className="mt-4 bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3">
                  <p className="text-blue-300 text-xs font-semibold mb-0.5">💡 Pro tip</p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Supported: Java, Python, JavaScript, TypeScript, C, C++, C#.
                    Upload a file or paste directly into the editor.
                  </p>
                </div>
              </div>
            )}

            {/* ── Loading ── */}
            {analyzing && (
              <div className="flex flex-col items-center justify-center h-full gap-6 animate-fade-in px-6">
                {/* Animated orb */}
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-30 animate-ping"
                    style={{ animationDelay: '0.3s' }} />
                  <div className="absolute inset-0 rounded-full border-4 border-gray-800 border-t-blue-500 animate-spin" />
                  <Cpu className="absolute inset-0 m-auto w-7 h-7 text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-base mb-1 animate-pulse">Analyzing your code…</p>
                  <p className="text-gray-400 text-sm mb-3">
                    {currentModel?.label} is reviewing for bugs, security issues, and improvements
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                    {['Scanning bugs', 'Checking security', 'Finding optimizations', 'Generating fixes'].map((s, i) => (
                      <span key={i} className="flex items-center gap-1 animate-pulse"
                        style={{ animationDelay: `${i * 0.4}s` }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Error ── */}
            {error && !analyzing && (
              <div className="m-4 animate-fade-in">
                <div className="flex items-start gap-3 rounded-xl p-4 border
                  bg-red-950/30 border-red-700/40">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-300 font-semibold text-sm mb-0.5">Analysis Failed</p>
                    <p className="text-red-400/80 text-xs leading-relaxed">{error}</p>
                  </div>
                  <button onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-300 transition flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── Results ── */}
            {review && !analyzing && (
              <div className="p-4 animate-fade-in">
                <ReviewResult
                  result={review}
                  language={language}
                  score={review.overall_score}
                  risk={review.risk_level}
                  sourceCode={code}
                  onOpenDiff={() => setDiffOpen(true)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Diff Modal ── */}
      {diffOpen && review?.corrected_code && (
        <DiffModal
          original={code}
          corrected={review.corrected_code}
          language={language}
          onClose={() => setDiffOpen(false)}
        />
      )}
    </>
  );
};

export default CodeEditor;
