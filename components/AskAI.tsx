'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  Code2,
  Table2,
  GitCompare,
  FileCode2,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const SAMPLE_QUESTIONS: Record<AIFormat, string[]> = {
  sql: [
    '2015 оноос хойш Монголын хүн ам хэрхэн өөрчлөгдсөн бэ?',
    'Сүүлийн 5 жилийн инфляц ямар байсан?',
    'ДНБ салбараар 2024 онд хэдэн хувь байсан бэ?',
  ],
  table: [
    '2024 оны аймгийн ДНБ-ийн топ 10 хүснэгтээр',
    'Хүн амын тоо аймгаар эрэмбэлэгдсэн хүснэгт',
    'Сүүлийн 10 жилийн инфляцийн хүснэгт',
  ],
  compare: [
    '2020 vs 2024 оны аймгийн ДНБ',
    'Эрэгтэй эмэгтэй цалингийн зөрүү',
    'Инфляц vs ажилгүйдэл сүүлийн 10 жилд',
  ],
  python: [
    '2030 оны хүн амын прогноз ML-ээр',
    'ДНБ vs инфляцийн корреляц heatmap',
    'Аймгуудын хүн амаар KMeans кластер',
    'Инфляцийн линеар тренд + 5 жилийн forecast',
  ],
};

const FORMATS = [
  { key: 'sql', label: 'SQL', Icon: Code2, desc: 'Query + автомат график' },
  { key: 'table', label: 'Хүснэгт', Icon: Table2, desc: 'Tabular үр дүн' },
  { key: 'compare', label: 'Харьцуулах', Icon: GitCompare, desc: 'Хоёр query side-by-side' },
  { key: 'python', label: 'Python', Icon: FileCode2, desc: 'pandas + matplotlib код' },
] as const;

type AIFormat = typeof FORMATS[number]['key'];

export interface AIResult {
  format: AIFormat;
  sql?: string;
  python?: string;
  leftSql?: string;
  rightSql?: string;
  leftLabel?: string;
  rightLabel?: string;
  explanation?: string;
}

interface Props {
  onResult: (result: AIResult) => void;
  large?: boolean;
}

