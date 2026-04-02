'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import type { TableEntry } from '@/lib/types';

interface AliasEntry {
  alias: string;
  id: string;
  path: string;
  label: string;
  category: string;
}

interface Props {
  onSelect: (entry: TableEntry) => void;
  placeholder?: string;
  compact?: boolean;
}

export default function TableSearch({ onSelect, placeholder, compact }: Props) {
  const [q, setQ] = useState('');
  const [tables, setTables] = useState<TableEntry[]>([]);
  const [aliasMap, setAliasMap] = useState<Record<string, AliasEntry>>({});
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/tables.json').then(r => r.json()).then(setTables).catch(() => {});
    fetch('/aliases.json').then(r => r.json()).then((data: AliasEntry[]) => {
      const map: Record<string, AliasEntry> = {};
      data.forEach(a => { map[a.alias] = a; });
      setAliasMap(map);
    }).catch(() => {});
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = q.trim()
    ? (() => {
        const lq = q.toLowerCase();
        const aliasMatches = Object.entries(aliasMap)
          .filter(([alias, a]) =>
            alias.toLowerCase().includes(lq) ||
            a.label.toLowerCase().includes(lq) ||
            a.id.toLowerCase().includes(lq)
          )
          .map(([alias, a]) => {
            const tbl = tables.find(t => t.path === a.path || t.id === a.id + '.px' || t.id === a.id);
            return tbl
              ? { ...tbl, _alias: alias }
              : { id: a.id, path: a.path, text: a.label, category: a.category, _alias: alias };
          })
          .slice(0, 8);
        const tableMatches = tables.filter(t =>
          !aliasMatches.find(m => m.id === t.id || m.id === t.id.replace('.px', '')) &&
          (t.text.toLowerCase().includes(lq) || t.id.toLowerCase().includes(lq))
        ).map(t => ({ ...t, _alias: undefined as string | undefined })).slice(0, 6);
        return [...aliasMatches, ...tableMatches].slice(0, 12);
      })()
    : [];

  return (
    <div ref={ref} className="relative">
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700 pointer-events-none z-[1]" />
      <input value={q} onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => q && setOpen(true)}
        placeholder={placeholder ?? 'Хүснэгт хайх... (монгол/англи нэр, alias)'}
        className={`input-search ${compact ? 'py-2 pl-8 pr-7 text-xs' : 'py-2.5 pl-8 pr-7 text-[13.5px]'}`}
      />
      {q && (
        <button onClick={() => { setQ(''); setOpen(false); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 icon-btn p-0.5">
          <X size={12} />
        </button>
      )}
      {open && filtered.length > 0 && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[500] bg-surface border border-border rounded-card max-h-[280px] overflow-y-auto shadow-lg shadow-black/70">
          {filtered.map((t, i) => (
            <button key={i} onClick={() => { onSelect(t); setQ(t.text); setOpen(false); }}
              className="block w-full text-left px-3.5 py-2.5 bg-transparent border-none border-b border-border/35 cursor-pointer hover:bg-accent-dim transition-colors">
              <div className="text-xs text-ink-200 flex items-center gap-1.5">
                {t._alias && <code className="text-[10.5px] bg-accent2-dim text-accent2 px-1.5 py-0.5 rounded">{t._alias}</code>}
                {t.text}
              </div>
              <div className="text-[10.5px] text-ink-700 mt-0.5 font-mono">
                {t.category && <span className="text-accent2 mr-1.5">{t.category}</span>}{t.id}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
