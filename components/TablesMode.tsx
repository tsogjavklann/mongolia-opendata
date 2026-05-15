'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Copy,
  Check,
  Search,
  Eye,
  X,
  Loader2,
  ChevronDown,
  Users,
  TrendingUp,
  HardHat,
  GraduationCap,
  Factory,
  Building2,
  Map as MapIcon,
  ScrollText,
  Folder,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import type { TableAlias } from '@/lib/tableAliases';
import { loadAliases } from '@/lib/tableAliases';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Props {
  onUseInSQL: (alias: string) => void;
}

interface PreviewData {
  alias: string;
  rows: Record<string, unknown>[];
  columns: string[];
  loading: boolean;
  error?: string;
}

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const CAT_STYLE: Record<string, { Icon: Icon; tone: string }> = {
  'Хүн ам, өрх': { Icon: Users, tone: 'text-accent2 bg-accent2-dim border-accent2/30' },
  'Эдийн засаг, байгаль орчин': { Icon: TrendingUp, tone: 'text-accent bg-accent-dim border-accent/30' },
  'Хөдөлмөр, бизнес': { Icon: HardHat, tone: 'text-destructive bg-destructive/10 border-destructive/30' },
  'Боловсрол, эрүүл мэнд': { Icon: GraduationCap, tone: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  'Үйлдвэрлэл, үйлчилгээ': { Icon: Factory, tone: 'text-accent3 bg-accent3-dim border-accent3/30' },
  'Нийгэм, хөгжил': { Icon: Building2, tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  'Бүсчилсэн хөгжлийн үзүүлэлтүүд': { Icon: MapIcon, tone: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  'Түүхэн Статистик': { Icon: ScrollText, tone: 'text-muted-foreground bg-surface-raised border-border' },
};

const DEFAULT_STYLE = { Icon: Folder, tone: 'text-muted-foreground bg-surface-raised border-border' };

export default function TablesMode({ onUseInSQL }: Props) {
  const [aliases, setAliases] = useState<TableAlias[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<PreviewData | null>(null);

  useEffect(() => {
    loadAliases().then((data) => {
      setAliases(data);
      setLoading(false);
      if (data.length) setOpenCats({ [data[0].category]: true });
    });
  }, []);

  const categories = useMemo(() => [...new Set(aliases.map((a) => a.category))], [aliases]);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const lq = search.toLowerCase();
    return aliases.filter(
      (a) =>
        a.alias.toLowerCase().includes(lq) ||
        a.label.toLowerCase().includes(lq) ||
        a.category.toLowerCase().includes(lq) ||
        a.id.toLowerCase().includes(lq)
    );
  }, [search, aliases]);

  const handleCopy = (alias: string) => {
    navigator.clipboard.writeText(`"${alias}"`).catch(() => {});
    setCopied(alias);
    toast.success(`"${alias}" хуулагдсан`);
    setTimeout(() => setCopied(null), 1300);
  };

  const handlePreview = async (a: TableAlias) => {
    setPreview({ alias: a.alias, rows: [], columns: [], loading: true });
    try {
      const sql = `SELECT * FROM "${a.alias}" LIMIT 10`;
      const res = await fetch('/api/sqlrun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, useDuckDB: true }),
      });
      const data = await res.json();
      if (!data.ok) {
        setPreview((p) => (p ? { ...p, loading: false, error: data.error } : null));
        return;
      }
      const rows = data.rows as Record<string, unknown>[];
      const columns = rows.length > 0 ? Object.keys(rows[0]).filter((k) => !k.endsWith('_CODE')) : [];
      setPreview({ alias: a.alias, rows, columns, loading: false });
    } catch (e) {
      setPreview((p) =>
        p ? { ...p, loading: false, error: e instanceof Error ? e.message : 'Алдаа' } : null
      );
    }
  };

  const Card = ({ a }: { a: TableAlias }) => {
    const s = CAT_STYLE[a.category] ?? DEFAULT_STYLE;
    return (
      <div className="rounded-card border border-border bg-card p-3 flex flex-col gap-2 transition-all duration-150 hover:border-accent/40 hover:bg-card hover:shadow-elevated">
        <div className="flex items-start gap-2.5">
          <code
            className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded border flex-shrink-0 ${s.tone}`}
          >
            {a.alias}
          </code>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-foreground leading-tight">{a.label}</div>
            <div className="text-[10.5px] text-muted-foreground mt-0.5 font-mono">{a.id}</div>
          </div>
        </div>
        <div
          className="text-[10px] text-muted-foreground font-mono bg-surface-darker/60 px-2 py-1 rounded overflow-hidden text-ellipsis whitespace-nowrap"
          title={a.path}
        >
          {a.path}
        </div>
        <div className="flex gap-1.5">
          <Button
            onClick={() => onUseInSQL(a.alias)}
            size="sm"
            className="flex-1 h-7 text-[11px]"
          >
            <ArrowRight size={11} /> SQL-д ашиглах
          </Button>
          <Button
            onClick={() => handlePreview(a)}
            variant="outline"
            size="icon-sm"
            className="h-7 w-7"
            title="10 мөр preview"
          >
            <Eye size={11} />
          </Button>
          <Button
            onClick={() => handleCopy(a.alias)}
            variant="outline"
            size="icon-sm"
            className="h-7 w-7"
          >
            {copied === a.alias ? <Check size={11} className="text-accent" /> : <Copy size={11} />}
          </Button>
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <Loader2 size={20} className="spin text-accent" />
        <div className="text-[13px] font-display font-semibold">
          Хүснэгтийн жагсаалт ачааллаж байна...
        </div>
        <div className="text-[11px] opacity-60">1,282 хүснэгтийн alias</div>
      </div>
    );

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-display font-extrabold text-foreground mb-1">
          Хүснэгтийн нэрлэмж — {aliases.length.toLocaleString()} хүснэгт
        </h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          SQL-д{' '}
          <code className="text-accent3 bg-accent3-dim px-1.5 py-0.5 rounded text-[11px] font-mono">
            FROM &quot;gdp&quot;
          </code>{' '}
          гэж богино alias ашигла. <strong>SQL-д ашиглах</strong> дарахад шууд SQL горим руу шилжинэ.
        </p>
        <div className="relative max-w-xl">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Хайх — alias, монгол нэр, ID, категори"
            className="pl-9 pr-9 h-10 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 icon-btn"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {filtered && (
        <div>
          <div className="text-[11.5px] text-muted-foreground mb-2.5 font-mono">
            {filtered.length} үр дүн
          </div>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}
          >
            {filtered.map((a) => (
              <Card key={a.alias} a={a} />
            ))}
          </div>
          {!filtered.length && (
            <div className="text-center py-12 text-muted-foreground text-[13px]">
              &quot;{search}&quot; — олдсонгүй
            </div>
          )}
        </div>
      )}

      {/* Category sections */}
      {!filtered &&
        categories.map((cat) => {
          const items = aliases.filter((a) => a.category === cat);
          const s = CAT_STYLE[cat] ?? DEFAULT_STYLE;
          const isOpen = !!openCats[cat];
          return (
            <div key={cat} className="mb-5">
              <button
                onClick={() => setOpenCats((p) => ({ ...p, [cat]: !p[cat] }))}
                className="flex items-center gap-2.5 mb-2.5 bg-transparent border-none cursor-pointer w-full text-left group"
              >
                <span className={`flex h-7 w-7 items-center justify-center rounded-md ${s.tone}`}>
                  <s.Icon className="h-4 w-4" />
                </span>
                <h3 className="text-[14px] font-display font-extrabold m-0 text-foreground">
                  {cat}
                </h3>
                <div className="flex-1 h-px bg-border" />
                <Badge variant="outline" className="font-mono">
                  {items.length}
                </Badge>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}
                >
                  {items.map((a) => (
                    <Card key={a.alias} a={a} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

      {/* Footer tip */}
      <div className="mt-6 p-4 bg-accent3-dim border border-accent3/15 rounded-card text-xs text-muted-foreground leading-relaxed">
        <strong className="text-accent3 block mb-1">SQL жишээ</strong>
        <code className="block text-accent2 font-mono">
          SELECT * FROM &quot;gdp&quot; WHERE Он IN (&apos;2020&apos;,&apos;2021&apos;) LIMIT 500;
        </code>
        <code className="block text-accent2 font-mono">
          SELECT * FROM &quot;livestock&quot; LIMIT 300;
        </code>
      </div>

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye size={14} className="text-accent2" />
              <code className="text-accent2 font-mono text-sm">{preview?.alias}</code>
              <span className="text-[11px] text-muted-foreground font-normal">
                — 10 мөр preview
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-auto">
            {preview?.loading && (
              <div className="flex items-center gap-2.5 py-8 text-muted-foreground justify-center">
                <Loader2 size={16} className="spin text-accent" />
                <span className="text-[13px]">Өгөгдөл татаж байна...</span>
              </div>
            )}
            {preview?.error && (
              <div className="p-4 bg-destructive/5 border border-destructive/15 rounded-lg text-destructive text-xs font-mono">
                {preview.error}
              </div>
            )}
            {!preview?.loading && !preview?.error && preview?.rows.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-[13px]">
                Мөр олдсонгүй
              </div>
            )}
            {!preview?.loading && preview && preview.rows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="data-table">
                  <thead>
                    <tr>
                      {preview.columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, ri) => (
                      <tr key={ri}>
                        {preview.columns.map((col) => (
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

          {preview && !preview.loading && !preview.error && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  onUseInSQL(preview.alias);
                  setPreview(null);
                }}
                size="sm"
              >
                <ArrowRight size={12} /> SQL-д ашиглах
              </Button>
              <Button onClick={() => setPreview(null)} size="sm" variant="outline">
                Хаах
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
