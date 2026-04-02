'use client';

import { RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { DimMeta, TableEntry } from '@/lib/types';
import TableSearch from '@/components/TableSearch';

const CheckboxExplorer = dynamic(() => import('@/components/CheckboxExplorer'), { ssr: false });

const POPULAR = [
  { label: 'Хүн ам, хүйс, насны бүлэг', emoji: '👥', id: 'DT_NSO_0300_001V3', path: 'Population, household/1_Population, household/DT_NSO_0300_001V3.px' },
  { label: 'ДНБ салбараар', emoji: '📈', id: 'DT_NSO_0500_002V1', path: 'National accounts/1_National accounts/DT_NSO_0500_002V1.px' },
  { label: 'Нэг хүнд ногдох ДНБ', emoji: '💰', id: 'DT_NSO_0500_011V1', path: 'National accounts/1_National accounts/DT_NSO_0500_011V1.px' },
  { label: 'Аймгийн ДНБ', emoji: '🗺️', id: 'DT_NSO_0500_007V1', path: 'National accounts/1_National accounts/DT_NSO_0500_007V1.px' },
  { label: 'ХҮИ (Инфляци)', emoji: '🏷️', id: 'DT_NSO_2400_024V1', path: 'Economy, environment/1_Economy, environment/DT_NSO_2400_024V1.px' },
  { label: 'Ажилгүйдлийн түвшин', emoji: '📊', id: 'DT_NSO_1400_009V1', path: 'Labour/1_Labour/DT_NSO_1400_009V1.px' },
];

interface Props {
  guidedTable: TableEntry | null;
  guidedDims: DimMeta[];
  guidedLoading: boolean;
  loadGuidedTable: (t: TableEntry) => void;
  onEditInSQL?: (sql: string) => void;
}

export default function GuidedMode({ guidedTable, guidedDims, guidedLoading, loadGuidedTable, onEditInSQL }: Props) {
  return (
    <div>
      {/* Search bar */}
      <div className="max-w-[580px] mb-5">
        <TableSearch onSelect={loadGuidedTable} placeholder="Хүснэгт хайх... (жш: хүн ам, ДНБ, боловсрол)" />
      </div>

      {/* Popular cards */}
      {!guidedTable && (
        <>
          <div className="label-upper mb-4">Түгээмэл хүснэгтүүд</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {POPULAR.map((p, i) => (
              <button key={i} onClick={() => loadGuidedTable({ id: p.id, path: p.path, text: p.label })}
                className="card text-left cursor-pointer transition-all duration-250 group hover:shadow-glow-green"
                style={{ animationDelay: `${i * 60}ms` }}>
                <div className="text-2xl mb-2 transition-transform duration-300 group-hover:scale-110">{p.emoji}</div>
                <div className="text-[13px] font-display font-bold text-ink-200 leading-tight group-hover:text-accent transition-colors duration-200">{p.label}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Loading skeleton */}
      {guidedLoading && (
        <div className="flex items-center gap-2.5 py-4 text-ink-600">
          <RefreshCw size={15} className="text-accent spin" />
          <span className="text-[13px]">Dimension-уудыг ачааллаж байна...</span>
        </div>
      )}

      {/* Checkbox Explorer */}
      {guidedTable && !guidedLoading && guidedDims.length > 0 && (
        <CheckboxExplorer table={guidedTable} dims={guidedDims} onEditInSQL={onEditInSQL} />
      )}

      {/* Error state */}
      {guidedTable && !guidedLoading && guidedDims.length === 0 && (
        <div className="p-5 bg-red-500/5 border border-red-500/15 rounded-card mt-2.5">
          <div className="text-[13px] text-red-300 mb-1.5">Хүснэгтийн dimension-уудыг татаж чадсангүй</div>
          <div className="text-xs text-ink-500">1212.mn API удааширсан байж болно. Дахин оролдоно уу.</div>
          <button onClick={() => loadGuidedTable(guidedTable)} className="btn-primary mt-2.5 text-xs py-1.5 px-3">
            Дахин татах
          </button>
        </div>
      )}
    </div>
  );
}
