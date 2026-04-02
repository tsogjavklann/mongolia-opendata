'use client';

/**
 * SQLEditor — Autocomplete + Syntax Highlight editor
 *
 * Боломжууд:
 * - SQL keyword autocomplete (SELECT, FROM, WHERE, GROUP BY, ...)
 * - Баганы нэр autocomplete (schema-аас)
 * - Хүснэгтийн нэр autocomplete (tables.json-аас)
 * - Keyword color highlight (overlay div-р)
 * - Tab → 2 space
 * - Ctrl+Enter → run
 * - Ctrl+Space → force autocomplete
 */

import { useState, useRef, useEffect, useCallback } from 'react';

// ── SQL Keywords ──────────────────────────────────────────────────────────────
const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE',
  'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
  'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL JOIN', 'CROSS JOIN', 'ON',
  'AS', 'DISTINCT', 'ALL', 'UNION', 'UNION ALL', 'EXCEPT', 'INTERSECT',
  'WITH', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
  // Functions
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'FLOOR', 'CEIL', 'ABS',
  'RANK', 'DENSE_RANK', 'ROW_NUMBER', 'NTILE', 'LAG', 'LEAD',
  'SUM OVER', 'AVG OVER', 'COUNT OVER',
  'PARTITION BY', 'OVER', 'ROWS BETWEEN', 'RANGE BETWEEN',
  'UNBOUNDED PRECEDING', 'CURRENT ROW', 'UNBOUNDED FOLLOWING',
  'CAST', 'COALESCE', 'NULLIF', 'IIF', 'IF',
  'STRFTIME', 'DATE', 'YEAR', 'MONTH',
  'CONCAT', 'LOWER', 'UPPER', 'TRIM', 'LENGTH', 'SUBSTR',
  'NULL', 'IS NULL', 'IS NOT NULL', 'TRUE', 'FALSE',
  'ASC', 'DESC',
];

// Snippet templates
const SNIPPETS = [
  {
    trigger: 'sel',
    label: 'SELECT * FROM',
    body: 'SELECT *\nFROM "$1"\nLIMIT 500;',
  },
  {
    trigger: 'grp',
    label: 'GROUP BY SUM',
    body: 'SELECT $1, SUM(VALUE) as нийт\nFROM "$2"\nGROUP BY $1\nORDER BY нийт DESC;',
  },
  {
    trigger: 'win',
    label: 'WINDOW RANK',
    body: 'SELECT *,\n  RANK() OVER (PARTITION BY $1 ORDER BY VALUE DESC) as rank\nFROM "$2";',
  },
  {
    trigger: 'cte',
    label: 'WITH CTE',
    body: 'WITH үндсэн AS (\n  SELECT $1, SUM(VALUE) as нийт\n  FROM "$2"\n  GROUP BY $1\n)\nSELECT * FROM үндсэн\nORDER BY нийт DESC;',
  },
  {
    trigger: 'run',
    label: 'Running Total',
    body: 'SELECT\n  $1,\n  VALUE,\n  SUM(VALUE) OVER (ORDER BY $1) as хуримтлагдсан\nFROM "$2"\nORDER BY $1;',
  },
  {
    trigger: 'lag',
    label: 'LAG (өмнөх утга)',
    body: 'SELECT\n  $1,\n  VALUE,\n  LAG(VALUE) OVER (ORDER BY $1) as өмнөх,\n  VALUE - LAG(VALUE) OVER (ORDER BY $1) as өөрчлөлт\nFROM "$2"\nORDER BY $1;',
  },
  {
    trigger: 'top',
    label: 'TOP 10',
    body: 'SELECT * FROM "$1"\nORDER BY VALUE DESC\nLIMIT 10;',
  },
  {
    trigger: 'avg',
    label: 'AVG by group',
    body: 'SELECT $1, AVG(VALUE) as дундаж\nFROM "$2"\nGROUP BY $1\nORDER BY дундаж DESC;',
  },
  {
    trigger: 'pct',
    label: 'Percentage share',
    body: 'SELECT\n  $1,\n  VALUE,\n  ROUND(VALUE * 100.0 / SUM(VALUE) OVER (), 2) as хувь\nFROM "$2";',
  },
];

interface SuggestionItem {
  label: string;
  kind: 'keyword' | 'column' | 'table' | 'snippet' | 'function';
  insertText: string;
  detail?: string;
}

