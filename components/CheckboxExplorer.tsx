'use client';

/**
 * 1212.mn-ийн яг нэг адил Checkbox Explorer UI
 * - Dimension-уудыг баганаар харуулна
 * - Checkbox-оор утга сонгоно
 * - Generated SQL харуулна
 * - "SQL-д засах" товч
 */

import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Download, BarChart2, Code2, Copy, Check } from 'lucide-react';
import dynamic from 'next/dynamic';
import { toChartData, toCSV, type DataRow } from '@/lib/transform';

const DataChart = dynamic(() => import('./DataChart'), { ssr: false });
const DataTable = dynamic(() => import('./DataTable'), { ssr: false });

export type { DimMeta, TableEntry } from '@/lib/types';
import type { DimMeta, TableEntry } from '@/lib/types';

const VIEW_TYPES = [
  { key: 'table', label: 'Хүснэгт', icon: '📋' },
  { key: 'chart', label: 'График', icon: '📊' },
] as const;

type ViewType = 'table' | 'chart';

interface Props {
  table: TableEntry;
  dims: DimMeta[];
  onEditInSQL?: (sql: string) => void;
}

export default function CheckboxExplorer({ table, dims, onEditInSQL }: Props) {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [viewType, setViewType] = useState<ViewType>('table');
  const [result, setResult] = useState<{ rows: DataRow[]; count: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  useEffect(() => {
    const init: Record<string, Set<string>> = {};
    dims.forEach(d => { init[d.code] = new Set(); });
    setSelected(init);
    setResult(null);
    setError(null);
  }, [dims, table]);

  // Loading elapsed timer
  useEffect(() => {
    if (!loading) { setElapsed(0); return; }
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  const isAllSelected = (dimCode: string) => (selected[dimCode]?.size ?? 0) === 0;

  const toggle = (dimCode: string, valCode: string) => {
    setSelected(prev => {
      const cur = prev[dimCode] ?? new Set<string>();
      const dim = dims.find(d => d.code === dimCode)!;

      if (cur.size === 0) {
        const next = new Set(dim.values.map(v => v.code));
        next.delete(valCode);
        return { ...prev, [dimCode]: next };
      }

      const next = new Set(cur);
      if (next.has(valCode)) {
        next.delete(valCode);
        if (next.size === 0) return { ...prev, [dimCode]: new Set() };
      } else {
        next.add(valCode);
        if (next.size === dim.values.length) return { ...prev, [dimCode]: new Set() };
      }
      return { ...prev, [dimCode]: next };
    });
  };

  const selectAll = (dimCode: string) => setSelected(prev => ({ ...prev, [dimCode]: new Set() }));
  const clearAll = (dimCode: string) => {
    setSelected(prev => {
      const dim = dims.find(d => d.code === dimCode);
      if (!dim) return prev;
      return { ...prev, [dimCode]: new Set(dim.values.map(v => v.code)) };
    });
  };

  // Generate SQL from current selections
  const generatedSQL = useMemo(() => {
    const path = table.path.endsWith('.px') ? table.path : table.path + '.px';
    const filters = dims
      .filter(d => (selected[d.code]?.size ?? 0) > 0)
      .map(d => {
        const vals = Array.from(selected[d.code]).map(v => `'${v}'`).join(',');
        return `  AND "${d.label}" IN (${vals})`;
      });
    const where = filters.length > 0 ? `\nWHERE 1=1\n${filters.join('\n')}` : '';
    return `SELECT *\nFROM "${path}"${where}\nLIMIT 500;`;
  }, [table, dims, selected]);

  // Active filter count
  const activeFilterCount = dims.filter(d => (selected[d.code]?.size ?? 0) > 0).length;

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    const path = table.path.endsWith('.px') ? table.path : table.path + '.px';

    const filters = dims
      .filter(d => (selected[d.code]?.size ?? 0) > 0)
      .map(d => ({ code: d.label, values: Array.from(selected[d.code]) }));

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tblId: path, filters }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error); return; }
      setResult({ rows: data.rows, count: data.count });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Алдаа гарлаа');
    } finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!result) return;
    const blob = new Blob([toCSV(result.rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${table.id}_${Date.now()}.csv`;
    a.click();
  };

  const copySQL = () => {
    navigator.clipboard.writeText(generatedSQL).catch(() => {});
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  return (
    <div>
      {/* Title + actions */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-extrabold text-ink-100 tracking-tight uppercase mb-1 leading-tight">
            {table.text}
          </h2>
          <div className="text-[11px] text-ink-700 font-mono">{table.id}</div>
        </div>
        <div className="flex gap-2 items-center">
          {result && (
            <button onClick={exportCSV} className="btn-ghost">
              <Download size={13} /> CSV ({result.count.toLocaleString()})
            </button>
          )}
        </div>
      </div>

      {/* Checkbox columns */}
      <div className="flex gap-2.5 mb-3 overflow-x-auto items-start pb-2">
        {dims.map(dim => {
          const sel = selected[dim.code] ?? new Set<string>();
          const allSel = sel.size === 0;
          const selectedCount = allSel ? dim.values.length : sel.size;

          return (
            <div key={dim.code} className="min-w-[155px] flex-[1_1_155px] bg-surface border border-border-light rounded-md overflow-hidden flex flex-col">
              {/* Column header */}
              <div className="px-3 py-2 font-bold text-[13px] text-ink-200 border-b border-border-light"
                style={{ background: 'linear-gradient(135deg, #0f2847, #162d52)' }}>
                <div className="flex items-center justify-between">
                  <span>{dim.label}</span>
                  <span className="text-[10px] font-normal text-[#5b8cc0] bg-[rgba(91,156,246,0.12)] px-1.5 py-0.5 rounded">
                    {selectedCount}/{dim.values.length}
                  </span>
                </div>
                {dim.englishAlias !== dim.label && (
                  <div className="text-[10px] text-[#5b8cc0] font-normal mt-0.5">{dim.englishAlias}</div>
                )}
              </div>

              {/* Values list */}
              <div className="flex-1 max-h-[220px] overflow-y-auto py-1">
                {dim.values.map(v => {
                  const checked = allSel || sel.has(v.code);
                  return (
                    <label key={v.code}
                      className={`flex items-start gap-2 px-3 py-1 cursor-pointer text-[13px] transition-colors duration-100 hover:bg-[rgba(26,90,180,0.12)] ${checked ? 'text-ink-200' : 'text-ink-500'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(dim.code, v.code)}
                        tabIndex={0}
                        className="mt-0.5 accent-accent2 cursor-pointer flex-shrink-0 focus-visible:ring-2 focus-visible:ring-accent"
                      />
                      <span className="leading-tight break-words">{v.label || v.code}</span>
                    </label>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div className="border-t border-border-light px-2.5 py-1.5 flex gap-1">
                <button onClick={() => selectAll(dim.code)}
                  className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded transition-all duration-150 border ${allSel ? 'bg-accent2-dim border-accent2/30 text-accent2' : 'bg-transparent border-border text-ink-500 hover:bg-accent2-dim hover:text-accent2'}`}>
                  Бүгд
                </button>
                <button onClick={() => clearAll(dim.code)}
                  className={`flex-1 py-1 px-2 text-[11px] font-semibold rounded transition-all duration-150 border ${!allSel && sel.size > 0 ? 'bg-red-500/5 border-red-500/20 text-red-300' : 'bg-transparent border-border text-ink-600 hover:bg-red-500/5 hover:text-red-300'}`}>
                  Арилгах
                </button>
              </div>
            </div>
          );
        })}

        {/* View type + Run button column */}
        <div className="min-w-[165px] flex-[1_1_165px] bg-surface border border-border-light rounded-md overflow-hidden">
          <div className="px-3 py-2 font-bold text-[13px] text-ink-200 border-b border-border-light"
            style={{ background: 'linear-gradient(135deg, #0f2847, #162d52)' }}>
            Харагдах төрөл
          </div>
          <div className="p-3 flex flex-col gap-2">
            {VIEW_TYPES.map(vt => (
              <label key={vt.key} className={`flex items-center gap-2 cursor-pointer text-[13px] transition-colors ${viewType === vt.key ? 'text-ink-200' : 'text-ink-400'}`}>
                <input
                  type="radio"
                  name={`vt-${table.id}`}
                  checked={viewType === vt.key}
                  onChange={() => setViewType(vt.key)}
                  className="accent-accent2 cursor-pointer"
                />
                {vt.icon} {vt.label}
              </label>
            ))}
          </div>

          {/* Run button */}
          <div className="px-2.5 pb-2.5">
            <button onClick={run} disabled={loading}
              className="w-full py-2.5 text-sm font-extrabold rounded-md border-none cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed"
              style={{ background: loading ? '#1a3050' : '#1a3a6e', color: loading ? '#475569' : '#fff' }}>
              {loading && <RefreshCw size={14} className="spin" />}
              {loading ? 'Татаж байна...' : 'Үр дүн харах'}
            </button>
          </div>

          {/* Filter summary */}
          {activeFilterCount > 0 && (
            <div className="px-2.5 pb-2 text-[10px] text-accent2 font-mono">
              {activeFilterCount} шүүлт идэвхтэй
            </div>
          )}
        </div>
      </div>

      {/* Generated SQL panel */}
      <div className="mb-4 p-3 bg-surface-dark border border-border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-500 uppercase tracking-wider">
            <Code2 size={12} /> Үүссэн SQL
          </div>
          <div className="flex gap-1.5">
            <button onClick={copySQL} className="btn-ghost text-[10px] py-1 px-2">
              {sqlCopied ? <Check size={10} /> : <Copy size={10} />}
              {sqlCopied ? 'Хуулагдлаа' : 'Хуулах'}
            </button>
            {onEditInSQL && (
              <button onClick={() => onEditInSQL(generatedSQL)}
                className="btn-ghost text-[10px] py-1 px-2 text-accent2">
                <Code2 size={10} /> SQL-д засах
              </button>
            )}
          </div>
        </div>
        <pre className="font-mono text-[11.5px] text-ink-400 leading-relaxed m-0 whitespace-pre-wrap overflow-x-auto">
          {generatedSQL}
        </pre>
      </div>

      {/* Status line */}
      <div className="text-xs text-center mb-4">
        {result ? (
          <span className="text-accent font-semibold badge-accent px-3 py-1">
            {result.count.toLocaleString()} мөр амжилттай
          </span>
        ) : (
          <span className="text-ink-600">
            Dimension-ууд сонгоод &quot;Үр дүн харах&quot; дарна уу
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-lg text-[13px] text-red-300 mb-4 flex items-start gap-2">
          <span className="flex-shrink-0">&#10060;</span>
          <div className="flex-1">
            <div>{error}</div>
            <button onClick={run} className="btn-ghost text-[11px] mt-2 text-accent">
              <RefreshCw size={10} /> Дахин оролдох
            </button>
          </div>
        </div>
      )}

      {/* Loading with progress */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-10">
          <RefreshCw size={24} className="text-accent spin" />
          <div className="text-center">
            <div className="text-sm text-ink-400">Өгөгдөл татаж байна...</div>
            <div className="text-xs text-ink-600 mt-1">
              {elapsed}с өнгөрлөө · ихэвчлэн 30–60 секунд
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-48 h-1 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(95, (elapsed / 50) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="animate-fade-up">
          {viewType === 'table' && (
            <div className="card p-0 overflow-hidden">
              <DataTable rows={result.rows} />
            </div>
          )}

          {viewType === 'chart' && (
            <div className="card">
              {result.rows.length > 0
                ? <DataChart rows={result.rows} />
                : (
                  <div className="text-center py-9 text-ink-600">
                    <BarChart2 size={28} className="mx-auto mb-2 opacity-25" />
                    <div className="text-[13px]">График зурахад хангалттай өгөгдөл байхгүй</div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
