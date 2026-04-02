'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQueryEngine } from '@/hooks/useQueryEngine';
import { useGuidedMode } from '@/hooks/useGuidedMode';
import AppHeader from '@/components/AppHeader';
import GuidedMode from '@/components/GuidedMode';
import SQLMode from '@/components/SQLMode';

const TablesMode = dynamic(() => import('@/components/TablesMode'), { ssr: false });
const RMode = dynamic(() => import('@/components/RMode'), { ssr: false });

const DEFAULT_SQL = `SELECT *\nFROM "Population, household/1_Population, household/DT_NSO_0300_001V3.px"\nWHERE Gender IN ('0','1','2')\nLIMIT 500;`;

function AppInner() {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode') as 'guided' | 'sql' | 'tables' | 'r' | null;
  const urlQ = searchParams.get('q');

  const [mode, setMode] = useState<'guided' | 'sql' | 'tables' | 'r'>(urlMode ?? 'guided');

  const engine = useQueryEngine(urlQ ?? DEFAULT_SQL);
  const guided = useGuidedMode();

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
      />

      <main className="max-w-[1300px] mx-auto p-5">
        {mode === 'guided' && (
          <GuidedMode
            guidedTable={guided.guidedTable}
            guidedDims={guided.guidedDims}
            guidedLoading={guided.guidedLoading}
            loadGuidedTable={guided.loadGuidedTable}
            onEditInSQL={(sql) => { engine.setSql(sql); setMode('sql'); }}
          />
        )}

        {mode === 'tables' && (
          <TablesMode onUseInSQL={(alias: string) => {
            engine.setSql(`SELECT *\nFROM "${alias}"\nLIMIT 500;`);
            setMode('sql');
          }} />
        )}

        {mode === 'r' && <RMode />}

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

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-ink-600">Ачааллаж байна...</div>}>
      <AppInner />
    </Suspense>
  );
}
