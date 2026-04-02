'use client';

import { Database, Download, Share2, Clock, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { HistoryEntry } from '@/lib/types';

type Mode = 'guided' | 'sql' | 'tables' | 'r';

const MODE_TABS: { key: Mode; label: string; color: string; glow: string }[] = [
  { key: 'guided', label: 'Хялбар', color: '#00d68f', glow: 'rgba(0,214,143,0.15)' },
  { key: 'sql', label: 'SQL', color: '#5b9cf6', glow: 'rgba(91,156,246,0.15)' },
  { key: 'tables', label: 'Хүснэгт', color: '#f0b040', glow: 'rgba(240,176,64,0.15)' },
  { key: 'r', label: 'Python', color: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
];

interface Props {
  mode: Mode;
  setMode: (m: Mode) => void;
  history: HistoryEntry[];
  onHistorySelect: (h: HistoryEntry) => void;
  onExport: (() => void) | null;
  activeTable?: string;
  rowCount?: number;
}

export default function AppHeader({ mode, setMode, history, onHistorySelect, onExport, activeTable, rowCount }: Props) {
  const [shareCopied, setShareCopied] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const histRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (histRef.current && !histRef.current.contains(e.target as Node)) setShowHist(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <header className="sticky top-0 z-[100]"
      style={{
        background: 'rgba(12,19,34,0.85)',
        backdropFilter: 'blur(16px) saturate(1.5)',
        borderBottom: '1px solid rgba(26,45,74,0.4)',
      }}>
      <div className="max-w-[1360px] mx-auto px-6 h-[56px] flex items-center gap-4">
        {/* Logo */}
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-glow-green"
          style={{ background: 'linear-gradient(135deg, #00d68f 0%, #0080ff 100%)' }}>
          <Database size={15} color="#fff" strokeWidth={2.5} />
        </div>
        <div className="mr-2">
          <div className="font-display font-bold text-[14.5px] text-ink-100 tracking-tight">Монголын Нээлттэй Өгөгдөл</div>
          <div className="text-[10px] text-ink-600 font-mono tracking-wider">1212.MN / 1,282 ХҮСНЭГТ</div>
        </div>

        {/* Mode tabs */}
        <nav className="ml-2 flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'rgba(7,12,24,0.6)', border: '1px solid rgba(26,45,74,0.3)' }}>
          {MODE_TABS.map(({ key, label, color, glow }) => {
            const active = mode === key;
            return (
              <button key={key} onClick={() => setMode(key)}
                className="relative px-4 py-[7px] rounded-[10px] border-none cursor-pointer text-[12.5px] font-display font-bold tracking-tight transition-all duration-250"
                style={{
                  background: active ? `linear-gradient(135deg, ${color}, ${color}dd)` : 'transparent',
                  color: active ? '#000' : '#506080',
                  boxShadow: active ? `0 2px 12px ${glow}` : 'none',
                }}>
                {label}
              </button>
            );
          })}
        </nav>

        {/* Active data indicator */}
        {activeTable && (
          <div className="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-dim border border-accent/20 max-w-[200px]">
            <Database size={10} className="text-accent flex-shrink-0" />
            <span className="text-[10px] text-accent font-mono truncate">{activeTable}</span>
            {rowCount != null && <span className="text-[9px] text-accent/60 flex-shrink-0">{rowCount.toLocaleString()}</span>}
          </div>
        )}

        {/* Right actions */}
        <div className="ml-auto flex gap-1.5 items-center">
          {/* Share */}
          <button onClick={() => {
            navigator.clipboard.writeText(window.location.href).catch(() => {});
            setShareCopied(true); setTimeout(() => setShareCopied(false), 2000);
          }}
            className={`btn-ghost ${shareCopied ? 'active' : ''}`}>
            <Share2 size={12} /> {shareCopied ? 'Хуулсан!' : 'Хуваалцах'}
          </button>

          {/* History */}
          <div ref={histRef} className="relative">
            <button onClick={() => setShowHist(h => !h)} className="btn-ghost">
              <Clock size={12} /> Түүх
            </button>
            {showHist && history.length > 0 && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-[300px] rounded-2xl z-[200] max-h-[280px] overflow-y-auto"
                style={{
                  background: 'rgba(12,19,34,0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(26,45,74,0.5)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                }}>
                <div className="label-upper p-3 px-4 border-b border-border/40">Хайлтын түүх</div>
                {history.map((h, i) => (
                  <button key={i} onClick={() => { onHistorySelect(h); setShowHist(false); }}
                    className="block w-full text-left px-4 py-2.5 bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-accent-dim"
                    style={{ borderBottom: '1px solid rgba(26,45,74,0.2)' }}>
                    <div className="text-xs text-ink-300 font-medium">{h.label}</div>
                    <div className="text-[10px] text-ink-600 mt-0.5 font-mono">{new Date(h.ts).toLocaleString('mn-MN')}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CSV Export */}
          {onExport && (
            <button onClick={onExport} className="btn-ghost">
              <Download size={12} /> CSV
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