interface SQLEditorProps {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  columns?: { name: string; englishAlias?: string; type?: string }[];
  tables?: { id: string; text: string; path: string }[];
  aliases?: { alias: string; label: string; path: string }[];
  rows?: number;
}

// SQL keyword regex — compiled once
const SQL_KW_REGEX = new RegExp(
  `\\b(${[
    'SELECT','FROM','WHERE','AND','OR','NOT','IN','BETWEEN','LIKE',
    'GROUP\\s+BY','ORDER\\s+BY','HAVING','LIMIT','OFFSET','JOIN',
    'LEFT\\s+JOIN','RIGHT\\s+JOIN','INNER\\s+JOIN','FULL\\s+JOIN',
    'CROSS\\s+JOIN','ON','AS','DISTINCT','ALL','UNION','WITH',
    'CASE','WHEN','THEN','ELSE','END','OVER','PARTITION\\s+BY',
    'ROWS\\s+BETWEEN','RANGE\\s+BETWEEN','UNBOUNDED\\s+PRECEDING',
    'CURRENT\\s+ROW','UNBOUNDED\\s+FOLLOWING',
    'NULL','IS\\s+NULL','IS\\s+NOT\\s+NULL','TRUE','FALSE','ASC','DESC',
    'COUNT','SUM','AVG','MIN','MAX','ROUND','FLOOR','CEIL','ABS',
    'RANK','DENSE_RANK','ROW_NUMBER','NTILE','LAG','LEAD',
    'CAST','COALESCE','NULLIF','CONCAT','LOWER','UPPER','TRIM',
  ].join('|')})\\b`,
  'gi'
);

