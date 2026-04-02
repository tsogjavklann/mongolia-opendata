'use client';

import { useState, useCallback, useEffect } from 'react';
import { toCSV } from '@/lib/transform';
import type { QueryResult, HistoryEntry } from '@/lib/types';

const LS_KEY = 'mn_sql_history';

function getHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); }
  catch { return []; }
}

function saveHistory(sql: string, count: number) {
  const label = sql.match(/FROM\s+["'`]([^"'`/\n]+)/i)?.[1]?.slice(0, 40) ?? 'Query';
  let h = getHistory().filter(x => x.sql !== sql).slice(0, 29);
  const entry: HistoryEntry = { sql, label: `${label} (${count}м)`, ts: Date.now() };
  while (h.length > 0 && new Blob([JSON.stringify([entry, ...h])]).size > 1_000_000) {
    h = h.slice(0, -1);
  }
  localStorage.setItem(LS_KEY, JSON.stringify([entry, ...h]));
}

export function useQueryEngine(initialSql: string) {
  const [sql, setSql] = useState(initialSql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ msg: string; suggestion: string } | null>(null);
  const [tab, setTab] = useState<'chart' | 'table' | 'explain'>('chart');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [useDuckDB, setUseDuckDB] = useState(true);
  const hasShownResult = useState(false);

  useEffect(() => { setHistory(getHistory()); }, []);

  const runSQL = useCallback(async (customSql?: string) => {
    const q = customSql ?? sql;
    setLoading(true); setError(null); setResult(null);
    const start = Date.now();
    try {
      const res = await fetch('/api/sqlrun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: q, useDuckDB }),
      });
      const data = await res.json();
      if (!data.ok) { setError({ msg: data.error, suggestion: data.suggestion ?? '' }); return; }
      setResult({
        rows: data.rows,
        count: data.count,
        timing: data.timing ?? { fetchMs: Date.now() - start, sqlMs: 0, totalMs: Date.now() - start },
        parsed: data.parsed,
        explain: data.explain,
        engine: data.engine,
        schema: data.schema,
        duckdbError: data.duckdbError,
        duckdbSuggestion: data.duckdbSuggestion,
      });
      // Only set tab to chart on first result
      if (!hasShownResult[0]) {
        setTab('chart');
        hasShownResult[0] = true;
      }
      saveHistory(q, data.count);
      setHistory(getHistory());
    } catch (e) {
      setError({ msg: e instanceof Error ? e.message : 'Алдаа', suggestion: 'Интернет холболт шалгана уу' });
    } finally {
      setLoading(false);
    }
  }, [sql, useDuckDB, hasShownResult]);

  const exportCSV = useCallback(() => {
    if (!result) return;
    const blob = new Blob([toCSV(result.rows)], { type: 'text/csv;charset=utf-8' });
    const tableName = (result.explain?.table ?? 'data').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 60);
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${tableName}_${Date.now()}.csv`; a.click();
  }, [result]);

  return {
    sql, setSql, result, loading, error, setError,
    tab, setTab, history, useDuckDB, setUseDuckDB,
    runSQL, exportCSV,
  };
}
