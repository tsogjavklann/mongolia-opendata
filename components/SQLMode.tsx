'use client';

import { useState, useEffect } from 'react';
import { Play, RefreshCw, AlertCircle, X, BarChart2, Sparkles, PanelRightClose, PanelRightOpen } from 'lucide-react';
import dynamic from 'next/dynamic';
import { smartInsert } from '@/lib/sqlParser';
import { ENGLISH_ALIASES } from '@/lib/dimensionMap';
import type { DimMeta, ParsedFilter, QueryResult } from '@/lib/types';
import DimSidebar from '@/components/DimSidebar';
import ResultsPanel from '@/components/ResultsPanel';
import TableSearch from '@/components/TableSearch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SchemaSidebar = dynamic(() => import('@/components/SchemaSidebar'), { ssr: false });
const SQLEditor = dynamic(() => import('@/components/SQLEditor'), { ssr: false });
const AliasTable = dynamic(() => import('@/components/AliasTable'), { ssr: false });

const SQL_EXAMPLES_BASIC = [
  { label: 'Хүн ам', sql: `SELECT *\nFROM "Population, household/1_Population, household/DT_NSO_0300_001V3.px"\nWHERE Хүйс IN ('0','1','2')\nLIMIT 500;` },
  { label: 'ДНБ салбараар', sql: `SELECT *\nFROM "Economy, environment/National Accounts/DT_NSO_0500_002V1.px"\nWHERE ОН BETWEEN '2015' AND '2025'\nLIMIT 300;` },
  { label: 'Малын тоо', sql: `SELECT *\nFROM "Regional development/Livestock/DT_NSO_1001_109V1.px"\nWHERE Он BETWEEN '2015' AND '2024'\nLIMIT 500;` },
];

const SQL_EXAMPLES_JOIN = [
  {
    label: 'Нэг хүнд ДНБ',
    desc: 'ДНБ / Хүн ам',
    sql: `SELECT a.ОН AS Жил,\n       a.VALUE AS ДНБ_сая_төг,\n       b.VALUE AS Хүн_ам,\n       ROUND(a.VALUE / NULLIF(b.VALUE, 0), 2) AS Нэг_хүнд_ДНБ\nFROM "gdp" a\nJOIN "population" b ON a.ОН = b.Он\nWHERE a.ОН BETWEEN '2010' AND '2025'\nORDER BY a.ОН;`,
  },
  {
    label: 'Ажилгүйдэл vs Инфляци',
    desc: 'Филлипсийн муруй',
    sql: `SELECT a.Он,\n       a.VALUE AS Ажилгүйдэл,\n       b.VALUE AS Инфляци,\n       ROUND(b.VALUE - a.VALUE, 2) AS Зөрүү\nFROM "unemployment" a\nJOIN "inflation" b ON a.Он = b.Он\nORDER BY a.Он;`,
  },
  {
    label: 'Мал / Малчин өрх',
    desc: 'Нэг өрхөд ногдох мал',
    sql: `SELECT a.Он,\n       a.VALUE AS Нийт_мал,\n       b.VALUE AS Малчин_өрх,\n       ROUND(a.VALUE / NULLIF(b.VALUE, 0), 0) AS Өрхөд_ногдох_мал\nFROM "Regional development/Livestock/DT_NSO_1001_109V1.px" a\nJOIN "Regional development/Livestock/DT_NSO_1001_120V2.px" b ON a.Он = b.Он\nWHERE a.Он BETWEEN '2010' AND '2024'\nORDER BY a.Он;`,
  },
];

