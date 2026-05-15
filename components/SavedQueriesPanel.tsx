'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Plus, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  listSavedQueries,
  saveQuery,
  deleteQuery,
  type SavedQuery,
} from '@/lib/savedQueries';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  currentSql: string;
  onLoad: (sql: string) => void;
}

export default function SavedQueriesPanel({ currentSql, onLoad }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SavedQuery[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setItems(listSavedQueries());
  }, [open]);

  const refresh = () => setItems(listSavedQueries());

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed || !currentSql.trim()) return;
    saveQuery(trimmed, currentSql);
    setName('');
    setShowSave(false);
    refresh();
    toast.success(`"${trimmed}" хадгалагдлаа`);
  };

  const handleDelete = (id: string, n: string) => {
    if (!confirm(`"${n}" query-г устгах уу?`)) return;
    deleteQuery(id);
    refresh();
    toast.success('Устгасан');
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Sheet open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <button
                className="icon-btn h-8 w-8 inline-flex items-center justify-center"
                aria-label="Saved queries"
              >
                <Bookmark size={14} />
              </button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Хадгалсан SQL</TooltipContent>
        </Tooltip>

        <SheetContent side="right" className="w-[420px] sm:max-w-[420px] p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <Bookmark size={16} className="text-accent" />
              Хадгалсан SQL
              <span className="text-xs text-muted-foreground font-mono">({items.length})</span>
            </SheetTitle>
            <SheetDescription>
              Дахин ашиглах SQL query-уудыг хадгалж нэрлэх боломжтой.
            </SheetDescription>
          </SheetHeader>

          <div className="px-5 py-3 border-b border-border">
            {showSave ? (
              <div className="space-y-2">
                <Input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') setShowSave(false);
                  }}
                  placeholder="Query-ийн нэр (жш: ДНБ 2020-2024)"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={!name.trim() || !currentSql.trim()}
                    size="sm"
                    className="flex-1"
                  >
                    Хадгалах
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSave(false);
                      setName('');
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Болих
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowSave(true)}
                disabled={!currentSql.trim()}
                size="sm"
                variant="outline"
                className="w-full border-dashed border-accent/40 text-accent hover:bg-accent-dim"
              >
                <Plus size={14} /> Одоогийн SQL-ийг хадгалах
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1">
            {items.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">
                <Bookmark size={32} className="mx-auto mb-3 opacity-20" />
                Хадгалсан query байхгүй байна.
                <br />
                <span className="text-xs opacity-60">SQL бичээд дээрх товчоор хадгалаарай.</span>
              </div>
            ) : (
              <div className="py-2">
                {items.map((q) => (
                  <div
                    key={q.id}
                    className="group px-5 py-3 border-b border-border/30 hover:bg-accent-dim cursor-pointer transition-colors flex items-start gap-2"
                    onClick={() => {
                      onLoad(q.sql);
                      setOpen(false);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-display font-semibold text-foreground mb-1 truncate flex items-center gap-1.5">
                        {q.name}
                        <ArrowRight
                          size={11}
                          className="text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate">
                        {q.sql.slice(0, 100)}
                        {q.sql.length > 100 ? '…' : ''}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                        {new Date(q.updatedAt).toLocaleString('mn-MN')}
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(q.id, q.name);
                      }}
                      size="icon-sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                      aria-label="Устгах"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
