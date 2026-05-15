'use client';

import {
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Users,
  TrendingUp,
  Wallet,
  Map,
  Tag,
  Briefcase,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import type { ComponentType, SVGProps } from 'react';
import type { DimMeta, TableEntry } from '@/lib/types';
import AskAI, { type AIResult } from '@/components/AskAI';
import Stories from '@/components/Stories';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const CheckboxExplorer = dynamic(() => import('@/components/CheckboxExplorer'), { ssr: false });

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const POPULAR: {
  label: string;
  Icon: Icon;
  stat: string;
  hint: string;
  id: string;
  path: string;
}[] = [
  {
    label: 'Хүн ам, хүйс, нас',
    Icon: Users,
    stat: '3.5M',
    hint: 'Aймаг, нас, хүйсээр',
    id: 'DT_NSO_0300_001V3',
    path: 'Population, household/1_Population, household/DT_NSO_0300_001V3.px',
  },
  {
    label: 'ДНБ салбараар',
    Icon: TrendingUp,
    stat: '52T₮',
    hint: 'Жил, салбар',
    id: 'DT_NSO_0500_002V1',
    path: 'Economy, environment/National Accounts/DT_NSO_0500_002V1.px',
  },
  {
    label: 'Нэг хүнд ногдох ДНБ',
    Icon: Wallet,
    stat: '14M₮',
    hint: 'Per-capita',
    id: 'DT_NSO_0500_011V1',
    path: 'Regional development/National accounts/DT_NSO_0500_011V1.px',
  },
  {
    label: 'Аймгийн ДНБ',
    Icon: Map,
    stat: '21 аймаг',
    hint: 'Бүс нутгаар',
    id: 'DT_NSO_0500_007V1',
    path: 'Economy, environment/National Accounts/DT_NSO_0500_007V1.px',
  },
  {
    label: 'Инфляц (ХҮИ)',
    Icon: Tag,
    stat: 'Сар бүр',
    hint: 'Aймаг, бүтээгдэхүүн',
    id: 'DT_NSO_0600_013V2',
    path: 'Regional development/Price/DT_NSO_0600_013V2.px',
  },
  {
    label: 'Ажилгүйдэл',
    Icon: Briefcase,
    stat: '%',
    hint: 'Аймаг, нас, хүйс',
    id: 'DT_NSO_0400_020V2_10',
    path: 'Regional development/Labour and business/DT_NSO_0400_020V2_10.px',
  },
];

interface Props {
  guidedTable: TableEntry | null;
  guidedDims: DimMeta[];
  guidedLoading: boolean;
  guidedError: string | null;
  loadGuidedTable: (t: TableEntry) => void;
  onEditInSQL?: (sql: string) => void;
  onAIResult?: (result: AIResult) => void;
}

export default function GuidedMode({
  guidedTable,
  guidedDims,
  guidedLoading,
  guidedError,
  loadGuidedTable,
  onEditInSQL,
  onAIResult,
}: Props) {
  if (guidedTable) {
    // Detail view (table chosen)
    return (
      <div className="fade-up">
        {guidedLoading && (
          <div className="flex items-center gap-2.5 py-4 text-muted-foreground">
            <RefreshCw size={15} className="text-accent spin" />
            <span className="text-[13px]">Dimension-уудыг ачааллаж байна...</span>
          </div>
        )}

        {!guidedLoading && guidedDims.length > 0 && (
          <CheckboxExplorer table={guidedTable} dims={guidedDims} onEditInSQL={onEditInSQL} />
        )}

        {!guidedLoading && guidedDims.length === 0 && (
          <div className="p-5 bg-destructive/5 border border-destructive/15 rounded-card mt-2.5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-destructive" />
              <span className="text-[13px] font-medium text-destructive">
                Dimension-уудыг татаж чадсангүй
              </span>
            </div>
            {guidedError && (
              <div className="text-xs text-muted-foreground mb-2 font-mono bg-surface-darker rounded px-2.5 py-1.5">
                {guidedError}
              </div>
            )}
            <div className="text-xs text-muted-foreground mb-3">
              1212.mn API-тай холбогдож чадаагүй эсвэл хүснэгтийн зам буруу байж болно.
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => loadGuidedTable(guidedTable)}>
                <RefreshCw size={12} /> Дахин оролдох
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                <ArrowLeft size={12} /> Буцах
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Landing view
  return (
    <div className="fade-up space-y-12 pt-4">
      {/* ── HERO ───────────────────────────────────── */}
      <section className="text-center max-w-3xl mx-auto pt-6">
        <Badge variant="default" className="gap-1.5 mb-5 inline-flex">
          <Sparkles size={10} />
          1,282 ХҮСНЭГТ · ҮСХ · ШУУД ОНЛАЙН
        </Badge>

        <h1
          className="font-display font-bold text-foreground tracking-tight leading-[1.1] text-balance"
          style={{ fontSize: 'clamp(28px, 4.5vw, 52px)' }}
        >
          Монголын статистик{' '}
          <span
            style={{
              background:
                'linear-gradient(135deg, var(--c-accent) 0%, var(--c-accent2) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            хормын дотор
          </span>
        </h1>

        <p className="text-[15px] text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed">
          Монгол хэлээр асуу, бэлэн дашбоард сонго, эсвэл SQL-ээр өгөгдөл татаж график үүсгэ.
        </p>

        {/* AI Hero input */}
        {onAIResult && (
          <div className="mt-8 max-w-2xl mx-auto">
            <AskAI onResult={onAIResult} large />
          </div>
        )}

        <div className="mt-4 text-[11px] text-muted-foreground font-mono">
          Хайх:{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-surface-raised border border-border">⌘ K</kbd>{' '}
          ·{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-surface-raised border border-border">Ctrl K</kbd>
        </div>
      </section>

      {/* ── BENTO: POPULAR ────────────────────────── */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="label-upper">Түгээмэл хүснэгтүүд</div>
            <div className="text-sm text-muted-foreground mt-1">
              Хамгийн их асуудаг 6 хүснэгт. Дарж dimension-оор шүүх.
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR.map((p, i) => (
            <button
              key={p.id}
              onClick={() => loadGuidedTable({ id: p.id, path: p.path, text: p.label })}
              className="group relative overflow-hidden rounded-card border border-border bg-card text-left p-5 transition-all duration-200 hover:border-accent/40 hover:shadow-glow-green hover:-translate-y-0.5 fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Subtle gradient corner */}
              <div
                className="pointer-events-none absolute -top-px -right-px h-24 w-24 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(ellipse 120px 80px at 100% 0%, var(--c-accent-glow), transparent 70%)',
                }}
              />

              <div className="relative flex items-start justify-between mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-dim text-accent transition-colors group-hover:bg-accent group-hover:text-primary-foreground">
                  <p.Icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-[11px] font-bold text-accent">{p.stat}</span>
              </div>

              <div className="relative font-display text-[14.5px] font-bold text-foreground leading-tight group-hover:text-accent transition-colors">
                {p.label}
              </div>
              <div className="relative text-[11px] text-muted-foreground mt-1 font-mono">
                {p.hint}
              </div>

              <div className="relative mt-4 flex items-center gap-1 text-[10px] font-mono text-muted-foreground/60 group-hover:text-accent transition-colors">
                <span>Үзэх</span>
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── STORIES ────────────────────────────────── */}
      <section>
        <Stories onOpenInSQL={onEditInSQL} />
      </section>
    </div>
  );
}
