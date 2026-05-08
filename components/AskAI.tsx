'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, ArrowRight, Loader2, AlertCircle,
  Code2, Table2, GitCompare, FileCode2, Copy, Check, X,
} from 'lucide-react';

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
  { key: 'sql', label: 'SQL', icon: Code2, color: '#5b9cf6', desc: 'Query + автомат график' },
  { key: 'table', label: 'Хүснэгт', icon: Table2, color: '#f0b040', desc: 'Tabular үр дүн' },
  { key: 'compare', label: 'Харьцуулах', icon: GitCompare, color: '#f472b6', desc: 'Хоёр query side-by-side' },
  { key: 'python', label: 'Python', icon: FileCode2, color: '#a78bfa', desc: 'pandas + matplotlib код' },
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
}

export default function AskAI({ onResult }: Props) {
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
    setLoading(true); setError(null);
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

  const activeFormat = FORMATS.find(f => f.key === format)!;

  return (
    <div
      className="rounded-2xl p-5 mb-6"
      style={{
        background: `linear-gradient(135deg, ${activeFormat.color}11, ${activeFormat.color}08)`,
        border: `1px solid ${activeFormat.color}33`,
        boxShadow: `0 4px 30px ${activeFormat.color}11`,
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `linear-gradient(135deg,${activeFormat.color},${activeFormat.color}cc)` }}
        >
          <Sparkles size={14} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-[13px] font-display font-bold text-ink-100">Монголоор асуу</div>
          <div className="text-[10px] text-ink-600 font-mono">AI ТАНЫ АСУУЛТЫГ {activeFormat.label.toUpperCase()} БОЛГОНО</div>
        </div>
      </div>

      {/* Format selector chips */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {FORMATS.map(f => {
          const active = f.key === format;
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              onClick={() => setFormat(f.key)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
              style={{
                background: active ? `${f.color}22` : 'rgba(7,12,24,0.4)',
                border: `1px solid ${active ? f.color : 'rgba(26,45,74,0.3)'}`,
                color: active ? f.color : '#64748b',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title={f.desc}
            >
              <Icon size={12} /> {f.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            disabled={loading}
            placeholder={hint ?? 'Асуултаа Монголоор бичнэ үү...'}
            className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all"
            style={{
              background: 'rgba(7,12,24,0.7)',
              border: `1px solid ${activeFormat.color}44`,
              color: '#e2e8f0',
            }}
          />
        </div>
        <button
          onClick={() => ask()}
          disabled={loading || !question.trim()}
          className="px-5 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg,${activeFormat.color},${activeFormat.color}dd)`,
            color: '#fff',
            border: 0,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <ArrowRight size={14} />}
          {loading ? 'Бодож байна...' : 'Асуух'}
        </button>
      </div>

      {/* Sample chips */}
      {!question && !loading && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {SAMPLE_QUESTIONS[format].slice(0, 3).map(q => (
            <button
              key={q}
              onClick={() => { setQuestion(q); ask(q); }}
              className="text-[11px] px-2.5 py-1 rounded-full transition-colors"
              style={{
                background: `${activeFormat.color}11`,
                border: `1px solid ${activeFormat.color}33`,
                color: activeFormat.color,
                cursor: 'pointer',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-[12px] text-red-300">{error}</span>
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
    } catch { /* ignore */ }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0c1322',
          border: '1px solid #1a2d4a',
          borderRadius: 14,
          maxWidth: 760, width: '100%', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #1a2d4a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileCode2 size={16} color="#a78bfa" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              Python код
            </h3>
            <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
              pandas + matplotlib
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 0, color: '#64748b', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {result.explanation && (
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid #1a2d4a',
            color: '#94a3b8',
            fontSize: 12.5,
            lineHeight: 1.6,
          }}>
            {result.explanation}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', padding: 16, position: 'relative' }}>
          <pre style={{
            margin: 0,
            background: '#060c18',
            border: '1px solid #1a3050',
            borderRadius: 10,
            padding: 16,
            fontSize: 12.5,
            fontFamily: 'JetBrains Mono, monospace',
            color: '#e2e8f0',
            lineHeight: 1.55,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>{result.python}</pre>
          <button
            onClick={copy}
            style={{
              position: 'absolute', top: 24, right: 24,
              background: copied ? '#22c55e' : '#1a3050',
              color: copied ? '#06120a' : '#e2e8f0',
              border: 0, borderRadius: 7, padding: '6px 12px',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Хуулсан' : 'Хуулах'}
          </button>
        </div>

        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #1a2d4a',
          fontSize: 11, color: '#64748b',
          background: 'rgba(167,139,250,0.04)',
          lineHeight: 1.7,
        }}>
          <div>
            <strong style={{ color: '#cbd5e1' }}>Суулгах:</strong>{' '}
            <code style={{ color: '#a78bfa' }}>pip install requests pandas matplotlib seaborn scikit-learn statsmodels</code>
          </div>
          <div style={{ marginTop: 4 }}>
            Дараа нь .py файлд хуулж <code style={{ color: '#a78bfa' }}>python script.py</code>. ML, прогноз, кластер бүх боломжтой.
          </div>
        </div>
      </div>
    </div>
  );
}
