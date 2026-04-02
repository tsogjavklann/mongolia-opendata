'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Table2, BookOpen, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { QueryResult } from '@/lib/types';

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
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card">
      {/* Progress header */}
      <div className="flex items-center gap-3 mb-4">
        <RefreshCw size={16} className="text-accent spin" />
        <div>
          <div className="text-sm text-ink-400">Өгөгдөл татаж байна...</div>
          <div className="text-[11px] text-ink-600 mt-0.5">
            {elapsed}с өнгөрлөө {elapsed > 10 && '· ихэвчлэн 30-60с'}
          </div>
        </div>
      </div>
      {/* Progress bar */}
      <div className="w-full h-1 bg-border rounded-full overflow-hidden mb-4">
        <div className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.min(92, (elapsed / 50) * 100)}%` }} />
      </div>
      {/* Chart skeleton */}
      <div className="skeleton w-full rounded-lg" style={{ height: 240 }}>
        <div className="flex items-end justify-around h-full px-8 pb-6 pt-10 gap-3">
          {[60, 85, 45, 70, 90, 55, 75, 40, 65, 80].map((h, i) => (
            <div key={i} className="skeleton rounded-t flex-1" style={{ height: `${h}%`, opacity: 0.3 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPanel({ result, loading, tab, setTab }: Props) {
  if (loading) return <LoadingSkeleton />;
  if (!result) return null;

  return (
    <div className="animate-fade-up">
      {/* Tab switcher */}
      <div className="flex bg-surface-dark border border-border rounded-lg p-[3px] gap-0.5 w-fit mb-3">
        {([['chart', BarChart2, 'График'], ['table', Table2, 'Хүснэгт'], ['explain', BookOpen, 'Тайлбар']] as const).map(([t, Icon, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border-none cursor-pointer text-xs font-semibold transition-all duration-150"
            style={{
              background: tab === t ? '#00c87a' : 'transparent',
              color: tab === t ? '#000' : '#475569',
            }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Chart view */}
      {tab === 'chart' && (
        <div className="card">
          {result.rows.length > 0
            ? <DataChart rows={result.rows} />
            : (
              <div className="text-center py-9 text-ink-700">
                <BarChart2 size={26} className="mx-auto mb-2 opacity-20" />
                <div className="text-[13px]">Өгөгдөл олдсонгүй</div>
              </div>
            )}
        </div>
      )}

      {/* Table view — now with full DataTable component */}
      {tab === 'table' && (
        <div className="card p-0 overflow-hidden">
          <DataTable rows={result.rows} />
        </div>
      )}

      {/* Explain view */}
      {tab === 'explain' && result.explain && (
        <div className="p-3.5 px-4 bg-accent2/5 rounded-card border border-accent2/10">
          <div className="label-upper mb-2.5">Тайлбар</div>
          <div className="text-[13px] text-ink-400 mb-1.5">
            <span className="text-accent2 font-semibold">Хүснэгт: </span>{result.explain.table}
          </div>
          {result.explain.filters.map((f, i) => (
            <div key={i} className="text-[13px] text-ink-400 mb-1">
              <span className="text-accent font-semibold">Шүүлт {i + 1}: </span>{f}
            </div>
          ))}
          {!result.explain.filters.length && (
            <div className="text-xs text-ink-700">Шүүлтгүй — бүх өгөгдлийг татсан</div>
          )}
          <div className="text-[13px] text-ink-400 mt-1">
            <span className="text-accent3 font-semibold">Хязгаар: </span>{result.explain.limit.toLocaleString()} мөр
          </div>
        </div>
      )}
    </div>
  );
}
