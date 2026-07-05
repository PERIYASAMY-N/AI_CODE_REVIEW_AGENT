/**
 * DiffModal.jsx — Complete-file split diff viewer
 *
 * Architecture:
 *   LEFT  pane  → full original code,  unchanged lines normal,
 *                 deleted/replaced lines highlighted red.
 *   RIGHT pane  → full corrected code, unchanged lines normal,
 *                 inserted/replaced lines highlighted green.
 *
 * Both Monaco instances receive their own complete text so the user can
 * read the entire file. We use LCS to find which 1-based line numbers
 * changed in each file, then stamp those lines with deltaDecorations.
 * Blank placeholder lines are NOT inserted — every line number is real.
 */

import React, {
  useState, useRef, useCallback, useEffect, useMemo,
} from 'react';
import Editor from '@monaco-editor/react';
import { X, GitCompare, Plus, Minus } from 'lucide-react';

// ─── Splitter hook (30 – 70 %) ────────────────────────────────────────────────
function useSplitter(initial = 50) {
  const [pct, setPct] = useState(initial);
  const dragging = useRef(false);
  const containerRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const { left, width } = containerRef.current.getBoundingClientRect();
      const p = ((e.clientX - left) / width) * 100;
      setPct(Math.min(70, Math.max(30, p)));
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return { pct, containerRef, onMouseDown };
}

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
function normalizeCode(raw) {
  if (!raw) return '';
  let s = raw;

  // Step 1: Unescape literal \n / \t / \r — UNCONDITIONAL
  s = s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '');

  // Step 2: Normalise CRLF and bare CR → LF
  s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Step 3: Strip markdown fences (now that newlines are real characters)
  s = s.replace(/^```[\w-]*[ \t]*\n?/, '');
  s = s.replace(/\n?```[ \t]*$/, '');

  // Step 4: Trim surrounding blank lines only
  s = s.replace(/^\n+/, '').replace(/\n+$/, '');

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[normalizeCode] lines=%d  preview=%s',
      s.split('\n').length, JSON.stringify(s.slice(0, 80)));
  }

  return s;
}

