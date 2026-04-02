'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { DataRow } from '@/lib/transform';

interface DataTableProps {
  rows: DataRow[];
  pageSize?: number;
}

type SortDir = 'asc' | 'desc' | null;

export default function DataTable({ rows, pageSize = 100 }: DataTableProps) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);

  if (rows.length === 0) return null;
  const headers = Object.keys(rows[0]);

  // Detect numeric columns
  const numericCols = useMemo(() => {
    const set = new Set<string>();
    const sample = rows.slice(0, 50);
    for (const h of headers) {
      const isNum = sample.every(r => {
        const v = r[h];
        return v === null || v === undefined || v === '' || typeof v === 'number' ||
          (typeof v === 'string' && !isNaN(parseFloat(v)));
      });
      if (isNum) set.add(h);
    }
    return set;
  }, [rows, headers]);

  // Sort
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
        cmp = (typeof va === 'number' ? va : parseFloat(String(va))) -
              (typeof vb === 'number' ? vb : parseFloat(String(vb)));
      } else {
        cmp = String(va).localeCompare(String(vb), 'mn');
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [rows, sortCol, sortDir, numericCols]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize);
  const display = sorted.slice(page * pageSize, (page + 1) * pageSize);
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, sorted.length);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortCol(null); setSortDir(null); }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(0);
  };

  return (
    <div className="fade-in">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map(h => (
                <th key={h} onClick={() => handleSort(h)}
                  className={sortCol === h ? 'sorted' : ''}>
                  <span className="flex items-center gap-1">
                    {h}
                    <span className="sort-indicator">
                      {sortCol === h ? (
                        sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
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
                {headers.map(h => (
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

      {/* Footer with pagination */}
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-[11px] text-ink-500 font-mono">
          {from.toLocaleString()}-{to.toLocaleString()} / {sorted.length.toLocaleString()} мөр
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0}
              className="btn-ghost text-[10px] px-2 py-1 disabled:opacity-30">
              &#171;
            </button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="btn-ghost text-[10px] px-2 py-1 disabled:opacity-30">
              &#8249;
            </button>
            <span className="text-[11px] text-ink-400 font-mono px-2">
              {page + 1}/{totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="btn-ghost text-[10px] px-2 py-1 disabled:opacity-30">
              &#8250;
            </button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
              className="btn-ghost text-[10px] px-2 py-1 disabled:opacity-30">
              &#187;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
