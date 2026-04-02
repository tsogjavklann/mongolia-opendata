'use client';
import { useState, useEffect, useMemo } from 'react';
import { Copy, Check, Search } from 'lucide-react';
import type { TableAlias } from '@/lib/tableAliases';
import { loadAliases } from '@/lib/tableAliases';

interface Props { onInsert: (alias: string) => void; }

const CAT_COLOR: Record<string, string> = {
  'Хүн ам, өрх':                    '#5b9cf6',
  'Эдийн засаг, байгаль орчин':      '#00d68f',
  'Хөдөлмөр, бизнес':               '#f05252',
  'Боловсрол, эрүүл мэнд':          '#c084fc',
  'Үйлдвэрлэл, үйлчилгээ':          '#f0b040',
  'Нийгэм, хөгжил':                  '#34d399',
  'Бүсчилсэн хөгжлийн үзүүлэлтүүд': '#fb923c',
  'Түүхэн Статистик':                '#8898b0',
};

export default function AliasTable({ onInsert }: Props) {
  const [aliases, setAliases] = useState<TableAlias[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState('');

  useEffect(() => { loadAliases().then(d => { setAliases(d); setLoading(false); }); }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return null;
    const lq = q.toLowerCase();
    return aliases.filter(a => a.alias.includes(lq) || a.label.toLowerCase().includes(lq) || a.category.toLowerCase().includes(lq)).slice(0, 40);
  }, [q, aliases]);

  const categories = useMemo(() => [...new Set(aliases.map(a => a.category))], [aliases]);
  const byCategory = (cat: string) => aliases.filter(a => a.category === cat);
  const handleCopy = (alias: string) => { onInsert(alias); setCopied(alias); setTimeout(() => setCopied(null), 1200); };

  const ItemRow = ({ a }: { a: TableAlias }) => {
    const color = CAT_COLOR[a.category] ?? '#8898b0';
    return (
      <button onClick={() => handleCopy(a.alias)} title={a.label + '\n' + a.path}
        className="flex items-start gap-2 px-2 py-1.5 rounded-lg w-full text-left cursor-pointer transition-all duration-150 border border-border/40 bg-surface-dark hover:border-accent/30 hover:bg-accent-dim">
        <code className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0 leading-relaxed"
          style={{ color, background: color + '12', borderColor: color + '25' }}>
          {a.alias}
        </code>
        <span className="text-[10.5px] text-ink-400 flex-1 overflow-hidden text-ellipsis whitespace-nowrap leading-snug">{a.label}</span>
        <span className={`flex-shrink-0 ${copied === a.alias ? 'text-accent' : 'text-ink-700'}`}>
          {copied === a.alias ? <Check size={10} /> : <Copy size={10} />}
        </span>
      </button>
    );
  };

  if (loading) return (
    <div className="flex flex-col gap-2 py-4">
      {[1, 2, 3].map(i => <div key={i} className="skeleton h-8 rounded-lg" />)}
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="label-upper">{aliases.length} alias</div>
      <div className="relative">
        <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-600 pointer-events-none" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Хайх..."
          className="input-search !text-[11px] !py-1.5 !pl-7"
        />
      </div>
      {filtered ? (
        <div className="flex flex-col gap-1">
          <div className="text-[10px] text-ink-600">{filtered.length} үр дүн</div>
          {filtered.map(a => <ItemRow key={a.alias} a={a} />)}
          {!filtered.length && <div className="text-[11px] text-ink-600 text-center py-3">Олдсонгүй</div>}
        </div>
      ) : categories.map(cat => {
        const items = byCategory(cat);
        const color = CAT_COLOR[cat] ?? '#8898b0';
        const isOpen = !collapsed[cat];
        return (
          <div key={cat}>
            <button onClick={() => setCollapsed(p => ({ ...p, [cat]: !p[cat] }))}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg border-none cursor-pointer transition-colors duration-150 hover:bg-surface-raised"
              style={{ background: color + '08' }}>
              <span className="text-[9px]" style={{ color }}>{isOpen ? '\u25BE' : '\u25B8'}</span>
              <span className="text-[10.5px] font-display font-bold flex-1 text-left" style={{ color }}>{cat}</span>
              <span className="text-[10px] text-ink-600">{items.length}</span>
            </button>
            {isOpen && (
              <div className="pl-1 mt-0.5 flex flex-col gap-0.5 max-h-[220px] overflow-y-auto">
                {items.map(a => <ItemRow key={a.alias} a={a} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
