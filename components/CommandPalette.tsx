'use client';

import * as React from 'react';
import {
  Database,
  Sparkles,
  Code2,
  Table as TableIcon,
  GitCompare,
  FileCode,
  History as HistoryIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import type { TableEntry, HistoryEntry } from '@/lib/types';

type Mode = 'guided' | 'sql' | 'tables' | 'compare' | 'r';

interface AliasEntry {
  alias: string;
  id: string;
  path: string;
  label: string;
  category: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setMode: (m: Mode) => void;
  onUseTable: (alias: string, label: string) => void;
  history: HistoryEntry[];
  onHistorySelect: (h: HistoryEntry) => void;
}

const MODE_ITEMS: { key: Mode; label: string; hint: string; Icon: typeof Database }[] = [
  { key: 'guided', label: 'Хялбар горим', hint: 'Хайлт + AI', Icon: Sparkles },
  { key: 'sql', label: 'SQL editor', hint: 'Гар SQL бичих', Icon: Code2 },
  { key: 'tables', label: 'Хүснэгтийн жагсаалт', hint: '1,282 хүснэгт', Icon: TableIcon },
  { key: 'compare', label: 'Харьцуулах горим', hint: 'Хоёр асуулга', Icon: GitCompare },
  { key: 'r', label: 'Python notebook', hint: 'Pyodide + ML', Icon: FileCode },
];

export function CommandPalette({
  open,
  onOpenChange,
  setMode,
  onUseTable,
  history,
  onHistorySelect,
}: Props) {
  const [tables, setTables] = React.useState<TableEntry[]>([]);
  const [aliases, setAliases] = React.useState<AliasEntry[]>([]);
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    if (!open) return;
    if (tables.length === 0) {
      fetch('/tables.json')
        .then((r) => r.json())
        .then(setTables)
        .catch(() => {});
    }
    if (aliases.length === 0) {
      fetch('/aliases.json')
        .then((r) => r.json())
        .then(setAliases)
        .catch(() => {});
    }
  }, [open, tables.length, aliases.length]);

  // Global ⌘K / Ctrl+K listener
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Хайх — хүснэгт, alias, горим..." />
      <CommandList>
        <CommandEmpty>Үр дүн олдсонгүй.</CommandEmpty>

        <CommandGroup heading="Горим">
          {MODE_ITEMS.map(({ key, label, hint, Icon }) => (
            <CommandItem
              key={key}
              value={`mode ${key} ${label}`}
              onSelect={() => {
                setMode(key);
                onOpenChange(false);
              }}
            >
              <Icon className="text-muted-foreground" />
              <span>{label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{hint}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {aliases.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Түгээмэл alias">
              {aliases.slice(0, 24).map((a) => (
                <CommandItem
                  key={a.alias}
                  value={`alias ${a.alias} ${a.label} ${a.id}`}
                  onSelect={() => {
                    onUseTable(a.alias, a.label);
                    onOpenChange(false);
                  }}
                >
                  <code className="rounded-md bg-accent-dim px-1.5 py-0.5 font-mono text-[10px] text-accent">
                    {a.alias}
                  </code>
                  <span className="truncate">{a.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{a.category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {tables.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Бүх хүснэгт (${tables.length.toLocaleString()})`}>
              {tables.slice(0, 80).map((t) => (
                <CommandItem
                  key={t.id}
                  value={`table ${t.id} ${t.text} ${t.category ?? ''}`}
                  onSelect={() => {
                    onUseTable(t.path, t.text);
                    onOpenChange(false);
                  }}
                >
                  <Database className="text-muted-foreground" />
                  <span className="truncate">{t.text}</span>
                  {t.category && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {t.category}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {history.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Сүүлийн асуулга">
              {history.slice(0, 8).map((h, i) => (
                <CommandItem
                  key={i}
                  value={`history ${h.label} ${h.sql}`}
                  onSelect={() => {
                    onHistorySelect(h);
                    onOpenChange(false);
                  }}
                >
                  <HistoryIcon className="text-muted-foreground" />
                  <span className="truncate">{h.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                    {new Date(h.ts).toLocaleDateString('mn-MN')}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Тохиргоо">
          <CommandItem
            value="theme toggle"
            onSelect={() => {
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
              onOpenChange(false);
            }}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="text-muted-foreground" />
            ) : (
              <Moon className="text-muted-foreground" />
            )}
            <span>{resolvedTheme === 'dark' ? 'Цайвар горим' : 'Бараан горим'}</span>
            <CommandShortcut>theme</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 text-[10px] text-muted-foreground font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-surface-overlay border border-border px-1.5 py-0.5">↑↓</kbd>
            навигаци
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-surface-overlay border border-border px-1.5 py-0.5">↵</kbd>
            сонгох
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-surface-overlay border border-border px-1.5 py-0.5">esc</kbd>
            хаах
          </span>
        </div>
        <span className="flex items-center gap-1">
          Powered by <Sparkles size={10} className="text-accent" />
        </span>
      </div>
    </CommandDialog>
  );
}

