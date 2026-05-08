'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, AlertCircle, Play, GitCompare } from 'lucide-react';

const DataChart = dynamic(() => import('@/components/DataChart'), { ssr: false });
const SQLEditor = dynamic(() => import('@/components/SQLEditor'), { ssr: false });

const PRESET_PAIRS = [
  {
    label: '2020 vs 2024',
    desc: 'Аймгийн ДНБ',
    leftLabel: '2020 он',
    rightLabel: '2024 он',
    left: `SELECT Бүс AS Аймаг, VALUE AS ДНБ_2020\nFROM "Regional development/National accounts/DT_NSO_0500_011V1.px"\nWHERE Он = '2020'\nORDER BY ДНБ_2020 DESC\nLIMIT 22;`,
    right: `SELECT Бүс AS Аймаг, VALUE AS ДНБ_2024\nFROM "Regional development/National accounts/DT_NSO_0500_011V1.px"\nWHERE Он = '2024'\nORDER BY ДНБ_2024 DESC\nLIMIT 22;`,
  },
  {
    label: 'Эрэгтэй vs Эмэгтэй',
    desc: 'Хүн ам, насны бүлэг',
    leftLabel: 'Эрэгтэй',
    rightLabel: 'Эмэгтэй',
    left: `SELECT "Насны бүлэг", VALUE AS Эрэгтэй_тоо\nFROM "population"\nWHERE Он = '2024' AND Хүйс = '1'\nORDER BY "Насны бүлэг";`,
    right: `SELECT "Насны бүлэг", VALUE AS Эмэгтэй_тоо\nFROM "population"\nWHERE Он = '2024' AND Хүйс = '2'\nORDER BY "Насны бүлэг";`,
  },
  {
    label: 'Инфляц vs Ажилгүйдэл',
    desc: 'Эдийн засгийн зэрэгцээ үзүүлэлт',
    leftLabel: 'Инфляц',
    rightLabel: 'Ажилгүйдэл',
    left: `SELECT Он, VALUE AS Инфляци\nFROM "inflation"\nWHERE Он BETWEEN '2015' AND '2024'\nORDER BY Он;`,
    right: `SELECT Он, VALUE AS Ажилгүйдэл\nFROM "unemployment"\nWHERE Он BETWEEN '2015' AND '2024'\nORDER BY Он;`,
  },
];

interface PaneState {
  sql: string;
  rows: Record<string, unknown>[] | null;
  loading: boolean;
  error: string | null;
  count: number;
  label: string;
}

interface CompareInitial {
  leftSql: string;
  rightSql: string;
  leftLabel: string;
  rightLabel: string;
  autoRun?: boolean;
}