const SQL_EXAMPLES_ADVANCED = [
  {
    label: 'ДНБ өсөлт %',
    desc: 'LAG ашиглан жилийн өсөлт',
    sql: `SELECT ОН AS Жил,\n       VALUE AS ДНБ,\n       LAG(VALUE) OVER (ORDER BY ОН) AS Өмнөх_жил,\n       ROUND((VALUE - LAG(VALUE) OVER (ORDER BY ОН)) * 100.0\n             / NULLIF(LAG(VALUE) OVER (ORDER BY ОН), 0), 1) AS Өсөлт_хувь\nFROM "Economy, environment/National Accounts/DT_NSO_0500_002V1.px"\nWHERE ОН BETWEEN '2005' AND '2025'\nORDER BY ОН;`,
  },
  {
    label: 'ДНБ салбарын бүтэц',
    desc: 'Хувийн жин тооцох',
    sql: `SELECT "Эдийн засгийн үйл ажиллагааны салбарын ангилал" AS Салбар,\n       VALUE AS ДНБ,\n       ROUND(VALUE * 100.0 / SUM(VALUE) OVER (), 2) AS Хувь\nFROM "Economy, environment/National Accounts/DT_NSO_0500_002V1.px"\nWHERE ОН = '2024'\n  AND "Эдийн засгийн үйл ажиллагааны салбарын ангилал" != 'Бүгд'\nORDER BY VALUE DESC;`,
  },
  {
    label: 'Топ 10 жуулчин',
    desc: '2024 онд хамгийн их',
    sql: `SELECT "Улсын нэр" AS Улс,\n       SUM(VALUE) AS Нийт_жуулчид,\n       RANK() OVER (ORDER BY SUM(VALUE) DESC) AS Байр\nFROM "Industry, service/Tourism/NUMBER OF INBOUND TOURISTS by country/DT_NSO_1800_003V202.px"\nWHERE Сар LIKE '2024%'\n  AND "Улсын нэр" != 'БҮГД'\nGROUP BY "Улсын нэр"\nORDER BY Нийт_жуулчид DESC\nLIMIT 10;`,
  },
];

