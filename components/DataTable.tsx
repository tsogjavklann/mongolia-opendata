'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import type { DataRow } from '@/lib/transform';
import { Button } from '@/components/ui/button';

interface DataTableProps {
  rows: DataRow[];
  pageSize?: number;
}

type SortDir = 'asc' | 'desc' | null;

export default function DataTable({ rows, pageSize = 100 }: DataTableProps) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  const numericCols = useMemo(() => {
    const set = new Set<string>();
    if (rows.length === 0) return set;
    const sample = rows.slice(0, 50);
    for (const h of headers) {
      const isNum = sample.every((r) => {
        const v = r[h];
        return (
          v === null ||
          v === undefined ||
          v === '' ||
          typeof v === 'number' ||
          (typeof v === 'string' && !isNaN(parseFloat(v)))
        );
      });
      if (isNum) set.add(h);
    }
    return set;
  }, [rows, headers]);

  const sorted = useMemo(() => {
    if (!sortCol || !sortDir) return rows;
    const isNum = numericCols.has(sortCol);
    return [...rows].sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      let cmp: number;
      if (isNum) {
        cmp =
          (typeof va === 'number' ? va : parseFloat(String(va))) -
          (typeof vb === 'number' ? vb : parseFloat(String(vb)));
      } else {
        cmp = String(va).localeCompare(String(vb), 'mn');
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [rows, sortCol, sortDir, numericCols]);

  if (rows.length === 0) return null;

  const totalPages = Math.ceil(sorted.length / pageSize);
  const display = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, sorted.length);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') {
        setSortCol(null);
        setSortDir(null);
      }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(0);
  };

  return (
    <div className="fade-in">
      <div className="table-container border-0 rounded-none">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} onClick={() => handleSort(h)} className={sortCol === h ? 'sorted' : ''}>
                  <span className="flex items-center gap-1">
                    {h}
                    <span className="sort-indicator">
                      {sortCol === h ? (
                        sortDir === 'asc' ? (
                          <ChevronUp size={10} />
                        ) : (
                          <ChevronDown size={10} />
                        )
                      ) : (
                        <ChevronsUpDown size={10} />
                      )}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map((row, i) => (
              <tr key={i}>
                {headers.map((h) => (
                  <td key={h} className={numericCols.has(h) ? 'numeric' : ''}>
                    {typeof row[h] === 'number'
                      ? (row[h] as number).toLocaleString('mn-MN')
                      : String(row[h] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border bg-surface-darker/40">
        <span className="text-[11px] text-muted-foreground font-mono">
          {from.toLocaleString()}–{to.toLocaleString()} / {sorted.length.toLocaleString()} мөр
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage(0)}
              disabled={page === 0}
              aria-label="First page"
            >
              <ChevronsLeft size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
            >
              <ChevronLeft size={13} />
            </Button>
            <span className="text-[11px] text-muted-foreground font-mono px-2 min-w-[64px] text-center">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRight size={13} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              aria-label="Last page"
            >
              <ChevronsRight size={13} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
