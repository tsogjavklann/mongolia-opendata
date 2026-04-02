'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Bug } from 'lucide-react';

interface DebugPanelProps {
  payload?: unknown;
  raw?: unknown;
  parsed?: unknown;
  timing?: number;
}

export default function DebugPanel({ payload, raw, parsed, timing }: DebugPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'payload' | 'raw' | 'parsed'>('payload');

  const content = tab === 'payload' ? payload : tab === 'raw' ? raw : parsed;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
        style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Bug size={14} />
        <span className="font-mono text-xs">Debug Panel</span>
        {timing != null && (
          <span className="ml-auto tag tag-blue">{timing}ms</span>
        )}
      </button>

      {open && (
        <div style={{ background: '#060d1a', borderTop: '1px solid var(--border)' }}>
          <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
            {(['payload', 'raw', 'parsed'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-2 text-xs font-mono transition-colors"
                style={{
                  color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                  background: 'transparent',
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <pre
            className="p-4 text-xs overflow-auto"
            style={{ fontFamily: 'JetBrains Mono', color: '#94a3b8', maxHeight: 300, lineHeight: 1.6 }}
          >
            {JSON.stringify(content, null, 2) ?? 'null'}
          </pre>
        </div>
      )}
    </div>
  );
}
