'use client';
import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Copy, Check, Search, Eye, X, Loader2 } from 'lucide-react';
import type { TableAlias } from '@/lib/tableAliases';
import { loadAliases } from '@/lib/tableAliases';

interface Props { onUseInSQL: (alias: string) => void; }

interface PreviewData { alias: string; rows: Record<string, unknown>[]; columns: string[]; loading: boolean; error?: string; }

const CAT_STYLE: Record<string, { color: string; icon: string }> = {
  'Хүн ам, өрх':                    { color:'#60a5fa', icon:'👥' },
  'Эдийн засаг, байгаль орчин':      { color:'#00c87a', icon:'📈' },
  'Хөдөлмөр, бизнес':               { color:'#f87171', icon:'👷' },
  'Боловсрол, эрүүл мэнд':          { color:'#c084fc', icon:'🎓' },
  'Үйлдвэрлэл, үйлчилгээ':          { color:'#fbbf24', icon:'🏭' },
  'Нийгэм, хөгжил':                  { color:'#34d399', icon:'🏛️' },
  'Бүсчилсэн хөгжлийн үзүүлэлтүүд': { color:'#fb923c', icon:'🗺️' },
  'Түүхэн Статистик':                { color:'#94a3b8', icon:'📜' },
};

export default function TablesMode({ onUseInSQL }: Props) {
  const [aliases, setAliases] = useState<TableAlias[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<PreviewData | null>(null);

  useEffect(() => {
    loadAliases().then(data => {
      setAliases(data);
      setLoading(false);
      if (data.length) setOpenCats({ [data[0].category]: true });
    });
  }, []);

  const categories = useMemo(() => [...new Set(aliases.map(a => a.category))], [aliases]);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const lq = search.toLowerCase();
    return aliases.filter(a =>
      a.alias.toLowerCase().includes(lq) ||
      a.label.toLowerCase().includes(lq) ||
      a.category.toLowerCase().includes(lq) ||
      a.id.toLowerCase().includes(lq)
    );
  }, [search, aliases]);

  const handleCopy = (alias: string) => {
    navigator.clipboard.writeText(`"${alias}"`).catch(() => {});
    setCopied(alias); setTimeout(() => setCopied(null), 1300);
  };

  const handlePreview = async (a: TableAlias) => {
    setPreview({ alias: a.alias, rows: [], columns: [], loading: true });
    try {
      const sql = `SELECT * FROM "${a.alias}" LIMIT 10`;
      const res = await fetch('/api/sqlrun', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, useDuckDB: true }) });
      const data = await res.json();
      if (!data.ok) { setPreview(p => p ? { ...p, loading: false, error: data.error } : null); return; }
      const rows = data.rows as Record<string, unknown>[];
      const columns = rows.length > 0 ? Object.keys(rows[0]).filter(k => !k.endsWith('_CODE')) : [];
      setPreview({ alias: a.alias, rows, columns, loading: false });
    } catch (e) {
      setPreview(p => p ? { ...p, loading: false, error: e instanceof Error ? e.message : 'Алдаа' } : null);
    }
  };

  const Card = ({ a }: { a: TableAlias }) => {
    const s = CAT_STYLE[a.category] ?? { color:'#94a3b8', icon:'📊' };
    return (
      <div className="bg-surface border border-border rounded-card p-3 flex flex-col gap-2 transition-all duration-150 hover:border-accent/40 hover:bg-accent-dim/30">
        <div className="flex items-start gap-2.5">
          <code className="font-mono text-xs font-extrabold px-2 py-0.5 rounded border flex-shrink-0"
            style={{ color: s.color, background: s.color + '18', borderColor: s.color + '35' }}>
            {a.alias}
          </code>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-ink-200 leading-tight">{a.label}</div>
            <div className="text-[10.5px] text-ink-600 mt-0.5 font-mono">{a.id}</div>
          </div>
        </div>
        <div className="text-[10px] text-ink-700 font-mono bg-black/20 px-2 py-0.5 rounded overflow-hidden text-ellipsis whitespace-nowrap" title={a.path}>
          {a.path}
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => onUseInSQL(a.alias)}
            className="btn-primary flex-1 text-[11.5px] py-1.5 justify-center">
            <ArrowRight size={12} /> SQL-д ашиглах
          </button>
          <button onClick={() => handlePreview(a)} className="btn-ghost text-[11px] py-1.5" title="10 мөр preview">
            <Eye size={12} />
          </button>
          <button onClick={() => handleCopy(a.alias)}
            className={`btn-ghost text-[11px] py-1.5 ${copied === a.alias ? 'text-accent border-accent/30' : ''}`}>
            {copied === a.alias ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center gap-3 py-16 text-ink-500">
      <Loader2 size={20} className="spin text-accent3" />
      <div className="text-[13px]">Хүснэгтийн жагсаалт ачааллаж байна...</div>
      <div className="text-[11px] text-ink-700">1282 хүснэгтийн alias</div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-ink-100 mb-1">Хүснэгтийн нэрлэмж — {aliases.length} хүснэгт</h2>
        <p className="text-xs text-ink-500 mb-3.5 leading-relaxed">
          SQL-д <code className="text-accent3 bg-accent3-dim px-1.5 py-0.5 rounded text-[11px]">FROM &quot;gdp_2&quot;</code> гэж богино alias ашигла.
          &quot;SQL-д ашиглах&quot; дарахад шууд SQL горим руу шилжинэ.
        </p>
        {/* Search */}
        <div className="relative max-w-[500px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Хайх... (alias, монгол нэр, ID, категори)"
            className="input-search pl-8 text-[13px]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 icon-btn p-0.5">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {filtered && (
        <div>
          <div className="text-[11.5px] text-ink-500 mb-2.5">{filtered.length} үр дүн</div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
            {filtered.map(a => <Card key={a.alias} a={a} />)}
          </div>
          {!filtered.length && <div className="text-center py-10 text-ink-700 text-[13px]">&quot;{search}&quot; — олдсонгүй</div>}
        </div>
      )}

      {/* Category sections */}
      {!filtered && categories.map(cat => {
        const items = aliases.filter(a => a.category === cat);
        const s = CAT_STYLE[cat] ?? { color:'#94a3b8', icon:'📊' };
        const isOpen = !!openCats[cat];
        return (
          <div key={cat} className="mb-4">
            <button onClick={() => setOpenCats(p => ({ ...p, [cat]: !p[cat] }))}
              className="flex items-center gap-2.5 mb-2.5 bg-transparent border-none cursor-pointer w-full text-left group">
              <span className="text-lg">{s.icon}</span>
              <h3 className="text-[13.5px] font-extrabold m-0" style={{ color: s.color }}>{cat}</h3>
              <div className="flex-1 h-px" style={{ background: s.color + '25' }} />
              <span className="text-[11px] text-ink-700">{items.length}</span>
              <span className="text-[10px] transition-transform duration-150" style={{ color: s.color }}>
                {isOpen ? '\u25B2' : '\u25BC'}
              </span>
            </button>
            {isOpen && (
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
                {items.map(a => <Card key={a.alias} a={a} />)}
              </div>
            )}
          </div>
        );
      })}

      {/* Footer tip */}
      <div className="mt-6 p-3.5 bg-accent3/5 border border-accent3/15 rounded-card text-xs text-ink-400 leading-relaxed">
        <strong className="text-accent3">SQL жишээ:</strong><br />
        <code className="text-accent2">SELECT * FROM &quot;gdp_2&quot; WHERE Он IN (&apos;2020&apos;,&apos;2021&apos;) LIMIT 500;</code><br />
        <code className="text-accent2">SELECT * FROM &quot;livestock_1&quot; LIMIT 300;</code>
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/75 z-[1000] flex items-center justify-center p-5"
          onClick={e => { if (e.target === e.currentTarget) setPreview(null); }}>
          <div className="bg-surface border border-border rounded-card w-full max-w-[860px] max-h-[80vh] flex flex-col overflow-hidden shadow-2xl shadow-black/80">
            {/* Modal header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border flex-shrink-0">
              <Eye size={14} className="text-accent2" />
              <code className="text-accent2 text-[13px] font-bold">{preview.alias}</code>
              <span className="text-[11px] text-ink-700 ml-1">— 10 мөр preview</span>
              <button onClick={() => setPreview(null)} className="ml-auto icon-btn">
                <X size={16} />
              </button>
            </div>
            {/* Modal body */}
            <div className="overflow-auto flex-1 p-4">
              {preview.loading && (
                <div className="flex items-center gap-2.5 py-8 text-ink-500 justify-center">
                  <Loader2 size={16} className="spin text-accent2" />
                  <span className="text-[13px]">Өгөгдөл татаж байна...</span>
                </div>
              )}
              {preview.error && (
                <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-lg text-red-300 text-xs">
                  {preview.error}
                </div>
              )}
              {!preview.loading && !preview.error && preview.rows.length === 0 && (
                <div className="text-center py-8 text-ink-700 text-[13px]">Мөр олдсонгүй</div>
              )}
              {!preview.loading && preview.rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>{preview.columns.map(col => <th key={col}>{col}</th>)}</tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, ri) => (
                        <tr key={ri}>
                          {preview.columns.map(col => (
                            <td key={col} className={typeof row[col] === 'number' ? 'numeric' : ''}>
                              {String(row[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {!preview.loading && !preview.error && (
              <div className="px-4 py-2.5 border-t border-border flex-shrink-0 flex gap-2">
                <button onClick={() => { onUseInSQL(preview.alias); setPreview(null); }}
                  className="btn-primary text-xs py-1.5">
                  <ArrowRight size={12} /> SQL-д ашиглах
                </button>
                <button onClick={() => setPreview(null)} className="btn-ghost text-xs">
                  Хаах
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