// Syntax highlight — returns HTML string
function highlight(code: string): string {
  return code
    // Escape HTML first
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Strings in quotes
    .replace(/('[^']*')/g, '<span style="color:#86efac">$1</span>')
    .replace(/("([^"]*)")/g, '<span style="color:#fbbf24">$2</span>') // table names
    // Numbers
    .replace(/\b(\d+)\b/g, '<span style="color:#fb923c">$1</span>')
    // Comments
    .replace(/(--[^\n]*)/g, '<span style="color:#475569;font-style:italic">$1</span>')
    // Keywords
    .replace(SQL_KW_REGEX, '<span style="color:#60a5fa;font-weight:700">$1</span>')
    // Functions with parens
    .replace(/\b(COUNT|SUM|AVG|MIN|MAX|ROUND|RANK|DENSE_RANK|ROW_NUMBER|NTILE|LAG|LEAD|COALESCE|CAST|NULLIF)\s*(?=\()/gi,
      '<span style="color:#c084fc;font-weight:600">$1</span>');
}

export default function SQLEditor({ value, onChange, onRun, columns = [], tables = [], aliases = [], rows = 10 }: SQLEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [sugIdx, setSugIdx] = useState(0);
  const [showSug, setShowSug] = useState(false);
  const [cursorPos, setCursorPos] = useState({ top: 0, left: 0 });

  // Sync scroll between textarea and highlight overlay
  const syncScroll = () => {
    if (taRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = taRef.current.scrollTop;
      overlayRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  // Get current word being typed at cursor
  const getCurrentWord = useCallback((text: string, pos: number) => {
    const before = text.slice(0, pos);
    const match = before.match(/[\w\u0400-\u04ff.]+$/);
    return match ? match[0] : '';
  }, []);

  // Get cursor pixel position for dropdown
  const getCursorPixelPos = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return { top: 0, left: 0 };
    const { selectionStart } = ta;
    const text = ta.value.slice(0, selectionStart);
    const lines = text.split('\n');
    const lineNum = lines.length;
    const lineHeight = 22; // 13px font × 1.75 lineHeight ≈ 22px
    const charWidth = 7.8;  // JetBrains Mono 13px
    const lastLine = lines[lines.length - 1];
    const padding = 12;
    return {
      top: lineNum * lineHeight + padding,
      left: Math.min(lastLine.length * charWidth + padding, ta.clientWidth - 240),
    };
  }, []);

  // Build suggestions from current word
  const buildSuggestions = useCallback((word: string, fullText: string, pos: number): SuggestionItem[] => {
    if (!word || word.length < 1) return [];
    const w = word.toLowerCase();
    const result: SuggestionItem[] = [];

    // Snippets (trigger words)
    for (const s of SNIPPETS) {
      if (s.trigger.startsWith(w)) {
        result.push({ label: s.label, kind: 'snippet', insertText: s.body, detail: `snippet: ${s.trigger}` });
      }
    }

    // Column names
    for (const col of columns) {
      const name = col.englishAlias ?? col.name;
      if (name.toLowerCase().startsWith(w) || col.name.toLowerCase().startsWith(w)) {
        result.push({
          label: name,
          kind: 'column',
          insertText: name,
          detail: `${col.type === 'number' ? '# number' : 'Aa text'}${col.englishAlias ? ` · ${col.name}` : ''}`,
        });
      }
    }

    // Table names
    for (const t of tables.slice(0, 200)) {
      if (t.text.toLowerCase().includes(w) || t.id.toLowerCase().includes(w)) {
        result.push({
          label: t.text,
          kind: 'table',
          insertText: t.path.endsWith('.px') ? t.path : t.path + '.px',
          detail: t.id,
        });
      }
    }

    // Alias suggestions — alias-аар FROM-д хурдан хайх (жш: "gdp_2")
    for (const a of aliases.slice(0, 500)) {
      if (a.alias.toLowerCase().includes(w) || a.label.toLowerCase().includes(w)) {
        result.push({
          label: a.alias,
          kind: 'table',
          insertText: a.alias,
          detail: `alias · ${a.label}`,
        });
      }
    }

    // SQL keywords
    for (const kw of SQL_KEYWORDS) {
      if (kw.toLowerCase().startsWith(w) && kw.toLowerCase() !== w) {
        result.push({ label: kw, kind: 'keyword', insertText: kw });
      }
    }

    // Deduplicate by label
    const seen = new Set<string>();
    return result.filter(r => { if (seen.has(r.label)) return false; seen.add(r.label); return true; }).slice(0, 12);
  }, [columns, tables, aliases]);

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    const pos = e.target.selectionStart ?? 0;
    const word = getCurrentWord(newVal, pos);
    const sug = buildSuggestions(word, newVal, pos);
    setSuggestions(sug);
    setSugIdx(0);
    setShowSug(sug.length > 0);
    if (sug.length > 0) setCursorPos(getCursorPixelPos());
    syncScroll();
  };

  // Apply selected suggestion
  const applySuggestion = useCallback((item: SuggestionItem) => {
    const ta = taRef.current;
    if (!ta) return;
    const pos = ta.selectionStart ?? 0;
    const word = getCurrentWord(value, pos);
    const before = value.slice(0, pos - word.length);
    const after = value.slice(pos);

    let insert = item.insertText;
    // For tables wrap in quotes
    if (item.kind === 'table') insert = `"${insert}"`;
    // For snippets replace $1, $2 placeholders with empty
    if (item.kind === 'snippet') insert = insert.replace(/\$\d/g, '');

    const newVal = before + insert + after;
    onChange(newVal);
    setShowSug(false);

    // Move cursor to end of inserted text
    const newPos = before.length + insert.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newPos, newPos);
    });
  }, [value, onChange, getCurrentWord]);

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Autocomplete navigation
    if (showSug) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSugIdx(i => Math.min(i + 1, suggestions.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSugIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Tab' || e.key === 'Enter') {
        if (suggestions[sugIdx]) { e.preventDefault(); applySuggestion(suggestions[sugIdx]); return; }
      }
      if (e.key === 'Escape') { setShowSug(false); return; }
    }

    // Ctrl+Enter → run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onRun(); return; }

    // Ctrl+Space → force autocomplete
    if (e.ctrlKey && e.key === ' ') {
      e.preventDefault();
      const pos = taRef.current?.selectionStart ?? 0;
      const word = getCurrentWord(value, pos);
      const sug = buildSuggestions(word || 'S', value, pos);
      setSuggestions(sug); setSugIdx(0); setShowSug(sug.length > 0);
      setCursorPos(getCursorPixelPos());
      return;
    }

    // Tab → insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = taRef.current!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.slice(0, start) + '  ' + value.slice(end);
      onChange(newVal);
      requestAnimationFrame(() => { ta.setSelectionRange(start + 2, start + 2); });
      return;
    }

    // Auto-close brackets/quotes
    const pairs: Record<string, string> = { '(': ')', "'": "'", '"': '"' };
    if (pairs[e.key] && !e.ctrlKey && !e.metaKey) {
      const ta = taRef.current!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      if (start === end) {
        e.preventDefault();
        const close = pairs[e.key];
        const newVal = value.slice(0, start) + e.key + close + value.slice(end);
        onChange(newVal);
        requestAnimationFrame(() => { ta.setSelectionRange(start + 1, start + 1); });
        return;
      }
    }
  };

  const kindColor: Record<string, string> = {
    keyword: '#60a5fa', column: '#00c87a', table: '#fbbf24', snippet: '#c084fc', function: '#c084fc',
  };
  const kindIcon: Record<string, string> = {
    keyword: 'KW', column: 'COL', table: 'TBL', snippet: '⚡', function: 'FN',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', background: '#060c18', borderRadius: 9 }}>

      {/* Highlight overlay */}
      <div
        ref={overlayRef}
        aria-hidden
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13, lineHeight: '22.75px',
          padding: '12px 14px',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          color: '#e2e8f0',
          background: '#060c18',
          pointerEvents: 'none',
          overflow: 'hidden',
          borderRadius: 9,
          border: '1.5px solid transparent',
          zIndex: 1,
          minHeight: `${rows * 22.75 + 24}px`,
        }}
        dangerouslySetInnerHTML={{ __html: highlight(value) + '\n' }}
      />

      {/* Actual textarea (transparent text, visible cursor) */}
      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        onClick={() => setShowSug(false)}
        spellCheck={false}
        rows={rows}
        style={{
          position: 'relative',
          zIndex: 2,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          lineHeight: '22.75px',
          color: 'transparent',
          caretColor: '#00c87a',
          background: 'transparent',
          border: '1.5px solid #1a3050',
          borderRadius: 9,
          padding: '12px 14px',
          width: '100%',
          resize: 'vertical',
          minHeight: `${rows * 22.75 + 24}px`,
          outline: 'none',
          tabSize: 2,
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#00c87a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,200,122,0.08)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#1a3050'; e.currentTarget.style.boxShadow = 'none'; setTimeout(() => setShowSug(false), 150); }}
      />

      {/* Autocomplete dropdown */}
      {showSug && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: cursorPos.top + 4,
          left: cursorPos.left,
          zIndex: 1000,
          background: '#0d1424',
          border: '1px solid #1a3050',
          borderRadius: 8,
          boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
          minWidth: 220,
          maxWidth: 340,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '4px 10px', borderBottom: '1px solid #1a3050', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#1e3352', fontFamily: 'JetBrains Mono', fontWeight: 600, letterSpacing: '0.06em' }}>AUTOCOMPLETE</span>
            <span style={{ fontSize: 9.5, color: '#1e3352' }}>↑↓ Tab·Enter</span>
          </div>

          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => applySuggestion(s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                cursor: 'pointer',
                background: i === sugIdx ? 'rgba(0,200,122,0.06)' : 'transparent',
                borderLeft: i === sugIdx ? '2px solid #00c87a' : '2px solid transparent',
                borderBottom: '1px solid rgba(26,48,80,0.3)',
                transition: 'background 0.08s',
              }}
              onMouseEnter={() => setSugIdx(i)}
            >
              {/* Kind badge */}
              <span style={{
                fontSize: 8.5,
                fontWeight: 700,
                padding: '1px 4px',
                borderRadius: 3,
                color: kindColor[s.kind] ?? '#475569',
                border: `1px solid ${kindColor[s.kind] ?? '#1a3050'}`,
                fontFamily: 'JetBrains Mono',
                flexShrink: 0,
                opacity: 0.8,
              }}>
                {kindIcon[s.kind]}
              </span>

              {/* Label */}
              <span style={{ fontSize: 12.5, color: '#e2e8f0', fontFamily: 'JetBrains Mono', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>

              {/* Detail */}
              {s.detail && (
                <span style={{ fontSize: 10, color: '#334155', fontFamily: 'JetBrains Mono', flexShrink: 0 }}>
                  {s.detail.slice(0, 20)}
                </span>
              )}
            </div>
          ))}

          <div style={{ padding: '3px 10px', fontSize: 9.5, color: '#1e3352', borderTop: '1px solid #1a3050' }}>
            Ctrl+Space дарж нээх · Esc хаах
          </div>
        </div>
      )}

      {/* Bottom hint bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, padding: '0 2px' }}>
        <span style={{ fontSize: 10, color: '#1e3352', fontFamily: 'JetBrains Mono' }}>
          Ctrl+Space: autocomplete · Tab: 2 зай · ( ': автоматаар хаана
        </span>
        <span style={{ fontSize: 10, color: '#1e3352', fontFamily: 'JetBrains Mono' }}>
          Ctrl+Enter: ажиллуулах
        </span>
      </div>
    </div>
  );
}
