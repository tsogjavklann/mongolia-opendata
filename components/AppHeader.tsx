'use client';

import { Database, Download, Clock, Search, FileText, FileSpreadsheet, Sparkles } from 'lucide-react';
import type { HistoryEntry } from '@/lib/types';
import AuthButton from './AuthButton';
import SavedQueriesPanel from './SavedQueriesPanel';
import ShareModal from './ShareModal';
import { ThemeToggle } from './ThemeToggle';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Mode = 'guided' | 'sql' | 'tables' | 'compare' | 'r';

const MODE_TABS: { key: Mode; label: string; hint: string }[] = [
  { key: 'guided', label: 'Хялбар', hint: 'Дэвшилтэт хайлт' },
  { key: 'sql', label: 'SQL', hint: 'SQL editor' },
  { key: 'tables', label: 'Хүснэгт', hint: '1,282 ширхэг' },
  { key: 'compare', label: 'Харьцуулах', hint: 'Хоёр асуулга' },
  { key: 'r', label: 'Python', hint: 'Pyodide notebook' },
];

interface Props {
  mode: Mode;
  setMode: (m: Mode) => void;
  history: HistoryEntry[];
  onHistorySelect: (h: HistoryEntry) => void;
  onExport: (() => void) | null;
  onExportXLSX?: (() => void) | null;
  activeTable?: string;
  rowCount?: number;
  currentSql?: string;
  onLoadSql?: (sql: string) => void;
  onOpenCommand?: () => void;
  onOpenAuthModal?: () => void;
}

export default function AppHeader({
  mode,
  setMode,
  history,
  onHistorySelect,
  onExport,
  onExportXLSX,
  activeTable,
  rowCount,
  currentSql,
  onLoadSql,
  onOpenCommand,
  onOpenAuthModal,
}: Props) {
  const hasExport = !!(onExport || onExportXLSX);

  return (
    <TooltipProvider delayDuration={150}>
      <header
        className="sticky top-0 z-[100] glass"
        style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
      >
        <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center gap-4">
          {/* ── Logo + wordmark */}
          <a href="/" className="flex items-center gap-2.5 mr-2 group" aria-label="Home">
            <div
              className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 shadow-glow-green transition-transform group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, var(--c-accent), var(--c-accent2))',
              }}
            >
              <Database size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="hide-mobile">
              <div className="font-display font-bold text-[14px] text-foreground tracking-tight leading-none">
                Mongolia<span className="text-accent"> · </span>OpenData
              </div>
              <div className="text-[9.5px] text-muted-foreground font-mono tracking-[0.18em] mt-0.5">
                1212.MN · 1,282 TABLES
              </div>
            </div>
          </a>

          {/* ── Mode tabs (single-accent design) */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="h-9">
              {MODE_TABS.map(({ key, label, hint }) => (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <TabsTrigger value={key} className="px-3.5">
                      {label}
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{hint}</TooltipContent>
                </Tooltip>
              ))}
            </TabsList>
          </Tabs>

          {/* ── Active table indicator */}
          {activeTable && (
            <div className="hide-mobile flex items-center gap-1.5 max-w-[220px]">
              <Badge variant="default" className="gap-1.5 py-1 px-2.5">
                <Database size={9} />
                <span className="truncate">{activeTable}</span>
                {rowCount != null && (
                  <span className="text-accent/60 font-mono">
                    {rowCount.toLocaleString()}
                  </span>
                )}
              </Badge>
            </div>
          )}

          {/* ── Right cluster */}
          <div className="ml-auto flex items-center gap-1">
            {/* Command palette */}
            {onOpenCommand && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onOpenCommand}
                    className="hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-lg border border-border bg-surface-darker/60 hover:bg-surface-raised transition-colors text-xs text-muted-foreground"
                  >
                    <Search size={12} />
                    <span className="font-mono text-[11px]">Хайх...</span>
                    <kbd className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-overlay text-foreground border border-border">
                      <Sparkles size={9} className="text-accent" /> K
                    </kbd>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Команд цонх <span className="ml-1 opacity-60">⌘K</span>
                </TooltipContent>
              </Tooltip>
            )}

            {/* History */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="icon-btn h-8 w-8 inline-flex items-center justify-center" aria-label="History">
                      <Clock size={14} />
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Хайлтын түүх</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-[320px]">
                <DropdownMenuLabel>Хайлтын түүх</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {history.length === 0 && (
                  <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                    Хоосон. SQL ажиллуулсны дараа энд харагдана.
                  </div>
                )}
                {history.slice(0, 12).map((h, i) => (
                  <DropdownMenuItem
                    key={i}
                    onSelect={() => onHistorySelect(h)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <div className="text-xs font-medium text-foreground line-clamp-1">{h.label}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {new Date(h.ts).toLocaleString('mn-MN')}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Exports — combined dropdown */}
            {hasExport && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button className="icon-btn h-8 w-8 inline-flex items-center justify-center" aria-label="Export">
                        <Download size={14} />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Экспортлох</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Үр дүн татах</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {onExport && (
                    <DropdownMenuItem onSelect={onExport}>
                      <FileText size={14} className="text-muted-foreground" />
                      CSV (UTF-8)
                      <DropdownMenuShortcut>.csv</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  )}
                  {onExportXLSX && (
                    <DropdownMenuItem onSelect={onExportXLSX}>
                      <FileSpreadsheet size={14} className="text-muted-foreground" />
                      Excel
                      <DropdownMenuShortcut>.xlsx</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Saved queries */}
            {currentSql !== undefined && onLoadSql && (
              <SavedQueriesPanel currentSql={currentSql} onLoad={onLoadSql} />
            )}

            {/* Share */}
            <ShareModal />

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Divider */}
            <div className="w-px h-6 bg-border mx-1" />

            {/* Auth */}
            <AuthButton onOpenAuthModal={onOpenAuthModal} />
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
