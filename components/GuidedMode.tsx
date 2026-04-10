'use client';

import { RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { DimMeta, TableEntry } from '@/lib/types';
import TableSearch from '@/components/TableSearch';

const CheckboxExplorer = dynamic(() => import('@/components/CheckboxExplorer'), { ssr: false });

const POPULAR = [
  { label: 'Хүн ам, хүйс, насны бүлэг', emoji: '👥', id: 'DT_NSO_0300_001V3', path: 'Population, household/1_Population, household/DT_NSO_0300_001V3.px' },
  { label: 'ДНБ салбараар', emoji: '📈', id: 'DT_NSO_0500_002V1', path: 'Economy, environment/National Accounts/DT_NSO_0500_002V1.px' },
  { label: 'Нэг хүнд ногдох ДНБ', emoji: '💰', id: 'DT_NSO_0500_011V1', path: 'Regional development/National accounts/DT_NSO_0500_011V1.px' },
  { label: 'Аймгийн ДНБ', emoji: '🗺️', id: 'DT_NSO_0500_007V1', path: 'Economy, environment/National Accounts/DT_NSO_0500_007V1.px' },
  { label: 'ХҮИ (Инфляци)', emoji: '🏷️', id: 'DT_NSO_0600_013V2', path: 'Regional development/Price/DT_NSO_0600_013V2.px' },
  { label: 'Ажилгүйдлийн түвшин', emoji: '📊', id: 'DT_NSO_0400_020V2_10', path: 'Regional development/Labour and business/DT_NSO_0400_020V2_10.px' },
];

interface Props {
  guidedTable: TableEntry | null;
  guidedDims: DimMeta[];
  guidedLoading: boolean;
  guidedError: string | null;
  loadGuidedTable: (t: TableEntry) => void;
  onEditInSQL?: (sql: string) => void;
}

export default function GuidedMode({ guidedTable, guidedDims, guidedLoading, guidedError, loadGuidedTable, onEditInSQL }: Props) {
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

      {/* Loading state */}
      {guidedLoading && (
        <div className="flex items-center gap-2.5 py-4 text-ink-600">
          <RefreshCw size={15} className="text-accent spin" />
          <span className="text-[13px]">Dimension-уудыг ачааллаж байна...</span>
        </div>
      )}

      {/* Checkbox Explorer — амжилттай */}
      {guidedTable && !guidedLoading && guidedDims.length > 0 && (
        <CheckboxExplorer table={guidedTable} dims={guidedDims} onEditInSQL={onEditInSQL} />
      )}

      {/* Error state — dimension татаж чадаагүй */}
      {guidedTable && !guidedLoading && guidedDims.length === 0 && (
        <div className="p-5 bg-red-500/5 border border-red-500/15 rounded-card mt-2.5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-[13px] font-medium text-red-300">Dimension-уудыг татаж чадсангүй</span>
          </div>
          {guidedError && (
            <div className="text-xs text-ink-500 mb-2 font-mono bg-ink-900/50 rounded px-2.5 py-1.5">
              {guidedError}
            </div>
          )}
          <div className="text-xs text-ink-500 mb-3">
            1212.mn API-тай холбогдож чадаагүй эсвэл хүснэгтийн зам буруу байж болно.
          </div>
          <div className="flex gap-2">
            <button onClick={() => loadGuidedTable(guidedTable)}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <RefreshCw size={12} /> Дахин оролдох
            </button>
            <button onClick={() => window.location.reload()}
              className="text-xs py-1.5 px-3 rounded-md bg-ink-800 text-ink-300 hover:bg-ink-700 transition-colors flex items-center gap-1.5">
              <ArrowLeft size={12} /> Буцах
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
