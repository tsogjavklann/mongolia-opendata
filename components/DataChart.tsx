'use client';

/**
 * Smart DataChart — Rule-based автомат chart engine
 * Column type detection → Chart type suggestion → Render
 */

import { useState, useMemo, useRef, useEffect, memo } from 'react';
import {
  LineChart, BarChart, ScatterChart, PieChart,
  Line, Bar, Scatter, Pie, Cell, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  detectColumns, suggestChart, buildSmartChartData,
  type ColInfo, type ChartSuggestion,
} from '@/lib/transform';
import type { DataRow, ChartPoint } from '@/lib/transform';

const COLORS = [
  '#00c87a','#60a5fa','#f59e0b','#f87171',
  '#a78bfa','#fb923c','#34d399','#38bdf8',
  '#e879f9','#facc15','#4ade80','#fb7185',
];

const fmt = (v: number) => {
  if (Math.abs(v) >= 1_000_000_000) return `${(v/1_000_000_000).toFixed(1)}Т`;
  if (Math.abs(v) >= 1_000_000)     return `${(v/1_000_000).toFixed(1)}М`;
  if (Math.abs(v) >= 1_000)         return `${(v/1_000).toFixed(1)}К`;
  return v.toLocaleString();
};

const CHART_TYPES = [
  { key: 'line',       label: '📈 Шугам' },
  { key: 'area',       label: '🏔 Талбай' },
  { key: 'bar',        label: '📊 Багана' },
  { key: 'multiLine',  label: '📉 Олон шугам' },
  { key: 'pie',        label: '🥧 Бялуу' },
] as const;

type ChartTypeKey = typeof CHART_TYPES[number]['key'];

// Олон series байвал pie утгагүй тул хасах
function getAvailableChartTypes(seriesCount: number) {
  if (seriesCount > 1) return CHART_TYPES.filter(t => t.key !== 'pie');
  return CHART_TYPES;
}

interface DataChartProps {
  rows?: DataRow[];
  // Legacy props (хуучин хэрэглээтэй нийцэх)
  points?: ChartPoint[];
  series?: string[];
  title?: string;
}

// ── Tooltip custom ─────────────────────────────────────────────────────────────
const CustomTooltip = memo(({ active, payload, label }: {active?:boolean; payload?:{name:string;value:number;color:string}[]; label?:string}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#0d1424', border:'1px solid #1a3050', borderRadius:10, padding:'10px 14px', fontFamily:'JetBrains Mono,monospace', fontSize:12 }}>
      <div style={{ color:'#00c87a', fontWeight:700, marginBottom:6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color:p.color, display:'flex', gap:10, justifyContent:'space-between', minWidth:120 }}>
          <span style={{ color:'#64748b' }}>{p.name.length > 24 ? p.name.slice(0,22)+'…' : p.name}</span>
          <span style={{ fontWeight:600 }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
});
CustomTooltip.displayName = 'CustomTooltip';

// ── Smart suggestion badge ──────────────────────────────────────────────────────
const SuggestionBadge = memo(function SuggestionBadge({ suggestion }: { suggestion: ChartSuggestion }) {
  const confColor = suggestion.confidence === 'high' ? '#00c87a' : suggestion.confidence === 'medium' ? '#fbbf24' : '#60a5fa';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'rgba(0,200,122,0.06)', borderRadius:20, border:'1px solid rgba(0,200,122,0.15)' }}>
      <div style={{ width:6, height:6, borderRadius:'50%', background:confColor }} />
      <span style={{ fontSize:10.5, color:'#475569', fontFamily:'JetBrains Mono' }}>
        {suggestion.reason}
      </span>
    </div>
  );
});

