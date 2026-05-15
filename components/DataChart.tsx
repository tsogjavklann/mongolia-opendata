'use client';

/**
 * Smart DataChart — Rule-based автомат chart engine
 */

import { useState, useMemo, useRef, useEffect, memo } from 'react';
import {
  LineChart, BarChart, PieChart,
  Line, Bar, Pie, Cell, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  detectColumns, suggestChart, buildSmartChartData,
  type ChartSuggestion,
} from '@/lib/transform';
import type { DataRow, ChartPoint } from '@/lib/transform';

const COLORS = [
  '#00c87a', '#60a5fa', '#f59e0b', '#f87171',
  '#a78bfa', '#fb923c', '#34d399', '#38bdf8',
  '#e879f9', '#facc15', '#4ade80', '#fb7185',
];

const fmt = (v: number) => {
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}Т`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}М`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}К`;
  return v.toLocaleString();
};

const CHART_TYPES = [
  { key: 'line', label: 'Шугам' },
  { key: 'area', label: 'Талбай' },
  { key: 'bar', label: 'Багана' },
  { key: 'multiLine', label: 'Олон' },
  { key: 'pie', label: 'Бялуу' },
] as const;

type ChartTypeKey = typeof CHART_TYPES[number]['key'];

function getAvailableChartTypes(seriesCount: number) {
  if (seriesCount > 1) return CHART_TYPES.filter((t) => t.key !== 'pie');
  return CHART_TYPES;
}

interface DataChartProps {
  rows?: DataRow[];
  points?: ChartPoint[];
  series?: string[];
  title?: string;
}

const CustomTooltip = memo(
  ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        className="rounded-lg border border-border bg-popover px-3.5 py-2.5 font-mono text-xs shadow-floating"
      >
        <div className="text-accent font-bold mb-1.5">{label}</div>
        {payload.map((p, i) => (
          <div
            key={i}
            className="flex justify-between gap-2.5 min-w-[140px]"
            style={{ color: p.color }}
          >
            <span className="text-muted-foreground truncate">
              {p.name.length > 24 ? p.name.slice(0, 22) + '…' : p.name}
            </span>
            <span className="font-semibold">
              {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
);
CustomTooltip.displayName = 'CustomTooltip';

const SuggestionBadge = memo(function SuggestionBadge({
  suggestion,
}: {
  suggestion: ChartSuggestion;
}) {
  const dotClass =
    suggestion.confidence === 'high'
      ? 'bg-accent'
      : suggestion.confidence === 'medium'
        ? 'bg-accent3'
        : 'bg-accent2';
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-accent/20 bg-accent-dim">
      <div className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span className="text-[10.5px] text-muted-foreground font-mono">{suggestion.reason}</span>
    </div>
  );
});

function DataChartInner({ rows, points: legacyPoints, series: legacySeries, title }: DataChartProps) {
  const [manualType, setManualType] = useState<ChartTypeKey | null>(null);
  const [activeSeries, setActiveSeries] = useState<Set<string> | null>(null);

  const detectedCols = useMemo(() => (rows?.length ? detectColumns(rows) : null), [rows]);
  const suggestion = useMemo(
    () => (detectedCols ? suggestChart(rows!, detectedCols) : null),
    [rows, detectedCols]
  );
  const chartData = useMemo(
    () => (suggestion ? buildSmartChartData(rows!, suggestion) : null),
    [rows, suggestion]
  );
  const analysis = useMemo(() => {
    if (!detectedCols || !suggestion || !chartData) return null;
    return {
      cols: detectedCols,
      suggest: suggestion,
      points: chartData.points,
      series: chartData.series,
    };
  }, [detectedCols, suggestion, chartData]);

  const prevRowsRef = useRef(rows);
  useEffect(() => {
    if (prevRowsRef.current !== rows) {
      setManualType(null);
      setActiveSeries(null);
      prevRowsRef.current = rows;
    }
  }, [rows]);

  const legacyMode = !rows?.length && legacyPoints?.length;
  const points = analysis?.points ?? legacyPoints ?? [];
  const series = analysis?.series ?? legacySeries ?? [];
  const suggest = analysis?.suggest ?? null;

  const chartType: ChartTypeKey = manualType ?? (suggest?.chartType as ChartTypeKey) ?? 'bar';

  const curActive = activeSeries ?? new Set(series);
  const visSeries = series.filter((s) => curActive.has(s));

  if (!points.length || !series.length) return null;

  const toggleSeries = (s: string) => {
    const next = new Set(curActive);
    next.has(s) ? next.delete(s) : next.add(s);
    if (next.size > 0) setActiveSeries(next);
  };

  const tickStyle = { fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' };
  const gridStyle = { strokeDasharray: '3 3', stroke: 'rgba(100,116,139,0.18)' };
  const axisStyle = { stroke: 'rgba(100,116,139,0.3)' };
  const marginVal = { top: 8, right: 24, left: 8, bottom: 4 };

  const pieData = series
    .slice(0, 12)
    .map((s, i) => ({
      name: s,
      value: points.reduce((sum, p) => sum + ((p[s] as number) || 0), 0),
      color: COLORS[i % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {(title || suggest?.title) && (
          <span className="text-[12.5px] text-foreground font-display font-bold">
            {title ?? suggest?.title}
          </span>
        )}
        {suggest && !legacyMode && <SuggestionBadge suggestion={suggest} />}
        <div className="ml-auto flex gap-1 flex-wrap">
          {getAvailableChartTypes(series.length).map((t) => (
            <button
              key={t.key}
              onClick={() => setManualType(t.key)}
              className={
                'px-2.5 py-1 rounded-md border text-[11px] font-semibold font-display transition-all ' +
                (chartType === t.key
                  ? 'bg-accent text-primary-foreground border-accent'
                  : 'bg-transparent text-muted-foreground border-border hover:bg-surface-raised hover:text-foreground')
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Series toggles */}
      {series.length > 1 && chartType !== 'pie' && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {series.map((s, i) => (
            <button
              key={s}
              onClick={() => toggleSeries(s)}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border-[1.5px] transition-all"
              style={{
                borderColor: COLORS[i % COLORS.length],
                color: curActive.has(s) ? COLORS[i % COLORS.length] : 'var(--c-muted-foreground)',
                background: curActive.has(s) ? `${COLORS[i % COLORS.length]}18` : 'transparent',
                opacity: curActive.has(s) ? 1 : 0.5,
              }}
            >
              {s.length > 26 ? s.slice(0, 24) + '…' : s}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer
        width="100%"
        height={Math.max(
          280,
          Math.min(480, typeof window !== 'undefined' ? window.innerHeight * 0.42 : 380)
        )}
      >
        {chartType === 'pie' ? (
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={130}
              innerRadius={55}
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name.slice(0, 14)} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        ) : chartType === 'area' ? (
          <AreaChart data={points} margin={marginVal}>
            <defs>
              {visSeries.map((s, i) => (
                <linearGradient key={s} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={COLORS[series.indexOf(s) % COLORS.length]}
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor={COLORS[series.indexOf(s) % COLORS.length]}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="period" tick={tickStyle} tickLine={false} axisLine={axisStyle} />
            <YAxis
              tickFormatter={fmt}
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            {visSeries.length > 1 && (
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748b' }} />
            )}
            {visSeries.map((s, i) => {
              const color = COLORS[series.indexOf(s) % COLORS.length];
              return (
                <Area
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad${i})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls
                />
              );
            })}
          </AreaChart>
        ) : chartType === 'line' || chartType === 'multiLine' ? (
          <LineChart
            data={points}
            margin={{ ...marginVal, right: visSeries.length > 1 ? 60 : marginVal.right }}
          >
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="period" tick={tickStyle} tickLine={false} axisLine={axisStyle} />
            <YAxis
              yAxisId="left"
              tickFormatter={fmt}
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              width={65}
            />
            {visSeries.length > 1 && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={fmt}
                tick={tickStyle}
                tickLine={false}
                axisLine={false}
                width={55}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            {visSeries.length > 1 && (
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748b' }} />
            )}
            {visSeries.map((s, idx) => {
              const color = COLORS[series.indexOf(s) % COLORS.length];
              const yAxis = visSeries.length > 1 && idx > 0 ? 'right' : 'left';
              return (
                <Line
                  key={s}
                  yAxisId={yAxis}
                  type="monotone"
                  dataKey={s}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={points.length < 60 ? { r: 3, fill: color, strokeWidth: 0 } : false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  connectNulls
                />
              );
            })}
          </LineChart>
        ) : (
          <BarChart data={points} margin={marginVal}>
            <CartesianGrid {...gridStyle} />
            <XAxis
              dataKey="period"
              tick={tickStyle}
              tickLine={false}
              axisLine={axisStyle}
              angle={points.length > 12 ? -30 : 0}
              textAnchor={points.length > 12 ? 'end' : 'middle'}
              height={points.length > 12 ? 48 : 24}
            />
            <YAxis
              tickFormatter={fmt}
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            {visSeries.length > 1 && (
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748b' }} />
            )}
            {visSeries.map((s) => {
              const color = COLORS[series.indexOf(s) % COLORS.length];
              return (
                <Bar
                  key={s}
                  dataKey={s}
                  fill={color}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={visSeries.length > 1 ? 24 : 48}
                />
              );
            })}
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Column type chips */}
      {analysis && (
        <div className="mt-3 flex gap-1.5 flex-wrap">
          {analysis.cols
            .filter((c) => c.type !== 'code')
            .map((col) => {
              const colorClass =
                col.type === 'period'
                  ? 'border-accent3/20 bg-accent3-dim text-accent3'
                  : col.type === 'numeric'
                    ? 'border-accent/20 bg-accent-dim text-accent'
                    : 'border-accent2/20 bg-accent2-dim text-accent2';
              return (
                <span
                  key={col.name}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${colorClass}`}
                >
                  {col.name} ·{' '}
                  {col.type === 'period'
                    ? 'цаг'
                    : col.type === 'numeric'
                      ? 'тоо'
                      : `${col.uniqueCount} утга`}
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default memo(DataChartInner);
