'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQueryEngine } from '@/hooks/useQueryEngine';
import { useGuidedMode } from '@/hooks/useGuidedMode';
import AppHeader from '@/components/AppHeader';
import GuidedMode from '@/components/GuidedMode';
import SQLMode from '@/components/SQLMode';
import type { AIResult } from '@/components/AskAI';

const TablesMode = dynamic(() => import('@/components/TablesMode'), { ssr: false });
const RMode = dynamic(() => import('@/components/RMode'), { ssr: false });
const CompareMode = dynamic(() => import('@/components/CompareMode'), { ssr: false });

const DEFAULT_SQL = `SELECT *\nFROM "Population, household/1_Population, household/DT_NSO_0300_001V3.px"\nWHERE Gender IN ('0','1','2')\nLIMIT 500;`;

function AppInner() {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode') as 'guided' | 'sql' | 'tables' | 'compare' | 'r' | null;
  const urlQ = searchParams.get('q');

  const [mode, setMode] = useState<'guided' | 'sql' | 'tables' | 'compare' | 'r'>(urlMode ?? 'guided');

  const engine = useQueryEngine(urlQ ?? DEFAULT_SQL);
  const guided = useGuidedMode();

  // Compare-д prefill хийх state
  const [compareInitial, setCompareInitial] = useState<{
    leftSql: string; rightSql: string; leftLabel: string; rightLabel: string; autoRun: boolean;
  } | undefined>(undefined);

  // RMode (Python)-руу AI үүсгэсэн SQL + код дамжуулах state
  const [pythonInitial, setPythonInitial] = useState<{
    sql: string; code: string; autoRun: boolean;
  } | undefined>(undefined);

  const handleAIResult = (r: AIResult) => {
    if (r.format === 'sql' && r.sql) {
      engine.setSql(r.sql);
      engine.setTab('chart');
      setMode('sql');
      setTimeout(() => engine.runSQL(r.sql), 50);
    } else if (r.format === 'table' && r.sql) {
      engine.setSql(r.sql);
      engine.setTab('table');
      setMode('sql');
      setTimeout(() => engine.runSQL(r.sql), 50);
    } else if (r.format === 'compare' && r.leftSql && r.rightSql) {
      setCompareInitial({
        leftSql: r.leftSql,
        rightSql: r.rightSql,
        leftLabel: r.leftLabel ?? 'Зүүн',
        rightLabel: r.rightLabel ?? 'Баруун',
        autoRun: true,
      });
      setMode('compare');
    } else if (r.format === 'python' && r.sql && r.python) {
      // Python format → RMode (Python tab)-руу шилжиж SQL-аар өгөгдөл татаад
      // AI-ийн Python кодыг editor-д бөглөж autoRun хийнэ
      setPythonInitial({ sql: r.sql, code: r.python, autoRun: true });
      setMode('r');
    }
  };

  // Sync mode + sql to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (mode !== 'guided') params.set('mode', mode);
    if (mode === 'sql' && engine.sql !== DEFAULT_SQL) params.set('q', engine.sql);
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [mode, engine.sql]);

  return (
    <div className="min-h-screen font-sans" style={{ background: 'linear-gradient(180deg, #050a14 0%, #070e1a 50%, #050a14 100%)' }}>
      <AppHeader
        mode={mode}
        setMode={setMode}
        history={engine.history}
        onHistorySelect={(h) => { engine.setSql(h.sql); setMode('sql'); }}
        onExport={engine.result ? engine.exportCSV : null}
        onExportXLSX={engine.result ? engine.exportXLSX : null}
        currentSql={engine.sql}
        onLoadSql={(sql) => { engine.setSql(sql); setMode('sql'); }}
        activeTable={engine.result?.explain?.table}
        rowCount={engine.result?.count}
      />

      <main className="max-w-[1300px] mx-auto p-5">
        {mode === 'guided' && (
          <GuidedMode
            guidedTable={guided.guidedTable}
            guidedDims={guided.guidedDims}
            guidedLoading={guided.guidedLoading}
            guidedError={guided.guidedError}
            loadGuidedTable={guided.loadGuidedTable}
            onEditInSQL={(sql) => { engine.setSql(sql); setMode('sql'); }}
            onAIResult={handleAIResult}
          />
        )}

        {mode === 'tables' && (
          <TablesMode onUseInSQL={(alias: string) => {
            engine.setSql(`SELECT *\nFROM "${alias}"\nLIMIT 500;`);
            setMode('sql');
          }} />
        )}

        {mode === 'compare' && <CompareMode initial={compareInitial} />}

        {mode === 'r' && (
          <RMode
            initialData={!pythonInitial && engine.result ? { rows: engine.result.rows as Record<string, unknown>[], tableName: engine.result.explain?.table } : undefined}
            initialSql={pythonInitial?.sql}
            initialCode={pythonInitial?.code}
            autoRun={pythonInitial?.autoRun}
          />
        )}

        {mode === 'sql' && (
          <SQLMode
            sql={engine.sql}
            setSql={engine.setSql}
            result={engine.result}
            loading={engine.loading}
            error={engine.error}
            setError={engine.setError}
            tab={engine.tab}
            setTab={engine.setTab}
            useDuckDB={engine.useDuckDB}
            setUseDuckDB={engine.setUseDuckDB}
            runSQL={engine.runSQL}
          />
        )}
      </main>

      <footer className="mt-16 py-5 px-6" style={{ borderTop: '1px solid rgba(26,45,74,0.3)' }}>
        <div className="max-w-[1360px] mx-auto flex justify-between items-center text-[10px] text-ink-600 font-mono tracking-wider uppercase">
          <span className="font-display font-semibold">Монголын Нээлттэй Өгөгдөл</span>
          <span>ҮСХ · data.1212.mn</span>
        </div>
      </footer>

    </div>
  );
}

function PageFallback() {
  return (
    <div
      className="flex items-center justify-center h-screen flex-col gap-3"
      style={{ background: 'linear-gradient(180deg, #050a14 0%, #070e1a 50%, #050a14 100%)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse"
        style={{ background: 'linear-gradient(135deg, #00d68f 0%, #0080ff 100%)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14a9 3 0 0 0 18 0V5" />
          <path d="M3 12a9 3 0 0 0 18 0" />
        </svg>
      </div>
      <div className="text-[13px] text-ink-300 font-display font-bold">Монголын Нээлттэй Өгөгдөл</div>
      <div className="text-[11px] text-ink-600 font-mono tracking-wider">АЧААЛЛАЖ БАЙНА · 1,282 ХҮСНЭГТ</div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageFallback />}>
      <AppInner />
    </Suspense>
  );
}
