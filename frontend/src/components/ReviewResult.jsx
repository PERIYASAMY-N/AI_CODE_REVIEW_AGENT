import React, { useState } from 'react';
import {
  AlertTriangle, ShieldAlert, CheckCircle, Lightbulb,
  Activity, Code, Target, Shield, Cpu, Gauge, GitCompare,
  ChevronDown, ChevronRight, Bug, Wrench,
} from 'lucide-react';
import Editor from '@monaco-editor/react';

// ─── Severity helpers ─────────────────────────────────────────────────────────
// Heuristic: infer a severity badge from the item text so we don't need backend changes
function inferSeverity(text) {
  const t = text.toLowerCase();
  if (t.includes('critical') || t.includes('null pointer') || t.includes('sql inject') || t.includes('rce') || t.includes('remote code'))
    return 'CRITICAL';
  if (t.includes('high') || t.includes('xss') || t.includes('vulnerability') || t.includes('buffer overflow') || t.includes('memory leak'))
    return 'HIGH';
  if (t.includes('medium') || t.includes('validation') || t.includes('error handling') || t.includes('exception'))
    return 'MEDIUM';
  return 'LOW';
}

const SEVERITY_BADGE = {
  CRITICAL: 'bg-red-500/25 text-red-300 border border-red-500/40',
  HIGH:     'bg-orange-500/25 text-orange-300 border border-orange-500/40',
  MEDIUM:   'bg-yellow-500/25 text-yellow-300 border border-yellow-500/40',
  LOW:      'bg-blue-500/25 text-blue-300 border border-blue-500/40',
};

// ─── Section config ───────────────────────────────────────────────────────────
// Each section gets a unique visual identity: border colour, icon colour, header tint
const SECTION_CONFIG = {
  security: {
    title: 'Security Issues',
    icon: ShieldAlert,
    border: 'border-red-700/50',
    headerBg: 'bg-red-950/40',
    headerText: 'text-red-400',
    badgeBg: 'bg-red-500/20 text-red-300 border border-red-500/30',
    itemHover: 'hover:bg-red-950/30',
    numberColor: 'text-red-700',
    leftBar: 'bg-red-600',
  },
  bugs: {
    title: 'Bugs',
    icon: Bug,
    border: 'border-orange-700/50',
    headerBg: 'bg-orange-950/40',
    headerText: 'text-orange-400',
    badgeBg: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    itemHover: 'hover:bg-orange-950/30',
    numberColor: 'text-orange-700',
    leftBar: 'bg-orange-500',
  },
  root_cause: {
    title: 'Root Cause',
    icon: Target,
    border: 'border-purple-700/50',
    headerBg: 'bg-purple-950/40',
    headerText: 'text-purple-400',
    badgeBg: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    itemHover: 'hover:bg-purple-950/30',
    numberColor: 'text-purple-700',
    leftBar: 'bg-purple-500',
  },
  best_practices: {
    title: 'Best Practices',
    icon: CheckCircle,
    border: 'border-emerald-700/50',
    headerBg: 'bg-emerald-950/40',
    headerText: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    itemHover: 'hover:bg-emerald-950/30',
    numberColor: 'text-emerald-700',
    leftBar: 'bg-emerald-500',
  },
  optimizations: {
    title: 'Optimizations',
    icon: Lightbulb,
    border: 'border-yellow-700/50',
    headerBg: 'bg-yellow-950/40',
    headerText: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    itemHover: 'hover:bg-yellow-950/30',
    numberColor: 'text-yellow-700',
    leftBar: 'bg-yellow-500',
  },
};