export default function CompareMode({ initial }: { initial?: CompareInitial }) {
  const [left, setLeft] = useState<PaneState>({
    sql: initial?.leftSql ?? PRESET_PAIRS[0].left, rows: null, loading: false, error: null, count: 0,
    label: initial?.leftLabel ?? PRESET_PAIRS[0].leftLabel,
  });
  const [right, setRight] = useState<PaneState>({
    sql: initial?.rightSql ?? PRESET_PAIRS[0].right, rows: null, loading: false, error: null, count: 0,
    label: initial?.rightLabel ?? PRESET_PAIRS[0].rightLabel,
  });

  // initial-аас ирвэл автоматаар ажиллуулна (AI-аас compare result буцаасан үед)
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (initial?.autoRun && !autoRanRef.current) {
      autoRanRef.current = true;
      // Хоёуланг зэрэг ажиллуулна
      setTimeout(() => { runBoth(); }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.autoRun]);

  const runOne = async (which: 'left' | 'right') => {
    const pane = which === 'left' ? left : right;
    const setter = which === 'left' ? setLeft : setRight;
    setter({ ...pane, loading: true, error: null, rows: null });
    try {
      const res = await fetch('/api/sqlrun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: pane.sql, useDuckDB: true }),
      });
      const data = await res.json();
      if (!data.ok) {
        setter({ ...pane, loading: false, error: data.error ?? 'Алдаа', rows: null });
        return;
      }
      setter({ ...pane, loading: false, error: null, rows: data.rows ?? [], count: data.count ?? 0 });
    } catch (e) {
      setter({ ...pane, loading: false, error: e instanceof Error ? e.message : 'Сүлжээний алдаа', rows: null });
    }
  };

  const runBoth = async () => {
    await Promise.all([runOne('left'), runOne('right')]);
  };

  const loadPreset = (preset: typeof PRESET_PAIRS[number]) => {
    setLeft({ sql: preset.left, rows: null, loading: false, error: null, count: 0, label: preset.leftLabel });
    setRight({ sql: preset.right, rows: null, loading: false, error: null, count: 0, label: preset.rightLabel });
  };

  return (
    <div>
      {/* Preset switcher */}
      <div className="card mb-3">
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <GitCompare size={14} className="text-accent" />
          <span className="text-[12px] font-display font-bold text-ink-100">Харьцуулалт</span>
          <span className="text-[10px] text-ink-600 font-mono ml-auto">ХОЁР QUERY-Г ЗЭРЭГ ХАРНА</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {PRESET_PAIRS.map((p, i) => (
            <button
              key={i}
              onClick={() => loadPreset(p)}
              className="btn-ghost text-accent2"
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={runBoth}
            disabled={left.loading || right.loading}
            className="btn-primary ml-auto flex items-center gap-1.5"
          >
            {(left.loading || right.loading) ? <Loader2 size={12} className="spin" /> : <Play size={12} />}
            Хоёуланг ажиллуулах
          </button>
        </div>
      </div>

      {/* Two panes */}
      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Pane state={left} setState={setLeft} onRun={() => runOne('left')} side="left" />
        <Pane state={right} setState={setRight} onRun={() => runOne('right')} side="right" />
      </div>
    </div>
  );
}

interface PaneProps {
  state: PaneState;
  setState: (s: PaneState) => void;
  onRun: () => void;
  side: 'left' | 'right';
}

function Pane({ state, setState, onRun, side }: PaneProps) {
  const accent = side === 'left' ? '#00c87a' : '#a78bfa';
  return (
    <div className="card flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div
          className="w-1.5 h-5 rounded-full"
          style={{ background: accent }}
        />
        <input
          type="text"
          value={state.label}
          onChange={e => setState({ ...state, label: e.target.value })}
          className="bg-transparent border-0 text-[13px] font-bold text-ink-100 outline-none flex-1"
          placeholder="Шошго..."
        />
        <span className="text-[10px] text-ink-700 font-mono">{side === 'left' ? 'ЗҮҮН' : 'БАРУУН'}</span>
      </div>

      <SQLEditor
        value={state.sql}
        onChange={(v: string | ((p: string) => string)) => {
          const next = typeof v === 'function' ? v(state.sql) : v;
          setState({ ...state, sql: next });
        }}
        onRun={onRun}
        rows={5}
      />

      <button
        onClick={onRun}
        disabled={state.loading}
        className="btn-primary"
        style={{ background: accent, color: '#000' }}
      >
        {state.loading ? <Loader2 size={12} className="spin" /> : <Play size={12} />}
        Ажиллуулах
      </button>

      {state.error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded bg-red-500/10 border border-red-500/20">
          <AlertCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-[11px] text-red-300 font-mono">{state.error}</span>
        </div>
      )}

      {state.rows && state.rows.length > 0 && (
        <>
          <DataChart rows={state.rows as any} title={state.label} />
          <div className="text-[10px] text-ink-700 font-mono text-right">
            {state.count.toLocaleString()} мөр
          </div>
        </>
      )}

      {state.rows && state.rows.length === 0 && !state.loading && (
        <div className="text-center py-6 text-ink-600 text-xs">Өгөгдөл олдсонгүй</div>
      )}

      {!state.rows && !state.loading && !state.error && (
        <div className="text-center py-6 text-ink-700 text-[11px]">Ажиллуулж график үүсгэнэ үү</div>
      )}
    </div>
  );
}
