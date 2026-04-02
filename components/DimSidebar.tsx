'use client';

import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import type { DimMeta } from '@/lib/types';

interface Props {
  dims: DimMeta[];
  loading: boolean;
  onInsert: (s: string) => void;
}

export default function DimSidebar({ dims, loading, onInsert }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [sel, setSel] = useState<Record<string, Set<string>>>({});
  const [q, setQ] = useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = useState('');

  if (loading) return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-9 rounded-md" />)}
    </div>
  );

  if (!dims.length) return (
    <div className="text-center py-5 px-3">
      <Filter size={20} className="mx-auto mb-2 text-ink-700 opacity-40" />
      <div className="text-xs text-ink-500 mb-1">Filter шүүлтүүд</div>
      <div className="text-[10.5px] text-ink-700 leading-relaxed">
        SQL ажиллуулахад энд dimension шүүлтүүд гарна.
        Утга сонгоод WHERE clause-д нэмж болно.
      </div>
    </div>
  );

  const filteredDims = globalSearch
    ? dims.filter(d =>
        d.label.toLowerCase().includes(globalSearch.toLowerCase()) ||
        d.englishAlias.toLowerCase().includes(globalSearch.toLowerCase())
      )
    : dims;

  return (
    <div className="flex flex-col gap-1">
      {/* Global search */}
      {dims.length > 3 && (
        <div className="relative mb-1">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-600 pointer-events-none" />
          <input
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            placeholder="Dimension хайх..."
            className="input-search text-[11px] py-1.5 pl-7 pr-2"
          />
        </div>
      )}

      {filteredDims.map(d => {
        const isOpen = open === d.code;
        const s = sel[d.code] ?? new Set<string>();
        const dq = q[d.code] ?? '';
        const vals = d.values.filter(v => !dq || v.label.toLowerCase().includes(dq.toLowerCase()) || v.code.includes(dq));
        return (
          <div key={d.code} className={`rounded-lg border transition-colors ${isOpen ? 'border-border bg-surface-dark' : 'border-transparent'}`}>
            <button onClick={() => setOpen(isOpen ? null : d.code)}
              className="flex items-center w-full py-1.5 px-2.5 bg-transparent border-none cursor-pointer gap-1.5 hover:bg-surface-dark rounded-lg transition-colors">
              <span className="text-[11.5px] font-bold text-accent2 font-mono">{d.englishAlias}</span>
              <span className="text-[10.5px] text-ink-600 overflow-hidden text-ellipsis whitespace-nowrap">({d.label})</span>
              <span className="ml-auto text-[9px] text-ink-700">{isOpen ? '\u25B2' : '\u25BC'}</span>
              {s.size > 0 && (
                <span className="text-[9px] bg-accent-dim text-accent border border-accent/30 rounded-full px-1.5">{s.size}</span>
              )}
            </button>
            {isOpen && (
              <div className="px-2.5 pb-2.5">
                {d.values.length > 6 && (
                  <input value={dq} onChange={e => setQ(p => ({ ...p, [d.code]: e.target.value }))}
                    placeholder="Утга хайх..."
                    className="input-search text-[11px] py-1 px-2 mb-1.5"
                  />
                )}
                <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto">
                  {vals.slice(0, 40).map(v => {
                    const isSel = s.has(v.code);
                    return (
                      <button key={v.code} onClick={() => {
                        const ns = new Set(s); isSel ? ns.delete(v.code) : ns.add(v.code);
                        setSel(p => ({ ...p, [d.code]: ns }));
                      }} title={`'${v.code}'`}
                        className={`px-2 py-0.5 text-[10.5px] rounded cursor-pointer transition-all duration-100 ${
                          isSel
                            ? 'border-[1.5px] border-accent bg-accent-dim text-accent'
                            : 'border border-border bg-transparent text-ink-500 hover:border-accent/50 hover:text-ink-300'
                        }`}>
                        {v.label || v.code}
                      </button>
                    );
                  })}
                  {vals.length > 40 && (
                    <span className="text-[10px] text-ink-700 px-2 self-center">
                      +{vals.length - 40} (хайж шүүнэ үү)
                    </span>
                  )}
                </div>
                {s.size > 0 && (
                  <button onClick={() => {
                    onInsert(`${d.englishAlias} IN (${Array.from(s).map(v => `'${v}'`).join(',')})`);
                    setSel(p => ({ ...p, [d.code]: new Set() }));
                  }}
                    className="btn-primary w-full mt-2 text-[11px] py-1.5 justify-center">
                    WHERE {d.englishAlias} IN ({s.size}) nэм
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
