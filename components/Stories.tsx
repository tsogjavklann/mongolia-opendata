'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, AlertCircle, ArrowLeft, Code2, RefreshCw } from 'lucide-react';

const DataChart = dynamic(() => import('@/components/DataChart'), { ssr: false });

export interface Story {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  category: 'economy' | 'society' | 'agriculture' | 'trade';
  sql: string;
}

export const STORIES: Story[] = [
  {
    id: 'inflation-5y',
    title: 'Инфляц 5 жилд',
    subtitle: 'ХҮИ-ийн өөрчлөлт',
    emoji: '🏷️',
    category: 'economy',
    sql: `SELECT Он, VALUE AS Инфляци\nFROM "inflation"\nWHERE Он BETWEEN '2020' AND '2025'\nORDER BY Он;`,
  },
  {
    id: 'gdp-sector',
    title: 'ДНБ салбараар',
    subtitle: '2024 оны бүтэц',
    emoji: '📊',
    category: 'economy',
    sql: `SELECT "Эдийн засгийн үйл ажиллагааны салбарын ангилал" AS Салбар,\n       VALUE AS ДНБ\nFROM "gdp"\nWHERE ОН = '2024'\n  AND "Эдийн засгийн үйл ажиллагааны салбарын ангилал" != 'Бүгд'\nORDER BY VALUE DESC\nLIMIT 12;`,
  },
  {
    id: 'gdp-growth',
    title: 'ДНБ өсөлтийн хувь',
    subtitle: 'Жил бүрийн өөрчлөлт',
    emoji: '📈',
    category: 'economy',
    sql: `SELECT ОН AS Жил,\n       ROUND((VALUE - LAG(VALUE) OVER (ORDER BY ОН)) * 100.0\n             / NULLIF(LAG(VALUE) OVER (ORDER BY ОН), 0), 1) AS Өсөлт_хувь\nFROM "gdp"\nWHERE ОН BETWEEN '2010' AND '2025'\n  AND "Эдийн засгийн үйл ажиллагааны салбарын ангилал" = 'Бүгд'\nORDER BY ОН;`,
  },
  {
    id: 'population-growth',
    title: 'Хүн ам өсөлт',
    subtitle: 'Хүйсээр 2010-2024',
    emoji: '👥',
    category: 'society',
    sql: `SELECT Он, Хүйс, VALUE AS Хүн_ам\nFROM "population"\nWHERE Он BETWEEN '2010' AND '2024'\n  AND Хүйс IN ('1','2')\nORDER BY Он;`,
  },
  {
    id: 'unemployment-trend',
    title: 'Ажилгүйдэл',
    subtitle: 'Сүүлийн 10 жил',
    emoji: '💼',
    category: 'economy',
    sql: `SELECT Он, VALUE AS Ажилгүйдэл_хувь\nFROM "unemployment"\nWHERE Он BETWEEN '2014' AND '2024'\nORDER BY Он;`,
  },
  {
    id: 'livestock-trend',
    title: 'Малын тоо толгой',
    subtitle: 'Жилийн динамик',
    emoji: '🐑',
    category: 'agriculture',
    sql: `SELECT Он, VALUE AS Нийт_мал\nFROM "livestock"\nWHERE Он BETWEEN '2010' AND '2024'\nORDER BY Он;`,
  },
];

interface Props {
  onOpenInSQL?: (sql: string) => void;
}

export default function Stories({ onOpenInSQL }: Props) {
  const [active, setActive] = useState<Story | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const open = async (s: Story) => {
    setActive(s); setLoading(true); setError(null); setRows(null);
    try {
      const res = await fetch('/api/sqlrun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: s.sql, useDuckDB: true }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? 'Татаж чадсангүй');
        return;
      }
      setRows(data.rows ?? []);
      setCount(data.count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Сүлжээний алдаа');
    } finally {
      setLoading(false);
    }
  };

  if (active) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <button
            onClick={() => { setActive(null); setRows(null); setError(null); }}
            className="btn-ghost flex items-center gap-1.5"
          >
            <ArrowLeft size={12} /> Буцах
          </button>
          <div>
            <div className="text-[15px] font-display font-bold text-ink-100">
              {active.emoji} {active.title}
            </div>
            <div className="text-[11px] text-ink-600 font-mono">{active.subtitle}</div>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => open(active)}
              disabled={loading}
              className="btn-ghost flex items-center gap-1.5"
              title="Дахин ажиллуулах"
            >
              <RefreshCw size={12} className={loading ? 'spin' : ''} /> Дахин
            </button>
            {onOpenInSQL && (
              <button
                onClick={() => onOpenInSQL(active.sql)}
                className="btn-ghost flex items-center gap-1.5"
                title="SQL-д засварлах"
              >
                <Code2 size={12} /> SQL-д засах
              </button>
            )}
          </div>
        </div>

        <div className="card">
          {loading && (
            <div className="flex items-center gap-3 py-12 justify-center text-ink-500">
              <Loader2 size={18} className="text-accent spin" />
              <span className="text-sm">{active.title} ачааллаж байна...</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 py-6 px-4 bg-red-500/5 border border-red-500/15 rounded-lg">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm text-red-300 font-mono">{error}</div>
                <div className="text-[11px] text-ink-500 mt-1">
                  1212.mn API-тай холбогдож чадсангүй. Дахин оролдоно уу.
                </div>
              </div>
            </div>
          )}
          {rows && rows.length > 0 && (
            <>
              <DataChart rows={rows as any} title={active.title} />
              <div className="text-[10px] text-ink-700 font-mono mt-2 text-right">
                {count.toLocaleString()} мөр · ҮСХ 1212.mn
              </div>
            </>
          )}
          {rows && rows.length === 0 && !loading && (
            <div className="text-center py-8 text-ink-600 text-sm">
              Өгөгдөл олдсонгүй
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[14px] font-display font-bold text-ink-100">
            Бэлэн дашбоардууд
          </div>
          <div className="text-[11px] text-ink-600 font-mono mt-0.5">
            ДАРАХАД ШУУД ГРАФИК ХАРАГДАНА
          </div>
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {STORIES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => open(s)}
            className="card text-left cursor-pointer transition-all duration-250 group hover:shadow-glow-green relative overflow-hidden"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-110">
              {s.emoji}
            </div>
            <div className="text-[13.5px] font-display font-bold text-ink-100 leading-tight group-hover:text-accent transition-colors">
              {s.title}
            </div>
            <div className="text-[11px] text-ink-600 mt-1 font-mono">{s.subtitle}</div>
            <div className="text-[9.5px] text-ink-700 mt-2 uppercase tracking-wider">
              {s.category === 'economy' ? 'Эдийн засаг'
                : s.category === 'society' ? 'Нийгэм'
                : s.category === 'agriculture' ? 'Хөдөө аж ахуй'
                : 'Худалдаа'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
