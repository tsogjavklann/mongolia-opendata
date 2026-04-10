'use client';

import { useState, useCallback, useRef } from 'react';
import type { DimMeta, TableEntry } from '@/lib/types';

export function useGuidedMode() {
  const [guidedTable, setGuidedTable] = useState<TableEntry | null>(null);
  const [guidedDims, setGuidedDims] = useState<DimMeta[]>([]);
  const [guidedLoading, setGuidedLoading] = useState(false);
  const [guidedError, setGuidedError] = useState<string | null>(null);
  const retryRef = useRef(0);

  const loadGuidedTable = useCallback((t: TableEntry) => {
    setGuidedTable(t);
    setGuidedDims([]);
    setGuidedError(null);
    setGuidedLoading(true);
    retryRef.current = 0;

    const path = t.path.endsWith('.px') ? t.path : t.path + '.px';

    const attempt = (n: number) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      fetch(`/api/meta?path=${encodeURIComponent(path)}`, { signal: controller.signal })
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data: { ok: boolean; dims?: DimMeta[]; error?: string }) => {
          clearTimeout(timeout);
          if (data.ok && data.dims && data.dims.length > 0) {
            setGuidedDims(data.dims);
            setGuidedError(null);
            setGuidedLoading(false);
          } else if (n < 2) {
            // Автомат retry — 1.5 секунд хүлээгээд дахин
            retryRef.current = n + 1;
            setTimeout(() => attempt(n + 1), 1500);
          } else {
            setGuidedError(data.error || 'Хүснэгтийн dimension хоосон байна');
            setGuidedLoading(false);
          }
        })
        .catch(err => {
          clearTimeout(timeout);
          if (n < 2) {
            retryRef.current = n + 1;
            setTimeout(() => attempt(n + 1), 1500);
          } else {
            const msg = err instanceof Error ? err.message : String(err);
            setGuidedError(msg.includes('abort') ? 'API хугацаа хэтэрлээ (30с)' : msg);
            setGuidedLoading(false);
          }
        });
    };

    attempt(0);
  }, []);

  return { guidedTable, guidedDims, guidedLoading, guidedError, loadGuidedTable };
}