function DataChartInner({ rows, points: legacyPoints, series: legacySeries, title }: DataChartProps) {
  const [manualType, setManualType] = useState<ChartTypeKey | null>(null);
  const [activeSeries, setActiveSeries] = useState<Set<string> | null>(null);

  // ── Smart analysis (split for granular memoization) ──
  const detectedCols = useMemo(() => rows?.length ? detectColumns(rows) : null, [rows]);
  const suggestion = useMemo(() => detectedCols ? suggestChart(rows!, detectedCols) : null, [rows, detectedCols]);
  const chartData = useMemo(() => suggestion ? buildSmartChartData(rows!, suggestion) : null, [rows, suggestion]);
  const analysis = useMemo(() => {
    if (!detectedCols || !suggestion || !chartData) return null;
    return { cols: detectedCols, suggest: suggestion, points: chartData.points, series: chartData.series };
  }, [detectedCols, suggestion, chartData]);

  // rows өөрчлөгдөхөд manual override reset
  const prevRowsRef = useRef(rows);
  useEffect(() => {
    if (prevRowsRef.current !== rows) {
      setManualType(null);
      setActiveSeries(null);
      prevRowsRef.current = rows;
    }
  }, [rows]);

  // Legacy fallback
  const legacyMode = !rows?.length && legacyPoints?.length;
  const points  = analysis?.points ?? legacyPoints ?? [];
  const series  = analysis?.series ?? legacySeries ?? [];
  const suggest = analysis?.suggest ?? null;

  const chartType: ChartTypeKey = manualType ?? (suggest?.chartType as ChartTypeKey) ?? 'bar';

  const curActive = activeSeries ?? new Set(series);
  const visSeries = series.filter(s => curActive.has(s));

  if (!points.length || !series.length) return null;

  const toggleSeries = (s: string) => {
    const next = new Set(curActive);
    next.has(s) ? next.delete(s) : next.add(s);
    if (next.size > 0) setActiveSeries(next);
  };

  const tickStyle = { fill:'#475569', fontSize:11, fontFamily:'JetBrains Mono' };
  const gridStyle = { strokeDasharray:'3 3', stroke:'rgba(26,48,80,0.5)' };
  const axisStyle = { stroke:'#1a3050' };
  const marginVal = { top:8, right:24, left:8, bottom:4 };

  // ── Pie data ──
  const pieData = series.slice(0, 12).map((s, i) => ({
    name: s,
    value: points.reduce((sum, p) => sum + ((p[s] as number) || 0), 0),
    color: COLORS[i % COLORS.length],
  })).sort((a, b) => b.value - a.value);

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        {(title || suggest?.title) && (
          <span style={{ fontSize:12.5, color:'#cbd5e1', fontWeight:700 }}>
            {title ?? suggest?.title}
          </span>
        )}
        {suggest && !legacyMode && <SuggestionBadge suggestion={suggest} />}
        <div style={{ marginLeft:'auto', display:'flex', gap:5, flexWrap:'wrap' }}>
          {getAvailableChartTypes(series.length).map(t => (
            <button key={t.key} onClick={() => setManualType(t.key)}
              style={{
                padding:'4px 10px', fontSize:11, fontWeight:600, borderRadius:6,
                border:'1px solid #1a3050', cursor:'pointer', transition:'all 0.15s',
                background: chartType === t.key ? '#00c87a' : 'transparent',
                color: chartType === t.key ? '#000' : '#475569',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Series toggles */}
      {series.length > 1 && chartType !== 'pie' && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
          {series.map((s, i) => (
            <button key={s} onClick={() => toggleSeries(s)}
              style={{
                padding:'3px 9px', fontSize:11, fontWeight:600, borderRadius:20,
                border:`1.5px solid ${COLORS[i % COLORS.length]}`,
                cursor:'pointer', transition:'all 0.15s',
                background: curActive.has(s) ? `${COLORS[i % COLORS.length]}18` : 'transparent',
                color: curActive.has(s) ? COLORS[i % COLORS.length] : '#334155',
                opacity: curActive.has(s) ? 1 : 0.4,
              }}>
              {s.length > 26 ? s.slice(0,24)+'…' : s}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={Math.max(280, Math.min(480, typeof window !== 'undefined' ? window.innerHeight * 0.42 : 380))}>
        {chartType === 'pie' ? (
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name"
              cx="50%" cy="50%" outerRadius={130} innerRadius={55}
              paddingAngle={2} label={({ name, percent }) =>
                `${name.slice(0,14)} ${(percent*100).toFixed(0)}%`
              } labelLine={false}>
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background:'#0d1424', border:'1px solid #1a3050', borderRadius:8, fontFamily:'JetBrains Mono', fontSize:12 }}
              formatter={(v: number, name: string) => [v.toLocaleString(), name]}
            />
          </PieChart>

        ) : chartType === 'area' ? (
          <AreaChart data={points} margin={marginVal}>
            <defs>
              {visSeries.map((s, i) => (
                <linearGradient key={s} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={COLORS[series.indexOf(s) % COLORS.length]} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLORS[series.indexOf(s) % COLORS.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="period" tick={tickStyle} tickLine={false} axisLine={axisStyle} />
            <YAxis tickFormatter={fmt} tick={tickStyle} tickLine={false} axisLine={false} width={65} />
            <Tooltip content={<CustomTooltip />} />
            {visSeries.length > 1 && <Legend wrapperStyle={{ fontFamily:'JetBrains Mono', fontSize:11, color:'#64748b' }} />}
            {visSeries.map((s, i) => {
              const color = COLORS[series.indexOf(s) % COLORS.length];
              return (
                <Area key={s} type="monotone" dataKey={s} stroke={color} strokeWidth={2}
                  fill={`url(#grad${i})`} dot={false} activeDot={{ r:4, strokeWidth:0 }} connectNulls />
              );
            })}
          </AreaChart>

        ) : chartType === 'line' || chartType === 'multiLine' ? (
          <LineChart data={points} margin={{ ...marginVal, right: visSeries.length > 1 ? 60 : marginVal.right }}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="period" tick={tickStyle} tickLine={false} axisLine={axisStyle} />
            <YAxis yAxisId="left" tickFormatter={fmt} tick={tickStyle} tickLine={false} axisLine={false} width={65} />
            {visSeries.length > 1 && (
              <YAxis yAxisId="right" orientation="right" tickFormatter={fmt} tick={tickStyle} tickLine={false} axisLine={false} width={55} />
            )}
            <Tooltip content={<CustomTooltip />} />
            {visSeries.length > 1 && <Legend wrapperStyle={{ fontFamily:'JetBrains Mono', fontSize:11, color:'#64748b' }} />}
            {visSeries.map((s, idx) => {
              const color = COLORS[series.indexOf(s) % COLORS.length];
              const yAxis = visSeries.length > 1 && idx > 0 ? 'right' : 'left';
              return (
                <Line key={s} yAxisId={yAxis} type="monotone" dataKey={s} stroke={color} strokeWidth={2.5}
                  dot={points.length < 60 ? { r:3, fill:color, strokeWidth:0 } : false}
                  activeDot={{ r:5, strokeWidth:0 }} connectNulls />
              );
            })}
          </LineChart>

        ) : (
          <BarChart data={points} margin={marginVal}>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="period" tick={tickStyle} tickLine={false} axisLine={axisStyle}
              angle={points.length > 12 ? -30 : 0} textAnchor={points.length > 12 ? 'end' : 'middle'}
              height={points.length > 12 ? 48 : 24} />
            <YAxis tickFormatter={fmt} tick={tickStyle} tickLine={false} axisLine={false} width={65} />
            <Tooltip content={<CustomTooltip />} />
            {visSeries.length > 1 && <Legend wrapperStyle={{ fontFamily:'JetBrains Mono', fontSize:11, color:'#64748b' }} />}
            {visSeries.map((s) => {
              const color = COLORS[series.indexOf(s) % COLORS.length];
              return (
                <Bar key={s} dataKey={s} fill={color} radius={[3,3,0,0]}
                  maxBarSize={visSeries.length > 1 ? 24 : 48} />
              );
            })}
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Column info (зөвхөн smart mode-д) */}
      {analysis && (
        <div style={{ marginTop:10, display:'flex', gap:6, flexWrap:'wrap' }}>
          {analysis.cols.filter(c => c.type !== 'code').map(col => (
            <span key={col.name} style={{
              fontSize:10, fontFamily:'JetBrains Mono',
              padding:'2px 7px', borderRadius:10,
              background: col.type==='period'      ? 'rgba(251,191,36,0.1)'
                        : col.type==='numeric'     ? 'rgba(0,200,122,0.1)'
                        : col.type==='categorical' ? 'rgba(96,165,250,0.1)'
                        : 'transparent',
              color: col.type==='period'      ? '#fbbf24'
                   : col.type==='numeric'     ? '#00c87a'
                   : col.type==='categorical' ? '#60a5fa'
                   : '#475569',
              border: `1px solid ${
                col.type==='period'      ? 'rgba(251,191,36,0.2)'
                : col.type==='numeric'   ? 'rgba(0,200,122,0.2)'
                : 'rgba(96,165,250,0.2)'
              }`,
            }}>
              {col.name} · {col.type === 'period' ? 'цаг' : col.type === 'numeric' ? 'тоо' : `${col.uniqueCount} утга`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(DataChartInner);
