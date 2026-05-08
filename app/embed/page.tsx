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
    if (!sql) { setLoading(false); setError('SQL заагаагүй'); return; }
    fetch('/api/sqlrun', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, useDuckDB: true }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.ok) { setError(data.error ?? 'Татаж чадсангүй'); return; }
        setRows(data.rows ?? []);
        setCount(data.count ?? 0);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Сүлжээний алдаа'))
      .finally(() => setLoading(false));
  }, [sql]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0c1322',
        padding: 16,
        fontFamily: 'system-ui, sans-serif',
        color: '#e2e8f0',
      }}
    >
      {title && (
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: '#cbd5e1' }}>
          {title}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 10, color: '#64748b' }}>
          <Loader2 size={18} className="spin" />
          <span style={{ fontSize: 13 }}>Татаж байна...</span>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10 }}>
          <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, color: '#fca5a5', fontFamily: 'monospace' }}>{error}</span>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <DataChart rows={rows as any} />
          <div style={{
            marginTop: 8,
            fontSize: 10,
            fontFamily: 'monospace',
            color: '#475569',
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>{count.toLocaleString()} мөр · ҮСХ 1212.mn</span>
            <a
              href={`/?mode=sql&q=${encodeURIComponent(sql ?? '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#00c87a', textDecoration: 'none' }}
            >
              Эх сурвалж →
            </a>
          </div>
        </>
      )}

      {rows && rows.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b', fontSize: 13 }}>
          Өгөгдөл олдсонгүй
        </div>
      )}
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: '#94a3b8' }}>Ачааллаж байна...</div>}>
      <EmbedInner />
    </Suspense>
  );
}
