'use client';

import { useState, useCallback } from 'react';
import type { DimMeta, TableEntry } from '@/lib/types';

export function useGuidedMode() {
  const [guidedTable, setGuidedTable] = useState<TableEntry | null>(null);
  const [guidedDims, setGuidedDims] = useState<DimMeta[]>([]);
  const [guidedLoading, setGuidedLoading] = useState(false);

  const loadGuidedTable = useCallback((t: TableEntry) => {
    setGuidedTable(t);
    setGuidedDims([]);
    setGuidedLoading(true);
    const path = t.path.endsWith('.px') ? t.path : t.path + '.px';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    fetch(`/api/meta?path=${encodeURIComponent(path)}`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: { ok: boolean; dims?: DimMeta[]; error?: string }) => {
        clearTimeout(timeout);
        if (data.ok && data.dims && data.dims.length > 0) {
          setGuidedDims(data.dims);
        } else {
          console.error('[guided dims] empty or error:', data.error);
        }
      })
      .catch(err => {
        clearTimeout(timeout);
        console.error('[guided dims]', err);
      })
      .finally(() => setGuidedLoading(false));
  }, []);

  return { guidedTable, guidedDims, guidedLoading, loadGuidedTable };
}
