'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQueryEngine } from '@/hooks/useQueryEngine';
import { useGuidedMode } from '@/hooks/useGuidedMode';
import { useSession } from '@/hooks/useSession';
import { useProfile } from '@/hooks/useProfile';
import AppHeader from '@/components/AppHeader';
import GuidedMode from '@/components/GuidedMode';
import SQLMode from '@/components/SQLMode';
import { CommandPalette } from '@/components/CommandPalette';
import { WelcomeModal } from '@/components/WelcomeModal';
import type { AIResult } from '@/components/AskAI';

const TablesMode = dynamic(() => import('@/components/TablesMode'), { ssr: false });
const RMode = dynamic(() => import('@/components/RMode'), { ssr: false });
const CompareMode = dynamic(() => import('@/components/CompareMode'), { ssr: false });

const DEFAULT_SQL = `SELECT *\nFROM "Population, household/1_Population, household/DT_NSO_0300_001V3.px"\nWHERE Gender IN ('0','1','2')\nLIMIT 500;`;

const WELCOME_FLAG = 'mn_welcome_seen';

type Mode = 'guided' | 'sql' | 'tables' | 'compare' | 'r';

interface ProvidersConfig {
  google: boolean;
  github: boolean;
}

function AppInner() {
  const searchParams = useSearchParams();
  const urlMode = searchParams.get('mode') as Mode | null;
  const urlQ = searchParams.get('q');

  const [mode, setMode] = useState<Mode>(urlMode ?? 'guided');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [providers, setProviders] = useState<ProvidersConfig>({ google: false, github: false });

  const session = useSession();
  const { profile, hydrated: profileHydrated } = useProfile();
  const engine = useQueryEngine(urlQ ?? DEFAULT_SQL);
  const guided = useGuidedMode();

  const [compareInitial, setCompareInitial] = useState<{
    leftSql: string;
    rightSql: string;
    leftLabel: string;
    rightLabel: string;
    autoRun: boolean;
  } | undefined>(undefined);

  const [pythonInitial, setPythonInitial] = useState<{
    sql: string;
    code: string;
    autoRun: boolean;
  } | undefined>(undefined);

  // ── Load enabled OAuth providers (Auth.js auto-exposes /api/auth/providers)
  useEffect(() => {
    fetch('/api/auth/providers', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || typeof data !== 'object') return;
        setProviders({
          google: 'google' in data,
          github: 'github' in data,
        });
      })
      .catch(() => {});
  }, []);

  // ── First-visit welcome modal — show only if no OAuth session AND no local profile
  useEffect(() => {
    if (session.status !== 'unauthenticated') return;
    if (!profileHydrated) return;
    if (profile) return; // already has local profile
    try {
      const seen = window.localStorage.getItem(WELCOME_FLAG);
      if (!seen) {
        const t = setTimeout(() => setAuthOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore localStorage failures */
    }
  }, [session.status, profile, profileHydrated]);

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
      setPythonInitial({ sql: r.sql, code: r.python, autoRun: true });
      setMode('r');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (mode !== 'guided') params.set('mode', mode);
    if (mode === 'sql' && engine.sql !== DEFAULT_SQL) params.set('q', engine.sql);
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [mode, engine.sql]);

  const handleCloseAuth = () => {
    setAuthOpen(false);
    try {
      window.localStorage.setItem(WELCOME_FLAG, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen font-sans">
      <AppHeader
        mode={mode}
        setMode={setMode}
        history={engine.history}
        onHistorySelect={(h) => {
          engine.setSql(h.sql);
          setMode('sql');
        }}
        onExport={engine.result ? engine.exportCSV : null}
        onExportXLSX={engine.result ? engine.exportXLSX : null}
        currentSql={engine.sql}
        onLoadSql={(sql) => {
          engine.setSql(sql);
          setMode('sql');
        }}
        activeTable={engine.result?.explain?.table}
        rowCount={engine.result?.count}
        onOpenCommand={() => setCmdOpen(true)}
        onOpenAuthModal={() => setAuthOpen(true)}
      />

      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        setMode={setMode}
        onUseTable={(alias) => {
          engine.setSql(`SELECT *\nFROM "${alias}"\nLIMIT 500;`);
          setMode('sql');
        }}
        history={engine.history}
        onHistorySelect={(h) => {
          engine.setSql(h.sql);
          setMode('sql');
        }}
      />

      <WelcomeModal
        open={authOpen}
        onOpenChange={(o) => (o ? setAuthOpen(true) : handleCloseAuth())}
        authConfigured={providers.google || providers.github}
        googleEnabled={providers.google}
        githubEnabled={providers.github}
        onContinueAnonymously={handleCloseAuth}
        onProfileSaved={handleCloseAuth}
      />

      <main className="max-w-[1300px] mx-auto p-5">
        {mode === 'guided' && (
          <GuidedMode
            guidedTable={guided.guidedTable}
            guidedDims={guided.guidedDims}
            guidedLoading={guided.guidedLoading}
            guidedError={guided.guidedError}
            loadGuidedTable={guided.loadGuidedTable}
            onEditInSQL={(sql) => {
              engine.setSql(sql);
              setMode('sql');
            }}
            onAIResult={handleAIResult}
          />
        )}

        {mode === 'tables' && (
          <TablesMode
            onUseInSQL={(alias: string) => {
              engine.setSql(`SELECT *\nFROM "${alias}"\nLIMIT 500;`);
              setMode('sql');
            }}
          />
        )}

        {mode === 'compare' && <CompareMode initial={compareInitial} />}

        {mode === 'r' && (
          <RMode
            initialData={
              !pythonInitial && engine.result
                ? {
                    rows: engine.result.rows as Record<string, unknown>[],
                    tableName: engine.result.explain?.table,
                  }
                : undefined
            }
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

      <footer className="mt-16 border-t border-border/40">
        <div className="max-w-[1440px] mx-auto px-6 py-5 flex items-center justify-between text-[10px] text-muted-foreground font-mono tracking-wider uppercase">
          <span className="font-display font-semibold text-foreground/70">
            Mongolia OpenData
          </span>
          <span>ҮСХ · data.1212.mn · DuckDB · Next.js</span>
        </div>
      </footer>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-screen flex-col gap-3 bg-background">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse"
        style={{ background: 'linear-gradient(135deg, var(--c-accent), var(--c-accent2))' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14a9 3 0 0 0 18 0V5" />
          <path d="M3 12a9 3 0 0 0 18 0" />
        </svg>
      </div>
      <div className="text-[13px] text-foreground font-display font-bold">Mongolia OpenData</div>
      <div className="text-[11px] text-muted-foreground font-mono tracking-wider">
        АЧААЛЛАЖ БАЙНА · 1,282 ХҮСНЭГТ
      </div>
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
