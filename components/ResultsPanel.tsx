'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Table2, BookOpen, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { QueryResult } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export type { QueryResult } from '@/lib/types';

const DataChart = dynamic(() => import('@/components/DataChart'), { ssr: false });
const DataTable = dynamic(() => import('@/components/DataTable'), { ssr: false });

interface Props {
  result: QueryResult | null;
  loading: boolean;
  tab: 'chart' | 'table' | 'explain';
  setTab: (t: 'chart' | 'table' | 'explain') => void;
}

function LoadingSkeleton() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const stage =
    elapsed < 3
      ? '1212.mn-аас өгөгдөл татаж байна'
      : elapsed < 8
        ? 'PX-Web хариу хүлээж байна'
        : elapsed < 20
          ? 'json-stat2 хөрвүүлж DuckDB-д ачаалж байна'
          : 'Сервер удаан хариу өгч байна — түр хүлээгээрэй';

  return (
    <div className="rounded-card border border-border bg-card p-5 fade-up">
      {/* Progress header */}
      <div className="flex items-center gap-3 mb-4">
        <Loader2 size={16} className="text-accent spin" />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-foreground font-display font-semibold truncate">{stage}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
            {elapsed}с өнгөрлөө {elapsed > 10 && '· ихэвчлэн 30-60с'}
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          DuckDB
        </div>
      </div>
      {/* Progress bar */}
      <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent-hover rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(92, (elapsed / 50) * 100)}%` }}
        />
      </div>
      {/* Skeleton chart */}
      <div className="space-y-3">
        <div className="flex items-end justify-around h-[200px] gap-2 px-4">
          {[60, 85, 45, 70, 90, 55, 75, 40, 65, 80, 50, 78].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-2 w-10" />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyDataState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <BarChart2 size={32} className="mx-auto mb-2 opacity-20" />
      <div className="text-sm font-display font-semibold">Өгөгдөл олдсонгүй</div>
      <div className="text-xs mt-1.5 opacity-60">Шүүлтийн нөхцөлөө шалгана уу</div>
    </div>
  );
}

export default function ResultsPanel({ result, loading, tab, setTab }: Props) {
  if (loading) return <LoadingSkeleton />;
  if (!result) return null;

  return (
    <div className="fade-up">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Props['tab'])}>
        <TabsList>
          <TabsTrigger value="chart">
            <BarChart2 size={12} />
            График
          </TabsTrigger>
          <TabsTrigger value="table">
            <Table2 size={12} />
            Хүснэгт
          </TabsTrigger>
          <TabsTrigger value="explain">
            <BookOpen size={12} />
            Тайлбар
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <div className="rounded-card border border-border bg-card p-5">
            {result.rows.length > 0 ? <DataChart rows={result.rows} /> : <EmptyDataState />}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <div className="rounded-card border border-border bg-card overflow-hidden">
            {result.rows.length > 0 ? <DataTable rows={result.rows} /> : <EmptyDataState />}
          </div>
        </TabsContent>

        <TabsContent value="explain">
          {result.explain ? (
            <div className="rounded-card border border-border bg-card p-5 space-y-3">
              <div className="label-upper">Тайлбар</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-surface-darker/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">
                    Хүснэгт
                  </div>
                  <div className="text-[13px] text-foreground font-mono break-all">
                    {result.explain.table}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-darker/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">
                    Хязгаар
                  </div>
                  <div className="text-[13px] text-accent3 font-mono">
                    {result.explain.limit.toLocaleString()} мөр
                  </div>
                </div>
              </div>

              {result.explain.filters.length > 0 ? (
                <div className="rounded-lg border border-border bg-surface-darker/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">
                    Шүүлтүүд ({result.explain.filters.length})
                  </div>
                  <ul className="space-y-1">
                    {result.explain.filters.map((f, i) => (
                      <li key={i} className="text-[12.5px] text-foreground font-mono">
                        <span className="text-accent mr-1.5">▸</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Шүүлтгүй — бүх өгөгдлийг татсан</div>
              )}
            </div>
          ) : (
            <EmptyDataState />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
