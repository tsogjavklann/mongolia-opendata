'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, AlertCircle } from 'lucide-react';

const DataChart = dynamic(() => import('@/components/DataChart'), { ssr: false });

function EmbedInner() {
  const params = useSearchParams();
  const sql = params.get('q');
  const title = params.get('title') ?? '';

  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!sql) {
      setLoading(false);
      setError('SQL заагаагүй');
      return;
    }
    fetch('/api/sqlrun', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, useDuckDB: true }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setError(data.error ?? 'Татаж чадсангүй');
          return;
        }
        setRows(data.rows ?? []);
        setCount(data.count ?? 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Сүлжээний алдаа'))
      .finally(() => setLoading(false));
  }, [sql]);

  return (
    <div className="min-h-screen bg-card p-4 font-sans text-foreground">
      {title && (
        <div className="text-sm font-display font-bold mb-2.5 text-foreground">{title}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-16 gap-2.5 text-muted-foreground">
          <Loader2 size={18} className="spin text-accent" />
          <span className="text-[13px]">Татаж байна...</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <AlertCircle size={16} className="text-destructive flex-shrink-0 mt-0.5" />
          <span className="text-xs text-destructive font-mono">{error}</span>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <DataChart rows={rows as any} />
          <div className="mt-2 text-[10px] font-mono text-muted-foreground flex justify-between">
            <span>{count.toLocaleString()} мөр · ҮСХ 1212.mn</span>
            <a
              href={`/?mode=sql&q=${encodeURIComponent(sql ?? '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent no-underline hover:underline"
            >
              Эх сурвалж →
            </a>
          </div>
        </>
      )}

      {rows && rows.length === 0 && !loading && (
        <div className="text-center p-16 text-muted-foreground text-[13px]">
          Өгөгдөл олдсонгүй
        </div>
      )}
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-muted-foreground bg-card min-h-screen">Ачааллаж байна...</div>
      }
    >
      <EmbedInner />
    </Suspense>
  );
}