const SQL_TEMPLATES = [
  { label: '5 жил', snippet: `Он BETWEEN '2020' AND '2024'` },
  { label: 'Хүйсээр', snippet: `Хүйс IN ('Эрэгтэй','Эмэгтэй')` },
  { label: 'Нийт', snippet: `Хүйс = 'Нийт дүн'` },
  { label: 'JOIN', snippet: `JOIN "table" b ON a.Он = b.Он` },
  { label: 'LAG', snippet: `LAG(VALUE) OVER (ORDER BY Он)` },
  { label: 'RANK', snippet: `RANK() OVER (ORDER BY VALUE DESC)` },
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
    <TooltipProvider delayDuration={150}>
      <div
        className="layout-main fade-up"
        style={{
          display: 'grid',
          gridTemplateColumns: sidebarOpen ? '1fr 280px' : '1fr',
          gap: 18,
          alignItems: 'start',
        }}
      >
        {/* ── LEFT: editor + results ─────────────────── */}
        <div className="flex flex-col gap-3.5 min-w-0">
          {/* Editor card */}
          <div className="rounded-card border border-border bg-card overflow-hidden shadow-elevated">
            {/* Header bar — search + sidebar toggle */}
            <div className="flex items-center gap-2 px-3.5 pt-3.5">
              <div className="flex-1">
                <TableSearch
                  onSelect={t => {
                    const path = t.path.endsWith('.px') ? t.path : t.path + '.px';
                    setSql(`SELECT *\nFROM "${path}"\nLIMIT 500;`);
                  }}
                  compact
                />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setSidebarOpen(s => !s)}
                    aria-label="Toggle sidebar"
                  >
                    {sidebarOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sidebar нуух / нээх</TooltipContent>
              </Tooltip>
            </div>

            {/* Examples / templates */}
            <div className="px-3.5 py-2.5 space-y-1.5 border-b border-border/40">
              <div className="flex gap-1.5 flex-wrap items-center">
                <span className="label-upper text-[9.5px] mr-1">Үндсэн</span>
                {SQL_EXAMPLES_BASIC.map(ex => (
                  <button key={ex.label} onClick={() => setSql(ex.sql)} className="btn-ghost">
                    {ex.label}
                  </button>
                ))}
                <span className="opacity-30">·</span>
                <span className="label-upper text-[9.5px] mr-1">JOIN</span>
                {SQL_EXAMPLES_JOIN.map(ex => (
                  <button key={ex.label} onClick={() => setSql(ex.sql)} className="btn-ghost" title={ex.desc}>
                    {ex.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap items-center">
                <span className="label-upper text-[9.5px] mr-1">Дэвшилтэт</span>
                {SQL_EXAMPLES_ADVANCED.map(ex => (
                  <button key={ex.label} onClick={() => setSql(ex.sql)} className="btn-ghost" title={ex.desc}>
                    {ex.label}
                  </button>
                ))}
                <span className="opacity-30">·</span>
                <span className="label-upper text-[9.5px] mr-1">Загвар</span>
                {SQL_TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => insertSnippet(t.snippet)} className="btn-ghost">
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor */}
            <div className="p-3.5">
              <SQLEditor
                value={sql}
                onChange={setSql}
                onRun={runSQL}
                columns={result?.schema ?? sqlDims.map(d => ({ name: d.label, englishAlias: d.englishAlias, type: 'text' }))}
                tables={allTables}
                aliases={allAliases}
                rows={9}
              />
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-t border-border/40 bg-surface-darker/40 flex-wrap">
              <Button onClick={() => runSQL()} disabled={loading} size="sm">
                {loading ? <RefreshCw size={13} className="spin" /> : <Play size={13} />}
                {loading ? 'Татаж байна' : 'Ажиллуулах'}
              </Button>

              {result && (
                <>
                  <Badge>{result.count.toLocaleString()} мөр</Badge>
                  {result.timing && (
                    <Badge variant="secondary">{result.timing.totalMs}ms</Badge>
                  )}
                </>
              )}

              {result?.parsed?.filters && result.parsed.filters.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center ml-1">
                  <span className="label-upper text-[9px]">Шүүлт</span>
                  {result.parsed.filters.slice(0, 4).map((f: ParsedFilter, i: number) => (
                    <Badge variant="outline" key={i} className="font-mono">
                      {(ENGLISH_ALIASES as Record<string, string>)[f.code] ?? f.code}:{' '}
                      {f.displayValues?.slice(0, 2).join(', ')}
                      {(f.displayValues?.length ?? 0) > 2 ? ` +${f.displayValues.length - 2}` : ''}
                    </Badge>
                  ))}
                </div>
              )}

              <span className="ml-auto text-[10px] text-muted-foreground font-mono tracking-wider uppercase">
                <kbd className="px-1.5 py-0.5 rounded bg-surface-overlay border border-border">Ctrl</kbd>{' '}
                +{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-surface-overlay border border-border">↵</kbd>
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg flex gap-2.5 items-start fade-up">
              <AlertCircle size={14} className="text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-destructive font-mono">{error.msg}</div>
                {error.suggestion && (
                  <div className="text-[11.5px] text-muted-foreground mt-1.5 px-2 py-1 bg-surface-darker rounded">
                    {error.suggestion}
                  </div>
                )}
              </div>
              <button onClick={() => setError(null)} className="icon-btn">
                <X size={13} />
              </button>
            </div>
          )}

          <ResultsPanel result={result} loading={loading} tab={tab} setTab={setTab} />

          {result?.duckdbError && (
            <div className="p-3 bg-accent3-dim border border-accent3/20 rounded-lg flex gap-2.5 items-start">
              <AlertCircle size={14} className="text-accent3 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[12px] text-accent3 font-mono">
                  DuckDB SQL алдаа — API өгөгдлийг харуулж байна
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{result.duckdbError}</div>
                {result.duckdbSuggestion && (
                  <div className="text-[11px] text-accent2 mt-0.5">{result.duckdbSuggestion}</div>
                )}
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="text-center py-16 text-muted-foreground/60 fade-up">
              <BarChart2 size={40} className="mx-auto mb-3 opacity-20" />
              <div className="text-sm font-display font-semibold text-foreground/70">
                SQL бичээд{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-surface-raised border border-border text-foreground">
                  Ctrl+Enter
                </kbd>{' '}
                дарна уу
              </div>
              <div className="text-xs mt-2">
                Year, Gender, Age, Region гэх мэт англи нэр ашиглаж болно
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: sidebar ─────────────────────────── */}
        {sidebarOpen && (
          <aside className="sticky top-[72px] flex flex-col gap-2.5 hide-mobile">
            {/* DuckDB toggle card */}
            <div className="sidebar-panel">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[12px] transition-colors"
                    style={{ background: useDuckDB ? 'var(--c-accent-dim)' : 'var(--c-surface-raised)' }}
                  >
                    <Sparkles size={11} className={useDuckDB ? 'text-accent' : 'text-muted-foreground'} />
                  </div>
                  <span className="text-[11.5px] font-display font-bold text-foreground">DuckDB</span>
                </div>
                <button
                  onClick={() => setUseDuckDB((p: boolean) => !p)}
                  className="relative w-10 h-[22px] rounded-full transition-all duration-300 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                  style={{
                    background: useDuckDB
                      ? 'linear-gradient(135deg, var(--c-accent), var(--c-accent-hover))'
                      : 'var(--c-input)',
                    boxShadow: useDuckDB ? '0 2px 8px var(--c-accent-glow)' : 'none',
                  }}
                  aria-pressed={useDuckDB}
                  aria-label="DuckDB toggle"
                >
                  <div
                    className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all duration-300"
                    style={{ left: useDuckDB ? 20 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                  />
                </button>
              </div>
              <div className="text-[10px] text-muted-foreground leading-relaxed font-mono">
                {useDuckDB ? 'JOIN · GROUP BY · WINDOW · RANK' : 'API filter — хялбар'}
              </div>
            </div>

            {/* Tabbed sidebar */}
            <div className="rounded-card border border-border bg-card overflow-hidden">
              <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as typeof rightTab)} className="w-full">
                <TabsList className="w-full h-9 grid grid-cols-3 rounded-none border-x-0 border-t-0 border-b border-border bg-surface-darker/40">
                  <TabsTrigger value="alias" className="rounded-none">Alias</TabsTrigger>
                  <TabsTrigger value="schema" className="rounded-none">Schema</TabsTrigger>
                  <TabsTrigger value="dims" className="rounded-none">Filter</TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[calc(100vh-340px)] mt-0">
                  <div className="p-3.5">
                    <TabsContent value="alias" className="mt-0">
                      <AliasTable
                        onInsert={(alias: string) => {
                          setSql((s: string) => {
                            const trimmed = s.trimEnd();
                            const needsSpace = trimmed.length > 0 && !trimmed.endsWith('"');
                            return trimmed + (needsSpace ? ' ' : '') + `"${alias}"`;
                          });
                        }}
                      />
                    </TabsContent>
                    <TabsContent value="schema" className="mt-0">
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
                    </TabsContent>
                    <TabsContent value="dims" className="mt-0">
                      {sqlDims.length > 0 ? (
                        <DimSidebar dims={sqlDims} loading={sqlDimsLoading} onInsert={insertSnippet} />
                      ) : (
                        <div className="text-xs text-muted-foreground text-center py-5">
                          SQL ажиллуулахад dimension-ууд гарна
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </div>

            {/* Syntax reference */}
            <div className="card p-3">
              <div className="label-upper mb-2">Синтакс</div>
              <pre className="font-mono text-[10.5px] text-muted-foreground leading-relaxed m-0 whitespace-pre-wrap">
{`SELECT a.Он, a.VALUE, b.VALUE
FROM "table1" a
JOIN "table2" b ON a.Он = b.Он
WHERE a.Он BETWEEN 2018 AND 2024
  AND Gender IN ('1','2')
ORDER BY a.Он;`}
              </pre>
            </div>
          </aside>
        )}
      </div>
    </TooltipProvider>
  );
}
