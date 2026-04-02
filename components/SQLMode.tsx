'use client';

import { useState, useEffect } from 'react';
import { Play, RefreshCw, AlertCircle, X, BarChart2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { smartInsert } from '@/lib/sqlParser';
import { ENGLISH_ALIASES } from '@/lib/dimensionMap';
import type { DimMeta, ParsedFilter, QueryResult, ColumnInfo } from '@/lib/types';
import DimSidebar from '@/components/DimSidebar';
import ResultsPanel from '@/components/ResultsPanel';
import TableSearch from '@/components/TableSearch';

const SchemaSidebar = dynamic(() => import('@/components/SchemaSidebar'), { ssr: false });
const SQLEditor = dynamic(() => import('@/components/SQLEditor'), { ssr: false });
const AliasTable = dynamic(() => import('@/components/AliasTable'), { ssr: false });

const SQL_EXAMPLES = [
  { label: 'Хүн ам хүйсээр', sql: `SELECT *\nFROM "Population, household/1_Population, household/DT_NSO_0300_001V3.px"\nWHERE Gender IN ('0','1','2')\nLIMIT 500;` },
  { label: 'ДНБ', sql: `SELECT *\nFROM "National accounts/1_National accounts/DT_NSO_0500_002V1.px"\nLIMIT 300;` },
];

const SQL_TEMPLATES = [
  { label: '5 жил', snippet: 'Year BETWEEN 2020 AND 2024' },
  { label: 'Хүйсээр', snippet: `Gender IN ('1','2')` },
  { label: 'Нийт', snippet: `Gender IN ('0')` },
];

interface Props {
  sql: string;
  setSql: (s: string | ((prev: string) => string)) => void;
  result: QueryResult | null;
  loading: boolean;
  error: { msg: string; suggestion: string } | null;
  setError: (e: { msg: string; suggestion: string } | null) => void;
  tab: 'chart' | 'table' | 'explain';
  setTab: (t: 'chart' | 'table' | 'explain') => void;
  useDuckDB: boolean;
  setUseDuckDB: (u: boolean | ((prev: boolean) => boolean)) => void;
  runSQL: (customSql?: string) => void;
}

export default function SQLMode({
  sql, setSql, result, loading, error, setError,
  tab, setTab, useDuckDB, setUseDuckDB, runSQL,
}: Props) {
  const [rightTab, setRightTab] = useState<'alias' | 'schema' | 'dims'>('alias');
  const [sqlDims, setSqlDims] = useState<DimMeta[]>([]);
  const [sqlDimsLoading, setSqlDimsLoading] = useState(false);
  const [allTables, setAllTables] = useState<{ id: string; text: string; path: string }[]>([]);
  const [allAliases, setAllAliases] = useState<{ alias: string; label: string; path: string }[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch('/tables.json').then(r => r.json()).then(setAllTables).catch(() => {});
    fetch('/aliases.json').then(r => r.json()).then(setAllAliases).catch(() => {});
  }, []);

  // Load dims for sidebar
  const currentPath = sql.match(/FROM\s+["'`]([^"'`]+)["'`]/i)?.[1];
  useEffect(() => {
    if (!currentPath) { setSqlDims([]); return; }
    const path = currentPath.trim().endsWith('.px') ? currentPath.trim() : currentPath.trim() + '.px';
    setSqlDimsLoading(true);
    fetch(`/api/meta?path=${encodeURIComponent(path)}`)
      .then(r => r.json())
      .then((data: { ok: boolean; dims?: DimMeta[] }) => {
        setSqlDims(data.ok && data.dims ? data.dims : []);
      })
      .catch(() => setSqlDims([]))
      .finally(() => setSqlDimsLoading(false));
  }, [currentPath]);

  const insertSnippet = (snippet: string) => setSql((s: string) => smartInsert(s, snippet));

  return (
    <div className="layout-main" style={{ display: 'grid', gridTemplateColumns: sidebarOpen ? '1fr 272px' : '1fr', gap: 18, alignItems: 'start' }}>

      {/* Left: editor + results */}
      <div className="flex flex-col gap-3.5">
        <div className="card">
          {/* Table search */}
          <TableSearch onSelect={t => {
            const path = t.path.endsWith('.px') ? t.path : t.path + '.px';
            setSql(`SELECT *\nFROM "${path}"\nLIMIT 500;`);
          }} compact />

          {/* Examples + templates */}
          <div className="flex gap-1.5 flex-wrap my-2.5">
            <span className="text-label text-ink-700 self-center font-semibold">Жишээ:</span>
            {SQL_EXAMPLES.map(ex => (
              <button key={ex.label} onClick={() => setSql(ex.sql)} className="btn-ghost text-accent2">
                {ex.label}
              </button>
            ))}
            <span className="text-ink-700 self-center">|</span>
            <span className="text-label text-ink-700 self-center font-semibold">Загвар:</span>
            {SQL_TEMPLATES.map(t => (
              <button key={t.label} onClick={() => insertSnippet(t.snippet)} className="btn-ghost">
                {t.label}
              </button>
            ))}
          </div>

          {/* SQL Editor */}
          <SQLEditor
            value={sql}
            onChange={setSql}
            onRun={runSQL}
            columns={result?.schema ?? sqlDims.map(d => ({ name: d.label, englishAlias: d.englishAlias, type: 'text' }))}
            tables={allTables}
            aliases={allAliases}
            rows={9}
          />

          {/* Actions row */}
          <div className="flex items-center gap-2.5 mt-3 flex-wrap">
            <button onClick={() => runSQL()} disabled={loading} className="btn-primary">
              {loading ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
              {loading ? 'Татаж байна...' : 'Ажиллуулах'}
            </button>
            {result && (
              <>
                <span className="badge badge-accent">
                  {result.count.toLocaleString()} мөр
                </span>
                {result.timing && (
                  <span className="badge" style={{ borderColor: 'rgba(91,156,246,0.25)', background: 'rgba(91,156,246,0.06)', color: '#5b9cf6' }}>
                    {result.timing.totalMs}ms
                  </span>
                )}
              </>
            )}
            <span className="ml-auto text-[10px] text-ink-600 font-mono tracking-wider uppercase">Ctrl+Enter</span>
          </div>

          {/* Filter chips */}
          {result?.parsed?.filters && result.parsed.filters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 items-center">
              <span className="text-label text-ink-700 font-semibold">Шүүлт:</span>
              {result.parsed.filters.map((f: ParsedFilter, i: number) => (
                <span key={i} className="badge font-mono border-accent2/30 bg-accent2-dim text-accent2">
                  {(ENGLISH_ALIASES as Record<string, string>)[f.code] ?? f.code}: {f.displayValues?.slice(0, 2).join(', ')}{(f.displayValues?.length ?? 0) > 2 ? ` +${f.displayValues.length - 2}` : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-lg flex gap-2.5 items-start animate-fade-up">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs text-red-300 font-mono">{error.msg}</div>
              {error.suggestion && (
                <div className="text-[11.5px] text-ink-400 mt-1.5 px-2 py-1 bg-black/20 rounded">
                  {error.suggestion}
                </div>
              )}
            </div>
            <button onClick={() => setError(null)} className="icon-btn"><X size={13} /></button>
          </div>
        )}

        <ResultsPanel result={result} loading={loading} tab={tab} setTab={setTab} />

        {/* DuckDB fallback warning */}
        {result?.duckdbError && (
          <div className="p-2.5 px-3.5 bg-yellow-500/5 border border-yellow-500/15 rounded-lg flex gap-2">
            <span className="text-[13px]">&#9888;</span>
            <div>
              <div className="text-[11.5px] text-yellow-400 font-mono">DuckDB SQL алдаа — API өгөгдлийг харуулж байна</div>
              <div className="text-[11px] text-ink-400 mt-1">{result.duckdbError}</div>
              {result.duckdbSuggestion && <div className="text-[11px] text-accent2 mt-0.5">{result.duckdbSuggestion}</div>}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="text-center py-12 text-ink-700">
            <BarChart2 size={36} className="mx-auto mb-3 opacity-[0.13]" />
            <div className="text-sm font-semibold text-ink-600">SQL бичээд Ctrl+Enter дарна уу</div>
            <div className="text-xs mt-1.5 text-ink-700">Year, Gender, Age, Region гэх мэт англи нэр ашиглаж болно</div>
          </div>
        )}
      </div>

      {/* Right sidebar */}
      {sidebarOpen && (
        <div className="sticky top-[72px] flex flex-col gap-2.5 hide-mobile">
          {/* DuckDB toggle */}
          <div className="sidebar-panel">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[12px]"
                  style={{ background: useDuckDB ? 'rgba(0,214,143,0.1)' : 'rgba(26,45,74,0.3)' }}>
                  &#129414;
                </div>
                <span className="text-[11.5px] font-display font-bold text-ink-200">DuckDB</span>
              </div>
              <button onClick={() => setUseDuckDB((p: boolean) => !p)}
                className="w-10 h-[22px] rounded-full border-none cursor-pointer relative transition-all duration-300 flex-shrink-0"
                style={{
                  background: useDuckDB ? 'linear-gradient(135deg, #00d68f, #00b87a)' : 'rgba(26,45,74,0.5)',
                  boxShadow: useDuckDB ? '0 2px 8px rgba(0,214,143,0.3)' : 'none',
                }}>
                <div className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all duration-300"
                  style={{ left: useDuckDB ? 20 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </button>
            </div>
            <div className="text-[10px] text-ink-600 leading-relaxed font-mono">
              {useDuckDB ? 'JOIN, GROUP BY, WINDOW, RANK()' : 'API filter — хялбар'}
            </div>
          </div>

          {/* Tabbed sidebar */}
          <div className="bg-surface border border-border rounded-card overflow-hidden">
            <div className="flex border-b border-border bg-surface-dark">
              {([['alias', 'Alias'], ['schema', 'Schema'], ['dims', 'Filter']] as const).map(([t, label]) => (
                <button key={t} onClick={() => setRightTab(t)}
                  className={`flex-1 py-2 px-1 border-none cursor-pointer text-[11px] font-bold transition-all duration-150 ${
                    rightTab === t
                      ? 'bg-surface text-ink-200 border-b-2 border-accent'
                      : 'bg-transparent text-ink-600 border-b-2 border-transparent'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="p-3.5" style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
              {rightTab === 'alias' && (
                <AliasTable onInsert={(alias: string) => {
                  setSql((s: string) => {
                    const trimmed = s.trimEnd();
                    const needsSpace = trimmed.length > 0 && !trimmed.endsWith('"');
                    return trimmed + (needsSpace ? ' ' : '') + `"${alias}"`;
                  });
                }} />
              )}
              {rightTab === 'schema' && (
                <SchemaSidebar
                  tableName={result?.explain?.table}
                  columns={result?.schema ?? []}
                  loading={loading}
                  engine={result?.engine}
                  timing={result?.timing}
                  onInsertColumn={(col: string) => setSql((s: string) => s + `\n-- Column: ${col}`)}
                  onInsertSnippet={(snippet: string) => {
                    if (snippet.trim().toUpperCase().startsWith('SELECT')) {
                      setSql(snippet);
                    } else {
                      setSql((s: string) => smartInsert(s, snippet));
                    }
                  }}
                />
              )}
              {rightTab === 'dims' && (
                sqlDims.length > 0
                  ? <DimSidebar dims={sqlDims} loading={sqlDimsLoading} onInsert={insertSnippet} />
                  : <div className="text-xs text-ink-700 text-center py-5">SQL ажиллуулахад dimension-ууд гарна</div>
              )}
            </div>
          </div>

          {/* Syntax reference */}
          <div className="card p-3">
            <div className="label-upper mb-2">Синтакс</div>
            <pre className="font-mono text-[11px] text-ink-600 leading-relaxed m-0 whitespace-pre-wrap">{`SELECT *\nFROM "path/table.px"\nWHERE Year IN ('2020','2021')\n  AND Gender IN ('1','2')\n  AND Year BETWEEN 2018 AND 2023\nLIMIT 1000;`}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