export default function AskAI({ onResult, large = false }: Props) {
  const [format, setFormat] = useState<AIFormat>('sql');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let i = 0;
    const samples = SAMPLE_QUESTIONS[format];
    setHint(samples[0]);
    const tick = setInterval(() => {
      i = (i + 1) % samples.length;
      setHint(samples[i]);
    }, 3500);
    return () => clearInterval(tick);
  }, [format]);

  const ask = async (q?: string) => {
    const text = (q ?? question).trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, format }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? 'AI хариу буцаасангүй');
        return;
      }
      onResult({
        format: data.format ?? format,
        sql: data.sql,
        python: data.python,
        leftSql: data.leftSql,
        rightSql: data.rightSql,
        leftLabel: data.leftLabel,
        rightLabel: data.rightLabel,
        explanation: data.explanation,
      });
      setQuestion('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Сүлжээний алдаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        large
          ? 'relative rounded-2xl border border-border bg-card/40 shadow-elevated p-6 backdrop-blur'
          : 'relative rounded-2xl border border-border bg-card/40 p-5'
      }
    >
      {/* Soft brand glow corner */}
      <div
        className="pointer-events-none absolute -top-px -left-px h-32 w-32 rounded-tl-2xl"
        style={{
          background:
            'radial-gradient(ellipse 200px 100px at 0% 0%, var(--c-accent-glow), transparent 70%)',
        }}
      />

      {/* Format toggle (single-accent) */}
      <div className="relative flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-dim text-accent">
            <Sparkles size={14} strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[13px] font-display font-bold text-foreground leading-none">
              Монголоор асуу
            </div>
            <div className="text-[10px] text-muted-foreground font-mono mt-1">
              AI ТАНЫ АСУУЛТЫГ {format.toUpperCase()} БОЛГОНО
            </div>
          </div>
        </div>

        <ToggleGroup
          type="single"
          value={format}
          onValueChange={(v) => v && setFormat(v as AIFormat)}
        >
          {FORMATS.map(({ key, label, Icon, desc }) => (
            <ToggleGroupItem key={key} value={key} aria-label={label} title={desc}>
              <Icon size={11} />
              <span>{label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Input + button */}
      <div className="relative flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          disabled={loading}
          placeholder={hint ?? 'Асуултаа Монголоор бичнэ үү...'}
          className={
            large
              ? 'flex-1 min-w-0 rounded-xl border border-border bg-surface-darker/70 px-4 py-3.5 text-[15px] font-sans text-foreground placeholder:text-ink-500 outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--c-accent-dim),0_0_24px_var(--c-accent-glow)]'
              : 'flex-1 min-w-0 rounded-xl border border-border bg-surface-darker/70 px-4 py-3 text-sm font-sans text-foreground placeholder:text-ink-500 outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--c-accent-dim)]'
          }
        />
        <button
          onClick={() => ask()}
          disabled={loading || !question.trim()}
          className="inline-flex items-center gap-2 rounded-xl px-5 font-display font-bold text-sm text-primary-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, var(--c-accent), var(--c-accent-hover))',
            boxShadow: '0 2px 12px var(--c-accent-glow)',
          }}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <ArrowRight size={14} />}
          {loading ? 'Бодож байна' : 'Асуух'}
        </button>
      </div>

      {/* Sample chips */}
      {!question && !loading && (
        <div className="relative flex flex-wrap gap-1.5 mt-3">
          {SAMPLE_QUESTIONS[format].slice(0, 3).map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuestion(q);
                ask(q);
              }}
              className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-surface-raised text-muted-foreground transition-colors hover:border-accent hover:text-accent hover:bg-accent-dim"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="relative mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle size={13} className="text-destructive flex-shrink-0 mt-0.5" />
          <span className="text-[12px] text-destructive">{error}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Python код харуулах модал — AskAI-ийн python format-ын үр дүн
 */
export function PythonModal({ result, onClose }: { result: AIResult | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  if (!result || result.format !== 'python' || !result.python) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.python!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-popover border border-border rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-floating"
      >
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileCode2 size={16} className="text-accent2" />
            <h3 className="text-sm font-display font-bold text-foreground m-0">Python код</h3>
            <span className="text-[10px] text-muted-foreground font-mono">
              pandas + matplotlib
            </span>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X size={18} />
          </button>
        </div>

        {result.explanation && (
          <div className="px-5 py-3 border-b border-border text-muted-foreground text-[12.5px] leading-relaxed">
            {result.explanation}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4 relative">
          <pre className="m-0 bg-surface-darker border border-border rounded-lg p-4 text-[12.5px] font-mono text-foreground leading-relaxed overflow-auto whitespace-pre-wrap break-words">
            {result.python}
          </pre>
          <button
            onClick={copy}
            className={`absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold border transition-colors ${
              copied
                ? 'bg-accent text-primary-foreground border-accent'
                : 'bg-surface-raised text-foreground border-border hover:bg-surface-overlay'
            }`}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Хуулсан' : 'Хуулах'}
          </button>
        </div>

        <div className="px-5 py-3 border-t border-border text-[11px] text-muted-foreground bg-accent-dim leading-relaxed">
          <div>
            <strong className="text-foreground">Суулгах:</strong>{' '}
            <code className="text-accent2">
              pip install requests pandas matplotlib seaborn scikit-learn statsmodels
            </code>
          </div>
          <div className="mt-1">
            Дараа нь .py файлд хуулж <code className="text-accent2">python script.py</code>. ML,
            прогноз, кластер бүх боломжтой.
          </div>
        </div>
      </div>
    </div>
  );
}