// ─── LCS-based line diff ──────────────────────────────────────────────────────
// Returns { deletedLines: Set<number>, insertedLines: Set<number> }
// where the numbers are 1-based line indices in their respective files.
//
// Algorithm: O(N·M) DP table + traceback. Works correctly for large rewrites
// because it matches identical lines regardless of how much changed around them.
function computeChangedLines(origLines, corrLines) {
  const N = origLines.length;
  const M = corrLines.length;

  // Build LCS length table
  const dp = Array.from({ length: N + 1 }, () => new Int32Array(M + 1));
  for (let i = N - 1; i >= 0; i--) {
    for (let j = M - 1; j >= 0; j--) {
      dp[i][j] = origLines[i] === corrLines[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Traceback — collect changed line numbers (1-based)
  const deletedLines  = new Set(); // lines in original that were removed/replaced
  const insertedLines = new Set(); // lines in corrected that were added/replaced

  let i = 0, j = 0;
  while (i < N || j < M) {
    if (i < N && j < M && origLines[i] === corrLines[j]) {
      // equal — no decoration
      i++; j++;
    } else if (j < M && (i >= N || dp[i][j + 1] >= dp[i + 1][j])) {
      insertedLines.add(j + 1); // 1-based
      j++;
    } else {
      deletedLines.add(i + 1);  // 1-based
      i++;
    }
  }

  return { deletedLines, insertedLines };
}

// ─── Build Monaco decoration arrays from changed-line sets ───────────────────
function makeDecorations(changedLineSet, cssClass) {
  return Array.from(changedLineSet).map((lineNo) => ({
    range: {
      startLineNumber: lineNo,
      startColumn: 1,
      endLineNumber: lineNo,
      endColumn: 1,
    },
    options: { isWholeLine: true, className: cssClass },
  }));
}

// ─── Line counting ────────────────────────────────────────────────────────────
// Count non-blank lines so the header shows meaningful numbers.
// Used for both the stats bar ("7 → 12 lines") and the diff calculation.
function countLines(text) {
  if (!text) return 0;
  return text.split(/\r?\n/).filter(line => line.trim() !== '').length;
}

// ─── Compute summary stats ────────────────────────────────────────────────────
function computeStats(deletedLines, insertedLines, origLines, corrLines) {
  const origTotal = countLines(origLines.join('\n'));
  const corrTotal = countLines(corrLines.join('\n'));

  console.log('Original Lines:', origTotal);
  console.log('Corrected Lines:', corrTotal);

  return {
    removed:   deletedLines.size,
    added:     insertedLines.size,
    unchanged: origLines.filter(l => l.trim() !== '').length - deletedLines.size,
    origTotal,
    corrTotal,
  };
}

// ─── Single Monaco pane ───────────────────────────────────────────────────────
const DiffPane = ({ text, decorations, language, label, labelColor, borderColor }) => {
  const editorRef  = useRef(null);
  const decorIds   = useRef([]);

  const handleMount = useCallback((editor) => {
    editorRef.current = editor;
    // Apply immediately on mount
    decorIds.current = editor.deltaDecorations([], decorations);
  }, [decorations]); // decorations stable — memoised in parent

  // Re-stamp if decorations change (shouldn't happen after first render, but safe)
  useEffect(() => {
    if (!editorRef.current) return;
    decorIds.current = editorRef.current.deltaDecorations(
      decorIds.current,
      decorations,
    );
  }, [decorations]);

  return (
    <div className={`flex flex-col h-full min-w-0 border-t-2 ${borderColor}`}>
      {/* Panel label */}
      <div className={`flex-shrink-0 flex items-center gap-2 px-4 py-2
        bg-gray-900 border-b border-gray-800 text-xs font-bold uppercase tracking-widest ${labelColor}`}>
        {label}
      </div>

      {/* Full Monaco editor — complete file text, syntax-highlighted */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language?.toLowerCase()}
          theme="vs-dark"
          value={text}
          onMount={handleMount}
          options={{
            readOnly: true,
            minimap: { enabled: true, scale: 1 },
            fontSize: 13,
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            wordWrap: 'off',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
            // Let Monaco do its cursor highlight; we handle line background ourselves
            renderLineHighlight: 'none',
            smoothScrolling: true,
            padding: { top: 8, bottom: 8 },
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
};

// ─── Main modal ───────────────────────────────────────────────────────────────
const DiffModal = ({ original, corrected, language, onClose }) => {
  const { pct, containerRef, onMouseDown } = useSplitter(50);

  // Stable, cleaned inputs
  const origText = useMemo(() => (original ?? '').trimEnd(),          [original]);
  const corrText = useMemo(() => normalizeCode(corrected ?? ''),       [corrected]);

  // Run diff once — stable until props change
  const { deletedDecs, insertedDecs, stats } = useMemo(() => {
    const origLines = origText.split('\n');
    const corrLines = corrText.split('\n');

    // Diagnostic: always log so we can see what the modal actually received
    console.log('DiffModal origText lines (raw split):', origLines.length);
    console.log('DiffModal corrText lines (raw split):', corrLines.length);
    console.log('DiffModal corrText preview:', JSON.stringify(corrText.slice(0, 120)));

    const { deletedLines, insertedLines } = computeChangedLines(origLines, corrLines);
    return {
      deletedDecs:  makeDecorations(deletedLines,  'diff-line-removed'),
      insertedDecs: makeDecorations(insertedLines, 'diff-line-added'),
      stats: computeStats(deletedLines, insertedLines, origLines, corrLines),
    };
  }, [origText, corrText]);

  // Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col bg-gray-950 border border-gray-700/80 rounded-2xl
          shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden"
        style={{ width: '98vw', height: '98vh' }}
      >

        {/* ── Fixed header ─────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Code Diff — Original vs Corrected</h3>
            <span className="text-xs bg-gray-800 border border-gray-700 px-2 py-0.5 rounded font-mono text-gray-400">
              {language.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Stats bar ────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex items-center gap-6 px-5 py-2.5
          bg-gray-900/60 border-b border-gray-800 text-xs font-mono">

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-red-500/60 border border-red-500/40 inline-block" />
            <span className="text-red-400 font-bold">{stats.removed}</span>
            <span className="text-gray-500">removed</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/60 border border-emerald-500/40 inline-block" />
            <span className="text-emerald-400 font-bold">{stats.added}</span>
            <span className="text-gray-500">added</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-gray-700 border border-gray-600 inline-block" />
            <span className="text-gray-400 font-bold">{stats.unchanged}</span>
            <span className="text-gray-500">unchanged</span>
          </div>

          <div className="h-4 w-px bg-gray-700" />

          <span className="text-gray-500">
            {stats.origTotal} → {stats.corrTotal} lines (non-blank)
          </span>

          <span className="ml-auto text-gray-600 italic">
            Drag divider · Scroll independently
          </span>
        </div>

        {/* ── Split panes ──────────────────────────────────────────────── */}
        <div
          ref={containerRef}
          className="flex flex-1 min-h-0 overflow-hidden"
          style={{ cursor: 'default' }}
        >
          {/* LEFT — full original code */}
          <div className="min-w-0 h-full overflow-hidden" style={{ width: `${pct}%` }}>
            <DiffPane
              text={origText}
              decorations={deletedDecs}
              language={language}
              label="← Original"
              labelColor="text-red-400"
              borderColor="border-red-800/60"
            />
          </div>

          {/* Drag handle */}
          <div
            onMouseDown={onMouseDown}
            className="relative flex-shrink-0 w-1.5 bg-gray-700
              hover:bg-purple-500 active:bg-purple-400
              cursor-col-resize transition-colors duration-150 z-10 group select-none"
            title="Drag to resize panels"
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2
              flex flex-col items-center justify-center gap-1
              opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-purple-300" />
              ))}
            </div>
          </div>

          {/* RIGHT — full corrected code */}
          <div className="flex-1 min-w-0 h-full overflow-hidden">
            <DiffPane
              text={corrText}
              decorations={insertedDecs}
              language={language}
              label="→ Corrected"
              labelColor="text-emerald-400"
              borderColor="border-emerald-800/60"
            />
          </div>
        </div>

        {/* ── Fixed footer ─────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-2
          bg-purple-950/50 border-t border-purple-800/30 text-xs font-mono">
          <span className="text-purple-300 font-semibold">{language.toUpperCase()} DIFF</span>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1 text-red-400">
              <Minus className="w-3 h-3" />{stats.removed} removed
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Plus className="w-3 h-3" />{stats.added} added
            </span>
            <span className="text-gray-500">{stats.unchanged} unchanged</span>
          </div>
          <span className="text-purple-500/70">Esc to close</span>
        </div>

      </div>
    </div>
  );
};

export default DiffModal;