// ─── Accordion Section ────────────────────────────────────────────────────────
const AccordionSection = ({ sectionKey, items }) => {
  const [open, setOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState(new Set());

  if (!items || items.length === 0) return null;

  const cfg = SECTION_CONFIG[sectionKey];
  const Icon = cfg.icon;

  const toggleItem = (idx) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className={`border ${cfg.border} rounded-xl overflow-hidden mb-3`}>
      {/* Section header — click to collapse entire section */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 ${cfg.headerBg} transition hover:brightness-110`}
      >
        <Icon className={`w-4 h-4 ${cfg.headerText} flex-shrink-0`} />
        <span className={`text-sm font-bold uppercase tracking-wider ${cfg.headerText} flex-1 text-left`}>
          {cfg.title}
        </span>
        {/* Count badge */}
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>
          {items.length}
        </span>
        {open
          ? <ChevronDown className={`w-4 h-4 ${cfg.headerText} flex-shrink-0`} />
          : <ChevronRight className={`w-4 h-4 ${cfg.headerText} flex-shrink-0`} />}
      </button>

      {/* Items — each is its own mini accordion */}
      {open && (
        <ul className="divide-y divide-gray-800/50">
          {items.map((item, idx) => {
            const severity = (sectionKey === 'security' || sectionKey === 'bugs')
              ? inferSeverity(item)
              : null;
            const expanded = expandedItems.has(idx);
            // Truncate long items to 120 chars in collapsed state
            const preview = item.length > 120 ? item.slice(0, 120) + '…' : item;

            return (
              <li
                key={idx}
                className={`relative flex items-start gap-3 px-4 py-3 cursor-pointer
                  ${cfg.itemHover} transition select-text`}
                onClick={() => item.length > 120 && toggleItem(idx)}
              >
                {/* Left colour bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${cfg.leftBar}`} />

                {/* Number */}
                <span className={`text-xs font-mono font-bold ${cfg.numberColor} mt-0.5 w-5 text-right flex-shrink-0`}>
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {severity && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SEVERITY_BADGE[severity]}`}>
                        {severity}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed">
                    {expanded ? item : preview}
                  </p>
                  {item.length > 120 && (
                    <button
                      className={`text-[11px] mt-1 ${cfg.headerText} hover:underline`}
                      onClick={(e) => { e.stopPropagation(); toggleItem(idx); }}
                    >
                      {expanded ? '▲ Show less' : '▼ Show more'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ─── Progress bar metric card ─────────────────────────────────────────────────
const ScoreCard = ({ icon: Icon, label, value, color, trackColor, barColor }) => {
  // value can be a number (percentage) or a string like "O(n²)"
  const numericValue = typeof value === 'number' ? value : parseInt(value, 10);
  const hasBar = !isNaN(numericValue) && numericValue >= 0 && numericValue <= 100;

  return (
    <div className={`bg-gray-900 border ${trackColor} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</span>
        </div>
        <span className={`text-lg font-extrabold ${color}`}>
          {hasBar ? `${numericValue}` : value}
          {hasBar && <span className="text-xs font-normal text-gray-500 ml-0.5">/100</span>}
        </span>
      </div>
      {hasBar && (
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-700`}
            style={{ width: `${numericValue}%` }}
          />
        </div>
      )}
    </div>
  );
};

// ─── Animated score ring ──────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(score ?? 0, 100) / 100) * circ;
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" className="flex-shrink-0">
      <circle cx="35" cy="35" r={r} fill="none" stroke="#1f2937" strokeWidth="6" />
      <circle
        cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 35 35)"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
      />
      <text x="35" y="40" textAnchor="middle" fontSize="15" fontWeight="800" fill={color}>{score ?? 0}</text>
    </svg>
  );
};

// ─── Risk badge ───────────────────────────────────────────────────────────────
const RISK_STYLES = {
  CRITICAL: 'bg-red-500/20 border-red-500/50 text-red-300',
  HIGH:     'bg-orange-500/20 border-orange-500/50 text-orange-300',
  MEDIUM:   'bg-yellow-500/20 border-yellow-500/50 text-yellow-200',
  LOW:      'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
  UNKNOWN:  'bg-gray-500/20 border-gray-500/50 text-gray-300',
};

// ─── Normalise source code returned by the AI ────────────────────────────────
//
// Handles every form the LLM uses to encode newlines:
//   Form A  — real newline characters (U+000A)               → already correct
//   Form B  — literal two-char escape sequence  \n           → unescape first
//   Form C  — CRLF  \r\n                                     → normalise to LF
//   Form D  — markdown fences  ```java\n...\n```             → strip
//
// ORDER IS CRITICAL:
//   Unescape (B) BEFORE fence-strip (D), because a fenced string may look like
//   "```java\\ncode\\n```" — the fence regex needs real newlines to match
//   the boundary characters reliably.
//
// This function is the single source of truth — called for every corrected_code
// value before it reaches Monaco or the line-count calculation.
function normalizeCode(raw) {
  if (!raw) return '';
  let s = raw;

  // ── Step 1: Unescape literal \n / \t / \r sequences ──────────────────────
  // UNCONDITIONAL. Real source code never contains the literal two-char string
  // \n or \t as content, so this is always safe.
  s = s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '');

  // ── Step 2: Normalise CRLF and bare CR → LF ──────────────────────────────
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ── Step 3: Strip markdown fences ────────────────────────────────────────
  // Now that newlines are real characters, the fence regex works correctly.
  // Handles: ```java\n...\n```  or  ```\n...\n```  with optional trailing spaces
  s = s.replace(/^```[\w-]*[ \t]*\n?/, '');
  s = s.replace(/\n?```[ \t]*$/, '');

  // ── Step 4: Trim only surrounding blank lines (preserve internal indent) ──
  s = s.replace(/^\n+/, '').replace(/\n+$/, '');

  // Dev diagnostic — visible in browser console, harmless in production
  if (process.env.NODE_ENV !== 'production') {
    const lines = s.split('\n').length;
    console.debug('[normalizeCode] lines=%d  preview=%s', lines, JSON.stringify(s.slice(0, 80)));
  }

  return s;
}

// ─── Count non-blank lines ────────────────────────────────────────────────────
function countLines(text) {
  if (!text) return 0;
  return text.split(/\r?\n/).filter(line => line.trim() !== '').length;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const ReviewResult = ({ result, language, score, risk, sourceCode, onOpenDiff }) => {
  if (!result) return null;

  const riskStyle = RISK_STYLES[risk] ?? RISK_STYLES.UNKNOWN;
  const corrected = normalizeCode(result.corrected_code);

  const originalLines  = countLines(sourceCode  ?? '');
  const correctedLines = countLines(corrected);

  console.log('Original Lines:', originalLines);
  console.log('Corrected Lines:', correctedLines);

  return (
    <div className="w-full pb-8 space-y-0">

      {/* ══ SUMMARY HEADER ══════════════════════════════════════════════════ */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-4">
        <div className="flex items-start gap-4 mb-4">
          <ScoreRing score={score} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="text-base font-bold text-white">Review Summary</h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold tracking-wider ${riskStyle}`}>
                {risk} RISK
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{result.summary}</p>
          </div>
        </div>

        {/* ── Metric score cards with progress bars ── */}
        {(result.security_score || result.maintainability_score || result.complexity || result.estimated_time_complexity) && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            {result.security_score != null && (
              <ScoreCard icon={Shield}   label="Security"        value={result.security_score}
                color="text-red-400"    trackColor="border-red-900/40"
                barColor="bg-gradient-to-r from-red-700 to-red-400" />
            )}
            {result.maintainability_score != null && (
              <ScoreCard icon={Wrench}   label="Maintainability" value={result.maintainability_score}
                color="text-purple-400" trackColor="border-purple-900/40"
                barColor="bg-gradient-to-r from-purple-700 to-purple-400" />
            )}
            {result.complexity && (
              <ScoreCard icon={Gauge}    label="Complexity"      value={result.complexity}
                color="text-orange-400" trackColor="border-orange-900/40"
                barColor="bg-gradient-to-r from-orange-700 to-orange-400" />
            )}
            {result.estimated_time_complexity && (
              <ScoreCard icon={Activity} label="Time Complexity"  value={result.estimated_time_complexity}
                color="text-blue-400"   trackColor="border-blue-900/40"
                barColor="bg-gradient-to-r from-blue-700 to-blue-400" />
            )}
          </div>
        )}
      </div>

      {/* ══ ACCORDION FINDING SECTIONS ══════════════════════════════════════ */}
      <AccordionSection sectionKey="bugs"           items={result.bugs} />
      <AccordionSection sectionKey="security"       items={result.security_issues} />
      <AccordionSection sectionKey="root_cause"     items={result.root_cause} />
      <AccordionSection sectionKey="best_practices" items={result.best_practices} />
      <AccordionSection sectionKey="optimizations"  items={result.optimizations} />

      {/* ══ CORRECTED CODE ══════════════════════════════════════════════════ */}
      {corrected && (
        <div className="border border-blue-800/40 rounded-xl overflow-hidden mt-4 bg-blue-950/10">
          <div className="flex items-center justify-between px-4 py-3 bg-blue-950/40 border-b border-blue-800/40">
            <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
              <Code className="w-4 h-4" /> Corrected Code
              <span className="text-xs font-normal text-blue-300/60 ml-1">
                {originalLines} → {correctedLines} lines
              </span>
            </h4>
            <div className="flex items-center gap-2">
              {onOpenDiff && sourceCode && (
                <button
                  onClick={onOpenDiff}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                    bg-purple-700/30 border border-purple-600/40 text-purple-300
                    hover:bg-purple-700/50 hover:text-purple-200 transition font-medium"
                >
                  <GitCompare className="w-3.5 h-3.5" /> Full Diff View
                </button>
              )}
            </div>
          </div>
          {/* Monaco — corrected code, read-only, full formatting preserved */}
          <div className="h-72">
            <Editor
              height="100%"
              language={language?.toLowerCase()}
              theme="vs-dark"
              value={corrected}
              options={{
                readOnly: true,
                minimap: { enabled: true, scale: 1 },
                fontSize: 13,
                fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                wordWrap: 'off',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                scrollbar: { verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
                bracketPairColorization: { enabled: true },
                padding: { top: 10, bottom: 10 },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewResult;
